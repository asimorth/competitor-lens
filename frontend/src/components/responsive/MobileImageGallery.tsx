'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Zoom } from 'swiper/modules';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Download, Expand, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import { getImageUrl } from '@/lib/imageUrl';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';

interface Screenshot {
  id: string;
  url: string;
  cdnUrl?: string;
  caption?: string;
  competitor: {
    id: string;
    name: string;
  };
  feature?: {
    id: string;
    name: string;
    category?: string;
  };
  width?: number;
  height?: number;
  isOnboarding?: boolean;
}

interface MobileImageGalleryProps {
  screenshots: Screenshot[];
  className?: string;
  onScreenshotClick?: (screenshot: Screenshot) => void;
}

export function MobileImageGallery({
  screenshots,
  className,
  onScreenshotClick
}: MobileImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();

  const handleImageClick = (screenshot: Screenshot, index: number) => {
    setSelectedIndex(index);
    setIsFullscreen(true);
    onScreenshotClick?.(screenshot);
  };

  const handleClose = () => {
    setIsFullscreen(false);
    setSelectedIndex(null);
  };

  const handleDownload = (screenshot: Screenshot) => {
    const link = document.createElement('a');
    link.href = screenshot.cdnUrl || screenshot.url;
    link.download = `${screenshot.competitor.name}_${screenshot.feature?.name || 'screenshot'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mobile: Swiper carousel
  if (isMobile) {
    return (
      <>
        <div className={cn("relative", className)}>
          <Swiper
            modules={[Navigation, Pagination, Zoom]}
            spaceBetween={10}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            zoom={{ maxRatio: 3 }}
            className="mobile-screenshot-swiper"
          >
            {screenshots.map((screenshot, index) => (
              <SwiperSlide key={screenshot.id}>
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={getImageUrl(screenshot.cdnUrl || screenshot.url)}
                    alt={screenshot.caption || 'Screenshot'}
                    fill
                    className="object-contain"
                    onClick={() => handleImageClick(screenshot, index)}
                  />
                  {screenshot.isOnboarding && (
                    <Badge className="absolute top-2 left-2" variant="secondary">
                      Onboarding
                    </Badge>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-white text-sm font-medium">
                      {screenshot.competitor.name}
                    </p>
                    {screenshot.feature && (
                      <p className="text-white/80 text-xs">
                        {screenshot.feature.name}
                      </p>
                    )}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Fullscreen viewer */}
        {isFullscreen && selectedIndex !== null && (
          <FullscreenViewer
            screenshots={screenshots}
            initialIndex={selectedIndex}
            onClose={handleClose}
            onDownload={handleDownload}
          />
        )}
      </>
    );
  }

  // Tablet: 2-column grid
  if (isTablet) {
    return (
      <>
        <div className={cn("grid grid-cols-2 gap-4", className)}>
          {screenshots.map((screenshot, index) => (
            <ScreenshotCard
              key={screenshot.id}
              screenshot={screenshot}
              onClick={() => handleImageClick(screenshot, index)}
            />
          ))}
        </div>

        {/* Fullscreen viewer */}
        {isFullscreen && selectedIndex !== null && (
          <FullscreenViewer
            screenshots={screenshots}
            initialIndex={selectedIndex}
            onClose={handleClose}
            onDownload={handleDownload}
          />
        )}
      </>
    );
  }

  // Desktop: 3-4 column masonry
  return (
    <>
      <div className={cn("grid grid-cols-3 xl:grid-cols-4 gap-4", className)}>
        {screenshots.map((screenshot, index) => (
          <ScreenshotCard
            key={screenshot.id}
            screenshot={screenshot}
            onClick={() => handleImageClick(screenshot, index)}
          />
        ))}
      </div>

      {/* Lightbox viewer */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-7xl h-[90vh] p-0">
          {selectedIndex !== null && (
            <LightboxViewer
              screenshots={screenshots}
              initialIndex={selectedIndex}
              onDownload={handleDownload}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Screenshot Card Component
function ScreenshotCard({
  screenshot,
  onClick
}: {
  screenshot: Screenshot;
  onClick: () => void;
}) {
  return (
    <div
      className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100"
      onClick={onClick}
    >
      <div className="relative aspect-video">
        <Image
          src={getImageUrl(screenshot.cdnUrl || screenshot.url)}
          alt={screenshot.caption || 'Screenshot'}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {screenshot.isOnboarding && (
        <Badge className="absolute top-2 left-2" variant="secondary">
          Onboarding
        </Badge>
      )}

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Expand className="text-white" size={24} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <p className="text-white text-sm font-medium truncate">
          {screenshot.competitor.name}
        </p>
        {screenshot.feature && (
          <p className="text-white/80 text-xs truncate">
            {screenshot.feature.name}
          </p>
        )}
      </div>
    </div>
  );
}

// Fullscreen Viewer for Mobile
function FullscreenViewer({
  screenshots,
  initialIndex,
  onClose,
  onDownload
}: {
  screenshots: Screenshot[];
  initialIndex: number;
  onClose: () => void;
  onDownload: (screenshot: Screenshot) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentScreenshot = screenshots[currentIndex];

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="text-white p-2">
            <X size={24} />
          </button>
          <div className="text-white text-center">
            <p className="font-medium">{currentScreenshot.competitor.name}</p>
            {currentScreenshot.feature && (
              <p className="text-sm opacity-80">{currentScreenshot.feature.name}</p>
            )}
          </div>
          <button
            onClick={() => onDownload(currentScreenshot)}
            className="text-white p-2"
          >
            <Download size={24} />
          </button>
        </div>
      </div>

      {/* Image with pinch-to-zoom */}
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit
      >
        <TransformComponent>
          <div className="w-screen h-screen flex items-center justify-center">
            <img
              src={getImageUrl(currentScreenshot.cdnUrl || currentScreenshot.url)}
              alt={currentScreenshot.caption || 'Screenshot'}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </TransformComponent>
      </TransformWrapper>

      {/* Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="text-white p-2 disabled:opacity-50"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="text-white text-center">
            <span>{currentIndex + 1} / {screenshots.length}</span>
          </div>
          <button
            onClick={() => setCurrentIndex(Math.min(screenshots.length - 1, currentIndex + 1))}
            disabled={currentIndex === screenshots.length - 1}
            className="text-white p-2 disabled:opacity-50"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Lightbox Viewer for Desktop
function LightboxViewer({
  screenshots,
  initialIndex,
  onDownload
}: {
  screenshots: Screenshot[];
  initialIndex: number;
  onDownload: (screenshot: Screenshot) => void;
}) {
  return (
    <div className="h-full flex flex-col">
      <Swiper
        modules={[Navigation, Pagination, Zoom]}
        initialSlide={initialIndex}
        navigation
        pagination={{ clickable: true }}
        zoom={{ maxRatio: 3 }}
        className="flex-1"
      >
        {screenshots.map((screenshot) => (
          <SwiperSlide key={screenshot.id}>
            <div className="h-full flex items-center justify-center p-8">
              <div className="relative max-w-full max-h-full">
                <img
                  src={getImageUrl(screenshot.cdnUrl || screenshot.url)}
                  alt={screenshot.caption || 'Screenshot'}
                  className="max-w-full max-h-full object-contain"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-4 right-4"
                  onClick={() => onDownload(screenshot)}
                >
                  <Download size={20} />
                </Button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
