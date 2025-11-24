'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LightboxScreenshot {
  url: string;
  thumbnailUrl?: string;
  caption?: string;
}

export interface LightboxProps {
  screenshots: LightboxScreenshot[];
  initialIndex?: number;
  onClose: () => void;
  competitorName?: string;
  featureName?: string;
}

export function Lightbox({
  screenshots,
  initialIndex = 0,
  onClose,
  competitorName,
  featureName
}: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const currentScreenshot = screenshots[currentIndex];

  // Navigate to previous screenshot
  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  // Navigate to next screenshot
  const goToNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(screenshots.length - 1, prev + 1));
  }, [screenshots.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext, onClose]);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header - Mobile Optimized */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 safe-area-top">
        <div className="flex items-center justify-between text-white">
          <div className="flex-1 min-w-0 mr-4">
            {competitorName && (
              <p className="font-semibold truncate text-sm md:text-base">
                {competitorName}
              </p>
            )}
            {featureName && (
              <p className="text-xs md:text-sm text-gray-300 truncate">
                {featureName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="touch-target p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Close lightbox"
          >
            <X className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </div>
      </div>

      {/* Image Container - Centered */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <img
          src={currentScreenshot.url}
          alt={currentScreenshot.caption || `Screenshot ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          style={{ maxHeight: 'calc(100vh - 180px)' }}
        />
      </div>

      {/* Navigation - Mobile Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent safe-area-bottom">
        {/* Navigation Buttons */}
        <div className="flex items-center justify-between text-white mb-3">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className={cn(
              "touch-target p-3 rounded-full transition-all",
              currentIndex === 0
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-white/10 active:scale-95"
            )}
            aria-label="Previous screenshot"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          
          <span className="text-sm md:text-base font-medium">
            {currentIndex + 1} / {screenshots.length}
          </span>
          
          <button
            onClick={goToNext}
            disabled={currentIndex === screenshots.length - 1}
            className={cn(
              "touch-target p-3 rounded-full transition-all",
              currentIndex === screenshots.length - 1
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-white/10 active:scale-95"
            )}
            aria-label="Next screenshot"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-1.5 overflow-x-auto hide-scrollbar">
          {screenshots.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all flex-shrink-0",
                idx === currentIndex 
                  ? "w-6 bg-white" 
                  : "w-1.5 bg-white/40 hover:bg-white/60"
              )}
              aria-label={`Go to screenshot ${idx + 1}`}
            />
          ))}
        </div>

        {/* Caption */}
        {currentScreenshot.caption && (
          <p className="text-center text-sm text-gray-300 mt-3">
            {currentScreenshot.caption}
          </p>
        )}
      </div>

      {/* Swipe Hint (Mobile Only - Fades Out) */}
      <div className="md:hidden absolute bottom-20 left-0 right-0 text-center text-white/50 text-xs animate-pulse pointer-events-none">
        Swipe left or right to navigate
      </div>
    </div>
  );
}

