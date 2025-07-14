import NodeCache from 'node-cache';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Cấu hình cache với các thời gian TTL khác nhau cho từng loại dữ liệu
const movieCache = new NodeCache({ 
  stdTTL: 600, // 10 phút cho dữ liệu phim - tăng thời gian cache
  checkperiod: 60,
  useClones: false,
  maxKeys: 1000 // Giới hạn số lượng keys để tránh memory leak
});

const categoryCache = new NodeCache({ 
  stdTTL: 7200, // 2 giờ cho categories - tăng thời gian cache
  checkperiod: 300,
  useClones: false,
  maxKeys: 100
});

const countryCache = new NodeCache({ 
  stdTTL: 7200, // 2 giờ cho countries - tăng thời gian cache
  checkperiod: 300,
  useClones: false,
  maxKeys: 100
});

const searchCache = new NodeCache({ 
  stdTTL: 300, // 5 phút cho kết quả tìm kiếm - tăng thời gian cache
  checkperiod: 60,
  useClones: false,
  maxKeys: 500
});

const detailCache = new NodeCache({ 
  stdTTL: 900, // 15 phút cho chi tiết phim - tăng thời gian cache
  checkperiod: 120,
  useClones: false,
  maxKeys: 1000
});

// Enum cho các loại cache
export enum CacheType {
  MOVIE = 'movie',
  CATEGORY = 'category', 
  COUNTRY = 'country',
  SEARCH = 'search',
  DETAIL = 'detail'
}

// Mapping cache type với cache instance
const cacheMap = {
  [CacheType.MOVIE]: movieCache,
  [CacheType.CATEGORY]: categoryCache,
  [CacheType.COUNTRY]: countryCache,
  [CacheType.SEARCH]: searchCache,
  [CacheType.DETAIL]: detailCache
};

// Interface cho cached response
interface CachedResponse<T = any> {
  data: T;
  timestamp: number;
  url: string;
}

/**
 * Tạo cache key từ URL và params
 */
function createCacheKey(url: string, params?: any): string {
  const baseKey = url.replace(/https?:\/\//, '').replace(/[^\w]/g, '_');
  
  if (params && Object.keys(params).length > 0) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${baseKey}_${Buffer.from(sortedParams).toString('base64').replace(/[^\w]/g, '_')}`;
  }
  
  return baseKey;
}

/**
 * Xác định loại cache dựa trên URL
 */
function determineCacheType(url: string): CacheType {
  if (url.includes('/the-loai')) return CacheType.CATEGORY;
  if (url.includes('/quoc-gia')) return CacheType.COUNTRY;
  if (url.includes('/tim-kiem')) return CacheType.SEARCH;
  if (url.includes('/phim/')) return CacheType.DETAIL;
  return CacheType.MOVIE;
}

/**
 * Cached HTTP GET request
 */
export async function cachedGet<T = any>(
  url: string, 
  config?: AxiosRequestConfig,
  forceRefresh: boolean = false,
  customCacheType?: CacheType
): Promise<AxiosResponse<T>> {
  try {
    const cacheType = customCacheType || determineCacheType(url);
    const cache = cacheMap[cacheType];
    const cacheKey = createCacheKey(url, config?.params);
    
    // Kiểm tra cache nếu không force refresh
    if (!forceRefresh) {
      const cachedData = cache.get<CachedResponse<T>>(cacheKey);
      if (cachedData) {
        // Trả về response giống như axios
        return {
          data: cachedData.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {},
          request: {}
        } as AxiosResponse<T>;
      }
    }
    
    // Gọi API thực tế
    const response = await axios.get<T>(url, config);
    
    // Lưu vào cache
    const cachedResponse: CachedResponse<T> = {
      data: response.data,
      timestamp: Date.now(),
      url
    };
    
    cache.set(cacheKey, cachedResponse);
    
    return response;
    
  } catch (error) {
    console.error(`Lỗi trong cachedGet cho URL ${url}:`, error);
    throw error;
  }
}

/**
 * Cached POST request (chỉ cache nếu safe)
 */
export async function cachedPost<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
  shouldCache: boolean = false,
  customCacheType?: CacheType
): Promise<AxiosResponse<T>> {
  try {
    if (!shouldCache) {
      // Không cache POST requests mặc định
      return await axios.post<T>(url, data, config);
    }
    
    const cacheType = customCacheType || determineCacheType(url);
    const cache = cacheMap[cacheType];
    const cacheKey = createCacheKey(url, { ...config?.params, postData: data });
    
    // Kiểm tra cache
    const cachedData = cache.get<CachedResponse<T>>(cacheKey);
    if (cachedData) {
      console.log(`Cache HIT cho POST ${cacheType}: ${url}`);
      return {
        data: cachedData.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config || {},
        request: {}
      } as AxiosResponse<T>;
    }
    
    console.log(`Cache MISS cho POST ${cacheType}: ${url}`);
    
    // Gọi API thực tế
    const response = await axios.post<T>(url, data, config);
    
    // Lưu vào cache
    const cachedResponse: CachedResponse<T> = {
      data: response.data,
      timestamp: Date.now(),
      url
    };
    
    cache.set(cacheKey, cachedResponse);
    
    return response;
    
  } catch (error) {
    console.error(`Lỗi trong cachedPost cho URL ${url}:`, error);
    throw error;
  }
}

/**
 * Xóa cache theo pattern
 */
export function clearCache(pattern?: string, cacheType?: CacheType): number {
  if (cacheType) {
    const cache = cacheMap[cacheType];
    if (pattern) {
      const keys = cache.keys().filter(key => key.includes(pattern));
      keys.forEach(key => cache.del(key));
      return keys.length;
    } else {
      const keyCount = cache.keys().length;
      cache.flushAll();
      return keyCount;
    }
  } else {
    // Xóa tất cả cache
    let totalCleared = 0;
    Object.values(cacheMap).forEach(cache => {
      if (pattern) {
        const keys = cache.keys().filter(key => key.includes(pattern));
        keys.forEach(key => cache.del(key));
        totalCleared += keys.length;
      } else {
        totalCleared += cache.keys().length;
        cache.flushAll();
      }
    });
    return totalCleared;
  }
}

/**
 * Lấy thông tin cache stats
 */
export function getCacheStats(): Record<string, any> {
  const stats: Record<string, any> = {};
  
  Object.entries(cacheMap).forEach(([type, cache]) => {
    const keys = cache.keys();
    stats[type] = {
      keyCount: keys.length,
      keys: keys.slice(0, 10), // Chỉ hiển thị 10 keys đầu
      stats: cache.getStats()
    };
  });
  
  return stats;
}

/**
 * Preload cache cho dữ liệu thường xuyên sử dụng
 */
export async function preloadCache(): Promise<void> {
  try {
    // Preload categories (silent)
    await cachedGet('https://phimapi.com/the-loai', {}, false, CacheType.CATEGORY);
    
    // Preload countries  
    await cachedGet('https://phimapi.com/quoc-gia', {}, false, CacheType.COUNTRY);
    
    // Preload popular movies
    await cachedGet('https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3', {
      params: { page: 1, limit: 24, sort_field: 'view_total', sort_type: 'desc' }
    }, false, CacheType.MOVIE);
    
  } catch (error) {
    console.error('Cache preload error:', error);
  }
}

// Event listeners cho cache (chỉ log khi debug)
if (process.env.NODE_ENV === 'development' && process.env.DEBUG_CACHE) {
  movieCache.on('set', (key, value) => {
    console.log(`Movie cache SET: ${key}`);
  });

  movieCache.on('expired', (key, value) => {
    console.log(`Movie cache EXPIRED: ${key}`);
  });
}

// Export cache instances cho debugging
export { movieCache, categoryCache, countryCache, searchCache, detailCache };
