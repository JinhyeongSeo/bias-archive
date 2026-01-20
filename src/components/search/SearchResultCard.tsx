import { motion } from 'framer-motion';
import Image from 'next/image';
import type { Platform, EnrichedResult } from '@/types/index';
import { pressScale } from '@/lib/animations';

interface SearchResultCardProps {
  result: EnrichedResult;
  onSave: (result: EnrichedResult) => void;
  onToggleSelect: (url: string) => void;
  isSelected: boolean;
  isBatchMode: boolean;
  platformColor: string;
  platformBg: string;
  platformLabel: string;
}

export function SearchResultCard({
  result,
  onSave,
  onToggleSelect,
  isSelected,
  isBatchMode,
  platformColor,
  platformBg,
  platformLabel,
}: SearchResultCardProps) {
  const isVideo = result.url.includes('youtube.com') || result.url.includes('youtu.be') || result.media?.some(m => m.type === 'video');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative bg-card rounded-xl overflow-hidden border transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary border-primary' : 'border-border'
      }`}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {result.thumbnailUrl ? (
          <Image
            src={result.thumbnailUrl}
            alt={result.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {isVideo && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            VIDEO
          </div>
        )}

        {result.platform === 'instagram' && result.media && result.media.length > 1 && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {result.media.length}장
          </div>
        )}

        {isBatchMode && (
          <div 
            className={`absolute inset-0 transition-colors cursor-pointer flex items-center justify-center ${
              isSelected ? 'bg-primary/20' : 'bg-black/0 hover:bg-black/10'
            }`}
            onClick={() => onToggleSelect(result.url)}
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected ? 'bg-primary border-primary text-white scale-110' : 'bg-black/20 border-white text-transparent'
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${platformBg} ${platformColor}`}>
            {platformLabel}
          </span>
          <span className="text-[10px] text-muted-foreground truncate flex-1">
            {result.author}
          </span>
        </div>
        <h3 className="text-sm font-medium line-clamp-2 leading-snug h-10 mb-3 group-hover:text-primary transition-colors">
          {result.title}
        </h3>

        {!isBatchMode && (
          <div className="flex gap-2">
            <motion.a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-center"
              whileTap={{ scale: 0.95 }}
            >
              열기
            </motion.a>
            <motion.button
              onClick={() => onSave(result)}
              disabled={result.isSaved || result.isSaving}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                result.isSaved
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-default'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
              whileTap={result.isSaved || result.isSaving ? {} : { scale: 0.95 }}
            >
              {result.isSaving ? '저장 중...' : result.isSaved ? '저장됨' : '저장'}
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
