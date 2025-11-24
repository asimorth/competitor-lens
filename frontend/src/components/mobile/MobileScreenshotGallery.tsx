'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getScreenshotUrl } from '@/lib/screenshot-utils';

interface MobileScreenshotGalleryProps {
  screenshots: any[];
  groupBy?: 'feature' | 'competitor' | null;
  columns?: 2 | 3 | 4;
}

export function MobileScreenshotGallery({ 
  screenshots, 
  groupBy = null,
  columns = 2 
}: MobileScreenshotGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  };

  if (groupBy) {
    return <GroupedGallery screenshots={screenshots} groupBy={groupBy} />;
  }

  return (
    <>
      <div className={cn("grid gap-2", gridCols[columns])}>
        {screenshots.map((screenshot, index) => (
          <ScreenshotThumbnail
            key={screenshot.id || index}
            screenshot={screenshot}
            onClick={() => setSelectedIndex(index)}
          />
        ))}
      </div>

      {selectedIndex !== null && (
        <MobileLightbox
          screenshots={screenshots}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  );
}

// Screenshot thumbnail component
function ScreenshotThumbnail({ screenshot, onClick }: { screenshot: any; onClick: () => void }) {
  return (
    <div
      className="
        relative aspect-video rounded-lg overflow-hidden
        border-2 border-gray-200
        cursor-pointer active:scale-95 transition-transform
        group
      "
      onClick={onClick}
    >
      <Image
        src={getScreenshotUrl(screenshot)}
        alt={screenshot.fileName || 'Screenshot'}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 group-active:bg-black/60 transition-colors flex items-center justify-center">
        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />
      </div>

      {/* Feature badge */}
      {screenshot.feature && (
        <div className="absolute bottom-1 left-1">
          <Badge className="text-xs py-0 px-1.5 bg-black/70 text-white border-0">
            {screenshot.feature.name}
          </Badge>
        </div>
      )}
    </div>
  );
}

// Grouped gallery
function GroupedGallery({ screenshots, groupBy }: { screenshots: any[]; groupBy: 'feature' | 'competitor' }) {
  const grouped = screenshots.reduce((acc: Record<string, any[]>, s) => {
    const key = groupBy === 'feature' 
      ? (s.feature?.name || 'Uncategorized')
      : (s.competitor?.name || 'Unknown');
    
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([group, items]) => (
        <div key={group}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">{group}</h3>
            <Badge variant="outline" className="text-xs">{items.length}</Badge>
          </div>
          <MobileScreenshotGallery screenshots={items} columns={2} />
        </div>
      ))}
    </div>
  );
}

// Mobile lightbox with swipe support
export function MobileLightbox({ 
  screenshots, 
  initialIndex, 
  onClose 
}: { 
  screenshots: any[]; 
  initialIndex: number; 
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const current = screenshots[currentIndex];

  const handlePrev = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : screenshots.length - 1);
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev < screenshots.length - 1 ? prev + 1 : 0);
  };

  // Keyboard navigation
  useState(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header - sticky */}
      <div className="bg-black/90 p-3 md:p-4 flex items-center justify-between border-b border-white/10">
        <div className="flex-1 min-w-0 text-white">
          <div className="text-sm md:text-base font-medium truncate">
            {current.competitor?.name || current.exchangeName || 'Exchange'}
          </div>
          {current.feature && (
            <div className="text-xs text-gray-300">
              {current.feature.name}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-3 p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Image container */}
      <div className="flex-1 relative flex items-center justify-center p-2 md:p-4">
        <Image
          src={getScreenshotUrl(current)}
          alt={current.fileName || 'Screenshot'}
          fill
          className="object-contain"
          priority
          sizes="100vw"
        />
        
        {/* Navigation buttons - mobile optimized */}
        <button
          onClick={handlePrev}
          className="
            absolute left-2 md:left-4 
            p-2 md:p-3 
            bg-black/60 hover:bg-black/80 
            rounded-full transition-colors
            active:scale-95
          "
        >
          <ChevronLeft className="h-6 w-6 md:h-8 md:w-8 text-white" />
        </button>
        
        <button
          onClick={handleNext}
          className="
            absolute right-2 md:right-4
            p-2 md:p-3
            bg-black/60 hover:bg-black/80
            rounded-full transition-colors
            active:scale-95
          "
        >
          <ChevronRight className="h-6 w-6 md:h-8 md:w-8 text-white" />
        </button>
      </div>

      {/* Footer - counter */}
      <div className="bg-black/90 p-3 text-center border-t border-white/10">
        <span className="text-white text-sm">
          {currentIndex + 1} / {screenshots.length}
        </span>
      </div>
    </div>
  );
}

