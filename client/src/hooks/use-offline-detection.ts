import { useState, useEffect, useCallback } from 'react';

interface OfflineState {
  isOnline: boolean;
  isChecking: boolean;
  lastOfflineAt: Date | null;
  message: string;
}

export function useOfflineDetection() {
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    isChecking: false,
    lastOfflineAt: null,
    message: ''
  });

  // Check network connectivity
  const checkNetworkStatus = useCallback(async () => {
    setState(prev => ({ ...prev, isChecking: true }));

    try {
      // Simple network test
      const response = await fetch('/api/health', { 
        method: 'HEAD', 
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      const isOnline = response.ok;
      setState(prev => ({ 
        ...prev, 
        isChecking: false,
        isOnline,
        message: isOnline ? '' : 'Bạn đang offline. Vui lòng kiểm tra kết nối mạng.'
      }));
      
      return isOnline;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isChecking: false,
        isOnline: false,
        lastOfflineAt: new Date(),
        message: 'Bạn đang offline. Vui lòng kiểm tra kết nối mạng.'
      }));
      return false;
    }
  }, []);

  // Handle Service Worker messages
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NETWORK_STATUS') {
        const { isOnline, message } = event.data;
        
        setState(prev => ({
          ...prev,
          isOnline,
          message: message || '',
          lastOfflineAt: !isOnline ? new Date() : prev.lastOfflineAt
        }));

        // Show notification for offline status
        if (!isOnline) {
          showOfflineNotification(message);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ 
        ...prev, 
        isOnline: true, 
        message: 'Kết nối đã được khôi phục!' 
      }));
      checkNetworkStatus();
    };

    const handleOffline = () => {
      setState(prev => ({ 
        ...prev, 
        isOnline: false, 
        lastOfflineAt: new Date(),
        message: 'Bạn đang offline. Vui lòng kiểm tra kết nối mạng.' 
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkNetworkStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkNetworkStatus]);

  // Show offline notification
  const showOfflineNotification = useCallback((message: string) => {
    // Create a toast notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300';
    notification.style.transform = 'translate(-50%, -100px)';
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span class="font-medium">${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translate(-50%, 0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.transform = 'translate(-50%, -100px)';
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
  }, []);

  return {
    ...state,
    checkNetworkStatus,
    showOfflineNotification
  };
}
