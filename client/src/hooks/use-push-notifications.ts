import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  loading: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<NotificationState>({
    permission: 'default',
    isSupported: 'Notification' in window && 'serviceWorker' in navigator,
    isSubscribed: false,
    subscription: null,
    loading: false
  });

  const { toast } = useToast();

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const checkSubscription = useCallback(async () => {
    if (!state.isSupported) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        setState(prev => ({
          ...prev,
          isSubscribed: !!subscription,
          subscription
        }));
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }, [state.isSupported]);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      toast({
        title: "Không hỗ trợ",
        description: "Trình duyệt của bạn không hỗ trợ push notifications.",
        variant: "destructive"
      });
      return false;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission, loading: false }));

      if (permission === 'granted') {
        toast({
          title: "Đã cấp quyền",
          description: "Bạn sẽ nhận được thông báo về phim mới.",
        });
        return true;
      } else if (permission === 'denied') {
        toast({
          title: "Quyền bị từ chối",
          description: "Bạn có thể bật lại thông báo trong cài đặt trình duyệt.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setState(prev => ({ ...prev, loading: false }));
      toast({
        title: "Lỗi",
        description: "Không thể yêu cầu quyền thông báo.",
        variant: "destructive"
      });
      return false;
    }

    return false;
  }, [state.isSupported, toast]);

  const subscribe = useCallback(async () => {
    if (!state.isSupported || state.permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        throw new Error('Service worker not registered');
      }

      // Use a default VAPID key for development
      // In production, you should generate your own VAPID keys
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIWHWWVWkWVGRWjEuBxnEHVOIIXYdNvlkx8vUo8xKvH7Q2FmqoF5k';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send subscription to server
      try {
        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription)
        });

        if (!response.ok) {
          throw new Error('Failed to save subscription');
        }

        setState(prev => ({
          ...prev,
          isSubscribed: true,
          subscription,
          loading: false
        }));

        toast({
          title: "Đăng ký thành công",
          description: "Bạn sẽ nhận được thông báo về phim mới.",
        });

        return true;
      } catch (serverError) {
        console.error('Error saving subscription to server:', serverError);
        // Even if server fails, we can still use local notifications
        setState(prev => ({
          ...prev,
          isSubscribed: true,
          subscription,
          loading: false
        }));

        toast({
          title: "Đăng ký thành công",
          description: "Thông báo đã được bật (chỉ cục bộ).",
        });

        return true;
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setState(prev => ({ ...prev, loading: false }));
      
      toast({
        title: "Lỗi đăng ký",
        description: "Không thể đăng ký nhận thông báo.",
        variant: "destructive"
      });
      
      return false;
    }
  }, [state.isSupported, state.permission, requestPermission, toast]);

  const unsubscribe = useCallback(async () => {
    if (!state.subscription) return false;

    setState(prev => ({ ...prev, loading: true }));

    try {
      await state.subscription.unsubscribe();

      // Remove subscription from server
      try {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(state.subscription)
        });
      } catch (serverError) {
        console.error('Error removing subscription from server:', serverError);
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
        loading: false
      }));

      toast({
        title: "Đã hủy đăng ký",
        description: "Bạn sẽ không còn nhận thông báo.",
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setState(prev => ({ ...prev, loading: false }));
      
      toast({
        title: "Lỗi hủy đăng ký",
        description: "Không thể hủy đăng ký thông báo.",
        variant: "destructive"
      });
      
      return false;
    }
  }, [state.subscription, toast]);

  const sendTestNotification = useCallback(async () => {
    if (state.permission !== 'granted') {
      await requestPermission();
      return;
    }

    try {
      // Send local notification for testing
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.showNotification('Phim Xuyên Đêm', {
          body: 'Thông báo test từ ứng dụng PWA',
          icon: '/logo-icon.svg',
          badge: '/logo-icon.svg',
          tag: 'test-notification',
          data: { url: '/' },
          actions: [
            {
              action: 'open',
              title: 'Mở ứng dụng',
              icon: '/logo-icon.svg'
            }
          ]
        });

        toast({
          title: "Thông báo test",
          description: "Đã gửi thông báo thử nghiệm.",
        });
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Lỗi gửi thông báo",
        description: "Không thể gửi thông báo test.",
        variant: "destructive"
      });
    }
  }, [state.permission, requestPermission, toast]);

  useEffect(() => {
    if (state.isSupported) {
      setState(prev => ({
        ...prev,
        permission: Notification.permission
      }));
      checkSubscription();
    }
  }, [state.isSupported, checkSubscription]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    checkSubscription
  };
}
