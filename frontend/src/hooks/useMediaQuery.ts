import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design
 * Tailwind breakpoints ile uyumlu
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // İlk değeri set et
    setMatches(media.matches);

    // Listener ekle
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

// Predefined breakpoints (Tailwind CSS uyumlu)
export function useBreakpoint() {
  const isMobile = useMediaQuery('(max-width: 639px)'); // < 640px
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)'); // 640px - 1023px
  const isDesktop = useMediaQuery('(min-width: 1024px)'); // >= 1024px
  const isLargeDesktop = useMediaQuery('(min-width: 1280px)'); // >= 1280px

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    // Kombinasyonlar
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop,
    // Minimum genişlikler
    isAtLeastTablet: !isMobile,
    isAtLeastDesktop: isDesktop || isLargeDesktop,
  };
}

// Specific breakpoint check
export function useBreakpointValue<T>(
  values: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
    largeDesktop?: T;
  },
  defaultValue: T
): T {
  const { isMobile, isTablet, isDesktop, isLargeDesktop } = useBreakpoint();

  if (isLargeDesktop && values.largeDesktop !== undefined) {
    return values.largeDesktop;
  }
  if (isDesktop && values.desktop !== undefined) {
    return values.desktop;
  }
  if (isTablet && values.tablet !== undefined) {
    return values.tablet;
  }
  if (isMobile && values.mobile !== undefined) {
    return values.mobile;
  }

  return defaultValue;
}
