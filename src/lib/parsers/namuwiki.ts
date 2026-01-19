/**
 * 나무위키 파서 모듈
 *
 * selca.kastden.org에 없는 아이돌 그룹을 나무위키에서 폴백 검색
 * CC BY-NC-SA 2.0 KR 라이선스, 비영리 용도 사용 가능
 *
 * @module namuwiki
 */

import { parse, HTMLElement } from 'node-html-parser'

const BASE_URL = 'https://namu.wiki'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const TIMEOUT_MS = 10000 // 10초 타임아웃
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
 */
async function fetchHtmlFromNamuwiki(url: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
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
    const html = await fetchHtmlFromNamuwiki(url)
    const root = parse(html)

    // 페이지 제목 확인
    const title = root.querySelector('title')
    const titleText = getText(title)

    // 404 또는 존재하지 않는 문서 체크
    if (titleText.includes('이 문서가 없습니다') || titleText.includes('Not Found')) {
      return null
    }

    // 멤버 섹션 존재 여부로 아이돌 그룹 판단
    const content = root.querySelector('.wiki-content') || root.querySelector('article')
    if (!content) {
      return null
    }

    const contentText = content.textContent || ''
    // "멤버" 또는 "구성원" 섹션이 있는지 확인
    const hasMemberSection = contentText.includes('멤버') || contentText.includes('구성원')
    if (!hasMemberSection) {
      return null
    }

    return {
      name: normalizedName,
      name_ko: normalizedName,
      memberCount: 0, // 실제 멤버 조회 시 업데이트
    }
  } catch (error) {
    console.error(`[Namuwiki Parser] Error searching group ${groupName}:`, error)
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
    return cached.data
  }

  try {
    const url = `${BASE_URL}/w/${encodeURIComponent(groupName.trim())}`
    const html = await fetchHtmlFromNamuwiki(url)
    const root = parse(html)

    // 페이지 제목에서 그룹명 추출
    const title = root.querySelector('title')
    const titleText = getText(title).replace(' - 나무위키', '').trim()

    // 404 체크
    if (titleText.includes('이 문서가 없습니다')) {
      groupMembersCache.set(cacheKey, { data: null, timestamp: Date.now() })
      return null
    }

    // 나무위키 본문 영역 찾기
    const content = root.querySelector('.wiki-content') || root.querySelector('article') || root

    const members: NamuwikiMember[] = []
    const seenNames = new Set<string>()

    // 방법 1: 테이블에서 멤버 추출
    const tables = content.querySelectorAll('table')
    for (const table of tables) {
      const rows = table.querySelectorAll('tr')
      for (const row of rows) {
        const cells = row.querySelectorAll('td, th')
        for (const cell of cells) {
          // 링크에서 이름 추출
          const links = cell.querySelectorAll('a')
          for (const link of links) {
            const href = link.getAttribute('href') || ''
            const text = getText(link)

            // 내부 링크이고 한글 이름인 경우
            if (href.startsWith('/w/') && text && /[가-힣]/.test(text)) {
              const koreanName = extractKoreanName(text)

              // 중복 방지 및 그룹명과 동일한 경우 스킵
              if (koreanName && !seenNames.has(koreanName) && koreanName !== groupName.trim()) {
                // 일반적인 K-pop 이름 길이 체크 (1-6글자)
                if (koreanName.length >= 1 && koreanName.length <= 6) {
                  seenNames.add(koreanName)

                  const englishName = extractEnglishName(text)
                  members.push({
                    name_ko: koreanName,
                    name_en: englishName,
                  })
                }
              }
            }
          }
        }
      }
    }

    // 방법 2: 멤버 섹션의 리스트에서 추출 (테이블이 없는 경우)
    if (members.length === 0) {
      const listItems = content.querySelectorAll('li')
      for (const item of listItems) {
        const link = item.querySelector('a')
        if (link) {
          const href = link.getAttribute('href') || ''
          const text = getText(link)

          if (href.startsWith('/w/') && text && /[가-힣]/.test(text)) {
            const koreanName = extractKoreanName(text)

            if (koreanName && !seenNames.has(koreanName) && koreanName !== groupName.trim()) {
              if (koreanName.length >= 1 && koreanName.length <= 6) {
                seenNames.add(koreanName)

                const englishName = extractEnglishName(text)
                members.push({
                  name_ko: koreanName,
                  name_en: englishName,
                })
              }
            }
          }
        }
      }
    }

    // 멤버가 없으면 그룹이 아닌 것으로 판단
    if (members.length === 0) {
      groupMembersCache.set(cacheKey, { data: null, timestamp: Date.now() })
      return null
    }

    // 영문 그룹명 추출 시도
    let groupNameEn: string | undefined
    const contentText = content.textContent || ''
    // 영문명 패턴: "IVE" 또는 "(IVE)" 형식
    const englishGroupMatch = contentText.match(/\(([A-Z][A-Za-z\s]+)\)/)
    if (englishGroupMatch) {
      groupNameEn = englishGroupMatch[1].trim()
    }

    const result: NamuwikiMembersResult = {
      groupName: titleText,
      groupNameKo: groupName.trim(),
      groupNameEn,
      members,
      source: 'namuwiki',
    }

    groupMembersCache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result
  } catch (error) {
    console.error(`[Namuwiki Parser] Error fetching members for ${groupName}:`, error)
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
