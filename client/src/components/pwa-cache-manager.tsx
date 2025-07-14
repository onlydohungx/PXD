import { useState, useEffect } from 'react';
import { Trash2, Download, HardDrive, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface CacheInfo {
  totalSize: number;
  staticCache: number;
  runtimeCache: number;
  imagesCache: number;
  apiCache: number;
  isOnline: boolean;
}

export function PWACacheManager() {
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({
    totalSize: 0,
    staticCache: 0,
    runtimeCache: 0,
    imagesCache: 0,
    apiCache: 0,
    isOnline: navigator.onLine
  });
  const [isClearing, setIsClearing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCacheInfo();
    
    // Listen for online/offline events
    const handleOnline = () => setCacheInfo(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setCacheInfo(prev => ({ ...prev, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadCacheInfo = async () => {
    try {
      if ('serviceWorker' in navigator && 'caches' in window) {
        const cacheNames = await caches.keys();
        let totalSize = 0;
        let staticCache = 0;
        let runtimeCache = 0;
        let imagesCache = 0;
        let apiCache = 0;

        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          const cacheSize = keys.length;
          
          totalSize += cacheSize;
          
          if (cacheName.includes('static')) {
            staticCache += cacheSize;
          } else if (cacheName.includes('runtime')) {
            runtimeCache += cacheSize;
          } else if (cacheName.includes('images')) {
            imagesCache += cacheSize;
          } else if (cacheName.includes('api')) {
            apiCache += cacheSize;
          }
        }

        setCacheInfo(prev => ({
          ...prev,
          totalSize,
          staticCache,
          runtimeCache,
          imagesCache,
          apiCache
        }));
        
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to load cache info:', error);
    }
  };

  const clearAllCaches = async () => {
    setIsClearing(true);
    
    try {
      if ('serviceWorker' in navigator && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        
        // Reset cache info
        setCacheInfo(prev => ({
          ...prev,
          totalSize: 0,
          staticCache: 0,
          runtimeCache: 0,
          imagesCache: 0,
          apiCache: 0
        }));
        
        toast({
          title: "Cache đã được xóa",
          description: "Tất cả dữ liệu cache đã được xóa thành công.",
        });
        
        // Reload page to refresh caches
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast({
        title: "Lỗi xóa cache",
        description: "Không thể xóa cache. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setIsClearing(false);
    }
  };

  const cacheMovieForOffline = async (movieData: any) => {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_MOVIE',
          data: movieData
        });
        
        toast({
          title: "Phim đã được cache",
          description: `${movieData.name} đã được lưu để xem offline.`,
        });
        
        // Refresh cache info
        setTimeout(loadCacheInfo, 1000);
      }
    } catch (error) {
      console.error('Failed to cache movie:', error);
      toast({
        title: "Lỗi cache phim",
        description: "Không thể lưu phim để xem offline.",
        variant: "destructive"
      });
    }
  };

  const getCacheUsagePercentage = () => {
    const maxCacheSize = 500; // Assume max 500 items
    return Math.min((cacheInfo.totalSize / maxCacheSize) * 100, 100);
  };

  const formatCacheSize = (size: number) => {
    if (size === 0) return "0 items";
    if (size === 1) return "1 item";
    return `${size} items`;
  };

  const getCacheStatus = () => {
    if (!cacheInfo.isOnline) {
      return { 
        status: 'offline', 
        message: 'Đang offline - sử dụng cache', 
        color: 'destructive' as const 
      };
    }
    
    if (cacheInfo.totalSize === 0) {
      return { 
        status: 'empty', 
        message: 'Cache trống', 
        color: 'secondary' as const 
      };
    }
    
    return { 
      status: 'active', 
      message: `${cacheInfo.totalSize} items cached`, 
      color: 'default' as const 
    };
  };

  const cacheStatus = getCacheStatus();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Quản lý Cache PWA
            </CardTitle>
            <CardDescription>
              Quản lý dữ liệu offline và cache của ứng dụng
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={cacheStatus.color}>
              {cacheInfo.isOnline ? (
                <Wifi className="w-3 h-3 mr-1" />
              ) : (
                <WifiOff className="w-3 h-3 mr-1" />
              )}
              {cacheStatus.message}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Cache Usage Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Sử dụng Cache</span>
            <span className="text-sm text-muted-foreground">
              {formatCacheSize(cacheInfo.totalSize)}
            </span>
          </div>
          <Progress value={getCacheUsagePercentage()} className="h-2" />
        </div>

        {/* Cache Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Static Assets</span>
              <Badge variant="outline" className="text-xs">
                {formatCacheSize(cacheInfo.staticCache)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Runtime Cache</span>
              <Badge variant="outline" className="text-xs">
                {formatCacheSize(cacheInfo.runtimeCache)}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Images</span>
              <Badge variant="outline" className="text-xs">
                {formatCacheSize(cacheInfo.imagesCache)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">API Data</span>
              <Badge variant="outline" className="text-xs">
                {formatCacheSize(cacheInfo.apiCache)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-xs text-muted-foreground text-center">
            Cập nhật lần cuối: {lastUpdated.toLocaleTimeString('vi-VN')}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadCacheInfo}
            className="flex-1"
            disabled={isClearing}
          >
            <Download className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
          
          <Button
            variant="destructive"
            onClick={clearAllCaches}
            disabled={isClearing || cacheInfo.totalSize === 0}
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isClearing ? 'Đang xóa...' : 'Xóa Cache'}
          </Button>
        </div>

        {/* Tips */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium">Mẹo sử dụng:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Cache giúp ứng dụng hoạt động khi không có mạng</li>
            <li>• Xóa cache nếu gặp lỗi hoặc muốn giải phóng bộ nhớ</li>
            <li>• Cache sẽ tự động làm mới khi có phiên bản mới</li>
            <li>• Dữ liệu quan trọng sẽ được ưu tiên cache</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
