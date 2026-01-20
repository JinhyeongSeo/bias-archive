import Image from 'next/image';
import type { LinkMedia } from '@/types/database';
import { getProxiedImageUrl } from '@/lib/proxy';
import { VideoWithFallback } from './VideoWithFallback';

interface MediaItemRendererProps {
  media: LinkMedia;
  title: string | null;
  originalUrl: string;
  isActive: boolean;
}

export function MediaItemRenderer({
  media,
  title,
  originalUrl,
  isActive
}: MediaItemRendererProps) {
  const isVideo = media.media_type === 'video';

  if (isVideo) {
    return (
      <VideoWithFallback
        url={media.media_url}
        className="max-w-full max-h-full object-contain"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
        originalUrl={originalUrl}
        isActive={isActive}
      />
    );
  }

  return (
    <Image
      src={getProxiedImageUrl(media.media_url)}
      alt={title || 'Media'}
      width={1920}
      height={1080}
      className="max-w-full max-h-[calc(100vh-200px)] w-auto h-auto object-contain select-none pointer-events-none"
      priority
      unoptimized
      draggable={false}
    />
  );
}
