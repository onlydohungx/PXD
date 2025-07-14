import { Express, Request, Response } from "express";
import { clearCache, getCacheStats, preloadCache, CacheType } from '../cache';
import { isAuthenticated, isAdmin } from '../auth';

export function setupCacheManagementRoutes(app: Express) {
  
  // API để lấy thống kê cache (admin only)
  app.get('/api/admin/cache/stats', isAdmin, async (req: Request, res: Response) => {
    try {
      const stats = getCacheStats();
      
      res.json({
        status: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting cache stats:', error);
      res.status(500).json({
        status: false,
        message: 'Failed to get cache stats'
      });
    }
  });

  // API để xóa cache (admin only)
  app.post('/api/admin/cache/clear', isAdmin, async (req: Request, res: Response) => {
    try {
      const { cacheType, pattern } = req.body;
      
      let clearedCount = 0;
      
      if (cacheType && Object.values(CacheType).includes(cacheType)) {
        clearedCount = clearCache(pattern, cacheType as CacheType);
      } else {
        clearedCount = clearCache(pattern);
      }
      
      res.json({
        status: true,
        message: `Đã xóa ${clearedCount} cache entries`,
        clearedCount,
        cacheType: cacheType || 'all',
        pattern: pattern || 'all'
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({
        status: false,
        message: 'Failed to clear cache'
      });
    }
  });

  // API để preload cache (admin only)
  app.post('/api/admin/cache/preload', isAdmin, async (req: Request, res: Response) => {
    try {
      await preloadCache();
      
      res.json({
        status: true,
        message: 'Cache preload hoàn tất'
      });
    } catch (error) {
      console.error('Error preloading cache:', error);
      res.status(500).json({
        status: false,
        message: 'Failed to preload cache'
      });
    }
  });

  // API để force refresh cache cho một endpoint cụ thể
  app.post('/api/admin/cache/refresh', isAdmin, async (req: Request, res: Response) => {
    try {
      const { url, params, cacheType } = req.body;
      
      if (!url) {
        return res.status(400).json({
          status: false,
          message: 'URL is required'
        });
      }

      // Import cachedGet function
      const { cachedGet } = await import('../cache');
      
      // Force refresh bằng cách gọi API với forceRefresh = true
      const response = await cachedGet(
        url, 
        { params }, 
        true, // forceRefresh = true
        cacheType as CacheType || CacheType.MOVIE
      );
      
      res.json({
        status: true,
        message: `Cache đã được refresh cho ${url}`,
        dataLength: response.data ? (Array.isArray(response.data) ? response.data.length : Object.keys(response.data).length) : 0
      });
    } catch (error) {
      console.error('Error refreshing cache:', error);
      res.status(500).json({
        status: false,
        message: 'Failed to refresh cache'
      });
    }
  });

  // API để kiểm tra health của cache system
  app.get('/api/cache/health', async (req: Request, res: Response) => {
    try {
      const stats = getCacheStats();
      
      // Tính tổng số keys trong tất cả cache
      const totalKeys = Object.values(stats).reduce((total: number, cache: any) => {
        return total + (cache.keyCount || 0);
      }, 0);
      
      res.json({
        status: true,
        healthy: true,
        totalCacheKeys: totalKeys,
        cacheTypes: Object.keys(stats),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error checking cache health:', error);
      res.status(500).json({
        status: false,
        healthy: false,
        message: 'Cache health check failed'
      });
    }
  });

  // API để lấy cache hit/miss statistics (public endpoint với rate limiting)
  app.get('/api/cache/performance', async (req: Request, res: Response) => {
    try {
      const stats = getCacheStats();
      
      // Tạo summary performance data
      const performanceData = Object.entries(stats).map(([type, data]: [string, any]) => ({
        cacheType: type,
        keyCount: data.keyCount || 0,
        hitRate: data.stats?.hits ? (data.stats.hits / (data.stats.hits + data.stats.misses)) * 100 : 0,
        hits: data.stats?.hits || 0,
        misses: data.stats?.misses || 0
      }));
      
      res.json({
        status: true,
        data: performanceData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting cache performance:', error);
      res.status(500).json({
        status: false,
        message: 'Failed to get cache performance data'
      });
    }
  });
}
