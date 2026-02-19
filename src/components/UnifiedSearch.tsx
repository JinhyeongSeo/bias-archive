"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { extractOriginalUrl } from "@/lib/proxy";
import {
  modalOverlay,
  modalContent,
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
import { SearchResults } from "./search/SearchResults";
import { SearchPreviewModal } from "./search/SearchPreviewModal";

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
  const [previewResult, setPreviewResult] = useState<EnrichedResult | null>(null);

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
    markAsSaved,
    markAsSaving,
  } = useSearchLogic({ query, savedUrls, biases, groups, enabledPlatforms });

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
    markAsSaving(url, true);
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

      if (response.ok || response.status === 409) {
        markAsSaved(url);
        onSave?.();
      } else {
        markAsSaving(url, false);
        const data = await response.json();
        alert(data.error || "저장에 실패했습니다");
      }
    } catch (error) {
      markAsSaving(url, false);
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

  const handleSelectAllPlatform = (platform: Platform) => {
    const platformData = platformResults.get(platform);
    if (!platformData) return;
    const selectableInPlatform = platformData.results.filter((r) => !r.isSaved);
    const allSelected = selectableInPlatform.length > 0 && selectableInPlatform.every((r) => selectedUrls.has(r.url));

    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        selectableInPlatform.forEach((r) => next.delete(r.url));
      } else {
        selectableInPlatform.forEach((r) => next.add(r.url));
      }
      return next;
    });
  };

  const handleBatchSave = async () => {
    if (selectedUrls.size === 0) return;
    setIsBatchSaving(true);
    let successCount = 0;
    let failCount = 0;

    const allResultsList = Array.from(platformResults.values()).flatMap((r) => r.results);
    const selectedResults = allResultsList.filter((r) => selectedUrls.has(r.url));

    selectedUrls.forEach(url => markAsSaving(url, true));

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
        if (response.ok || response.status === 409) {
          markAsSaved(result.url);
          successCount++;
        } else {
          markAsSaving(result.url, false);
          failCount++;
        }
      } catch {
        markAsSaving(result.url, false);
        failCount++;
      }
    }

    alert(`${successCount}개 저장 완료, ${failCount}개 실패`);
    setSelectedUrls(new Set());
    setIsBatchSaving(false);
    onSave?.();
  };

  const totalResultsCount = Array.from(platformResults.values()).reduce((sum, r) => sum + r.results.length, 0);
  const anyLoading = Array.from(platformResults.values()).some(p => p.isLoading);
  const selectableResults = Array.from(platformResults.values()).flatMap(r => r.results).filter(r => !r.isSaved);
  const selectedCount = selectedUrls.size;

  if (!isOpen) return null;

  return (
    <>
    <AnimatePresence>
      <motion.div
        initial="initial" animate="animate" exit="exit" variants={modalOverlay}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          variants={modalContent}
          className="relative bg-background rounded-xl shadow-2xl border border-border w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              통합 검색
            </h2>
            <motion.button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
            <SearchInput
              query={query} setQuery={setQuery} onSearch={handleSearch} isSearching={isSearching}
              isIdolDropdownOpen={isIdolDropdownOpen} setIsIdolDropdownOpen={setIsIdolDropdownOpen}
              getSelectionDisplayName={getSelectionDisplayName} groupedBiases={groupedBiases}
              collapsedDropdownGroups={collapsedDropdownGroups} toggleDropdownGroupCollapse={toggleDropdownGroupCollapse}
              handleSelection={setSelection} getGroupDisplayName={getGroupDisplayName} getDisplayName={getDisplayName}
              dropdownRef={dropdownRef} dropdownButtonRef={dropdownButtonRef} dropdownPosition={dropdownPosition} t={t}
            />

            <SearchFilters platforms={PLATFORMS} enabledPlatforms={enabledPlatforms} togglePlatform={togglePlatform} t={t} />

            {enabledPlatforms.has("selca") && (
              <div className="h-auto flex items-center text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg">
                💡 아이돌을 선택하거나 영문 이름으로 검색하세요
              </div>
            )}

            {platformResults.size > 0 && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {anyLoading ? "검색 중..." : `총 ${totalResultsCount}개의 결과`}
                  </p>

                  {selectableResults.length > 0 && (
                    <div className="flex items-center gap-2">
                      {selectedCount > 0 && (
                        <span className="text-xs sm:text-sm text-primary font-medium">
                          {selectedCount}개 선택
                        </span>
                      )}
                      <motion.button
                        onClick={() => {
                          if (selectedCount === selectableResults.length) setSelectedUrls(new Set());
                          else setSelectedUrls(new Set(selectableResults.map(r => r.url)));
                        }}
                        className="px-2 sm:px-3 py-1 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        whileTap={{ scale: 0.95 }}
                      >
                        {selectedCount === selectableResults.length ? "선택 해제" : "전체 선택"}
                      </motion.button>
                      {selectedCount > 0 && (
                        <motion.button
                          onClick={handleBatchSave} disabled={isBatchSaving}
                          className="px-3 sm:px-4 py-1 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
                          whileTap={{ scale: 0.95 }}
                        >
                          {isBatchSaving ? "저장 중..." : `${selectedCount}개 저장`}
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>

                <SearchResults
                  enabledPlatforms={enabledPlatforms}
                  platformResults={platformResults}
                  cachedResults={cachedResults}
                  showCached={showCached}
                  toggleShowCached={toggleShowCached}
                  onSave={handleSaveResult}
                  onToggleSelect={toggleUrlSelection}
                  onSelectAllPlatform={handleSelectAllPlatform}
                  onPreview={setPreviewResult}
                  selectedUrls={selectedUrls}
                  handleLoadMore={handleLoadMore}
                  platformsConfig={PLATFORMS}
                />
              </div>
            )}

            {!isSearching && totalResultsCount === 0 && !query && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-2">바이어스를 선택하거나 검색어를 입력하세요</p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500">모든 플랫폼에서 동시에 검색합니다</p>
              </div>
            )}

            {!isSearching && !anyLoading && totalResultsCount === 0 && query && platformResults.size > 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">검색 결과가 없습니다</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>

    <SearchPreviewModal
      result={previewResult}
      isOpen={!!previewResult}
      onClose={() => setPreviewResult(null)}
      onSave={handleSaveResult}
    />
    </>
  );
}
