"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getProxiedImageUrl, getProxiedVideoUrl, isVideoUrl, extractOriginalUrl } from "@/lib/proxy";
import {
  modalOverlay,
  modalContent,
  smoothSpring,
  easeOutExpo,
  pressScale,
  quickSpring,
} from "@/lib/animations";
import type { Bias, BiasWithGroup, Group } from "@/types/database";
import { useNameLanguage } from "@/contexts/NameLanguageContext";
import {
  getSearchCache,
  updatePlatformCache,
  clearExpiredCache,
  type CachedPlatformResult,
} from "@/lib/searchCache";
import { useTranslations, useLocale } from "next-intl";

// Selection type for idol dropdown
type Selection =
  | { type: "bias"; id: string }
  | { type: "group"; id: string }
  | null;

type Platform = "youtube" | "twitter" | "heye" | "kgirls" | "kgirls-issue" | "selca" | "instagram";

interface YouTubeResult {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
}

interface TwitterResult {
  link: string;
  title: string;
  snippet: string;
  thumbnailUrl?: string;
  authorName?: string;
}

interface HeyeResult {
  url: string;
  title: string;
  thumbnailUrl: string | null;
  author: string;
}

interface KgirlsResult {
  url: string;
  title: string;
  thumbnailUrl: string | null;
  author: string;
}

interface SelcaResult {
  url: string;
  title: string;
  thumbnailUrl: string;
  author: string;
}

interface InstagramResult {
  url: string;
  title: string;
  thumbnailUrl: string | null;
  author: string;
  media?: { type: 'image' | 'video'; url: string }[];
}

interface EnrichedResult {
  url: string;
  title: string;
  thumbnailUrl: string | null;
  author: string;
  platform: Platform;
  publishedAt?: string;
  isSaved: boolean;
  isSaving: boolean;
  media?: { type: 'image' | 'video'; url: string }[];
}

interface PlatformResults {
  platform: Platform;
  results: EnrichedResult[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  currentPage: number;
  currentOffset: number; // For heye/kgirls pagination within page
  nextPageToken?: string; // For YouTube pagination
  nextCursor?: string; // For Twitter (ScrapeBadger) pagination
  nextMaxTimeId?: string; // For selca pagination (max_time_id based)
}

interface UnifiedSearchProps {
  isOpen: boolean;
  onClose: () => void;
  savedUrls: string[];
  onSave?: () => void;
  biases: Bias[];
  groups: Group[];
}

// Platform configuration
const PLATFORMS: {
  id: Platform;
  label: string;
  color: string;
  bgColor: string;
  ringColor: string;
}[] = [
  {
    id: "youtube",
    label: "YouTube",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/50",
    ringColor: "ring-red-500/20",
  },
  {
    id: "twitter",
    label: "Twitter",
    color: "text-twitter",
    bgColor: "bg-twitter/10",
    ringColor: "ring-twitter/20",
  },
  {
    id: "heye",
    label: "heye.kr",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/50",
    ringColor: "ring-orange-500/20",
  },
  {
    id: "kgirls",
    label: "kgirls",
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-100 dark:bg-pink-900/50",
    ringColor: "ring-pink-500/20",
  },
  {
    id: "kgirls-issue",
    label: "kgirls issue",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/50",
    ringColor: "ring-purple-500/20",
  },
  {
    id: "selca",
    label: "Selca",
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-100 dark:bg-purple-900/50",
    ringColor: "ring-purple-500/20",
  },
  {
    id: "instagram",
    label: "Instagram",
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50",
    ringColor: "ring-pink-500/20",
  },
];

const RESULTS_PER_PLATFORM = 6; // 화면에 표시할 개수
const API_FETCH_COUNT = 20; // API에서 가져올 개수 (캐시용)

// Korean to English idol name mapping for Selca search
// 주요 아이돌 한영 매핑 (활동 중인 인기 그룹/멤버 우선)
// 새로운 아이돌 추가 시 이 객체에 매핑을 추가하세요
const IDOL_NAME_MAP: Record<string, string> = {
  // aespa
  "카리나": "karina",
  "윈터": "winter",
  "지젤": "giselle",
  "닝닝": "ningning",

  // IVE
  "유진": "yujin",
  "원영": "wonyoung",
  "가을": "gaeul",
  "리즈": "liz",
  "레이": "rei",
  "이서": "leeseo",

  // NewJeans
  "민지": "minji",
  "하니": "hanni",
  "다니엘": "danielle",
  "해린": "haerin",
  "혜인": "hyein",

  // BLACKPINK
  "지수": "jisoo",
  "제니": "jennie",
  "로제": "rose",
  "리사": "lisa",

  // (G)I-DLE
  "미연": "miyeon",
  "민니": "minnie",
  "소연": "soyeon",
  "우기": "yuqi",
  "슈화": "shuhua",

  // TWICE
  "나연": "nayeon",
  "정연": "jeongyeon",
  "모모": "momo",
  "사나": "sana",
  "지효": "jihyo",
  "미나": "mina",
  "다현": "dahyun",
  "채영": "chaeyoung",
  "쯔위": "tzuyu",

  // Red Velvet
  "아이린": "irene",
  "슬기": "seulgi",
  "웬디": "wendy",
  "조이": "joy",
  "예리": "yeri",
};

/**
 * Normalize idol name for Selca search
 * Converts Korean names to English stage names
 * @param query - Search query (Korean or English)
 * @returns Normalized English stage name
 */
function normalizeIdolName(query: string): string {
  const normalized = query.trim().toLowerCase();
  return IDOL_NAME_MAP[normalized] || normalized;
}

export function UnifiedSearch({
  isOpen,
  onClose,
  savedUrls,
  onSave,
  biases,
  groups,
}: UnifiedSearchProps) {
  const { getDisplayName } = useNameLanguage();
  const t = useTranslations("unifiedSearch");
  const locale = useLocale();

  // Helper to get group name based on current locale
  const getGroupDisplayName = useCallback(
    (group: Group): string => {
      if (locale === "ko") {
        return group.name_ko || group.name;
      }
      return group.name_en || group.name;
    },
    [locale]
  );

  // Korean top 100 surnames for detecting real names vs stage names
  const KOREAN_SURNAMES = useMemo(
    () =>
      new Set([
        "김",
        "이",
        "박",
        "최",
        "정",
        "강",
        "조",
        "윤",
        "장",
        "임",
        "한",
        "오",
        "서",
        "신",
        "권",
        "황",
        "안",
        "송",
        "전",
        "홍",
        "유",
        "고",
        "문",
        "양",
        "손",
        "배",
        "백",
        "허",
        "노",
        "심",
        "하",
        "주",
        "구",
        "곽",
        "성",
        "차",
        "우",
        "민",
        "류",
        "나",
        "진",
        "지",
        "엄",
        "채",
        "원",
        "천",
        "방",
        "공",
        "현",
        "함",
        "변",
        "염",
        "여",
        "추",
        "도",
        "소",
        "석",
        "선",
        "설",
        "마",
        "길",
        "연",
        "위",
        "표",
        "명",
        "기",
        "반",
        "피",
        "왕",
        "금",
        "옥",
        "육",
        "인",
        "맹",
        "남",
        "탁",
        "국",
        "어",
        "경",
        "은",
        "편",
        "제",
        "빈",
        "봉",
        "사",
        "부",
      ]),
    []
  );

  // Helper to remove Korean surname for better search results
  // Only applies to real Korean names (exactly 3 chars + first char is a surname)
  // Stage names like "윈터", "카리나" are kept as-is
  const removeKoreanSurname = useCallback(
    (name: string): string => {
      // Condition: exactly 3 Korean characters + first char is a Korean surname
      const isThreeCharKorean = /^[가-힣]{3}$/.test(name);
      const firstCharIsSurname = KOREAN_SURNAMES.has(name.charAt(0));

      if (isThreeCharKorean && firstCharIsSurname) {
        return name.slice(1); // e.g., "장원영" → "원영", "안유진" → "유진"
      }
      return name; // e.g., "윈터" → "윈터", "카리나" → "카리나"
    },
    [KOREAN_SURNAMES]
  );

  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Selection>(null);
  const [isIdolDropdownOpen, setIsIdolDropdownOpen] = useState(false);
  const [collapsedDropdownGroups, setCollapsedDropdownGroups] = useState<
    Set<string>
  >(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [enabledPlatforms, setEnabledPlatforms] = useState<Set<Platform>>(
    new Set(["youtube", "twitter", "heye", "kgirls", "kgirls-issue", "selca", "instagram"])
  );

  const [platformResults, setPlatformResults] = useState<
    Map<Platform, PlatformResults>
  >(new Map());
  const [isSearching, setIsSearching] = useState(false);

  // Multi-select state
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  // Cache state - 이전에 본 결과
  const [cachedResults, setCachedResults] = useState<
    Map<Platform, CachedPlatformResult>
  >(new Map());
  const [showCached, setShowCached] = useState<Map<Platform, boolean>>(
    new Map()
  );

  // Toggle cached results visibility
  const toggleShowCached = (platform: Platform) => {
    setShowCached((prev) => {
      const next = new Map(prev);
      next.set(platform, !prev.get(platform));
      return next;
    });
  };

  // 컴포넌트 마운트 시 만료된 캐시 정리
  useEffect(() => {
    clearExpiredCache();
  }, []);

  // Group biases by group for dropdown
  const biasesWithGroups = useMemo((): BiasWithGroup[] => {
    const groupMap = new Map<string, Group>();
    for (const group of groups) {
      groupMap.set(group.id, group);
    }
    return biases.map((bias) => ({
      ...bias,
      group: bias.group_id ? groupMap.get(bias.group_id) ?? null : null,
    }));
  }, [biases, groups]);

  // Group biases by group_id for dropdown display, sorted by group sort_order
  const groupedBiases = useMemo(() => {
    const grouped = new Map<string | null, BiasWithGroup[]>();

    // Sort groups by sort_order first
    const sortedGroups = [...groups].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );

    // Add groups in sorted order
    for (const group of sortedGroups) {
      const biasesInGroup = biasesWithGroups.filter(
        (b) => b.group_id === group.id
      );
      if (biasesInGroup.length > 0) {
        grouped.set(group.id, biasesInGroup);
      }
    }

    // Add ungrouped biases at the end
    const ungrouped = biasesWithGroups.filter((b) => !b.group_id);
    if (ungrouped.length > 0) {
      grouped.set(null, ungrouped);
    }

    return grouped;
  }, [biasesWithGroups, groups]);

  // Toggle dropdown group collapse
  const toggleDropdownGroupCollapse = (groupId: string) => {
    setCollapsedDropdownGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Get selected display name
  const getSelectionDisplayName = useCallback((): string => {
    if (!selection) return t("selectIdol");
    if (selection.type === "group") {
      const group = groups.find((g) => g.id === selection.id);
      if (group) {
        return getGroupDisplayName(group);
      }
    } else {
      const bias = biases.find((b) => b.id === selection.id);
      if (bias) {
        return getDisplayName(bias);
      }
    }
    return t("selectIdol");
  }, [selection, groups, biases, getDisplayName, getGroupDisplayName, t]);

  // ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsIdolDropdownOpen(false);
      }
    };
    if (isIdolDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isIdolDropdownOpen]);

  // Initialize all groups as collapsed and calculate dropdown position when dropdown opens
  useEffect(() => {
    if (isIdolDropdownOpen) {
      const allGroupIds = new Set(
        biasesWithGroups
          .map((b) => b.group_id)
          .filter((id): id is string => id !== null)
      );
      setCollapsedDropdownGroups(allGroupIds);

      // Calculate dropdown position based on button
      if (dropdownButtonRef.current) {
        const rect = dropdownButtonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      }
    }
  }, [isIdolDropdownOpen, biasesWithGroups]);

  // Prevent body scroll when modal is open and reset state when closing
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // Reset state when modal closes
      setQuery("");
      setSelection(null);
      setIsIdolDropdownOpen(false);
      setCollapsedDropdownGroups(new Set());
      setPlatformResults(new Map());
      setSelectedUrls(new Set());
      setCachedResults(new Map());
      setShowCached(new Map());
      setIsSearching(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // When selection changes, update query
  useEffect(() => {
    if (!selection) return;

    if (selection.type === "group") {
      const group = groups.find((g) => g.id === selection.id);
      if (group) {
        // Use locale-appropriate group name for search
        setQuery(getGroupDisplayName(group));
      }
    } else {
      const selectedBias = biases.find((b) => b.id === selection.id);
      if (selectedBias) {
        // Use Korean name with surname removed for better search results
        // e.g., "장원영" → "원영" gets more results than full name
        const koreanName = selectedBias.name_ko || selectedBias.name;
        setQuery(removeKoreanSurname(koreanName));
      }
    }
  }, [selection, groups, biases, getGroupDisplayName, removeKoreanSurname]);

  const checkIfSaved = useCallback(
    (url: string): boolean => {
      const normalizedUrl = url
        .replace(/^https?:\/\/(www\.)?/, "")
        .replace(/\/$/, "");
      return savedUrls.some((savedUrl) => {
        const normalizedSaved = savedUrl
          .replace(/^https?:\/\/(www\.)?/, "")
          .replace(/\/$/, "");
        return normalizedSaved === normalizedUrl;
      });
    },
    [savedUrls]
  );

  // Toggle platform
  const togglePlatform = (platform: Platform) => {
    setEnabledPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) {
        // Don't allow disabling all platforms
        if (next.size > 1) {
          next.delete(platform);
        }
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  // Search functions for each platform
  const searchYouTube = async (
    searchQuery: string,
    pageToken?: string
  ): Promise<{
    results: EnrichedResult[];
    hasMore: boolean;
    nextPageToken?: string;
  }> => {
    const params = new URLSearchParams({
      q: searchQuery,
      max: String(API_FETCH_COUNT),
      order: "relevance",
      period: "month", // Default to this month for more recent results
    });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(`/api/youtube/search?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "YouTube 검색 실패");
    }

    const results = (data.results as YouTubeResult[]).map((item) => ({
      url: `https://www.youtube.com/watch?v=${item.videoId}`,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      author: item.channelTitle,
      platform: "youtube" as Platform,
      publishedAt: item.publishedAt,
      isSaved: checkIfSaved(`https://www.youtube.com/watch?v=${item.videoId}`),
      isSaving: false,
    }));

    return {
      results,
      hasMore: data.hasMore ?? false,
      nextPageToken: data.nextPageToken,
    };
  };

  const searchTwitter = async (
    searchQuery: string,
    cursor?: string
  ): Promise<{
    results: EnrichedResult[];
    hasMore: boolean;
    nextCursor?: string;
  }> => {
    // Remove # prefix if present - Google CSE handles hashtags better without the # symbol
    // The site:twitter.com filter in the API will find relevant tweets
    const cleanQuery = searchQuery.startsWith("#")
      ? searchQuery.slice(1)
      : searchQuery;

    console.log("[searchTwitter] query:", cleanQuery, "cursor:", cursor);

    const params = new URLSearchParams({
      q: cleanQuery,
      count: String(API_FETCH_COUNT),
    });

    // Add cursor for ScrapeBadger pagination
    if (cursor) {
      params.set("cursor", cursor);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    let data;
    try {
      const response = await fetch(`/api/search/twitter?${params}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Twitter 검색 실패");
      }

      console.log(
        "[Twitter Search] provider:",
        data.provider,
        "results:",
        data.results?.length
      );
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("요청 시간이 초과되었습니다");
      }
      throw error;
    }

    const twitterResults = data.results as TwitterResult[];

    // ScrapeBadger already returns thumbnailUrl and authorName, so we can use them directly
    // Only fetch metadata for results without thumbnailUrl (likely from Google CSE fallback)
    const results: EnrichedResult[] = await Promise.all(
      twitterResults.map(async (item): Promise<EnrichedResult> => {
        const isSaved = checkIfSaved(item.link);

        // If we already have thumbnail from ScrapeBadger, use it directly
        if (item.thumbnailUrl) {
          return {
            url: item.link,
            title: item.title,
            thumbnailUrl: item.thumbnailUrl,
            author: item.authorName || "",
            platform: "twitter",
            isSaved,
            isSaving: false,
          };
        }

        // Fallback: fetch metadata for Google CSE results
        const metaController = new AbortController();
        const metaTimeoutId = setTimeout(() => metaController.abort(), 5000);

        try {
          const metaResponse = await fetch("/api/metadata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: item.link }),
            signal: metaController.signal,
          });

          clearTimeout(metaTimeoutId);

          if (metaResponse.ok) {
            const metadata = await metaResponse.json();
            return {
              url: item.link,
              title: metadata.title || item.title,
              thumbnailUrl: metadata.thumbnailUrl || null,
              author: metadata.authorName || "",
              platform: "twitter",
              isSaved,
              isSaving: false,
            };
          }
        } catch {
          clearTimeout(metaTimeoutId);
        }

        // Fallback result if metadata fetch fails
        return {
          url: item.link,
          title: item.title,
          thumbnailUrl: null,
          author: "",
          platform: "twitter",
          isSaved,
          isSaving: false,
        };
      })
    );

    return {
      results,
      hasMore: data.hasMore ?? false,
      nextCursor: data.nextCursor,
    };
  };

  const searchHeye = async (
    searchQuery: string,
    page: number = 1,
    offset: number = 0
  ): Promise<{ results: EnrichedResult[]; hasMore: boolean }> => {
    const params = new URLSearchParams({
      q: searchQuery,
      page: String(page),
      limit: String(API_FETCH_COUNT),
      offset: String(offset),
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(`/api/search/heye?${params}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "heye.kr 검색 실패");
      }

      const results = (data.results as HeyeResult[]).map((item) => ({
        url: item.url,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl
          ? isVideoUrl(item.thumbnailUrl)
            ? getProxiedVideoUrl(item.thumbnailUrl)
            : getProxiedImageUrl(item.thumbnailUrl)
          : null,
        author: item.author,
        platform: "heye" as Platform,
        isSaved: checkIfSaved(item.url),
        isSaving: false,
      }));

      return {
        results,
        hasMore: data.hasMore ?? false,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("요청 시간이 초과되었습니다");
      }
      throw error;
    }
  };

  const searchKgirls = async (
    searchQuery: string,
    page: number = 1,
    offset: number = 0
  ): Promise<{ results: EnrichedResult[]; hasMore: boolean }> => {
    const params = new URLSearchParams({
      q: searchQuery,
      page: String(page),
      board: "mgall",
      limit: String(API_FETCH_COUNT),
      offset: String(offset),
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(`/api/search/kgirls?${params}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "kgirls.net 검색 실패");
      }

      const results = (data.results as KgirlsResult[]).map((item) => ({
        url: item.url,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl
          ? getProxiedImageUrl(item.thumbnailUrl)
          : null,
        author: item.author,
        platform: "kgirls" as Platform,
        isSaved: checkIfSaved(item.url),
        isSaving: false,
      }));

      return {
        results,
        hasMore: data.hasMore ?? false,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("요청 시간이 초과되었습니다");
      }
      throw error;
    }
  };

  const searchKgirlsIssue = async (
    searchQuery: string,
    page: number = 1,
    offset: number = 0
  ): Promise<{ results: EnrichedResult[]; hasMore: boolean }> => {
    const params = new URLSearchParams({
      q: searchQuery,
      page: String(page),
      board: "issue",
      limit: String(API_FETCH_COUNT),
      offset: String(offset),
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(`/api/search/kgirls?${params}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "kgirls.net issue 검색 실패");
      }

      const results = (data.results as KgirlsResult[]).map((item) => ({
        url: item.url,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl
          ? getProxiedImageUrl(item.thumbnailUrl)
          : null,
        author: item.author,
        platform: "kgirls-issue" as Platform,
        isSaved: checkIfSaved(item.url),
        isSaving: false,
      }));

      return {
        results,
        hasMore: data.hasMore ?? false,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("요청 시간이 초과되었습니다");
      }
      throw error;
    }
  };

  const searchSelca = async (
    searchQuery: string,
    page: number = 1,
    maxTimeId?: string
  ): Promise<{ results: EnrichedResult[]; hasMore: boolean; nextMaxTimeId?: string }> => {
    // Step 1: Bias 또는 Group에서 매칭 찾기
    const normalizedQuery = searchQuery.trim().toLowerCase();

    // 개별 멤버(Bias) 매칭
    const matchedBias = biases.find(bias => {
      const nameMatch = bias.name.toLowerCase() === normalizedQuery;
      const nameEnMatch = bias.name_en?.toLowerCase() === normalizedQuery;
      const nameKoMatch = bias.name_ko?.toLowerCase() === normalizedQuery;
      return nameMatch || nameEnMatch || nameKoMatch;
    });

    // 그룹 매칭
    const matchedGroup = groups.find(group => {
      const nameMatch = group.name.toLowerCase() === normalizedQuery;
      const nameEnMatch = group.name_en?.toLowerCase() === normalizedQuery;
      const nameKoMatch = group.name_ko?.toLowerCase() === normalizedQuery;
      return nameMatch || nameEnMatch || nameKoMatch;
    });

    // Step 2: selca_slug 우선 사용 (멤버 > 그룹 순서로 확인)
    let queryToUse = searchQuery;
    let searchType: 'member' | 'group' = 'member';

    if (matchedBias) {
      // Bias가 매칭됐지만 selca_slug가 null이면 콘텐츠 없음
      if (matchedBias.selca_slug === null) {
        console.log(`[Selca Search] "${searchQuery}" → Selca owner 없음 (API 호출 스킵)`);
        throw new Error('해당 아이돌의 Selca 콘텐츠가 없습니다');
      }
      if (matchedBias.selca_slug) {
        queryToUse = matchedBias.selca_slug;
        console.log(`[Selca Search] "${searchQuery}" → slug: "${queryToUse}" (from Bias)`);
      }
    } else if (matchedGroup) {
      // 그룹이 매칭됐지만 selca_slug가 null이면 콘텐츠 없음
      if (matchedGroup.selca_slug === null) {
        console.log(`[Selca Search] "${searchQuery}" → Selca group 없음 (API 호출 스킵)`);
        throw new Error('해당 그룹의 Selca 콘텐츠가 없습니다');
      }
      if (matchedGroup.selca_slug) {
        queryToUse = matchedGroup.selca_slug;
        searchType = 'group';
        console.log(`[Selca Search] "${searchQuery}" → slug: "${queryToUse}" (from Group)`);
      }
    } else {
      // 기존 방식: 한글 → 영문 변환
      const normalizedFallback = normalizeIdolName(searchQuery);
      if (normalizedFallback !== searchQuery) {
        queryToUse = normalizedFallback;
        console.log(`[Selca Search] "${searchQuery}" → "${queryToUse}" (fallback)`);
      }
    }

    const params = new URLSearchParams({
      query: queryToUse, // selca_slug 또는 변환된 검색어 사용
      page: String(page),
      limit: String(API_FETCH_COUNT),
      type: searchType, // 'member' or 'group'
    });
    if (maxTimeId) {
      params.set('maxTimeId', maxTimeId);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(`/api/search/selca?${params}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "selca.kastden.org 검색 실패";
        const fullMessage = data.hint
          ? `${errorMessage}\n${data.hint}`
          : errorMessage;
        throw new Error(fullMessage);
      }

      const results = (data.results as SelcaResult[]).map((item) => ({
        url: item.url,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl,
        author: item.author,
        platform: "selca" as Platform,
        isSaved: checkIfSaved(item.url),
        isSaving: false,
      }));

      return {
        results,
        hasMore: data.hasNextPage ?? false,
        nextMaxTimeId: data.nextMaxTimeId,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("요청 시간이 초과되었습니다");
      }
      throw error;
    }
  };

  // Instagram search via Apify
  const searchInstagram = async (
    searchQuery: string,
    searchType: 'user' | 'hashtag' = 'hashtag'
  ): Promise<{ results: EnrichedResult[]; hasMore: boolean }> => {
    const params = new URLSearchParams({
      q: searchQuery,
      type: searchType,
      limit: '10', // Instagram Apify scraper is slow, use lower limit to avoid timeout
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout (Apify can be slow)

    try {
      const response = await fetch(`/api/search/instagram?${params}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      // Check notConfigured first (even on 200 OK response)
      if (data.notConfigured) {
        throw new Error("Instagram 검색이 설정되지 않았습니다");
      }

      if (!response.ok) {
        throw new Error(data.error || "Instagram 검색 실패");
      }

      // Defensive: handle undefined results
      // Keep original URLs - proxy is applied at render time
      const results = ((data.results || []) as InstagramResult[]).map((item) => ({
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
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("요청 시간이 초과되었습니다");
      }
      throw error;
    }
  };

  // 플랫폼별 검색 처리 헬퍼 함수
  const processPlatformSearch = async (
    platform: Platform,
    cachedData: CachedPlatformResult | undefined,
    searchFn: () => Promise<{
      results: EnrichedResult[];
      hasMore: boolean;
      nextPageToken?: string;
      nextCursor?: string;
      nextMaxTimeId?: string;
    }>
  ) => {
    const displayedIndex = cachedData?.displayedIndex ?? 0;
    const cachedResultsList = cachedData?.results ?? [];
    const remainingInCache = cachedResultsList.length - displayedIndex;

    // 캐시에 충분한 미표시 결과가 있으면 API 호출 없이 캐시에서 표시
    if (remainingInCache >= RESULTS_PER_PLATFORM) {
      const toDisplay = cachedResultsList.slice(
        displayedIndex,
        displayedIndex + RESULTS_PER_PLATFORM
      );
      const alreadyDisplayed = cachedResultsList.slice(0, displayedIndex);
      const newDisplayedIndex = displayedIndex + RESULTS_PER_PLATFORM;
      const hasMoreInCache =
        cachedResultsList.length > newDisplayedIndex || cachedData?.hasMore;

      // "오늘 본 결과"에 이전에 표시했던 결과 즉시 저장
      if (alreadyDisplayed.length > 0) {
        setCachedResults((prev) => {
          const next = new Map(prev);
          next.set(platform, {
            ...cachedData!,
            results: alreadyDisplayed,
          });
          return next;
        });
      }

      setPlatformResults((prev) => {
        const next = new Map(prev);
        next.set(platform, {
          platform,
          results: toDisplay,
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

      // 캐시의 displayedIndex 업데이트 (비동기, await 불필요)
      void updatePlatformCache(query, platform, {
        ...cachedData!,
        displayedIndex: newDisplayedIndex,
      });

      return;
    }

    // 캐시가 부족하면 API 호출
    try {
      const {
        results: apiResults,
        hasMore,
        nextPageToken,
        nextCursor,
        nextMaxTimeId,
      } = await searchFn();

      // 캐시에서 가져올 부분 (미표시 부분)
      const fromCache = cachedResultsList.slice(displayedIndex);
      // 이미 표시한 부분 (오늘 본 결과)
      const alreadyDisplayed = cachedResultsList.slice(0, displayedIndex);

      // API 결과에서 중복 제거
      const existingUrls = new Set(cachedResultsList.map((r) => r.url));
      const newApiResults = apiResults.filter((r) => !existingUrls.has(r.url));

      // 캐시 잔여 + 새 API 결과 합치기
      const combined = [...fromCache, ...newApiResults];
      const toDisplay = combined.slice(0, RESULTS_PER_PLATFORM);
      const toSaveInCache = combined.slice(RESULTS_PER_PLATFORM);

      // "오늘 본 결과"에 이전에 표시했던 결과 즉시 저장
      if (alreadyDisplayed.length > 0) {
        setCachedResults((prev) => {
          const next = new Map(prev);
          next.set(platform, {
            results: alreadyDisplayed,
            displayedIndex: alreadyDisplayed.length,
            currentPage: cachedData?.currentPage ?? 1,
            currentOffset: cachedData?.currentOffset ?? 0,
            hasMore: false,
            nextPageToken: cachedData?.nextPageToken,
            nextCursor: cachedData?.nextCursor,
            nextMaxTimeId: cachedData?.nextMaxTimeId,
          });
          return next;
        });
      }

      setPlatformResults((prev) => {
        const next = new Map(prev);
        next.set(platform, {
          platform,
          results: toDisplay,
          hasMore: hasMore || toSaveInCache.length > 0,
          isLoading: false,
          isLoadingMore: false,
          error: null,
          currentPage: 1,
          currentOffset: 0,
          nextPageToken,
          nextCursor,
          nextMaxTimeId,
        });
        return next;
      });

      // 전체 캐시 업데이트 (표시한 것 + 남은 것) - 비동기, await 불필요
      const allCachedResults = [
        ...alreadyDisplayed,
        ...toDisplay,
        ...toSaveInCache,
      ];
      void updatePlatformCache(query, platform, {
        results: allCachedResults,
        displayedIndex: alreadyDisplayed.length + toDisplay.length,
        nextPageToken,
        nextCursor,
        nextMaxTimeId,
        currentPage: 1,
        currentOffset: 0,
        hasMore,
      });
    } catch (error) {
      console.error(`[UnifiedSearch] ${platform} error:`, error);
      setPlatformResults((prev) => {
        const next = new Map(prev);
        next.set(platform, {
          platform,
          results: [],
          hasMore: false,
          isLoading: false,
          isLoadingMore: false,
          error:
            error instanceof Error ? error.message : `${platform} 검색 실패`,
          currentPage: 1,
          currentOffset: 0,
        });
        return next;
      });
    }
  };

  // Unified search - search all enabled platforms in parallel
  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setSelectedUrls(new Set());

    // 캐시 확인 (서버에서 가져오기)
    const cached = await getSearchCache(query);

    // 검색 시작 시 캐시된 결과 초기화
    setCachedResults(new Map());

    // Initialize results for each enabled platform
    const initialResults = new Map<Platform, PlatformResults>();
    for (const platform of enabledPlatforms) {
      initialResults.set(platform, {
        platform,
        results: [],
        hasMore: false,
        isLoading: true,
        isLoadingMore: false,
        error: null,
        currentPage: 1,
        currentOffset: 0,
      });
    }
    setPlatformResults(initialResults);

    // Search all platforms in parallel
    const searchPromises: Promise<void>[] = [];

    if (enabledPlatforms.has("youtube")) {
      const cachedYoutube = cached?.platforms.youtube;
      searchPromises.push(
        processPlatformSearch(
          "youtube",
          cachedYoutube,
          () => searchYouTube(query, cachedYoutube?.nextPageToken)
        )
      );
    }

    if (enabledPlatforms.has("twitter")) {
      const cachedTwitter = cached?.platforms.twitter;
      searchPromises.push(
        processPlatformSearch(
          "twitter",
          cachedTwitter,
          () => searchTwitter(query, cachedTwitter?.nextCursor)
        )
      );
    }

    if (enabledPlatforms.has("heye")) {
      const cachedHeye = cached?.platforms.heye;
      const startPage = cachedHeye?.currentPage ?? 1;
      const startOffset = cachedHeye?.currentOffset ?? 0;
      searchPromises.push(
        processPlatformSearch(
          "heye",
          cachedHeye,
          () => searchHeye(query, startPage, startOffset)
        )
      );
    }

    if (enabledPlatforms.has("kgirls")) {
      const cachedKgirls = cached?.platforms.kgirls;
      const startPage = cachedKgirls?.currentPage ?? 1;
      const startOffset = cachedKgirls?.currentOffset ?? 0;
      searchPromises.push(
        processPlatformSearch(
          "kgirls",
          cachedKgirls,
          () => searchKgirls(query, startPage, startOffset)
        )
      );
    }

    if (enabledPlatforms.has("kgirls-issue")) {
      const cachedKgirlsIssue = cached?.platforms["kgirls-issue"];
      const startPage = cachedKgirlsIssue?.currentPage ?? 1;
      const startOffset = cachedKgirlsIssue?.currentOffset ?? 0;
      searchPromises.push(
        processPlatformSearch(
          "kgirls-issue",
          cachedKgirlsIssue,
          () => searchKgirlsIssue(query, startPage, startOffset)
        )
      );
    }

    if (enabledPlatforms.has("selca")) {
      const cachedSelca = cached?.platforms.selca;
      const startPage = cachedSelca?.currentPage ?? 1;
      searchPromises.push(
        processPlatformSearch(
          "selca",
          cachedSelca,
          () => searchSelca(query, startPage, cachedSelca?.nextMaxTimeId)
        )
      );
    }

    if (enabledPlatforms.has("instagram")) {
      const cachedInstagram = cached?.platforms.instagram;
      searchPromises.push(
        processPlatformSearch(
          "instagram",
          cachedInstagram,
          () => searchInstagram(query)
        )
      );
    }

    await Promise.allSettled(searchPromises);

    // 캐시된 결과는 기본적으로 접힌 상태
    setShowCached(new Map());

    setIsSearching(false);
  };

  // Load more results for a specific platform
  const handleLoadMore = async (platform: Platform) => {
    const currentData = platformResults.get(platform);
    if (!currentData || currentData.isLoadingMore || !currentData.hasMore) {
      return;
    }

    // Set loading more state
    setPlatformResults((prev) => {
      const next = new Map(prev);
      const data = next.get(platform);
      if (data) {
        next.set(platform, { ...data, isLoadingMore: true });
      }
      return next;
    });

    try {
      let searchResult: {
        results: EnrichedResult[];
        hasMore: boolean;
        nextPageToken?: string;
        nextCursor?: string;
        nextMaxTimeId?: string;
      };
      let newPage = currentData.currentPage;
      const newOffset = currentData.currentOffset;

      // 로컬 상태 기준 displayedIndex (서버 캐시 타이밍 이슈 방지)
      const localDisplayedCount = currentData.results.length;

      switch (platform) {
        case "youtube": {
          // Check cache first
          const ytCacheEntry = await getSearchCache(query);
          const ytCache = ytCacheEntry?.platforms.youtube;
          const ytCachedResults = ytCache?.results ?? [];

          // 현재 화면에 표시된 URL들
          const ytDisplayedUrls = new Set(
            currentData.results.map((r) => r.url)
          );
          // 캐시에서 아직 표시되지 않은 결과만 필터링
          const ytUnshownInCache = ytCachedResults.filter(
            (r) => !ytDisplayedUrls.has(r.url)
          );

          if (ytUnshownInCache.length >= RESULTS_PER_PLATFORM) {
            // Use cached results only
            const toDisplay = ytUnshownInCache.slice(0, RESULTS_PER_PLATFORM);
            searchResult = {
              results: toDisplay.map((r) => ({
                ...r,
                isSaved: checkIfSaved(r.url),
                isSaving: false,
              })),
              hasMore:
                ytUnshownInCache.length > RESULTS_PER_PLATFORM ||
                ytCache?.hasMore ||
                false,
              nextPageToken: ytCache?.nextPageToken,
            };
            // Update cache displayedIndex
            void updatePlatformCache(query, "youtube", {
              ...ytCache!,
              displayedIndex: localDisplayedCount + RESULTS_PER_PLATFORM,
            });
          } else {
            // Combine remaining cache + fetch next page
            const fromCache = ytUnshownInCache;
            const needed = RESULTS_PER_PLATFORM - fromCache.length;
            const apiResult = await searchYouTube(
              query,
              ytCache?.nextPageToken || currentData.nextPageToken
            );

            // API 결과에서도 이미 표시된 URL 제외
            const newApiResults = apiResult.results.filter(
              (r) => !ytDisplayedUrls.has(r.url)
            );
            const fromApi = newApiResults.slice(0, needed);
            const leftoverApi = newApiResults.slice(needed);

            searchResult = {
              results: [
                ...fromCache.map((r) => ({
                  ...r,
                  isSaved: checkIfSaved(r.url),
                  isSaving: false,
                })),
                ...fromApi,
              ],
              hasMore: leftoverApi.length > 0 || apiResult.hasMore,
              nextPageToken: apiResult.nextPageToken,
            };

            // Update cache with new API results
            if (leftoverApi.length > 0 || apiResult.hasMore) {
              void updatePlatformCache(query, "youtube", {
                results: [...ytCachedResults, ...apiResult.results],
                displayedIndex:
                  localDisplayedCount + fromCache.length + fromApi.length,
                currentPage: 1,
                currentOffset: 0,
                hasMore: apiResult.hasMore,
                nextPageToken: apiResult.nextPageToken,
              });
            }
          }
          break;
        }
        case "twitter": {
          // Check cache first
          const twCacheEntry = await getSearchCache(query);
          const twCache = twCacheEntry?.platforms.twitter;
          const twCachedResults = twCache?.results ?? [];

          // 현재 화면에 표시된 URL들
          const displayedUrls = new Set(currentData.results.map((r) => r.url));
          // 캐시에서 아직 표시되지 않은 결과만 필터링
          const twUnshownInCache = twCachedResults.filter(
            (r) => !displayedUrls.has(r.url)
          );

          console.log(
            "[Twitter LoadMore] cache:",
            twCachedResults.length,
            "displayed:",
            displayedUrls.size,
            "unshown:",
            twUnshownInCache.length,
            "nextCursor:",
            twCache?.nextCursor || currentData.nextCursor
          );

          if (twUnshownInCache.length >= RESULTS_PER_PLATFORM) {
            // Use cached results only
            const toDisplay = twUnshownInCache.slice(0, RESULTS_PER_PLATFORM);
            searchResult = {
              results: toDisplay.map((r) => ({
                ...r,
                isSaved: checkIfSaved(r.url),
                isSaving: false,
              })),
              hasMore:
                twUnshownInCache.length > RESULTS_PER_PLATFORM ||
                twCache?.hasMore ||
                false,
              nextCursor: twCache?.nextCursor,
            };
            // Update cache displayedIndex
            void updatePlatformCache(query, "twitter", {
              ...twCache!,
              displayedIndex: localDisplayedCount + RESULTS_PER_PLATFORM,
            });
          } else {
            // Combine remaining cache + fetch next page
            const fromCache = twUnshownInCache;
            const needed = RESULTS_PER_PLATFORM - fromCache.length;
            const cursor = twCache?.nextCursor || currentData.nextCursor;
            console.log("[Twitter LoadMore] fetching with cursor:", cursor);
            const apiResult = await searchTwitter(query, cursor);

            // API 결과에서도 이미 표시된 URL 제외
            const newApiResults = apiResult.results.filter(
              (r) => !displayedUrls.has(r.url)
            );
            const fromApi = newApiResults.slice(0, needed);
            const leftoverApi = newApiResults.slice(needed);

            searchResult = {
              results: [
                ...fromCache.map((r) => ({
                  ...r,
                  isSaved: checkIfSaved(r.url),
                  isSaving: false,
                })),
                ...fromApi,
              ],
              hasMore: leftoverApi.length > 0 || apiResult.hasMore,
              nextCursor: apiResult.nextCursor,
            };

            // Update cache with new API results
            if (leftoverApi.length > 0 || apiResult.hasMore) {
              void updatePlatformCache(query, "twitter", {
                results: [...twCachedResults, ...apiResult.results],
                displayedIndex:
                  localDisplayedCount + fromCache.length + fromApi.length,
                currentPage: 1,
                currentOffset: 0,
                hasMore: apiResult.hasMore,
                nextCursor: apiResult.nextCursor,
              });
            }
          }
          break;
        }
        case "heye": {
          // Check cache first
          const heyeCacheEntry = await getSearchCache(query);
          const heyeCache = heyeCacheEntry?.platforms.heye;
          const heyeCachedResults = heyeCache?.results ?? [];

          // 현재 화면에 표시된 URL들
          const heyeDisplayedUrls = new Set(
            currentData.results.map((r) => r.url)
          );
          // 캐시에서 아직 표시되지 않은 결과만 필터링
          const heyeUnshownInCache = heyeCachedResults.filter(
            (r) => !heyeDisplayedUrls.has(r.url)
          );

          if (heyeUnshownInCache.length >= RESULTS_PER_PLATFORM) {
            // Use cached results only
            const toDisplay = heyeUnshownInCache.slice(0, RESULTS_PER_PLATFORM);
            searchResult = {
              results: toDisplay.map((r) => ({
                ...r,
                isSaved: checkIfSaved(r.url),
                isSaving: false,
              })),
              hasMore:
                heyeUnshownInCache.length > RESULTS_PER_PLATFORM ||
                heyeCache?.hasMore ||
                false,
            };
            // Update cache displayedIndex
            void updatePlatformCache(query, "heye", {
              ...heyeCache!,
              displayedIndex: localDisplayedCount + RESULTS_PER_PLATFORM,
            });
          } else {
            // Combine remaining cache + fetch next page
            const fromCache = heyeUnshownInCache;
            const needed = RESULTS_PER_PLATFORM - fromCache.length;
            // Use cache's currentPage if available, otherwise use currentData's
            newPage = (heyeCache?.currentPage ?? currentData.currentPage) + 1;
            const apiResult = await searchHeye(query, newPage, 0);

            // API 결과에서도 이미 표시된 URL 제외
            const newApiResults = apiResult.results.filter(
              (r) => !heyeDisplayedUrls.has(r.url)
            );
            const fromApi = newApiResults.slice(0, needed);
            const leftoverApi = newApiResults.slice(needed);

            searchResult = {
              results: [
                ...fromCache.map((r) => ({
                  ...r,
                  isSaved: checkIfSaved(r.url),
                  isSaving: false,
                })),
                ...fromApi,
              ],
              hasMore: leftoverApi.length > 0 || apiResult.hasMore,
            };

            // Update cache with new API results
            if (leftoverApi.length > 0 || apiResult.hasMore) {
              void updatePlatformCache(query, "heye", {
                results: [...heyeCachedResults, ...apiResult.results],
                displayedIndex:
                  localDisplayedCount + fromCache.length + fromApi.length,
                currentPage: newPage,
                currentOffset: 0,
                hasMore: apiResult.hasMore,
              });
            }
          }
          break;
        }
        case "kgirls": {
          // Check cache first
          const kgirlsCacheEntry = await getSearchCache(query);
          const kgirlsCache = kgirlsCacheEntry?.platforms.kgirls;
          const kgirlsCachedResults = kgirlsCache?.results ?? [];

          // 현재 화면에 표시된 URL들
          const kgirlsDisplayedUrls = new Set(
            currentData.results.map((r) => r.url)
          );
          // 캐시에서 아직 표시되지 않은 결과만 필터링
          const kgirlsUnshownInCache = kgirlsCachedResults.filter(
            (r) => !kgirlsDisplayedUrls.has(r.url)
          );

          if (kgirlsUnshownInCache.length >= RESULTS_PER_PLATFORM) {
            // Use cached results only
            const toDisplay = kgirlsUnshownInCache.slice(
              0,
              RESULTS_PER_PLATFORM
            );
            searchResult = {
              results: toDisplay.map((r) => ({
                ...r,
                isSaved: checkIfSaved(r.url),
                isSaving: false,
              })),
              hasMore:
                kgirlsUnshownInCache.length > RESULTS_PER_PLATFORM ||
                kgirlsCache?.hasMore ||
                false,
            };
            // Update cache displayedIndex
            void updatePlatformCache(query, "kgirls", {
              ...kgirlsCache!,
              displayedIndex: localDisplayedCount + RESULTS_PER_PLATFORM,
            });
          } else {
            // Combine remaining cache + fetch next page
            const fromCache = kgirlsUnshownInCache;
            const needed = RESULTS_PER_PLATFORM - fromCache.length;
            // Use cache's currentPage if available, otherwise use currentData's
            newPage = (kgirlsCache?.currentPage ?? currentData.currentPage) + 1;
            const apiResult = await searchKgirls(query, newPage, 0);

            // API 결과에서도 이미 표시된 URL 제외
            const newApiResults = apiResult.results.filter(
              (r) => !kgirlsDisplayedUrls.has(r.url)
            );
            const fromApi = newApiResults.slice(0, needed);
            const leftoverApi = newApiResults.slice(needed);

            searchResult = {
              results: [
                ...fromCache.map((r) => ({
                  ...r,
                  isSaved: checkIfSaved(r.url),
                  isSaving: false,
                })),
                ...fromApi,
              ],
              hasMore: leftoverApi.length > 0 || apiResult.hasMore,
            };

            // Update cache with new API results
            if (leftoverApi.length > 0 || apiResult.hasMore) {
              void updatePlatformCache(query, "kgirls", {
                results: [...kgirlsCachedResults, ...apiResult.results],
                displayedIndex:
                  localDisplayedCount + fromCache.length + fromApi.length,
                currentPage: newPage,
                currentOffset: 0,
                hasMore: apiResult.hasMore,
              });
            }
          }
          break;
        }
        case "kgirls-issue": {
          // Check cache first
          const kgirlsIssueCacheEntry = await getSearchCache(query);
          const kgirlsIssueCache =
            kgirlsIssueCacheEntry?.platforms["kgirls-issue"];
          const kgirlsIssueCachedResults = kgirlsIssueCache?.results ?? [];

          // 현재 화면에 표시된 URL들
          const kgirlsIssueDisplayedUrls = new Set(
            currentData.results.map((r) => r.url)
          );
          // 캐시에서 아직 표시되지 않은 결과만 필터링
          const kgirlsIssueUnshownInCache = kgirlsIssueCachedResults.filter(
            (r) => !kgirlsIssueDisplayedUrls.has(r.url)
          );

          if (kgirlsIssueUnshownInCache.length >= RESULTS_PER_PLATFORM) {
            // Use cached results only
            const toDisplay = kgirlsIssueUnshownInCache.slice(
              0,
              RESULTS_PER_PLATFORM
            );
            searchResult = {
              results: toDisplay.map((r) => ({
                ...r,
                isSaved: checkIfSaved(r.url),
                isSaving: false,
              })),
              hasMore:
                kgirlsIssueUnshownInCache.length > RESULTS_PER_PLATFORM ||
                kgirlsIssueCache?.hasMore ||
                false,
            };
            // Update cache displayedIndex
            void updatePlatformCache(query, "kgirls-issue", {
              ...kgirlsIssueCache!,
              displayedIndex: localDisplayedCount + RESULTS_PER_PLATFORM,
            });
          } else {
            // Combine remaining cache + fetch next page
            const fromCache = kgirlsIssueUnshownInCache;
            const needed = RESULTS_PER_PLATFORM - fromCache.length;
            // Use cache's currentPage if available, otherwise use currentData's
            newPage = (kgirlsIssueCache?.currentPage ?? currentData.currentPage) + 1;
            const apiResult = await searchKgirlsIssue(query, newPage, 0);

            // API 결과에서도 이미 표시된 URL 제외
            const newApiResults = apiResult.results.filter(
              (r) => !kgirlsIssueDisplayedUrls.has(r.url)
            );
            const fromApi = newApiResults.slice(0, needed);
            const leftoverApi = newApiResults.slice(needed);

            searchResult = {
              results: [
                ...fromCache.map((r) => ({
                  ...r,
                  isSaved: checkIfSaved(r.url),
                  isSaving: false,
                })),
                ...fromApi,
              ],
              hasMore: leftoverApi.length > 0 || apiResult.hasMore,
            };

            // Update cache with new API results
            if (leftoverApi.length > 0 || apiResult.hasMore) {
              void updatePlatformCache(query, "kgirls-issue", {
                results: [...kgirlsIssueCachedResults, ...apiResult.results],
                displayedIndex:
                  localDisplayedCount + fromCache.length + fromApi.length,
                currentPage: newPage,
                currentOffset: 0,
                hasMore: apiResult.hasMore,
              });
            }
          }
          break;
        }
        case "selca": {
          // selca uses max_time_id based pagination (forward-only)
          const selcaCacheEntry = await getSearchCache(query);
          const selcaCache = selcaCacheEntry?.platforms.selca;
          const selcaCachedResults = selcaCache?.results ?? [];
          const cacheDisplayedIndex = selcaCache?.displayedIndex ?? 0;

          // 현재 화면에 표시된 URL들 (현재 세션)
          const selcaDisplayedUrls = new Set(
            currentData.results.map((r) => r.url)
          );

          // 캐시에서 displayedIndex 이후의 결과 중, 현재 세션에서 표시되지 않은 것만 필터링
          const selcaUnshownInCache = selcaCachedResults
            .slice(cacheDisplayedIndex) // 캐시의 displayedIndex 이후부터
            .filter((r) => !selcaDisplayedUrls.has(r.url));

          if (selcaUnshownInCache.length >= RESULTS_PER_PLATFORM) {
            // Use cached results only
            const toDisplay = selcaUnshownInCache.slice(0, RESULTS_PER_PLATFORM);
            searchResult = {
              results: toDisplay.map((r) => ({
                ...r,
                isSaved: checkIfSaved(r.url),
                isSaving: false,
              })),
              hasMore:
                selcaUnshownInCache.length > RESULTS_PER_PLATFORM ||
                selcaCache?.hasMore ||
                false,
              nextMaxTimeId: selcaCache?.nextMaxTimeId,
            };
            // Update cache displayedIndex
            void updatePlatformCache(query, "selca", {
              ...selcaCache!,
              displayedIndex: cacheDisplayedIndex + localDisplayedCount + RESULTS_PER_PLATFORM,
            });
          } else {
            // Combine remaining cache + fetch next page using nextMaxTimeId
            const fromCache = selcaUnshownInCache;
            const needed = RESULTS_PER_PLATFORM - fromCache.length;
            const nextMaxTimeId = selcaCache?.nextMaxTimeId || currentData.nextMaxTimeId;
            const apiResult = await searchSelca(query, newPage, nextMaxTimeId);

            // API 결과에서도 이미 표시된 URL 제외
            const newApiResults = apiResult.results.filter(
              (r) => !selcaDisplayedUrls.has(r.url)
            );
            const fromApi = newApiResults.slice(0, needed);
            const leftoverApi = newApiResults.slice(needed);

            searchResult = {
              results: [
                ...fromCache.map((r) => ({
                  ...r,
                  isSaved: checkIfSaved(r.url),
                  isSaving: false,
                })),
                ...fromApi,
              ],
              hasMore: leftoverApi.length > 0 || apiResult.hasMore,
              nextMaxTimeId: apiResult.nextMaxTimeId,
            };

            // Update cache with new API results
            if (leftoverApi.length > 0 || apiResult.hasMore) {
              void updatePlatformCache(query, "selca", {
                results: [...selcaCachedResults, ...apiResult.results],
                displayedIndex:
                  cacheDisplayedIndex + localDisplayedCount + fromCache.length + fromApi.length,
                currentPage: newPage,
                currentOffset: 0,
                hasMore: apiResult.hasMore,
                nextMaxTimeId: apiResult.nextMaxTimeId,
              });
            }
          }
          break;
        }
        case "instagram": {
          // Check cache first (Instagram has no API pagination, but can show more from cache)
          const instaCacheEntry = await getSearchCache(query);
          const instaCache = instaCacheEntry?.platforms.instagram;
          const instaCachedResults = instaCache?.results ?? [];

          // 현재 화면에 표시된 URL들
          const instaDisplayedUrls = new Set(
            currentData.results.map((r) => r.url)
          );
          // 캐시에서 아직 표시되지 않은 결과만 필터링
          const instaUnshownInCache = instaCachedResults.filter(
            (r) => !instaDisplayedUrls.has(r.url)
          );

          if (instaUnshownInCache.length > 0) {
            // Use cached results
            const toDisplay = instaUnshownInCache.slice(0, RESULTS_PER_PLATFORM);
            searchResult = {
              results: toDisplay.map((r) => ({
                ...r,
                isSaved: checkIfSaved(r.url),
                isSaving: false,
              })),
              hasMore: instaUnshownInCache.length > RESULTS_PER_PLATFORM,
            };
            // Update cache displayedIndex
            void updatePlatformCache(query, "instagram", {
              ...instaCache!,
              displayedIndex: localDisplayedCount + toDisplay.length,
            });
          } else {
            // No more cached results, Instagram API doesn't support pagination
            searchResult = {
              results: [],
              hasMore: false,
            };
          }
          break;
        }
        default:
          return;
      }

      setPlatformResults((prev) => {
        const next = new Map(prev);
        const data = next.get(platform);
        if (data) {
          // Filter out duplicates by URL
          const existingUrls = new Set(data.results.map((r) => r.url));
          const newResults = searchResult.results.filter(
            (r) => !existingUrls.has(r.url)
          );
          console.log(
            "[LoadMore setPlatformResults]",
            platform,
            "searchResult.results:",
            searchResult.results.length,
            "existingUrls:",
            existingUrls.size,
            "newResults:",
            newResults.length,
            "duplicates:",
            searchResult.results
              .filter((r) => existingUrls.has(r.url))
              .map((r) => r.url)
          );

          next.set(platform, {
            ...data,
            results: [...data.results, ...newResults],
            hasMore: searchResult.hasMore,
            isLoadingMore: false,
            currentPage: newPage,
            currentOffset: newOffset,
            nextPageToken: searchResult.nextPageToken,
            nextCursor: searchResult.nextCursor,
            nextMaxTimeId: searchResult.nextMaxTimeId,
          });
        }
        return next;
      });
    } catch (error) {
      setPlatformResults((prev) => {
        const next = new Map(prev);
        const data = next.get(platform);
        if (data) {
          next.set(platform, {
            ...data,
            isLoadingMore: false,
            error: error instanceof Error ? error.message : "더 보기 실패",
          });
        }
        return next;
      });
    }
  };

  // Get all results combined
  const allResults = useMemo(() => {
    const results: EnrichedResult[] = [];
    for (const [, data] of platformResults) {
      results.push(...data.results);
    }
    return results;
  }, [platformResults]);

  // Selection helpers
  const toggleSelection = (url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  const selectableResults = allResults.filter((r) => !r.isSaved);
  const selectableCount = selectableResults.length;
  const selectedCount = selectedUrls.size;

  const selectAll = () => {
    setSelectedUrls(new Set(selectableResults.map((r) => r.url)));
  };

  const clearSelection = () => {
    setSelectedUrls(new Set());
  };

  // Platform-specific selection helpers
  const getSelectableByPlatform = (platform: Platform) => {
    return selectableResults.filter((r) => r.platform === platform);
  };

  const getSelectedCountByPlatform = (platform: Platform) => {
    return selectableResults.filter(
      (r) => r.platform === platform && selectedUrls.has(r.url)
    ).length;
  };

  const selectByPlatform = (platform: Platform) => {
    const platformResults = getSelectableByPlatform(platform);
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      platformResults.forEach((r) => next.add(r.url));
      return next;
    });
  };

  const deselectByPlatform = (platform: Platform) => {
    const platformResults = getSelectableByPlatform(platform);
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      platformResults.forEach((r) => next.delete(r.url));
      return next;
    });
  };

  const togglePlatformSelection = (platform: Platform) => {
    const selectable = getSelectableByPlatform(platform);
    const selectedInPlatform = getSelectedCountByPlatform(platform);

    if (selectedInPlatform === selectable.length && selectable.length > 0) {
      deselectByPlatform(platform);
    } else {
      selectByPlatform(platform);
    }
  };

  // Save functions
  const handleSaveCachedResult = async (
    platform: Platform,
    result: EnrichedResult
  ) => {
    if (result.isSaved || result.isSaving) return;

    // Update isSaving state in cachedResults
    setCachedResults((prev) => {
      const next = new Map(prev);
      const platformData = next.get(platform);
      if (platformData) {
        next.set(platform, {
          ...platformData,
          results: platformData.results.map((r) =>
            r.url === result.url ? { ...r, isSaving: true } : r
          ),
        });
      }
      return next;
    });

    try {
      const metaResponse = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.url }),
      });

      let metadata = {
        title: result.title,
        thumbnailUrl: result.thumbnailUrl,
        platform: result.platform,
        authorName: result.author,
        media: undefined as { type: string; url: string }[] | undefined,
      };

      if (metaResponse.ok) {
        const fullMetadata = await metaResponse.json();
        // If metadata API returns URL as title (fallback from parser failure),
        // prefer the original result.title which has proper content from ScrapeBadger
        const isUrlTitle =
          fullMetadata.title &&
          (fullMetadata.title.startsWith("http://") ||
            fullMetadata.title.startsWith("https://"));
        metadata = {
          title: isUrlTitle ? result.title : fullMetadata.title || result.title,
          thumbnailUrl: fullMetadata.thumbnailUrl || result.thumbnailUrl,
          platform: fullMetadata.platform || result.platform,
          authorName: fullMetadata.authorName || result.author,
          media: fullMetadata.media,
        };
      }

      // Extract original URLs for saving (removes proxy wrapper and decodes HTML entities)
      const thumbnailUrlForSave = metadata.thumbnailUrl
        ? extractOriginalUrl(metadata.thumbnailUrl)
        : null;
      const mediaForSave = metadata.media?.map(m => ({
        ...m,
        url: extractOriginalUrl(m.url),
      }));

      const saveResponse = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: result.url,
          title: metadata.title,
          thumbnailUrl: thumbnailUrlForSave,
          platform: metadata.platform,
          authorName: metadata.authorName,
          searchQuery: query,
          media: mediaForSave,
        }),
      });

      if (saveResponse.ok || saveResponse.status === 409) {
        setCachedResults((prev) => {
          const next = new Map(prev);
          const platformData = next.get(platform);
          if (platformData) {
            next.set(platform, {
              ...platformData,
              results: platformData.results.map((r) =>
                r.url === result.url
                  ? { ...r, isSaved: true, isSaving: false }
                  : r
              ),
            });
          }
          return next;
        });
        onSave?.();
      } else {
        throw new Error("저장 실패");
      }
    } catch (err) {
      console.error("Save cached result error:", err);
      setCachedResults((prev) => {
        const next = new Map(prev);
        const platformData = next.get(platform);
        if (platformData) {
          next.set(platform, {
            ...platformData,
            results: platformData.results.map((r) =>
              r.url === result.url ? { ...r, isSaving: false } : r
            ),
          });
        }
        return next;
      });
    }
  };

  const handleSave = async (result: EnrichedResult) => {
    if (result.isSaved || result.isSaving) return;

    // Update isSaving state
    setPlatformResults((prev) => {
      const next = new Map(prev);
      const platformData = next.get(result.platform);
      if (platformData) {
        next.set(result.platform, {
          ...platformData,
          results: platformData.results.map((r) =>
            r.url === result.url ? { ...r, isSaving: true } : r
          ),
        });
      }
      return next;
    });

    try {
      const metaResponse = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.url }),
      });

      let metadata = {
        title: result.title,
        thumbnailUrl: result.thumbnailUrl,
        platform: result.platform,
        authorName: result.author,
        media: undefined as { type: string; url: string }[] | undefined,
      };

      if (metaResponse.ok) {
        const fullMetadata = await metaResponse.json();
        // If metadata API returns URL as title (fallback from parser failure),
        // prefer the original result.title which has proper content from ScrapeBadger
        const isUrlTitle =
          fullMetadata.title &&
          (fullMetadata.title.startsWith("http://") ||
            fullMetadata.title.startsWith("https://"));
        metadata = {
          title: isUrlTitle ? result.title : fullMetadata.title || result.title,
          thumbnailUrl: fullMetadata.thumbnailUrl || result.thumbnailUrl,
          platform: fullMetadata.platform || result.platform,
          authorName: fullMetadata.authorName || result.author,
          media: fullMetadata.media,
        };
      }

      // Instagram: 검색 결과의 media 배열 우선 사용, 없으면 thumbnailUrl로 폴백 (뷰어 지원)
      if (metadata.platform === 'instagram' && !metadata.media) {
        if (result.media && result.media.length > 0) {
          metadata.media = result.media;
        } else if (metadata.thumbnailUrl) {
          metadata.media = [{ type: 'image', url: metadata.thumbnailUrl }];
        }
      }

      // Extract original URLs for saving (removes proxy wrapper and decodes HTML entities)
      const thumbnailUrlForSave = metadata.thumbnailUrl
        ? extractOriginalUrl(metadata.thumbnailUrl)
        : null;
      const mediaForSave = metadata.media?.map(m => ({
        ...m,
        url: extractOriginalUrl(m.url),
      }));

      const saveResponse = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: result.url,
          title: metadata.title,
          thumbnailUrl: thumbnailUrlForSave,
          platform: metadata.platform,
          authorName: metadata.authorName,
          searchQuery: query,
          media: mediaForSave,
        }),
      });

      if (saveResponse.ok || saveResponse.status === 409) {
        setPlatformResults((prev) => {
          const next = new Map(prev);
          const platformData = next.get(result.platform);
          if (platformData) {
            next.set(result.platform, {
              ...platformData,
              results: platformData.results.map((r) =>
                r.url === result.url
                  ? { ...r, isSaved: true, isSaving: false }
                  : r
              ),
            });
          }
          return next;
        });
        onSave?.();
      } else {
        throw new Error("저장 실패");
      }
    } catch (err) {
      console.error("Save error:", err);
      setPlatformResults((prev) => {
        const next = new Map(prev);
        const platformData = next.get(result.platform);
        if (platformData) {
          next.set(result.platform, {
            ...platformData,
            results: platformData.results.map((r) =>
              r.url === result.url ? { ...r, isSaving: false } : r
            ),
          });
        }
        return next;
      });
    }
  };

  const handleBatchSave = async () => {
    if (selectedUrls.size === 0 || isBatchSaving) return;

    setIsBatchSaving(true);
    let savedCount = 0;
    let errorCount = 0;

    // Mark all selected as saving
    setPlatformResults((prev) => {
      const next = new Map(prev);
      for (const [platform, data] of next) {
        next.set(platform, {
          ...data,
          results: data.results.map((r) =>
            selectedUrls.has(r.url) ? { ...r, isSaving: true } : r
          ),
        });
      }
      return next;
    });

    for (const url of selectedUrls) {
      const result = allResults.find((r) => r.url === url);
      if (!result || result.isSaved) continue;

      try {
        const metaResponse = await fetch("/api/metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        let metadata = {
          title: result.title,
          thumbnailUrl: result.thumbnailUrl,
          platform: result.platform,
          authorName: result.author,
          media: undefined as { type: string; url: string }[] | undefined,
        };

        if (metaResponse.ok) {
          const fullMetadata = await metaResponse.json();
          // If metadata API returns URL as title (fallback from parser failure),
          // prefer the original result.title which has proper content from ScrapeBadger
          const isUrlTitle =
            fullMetadata.title &&
            (fullMetadata.title.startsWith("http://") ||
              fullMetadata.title.startsWith("https://"));
          metadata = {
            title: isUrlTitle
              ? result.title
              : fullMetadata.title || result.title,
            thumbnailUrl: fullMetadata.thumbnailUrl || result.thumbnailUrl,
            platform: fullMetadata.platform || result.platform,
            authorName: fullMetadata.authorName || result.author,
            media: fullMetadata.media,
          };
        }

        // Extract original URLs for saving (removes proxy wrapper and decodes HTML entities)
        const thumbnailUrlForSave = metadata.thumbnailUrl
          ? extractOriginalUrl(metadata.thumbnailUrl)
          : null;
        const mediaForSave = metadata.media?.map(m => ({
          ...m,
          url: extractOriginalUrl(m.url),
        }));

        const saveResponse = await fetch("/api/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            title: metadata.title,
            thumbnailUrl: thumbnailUrlForSave,
            platform: metadata.platform,
            authorName: metadata.authorName,
            searchQuery: query,
            media: mediaForSave,
          }),
        });

        if (saveResponse.ok || saveResponse.status === 409) {
          setPlatformResults((prev) => {
            const next = new Map(prev);
            const platformData = next.get(result.platform);
            if (platformData) {
              next.set(result.platform, {
                ...platformData,
                results: platformData.results.map((r) =>
                  r.url === url ? { ...r, isSaved: true, isSaving: false } : r
                ),
              });
            }
            return next;
          });
          savedCount++;
        } else {
          throw new Error("저장 실패");
        }
      } catch {
        setPlatformResults((prev) => {
          const next = new Map(prev);
          const platformData = next.get(result.platform);
          if (platformData) {
            next.set(result.platform, {
              ...platformData,
              results: platformData.results.map((r) =>
                r.url === url ? { ...r, isSaving: false } : r
              ),
            });
          }
          return next;
        });
        errorCount++;
      }
    }

    setSelectedUrls(new Set());
    setIsBatchSaving(false);

    if (savedCount > 0) {
      onSave?.();
    }

    if (errorCount > 0) {
      alert(`${savedCount}개 저장 완료, ${errorCount}개 실패`);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  // Check if any platform is still loading
  const anyLoading = Array.from(platformResults.values()).some(
    (p) => p.isLoading
  );

  // Total results count
  const totalResults = allResults.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          variants={modalOverlay}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={easeOutExpo}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-4xl mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] bg-background rounded-xl shadow-2xl flex flex-col"
            variants={modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={smoothSpring}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                통합 검색
              </h2>
              <motion.button
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                whileTap={{ scale: 0.9 }}
                transition={quickSpring}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
              {/* Search Row: Idol Dropdown + Search Input - overflow-visible for dropdown to extend beyond */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 overflow-visible relative z-10">
                {/* Custom Idol Dropdown */}
                <div
                  className="w-full sm:w-56 flex-shrink-0 relative"
                  ref={dropdownRef}
                >
                  <motion.button
                    ref={dropdownButtonRef}
                    onClick={() => setIsIdolDropdownOpen(!isIdolDropdownOpen)}
                    className={`w-full px-3 py-2 sm:py-2.5 text-sm border rounded-lg bg-white dark:bg-zinc-800 text-left flex items-center justify-between transition-colors ${
                      isIdolDropdownOpen
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}
                    {...pressScale}
                  >
                    <span
                      className={
                        selection
                          ? "text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-400 dark:text-zinc-500"
                      }
                    >
                      {getSelectionDisplayName()}
                    </span>
                    <svg
                      className={`w-4 h-4 text-zinc-400 transition-transform ${
                        isIdolDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isIdolDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="fixed z-[100] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-80 overflow-y-auto"
                        style={{
                          top: dropdownPosition.top,
                          left: dropdownPosition.left,
                          width: dropdownPosition.width,
                        }}
                      >
                        {/* No Selection option */}
                        <button
                          onClick={() => {
                            setSelection(null);
                            setIsIdolDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-sm text-left text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                        >
                          {t("noSelection")}
                        </button>

                        {/* Groups with members */}
                        {Array.from(groupedBiases.entries()).map(
                          ([groupId, biasesInGroup]) => {
                            const group = groupId
                              ? groups.find((g) => g.id === groupId)
                              : null;
                            const isCollapsed = groupId
                              ? collapsedDropdownGroups.has(groupId)
                              : false;

                            if (group) {
                              // Grouped biases
                              return (
                                <div key={groupId}>
                                  {/* Group Header */}
                                  <div className="flex items-center border-t border-zinc-100 dark:border-zinc-700/50">
                                    {/* Collapse Toggle */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleDropdownGroupCollapse(groupId!);
                                      }}
                                      className="px-2 py-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                    >
                                      <svg
                                        className={`w-3.5 h-3.5 transition-transform ${
                                          isCollapsed ? "" : "rotate-90"
                                        }`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 5l7 7-7 7"
                                        />
                                      </svg>
                                    </button>

                                    {/* Group Name (clickable for group selection) */}
                                    <button
                                      onClick={() => {
                                        setSelection({
                                          type: "group",
                                          id: groupId!,
                                        });
                                        setIsIdolDropdownOpen(false);
                                      }}
                                      className={`flex-1 px-2 py-2 text-sm font-medium text-left transition-colors ${
                                        selection?.type === "group" &&
                                        selection.id === groupId
                                          ? "text-primary bg-primary/5"
                                          : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                                      }`}
                                    >
                                      {getGroupDisplayName(group)}
                                      <span className="ml-1 text-xs text-zinc-400">
                                        ({biasesInGroup.length})
                                      </span>
                                    </button>
                                  </div>

                                  {/* Group Members */}
                                  {!isCollapsed && (
                                    <div className="pl-6 border-l-2 border-zinc-100 dark:border-zinc-700/50 ml-4">
                                      {biasesInGroup.map((bias) => (
                                        <button
                                          key={bias.id}
                                          onClick={() => {
                                            setSelection({
                                              type: "bias",
                                              id: bias.id,
                                            });
                                            setIsIdolDropdownOpen(false);
                                          }}
                                          className={`w-full px-3 py-1.5 text-sm text-left transition-colors flex items-center gap-2 ${
                                            selection?.type === "bias" &&
                                            selection.id === bias.id
                                              ? "text-primary bg-primary/5"
                                              : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                                          }`}
                                        >
                                          <span className="text-zinc-300 dark:text-zinc-600">
                                            •
                                          </span>
                                          {getDisplayName(bias)}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            } else {
                              // Ungrouped biases
                              return biasesInGroup.map((bias) => (
                                <button
                                  key={bias.id}
                                  onClick={() => {
                                    setSelection({ type: "bias", id: bias.id });
                                    setIsIdolDropdownOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 text-sm text-left border-t border-zinc-100 dark:border-zinc-700/50 transition-colors ${
                                    selection?.type === "bias" &&
                                    selection.id === bias.id
                                      ? "text-primary bg-primary/5"
                                      : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                                  }`}
                                >
                                  {getDisplayName(bias)}
                                </button>
                              ));
                            }
                          }
                        )}

                        {/* Empty state */}
                        {biases.length === 0 && (
                          <div className="px-3 py-4 text-sm text-zinc-400 text-center">
                            등록된 아이돌이 없습니다
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Search Input */}
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder={t("searchPlaceholder")}
                    autoFocus
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <motion.button
                    onClick={handleSearch}
                    disabled={isSearching || !query.trim()}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
                    {...pressScale}
                  >
                    {isSearching ? t("searching") : t("searchButton")}
                  </motion.button>
                </div>
              </div>

              {/* Platform Filter */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mr-0.5 sm:mr-1">
                  {t("platform")}:
                </span>
                {PLATFORMS.map((platform) => {
                  const isEnabled = enabledPlatforms.has(platform.id);
                  return (
                    <motion.button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                        isEnabled
                          ? `${platform.bgColor} ${platform.color} ring-2 ${platform.ringColor}`
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                      }`}
                      {...pressScale}
                    >
                      {platform.label}
                    </motion.button>
                  );
                })}
              </div>

              {/* Platform Notice - Selca */}
              {enabledPlatforms.has("selca") && (
                <div className="h-auto flex items-center text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg">
                  💡 아이돌을 선택하거나 영문 이름으로 검색하세요
                </div>
              )}

              {/* Results */}
              {platformResults.size > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  {/* Results header with selection controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                      {anyLoading
                        ? "검색 중..."
                        : `총 ${totalResults}개의 결과`}
                    </p>

                    {/* Selection controls */}
                    {selectableCount > 0 && (
                      <div className="flex items-center gap-2">
                        {selectedCount > 0 && (
                          <span className="text-xs sm:text-sm text-primary font-medium">
                            {selectedCount}개 선택
                            {(() => {
                              const platformsWithSelection = PLATFORMS.filter(
                                (p) => enabledPlatforms.has(p.id) && getSelectedCountByPlatform(p.id) > 0
                              );
                              if (platformsWithSelection.length > 1) {
                                return (
                                  <span className="text-zinc-400 dark:text-zinc-500 font-normal ml-1">
                                    ({platformsWithSelection.length}개 플랫폼)
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </span>
                        )}
                        <motion.button
                          onClick={
                            selectedCount === selectableCount
                              ? clearSelection
                              : selectAll
                          }
                          className="px-2 sm:px-3 py-1 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          {...pressScale}
                        >
                          {selectedCount === selectableCount
                            ? "선택 해제"
                            : "전체 선택"}
                        </motion.button>
                        {selectedCount > 0 && (
                          <motion.button
                            onClick={handleBatchSave}
                            disabled={isBatchSaving}
                            className="px-3 sm:px-4 py-1 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
                            {...pressScale}
                          >
                            {isBatchSaving
                              ? "저장 중..."
                              : `${selectedCount}개 저장`}
                          </motion.button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Results Grid - Grouped by Platform */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {PLATFORMS.filter((p) => enabledPlatforms.has(p.id)).map(
                      (platformConfig) => {
                        const platformData = platformResults.get(
                          platformConfig.id
                        );
                        if (!platformData) return null;

                        return (
                          <div key={platformConfig.id} className="space-y-2">
                            {/* Platform Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs sm:text-sm font-medium ${platformConfig.color}`}
                                >
                                  {platformConfig.label}
                                </span>
                                {platformData.isLoading && (
                                  <svg
                                    className="w-4 h-4 animate-spin text-zinc-400"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                )}
                                {!platformData.isLoading && (
                                  <span className="text-xs text-zinc-400">
                                    ({platformData.results.length}개)
                                    {/* Show page info for heye/kgirls/kgirls-issue */}
                                    {(platformConfig.id === "heye" ||
                                      platformConfig.id === "kgirls" ||
                                      platformConfig.id === "kgirls-issue") &&
                                      platformData.currentPage > 1 && (
                                        <span className="ml-1 text-zinc-500">
                                          · 페이지 {platformData.currentPage}
                                        </span>
                                      )}
                                  </span>
                                )}
                              </div>

                              {/* Platform Selection Button */}
                              {(() => {
                                const selectable = getSelectableByPlatform(platformConfig.id);
                                const selectedInPlatform = getSelectedCountByPlatform(platformConfig.id);
                                if (selectable.length === 0) return null;

                                const isAllSelected = selectedInPlatform === selectable.length;

                                return (
                                  <div className="flex items-center gap-1.5">
                                    {selectedInPlatform > 0 && (
                                      <span className="text-xs text-primary">
                                        {selectedInPlatform}개
                                      </span>
                                    )}
                                    <motion.button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        togglePlatformSelection(platformConfig.id);
                                      }}
                                      className={`px-2 py-0.5 text-xs rounded transition-colors ${
                                        isAllSelected
                                          ? 'bg-primary/10 text-primary'
                                          : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                                      }`}
                                      {...pressScale}
                                    >
                                      {isAllSelected ? '해제' : '선택'}
                                    </motion.button>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Platform Error */}
                            {platformData.error && (
                              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                {platformData.error}
                              </p>
                            )}

                            {/* Cached Results - 오늘 본 결과 */}
                            {cachedResults.get(platformConfig.id) &&
                              cachedResults.get(platformConfig.id)!.results
                                .length > 0 && (
                                <div className="space-y-1.5">
                                  <button
                                    onClick={() =>
                                      toggleShowCached(platformConfig.id)
                                    }
                                    className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                                  >
                                    <svg
                                      className={`w-3 h-3 transition-transform ${
                                        showCached.get(platformConfig.id)
                                          ? "rotate-90"
                                          : ""
                                      }`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                      />
                                    </svg>
                                    <span>
                                      오늘 본 결과 (
                                      {
                                        cachedResults.get(platformConfig.id)!
                                          .results.length
                                      }
                                      개)
                                    </span>
                                  </button>

                                  {showCached.get(platformConfig.id) && (
                                    <div className="space-y-1.5 sm:space-y-2 opacity-60">
                                      {cachedResults
                                        .get(platformConfig.id)!
                                        .results.map((result) => (
                                          <div
                                            key={`cached-${result.url}`}
                                            className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-zinc-100 dark:bg-zinc-800/30 rounded-lg border border-zinc-200 dark:border-zinc-700"
                                          >
                                            {/* Thumbnail */}
                                            {result.thumbnailUrl ? (
                                              isVideoUrl(result.thumbnailUrl) ? (
                                                <video
                                                  src={result.thumbnailUrl}
                                                  className="w-16 h-12 sm:w-20 sm:h-14 object-cover rounded flex-shrink-0"
                                                  muted
                                                  playsInline
                                                  preload="metadata"
                                                />
                                              ) : (
                                                // eslint-disable-next-line @next/next/no-img-element -- External thumbnail URLs
                                                <img
                                                  src={result.thumbnailUrl}
                                                  alt=""
                                                  className="w-16 h-12 sm:w-20 sm:h-14 object-cover rounded flex-shrink-0"
                                                />
                                              )
                                            ) : (
                                              <div className="w-16 h-12 sm:w-20 sm:h-14 bg-zinc-200 dark:bg-zinc-700 rounded flex-shrink-0 flex items-center justify-center">
                                                <span className="text-[10px] sm:text-xs text-zinc-400">
                                                  No img
                                                </span>
                                              </div>
                                            )}

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                              <h4 className="text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300 line-clamp-2">
                                                {result.title}
                                              </h4>
                                              <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                                                {result.author && (
                                                  <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[80px] sm:max-w-[120px]">
                                                    {result.author}
                                                  </span>
                                                )}
                                              </div>
                                            </div>

                                            {/* Status */}
                                            <div className="flex-shrink-0 flex items-center">
                                              {result.isSaved ? (
                                                <span className="text-[10px] sm:text-xs text-green-600 dark:text-green-400">
                                                  저장됨
                                                </span>
                                              ) : result.isSaving ? (
                                                <svg
                                                  className="w-4 h-4 animate-spin text-zinc-400"
                                                  viewBox="0 0 24 24"
                                                  fill="none"
                                                >
                                                  <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                  />
                                                  <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                  />
                                                </svg>
                                              ) : (
                                                <motion.button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSaveCachedResult(
                                                      platformConfig.id,
                                                      result
                                                    );
                                                  }}
                                                  className="p-1.5 sm:p-1 text-zinc-400 hover:text-primary transition-colors"
                                                  whileTap={{ scale: 0.9 }}
                                                >
                                                  <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                      d="M12 4v16m8-8H4"
                                                    />
                                                  </svg>
                                                </motion.button>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              )}

                            {/* Platform Results */}
                            {platformData.results.length > 0 && (
                              <div className="space-y-1.5 sm:space-y-2">
                                {platformData.results.map((result) => (
                                  <div
                                    key={result.url}
                                    className={`flex gap-2 sm:gap-3 p-2 sm:p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border transition-colors cursor-pointer ${
                                      selectedUrls.has(result.url)
                                        ? "border-primary ring-2 ring-primary/20"
                                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                                    }`}
                                    onClick={() =>
                                      !result.isSaved &&
                                      toggleSelection(result.url)
                                    }
                                  >
                                    {/* Checkbox */}
                                    <div className="flex-shrink-0 flex items-start pt-0.5 sm:pt-1">
                                      <input
                                        type="checkbox"
                                        checked={selectedUrls.has(result.url)}
                                        onChange={() =>
                                          toggleSelection(result.url)
                                        }
                                        disabled={result.isSaved}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-primary focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                      />
                                    </div>

                                    {/* Thumbnail */}
                                    {result.thumbnailUrl ? (
                                      isVideoUrl(result.thumbnailUrl) ? (
                                        <video
                                          src={result.thumbnailUrl}
                                          className="w-16 h-12 sm:w-20 sm:h-14 object-cover rounded flex-shrink-0"
                                          muted
                                          playsInline
                                          preload="metadata"
                                        />
                                      ) : (
                                        // eslint-disable-next-line @next/next/no-img-element -- External thumbnail URLs
                                        <img
                                          src={result.thumbnailUrl}
                                          alt=""
                                          className="w-16 h-12 sm:w-20 sm:h-14 object-cover rounded flex-shrink-0"
                                        />
                                      )
                                    ) : (
                                      <div className="w-16 h-12 sm:w-20 sm:h-14 bg-zinc-200 dark:bg-zinc-700 rounded flex-shrink-0 flex items-center justify-center">
                                        <span className="text-[10px] sm:text-xs text-zinc-400">
                                          No img
                                        </span>
                                      </div>
                                    )}

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-[11px] sm:text-xs font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                                        {result.title}
                                      </h4>
                                      <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                                        {result.author && (
                                          <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[80px] sm:max-w-[120px]">
                                            {result.author}
                                          </span>
                                        )}
                                        {result.publishedAt && (
                                          <span className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 hidden sm:inline">
                                            {formatDate(result.publishedAt)}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Status */}
                                    <div className="flex-shrink-0 flex items-center">
                                      {result.isSaved ? (
                                        <span className="text-[10px] sm:text-xs text-green-600 dark:text-green-400">
                                          저장됨
                                        </span>
                                      ) : result.isSaving ? (
                                        <svg
                                          className="w-4 h-4 animate-spin text-zinc-400"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                        >
                                          <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                          />
                                          <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                          />
                                        </svg>
                                      ) : (
                                        <motion.button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSave(result);
                                          }}
                                          className="p-1.5 sm:p-1 text-zinc-400 hover:text-primary transition-colors"
                                          whileTap={{ scale: 0.9 }}
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M12 4v16m8-8H4"
                                            />
                                          </svg>
                                        </motion.button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Empty state for platform */}
                            {!platformData.isLoading &&
                              !platformData.error &&
                              platformData.results.length === 0 && (
                                <p className="text-xs text-zinc-400 text-center py-4">
                                  검색 결과 없음
                                </p>
                              )}

                            {/* Load More Button */}
                            {platformData.hasMore &&
                              !platformData.isLoading && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!platformData.isLoadingMore) {
                                      handleLoadMore(platformConfig.id);
                                    }
                                  }}
                                  disabled={platformData.isLoadingMore}
                                  className="w-full py-3 sm:py-2 text-xs font-medium text-primary hover:text-primary-dark hover:bg-primary/5 active:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                >
                                  {platformData.isLoadingMore ? (
                                    <>
                                      <svg
                                        className="w-3 h-3 animate-spin"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        />
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                      </svg>
                                      <span>불러오는 중...</span>
                                    </>
                                  ) : (
                                    <>
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 9l-7 7-7-7"
                                        />
                                      </svg>
                                      <span>더 보기</span>
                                    </>
                                  )}
                                </button>
                              )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* Initial State */}
              {!isSearching && totalResults === 0 && !query && (
                <div className="text-center py-12">
                  <p className="text-zinc-500 dark:text-zinc-400 mb-2">
                    바이어스를 선택하거나 검색어를 입력하세요
                  </p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    모든 플랫폼에서 동시에 검색합니다
                  </p>
                </div>
              )}

              {/* Empty Results State */}
              {!isSearching &&
                !anyLoading &&
                totalResults === 0 &&
                query &&
                platformResults.size > 0 && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
                    검색 결과가 없습니다
                  </p>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-2 sm:py-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-b-xl">
              <p className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 text-center">
                ESC 키로 닫기 • 선택한 플랫폼에서 동시 검색
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
