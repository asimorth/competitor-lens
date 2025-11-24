'use client';

import { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Screenshot {
  url: string;
  thumbnailUrl?: string;
  caption?: string;
}

export interface ScreenshotGridProps {
  screenshots: Screenshot[];
  onImageClick: (index: number) => void;
  className?: string;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export function ScreenshotGrid({ 
  screenshots, 
  onImageClick,
  className,
  columns = {
    mobile: 2,
    tablet: 3,
    desktop: 4
  }
}: ScreenshotGridProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
  };

  const getGridCols = () => {
    const { mobile = 2, tablet = 3, desktop = 4 } = columns;
    return cn(
      `grid-cols-${mobile}`,
      `md:grid-cols-${tablet}`,
      `lg:grid-cols-${desktop}`
    );
  };

  if (screenshots.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No screenshots available</p>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "grid gap-3 md:gap-4",
        getGridCols(),
        className
      )}
    >
      {screenshots.map((screenshot, index) => (
        <div
          key={index}
          onClick={() => onImageClick(index)}
          className="relative aspect-[9/16] rounded-lg overflow-hidden cursor-pointer group bg-gray-100"
        >
          {/* Loading Skeleton */}
          {!loadedImages.has(index) && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}

          {/* Image */}
          <img
            src={screenshot.thumbnailUrl || screenshot.url}
            alt={screenshot.caption || `Screenshot ${index + 1}`}
            className={cn(
              "w-full h-full object-cover transition-all duration-300",
              "group-hover:scale-105",
              !loadedImages.has(index) && "opacity-0"
            )}
            loading="lazy"
            onLoad={() => handleImageLoad(index)}
          />

          {/* Hover Overlay */}
          <div className={cn(
            "absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors",
            "flex items-center justify-center"
          )}>
            <div className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "bg-white/90 rounded-full p-2"
            )}>
              <Maximize2 className="h-5 w-5 text-gray-900" />
            </div>
          </div>

          {/* Touch Feedback */}
          <div className="md:hidden absolute inset-0 active:bg-black/10 transition-colors pointer-events-none" />

          {/* Caption */}
          {screenshot.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p className="text-white text-xs truncate">
                {screenshot.caption}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

