"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { extractOriginalUrl } from "@/lib/proxy";
import {
  modalOverlay,
  modalContent,
  easeOutExpo,
} from "@/lib/animations";
import { useNameLanguage } from "@/contexts/NameLanguageContext";
import { useTranslations, useLocale } from "next-intl";
import type { 
  Bias, 
  BiasWithGroup, 
  Group, 
  Platform, 
  EnrichedResult, 
  ParsedMedia
} from "@/types/index";
import { useSearchLogic } from "@/hooks/useSearchLogic";
import { SearchInput } from "./search/SearchInput";
import { SearchFilters } from "./search/SearchFilters";
import { PlatformTabs } from "./search/PlatformTabs";
import { SearchResults } from "./search/SearchResults";

// Selection type for idol dropdown
type Selection =
  | { type: "bias"; id: string }
  | { type: "group"; id: string }
  | null;

interface UnifiedSearchProps {
  isOpen: boolean;
  onClose: () => void;
  savedUrls: string[];
  onSave?: () => void;
  biases: Bias[];
  groups: Group[];
}

const PLATFORMS: {
  id: Platform;
  label: string;
  color: string;
  bgColor: string;
  ringColor: string;
}[] = [
  { id: "youtube", label: "YouTube", color: "text-red-600 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/50", ringColor: "ring-red-500/20" },
  { id: "twitter", label: "Twitter", color: "text-twitter", bgColor: "bg-twitter/10", ringColor: "ring-twitter/20" },
  { id: "heye", label: "heye.kr", color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900/50", ringColor: "ring-orange-500/20" },
  { id: "kgirls", label: "kgirls", color: "text-pink-600 dark:text-pink-400", bgColor: "bg-pink-100 dark:bg-pink-900/50", ringColor: "ring-pink-500/20" },
  { id: "kgirls-issue", label: "kgirls issue", color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/50", ringColor: "ring-purple-500/20" },
  { id: "selca", label: "Selca", color: "text-purple-700 dark:text-purple-300", bgColor: "bg-purple-100 dark:bg-purple-900/50", ringColor: "ring-purple-500/20" },
  { id: "instagram", label: "Instagram", color: "text-pink-600 dark:text-pink-400", bgColor: "bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50", ringColor: "ring-pink-500/20" },
];

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

  const getGroupDisplayName = useCallback((group: Group): string => {
    if (locale === "ko") return group.name_ko || group.name;
    return group.name_en || group.name;
  }, [locale]);

  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Selection>(null);
  const [isIdolDropdownOpen, setIsIdolDropdownOpen] = useState(false);
  const [collapsedDropdownGroups, setCollapsedDropdownGroups] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [enabledPlatforms, setEnabledPlatforms] = useState<Set<Platform>>(
    new Set(["youtube", "twitter", "heye", "kgirls", "kgirls-issue", "selca", "instagram"])
  );
  const [activePlatform, setActivePlatform] = useState<Platform>("youtube");

  const {
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
    removeKoreanSurname,
  } = useSearchLogic({ query, savedUrls, biases, groups, enabledPlatforms });

  useEffect(() => {
    if (!enabledPlatforms.has(activePlatform)) {
      const firstEnabled = Array.from(enabledPlatforms)[0];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (firstEnabled) setActivePlatform(firstEnabled);
    }
  }, [enabledPlatforms, activePlatform]);

  const biasesWithGroups = useMemo((): BiasWithGroup[] => {
    const groupMap = new Map<string, Group>();
    for (const group of groups) groupMap.set(group.id, group);
    return biases.map((bias) => ({ ...bias, group: bias.group_id ? groupMap.get(bias.group_id) ?? null : null }));
  }, [biases, groups]);

  const groupedBiases = useMemo(() => {
    const grouped = new Map<string | null, BiasWithGroup[]>();
    const sortedGroups = [...groups].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    for (const group of sortedGroups) {
      const biasesInGroup = biasesWithGroups.filter((b) => b.group_id === group.id);
      if (biasesInGroup.length > 0) grouped.set(group.id, biasesInGroup);
    }
    const ungrouped = biasesWithGroups.filter((b) => !b.group_id);
    if (ungrouped.length > 0) grouped.set(null, ungrouped);
    return grouped;
  }, [biasesWithGroups, groups]);

  const toggleDropdownGroupCollapse = (groupId: string) => {
    setCollapsedDropdownGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const getSelectionDisplayName = useCallback((): string => {
    if (!selection) return t("selectIdol");
    if (selection.type === "group") {
      const group = groups.find((g) => g.id === selection.id);
      return group ? getGroupDisplayName(group) : t("selectIdol");
    } else {
      const bias = biases.find((b) => b.id === selection.id);
      return bias ? getDisplayName(bias) : t("selectIdol");
    }
  }, [selection, groups, biases, getDisplayName, getGroupDisplayName, t]);

  useEffect(() => {
    if (isIdolDropdownOpen) {
      const allGroupIds = new Set(biasesWithGroups.map((b) => b.group_id).filter((id): id is string => id !== null));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsedDropdownGroups(allGroupIds);
      if (dropdownButtonRef.current) {
        const rect = dropdownButtonRef.current.getBoundingClientRect();
        setDropdownPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
      }
    }
  }, [isIdolDropdownOpen, biasesWithGroups]);

  useEffect(() => {
    if (!selection) return;
    if (selection.type === "group") {
      const group = groups.find((g) => g.id === selection.id);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (group) setQuery(getGroupDisplayName(group));
    } else {
      const selectedBias = biases.find((b) => b.id === selection.id);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (selectedBias) setQuery(removeKoreanSurname(selectedBias.name_ko || selectedBias.name));
    }
  }, [selection, groups, biases, getGroupDisplayName, removeKoreanSurname]);

  const togglePlatform = (platform: Platform) => {
    setEnabledPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) {
        if (next.size > 1) next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  const handleSaveResult = async (result: EnrichedResult) => {
    const { url, title, thumbnailUrl, author, platform, media } = result;
    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: extractOriginalUrl(url),
          title,
          thumbnailUrl,
          authorName: author,
          platform,
          biasId: selection?.type === "bias" ? selection.id : null,
          searchQuery: query,
          media: media?.map((m: ParsedMedia) => ({ url: m.url, type: m.type })),
        }),
      });

      if (response.ok) {
        onSave?.();
      } else {
        const data = await response.json();
        alert(data.error || "저장에 실패했습니다");
      }
    } catch (error) {
      alert("저장 중 오류가 발생했습니다");
    }
  };

  const toggleUrlSelection = (url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const handleBatchSave = async () => {
    if (selectedUrls.size === 0) return;
    setIsBatchSaving(true);
    let successCount = 0;
    let failCount = 0;

    const allResults = Array.from(platformResults.values()).flatMap((r) => r.results);
    const selectedResults = allResults.filter((r) => selectedUrls.has(r.url));

    for (const result of selectedResults) {
      try {
        const response = await fetch("/api/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: extractOriginalUrl(result.url),
            title: result.title,
            thumbnailUrl: result.thumbnailUrl,
            authorName: result.author,
            platform: result.platform,
            biasId: selection?.type === "bias" ? selection.id : null,
            searchQuery: query,
            media: result.media?.map((m: ParsedMedia) => ({ url: m.url, type: m.type })),
          }),
        });
        if (response.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    alert(`${successCount}개 저장 완료, ${failCount}개 실패`);
    setSelectedUrls(new Set());
    setIsBatchSaving(false);
    onSave?.();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial="initial" animate="animate" exit="exit" variants={modalOverlay}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          variants={modalContent}
          className="relative bg-card rounded-3xl shadow-2xl border border-border w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 sm:p-8 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {t("title")}
              </h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-accent text-muted-foreground transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <SearchInput
              query={query} setQuery={setQuery} onSearch={handleSearch} isSearching={isSearching}
              isIdolDropdownOpen={isIdolDropdownOpen} setIsIdolDropdownOpen={setIsIdolDropdownOpen}
              getSelectionDisplayName={getSelectionDisplayName} groupedBiases={groupedBiases}
              collapsedDropdownGroups={collapsedDropdownGroups} toggleDropdownGroupCollapse={toggleDropdownGroupCollapse}
              handleSelection={setSelection} getGroupDisplayName={getGroupDisplayName} getDisplayName={getDisplayName}
              dropdownRef={dropdownRef} dropdownButtonRef={dropdownButtonRef} dropdownPosition={dropdownPosition} t={t}
            />

            <SearchFilters platforms={PLATFORMS} enabledPlatforms={enabledPlatforms} togglePlatform={togglePlatform} t={t} />

            <PlatformTabs
              platforms={PLATFORMS} enabledPlatforms={enabledPlatforms} platformResults={platformResults}
              activePlatform={activePlatform} setActivePlatform={setActivePlatform}
            />

            <div className="flex-1 overflow-y-auto pr-2 -mr-2 custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePlatform} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={easeOutExpo} className="min-h-full"
                >
                  <SearchResults
                    platform={activePlatform}
                    results={platformResults.get(activePlatform) || { platform: activePlatform, results: [], hasMore: false, isLoading: false, isLoadingMore: false, error: null, currentPage: 1, currentOffset: 0 }}
                    cachedResults={cachedResults.get(activePlatform)}
                    showCached={showCached.get(activePlatform) || false}
                    toggleShowCached={() => toggleShowCached(activePlatform)}
                    onSave={handleSaveResult}
                    onToggleSelect={toggleUrlSelection}
                    selectedUrls={selectedUrls}
                    isBatchMode={selectedUrls.size > 0}
                    handleLoadMore={() => handleLoadMore(activePlatform)}
                    platformConfig={PLATFORMS.find(p => p.id === activePlatform)!}
                    t={t}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {selectedUrls.size > 0 && (
              <motion.div
                initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-zinc-900 dark:bg-zinc-100 rounded-2xl shadow-2xl border border-white/10 dark:border-black/10 flex items-center gap-6"
              >
                <div className="text-zinc-100 dark:text-zinc-900 font-medium whitespace-nowrap">
                  {selectedUrls.size}개 선택됨
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedUrls(new Set())} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 dark:text-zinc-600 dark:hover:text-zinc-900 transition-colors">
                    취소
                  </button>
                  <motion.button
                    onClick={handleBatchSave} disabled={isBatchSaving}
                    className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    {isBatchSaving ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        저장 중...
                      </>
                    ) : (
                      "모두 저장"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
