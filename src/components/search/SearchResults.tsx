import { motion, AnimatePresence } from 'framer-motion';
import type { Platform, PlatformResults, EnrichedResult } from '@/types/index';
import { SearchResultCard } from './SearchResultCard';
import { pressScale } from '@/lib/animations';

interface SearchResultsProps {
  platform: Platform;
  results: PlatformResults;
  cachedResults?: { results: EnrichedResult[] };
  showCached: boolean;
  toggleShowCached: () => void;
  onSave: (result: EnrichedResult) => void;
  onToggleSelect: (url: string) => void;
  selectedUrls: Set<string>;
  isBatchMode: boolean;
  handleLoadMore: () => void;
  platformConfig: {
    label: string;
    color: string;
    bgColor: string;
  };
  t: (key: string) => string;
}

export function SearchResults({
  platform,
  results,
  cachedResults,
  showCached,
  toggleShowCached,
  onSave,
  onToggleSelect,
  selectedUrls,
  isBatchMode,
  handleLoadMore,
  platformConfig,
  t,
}: SearchResultsProps) {
  const hasResults = results.results.length > 0;
  const hasCached = cachedResults && cachedResults.results.length > 0;

  if (results.isLoading && !hasResults) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground animate-pulse">{platformConfig.label} 검색 중...</p>
      </div>
    );
  }

  if (results.error && !hasResults) {
    return (
      <div className="py-12 px-6 text-center bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
        <p className="text-red-600 dark:text-red-400 font-medium mb-2">{results.error}</p>
        <button 
          onClick={handleLoadMore}
          className="text-sm underline text-red-500 hover:no-underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!hasResults && !results.isLoading) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">{t('noResults')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {hasCached && (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-border/50">
          <button
            onClick={toggleShowCached}
            className="w-full flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>이전에 본 결과 ({cachedResults.results.length})</span>
            </div>
            <svg
              className={`w-4 h-4 transition-transform ${showCached ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <AnimatePresence>
            {showCached && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                  {cachedResults.results.map((result) => (
                    <SearchResultCard
                      key={result.url}
                      result={result}
                      onSave={onSave}
                      onToggleSelect={onToggleSelect}
                      isSelected={selectedUrls.has(result.url)}
                      isBatchMode={isBatchMode}
                      platformColor={platformConfig.color}
                      platformBg={platformConfig.bgColor}
                      platformLabel={platformConfig.label}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.results.map((result) => (
          <SearchResultCard
            key={result.url}
            result={result}
            onSave={onSave}
            onToggleSelect={onToggleSelect}
            isSelected={selectedUrls.has(result.url)}
            isBatchMode={isBatchMode}
            platformColor={platformConfig.color}
            platformBg={platformConfig.bgColor}
            platformLabel={platformConfig.label}
          />
        ))}
      </div>

      {results.hasMore && (
        <div className="flex justify-center pt-4">
          <motion.button
            onClick={handleLoadMore}
            disabled={results.isLoadingMore}
            className="px-10 py-3 bg-zinc-100 dark:bg-zinc-800 text-foreground font-semibold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-all flex items-center gap-3"
            {...pressScale}
          >
            {results.isLoadingMore ? (
              <>
                <svg className="w-5 h-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>불러오는 중...</span>
              </>
            ) : (
              <>
                <span>더 보기</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
}
