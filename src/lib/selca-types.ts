/**
 * selca.kastden.org 공통 타입 정의
 *
 * selca 파서 모듈 및 관련 API에서 사용하는 타입을 한 곳에서 관리
 * 기존 API 인터페이스와의 호환성 유지
 */

/**
 * K-pop 그룹 정보
 * selca.kastden.org에서 파싱한 그룹 데이터
 */
export interface KpopGroup {
  /** 그룹 slug (URL 경로에 사용, 예: "ive", "aespa") */
  id: string
  /** 영문 그룹명 (예: "IVE", "aespa") */
  name: string
  /** 한글 그룹명 (예: "아이브", "에스파") */
  name_original: string
  /** 그룹 멤버 수 (검색 결과에서 표시용) */
  memberCount: number
}

/**
 * K-pop 멤버 기본 정보
 * getGroupMembers에서 반환되는 멤버 데이터
 */
export interface KpopMember {
  /** 멤버 slug (URL 경로에 사용, 예: "ive_gaeul") */
  id: string
  /** 영문 활동명 (예: "Gaeul") */
  name: string
  /** 한글 이름 또는 영문명 폴백 */
  name_original: string
  /** 한글 활동명 (예: "가을"), 없을 수 있음 */
  name_stage_ko?: string
  /** Selca owner 페이지 존재 여부 (false면 콘텐츠 없음) */
  hasSelcaOwner?: boolean
}

/**
 * K-pop 멤버 정보 (그룹 포함)
 * searchMembers에서 반환되는 멤버 데이터
 */
export interface KpopMemberWithGroup {
  /** 멤버 slug (URL 경로에 사용, 예: "ive_gaeul") */
  id: string
  /** 영문 활동명 (예: "Gaeul") */
  name: string
  /** 한글 이름 또는 영문명 폴백 */
  name_original: string
  /** 한글 활동명 (예: "가을"), 없을 수 있음 */
  name_stage_ko?: string
  /** 소속 그룹 정보 (솔로/미확인 시 null) */
  group: {
    id: string
    name: string
    name_original: string
  } | null
}

/**
 * selca.kastden.org 검색 결과 아이템
 * 미디어(이미지/영상) 항목 정보
 */
export interface SelcaSearchResult {
  /** 미디어 페이지 URL (예: https://selca.kastden.org/media/123/) */
  url: string
  /** 미디어 제목 (캡션 또는 아이돌 이름 기반 폴백) */
  title: string
  /** 썸네일 이미지 URL */
  thumbnailUrl: string
  /** 작성자/아이돌 이름 */
  author: string
}

/**
 * selca 검색 API 응답 형식
 *
 * @remarks
 * 페이지네이션은 max_time_id 기반:
 * 1. 첫 요청: maxTimeId 없이 호출
 * 2. 응답의 nextMaxTimeId를 다음 요청에 maxTimeId로 전달
 * 3. hasNextPage=false이면 마지막 페이지
 */
export interface SelcaSearchResponse {
  /** 검색 결과 목록 */
  results: SelcaSearchResult[]
  /** 다음 페이지 존재 여부 */
  hasNextPage: boolean
  /** 현재 페이지 번호 */
  currentPage: number
  /** 다음 페이지 요청에 사용할 max_time_id (없으면 마지막 페이지) */
  nextMaxTimeId?: string
}

/**
 * 캐시 엔트리 타입
 * TTL 기반 인메모리 캐시에서 사용
 *
 * @template T 캐시할 데이터 타입
 */
export interface CacheEntry<T> {
  /** 캐시된 데이터 */
  data: T
  /** 캐시 생성 시간 (Date.now() 값) */
  timestamp: number
}

/**
 * 그룹 멤버 조회 결과 타입
 * getGroupMembers 함수 반환값
 */
export interface GroupMembersResult {
  /** 영문 그룹명 */
  groupName: string
  /** 한글 그룹명 */
  groupNameOriginal: string
  /** 멤버 목록 */
  members: KpopMember[]
  /** Selca group 페이지 존재 여부 (false면 그룹 콘텐츠 없음) */
  hasSelcaGroup?: boolean
  /** Selca group slug (예: "nmixx") */
  selcaGroupSlug?: string
}
