import { useState, useEffect, createContext, useContext } from 'react';
import { useLocation } from 'wouter';

interface LoadingState {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  startLoading: () => void;
  finishLoading: () => void;
}

const LoadingContext = createContext<LoadingState | null>(null);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [location] = useLocation();

  const startLoading = () => setIsLoading(true);
  const finishLoading = () => setIsLoading(false);

  // Reset loading state on route change
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate a network request
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading, startLoading, finishLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoadingState() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingState must be used within a LoadingProvider');
  }
  return context;
}

export function withLoading<T extends object>(
  Component: React.ComponentType<T>,
  SkeletonComponent: React.ComponentType<any>
): React.FC<T> {
  return function WithLoadingComponent(props: T) {
    const { isLoading } = useLoadingState();
    
    if (isLoading) {
      return <SkeletonComponent {...props} />;
    }
    
    return <Component {...props} />;
  };
}
