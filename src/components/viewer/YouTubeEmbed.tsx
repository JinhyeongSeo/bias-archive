import { useState, useEffect } from 'react';
import Image from 'next/image';

interface YouTubeEmbedProps {
  videoId: string;
  title: string | null;
  isActive: boolean;
}

export function YouTubeEmbed({ videoId, title, isActive }: YouTubeEmbedProps) {
  const [controlsEnabled, setControlsEnabled] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setControlsEnabled(false);
    }
  }, [isActive]);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full h-full max-h-[calc(100vh-180px)] flex items-center justify-center">
        <div className="relative w-full aspect-video max-h-full" style={{ maxWidth: 'calc((100vh - 180px) * 16 / 9)' }}>
          {isActive ? (
            <>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full rounded-lg"
                style={{ pointerEvents: controlsEnabled ? 'auto' : 'none' }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setControlsEnabled(prev => !prev);
                }}
                className={`absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all pointer-events-auto ${
                  controlsEnabled
                    ? 'bg-white/90 text-black hover:bg-white'
                    : 'bg-black/60 text-white hover:bg-black/80'
                }`}
              >
                {controlsEnabled ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    <span>컨트롤</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>잠금</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="relative w-full h-full bg-black/50 rounded-lg">
              <Image
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt={title || 'YouTube thumbnail'}
                fill
                className="object-cover rounded-lg select-none pointer-events-none"
                unoptimized
                draggable={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
