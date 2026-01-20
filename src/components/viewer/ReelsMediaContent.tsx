import type { useMotionValue, useTransform } from 'framer-motion';
import { motion } from 'framer-motion';
import Image from 'next/image';
import type { Link, Tag, LinkMedia } from '@/types/database';
import type { Platform } from '@/lib/metadata';
import { getProxiedImageUrl } from '@/lib/proxy';
import { YouTubeEmbed } from './YouTubeEmbed';
import { MediaItemRenderer } from './MediaItemRenderer';

type LinkWithMedia = Link & { media?: LinkMedia[] };
type FullLink = Link & { tags: Tag[] } & LinkWithMedia;

interface ReelsMediaContentProps {
  link: FullLink;
  platform: Platform;
  isActive?: boolean;
  mediaIndex?: number;
  previewActiveMediaIndex?: number | null;
  onMediaIndexChange?: (index: number) => void;
  onAnimateToMedia?: (direction: 'prev' | 'next') => void;
  dragX?: ReturnType<typeof useMotionValue<number>>;
  prevMediaX?: ReturnType<typeof useTransform<number, number>>;
  nextMediaX?: ReturnType<typeof useTransform<number, number>>;
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?/]+)/,
    /youtube\.com\/v\/([^&?/]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

export function ReelsMediaContent({
  link,
  platform,
  isActive = true,
  mediaIndex = 0,
  previewActiveMediaIndex,
  onMediaIndexChange,
  onAnimateToMedia,
  dragX,
  prevMediaX,
  nextMediaX
}: ReelsMediaContentProps) {
  const mediaItems = link.media?.filter(
    m => m.media_type === 'image' || m.media_type === 'gif' || m.media_type === 'video'
  ) || [];

  const safeMediaIndex = Math.max(0, Math.min(mediaIndex, mediaItems.length - 1));

  if (platform === 'youtube') {
    const videoId = extractYouTubeVideoId(link.url);
    if (videoId) {
      return (
        <YouTubeEmbed
          videoId={videoId}
          title={link.title}
          isActive={isActive}
        />
      );
    }
  }

  if (mediaItems.length > 0) {
    const visibleMediaIndices: number[] = [];
    if (safeMediaIndex > 0) visibleMediaIndices.push(safeMediaIndex - 1);
    visibleMediaIndices.push(safeMediaIndex);
    if (safeMediaIndex < mediaItems.length - 1) visibleMediaIndices.push(safeMediaIndex + 1);

    const activeMediaIdx = previewActiveMediaIndex !== null && previewActiveMediaIndex !== undefined
      ? previewActiveMediaIndex
      : safeMediaIndex;

    return (
      <div className="relative w-full h-full overflow-hidden">
        {visibleMediaIndices.map((idx) => {
          const media = mediaItems[idx];
          const offset = idx - safeMediaIndex;
          const xStyle = offset === -1 ? prevMediaX : offset === 0 ? dragX : nextMediaX;

          return (
            <motion.div
              key={media.media_url}
              className="absolute inset-0 flex items-center justify-center"
              style={{ x: xStyle }}
            >
              <MediaItemRenderer
                media={media}
                title={link.title}
                originalUrl={link.url}
                isActive={isActive && activeMediaIdx === idx}
              />
            </motion.div>
          );
        })}

        {mediaItems.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onAnimateToMedia && safeMediaIndex > 0) {
                  onAnimateToMedia('prev');
                } else if (onMediaIndexChange) {
                  const newIndex = safeMediaIndex === 0 ? mediaItems.length - 1 : safeMediaIndex - 1;
                  onMediaIndexChange(newIndex);
                }
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onAnimateToMedia && safeMediaIndex < mediaItems.length - 1) {
                  onAnimateToMedia('next');
                } else if (onMediaIndexChange) {
                  const newIndex = safeMediaIndex === mediaItems.length - 1 ? 0 : safeMediaIndex + 1;
                  onMediaIndexChange(newIndex);
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {mediaItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMediaIndexChange?.(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === safeMediaIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>

            <div className="absolute top-16 right-4 px-3 py-1 rounded-full bg-black/50 text-white text-sm z-10">
              {safeMediaIndex + 1} / {mediaItems.length}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      {link.thumbnail_url ? (
        <div className="relative w-full h-full max-w-2xl">
          <Image
            src={getProxiedImageUrl(link.thumbnail_url)}
            alt={link.title || 'Thumbnail'}
            fill
            className="object-contain select-none pointer-events-none"
            priority
            unoptimized
            draggable={false}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-white/50">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p className="text-sm">미디어를 불러올 수 없습니다</p>
        </div>
      )}
    </div>
  );
}
