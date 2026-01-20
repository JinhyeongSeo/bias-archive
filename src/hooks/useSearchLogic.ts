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

// Korean to English idol name mapping for Selca search
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

export function useSearchLogic({ 
  query, 
  savedUrls, 
  biases, 
  groups, 
  enabledPlatforms 
}: UseSearchLogicOptions) {
  const [platformResults, setPlatformResults] = useState<Map<Platform, PlatformResults>>(new Map());
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [cachedResults, setCachedResults] = useState<Map<Platform, CachedPlatformResult>>(new Map());
  const [showCached, setShowCached] = useState<Map<Platform, boolean>>(new Map());

  // Korean top 100 surnames
  const KOREAN_SURNAMES = useMemo(() => new Set([
    "김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오", "서", "신", "권", "황", "안", "송", "전", "홍", "유", "고", "문", "양", "손", "배", "백", "허", "노", "심", "하", "주", "구", "곽", "성", "차", "우", "민", "류", "나", "진", "지", "엄", "채", "원", "천", "방", "공", "현", "함", "변", "염", "여", "추", "도", "소", "석", "선", "설", "마", "길", "연", "위", "표", "명", "기", "반", "피", "왕", "금", "옥", "육", "인", "맹", "남", "탁", "국", "어", "경", "은", "편", "제", "빈", "봉", "사", "부",
  ]), []);

  const removeKoreanSurname = useCallback((name: string): string => {
    const isThreeCharKorean = /^[가-힣]{3}$/.test(name);
    const firstCharIsSurname = KOREAN_SURNAMES.has(name.charAt(0));
    return (isThreeCharKorean && firstCharIsSurname) ? name.slice(1) : name;
  }, [KOREAN_SURNAMES]);

  const checkIfSaved = useCallback((url: string): boolean => {
    const normalizedUrl = url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    return savedUrls.some((savedUrl) => {
      const normalizedSaved = savedUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
      return normalizedSaved === normalizedUrl;
    });
  }, [savedUrls]);

  const toggleShowCached = (platform: Platform) => {
    setShowCached((prev) => {
      const next = new Map(prev);
      next.set(platform, !prev.get(platform));
      return next;
    });
  };

  const searchYouTube = async (searchQuery: string, pageToken?: string): Promise<SearchResultBase> => {
    const params = new URLSearchParams({ q: searchQuery, max: String(API_FETCH_COUNT), order: "relevance", period: "month" });
    if (pageToken) params.set("pageToken", pageToken);
    const response = await fetch(`/api/youtube/search?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "YouTube 검색 실패");
    const results: EnrichedResult[] = (data.results as YouTubeResult[]).map((item) => ({
      url: `https://www.youtube.com/watch?v=${item.videoId}`,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      author: item.channelTitle,
      platform: "youtube" as Platform,
      publishedAt: item.publishedAt,
      isSaved: checkIfSaved(`https://www.youtube.com/watch?v=${item.videoId}`),
      isSaving: false,
    }));
    return { results, hasMore: data.hasMore ?? false, nextPageToken: data.nextPageToken };
  };

  const searchTwitter = async (searchQuery: string, cursor?: string): Promise<SearchResultBase> => {
    const cleanQuery = searchQuery.startsWith("#") ? searchQuery.slice(1) : searchQuery;
    const params = new URLSearchParams({ q: cleanQuery, count: String(API_FETCH_COUNT) });
    if (cursor) params.set("cursor", cursor);
    const response = await fetch(`/api/search/twitter?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Twitter 검색 실패");
    const results: EnrichedResult[] = await Promise.all((data.results as TwitterResult[]).map(async (item) => {
      const isSaved = checkIfSaved(item.link);
      if (item.thumbnailUrl) {
        return { url: item.link, title: item.title, thumbnailUrl: item.thumbnailUrl, author: item.authorName || "", platform: "twitter" as Platform, isSaved, isSaving: false };
      }
      try {
        const metaResponse = await fetch("/api/metadata", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: item.link }) });
        if (metaResponse.ok) {
          const metadata = await metaResponse.json();
          return { url: item.link, title: metadata.title || item.title, thumbnailUrl: metadata.thumbnailUrl || null, author: metadata.authorName || "", platform: "twitter" as Platform, isSaved, isSaving: false };
        }
      } catch {}
      return { url: item.link, title: item.title, thumbnailUrl: null, author: "", platform: "twitter" as Platform, isSaved, isSaving: false };
    }));
    return { results, hasMore: data.hasMore ?? false, nextCursor: data.nextCursor };
  };

  const searchCommunity = async (platform: 'heye' | 'kgirls' | 'kgirls-issue', searchQuery: string, page: number = 1, offset: number = 0): Promise<SearchResultBase> => {
    const boardMap = { heye: '', kgirls: 'mgall', 'kgirls-issue': 'issue' };
    const apiPath = platform === 'heye' ? '/api/search/heye' : '/api/search/kgirls';
    const params = new URLSearchParams({ q: searchQuery, page: String(page), limit: String(API_FETCH_COUNT), offset: String(offset) });
    if (platform !== 'heye') params.set('board', boardMap[platform]);
    const response = await fetch(`${apiPath}?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `${platform} 검색 실패`);
    const results: EnrichedResult[] = (data.results as (HeyeResult | KgirlsResult)[]).map((item) => ({
      url: item.url,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl ? (isVideoUrl(item.thumbnailUrl) ? getProxiedVideoUrl(item.thumbnailUrl) : getProxiedImageUrl(item.thumbnailUrl)) : null,
      author: item.author,
      platform: platform as Platform,
      isSaved: checkIfSaved(item.url),
      isSaving: false,
    }));
    return { results, hasMore: data.hasMore ?? false };
  };

  const searchSelca = async (searchQuery: string, page: number = 1, maxTimeId?: string): Promise<SearchResultBase> => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchedBias = biases.find(b => b.name.toLowerCase() === normalizedQuery || b.name_en?.toLowerCase() === normalizedQuery || b.name_ko?.toLowerCase() === normalizedQuery);
    const matchedGroup = groups.find(g => g.name.toLowerCase() === normalizedQuery || g.name_en?.toLowerCase() === normalizedQuery || g.name_ko?.toLowerCase() === normalizedQuery);
    
    let queryToUse = searchQuery;
    let searchType: 'member' | 'group' = 'member';

    if (matchedBias) {
      if (matchedBias.selca_slug === null) throw new Error('해당 아이돌의 Selca 콘텐츠가 없습니다');
      if (matchedBias.selca_slug) queryToUse = matchedBias.selca_slug;
    } else if (matchedGroup) {
      if (matchedGroup.selca_slug === null) throw new Error('해당 그룹의 Selca 콘텐츠가 없습니다');
      if (matchedGroup.selca_slug) { queryToUse = matchedGroup.selca_slug; searchType = 'group'; }
    } else {
      const fallback = normalizeIdolName(searchQuery);
      if (fallback !== searchQuery) queryToUse = fallback;
    }

    const params = new URLSearchParams({ query: queryToUse, page: String(page), limit: String(API_FETCH_COUNT), type: searchType });
    if (maxTimeId) params.set('maxTimeId', maxTimeId);
    const response = await fetch(`/api/search/selca?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "selca.kastden.org 검색 실패");
    const results: EnrichedResult[] = (data.results as SelcaResult[]).map((item) => ({
      url: item.url,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      author: item.author,
      platform: "selca" as Platform,
      isSaved: checkIfSaved(item.url),
      isSaving: false,
    }));
    return { results, hasMore: data.hasNextPage ?? false, nextMaxTimeId: data.nextMaxTimeId };
  };

  const searchInstagram = async (searchQuery: string): Promise<SearchResultBase> => {
    const params = new URLSearchParams({ q: searchQuery, type: 'hashtag', limit: String(API_FETCH_COUNT) });
    const response = await fetch(`/api/search/instagram?${params}`);
    const data = await response.json();
    if (data.notConfigured) throw new Error("Instagram 검색이 설정되지 않았습니다");
    if (!response.ok) throw new Error(data.error || "Instagram 검색 실패");
    const results: EnrichedResult[] = ((data.results || []) as InstagramResult[]).map((item) => ({
      url: item.url,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      author: item.author,
      platform: "instagram" as Platform,
      isSaved: checkIfSaved(item.url),
      isSaving: false,
      media: item.media,
    }));
    return { results, hasMore: data.hasMore || false };
  };

  const processPlatformSearch = async (
    platform: Platform,
    cachedData: CachedPlatformResult | undefined,
    searchFn: () => Promise<SearchResultBase>
  ) => {
    const displayedIndex = cachedData?.displayedIndex ?? 0;
    const cachedResultsList = cachedData?.results ?? [];
    const remainingInCache = cachedResultsList.length - displayedIndex;

    if (remainingInCache >= RESULTS_PER_PLATFORM) {
      const toDisplay = cachedResultsList.slice(displayedIndex, displayedIndex + RESULTS_PER_PLATFORM);
      const alreadyDisplayed = cachedResultsList.slice(0, displayedIndex);
      const newDisplayedIndex = displayedIndex + RESULTS_PER_PLATFORM;
      const hasMoreInCache = cachedResultsList.length > newDisplayedIndex || cachedData?.hasMore;

      if (alreadyDisplayed.length > 0) {
        setCachedResults((prev) => {
          const next = new Map(prev);
          next.set(platform, { ...cachedData!, results: alreadyDisplayed as EnrichedResult[] });
          return next;
        });
      }

      setPlatformResults((prev) => {
        const next = new Map(prev);
        next.set(platform, {
          platform,
          results: toDisplay as EnrichedResult[],
          hasMore: hasMoreInCache ?? false,
          isLoading: false,
          isLoadingMore: false,
          error: null,
          currentPage: cachedData?.currentPage ?? 1,
          currentOffset: cachedData?.currentOffset ?? 0,
          nextPageToken: cachedData?.nextPageToken,
          nextCursor: cachedData?.nextCursor,
          nextMaxTimeId: cachedData?.nextMaxTimeId,
        });
        return next;
      });

      void updatePlatformCache(query, platform as SearchCachePlatform, { ...cachedData!, displayedIndex: newDisplayedIndex });
      return;
    }

    try {
      const { results: apiResults, hasMore, nextPageToken, nextCursor, nextMaxTimeId } = await searchFn();
      const fromCache = cachedResultsList.slice(displayedIndex);
      const alreadyDisplayed = cachedResultsList.slice(0, displayedIndex);
      const existingUrls = new Set(cachedResultsList.map((r) => r.url));
      const newApiResults = apiResults.filter((r) => !existingUrls.has(r.url));
      const combined = [...fromCache, ...newApiResults];
      const toDisplay = combined.slice(0, RESULTS_PER_PLATFORM);
      const toSaveInCache = combined.slice(RESULTS_PER_PLATFORM);

      if (alreadyDisplayed.length > 0) {
        setCachedResults((prev) => {
          const next = new Map(prev);
          next.set(platform, { results: alreadyDisplayed as EnrichedResult[], displayedIndex: alreadyDisplayed.length, currentPage: cachedData?.currentPage ?? 1, currentOffset: cachedData?.currentOffset ?? 0, hasMore: false, nextPageToken: cachedData?.nextPageToken, nextCursor: cachedData?.nextCursor, nextMaxTimeId: cachedData?.nextMaxTimeId });
          return next;
        });
      }

      setPlatformResults((prev) => {
        const next = new Map(prev);
        next.set(platform, { platform, results: toDisplay, hasMore: hasMore || toSaveInCache.length > 0, isLoading: false, isLoadingMore: false, error: null, currentPage: 1, currentOffset: 0, nextPageToken, nextCursor, nextMaxTimeId });
        return next;
      });

      const allCachedResults = [...alreadyDisplayed, ...toDisplay, ...toSaveInCache];
      void updatePlatformCache(query, platform as SearchCachePlatform, { results: allCachedResults as EnrichedResult[], displayedIndex: alreadyDisplayed.length + toDisplay.length, nextPageToken, nextCursor, nextMaxTimeId, currentPage: 1, currentOffset: 0, hasMore });
    } catch (error: unknown) {
      setPlatformResults((prev) => {
        const next = new Map(prev);
        const errorMessage = error instanceof Error ? error.message : `${platform} 검색 실패`;
        next.set(platform, { platform, results: [], hasMore: false, isLoading: false, isLoadingMore: false, error: errorMessage, currentPage: 1, currentOffset: 0 });
        return next;
      });
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setSelectedUrls(new Set());
    const cached = await getSearchCache(query);
    setCachedResults(new Map());
    const initialResults = new Map<Platform, PlatformResults>();
    for (const platform of enabledPlatforms) {
      initialResults.set(platform, { platform, results: [], hasMore: false, isLoading: true, isLoadingMore: false, error: null, currentPage: 1, currentOffset: 0 });
    }
    setPlatformResults(initialResults);

    const promises: Promise<void>[] = [];
    if (enabledPlatforms.has("youtube")) promises.push(processPlatformSearch("youtube", cached?.platforms.youtube, () => searchYouTube(query, cached?.platforms.youtube?.nextPageToken)));
    if (enabledPlatforms.has("twitter")) promises.push(processPlatformSearch("twitter", cached?.platforms.twitter, () => searchTwitter(query, cached?.platforms.twitter?.nextCursor)));
    if (enabledPlatforms.has("heye")) promises.push(processPlatformSearch("heye", cached?.platforms.heye, () => searchCommunity('heye', query, cached?.platforms.heye?.currentPage ?? 1, cached?.platforms.heye?.currentOffset ?? 0)));
    if (enabledPlatforms.has("kgirls")) promises.push(processPlatformSearch("kgirls", cached?.platforms.kgirls, () => searchCommunity('kgirls', query, cached?.platforms.kgirls?.currentPage ?? 1, cached?.platforms.kgirls?.currentOffset ?? 0)));
    if (enabledPlatforms.has("kgirls-issue")) promises.push(processPlatformSearch("kgirls-issue", cached?.platforms["kgirls-issue"], () => searchCommunity('kgirls-issue', query, cached?.platforms["kgirls-issue"]?.currentPage ?? 1, cached?.platforms["kgirls-issue"]?.currentOffset ?? 0)));
    if (enabledPlatforms.has("selca")) promises.push(processPlatformSearch("selca", cached?.platforms.selca, () => searchSelca(query, cached?.platforms.selca?.currentPage ?? 1, cached?.platforms.selca?.nextMaxTimeId)));
    if (enabledPlatforms.has("instagram")) promises.push(processPlatformSearch("instagram", cached?.platforms.instagram, () => searchInstagram(query)));

    await Promise.allSettled(promises);
    setShowCached(new Map());
    setIsSearching(false);
  };

  const handleLoadMore = async (platform: Platform) => {
    const currentData = platformResults.get(platform);
    if (!currentData || currentData.isLoadingMore || !currentData.hasMore) return;

    setPlatformResults((prev) => {
      const next = new Map(prev);
      const data = next.get(platform);
      if (data) next.set(platform, { ...data, isLoadingMore: true });
      return next;
    });

    try {
      let searchResult: SearchResultBase;
      const localDisplayedCount = currentData.results.length;

      switch (platform) {
        case "youtube": {
          const ytCacheEntry = await getSearchCache(query);
          const ytCache = ytCacheEntry?.platforms.youtube;
          const ytCachedResults = ytCache?.results ?? [];
          const ytDisplayedUrls = new Set(currentData.results.map((r) => r.url));
          const ytUnshownInCache = ytCachedResults.filter((r) => !ytDisplayedUrls.has(r.url));

          if (ytUnshownInCache.length >= RESULTS_PER_PLATFORM) {
            const toDisplay = ytUnshownInCache.slice(0, RESULTS_PER_PLATFORM);
            searchResult = { results: toDisplay.map((r) => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })), hasMore: ytUnshownInCache.length > RESULTS_PER_PLATFORM || ytCache?.hasMore || false, nextPageToken: ytCache?.nextPageToken };
            void updatePlatformCache(query, "youtube", { ...ytCache!, displayedIndex: localDisplayedCount + RESULTS_PER_PLATFORM });
          } else {
            const fromCache = ytUnshownInCache;
            const needed = RESULTS_PER_PLATFORM - fromCache.length;
            const apiResult = await searchYouTube(query, ytCache?.nextPageToken || currentData.nextPageToken);
            const newApiResults = apiResult.results.filter((r) => !ytDisplayedUrls.has(r.url));
            const fromApi = newApiResults.slice(0, needed);
            const leftoverApi = newApiResults.slice(needed);
            searchResult = { results: [...fromCache.map((r) => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })), ...fromApi], hasMore: leftoverApi.length > 0 || apiResult.hasMore, nextPageToken: apiResult.nextPageToken };
            if (leftoverApi.length > 0 || apiResult.hasMore) {
              void updatePlatformCache(query, "youtube", { results: [...ytCachedResults, ...apiResult.results], displayedIndex: localDisplayedCount + fromCache.length + fromApi.length, currentPage: 1, currentOffset: 0, hasMore: apiResult.hasMore, nextPageToken: apiResult.nextPageToken });
            }
          }
          break;
        }
        case "twitter": {
          const twCacheEntry = await getSearchCache(query);
          const twCache = twCacheEntry?.platforms.twitter;
          const twCachedResults = twCache?.results ?? [];
          const displayedUrls = new Set(currentData.results.map((r) => r.url));
          const twUnshownInCache = twCachedResults.filter((r) => !displayedUrls.has(r.url));

          if (twUnshownInCache.length >= RESULTS_PER_PLATFORM) {
            const toDisplay = twUnshownInCache.slice(0, RESULTS_PER_PLATFORM);
            searchResult = { results: toDisplay.map((r) => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })), hasMore: twUnshownInCache.length > RESULTS_PER_PLATFORM || twCache?.hasMore || false, nextCursor: twCache?.nextCursor };
            void updatePlatformCache(query, "twitter", { ...twCache!, displayedIndex: localDisplayedCount + RESULTS_PER_PLATFORM });
          } else {
            const fromCache = twUnshownInCache;
            const needed = RESULTS_PER_PLATFORM - fromCache.length;
            const apiResult = await searchTwitter(query, twCache?.nextCursor || currentData.nextCursor);
            const newApiResults = apiResult.results.filter((r) => !displayedUrls.has(r.url));
            const fromApi = newApiResults.slice(0, needed);
            const leftoverApi = newApiResults.slice(needed);
            searchResult = { results: [...fromCache.map((r) => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })), ...fromApi], hasMore: leftoverApi.length > 0 || apiResult.hasMore, nextCursor: apiResult.nextCursor };
            if (leftoverApi.length > 0 || apiResult.hasMore) {
              void updatePlatformCache(query, "twitter", { results: [...twCachedResults, ...apiResult.results], displayedIndex: localDisplayedCount + fromCache.length + fromApi.length, currentPage: 1, currentOffset: 0, hasMore: apiResult.hasMore, nextCursor: apiResult.nextCursor });
            }
          }
          break;
        }
        case "heye": case "kgirls": case "kgirls-issue": {
          const cacheEntry = await getSearchCache(query);
          const platformCache = cacheEntry?.platforms[platform];
          const cachedResults = platformCache?.results ?? [];
          const displayedUrls = new Set(currentData.results.map((r) => r.url));
          const unshownInCache = cachedResults.filter((r) => !displayedUrls.has(r.url));

          if (unshownInCache.length >= RESULTS_PER_PLATFORM) {
            const toDisplay = unshownInCache.slice(0, RESULTS_PER_PLATFORM);
            searchResult = { results: toDisplay.map((r) => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })), hasMore: unshownInCache.length > RESULTS_PER_PLATFORM || platformCache?.hasMore || false };
            void updatePlatformCache(query, platform as SearchCachePlatform, { ...platformCache!, displayedIndex: localDisplayedCount + RESULTS_PER_PLATFORM });
          } else {
            const fromCache = unshownInCache;
            const needed = RESULTS_PER_PLATFORM - fromCache.length;
            const nextP = (platformCache?.currentPage ?? currentData.currentPage) + 1;
            const apiResult = await searchCommunity(platform as 'heye' | 'kgirls' | 'kgirls-issue', query, nextP, 0);
            const newApiResults = apiResult.results.filter((r) => !displayedUrls.has(r.url));
            const fromApi = newApiResults.slice(0, needed);
            const leftoverApi = newApiResults.slice(needed);
            searchResult = { results: [...fromCache.map((r) => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })), ...fromApi], hasMore: leftoverApi.length > 0 || apiResult.hasMore };
            if (leftoverApi.length > 0 || apiResult.hasMore) {
              void updatePlatformCache(query, platform as SearchCachePlatform, { results: [...cachedResults, ...apiResult.results], displayedIndex: localDisplayedCount + fromCache.length + fromApi.length, currentPage: nextP, currentOffset: 0, hasMore: apiResult.hasMore });
            }
          }
          break;
        }
        case "selca": {
          const cacheEntry = await getSearchCache(query);
          const platformCache = cacheEntry?.platforms.selca;
          const cachedResults = platformCache?.results ?? [];
          const displayedUrls = new Set(currentData.results.map((r) => r.url));
          const unshownInCache = cachedResults.filter((r) => !displayedUrls.has(r.url));

          if (unshownInCache.length >= RESULTS_PER_PLATFORM) {
            const toDisplay = unshownInCache.slice(0, RESULTS_PER_PLATFORM);
            searchResult = { results: toDisplay.map((r) => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })), hasMore: unshownInCache.length > RESULTS_PER_PLATFORM || platformCache?.hasMore || false, nextMaxTimeId: platformCache?.nextMaxTimeId };
            void updatePlatformCache(query, "selca", { ...platformCache!, displayedIndex: localDisplayedCount + RESULTS_PER_PLATFORM });
          } else {
            const fromCache = unshownInCache;
            const needed = RESULTS_PER_PLATFORM - fromCache.length;
            const apiResult = await searchSelca(query, 1, platformCache?.nextMaxTimeId || currentData.nextMaxTimeId);
            const newApiResults = apiResult.results.filter((r) => !displayedUrls.has(r.url));
            const fromApi = newApiResults.slice(0, needed);
            const leftoverApi = newApiResults.slice(needed);
            searchResult = { results: [...fromCache.map((r) => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })), ...fromApi], hasMore: leftoverApi.length > 0 || apiResult.hasMore, nextMaxTimeId: apiResult.nextMaxTimeId };
            if (leftoverApi.length > 0 || apiResult.hasMore) {
              void updatePlatformCache(query, "selca", { results: [...cachedResults, ...apiResult.results], displayedIndex: localDisplayedCount + fromCache.length + fromApi.length, currentPage: 1, currentOffset: 0, hasMore: apiResult.hasMore, nextMaxTimeId: apiResult.nextMaxTimeId });
            }
          }
          break;
        }
        case "instagram": {
          const apiResult = await searchInstagram(query);
          const displayedUrls = new Set(currentData.results.map((r) => r.url));
          const newApiResults = apiResult.results.filter((r) => !displayedUrls.has(r.url));
          searchResult = { results: newApiResults.slice(0, RESULTS_PER_PLATFORM), hasMore: apiResult.hasMore || newApiResults.length > RESULTS_PER_PLATFORM };
          break;
        }
        default: return;
      }

      setPlatformResults((prev) => {
        const next = new Map(prev);
        const data = next.get(platform);
        if (data) {
          next.set(platform, { ...data, results: [...data.results, ...searchResult.results], hasMore: searchResult.hasMore, isLoadingMore: false, nextPageToken: searchResult.nextPageToken, nextCursor: searchResult.nextCursor, nextMaxTimeId: searchResult.nextMaxTimeId });
        }
        return next;
      });
    } catch (error: unknown) {
      setPlatformResults((prev) => {
        const next = new Map(prev);
        const data = next.get(platform);
        const errorMessage = error instanceof Error ? error.message : `${platform} 검색 실패`;
        if (data) next.set(platform, { ...data, isLoadingMore: false, error: errorMessage });
        return next;
      });
    }
  };

  useEffect(() => {
    clearExpiredCache();
  }, []);

  return {
    platformResults,
    setPlatformResults,
    isSearching,
    selectedUrls,
    setSelectedUrls,
    isBatchSaving,
    setIsBatchSaving,
    cachedResults,
    setCachedResults,
    showCached,
    handleSearch,
    handleLoadMore,
    toggleShowCached,
    checkIfSaved,
    removeKoreanSurname,
  };
}
