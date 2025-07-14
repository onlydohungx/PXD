// Performance optimization utilities
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): T {
  let timeout: NodeJS.Timeout | null = null;
  
  return ((...args: any[]) => {
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) func(...args);
    }, wait);
    
    if (callNow) func(...args);
  }) as T;
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  
  return ((...args: any[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

// Lazy loading intersection observer
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };
  
  return new IntersectionObserver(callback, defaultOptions);
}

// Preload critical resources
export function preloadResource(href: string, as: string, type?: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  document.head.appendChild(link);
}

// Image optimization
export function optimizeImageUrl(url: string, width?: number, quality = 80) {
  if (!url) return url;
  
  // For external images, we can't optimize them directly
  // But we can add loading strategies
  return url;
}

// Cache API responses in localStorage with expiration
export function cacheApiResponse(key: string, data: any, expiryMinutes = 5) {
  const expiry = new Date().getTime() + (expiryMinutes * 60 * 1000);
  const cacheData = {
    data,
    expiry
  };
  
  try {
    localStorage.setItem(`api_cache_${key}`, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache API response:', error);
  }
}

export function getCachedApiResponse(key: string) {
  try {
    const cached = localStorage.getItem(`api_cache_${key}`);
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    
    if (new Date().getTime() > cacheData.expiry) {
      localStorage.removeItem(`api_cache_${key}`);
      return null;
    }
    
    return cacheData.data;
  } catch (error) {
    console.warn('Failed to get cached API response:', error);
    return null;
  }
}

// Measure performance
export function measurePerformance(name: string, fn: () => void | Promise<void>) {
  return async () => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
  };
}