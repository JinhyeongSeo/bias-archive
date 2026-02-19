import { motion, AnimatePresence } from 'framer-motion';
import type { Platform, PlatformResults, EnrichedResult } from '@/types/index';
import { SearchResultCard } from './SearchResultCard';
import { pressScale } from '@/lib/animations';

interface SearchResultsProps {
  enabledPlatforms: Set<Platform>;
  platformResults: Map<Platform, PlatformResults>;
  cachedResults: Map<Platform, { results: EnrichedResult[] }>;
  showCached: Map<Platform, boolean>;
  toggleShowCached: (platform: Platform) => void;
  onSave: (result: EnrichedResult) => void;
  onToggleSelect: (url: string) => void;
  onSelectAllPlatform: (platform: Platform) => void;
  onPreview: (result: EnrichedResult) => void;
  selectedUrls: Set<string>;
  handleLoadMore: (platform: Platform) => void;
  platformsConfig: {
    id: Platform;
    label: string;
    color: string;
    bgColor: string;
  }[];
}

export function SearchResults({
  enabledPlatforms,
  platformResults,
  cachedResults,
  showCached,
  toggleShowCached,
  onSave,
  onToggleSelect,
  onSelectAllPlatform,
  onPreview,
  selectedUrls,
  handleLoadMore,
  platformsConfig,
}: SearchResultsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      {platformsConfig
        .filter((p) => enabledPlatforms.has(p.id))
        .map((platformConfig) => {
          const platformData = platformResults.get(platformConfig.id);
          if (!platformData) return null;

          const cached = cachedResults.get(platformConfig.id);
          const showCachedPlatform = showCached.get(platformConfig.id) || false;

          const selectableInPlatform = platformData.results.filter((r) => !r.isSaved);
          const selectedInPlatform = selectableInPlatform.filter((r) => selectedUrls.has(r.url));
          const allSelectedInPlatform = selectableInPlatform.length > 0 && selectedInPlatform.length === selectableInPlatform.length;

          return (
            <div key={platformConfig.id} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs sm:text-sm font-medium ${platformConfig.color}`}>
                    {platformConfig.label}
                  </span>
                  {platformData.isLoading ? (
                    <svg className="w-4 h-4 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <span className="text-xs text-zinc-400">
                      ({platformData.results.length}개)
                      {platformData.currentPage > 1 && ` · 페이지 ${platformData.currentPage}`}
                    </span>
                  )}
                </div>

                {selectableInPlatform.length > 0 && !platformData.isLoading && (
                  <button
                    onClick={() => onSelectAllPlatform(platformConfig.id)}
                    className="text-[10px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    {allSelectedInPlatform ? '선택 해제' : '전체 선택'}
                  </button>
                )}
              </div>

              {platformData.error && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  {platformData.error}
                </p>
              )}

              {cached && cached.results.length > 0 && (
                <div className="space-y-1.5">
                  <button
                    onClick={() => toggleShowCached(platformConfig.id)}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                  >
                    <svg
                      className={`w-3 h-3 transition-transform ${showCachedPlatform ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>오늘 본 결과 ({cached.results.length}개)</span>
                  </button>

                  <AnimatePresence>
                    {showCachedPlatform && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-1.5 sm:space-y-2 opacity-60"
                      >
                        {cached.results.map((result) => (
                          <SearchResultCard
                            key={`cached-${result.url}`}
                            result={result}
                            onSave={onSave}
                            onToggleSelect={onToggleSelect}
                            onPreview={onPreview}
                            isSelected={selectedUrls.has(result.url)}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="space-y-1.5 sm:space-y-2">
                {platformData.results.map((result) => (
                  <SearchResultCard
                    key={result.url}
                    result={result}
                    onSave={onSave}
                    onToggleSelect={onToggleSelect}
                    onPreview={onPreview}
                    isSelected={selectedUrls.has(result.url)}
                  />
                ))}
              </div>

              {platformData.hasMore && !platformData.isLoading && (
                <button
                  onClick={() => handleLoadMore(platformConfig.id)}
                  disabled={platformData.isLoadingMore}
                  className="w-full py-2.5 sm:py-2 text-xs font-medium text-primary hover:text-primary-dark hover:bg-primary/5 active:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {platformData.isLoadingMore ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>불러오는 중...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <span>더 보기</span>
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
    </div>
  );
}
