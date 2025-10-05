import { useEffect, useRef, RefObject } from 'react';
import Hammer from 'hammerjs';

export interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchIn?: () => void;
  onPinchOut?: () => void;
  onDoubleTap?: () => void;
  onPress?: () => void;
  threshold?: number;
  velocity?: number;
}

/**
 * Touch gesture detection hook
 */
export function useTouchGestures<T extends HTMLElement>(
  options: TouchGestureOptions
): RefObject<T> {
  const elementRef = useRef<T>(null);
  const hammerRef = useRef<HammerManager | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    // Hammer.js instance oluştur
    const hammer = new Hammer(elementRef.current);
    hammerRef.current = hammer;

    // Swipe gestures
    hammer.get('swipe').set({
      direction: Hammer.DIRECTION_ALL,
      threshold: options.threshold || 10,
      velocity: options.velocity || 0.3
    });

    // Pinch gesture
    hammer.get('pinch').set({ enable: true });

    // Double tap
    hammer.get('tap').set({ 
      event: 'doubletap', 
      taps: 2,
      interval: 300,
      time: 250,
      threshold: 2,
      posThreshold: 10
    });

    // Press (long press)
    hammer.get('press').set({
      time: 500 // 500ms basılı tutma
    });

    // Event listeners
    if (options.onSwipeLeft) {
      hammer.on('swipeleft', options.onSwipeLeft);
    }
    if (options.onSwipeRight) {
      hammer.on('swiperight', options.onSwipeRight);
    }
    if (options.onSwipeUp) {
      hammer.on('swipeup', options.onSwipeUp);
    }
    if (options.onSwipeDown) {
      hammer.on('swipedown', options.onSwipeDown);
    }
    if (options.onPinchIn) {
      hammer.on('pinchin', options.onPinchIn);
    }
    if (options.onPinchOut) {
      hammer.on('pinchout', options.onPinchOut);
    }
    if (options.onDoubleTap) {
      hammer.on('doubletap', options.onDoubleTap);
    }
    if (options.onPress) {
      hammer.on('press', options.onPress);
    }

    // Cleanup
    return () => {
      hammer.destroy();
    };
  }, [options]);

  return elementRef as RefObject<T>;
}

/**
 * Swipeable container hook
 */
export function useSwipeable(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void
) {
  return useTouchGestures<HTMLDivElement>({
    onSwipeLeft,
    onSwipeRight,
    threshold: 50,
    velocity: 0.3
  });
}

/**
 * Pinch to zoom hook
 */
export function usePinchToZoom(
  onZoomIn: () => void,
  onZoomOut: () => void
) {
  return useTouchGestures<HTMLDivElement>({
    onPinchIn: onZoomOut,
    onPinchOut: onZoomIn
  });
}
