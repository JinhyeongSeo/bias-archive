import { motion } from 'framer-motion';
import type { EnrichedResult } from '@/types/index';
import { isVideoUrl } from '@/lib/proxy';
import { pressScale } from '@/lib/animations';

interface SearchResultCardProps {
  result: EnrichedResult;
  onSave: (result: EnrichedResult) => void;
  onToggleSelect: (url: string) => void;
  onPreview: (result: EnrichedResult) => void;
  isSelected: boolean;
}

export function SearchResultCard({
  result,
  onSave,
  onToggleSelect,
  onPreview,
  isSelected,
}: SearchResultCardProps) {
  return (
    <div
      className={`flex gap-2 sm:gap-3 p-2 sm:p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border transition-colors cursor-pointer ${
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
      }`}
      onClick={() => !result.isSaved && onToggleSelect(result.url)}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0 flex items-start pt-0.5 sm:pt-1">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(result.url)}
          disabled={result.isSaved}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-primary focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        />
      </div>

      {/* Thumbnail - click to preview */}
      <div
        className="flex-shrink-0 cursor-pointer relative group"
        onClick={(e) => {
          e.stopPropagation();
          onPreview(result);
        }}
      >
        {result.thumbnailUrl ? (
          isVideoUrl(result.thumbnailUrl) ? (
            <video
              src={result.thumbnailUrl}
              className="w-16 h-12 sm:w-20 sm:h-14 object-cover rounded"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.thumbnailUrl}
              alt=""
              className="w-16 h-12 sm:w-20 sm:h-14 object-cover rounded"
            />
          )
        ) : (
          <div className="w-16 h-12 sm:w-20 sm:h-14 bg-zinc-200 dark:bg-zinc-700 rounded flex items-center justify-center">
            <span className="text-[10px] sm:text-xs text-zinc-400">
              No img
            </span>
          </div>
        )}
        {/* Preview overlay icon */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded transition-colors flex items-center justify-center">
          <svg className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>

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
              {new Date(result.publishedAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>

      {/* Status / Save Button */}
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
              onSave(result);
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
  );
}
