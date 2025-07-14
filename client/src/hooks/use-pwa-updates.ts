import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PWAUpdateState {
  updateAvailable: boolean;
  installing: boolean;
  waitingWorker: ServiceWorker | null;
  isUpdateReady: boolean;
  lastCheck: Date | null;
}

export function usePWAUpdates() {
  const [updateState, setUpdateState] = useState<PWAUpdateState>({
    updateAvailable: false,
    installing: false,
    waitingWorker: null,
    isUpdateReady: false,
    lastCheck: null
  });
  
  const { toast } = useToast();

  const checkForUpdates = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          setUpdateState(prev => ({ ...prev, lastCheck: new Date() }));
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    }
  }, []);

  const installUpdate = useCallback(() => {
    if (updateState.waitingWorker) {
      updateState.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setUpdateState(prev => ({ 
        ...prev, 
        installing: true,
        updateAvailable: false 
      }));
      
      toast({
        title: "Đang cập nhật ứng dụng",
        description: "Ứng dụng sẽ được làm mới sau khi cập nhật xong.",
      });
    }
  }, [updateState.waitingWorker, toast]);

  const dismissUpdate = useCallback(() => {
    setUpdateState(prev => ({ 
      ...prev, 
      updateAvailable: false,
      waitingWorker: null 
    }));
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleServiceWorkerUpdate = (registration: ServiceWorkerRegistration) => {
        const waitingWorker = registration.waiting;
        
        if (waitingWorker) {
          setUpdateState(prev => ({
            ...prev,
            updateAvailable: true,
            waitingWorker: waitingWorker,
            isUpdateReady: true
          }));

          toast({
            title: "Cập nhật có sẵn",
            description: "Phiên bản mới của ứng dụng đã sẵn sàng để cài đặt.",
          });
        }
      };

      const handleControllerChange = () => {
        if (updateState.installing) {
          setUpdateState(prev => ({ 
            ...prev, 
            installing: false,
            isUpdateReady: false 
          }));
          
          toast({
            title: "Cập nhật hoàn tất",
            description: "Ứng dụng đã được cập nhật thành công.",
          });
          
          // Reload the page to use the new version
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      };

      // Check for existing registration
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          handleServiceWorkerUpdate(registration);
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  handleServiceWorkerUpdate(registration);
                }
              });
            }
          });
        }
      });

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      // Auto check for updates every 30 minutes
      const updateInterval = setInterval(checkForUpdates, 30 * 60 * 1000);

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        clearInterval(updateInterval);
      };
    }
  }, [updateState.installing, installUpdate, toast, checkForUpdates]);

  return {
    ...updateState,
    checkForUpdates,
    installUpdate,
    dismissUpdate
  };
}
