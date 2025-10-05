'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Maximize2,
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import { usePinchToZoom } from '@/hooks/useTouchGestures';

interface ScreenshotViewerProps {
  src: string;
  alt?: string;
  caption?: string;
  className?: string;
  showControls?: boolean;
  onDownload?: () => void;
}

export function ScreenshotViewer({
  src,
  alt = 'Screenshot',
  caption,
  className,
  showControls = true,
  onDownload
}: ScreenshotViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const { isMobile } = useBreakpoint();

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      const link = document.createElement('a');
      link.href = src;
      link.download = alt;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(true);
    // Fullscreen API
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  // Mobile pinch-to-zoom
  const pinchRef = usePinchToZoom(
    () => setScale(prev => Math.min(prev * 1.2, 3)),
    () => setScale(prev => Math.max(prev * 0.8, 0.5))
  );

  return (
    <>
      <div className={cn("relative group", className)}>
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={3}
          centerOnInit
          doubleClick={{
            disabled: false,
            mode: "toggle"
          }}
          panning={{
            disabled: false,
            velocityDisabled: false
          }}
          pinch={{
            disabled: false
          }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <TransformComponent>
                <div 
                  ref={isMobile ? pinchRef : undefined}
                  className="relative w-full h-full"
                >
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-contain"
                    quality={95}
                    priority
                  />
                </div>
              </TransformComponent>

              {/* Desktop Controls */}
              {showControls && !isMobile && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg p-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => zoomIn()}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => zoomOut()}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => resetTransform()}
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                  <div className="w-px bg-white/30" />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={handleFullscreen}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TransformWrapper>

        {/* Mobile Controls */}
        {showControls && isMobile && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
            <Button
              size="sm"
              variant="secondary"
              className="bg-black/50 text-white"
              onClick={handleFullscreen}
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Tam Ekran
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-black/50 text-white"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Caption */}
        {caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white text-sm">{caption}</p>
          </div>
        )}
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={exitFullscreen}
          >
            <X className="w-6 h-6" />
          </Button>
          
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={5}
            centerOnInit
          >
            <TransformComponent>
              <img
                src={src}
                alt={alt}
                className="max-w-full max-h-full object-contain"
              />
            </TransformComponent>
          </TransformWrapper>
        </div>
      )}
    </>
  );
}

// Comparative Screenshot Viewer
export function ComparativeScreenshotViewer({
  screenshots,
  className
}: {
  screenshots: Array<{
    src: string;
    alt?: string;
    caption?: string;
    competitorName: string;
  }>;
  className?: string;
}) {
  const [syncedZoom, setSyncedZoom] = useState(1);
  const { isMobile } = useBreakpoint();

  if (isMobile) {
    // Mobile: Swipeable tabs
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {screenshots.map((screenshot, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
            >
              {screenshot.competitorName}
            </Button>
          ))}
        </div>
        <ScreenshotViewer
          src={screenshots[0].src}
          alt={screenshots[0].alt}
          caption={screenshots[0].caption}
        />
      </div>
    );
  }

  // Desktop: Side by side
  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      {screenshots.map((screenshot, index) => (
        <div key={index} className="space-y-2">
          <h3 className="font-medium text-center">{screenshot.competitorName}</h3>
          <ScreenshotViewer
            src={screenshot.src}
            alt={screenshot.alt}
            caption={screenshot.caption}
          />
        </div>
      ))}
    </div>
  );
}
