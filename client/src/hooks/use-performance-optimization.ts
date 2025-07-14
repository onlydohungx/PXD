import React, { useEffect, useCallback, useRef } from 'react';

interface PerformanceOptimizationOptions {
  enableAPIThrottling?: boolean;
  enableAnimationReduction?: boolean;
  enableComponentOptimization?: boolean;
}

export function usePerformanceOptimization(
  isIdle: boolean, 
  options: PerformanceOptimizationOptions = {}
) {
  const {
    enableAPIThrottling = true,
    enableAnimationReduction = true,
    enableComponentOptimization = true
  } = options;

  const originalIntervals = useRef<Map<string, number>>(new Map());
  const intervalModifiers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Throttle API calls when idle
  const throttleAPICall = useCallback((
    originalFn: Function,
    key: string,
    idleInterval: number = 30000 // 30 seconds when idle
  ) => {
    if (!enableAPIThrottling) return originalFn;

    return (...args: any[]) => {
      if (isIdle) {
        // Clear existing throttled interval if any
        const existingInterval = intervalModifiers.current.get(key);
        if (existingInterval) {
          clearTimeout(existingInterval);
        }

        // Set up throttled call
        const throttledTimeout = setTimeout(() => {
          originalFn(...args);
        }, idleInterval);

        intervalModifiers.current.set(key, throttledTimeout);
      } else {
        // Call immediately when not idle
        const existingInterval = intervalModifiers.current.get(key);
        if (existingInterval) {
          clearTimeout(existingInterval);
          intervalModifiers.current.delete(key);
        }
        originalFn(...args);
      }
    };
  }, [isIdle, enableAPIThrottling]);

  // Reduce animations when idle
  useEffect(() => {
    if (!enableAnimationReduction) return;

    const root = document.documentElement;
    
    if (isIdle) {
      // Slow down animations
      root.style.setProperty('--animation-duration-multiplier', '10');
      root.style.setProperty('--transition-duration-multiplier', '5');
      
      // Add CSS class for additional control
      root.classList.add('performance-mode');
      
      // Disable some heavy animations
      const style = document.createElement('style');
      style.id = 'idle-performance-style';
      style.textContent = `
        .idle-mode *,
        .idle-mode *::before,
        .idle-mode *::after {
          animation-duration: calc(var(--original-duration, 1s) * 10) !important;
          transition-duration: calc(var(--original-duration, 0.3s) * 5) !important;
        }
        
        .idle-mode .loading-spinner,
        .idle-mode .shimmer-effect,
        .idle-mode .pulse-animation {
          animation-play-state: paused !important;
        }
        
        .idle-mode video:not(.main-video) {
          opacity: 0.1 !important;
        }
        
        .idle-mode .auto-scrolling,
        .idle-mode .carousel-auto {
          animation-play-state: paused !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      // Restore normal animations
      root.style.removeProperty('--animation-duration-multiplier');
      root.style.removeProperty('--transition-duration-multiplier');
      root.classList.remove('performance-mode');
      
      // Remove idle performance style
      const idleStyle = document.getElementById('idle-performance-style');
      if (idleStyle) {
        idleStyle.remove();
      }
    }

    return () => {
      // Cleanup
      root.style.removeProperty('--animation-duration-multiplier');
      root.style.removeProperty('--transition-duration-multiplier');
      root.classList.remove('performance-mode');
      
      const idleStyle = document.getElementById('idle-performance-style');
      if (idleStyle) {
        idleStyle.remove();
      }
    };
  }, [isIdle, enableAnimationReduction]);

  // Memory optimization - pause heavy components
  const shouldRenderComponent = useCallback((componentName: string) => {
    if (!enableComponentOptimization || !isIdle) return true;

    // Define which components should be paused during idle
    const pausableComponents = [
      'carousel',
      'video-preview',
      'live-stats',
      'real-time-notifications',
      'auto-refresh-content'
    ];

    return !pausableComponents.includes(componentName.toLowerCase());
  }, [isIdle, enableComponentOptimization]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      intervalModifiers.current.forEach(interval => {
        clearTimeout(interval);
      });
      intervalModifiers.current.clear();
    };
  }, []);

  return {
    throttleAPICall,
    shouldRenderComponent,
    isPerformanceMode: isIdle,
    
    // Helper for component optimization
    shouldSkipRender: useCallback((componentName: string) => {
      return isIdle && !shouldRenderComponent(componentName);
    }, [isIdle, shouldRenderComponent])
  };
}
