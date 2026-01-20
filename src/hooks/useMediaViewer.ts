import { useState, useEffect, useCallback, useRef } from 'react';
import { getProxiedImageUrl } from '@/lib/proxy';
import type { LinkMedia } from '@/types/database';

interface UseMediaViewerOptions {
  items: LinkMedia[];
  initialIndex?: number;
}

export function useMediaViewer({ items, initialIndex = 0 }: UseMediaViewerOptions) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  }, [items.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  }, [items.length]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchStartX.current - currentX;
    const diffY = touchStartY.current - currentY;

    // Determine if this is a horizontal swipe
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      isSwiping.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const threshold = 50;

    if (isSwiping.current && Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
  }, [goToNext, goToPrevious]);

  // Preload logic
  useEffect(() => {
    if (items.length === 0) return;

    const toPreload: number[] = [];
    for (let offset = -1; offset <= 2; offset++) {
      let idx = currentIndex + offset;
      if (idx < 0) idx = items.length + idx;
      if (idx >= items.length) idx = idx - items.length;
      
      if (!loadedImages.has(idx) && items[idx] && items[idx].media_type !== 'video') {
        toPreload.push(idx);
      }
    }

    if (toPreload.length > 0) {
      toPreload.forEach(idx => {
        const img = new window.Image();
        img.src = getProxiedImageUrl(items[idx].media_url);
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadedImages(prev => new Set([...prev, ...toPreload]));
    }
  }, [currentIndex, items, loadedImages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  return {
    currentIndex,
    setCurrentIndex,
    goToPrevious,
    goToNext,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    loadedImages,
  };
}
