import { useState, useCallback, useEffect, useMemo } from 'react';
import type { 
  Bias, 
  Group, 
  Platform, 
  EnrichedResult, 
  PlatformResults, 
  YouTubeResult, 
  TwitterResult, 
  HeyeResult, 
  KgirlsResult, 
  SelcaResult,
  InstagramResult,
  TikTokResult,
  SearchCachePlatform
} from '@/types/index';
import { 
  getSearchCache, 
  updatePlatformCache, 
  clearExpiredCache, 
  type CachedPlatformResult 
} from '@/lib/searchCache';
import { isVideoUrl, getProxiedVideoUrl, getProxiedImageUrl } from '@/lib/proxy';

const RESULTS_PER_PLATFORM = 6;
const API_FETCH_COUNT = 20;

const IDOL_NAME_MAP: Record<string, string> = {
  "카리나": "karina", "윈터": "winter", "지젤": "giselle", "닝닝": "ningning",
  "유진": "yujin", "원영": "wonyoung", "가을": "gaeul", "리즈": "liz", "레이": "rei", "이서": "leeseo",
  "민지": "minji", "하니": "hanni", "다니엘": "danielle", "해린": "haerin", "혜인": "hyein",
  "지수": "jisoo", "제니": "jennie", "로제": "rose", "리사": "lisa",
  "미연": "miyeon", "민니": "minnie", "소연": "soyeon", "우기": "yuqi", "슈화": "shuhua",
  "나연": "nayeon", "정연": "jeongyeon", "모모": "momo", "사나": "sana", "지효": "jihyo", "미나": "mina", "다현": "dahyun", "채영": "chaeyoung", "쯔위": "tzuyu",
  "아이린": "irene", "슬기": "seulgi", "웬디": "wendy", "조이": "joy", "예리": "yeri",
};

function normalizeIdolName(query: string): string {
  const normalized = query.trim().toLowerCase();
  return IDOL_NAME_MAP[normalized] || normalized;
}

interface UseSearchLogicOptions {
  query: string;
  savedUrls: string[];
  biases: Bias[];
  groups: Group[];
  enabledPlatforms: Set<Platform>;
}

interface SearchResultBase {
  results: EnrichedResult[];
  hasMore: boolean;
  nextPageToken?: string;
  nextCursor?: string;
  nextMaxTimeId?: string;
}

export function useSearchLogic({ query, savedUrls, biases, groups, enabledPlatforms }: UseSearchLogicOptions) {
  const [platformResults, setPlatformResults] = useState<Map<Platform, PlatformResults>>(new Map());
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [cachedResults, setCachedResults] = useState<Map<Platform, CachedPlatformResult>>(new Map());
  const [showCached, setShowCached] = useState<Map<Platform, boolean>>(new Map());

  const KOREAN_SURNAMES = useMemo(() => new Set([
    "김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오", "서", "신", "권", "황", "안", "송", "전", "홍", "유", "고", "문", "양", "손", "배", "백", "허", "노", "심", "하", "주", "구", "곽", "성", "차", "우", "민", "류", "나", "진", "지", "엄", "채", "원", "천", "방", "공", "현", "함", "변", "염", "여", "추", "도", "소", "석", "선", "설", "마", "길", "연", "위", "표", "명", "기", "반", "피", "왕", "금", "옥", "육", "인", "맹", "남", "탁", "국", "어", "경", "은", "편", "제", "빈", "봉", "사", "부",
  ]), []);

  const removeKoreanSurname = useCallback((name: string): string => {
    const isThreeCharKorean = /^[가-힣]{3}$/.test(name);
    return (isThreeCharKorean && KOREAN_SURNAMES.has(name.charAt(0))) ? name.slice(1) : name;
  }, [KOREAN_SURNAMES]);

  const checkIfSaved = useCallback((url: string): boolean => {
    const normalize = (u: string) => {
      try {
        const urlObj = new URL(u);
        let host = urlObj.hostname.replace(/^www\./, '');
        let path = urlObj.pathname.replace(/\/$/, '');
        let search = urlObj.search;

        if (host === 'youtube.com' || host === 'youtu.be') {
          const v = urlObj.searchParams.get('v');
          if (v) return `youtube:${v}`;
          const shortsMatch = path.match(/^\/shorts\/([^/]+)/);
          if (shortsMatch) return `youtube:${shortsMatch[1]}`;
          if (host === 'youtu.be') return `youtube:${path.replace(/^\//, '')}`;
        }

        if (host === 'twitter.com' || host === 'x.com') {
          const statusMatch = path.match(/\/status\/(\d+)/);
          if (statusMatch) return `twitter:${statusMatch[1]}`;
        }

        return `${host}${path}${search}`.replace(/\/$/, "");
      } catch {
        return u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
      }
    };

    const normalizedUrl = normalize(url);
    return (savedUrls || []).some((savedUrl) => normalize(savedUrl) === normalizedUrl);
  }, [savedUrls]);

  const toggleShowCached = useCallback((platform: Platform) => {
    setShowCached((prev) => {
      const next = new Map(prev);
      next.set(platform, !prev.get(platform));
      return next;
    });
  }, []);

  const searchYouTube = async (q: string, pageToken?: string): Promise<SearchResultBase> => {
    const params = new URLSearchParams({ q, max: String(API_FETCH_COUNT), order: "relevance", period: "month" });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await fetch(`/api/youtube/search?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "YouTube 검색 실패");
    return {
      results: (data.results as YouTubeResult[]).map(item => ({
        url: `https://www.youtube.com/watch?v=${item.videoId}`,
        title: item.title, thumbnailUrl: item.thumbnailUrl, author: item.channelTitle,
        platform: "youtube", publishedAt: item.publishedAt, isSaved: checkIfSaved(`https://www.youtube.com/watch?v=${item.videoId}`), isSaving: false
      })),
      hasMore: data.hasMore ?? false, nextPageToken: data.nextPageToken
    };
  };

  const searchTwitter = async (q: string, cursor?: string): Promise<SearchResultBase> => {
    const cleanQuery = q.startsWith("#") ? q.slice(1) : q;
    const params = new URLSearchParams({ q: cleanQuery, count: String(API_FETCH_COUNT) });
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/search/twitter?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Twitter 검색 실패");
    const results: EnrichedResult[] = await Promise.all((data.results as TwitterResult[]).map(async item => {
      const isSaved = checkIfSaved(item.link);
      if (item.thumbnailUrl) return { url: item.link, title: item.title, thumbnailUrl: item.thumbnailUrl, author: item.authorName || "", platform: "twitter", isSaved, isSaving: false };
      try {
        const mres = await fetch("/api/metadata", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: item.link }) });
        if (mres.ok) {
          const m = await mres.json();
          return { url: item.link, title: m.title || item.title, thumbnailUrl: m.thumbnailUrl || null, author: m.authorName || "", platform: "twitter", isSaved, isSaving: false };
        }
      } catch {}
      return { url: item.link, title: item.title, thumbnailUrl: null, author: "", platform: "twitter", isSaved, isSaving: false };
    }));
    return { results, hasMore: data.hasMore ?? false, nextCursor: data.nextCursor };
  };

  const searchCommunity = async (platform: 'heye' | 'kgirls' | 'kgirls-issue', q: string, page: number = 1, offset: number = 0): Promise<SearchResultBase> => {
    const board = platform === 'heye' ? '' : platform === 'kgirls' ? 'mgall' : 'issue';
    const api = platform === 'heye' ? '/api/search/heye' : '/api/search/kgirls';
    const params = new URLSearchParams({ q, page: String(page), limit: String(API_FETCH_COUNT), offset: String(offset) });
    if (board) params.set('board', board);
    const res = await fetch(`${api}?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `${platform} 검색 실패`);
    return {
      results: (data.results as (HeyeResult | KgirlsResult)[]).map(item => ({
        url: item.url, title: item.title, author: item.author, platform: platform as Platform, isSaved: checkIfSaved(item.url), isSaving: false,
        thumbnailUrl: item.thumbnailUrl ? (isVideoUrl(item.thumbnailUrl) ? getProxiedVideoUrl(item.thumbnailUrl) : getProxiedImageUrl(item.thumbnailUrl)) : null,
      })),
      hasMore: data.hasMore ?? false
    };
  };

  const searchSelca = async (q: string, page: number = 1, maxTimeId?: string): Promise<SearchResultBase> => {
    const nq = q.trim().toLowerCase();
    // removeKoreanSurname 적용한 값으로도 비교 (드롭다운 선택 시 "홍은채" → "은채"로 변환됨)
    const mb = biases.find(b => {
      const nameMatch = b.name.toLowerCase() === nq || b.name_en?.toLowerCase() === nq || b.name_ko?.toLowerCase() === nq;
      if (nameMatch) return true;
      // 성 제거된 이름으로도 비교
      const nameKoWithoutSurname = b.name_ko ? removeKoreanSurname(b.name_ko).toLowerCase() : null;
      return nameKoWithoutSurname === nq;
    });
    const mg = groups.find(g => g.name.toLowerCase() === nq || g.name_en?.toLowerCase() === nq || g.name_ko?.toLowerCase() === nq);
    let qtu = q, st: 'member' | 'group' = 'member';
    if (mb) { if (mb.selca_slug === null) throw new Error('Selca 콘텐츠 없음'); if (mb.selca_slug) qtu = mb.selca_slug; }
    else if (mg) { if (mg.selca_slug === null) throw new Error('Selca 콘텐츠 없음'); if (mg.selca_slug) { qtu = mg.selca_slug; st = 'group'; } }
    else { const fb = normalizeIdolName(q); if (fb !== q) qtu = fb; }
    const params = new URLSearchParams({ query: qtu, page: String(page), limit: String(API_FETCH_COUNT), type: st });
    if (maxTimeId) params.set('maxTimeId', maxTimeId);
    const res = await fetch(`/api/search/selca?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Selca 검색 실패");
    return {
      results: (data.results as SelcaResult[]).map(item => ({ url: item.url, title: item.title, thumbnailUrl: item.thumbnailUrl, author: item.author, platform: "selca", isSaved: checkIfSaved(item.url), isSaving: false })),
      hasMore: data.hasNextPage ?? false, nextMaxTimeId: data.nextMaxTimeId
    };
  };

  const searchInstagram = async (q: string): Promise<SearchResultBase> => {
    const params = new URLSearchParams({ q, type: 'hashtag', limit: String(API_FETCH_COUNT) });
    const res = await fetch(`/api/search/instagram?${params}`);
    const data = await res.json();
    if (data.notConfigured) throw new Error("Instagram 미설정");
    if (!res.ok) throw new Error(data.error || "Instagram 검색 실패");
    return {
      results: ((data.results || []) as InstagramResult[]).map(item => ({ url: item.url, title: item.title, thumbnailUrl: item.thumbnailUrl, author: item.author, platform: "instagram", isSaved: checkIfSaved(item.url), isSaving: false, media: item.media })),
      hasMore: data.hasMore || false
    };
  };

  const searchTikTok = async (q: string): Promise<SearchResultBase> => {
    const params = new URLSearchParams({ q, limit: String(API_FETCH_COUNT) });
    const res = await fetch(`/api/search/tiktok?${params}`);
    const data = await res.json();
    if (data.notConfigured) throw new Error("TikTok 미설정");
    if (!res.ok) throw new Error(data.error || "TikTok 검색 실패");
    return {
      results: ((data.results || []) as TikTokResult[]).map(item => ({ url: item.url, title: item.title, thumbnailUrl: item.thumbnailUrl, author: item.author, platform: "tiktok", isSaved: checkIfSaved(item.url), isSaving: false, media: item.media })),
      hasMore: data.hasMore || false
    };
  };

  const processPlatformSearch = async (platform: Platform, cached: CachedPlatformResult | undefined, searchFn: () => Promise<SearchResultBase>) => {
    const dIdx = cached?.displayedIndex ?? 0;
    const cRes = cached?.results ?? [];
    if (cRes.length - dIdx >= RESULTS_PER_PLATFORM) {
      const toDisplay = cRes.slice(dIdx, dIdx + RESULTS_PER_PLATFORM);
      if (dIdx > 0) setCachedResults(prev => new Map(prev).set(platform, { ...cached!, results: cRes.slice(0, dIdx) }));
      setPlatformResults(prev => new Map(prev).set(platform, { platform, results: toDisplay, hasMore: cRes.length > dIdx + RESULTS_PER_PLATFORM || !!cached?.hasMore, isLoading: false, isLoadingMore: false, error: null, currentPage: cached?.currentPage ?? 1, currentOffset: cached?.currentOffset ?? 0, nextPageToken: cached?.nextPageToken, nextCursor: cached?.nextCursor, nextMaxTimeId: cached?.nextMaxTimeId }));
      void updatePlatformCache(query, platform as SearchCachePlatform, { ...cached!, displayedIndex: dIdx + RESULTS_PER_PLATFORM });
      return;
    }
    try {
      const { results: apiRes, hasMore, nextPageToken, nextCursor, nextMaxTimeId } = await searchFn();
      const fromCache = cRes.slice(dIdx);
      const urls = new Set(cRes.map(r => r.url));
      const filteredApi = apiRes.filter(r => !urls.has(r.url));
      const combined = [...fromCache, ...filteredApi];
      const toDisplay = combined.slice(0, RESULTS_PER_PLATFORM);
      const toSave = combined.slice(RESULTS_PER_PLATFORM);
      if (dIdx > 0) setCachedResults(prev => new Map(prev).set(platform, { results: cRes.slice(0, dIdx), displayedIndex: dIdx, currentPage: cached?.currentPage ?? 1, currentOffset: cached?.currentOffset ?? 0, hasMore: false, nextPageToken: cached?.nextPageToken, nextCursor: cached?.nextCursor, nextMaxTimeId: cached?.nextMaxTimeId }));
      setPlatformResults(prev => new Map(prev).set(platform, { platform, results: toDisplay, hasMore: hasMore || toSave.length > 0, isLoading: false, isLoadingMore: false, error: null, currentPage: 1, currentOffset: 0, nextPageToken, nextCursor, nextMaxTimeId }));
      void updatePlatformCache(query, platform as SearchCachePlatform, { results: [...cRes.slice(0, dIdx), ...toDisplay, ...toSave], displayedIndex: dIdx + toDisplay.length, nextPageToken, nextCursor, nextMaxTimeId, currentPage: 1, currentOffset: 0, hasMore });
    } catch (e: unknown) {
      setPlatformResults(prev => new Map(prev).set(platform, { platform, results: [], hasMore: false, isLoading: false, isLoadingMore: false, error: e instanceof Error ? e.message : "검색 실패", currentPage: 1, currentOffset: 0 }));
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setSelectedUrls(new Set());
    const cached = await getSearchCache(query);
    setCachedResults(new Map());
    const init = new Map<Platform, PlatformResults>();
    for (const p of enabledPlatforms) init.set(p, { platform: p, results: [], hasMore: false, isLoading: true, isLoadingMore: false, error: null, currentPage: 1, currentOffset: 0 });
    setPlatformResults(init);
    const promises: Promise<void>[] = [];
    if (enabledPlatforms.has("youtube")) promises.push(processPlatformSearch("youtube", cached?.platforms.youtube, () => searchYouTube(query, cached?.platforms.youtube?.nextPageToken)));
    if (enabledPlatforms.has("twitter")) promises.push(processPlatformSearch("twitter", cached?.platforms.twitter, () => searchTwitter(query, cached?.platforms.twitter?.nextCursor)));
    if (enabledPlatforms.has("heye")) promises.push(processPlatformSearch("heye", cached?.platforms.heye, () => searchCommunity('heye', query, cached?.platforms.heye?.currentPage ?? 1, cached?.platforms.heye?.currentOffset ?? 0)));
    if (enabledPlatforms.has("kgirls")) promises.push(processPlatformSearch("kgirls", cached?.platforms.kgirls, () => searchCommunity('kgirls', query, cached?.platforms.kgirls?.currentPage ?? 1, cached?.platforms.kgirls?.currentOffset ?? 0)));
    if (enabledPlatforms.has("kgirls-issue")) promises.push(processPlatformSearch("kgirls-issue", cached?.platforms["kgirls-issue"], () => searchCommunity('kgirls-issue', query, cached?.platforms["kgirls-issue"]?.currentPage ?? 1, cached?.platforms["kgirls-issue"]?.currentOffset ?? 0)));
    if (enabledPlatforms.has("selca")) promises.push(processPlatformSearch("selca", cached?.platforms.selca, () => searchSelca(query, cached?.platforms.selca?.currentPage ?? 1, cached?.platforms.selca?.nextMaxTimeId)));
    if (enabledPlatforms.has("instagram")) promises.push(processPlatformSearch("instagram", cached?.platforms.instagram, () => searchInstagram(query)));
    if (enabledPlatforms.has("tiktok")) promises.push(processPlatformSearch("tiktok", cached?.platforms.tiktok, () => searchTikTok(query)));
    await Promise.allSettled(promises);
    setShowCached(new Map());
    setIsSearching(false);
  };

  const handleLoadMore = async (p: Platform) => {
    const cur = platformResults.get(p);
    if (!cur || cur.isLoadingMore || !cur.hasMore) return;
    setPlatformResults(prev => new Map(prev).set(p, { ...cur, isLoadingMore: true }));
    try {
      let res: SearchResultBase;
      const dCount = cur.results.length;
      if (p === "youtube") {
        const c = (await getSearchCache(query))?.platforms.youtube;
        const dUrls = new Set(cur.results.map(r => r.url));
        const unshown = (c?.results ?? []).filter(r => !dUrls.has(r.url));
        if (unshown.length >= RESULTS_PER_PLATFORM) {
          res = { results: unshown.slice(0, RESULTS_PER_PLATFORM).map(r => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })), hasMore: unshown.length > RESULTS_PER_PLATFORM || !!c?.hasMore };
          void updatePlatformCache(query, "youtube", { ...c!, displayedIndex: dCount + RESULTS_PER_PLATFORM });
        } else {
          const api = await searchYouTube(query, c?.nextPageToken || cur.nextPageToken);
          const filtered = api.results.filter(r => !dUrls.has(r.url));
          const needed = RESULTS_PER_PLATFORM - unshown.length;
          res = { results: [...unshown.map(r => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })), ...filtered.slice(0, needed)], hasMore: filtered.length > needed || api.hasMore, nextPageToken: api.nextPageToken };
          void updatePlatformCache(query, "youtube", { results: [...(c?.results ?? []), ...api.results], displayedIndex: dCount + unshown.length + Math.min(filtered.length, needed), currentPage: 1, currentOffset: 0, hasMore: api.hasMore, nextPageToken: api.nextPageToken });
        }
      } else if (p === "twitter") {
        const c = (await getSearchCache(query))?.platforms.twitter;
        const dUrls = new Set(cur.results.map(r => r.url));
        const unshown = (c?.results ?? []).filter(r => !dUrls.has(r.url));
        if (unshown.length >= RESULTS_PER_PLATFORM) {
          res = { results: unshown.slice(0, RESULTS_PER_PLATFORM).map(r => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })), hasMore: unshown.length > RESULTS_PER_PLATFORM || !!c?.hasMore };
          void updatePlatformCache(query, "twitter", { ...c!, displayedIndex: dCount + RESULTS_PER_PLATFORM });
        } else {
          const api = await searchTwitter(query, c?.nextCursor || cur.nextCursor);
          const filtered = api.results.filter(r => !dUrls.has(r.url));
          const needed = RESULTS_PER_PLATFORM - unshown.length;
          res = { results: [...unshown.map(r => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })), ...filtered.slice(0, needed)], hasMore: filtered.length > needed || api.hasMore, nextCursor: api.nextCursor };
          void updatePlatformCache(query, "twitter", { results: [...(c?.results ?? []), ...api.results], displayedIndex: dCount + unshown.length + Math.min(filtered.length, needed), currentPage: 1, currentOffset: 0, hasMore: api.hasMore, nextCursor: api.nextCursor });
        }
      } else if (p === "heye" || p === "kgirls" || p === "kgirls-issue") {
        const c = (await getSearchCache(query))?.platforms[p];
        const dUrls = new Set(cur.results.map(r => r.url));
        const unshown = (c?.results ?? []).filter(r => !dUrls.has(r.url));
        if (unshown.length >= RESULTS_PER_PLATFORM) {
          res = { results: unshown.slice(0, RESULTS_PER_PLATFORM).map(r => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })), hasMore: unshown.length > RESULTS_PER_PLATFORM || !!c?.hasMore };
          void updatePlatformCache(query, p as SearchCachePlatform, { ...c!, displayedIndex: dCount + RESULTS_PER_PLATFORM });
        } else {
          const nextP = (c?.currentPage ?? cur.currentPage) + 1;
          const api = await searchCommunity(p, query, nextP, 0);
          const filtered = api.results.filter(r => !dUrls.has(r.url));
          const needed = RESULTS_PER_PLATFORM - unshown.length;
          res = { results: [...unshown.map(r => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })), ...filtered.slice(0, needed)], hasMore: filtered.length > needed || api.hasMore };
          void updatePlatformCache(query, p as SearchCachePlatform, { results: [...(c?.results ?? []), ...api.results], displayedIndex: dCount + unshown.length + Math.min(filtered.length, needed), currentPage: nextP, currentOffset: 0, hasMore: api.hasMore });
        }
      } else if (p === "selca") {
        const c = (await getSearchCache(query))?.platforms.selca;
        const dUrls = new Set(cur.results.map(r => r.url));
        const unshown = (c?.results ?? []).filter(r => !dUrls.has(r.url));
        if (unshown.length >= RESULTS_PER_PLATFORM) {
          res = { results: unshown.slice(0, RESULTS_PER_PLATFORM).map(r => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })), hasMore: unshown.length > RESULTS_PER_PLATFORM || !!c?.hasMore };
          void updatePlatformCache(query, "selca", { ...c!, displayedIndex: dCount + RESULTS_PER_PLATFORM });
        } else {
          const api = await searchSelca(query, 1, c?.nextMaxTimeId || cur.nextMaxTimeId);
          const filtered = api.results.filter(r => !dUrls.has(r.url));
          const needed = RESULTS_PER_PLATFORM - unshown.length;
          res = { results: [...unshown.map(r => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })), ...filtered.slice(0, needed)], hasMore: filtered.length > needed || api.hasMore, nextMaxTimeId: api.nextMaxTimeId };
          void updatePlatformCache(query, "selca", { results: [...(c?.results ?? []), ...api.results], displayedIndex: dCount + unshown.length + Math.min(filtered.length, needed), currentPage: 1, currentOffset: 0, hasMore: api.hasMore, nextMaxTimeId: api.nextMaxTimeId });
        }
      } else if (p === "instagram") {
        const api = await searchInstagram(query);
        const filtered = api.results.filter(r => !new Set(cur.results.map(x => x.url)).has(r.url));
        res = { results: filtered.slice(0, RESULTS_PER_PLATFORM), hasMore: api.hasMore || filtered.length > RESULTS_PER_PLATFORM };
      } else if (p === "tiktok") {
        const api = await searchTikTok(query);
        const filtered = api.results.filter(r => !new Set(cur.results.map(x => x.url)).has(r.url));
        res = { results: filtered.slice(0, RESULTS_PER_PLATFORM), hasMore: api.hasMore || filtered.length > RESULTS_PER_PLATFORM };
      } else return;
      setPlatformResults(prev => new Map(prev).set(p, { ...cur, results: [...cur.results, ...res.results], hasMore: res.hasMore, isLoadingMore: false, nextPageToken: res.nextPageToken, nextCursor: res.nextCursor, nextMaxTimeId: res.nextMaxTimeId }));
    } catch (e: unknown) {
      setPlatformResults(prev => new Map(prev).set(p, { ...cur, isLoadingMore: false, error: e instanceof Error ? e.message : "검색 실패" }));
    }
  };

  useEffect(() => { clearExpiredCache(); }, []);

  useEffect(() => {
    setPlatformResults((prev) => {
      const next = new Map(prev);
      let changed = false;
      for (const [platform, data] of next) {
        const updatedResults = data.results.map((r) => {
          const isSaved = checkIfSaved(r.url);
          if (r.isSaved !== isSaved) {
            changed = true;
            return { ...r, isSaved };
          }
          return r;
        });
        if (changed) {
          next.set(platform, { ...data, results: updatedResults });
        }
      }
      return changed ? next : prev;
    });
  }, [savedUrls, checkIfSaved]);

  const markAsSaved = useCallback((url: string) => {
    setPlatformResults((prev) => {
      const next = new Map(prev);
      for (const [platform, data] of next) {
        const results = data.results.map((r) =>
          r.url === url ? { ...r, isSaved: true, isSaving: false } : r
        );
        next.set(platform, { ...data, results });
      }
      return next;
    });
  }, []);

  const markAsSaving = useCallback((url: string, isSaving: boolean) => {
    setPlatformResults((prev) => {
      const next = new Map(prev);
      for (const [platform, data] of next) {
        const results = data.results.map((r) =>
          r.url === url ? { ...r, isSaving } : r
        );
        next.set(platform, { ...data, results });
      }
      return next;
    });
  }, []);

  return { 
    platformResults, 
    isSearching, 
    selectedUrls, 
    setSelectedUrls, 
    isBatchSaving, 
    setIsBatchSaving, 
    cachedResults, 
    showCached, 
    handleSearch, 
    handleLoadMore, 
    toggleShowCached, 
    checkIfSaved, 
    removeKoreanSurname,
    markAsSaved,
    markAsSaving
  };
}
