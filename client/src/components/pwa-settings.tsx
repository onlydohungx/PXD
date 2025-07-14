import { useState, useEffect } from 'react';
import { Settings, Download, Bell, HardDrive, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface PWASettings {
  notificationsEnabled: boolean;
  autoUpdate: boolean;
  offlineMode: boolean;
  cacheImages: boolean;
  backgroundSync: boolean;
}

export function PWASettingsPanel() {
  const [settings, setSettings] = useState<PWASettings>({
    notificationsEnabled: false,
    autoUpdate: true,
    offlineMode: true,
    cacheImages: true,
    backgroundSync: true
  });
  
  const [isSupported, setIsSupported] = useState(false);
  const [installStatus, setInstallStatus] = useState<'not-installed' | 'installable' | 'installed'>('not-installed');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check PWA support
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    // Check install status
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstallStatus('installed');
    } else if ('beforeinstallprompt' in window) {
      setInstallStatus('installable');
    }

    // Load settings from localStorage
    const savedSettings = localStorage.getItem('pwa-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Check for service worker updates
    checkForUpdates();
  }, []);

  const saveSettings = (newSettings: PWASettings) => {
    setSettings(newSettings);
    localStorage.setItem('pwa-settings', JSON.stringify(newSettings));
  };

  const checkForUpdates = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          if (registration.waiting) {
            setUpdateAvailable(true);
          }
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          saveSettings({ ...settings, notificationsEnabled: true });
          toast({
            title: "Thông báo đã được bật",
            description: "Bạn sẽ nhận được thông báo về phim mới.",
          });
        } else {
          toast({
            title: "Không thể bật thông báo",
            description: "Vui lòng cấp quyền thông báo trong cài đặt trình duyệt.",
            variant: "destructive"
          });
        }
      }
    } else {
      saveSettings({ ...settings, notificationsEnabled: false });
      toast({
        title: "Thông báo đã được tắt",
        description: "Bạn sẽ không còn nhận thông báo.",
      });
    }
  };

  const handleUpdateApp = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          toast({
            title: "Đang cập nhật",
            description: "Ứng dụng sẽ được làm mới sau khi cập nhật.",
          });
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (error) {
        console.error('Failed to update app:', error);
        toast({
          title: "Lỗi cập nhật",
          description: "Không thể cập nhật ứng dụng.",
          variant: "destructive"
        });
      }
    }
  };

  const clearAppData = async () => {
    try {
      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Clear localStorage
      localStorage.clear();

      toast({
        title: "Đã xóa dữ liệu ứng dụng",
        description: "Tất cả dữ liệu cache và cài đặt đã được xóa.",
      });

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Failed to clear app data:', error);
      toast({
        title: "Lỗi xóa dữ liệu",
        description: "Không thể xóa dữ liệu ứng dụng.",
        variant: "destructive"
      });
    }
  };

  const getInstallStatusBadge = () => {
    switch (installStatus) {
      case 'installed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Đã cài đặt</Badge>;
      case 'installable':
        return <Badge variant="outline">Có thể cài đặt</Badge>;
      default:
        return <Badge variant="secondary">Chưa cài đặt</Badge>;
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Cài đặt PWA
          </CardTitle>
          <CardDescription>
            Trình duyệt của bạn không hỗ trợ đầy đủ tính năng PWA.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Cài đặt PWA
            </CardTitle>
            <CardDescription>
              Quản lý cài đặt ứng dụng web progressive
            </CardDescription>
          </div>
          {getInstallStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* App Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Trạng thái ứng dụng</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span className="text-sm">Trạng thái cài đặt</span>
              </div>
              {getInstallStatusBadge()}
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                <span className="text-sm">Kết nối</span>
              </div>
              <Badge variant={navigator.onLine ? "default" : "destructive"}>
                {navigator.onLine ? "Online" : "Offline"}
              </Badge>
            </div>
          </div>

          {updateAvailable && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Cập nhật có sẵn</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Phiên bản mới của ứng dụng đã sẵn sàng.
                  </p>
                </div>
                <Button onClick={handleUpdateApp} size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Cập nhật
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Notification Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Thông báo</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Nhận thông báo về phim mới và cập nhật
                </p>
              </div>
            </div>
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={handleNotificationToggle}
            />
          </div>
        </div>

        <Separator />

        {/* Cache Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Cache & Offline</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5" />
                <div>
                  <p className="font-medium">Chế độ Offline</p>
                  <p className="text-sm text-muted-foreground">
                    Cho phép sử dụng ứng dụng khi không có mạng
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.offlineMode}
                onCheckedChange={(checked) => 
                  saveSettings({ ...settings, offlineMode: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5" />
                <div>
                  <p className="font-medium">Cache hình ảnh</p>
                  <p className="text-sm text-muted-foreground">
                    Tự động lưu poster phim để xem offline
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.cacheImages}
                onCheckedChange={(checked) => 
                  saveSettings({ ...settings, cacheImages: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5" />
                <div>
                  <p className="font-medium">Đồng bộ nền</p>
                  <p className="text-sm text-muted-foreground">
                    Tự động đồng bộ dữ liệu khi có mạng trở lại
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.backgroundSync}
                onCheckedChange={(checked) => 
                  saveSettings({ ...settings, backgroundSync: checked })
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* App Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Quản lý ứng dụng</h3>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={checkForUpdates}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Kiểm tra cập nhật
            </Button>
            
            <Button
              variant="destructive"
              onClick={clearAppData}
              className="flex-1"
            >
              Xóa dữ liệu ứng dụng
            </Button>
          </div>
        </div>

        {/* Information */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium">Thông tin PWA:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• PWA cho phép sử dụng như ứng dụng native</li>
            <li>• Hoạt động offline với dữ liệu đã cache</li>
            <li>• Cập nhật tự động khi có phiên bản mới</li>
            <li>• Tiết kiệm dung lượng và tăng tốc độ</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
