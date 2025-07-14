import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallBanner {
  show: boolean;
  type: 'android' | 'ios' | 'desktop' | 'other';
  canInstall: boolean;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [banner, setBanner] = useState<PWAInstallBanner>({ 
    show: false, 
    type: 'other', 
    canInstall: false 
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installStats, setInstallStats] = useState({
    promptShown: 0,
    installClicked: 0,
    dismissed: 0
  });

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    // Detect platform and capabilities
    const detectPlatform = () => {
      const userAgent = navigator.userAgent;
      const iOS = /iPad|iPhone|iPod/.test(userAgent);
      const android = /Android/.test(userAgent);
      const desktop = !iOS && !android;
      
      setIsIOS(iOS);
      
      if (iOS) return 'ios';
      if (android) return 'android';
      if (desktop) return 'desktop';
      return 'other';
    };

    const platform = detectPlatform();
    
    // Load install statistics from localStorage
    const stats = {
      promptShown: parseInt(localStorage.getItem('pwa-prompt-shown') || '0'),
      installClicked: parseInt(localStorage.getItem('pwa-install-clicked') || '0'),
      dismissed: parseInt(localStorage.getItem('pwa-dismissed') || '0')
    };
    setInstallStats(stats);

    // Don't show if dismissed too many times
    if (stats.dismissed >= 3) return;

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Smart timing - show after user engagement
      const showTimer = setTimeout(() => {
        const lastShown = localStorage.getItem('pwa-last-shown');
        const now = Date.now();
        const daysSinceLastShown = lastShown ? (now - parseInt(lastShown)) / (1000 * 60 * 60 * 24) : 999;
        
        // Only show if not shown recently or user seems engaged
        if (daysSinceLastShown > 3 || stats.promptShown === 0) {
          setBanner({ show: true, type: platform, canInstall: true });
          
          // Update statistics
          const newStats = { ...stats, promptShown: stats.promptShown + 1 };
          setInstallStats(newStats);
          localStorage.setItem('pwa-prompt-shown', newStats.promptShown.toString());
          localStorage.setItem('pwa-last-shown', now.toString());
        }
      }, 15000); // Show after 15 seconds of engagement
      
      return () => clearTimeout(showTimer);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setBanner({ show: false, type: platform, canInstall: false });
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS, show manual install prompt
    if (platform === 'ios' && !localStorage.getItem('ios-install-dismissed')) {
      const iosTimer = setTimeout(() => {
        setBanner({ show: true, type: 'ios', canInstall: false });
      }, 20000);
      
      return () => {
        clearTimeout(iosTimer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Update statistics
    const newStats = { ...installStats, installClicked: installStats.installClicked + 1 };
    setInstallStats(newStats);
    localStorage.setItem('pwa-install-clicked', newStats.installClicked.toString());

    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setBanner({ ...banner, show: false });
      localStorage.setItem('pwa-installed', 'true');
    } else {
      // User dismissed
      const dismissCount = installStats.dismissed + 1;
      localStorage.setItem('pwa-dismissed', dismissCount.toString());
      setBanner({ ...banner, show: false });
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    const dismissCount = installStats.dismissed + 1;
    localStorage.setItem('pwa-dismissed', dismissCount.toString());
    
    if (banner.type === 'ios') {
      localStorage.setItem('ios-install-dismissed', 'true');
    }
    
    setBanner({ ...banner, show: false });
  };

  const getPlatformIcon = () => {
    switch (banner.type) {
      case 'android':
      case 'ios':
        return <Smartphone className="w-5 h-5" />;
      case 'desktop':
        return <Monitor className="w-5 h-5" />;
      default:
        return <Download className="w-5 h-5" />;
    }
  };

  const getPlatformName = () => {
    switch (banner.type) {
      case 'android':
        return 'Android';
      case 'ios':
        return 'iOS';
      case 'desktop':
        return 'Desktop';
      default:
        return 'Thiết bị';
    }
  };

  const getInstallInstructions = () => {
    switch (banner.type) {
      case 'ios':
        return (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Để cài đặt ứng dụng trên iPhone/iPad:</p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Nhấn biểu tượng <Share className="w-4 h-4 inline" /> ở thanh điều hướng</li>
              <li>Cuộn xuống và chọn "Thêm vào Màn hình chính"</li>
              <li>Nhấn "Thêm" để hoàn tất</li>
            </ol>
          </div>
        );
      case 'android':
        return (
          <p className="text-sm text-muted-foreground">
            Nhấn nút "Cài đặt" để thêm Phim Xuyên Đêm vào màn hình chính và trải nghiệm như ứng dụng native.
          </p>
        );
      case 'desktop':
        return (
          <p className="text-sm text-muted-foreground">
            Cài đặt ứng dụng web để truy cập nhanh từ desktop và tận hưởng trải nghiệm tối ưu.
          </p>
        );
      default:
        return null;
    }
  };

  const getFeatures = () => [
    'Truy cập nhanh từ màn hình chính',
    'Hoạt động offline với nội dung đã cache',
    'Nhận thông báo phim mới',
    'Trải nghiệm mượt mà như ứng dụng native',
    'Tiết kiệm dung lượng so với ứng dụng thông thường'
  ];

  if (isInstalled) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <Download className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700 dark:text-green-300">
          Ứng dụng đã được cài đặt thành công! Bạn có thể truy cập từ màn hình chính.
        </AlertDescription>
      </Alert>
    );
  }

  if (!banner.show) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-xl border-2 border-primary/20 bg-background/95 backdrop-blur-md md:bottom-6 md:left-6 md:right-auto md:max-w-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getPlatformIcon()}
            <CardTitle className="text-lg">Cài đặt ứng dụng</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {getPlatformName()}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Trải nghiệm Phim Xuyên Đêm tốt hất với ứng dụng web progressive
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {getInstallInstructions()}
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Tính năng nổi bật:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            {getFeatures().map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex gap-2 pt-2">
          {banner.canInstall && deferredPrompt ? (
            <Button onClick={handleInstallClick} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Cài đặt ngay
            </Button>
          ) : (
            <Button onClick={handleDismiss} variant="outline" className="flex-1">
              Đã hiểu
            </Button>
          )}
          <Button variant="outline" onClick={handleDismiss}>
            Để sau
          </Button>
        </div>
        
        {installStats.promptShown > 0 && (
          <div className="text-xs text-muted-foreground text-center pt-2">
            Đã hiển thị {installStats.promptShown} lần
          </div>
        )}
      </CardContent>
    </Card>
  );
}