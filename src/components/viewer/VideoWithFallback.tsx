import { useState, useEffect, useRef, useCallback } from 'react';
import { getProxiedVideoUrl } from '@/lib/proxy';

interface VideoWithFallbackProps {
  url: string;
  className?: string;
  style?: React.CSSProperties;
  originalUrl?: string;
  isActive?: boolean;
}

export function VideoWithFallback({ 
  url, 
  className, 
  style, 
  originalUrl, 
  isActive = true 
}: VideoWithFallbackProps) {
  const [status, setStatus] = useState<'loading' | 'playing' | 'failed'>('loading');
  const [tryCount, setTryCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const proxiedUrl = getProxiedVideoUrl(url);

  const urls = proxiedUrl !== url ? [proxiedUrl, url] : [url];
  const currentUrl = urls[Math.min(tryCount, urls.length - 1)];
  const hasMoreFallbacks = tryCount < urls.length - 1;

  const handleError = useCallback(() => {
    if (hasMoreFallbacks) {
      setTryCount(prev => prev + 1);
    } else {
      setStatus('failed');
    }
  }, [hasMoreFallbacks]);

  useEffect(() => {
    setTryCount(0);
    setStatus('loading');
  }, [url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive]);

  const handleCanPlayInternal = useCallback(() => {
    setStatus('playing');
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [isActive]);

  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-white/70 p-8">
        <svg className="w-16 h-16 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-center text-sm">비디오를 불러올 수 없습니다</p>
        <p className="text-center text-xs text-white/50">핫링크 보호로 인해 직접 재생이 제한됩니다</p>
        {originalUrl && (
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            원본 사이트에서 보기
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <video
        ref={videoRef}
        key={`${url}-${tryCount}`}
        src={currentUrl}
        controls
        autoPlay={isActive}
        loop
        playsInline
        muted
        preload="auto"
        className={`${className} transition-opacity duration-200`}
        style={{ ...style, opacity: status === 'playing' ? 1 : 0.3 }}
        onError={handleError}
        onCanPlay={handleCanPlayInternal}
      />
    </div>
  );
}
