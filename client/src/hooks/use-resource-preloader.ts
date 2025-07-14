import { useEffect, useCallback } from 'react';

interface PreloadOptions {
  images?: string[];
  videos?: string[];
  scripts?: string[];
  stylesheets?: string[];
  priority?: 'high' | 'low';
}

export function useResourcePreloader({
  images = [],
  videos = [],
  scripts = [],
  stylesheets = [],
  priority = 'low'
}: PreloadOptions = {}) {

  const preloadImage = useCallback((src: string) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const preloadVideo = useCallback((src: string) => {
    return new Promise<void>((resolve, reject) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => resolve();
      video.onerror = reject;
      video.preload = 'metadata';
      video.src = src;
    });
  }, []);

  const preloadScript = useCallback((src: string) => {
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.onload = () => resolve();
      script.onerror = reject;
      script.src = src;
      document.head.appendChild(script);
    });
  }, []);

  const preloadStylesheet = useCallback((href: string) => {
    return new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }, []);

  useEffect(() => {
    const preloadResources = async () => {
      // Use requestIdleCallback for low priority preloading
      const executePreload = (callback: () => Promise<void>) => {
        if (priority === 'high') {
          return callback();
        } else {
          return new Promise<void>((resolve) => {
            if ('requestIdleCallback' in window) {
              requestIdleCallback(async () => {
                await callback();
                resolve();
              });
            } else {
              // Fallback for browsers without requestIdleCallback
              setTimeout(async () => {
                await callback();
                resolve();
              }, 100);
            }
          });
        }
      };

      try {
        // Preload images
        if (images.length > 0) {
          await executePreload(async () => {
            await Promise.allSettled(images.map(preloadImage));
          });
        }

        // Preload videos
        if (videos.length > 0) {
          await executePreload(async () => {
            await Promise.allSettled(videos.map(preloadVideo));
          });
        }

        // Preload scripts
        if (scripts.length > 0) {
          await executePreload(async () => {
            await Promise.allSettled(scripts.map(preloadScript));
          });
        }

        // Preload stylesheets
        if (stylesheets.length > 0) {
          await executePreload(async () => {
            await Promise.allSettled(stylesheets.map(preloadStylesheet));
          });
        }
      } catch (error) {
        console.warn('Resource preloading failed:', error);
      }
    };

    preloadResources();
  }, [images, videos, scripts, stylesheets, priority, preloadImage, preloadVideo, preloadScript, preloadStylesheet]);

  return {
    preloadImage,
    preloadVideo,
    preloadScript,
    preloadStylesheet
  };
}
