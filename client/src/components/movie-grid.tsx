import { useState, useEffect, useCallback, useMemo } from "react";
import { MovieCard } from "@/components/movie-card";

interface Movie {
  slug: string;
  name: string;
  poster_url: string;
  thumb_url?: string;
  year?: number;
  quality?: string;
  tmdb?: {
    vote_average?: number;
  };
}

interface MovieGridProps {
  movies: Movie[];
  showTimestamp?: boolean;
  timestamps?: string[];
  reduceMotion?: boolean; // New prop to allow parent to control animation behavior
}

export function MovieGrid({ 
  movies, 
  showTimestamp = false, 
  timestamps = [], 
  reduceMotion = false 
}: MovieGridProps) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [animatedItems, setAnimatedItems] = useState<number[]>([]);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);

  // Check device performance only once on component mount
  useEffect(() => {
    // Simple detection for low-end devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isOldDevice = /Android [4-7]|iPhone OS [7-9]|iPad OS [7-9]/i.test(navigator.userAgent);
    
    setIsLowEndDevice(isMobile || prefersReducedMotion || isOldDevice);
  }, []);

  // Skip animation for low-end devices or when reduceMotion is true from parent
  const shouldAnimateItems = !reduceMotion && !isLowEndDevice;

  // Optimized staggered animation that runs fewer timeouts for better performance
  useEffect(() => {
    if (!shouldAnimateItems) {
      // Immediately show all items without animation for low-end devices
      setAnimatedItems(Array.from({ length: movies.length }, (_, i) => i));
      return;
    }

    const batchSize = 3; // Animate multiple items at once to reduce timeouts
    const staggerDelay = 40; // Slightly faster animation (was 50ms)
    
    const animationTimeout = setTimeout(() => {
      let currentIndex = 0;
      
      const animateBatch = () => {
        if (currentIndex >= movies.length) return;
        
        const batchEnd = Math.min(currentIndex + batchSize, movies.length);
        const newIndices = Array.from(
          { length: batchEnd - currentIndex }, 
          (_, i) => currentIndex + i
        );
        
        setAnimatedItems(prev => [...prev, ...newIndices]);
        currentIndex = batchEnd;
        
        if (currentIndex < movies.length) {
          setTimeout(animateBatch, staggerDelay);
        }
      };
      
      animateBatch();
    }, 50); // Start sooner (was 100ms)
    
    return () => clearTimeout(animationTimeout);
  }, [movies.length, shouldAnimateItems]);

  // Memoized play click handler to avoid recreation on each render
  const handlePlayClick = useCallback((index: number) => {
    setPlayingIndex(index);
  }, []);

  // Memoized date formatter to avoid recreation on each render
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }).format(date);
    } catch (error) {
      return dateString; // Fallback if date parsing fails
    }
  }, []);

  if (!movies || movies.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Không có phim nào để hiển thị</p>
      </div>
    );
  }

  // Optimize rendering based on device capability
  const renderOptimizedGrid = useMemo(() => {
    // Choose different classes based on device capability
    const getItemClass = (index: number) => {
      if (isLowEndDevice || reduceMotion) {
        // Simple rendering for low-end devices
        return 'opacity-100';
      } else {
        // Full animation for capable devices
        return `transform transition-all duration-300 ease-out hover:-translate-y-2 ${
          animatedItems.includes(index) ? 'card-fade-in' : 'opacity-0'
        }`;
      }
    };

    // Choose different hover effect based on device capability
    const getCardWrapperClass = () => {
      if (isLowEndDevice || reduceMotion) {
        // No 3D effect for low-end devices
        return '';
      } else {
        // Full 3D effect for capable devices
        return 'hover-card-3d';
      }
    };

    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5 lg:gap-6`}>
        {movies.map((movie, index) => (
          <div 
            key={`${movie.slug}-${index}`} 
            className={getItemClass(index)}
            style={
              isLowEndDevice || reduceMotion 
                ? {} // No animation styles for low-end devices
                : { 
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'forwards'
                  }
            }
          >
            <div className={getCardWrapperClass()}>
              <MovieCard
                slug={movie.slug}
                title={movie.name}
                poster={movie.poster_url}
                year={movie.year ? movie.year.toString() : undefined}
                rating={movie.tmdb?.vote_average}
                quality={movie.quality || "HD"}
                onPlayClick={(e) => handlePlayClick(index)}
              />
            </div>
            
            {showTimestamp && timestamps && timestamps[index] && (
              <div className="mt-2 text-xs text-foreground/60 bg-black/40 backdrop-blur-sm rounded-full py-1.5 px-3 mx-auto shadow-lg border border-white/5 flex items-center justify-center">
                <svg className="w-3 h-3 mr-1 text-primary/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(timestamps[index])}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }, [movies, animatedItems, isLowEndDevice, reduceMotion, formatDate, handlePlayClick, showTimestamp, timestamps]);

  return renderOptimizedGrid;
}
