import { useState, useEffect, useRef, useCallback } from 'react';

interface IdleModeOptions {
  idleTimeout?: number; // milliseconds
  enablePerformanceOptimizations?: boolean;
}

interface IdleModeState {
  isIdle: boolean;
  timeIdle: number;
  lastActivity: Date | null;
}

export function useIdleMode(options: IdleModeOptions = {}) {
  const {
    idleTimeout = 300000, // 5 phút mặc định
    enablePerformanceOptimizations = true
  } = options;

  const [state, setState] = useState<IdleModeState>({
    isIdle: false,
    timeIdle: 0,
    lastActivity: null
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const idleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset idle timer
  const resetIdleTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (idleIntervalRef.current) {
      clearInterval(idleIntervalRef.current);
    }

    setState(prev => ({
      ...prev,
      isIdle: false,
      timeIdle: 0,
      lastActivity: new Date()
    }));

    startTimeRef.current = null;

    // Bắt đầu đếm thời gian chờ
    timeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isIdle: true,
        lastActivity: prev.lastActivity
      }));
      
      startTimeRef.current = new Date();
      
      // Bắt đầu đếm thời gian idle
      idleIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const timeIdle = Date.now() - startTimeRef.current.getTime();
          setState(prev => ({
            ...prev,
            timeIdle
          }));
        }
      }, 1000);
    }, idleTimeout);
  }, [idleTimeout]);

  // Các sự kiện cần theo dõi
  const events = [
    'mousedown',
    'mousemove', 
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'keydown'
  ];

  useEffect(() => {
    // Thêm event listeners
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    // Khởi tạo timer
    resetIdleTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer, true);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (idleIntervalRef.current) {
        clearInterval(idleIntervalRef.current);
      }
    };
  }, [resetIdleTimer]);

  // Performance optimizations
  useEffect(() => {
    if (!enablePerformanceOptimizations) return;

    if (state.isIdle) {
      // Giảm tần suất các animation
      document.documentElement.style.setProperty('--animation-speed', '0.1');
      
      // Thêm class để CSS có thể điều khiển
      document.documentElement.classList.add('idle-mode');
    } else {
      // Khôi phục tốc độ animation bình thường
      document.documentElement.style.setProperty('--animation-speed', '1');
      
      // Xóa class idle
      document.documentElement.classList.remove('idle-mode');
    }
  }, [state.isIdle, enablePerformanceOptimizations]);

  return {
    ...state,
    resetIdleTimer,
    forceIdle: () => {
      setState(prev => ({
        ...prev,
        isIdle: true,
        lastActivity: prev.lastActivity || new Date()
      }));
      startTimeRef.current = new Date();
    },
    forceActive: resetIdleTimer
  };
}
