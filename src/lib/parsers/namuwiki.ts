/**
 * 나무위키 파서 모듈
 *
 * selca.kastden.org에 없는 아이돌 그룹을 나무위키에서 폴백 검색
 * CC BY-NC-SA 2.0 KR 라이선스, 비영리 용도 사용 가능
 *
 * @module namuwiki
 */

import { parse, HTMLElement } from 'node-html-parser'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Namuwiki Parser')

const BASE_URL = 'https://namu.wiki'
// Cloudflare Workers 프록시 URL (Vercel에서 직접 접근 시 403 차단됨)
const PROXY_URL = 'https://video-proxy.jh4clover.workers.dev/namuwiki'
const TIMEOUT_MS = 15000 // 15초 타임아웃 (SSR 렌더링에 시간이 더 걸릴 수 있음)
const CACHE_TTL_MS = 10 * 60 * 1000 // 10분 캐시

/**
 * 나무위키 그룹 정보
 */
export interface NamuwikiGroup {
  /** 그룹명 (검색어) */
  name: string
  /** 한글 그룹명 */
  name_ko: string
  /** 영문 그룹명 (있는 경우) */
  name_en?: string
  /** 멤버 수 */
  memberCount: number
}

/**
 * 나무위키 멤버 정보
 */
export interface NamuwikiMember {
  /** 한글 이름 */
  name_ko: string
  /** 영문 이름 (있는 경우) */
  name_en?: string
  /** 포지션 (있는 경우) */
  position?: string
}

/**
 * 나무위키 멤버 조회 결과
 */
export interface NamuwikiMembersResult {
  /** 그룹명 */
  groupName: string
  /** 한글 그룹명 */
  groupNameKo: string
  /** 영문 그룹명 (있는 경우) */
  groupNameEn?: string
  /** 멤버 목록 */
  members: NamuwikiMember[]
  /** 데이터 소스 */
  source: 'namuwiki'
}

/**
 * 캐시 엔트리 타입
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
}

// 인메모리 캐시
const groupMembersCache = new Map<string, CacheEntry<NamuwikiMembersResult | null>>()

/**
 * HTML 텍스트 추출 유틸리티
 */
function getText(element: HTMLElement | null): string {
  return element?.textContent?.trim() ?? ''
}

/**
 * 나무위키에서 HTML 페이지 가져오기
 * Cloudflare Workers 프록시를 통해 요청 (Vercel에서 직접 접근 시 403 차단됨)
 */
async function fetchHtmlFromNamuwiki(url: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    // Cloudflare Workers 프록시를 통해 요청
    const proxyUrl = `${PROXY_URL}?url=${encodeURIComponent(url)}`
    logger.debug(`Fetching via proxy: ${proxyUrl}`)

    const response = await fetch(proxyUrl, {
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.text()
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * 텍스트에서 영문 이름 추출 (괄호 안 또는 별도 패턴)
 */
function extractEnglishName(text: string): string | undefined {
  // 괄호 안의 영문 이름 추출: "설윤 (Sullyoon)" or "Sullyoon"
  const parenMatch = text.match(/\(([A-Za-z][A-Za-z\s]*)\)/)
  if (parenMatch) {
    return parenMatch[1].trim()
  }

  // 순수 영문 이름인 경우
  if (/^[A-Za-z\s]+$/.test(text.trim())) {
    return text.trim()
  }

  return undefined
}

/**
 * 한글 이름 추출 (영문/특수문자 제거)
 */
function extractKoreanName(text: string): string {
  // 괄호 및 내용 제거
  let cleaned = text.replace(/\([^)]*\)/g, '').trim()
  // 한글만 추출
  const koreanMatch = cleaned.match(/[가-힣]+/)
  return koreanMatch ? koreanMatch[0] : cleaned
}

/**
 * 나무위키에서 그룹 검색 (존재 여부 확인)
 */
export async function searchGroupFromNamuwiki(groupName: string): Promise<NamuwikiGroup | null> {
  const normalizedName = groupName.trim()
  if (!normalizedName) {
    return null
  }

  try {
    const url = `${BASE_URL}/w/${encodeURIComponent(normalizedName)}`
    logger.debug(`Fetching: ${url}`)
    const html = await fetchHtmlFromNamuwiki(url)
    logger.debug(`HTML length: ${html.length}`)

    const root = parse(html)

    // 페이지 제목 확인
    const title = root.querySelector('title')
    const titleText = getText(title)
    logger.debug(`Title: ${titleText}`)

    // 404 또는 존재하지 않는 문서 체크
    if (titleText.includes('이 문서가 없습니다') || titleText.includes('Not Found')) {
      logger.debug(`Document not found`)
      return null
    }

    // 나무위키 본문 영역 찾기 (Googlebot 응답은 wiki-paragraph, wiki-table-wrap 등을 사용)
    // #app 내부에서 wiki 클래스들을 포함하는 영역을 찾음
    const content =
      root.querySelector('.wiki-content') ||
      root.querySelector('article') ||
      root.querySelector('#app') ||
      root

    // "멤버" 또는 "구성원" 키워드로 아이돌 그룹 판단
    const contentText = content.textContent || ''
    const hasMemberSection = contentText.includes('멤버') || contentText.includes('구성원')
    logger.debug(`Has member section: ${hasMemberSection}`)

    if (!hasMemberSection) {
      return null
    }

    return {
      name: normalizedName,
      name_ko: normalizedName,
      memberCount: 0, // 실제 멤버 조회 시 업데이트
    }
  } catch (error) {
    logger.error(`Error searching group ${groupName}:`, error)
    return null
  }
}

/**
 * 나무위키에서 그룹 멤버 목록 조회
 */
export async function getGroupMembersFromNamuwiki(
  groupName: string
): Promise<NamuwikiMembersResult | null> {
  const cacheKey = groupName.toLowerCase().trim()

  // 캐시 확인
  const cached = groupMembersCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    logger.debug(`Cache hit for: ${groupName}`)
    return cached.data
  }

  try {
    const url = `${BASE_URL}/w/${encodeURIComponent(groupName.trim())}`
    logger.debug(`Fetching members for: ${url}`)
    const html = await fetchHtmlFromNamuwiki(url)
    logger.debug(`Members HTML length: ${html.length}`)

    const root = parse(html)

    // 페이지 제목에서 그룹명 추출
    const title = root.querySelector('title')
    const titleText = getText(title).replace(' - 나무위키', '').trim()
    logger.debug(`Members page title: ${titleText}`)

    // 404 체크
    if (titleText.includes('이 문서가 없습니다')) {
      groupMembersCache.set(cacheKey, { data: null, timestamp: Date.now() })
      return null
    }

    const members: NamuwikiMember[] = []
    const seenNames = new Set<string>()

    // 제외할 일반 단어들 (아이돌 이름이 아닌 것들)
    const excludeWords = new Set([
      // 그룹/아이돌 관련
      '걸그룹', '보이그룹', '아이돌', '멤버', '소속사', '데뷔', '활동', '음반', '응원법', '굿즈',
      '팬덤', '유튜브', '갤러리', '역사', '여담', '토론', '직캠', '음악', '방송', '프로', '시상', '수상',
      '응원봉', '콘서트', '팬미팅', '공연', '광고', '노래방', '화보', '키',
      // 포지션
      '댄스', '보컬', '랩', '래퍼', '메탈', '힙합', '연습생', '리더', '메인', '서브', '리드', '롤모델',
      // 국가/지역
      '대한민국', '한국', '한국인', '일본', '중국', '태국', '홍대', '삼일절',
      // 일반 단어
      '편집', '이동', '토론', '검색', '분류', '버블', '팝업', '시구', '년', '월', '일',
      '올해의', '세상은', '불빛을', '기뻐', '패밀리', '록', '군사', '건물', '승리', '더',
      '한문철의', '멜론차트', '미디어', '인조',
      // 기업/미디어
      '소니', '뉴시스', '한화', '키움', '타이거즈', '쏘스뮤직', '입점',
      // 그룹명 자체도 제외
      groupName.trim(),
    ])

    // Googlebot 응답에서 wiki-link-internal 클래스를 가진 모든 링크 찾기
    // 멤버 이름은 보통 /w/멤버이름 형식의 내부 링크로 표시됨
    const allLinks = root.querySelectorAll('a.wiki-link-internal, a[href^="/w/"]')
    logger.debug(`Found ${allLinks.length} wiki links`)

    for (const link of allLinks) {
      const href = link.getAttribute('href') || ''
      const titleAttr = link.getAttribute('title') || ''
      const text = getText(link)

      // /w/ 경로의 내부 링크만 처리
      if (!href.startsWith('/w/')) continue

      // 한글이 포함된 텍스트만 처리
      if (!text || !/[가-힣]/.test(text)) continue

      const koreanName = extractKoreanName(titleAttr || text)

      // 필터링 조건
      if (!koreanName) continue
      if (seenNames.has(koreanName)) continue
      if (excludeWords.has(koreanName)) continue
      if (koreanName.length < 1 || koreanName.length > 4) continue // K-pop 이름은 보통 1-4글자
      // 분류, 슬래시 경로, 년도 등 제외
      if (href.includes('분류:') || href.includes('/') && !href.startsWith('/w/')) continue
      // 숫자로만 이루어진 것 제외
      if (/^\d+$/.test(koreanName)) continue

      seenNames.add(koreanName)

      // title 속성에서 영어 이름 추출 시도
      const englishName = extractEnglishName(titleAttr || text)
      members.push({
        name_ko: koreanName,
        name_en: englishName,
      })
    }

    logger.debug(`Extracted ${members.length} potential members:`, members.map(m => m.name_ko))

    // 이름 빈도 분석: 여러 번 언급된 이름이 실제 멤버일 가능성이 높음
    // K-pop 문서에서 멤버는 프로필 테이블, 포지션 테이블, 갤러리 등에서 반복 언급됨
    const nameFrequency = new Map<string, number>()
    for (const link of allLinks) {
      const titleAttr = link.getAttribute('title') || ''
      const text = getText(link)
      const name = extractKoreanName(titleAttr || text)
      // K-pop 이름은 1-3글자가 대부분 (옐, 지수, 리이나 등)
      if (name && name.length >= 1 && name.length <= 3 && /^[가-힣]+$/.test(name)) {
        if (!excludeWords.has(name)) {
          nameFrequency.set(name, (nameFrequency.get(name) || 0) + 1)
        }
      }
    }

    logger.debug(`Name frequency:`, Object.fromEntries(nameFrequency))

    // 빈도가 높은 이름 (3회 이상 언급) + 2-3글자 한글 이름만 선택
    const frequentNames = Array.from(nameFrequency.entries())
      .filter(([name, count]) => count >= 3) // 최소 3번 이상 언급
      .map(([name]) => name)

    logger.debug(`Frequent names (3+ mentions):`, frequentNames)

    // 빈도 기반 필터링된 멤버만 유지
    if (frequentNames.length >= 2 && frequentNames.length <= 15) {
      const filteredMembers = members.filter(m => frequentNames.includes(m.name_ko))
      logger.debug(`Filtered by frequency: ${filteredMembers.length} members:`, filteredMembers.map(m => m.name_ko))

      if (filteredMembers.length >= 2) {
        members.length = 0
        members.push(...filteredMembers)
      }
    }

    // 여전히 너무 많으면 엄격한 필터 적용
    if (members.length > 15) {
      logger.debug(`Still too many (${members.length}), applying strict filter`)
      const filtered = members.filter(m => {
        const len = m.name_ko.length
        return len >= 2 && len <= 3 && /^[가-힣]+$/.test(m.name_ko)
      })
      members.length = 0
      members.push(...filtered)
    }

    // 멤버가 없거나 너무 적으면 그룹이 아닌 것으로 판단
    if (members.length < 2) {
      logger.debug(`Too few members (${members.length}), likely not an idol group`)
      groupMembersCache.set(cacheKey, { data: null, timestamp: Date.now() })
      return null
    }

    // 영문 그룹명 추출 시도 (og:title 메타 태그에서)
    let groupNameEn: string | undefined
    const ogTitle = root.querySelector('meta[property="og:title"]')
    if (ogTitle) {
      const ogContent = ogTitle.getAttribute('content') || ''
      // 영문명이면 그대로 사용
      if (/^[A-Za-z0-9\-\s]+$/.test(ogContent)) {
        groupNameEn = ogContent
      }
    }

    const result: NamuwikiMembersResult = {
      groupName: titleText,
      groupNameKo: groupName.trim(),
      groupNameEn,
      members,
      source: 'namuwiki',
    }

    logger.debug(`Success: ${groupName} with ${members.length} members`)
    groupMembersCache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result
  } catch (error) {
    logger.error(`Error fetching members for ${groupName}:`, error)
    groupMembersCache.set(cacheKey, { data: null, timestamp: Date.now() })
    return null
  }
}

/**
 * 캐시 초기화 (테스트용)
 */
export function clearNamuwikiCache(): void {
  groupMembersCache.clear()
}
