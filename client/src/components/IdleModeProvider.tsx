import React, { createContext, useContext, ReactNode } from 'react';
import { useIdleMode } from '@/hooks/use-idle-mode';
import { usePerformanceOptimization } from '@/hooks/use-performance-optimization';


interface IdleModeContextType {
  isIdle: boolean;
  timeIdle: number;
  lastActivity: Date | null;
  resetIdleTimer: () => void;
  forceIdle: () => void;
  forceActive: () => void;
  throttleAPICall: (originalFn: Function, key: string, idleInterval?: number) => Function;
  shouldRenderComponent: (componentName: string) => boolean;
  isPerformanceMode: boolean;
}

const IdleModeContext = createContext<IdleModeContextType | undefined>(undefined);

interface IdleModeProviderProps {
  children: ReactNode;
  idleTimeout?: number; // milliseconds
  enableScreensaver?: boolean;
}

export function IdleModeProvider({ 
  children, 
  idleTimeout = 300000, // 5 phút
  enableScreensaver = true 
}: IdleModeProviderProps) {
  const idleMode = useIdleMode({ 
    idleTimeout,
    enablePerformanceOptimizations: true 
  });
  
  const performanceOpt = usePerformanceOptimization(idleMode.isIdle, {
    enableAPIThrottling: true,
    enableAnimationReduction: true,
    enableComponentOptimization: true
  });

  const contextValue: IdleModeContextType = {
    ...idleMode,
    ...performanceOpt
  };

  return (
    <IdleModeContext.Provider value={contextValue}>
      {children}
      {enableScreensaver && idleMode.isIdle && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-6xl font-mono mb-4">
              {new Date().toLocaleTimeString()}
            </div>
            <p className="text-lg opacity-70">Nhấn bất kỳ phím nào để tiếp tục</p>
          </div>
        </div>
      )}
    </IdleModeContext.Provider>
  );
}

export function useIdleModeContext() {
  const context = useContext(IdleModeContext);
  if (context === undefined) {
    throw new Error('useIdleModeContext must be used within an IdleModeProvider');
  }
  return context;
}

// HOC để wrap các component cần tối ưu hóa hiệu năng
export function withIdleOptimization<T extends {}>(
  Component: React.ComponentType<T>,
  componentName: string,
  customShouldUpdate?: (prevProps: T, nextProps: T, isIdle: boolean) => boolean
) {
  const WrappedComponent = React.memo((props: T) => {
    const { shouldRenderComponent, isPerformanceMode } = useIdleModeContext();

    // Không render component nếu đang ở chế độ tiết kiệm hiệu năng
    if (!shouldRenderComponent(componentName)) {
      return null;
    }

    return <Component {...props} />;
  }, (prevProps, nextProps) => {
    // Custom comparison logic
    if (customShouldUpdate) {
      try {
        const { isPerformanceMode } = useIdleModeContext();
        return customShouldUpdate(prevProps, nextProps, isPerformanceMode);
      } catch {
        // Fallback nếu hook không available
        return false;
      }
    }
    
    // Default: shallow comparison
    return Object.keys(prevProps as object).every(
      key => (prevProps as any)[key] === (nextProps as any)[key]
    );
  });

  WrappedComponent.displayName = `withIdleOptimization(${Component.displayName || Component.name || componentName})`;
  
  return WrappedComponent;
}
