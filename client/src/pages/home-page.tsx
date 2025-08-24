import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  fetchMovies, 
  fetchCategories, 
  fetchCountries, 
  fetchFavorites, 
  fetchTrendingMovies,
  fetchTrendingTodayMovies 
} from "@/lib/api";
import { fetchWatchHistory } from "@/lib/api-watch-history";
import { useAuth } from "@/hooks/use-auth";
import { 
  Play, 
  TrendingUp, 
  Calendar, 
  Star, 
  Heart, 
  History, 
  Film, 
  Sparkles,
  ArrowRight,
  Clock,
  Zap,
  Award,
  Flame,
  Globe,
  Eye,
  ChevronLeft,
  ChevronRight

} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { HeroSection } from "@/components/hero-section";
import { NotificationDisplay } from "@/components/notification-display";
import { RecommendedMoviesSection } from "@/components/RecommendedMovies";
import { LoadingSpinner, LoadingCard } from "@/components/ui/loading-spinner";
import { HeroSkeleton, MovieGridSkeleton, SectionSkeleton } from "@/components/ui/skeleton-loader";
import { TrendingMovies } from "@/components/trending-movies";
import { ContinueWatchingCard } from "@/components/continue-watching-card";
import { LazySection } from "@/components/lazy-section";
import { WebsiteAnnouncementBanner } from "@/components/website-announcement-banner";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("discovery");

  // Fetch hero movie with caching - highest priority
  const { data: heroData, isLoading: isHeroLoading } = useQuery({
    queryKey: ['/api/movies/hero'],
    queryFn: () => fetchMovies({ page: 1, limit: 1, sort_field: "modified_time", sort_type: "desc" }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch trending today movies with priority loading
  const { data: trendingTodayData, isLoading: isTrendingTodayLoading } = useQuery({
    queryKey: ['/api/movies/trending-today'],
    queryFn: () => fetchTrendingTodayMovies(8), // Increase to 8 for better UX
    staleTime: 3 * 60 * 1000, // Increase cache time
    gcTime: 10 * 60 * 1000,
  });

  // Lazy load other sections - only when in view
  const { data: trendingData, isLoading: isTrendingLoading } = useQuery({
    queryKey: ['/api/movies/trending'],
    queryFn: () => fetchTrendingMovies(6),
    staleTime: 3 * 60 * 1000,
    gcTime: 8 * 60 * 1000,
    enabled: activeTab === "discovery", // Only load when tab is active
  });

  // Lazy load new releases
  const { data: newReleasesData, isLoading: isNewReleasesLoading } = useQuery({
    queryKey: ['/api/movies/new'],
    queryFn: () => fetchMovies({ 
      page: 1,
      sort_field: "modified_time",
      sort_type: "desc",
      limit: 6 // Reduce initial load
    }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: activeTab === "discovery",
  });

  // Lazy load Korean movies
  const { data: koreanData, isLoading: isKoreanLoading } = useQuery({
    queryKey: ['/api/country/han-quoc'],
    queryFn: () => 
      fetch(`/api/country/han-quoc?page=1&limit=6&sort_field=modified_time&sort_type=desc`)
        .then(res => res.json()),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: activeTab === "discovery",
  });

  // Fetch watch history for authenticated users - lazy load
  const { data: watchHistory } = useQuery({
    queryKey: ['/api/watch-history'],
    queryFn: fetchWatchHistory,
    enabled: isAuthenticated,
  });

  // Fetch favorites for authenticated users
  const { data: favorites } = useQuery({
    queryKey: ['/api/favorites'],
    queryFn: fetchFavorites,
    enabled: isAuthenticated,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const MovieCard = ({ movie, index }: { movie: any, index: number }) => {
    // Handle different data structures from watchHistory vs regular movies
    const movieSlug = movie.slug || movie.movieSlug;
    
    // For watch history items with movieDetails nested structure
    const movieDetails = movie.movieDetails || movie;
    const movieName = movieDetails.name || movie.name || movie.movieName || movie.title;
    const moviePoster = movieDetails.poster_url || movieDetails.thumb_url || movie.poster_url || movie.thumb_url;
    const movieYear = movieDetails.year || movie.year || movie.releaseYear;
    const movieQuality = movieDetails.quality || movie.quality || movie.resolution;
    
    // Determine movie type
    const movieType = movie.type || movieDetails.type || (movie.episodeCount > 1 ? 'series' : 'single');
    
    return (
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -12, scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="group cursor-pointer"
      >
        <Link href={`/movie/${movieSlug}`}>
          <Card className="movie-card-premium group h-full flex flex-col relative overflow-hidden transform-gpu">
            {/* Enhanced Multi-layer Glow Effects */}
            <div className="movie-card-overlay" />
            <div className="absolute -inset-2 bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-pink-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 -z-10" />
            <div className="absolute -inset-1 bg-gradient-to-br from-indigo-400/30 via-purple-400/25 to-pink-400/30 rounded-2xl blur-md opacity-0 group-hover:opacity-80 transition-all duration-500 -z-10" />
            
            <div className="relative aspect-[2/3] overflow-hidden rounded-t-[20px]">
              <img
                src={moviePoster || '/placeholder-movie.jpg'}
                alt={movieName}
                className="movie-card-image w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  // Create a simple poster placeholder with movie name
                  const canvas = document.createElement('canvas');
                  canvas.width = 300;
                  canvas.height = 450;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    // Enhanced gradient background
                    const gradient = ctx.createLinearGradient(0, 0, 0, 450);
                    gradient.addColorStop(0, '#1e293b');
                    gradient.addColorStop(0.5, '#334155');
                    gradient.addColorStop(1, '#0f172a');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, 300, 450);
                    
                    // Movie icon with glow
                    ctx.shadowColor = '#6366f1';
                    ctx.shadowBlur = 20;
                    ctx.fillStyle = '#6366f1';
                    ctx.font = '60px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('🎬', 150, 200);
                    
                    // Movie name
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    const text = movieName || 'Phim';
                    ctx.fillText(text.length > 20 ? text.substring(0, 20) + '...' : text, 150, 280);
                  }
                  e.currentTarget.src = canvas.toDataURL();
                }}
              />
              
              {/* Enhanced gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
              
              {/* Premium Rating Badge */}
              {movie.tmdb?.vote_average > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, y: -10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
                  className="absolute top-3 left-3 z-20"
                >
                  <Badge className="premium-badge text-black text-xs font-bold px-2.5 py-1.5 rounded-full">
                    <Star className="w-3 h-3 mr-1.5 fill-current" />
                    {movie.tmdb.vote_average.toFixed(1)}
                  </Badge>
                </motion.div>
              )}

              {/* Enhanced Quality Badge */}
              {movieQuality && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, y: -10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.1, type: "spring", stiffness: 300 }}
                  className="absolute top-3 right-3 z-20"
                >
                  <Badge className="quality-badge text-white text-xs font-bold px-2.5 py-1.5 rounded-full">
                    <span className="text-shadow">{movieQuality}</span>
                  </Badge>
                </motion.div>
              )}

              {/* Cinematic Progress Badge */}
              {movie.progress && movie.progress > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, x: -10 }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 300 }}
                  className="absolute bottom-3 left-3 z-20"
                >
                  <Badge className="bg-gradient-to-r from-cyan-500/90 to-blue-500/90 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1.5 rounded-full border border-cyan-400/30">
                    <Clock className="w-3 h-3 mr-1.5" />
                    {Math.round(movie.progress * 100)}%
                  </Badge>
                  {/* Progress Bar */}
                  <div className="absolute -bottom-0.5 left-0 right-0 h-1 bg-black/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 transition-all duration-1000"
                      style={{ width: `${movie.progress * 100}%` }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Ultra Premium Play Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-600 z-30">
                <motion.div
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative"
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  {/* Outer Glow Ring */}
                  <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 blur-lg animate-pulse" />
                  
                  {/* Main Play Button */}
                  <div className="relative w-16 h-16 rounded-full flex items-center justify-center overflow-hidden"
                       style={{
                         background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(168, 85, 247, 0.95))',
                         boxShadow: `
                           0 0 40px rgba(102, 126, 234, 0.6),
                           0 8px 25px rgba(0, 0, 0, 0.4),
                           inset 0 1px 0 rgba(255, 255, 255, 0.3),
                           inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                         `
                       }}>
                    {/* Inner Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/10 to-transparent rounded-full" />
                    
                    {/* Play Icon */}
                    <Play className="w-7 h-7 text-white ml-1 drop-shadow-lg relative z-10" />
                  </div>
                  
                  {/* Ripple Effect */}
                  <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
                </motion.div>
              </div>

              {/* Premium Trending Indicator */}
              {movie.view_count > 1000 && (
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, -2, 0],
                    y: [0, -2, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-12 left-1/2 -translate-x-1/2 z-20"
                >
                  <Badge className="trending-badge text-white text-xs font-bold px-3 py-1.5 rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <TrendingUp className="w-3 h-3 mr-1.5 relative z-10" />
                    <span className="relative z-10">TRENDING</span>
                  </Badge>
                </motion.div>
              )}

              {/* View count badge in bottom right corner */}
              {(movie.view_count || movie.viewCount || movie.dailyViewCount) && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  className="absolute bottom-3 right-3"
                >
                  <Badge className="bg-black/70 backdrop-blur-sm text-white text-xs font-medium shadow-lg border border-white/10">
                    <Eye className="w-3 h-3 mr-1" />
                    {(() => {
                      const viewCount = movie.view_count || movie.viewCount || movie.dailyViewCount;
                      return viewCount > 1000 ? `${(viewCount / 1000).toFixed(1)}K` : viewCount;
                    })()}
                  </Badge>
                </motion.div>
              )}
            </div>
            
            <CardContent className="movie-card-content p-5 relative flex-1 flex flex-col justify-between min-h-[110px]">
              {/* Movie Title with Premium Typography */}
              <h3 className="font-bold text-sm line-clamp-2 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-300 group-hover:via-purple-300 group-hover:to-pink-300 group-hover:bg-clip-text transition-all duration-500 min-h-[2.5rem] flex items-start mb-3 text-shadow-sm">
                {movieName}
              </h3>
              
              {/* Enhanced Movie Metadata */}
              <div className="flex items-center justify-between mt-auto space-y-2">
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-slate-300/90 font-medium line-clamp-1 bg-black/20 px-2 py-1 rounded-md backdrop-blur-sm border border-white/10">
                    {movieYear} • {movieType === 'series' ? 'Phim bộ' : 'Phim lẻ'}
                    {movie.episodeIndex !== undefined && (
                      <span> • Tập {movie.episodeIndex + 1}</span>
                    )}
                  </p>
                </div>
                
                {/* Enhanced View Count with Icon */}
                {movie.view_count && (
                  <motion.div 
                    className="flex items-center gap-1.5 text-xs text-slate-300 flex-shrink-0 bg-black/30 px-2.5 py-1.5 rounded-full backdrop-blur-sm border border-white/10"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Eye className="w-3 h-3 text-indigo-400" />
                    <span className="font-medium">
                      {movie.view_count > 1000 ? `${(movie.view_count / 1000).toFixed(1)}K` : movie.view_count}
                    </span>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  };

  // Component for horizontal scroll section with navigation
  const HorizontalMovieScroll = ({ 
    movies, 
    isLoading, 
    title, 
    description, 
    icon: Icon,
    loadingCount = 8
  }: {
    movies: any[],
    isLoading: boolean,
    title: string,
    description: string,
    icon: any,
    loadingCount?: number
  }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [isAutoScrolling, setIsAutoScrolling] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const checkScrollButtons = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    const scrollLeft = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        setIsAutoScrolling(false);
      }
    };

    const scrollRight = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        setIsAutoScrolling(false);
      }
    };

    const startAutoScroll = () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
      
      autoScrollIntervalRef.current = setInterval(() => {
        if (scrollRef.current && isAutoScrolling && isInView) {
          const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
          
          if (scrollLeft >= scrollWidth - clientWidth - 10) {
            // Reset to beginning when reached end
            scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            // Continue scrolling right
            scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
          }
        }
      }, 3000);
    };

    // Intersection Observer to detect when section comes into view
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              setIsAutoScrolling(true);
              // Start auto scroll when section comes into view
              setTimeout(() => {
                startAutoScroll();
              }, 1000);
            } else {
              setIsInView(false);
              setIsAutoScrolling(false);
              // Stop auto scroll when section leaves view
              if (autoScrollIntervalRef.current) {
                clearInterval(autoScrollIntervalRef.current);
              }
            }
          });
        },
        {
          threshold: 0.3, // Trigger when 30% of the section is visible
          rootMargin: '0px 0px -10% 0px' // Start slightly before fully in view
        }
      );

      if (sectionRef.current) {
        observer.observe(sectionRef.current);
      }

      return () => {
        if (sectionRef.current) {
          observer.unobserve(sectionRef.current);
        }
        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current);
        }
      };
    }, []);

    useEffect(() => {
      const handleScroll = () => {
        checkScrollButtons();
        setIsAutoScrolling(false);
        
        // Resume auto scroll after 5 seconds of inactivity (only if in view)
        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current);
        }
        
        setTimeout(() => {
          if (isInView) {
            setIsAutoScrolling(true);
            startAutoScroll();
          }
        }, 5000);
      };

      const scrollElement = scrollRef.current;
      if (scrollElement) {
        scrollElement.addEventListener('scroll', handleScroll);
        checkScrollButtons();
      }

      return () => {
        if (scrollElement) {
          scrollElement.removeEventListener('scroll', handleScroll);
        }
      };
    }, [isInView]);

    useEffect(() => {
      if (isAutoScrolling) {
        startAutoScroll();
      }
      
      return () => {
        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current);
        }
      };
    }, [isAutoScrolling]);

    return (
      <motion.section ref={sectionRef} variants={itemVariants} className="mb-12 relative">
        <SectionHeader
          icon={Icon}
          title={title}
          description={description}
        />
        
        <div className="relative group">
          {/* Navigation Buttons - Only visible on desktop */}
          <motion.button
            className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden lg:flex items-center justify-center w-14 h-14 rounded-full glass-card hover:bg-white/10 transition-all duration-300 shadow-lg ${!canScrollLeft ? 'opacity-30 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100 hover:shadow-indigo-500/25'}`}
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            whileHover={{ scale: 1.1, boxShadow: '0 0 25px rgba(102, 126, 234, 0.4)' }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-6 h-6 text-white drop-shadow-lg" />
          </motion.button>

          <motion.button
            className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden lg:flex items-center justify-center w-14 h-14 rounded-full glass-card hover:bg-white/10 transition-all duration-300 shadow-lg ${!canScrollRight ? 'opacity-30 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100 hover:shadow-indigo-500/25'}`}
            onClick={scrollRight}
            disabled={!canScrollRight}
            whileHover={{ scale: 1.1, boxShadow: '0 0 25px rgba(102, 126, 234, 0.4)' }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="w-6 h-6 text-white drop-shadow-lg" />
          </motion.button>

          {/* Movie Scroll Container */}
          {isLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-4 horizontal-scroll">
              {[...Array(loadingCount)].map((_, i) => (
                <div key={i} className="flex-none w-48 md:w-56">
                  <LoadingCard />
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              ref={scrollRef}
              variants={containerVariants}
              className="flex gap-4 overflow-x-auto pb-4 horizontal-scroll"
              onMouseEnter={() => setIsAutoScrolling(false)}
              onMouseLeave={() => {
                setTimeout(() => setIsAutoScrolling(true), 3000);
              }}
            >
              {movies?.slice(0, 12).map((movie: any, index: number) => (
                <motion.div 
                  key={movie.slug} 
                  className="flex-none w-48 md:w-56 flex"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <MovieCard movie={movie} index={index} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.section>
    );
  };

  const SectionHeader = ({ icon: Icon, title, description, viewAllHref }: {
    icon: any,
    title: string,
    description: string,
    viewAllHref?: string
  }) => (
    <motion.div 
      variants={itemVariants}
      className="flex items-center justify-between mb-8"
    >
      <div className="flex items-center gap-6">
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="p-4 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-indigo-400/30 shadow-2xl shadow-indigo-500/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl" />
          <Icon className="w-7 h-7 text-indigo-400 relative z-10" />
        </motion.div>
        <div>
          <motion.h2 
            className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent mb-1"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {title}
          </motion.h2>
          <p className="text-sm text-slate-400 font-medium">{description}</p>
        </div>
      </div>
      
      {viewAllHref && (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href={viewAllHref}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="btn-primary-glow text-white hover:text-white border-0 font-cinematic font-semibold transition-all duration-300 group"
            >
              Xem tất cả
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </motion.div>
            </Button>
          </Link>
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/50 to-purple-950/30 relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
        {/* Primary gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-40 -left-40 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 0.8, 1.2],
            rotate: [360, 180, 0],
            opacity: [0.15, 0.05, 0.15]
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [0.8, 1.1, 0.8],
            rotate: [0, -180, -360],
            opacity: [0.08, 0.12, 0.08]
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-cyan-500/15 via-teal-500/15 to-emerald-500/15 blur-3xl"
        />
        

      </div>

      {/* Subtle grid overlay */}
      <div className="fixed inset-0 -z-40 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-16"
        >
          {isHeroLoading ? (
            <HeroSkeleton />
          ) : heroData?.items?.[0] ? (
            <HeroSection movie={heroData.items[0]} />
          ) : null}
        </motion.div>

        {/* Notification Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-12"
        >
          <NotificationDisplay />
        </motion.div>

        {/* Enhanced User Personal Content */}
        {isAuthenticated && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-16"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-8"
              >
                <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-2 rounded-2xl shadow-2xl shadow-indigo-500/10 max-w-md mx-auto">
                  <TabsTrigger 
                    value="discovery" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/50 text-slate-400 hover:text-white transition-all duration-300 rounded-xl font-semibold"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Khám phá
                  </TabsTrigger>
                  <TabsTrigger 
                    value="personal"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-pink-500/50 text-slate-400 hover:text-white transition-all duration-300 rounded-xl font-semibold"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Cá nhân
                  </TabsTrigger>
                </TabsList>
              </motion.div>

              <TabsContent value="personal" className="mt-6">
                {/* Watch History */}
                {watchHistory && Array.isArray(watchHistory) && watchHistory.length > 0 && (
                  <motion.section variants={itemVariants} className="mb-8">
                    <SectionHeader
                      icon={History}
                      title="Tiếp tục xem"
                      description="Các phim bạn đang theo dõi"
                      viewAllHref="/profile"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 auto-rows-fr">
                      {watchHistory.slice(0, 8).map((item: any, index: number) => (
                        <ContinueWatchingCard 
                          key={item.movieSlug} 
                          movieSlug={item.movieSlug}
                          title={item.movieDetails?.name || item.name || item.movieSlug}
                          poster={item.movieDetails?.poster_url || item.movieDetails?.thumb_url || item.poster_url || item.thumb_url}
                          year={item.movieDetails?.year?.toString() || item.year?.toString()}
                          quality={item.movieDetails?.quality || item.quality}
                          episodeIndex={item.episodeIndex}
                          progress={item.progress}
                          currentTime={item.currentTime}
                          duration={item.duration}
                        />
                      ))}
                    </div>
                  </motion.section>
                )}

                {/* Favorites */}
                {favorites && Array.isArray(favorites) && favorites.length > 0 && (
                  <motion.section variants={itemVariants} className="mb-8">
                    <SectionHeader
                      icon={Heart}
                      title="Phim yêu thích"
                      description="Bộ sưu tập phim được yêu thích"
                      viewAllHref="/profile"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 auto-rows-fr">
                      {favorites.slice(0, 8).map((item: any, index: number) => (
                        <MovieCard key={item.movieSlug} movie={item} index={index} />
                      ))}
                    </div>
                  </motion.section>
                )}

                {/* AI Recommendations */}
                <motion.section variants={itemVariants}>
                  <RecommendedMoviesSection />
                </motion.section>
              </TabsContent>

              <TabsContent value="discovery" className="mt-6">
                {/* New Releases */}
                <motion.section variants={itemVariants} className="mb-12">
                  <SectionHeader
                    icon={Calendar}
                    title="Phim mới cập nhật"
                    description="Phim mới được thêm gần đây"
                  />
                  {isNewReleasesLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 auto-rows-fr">
                      {[...Array(8)].map((_, i) => (
                        <LoadingCard key={i} />
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      variants={containerVariants}
                      className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 auto-rows-fr"
                    >
                      {newReleasesData?.items?.slice(0, 8).map((movie: any, index: number) => (
                        <MovieCard key={movie.slug} movie={movie} index={index} />
                      ))}
                    </motion.div>
                  )}
                </motion.section>

                {/* Trending Today Movies - Horizontal Scroll with Rankings */}
                <motion.section variants={itemVariants} className="mb-16 relative">
                  {/* Enhanced section header */}
                  <div className="flex items-center justify-between mb-8 px-1">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 flex items-center justify-center shadow-2xl shadow-orange-500/30"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                        <Sparkles className="w-6 h-6 text-white relative z-10" />
                        {/* Animated sparkles */}
                        <motion.div
                          className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.div>
                      <div>
                        <motion.h2 
                          className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          Thịnh hành hôm nay
                        </motion.h2>
                        <motion.div 
                          className="h-1 w-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mt-1"
                          initial={{ width: 0 }}
                          animate={{ width: "5rem" }}
                          transition={{ delay: 0.4, duration: 0.8 }}
                        />
                        <p className="text-sm text-slate-400 mt-1">Top phim có lượt xem cao nhất hôm nay</p>
                      </div>
                    </div>
                    {/* Fire animation indicator */}
                    <motion.div
                      className="text-2xl"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      
                    </motion.div>
                  </div>
                  
                  {isTrendingTodayLoading ? (
                    <div className="flex space-x-4 py-2 overflow-x-scroll hide-scrollbar">
                      {Array(10).fill(0).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-[180px] md:w-[220px]">
                          <div className="aspect-[2/3] bg-gradient-to-br from-gray-800/60 to-gray-900/60 animate-pulse rounded-xl relative">
                            <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col">
                              <div className="h-4 bg-gray-700/60 rounded w-2/3 mb-2"></div>
                              <div className="h-3 bg-gray-700/40 rounded w-1/3"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      className="flex space-x-5 py-2 overflow-x-scroll hide-scrollbar"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {trendingTodayData?.items?.slice(0, 10).map((movie: any, index: number) => (
                        <motion.div 
                          key={movie.slug} 
                          variants={itemVariants} 
                          className="flex-shrink-0 w-[200px] md:w-[240px] group"
                          whileHover={{ y: -8 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <Link href={`/movie/${movie.slug}`} className="block h-full">
                            <div className="relative h-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 group-hover:border-orange-500/50 shadow-2xl group-hover:shadow-orange-500/25 transition-all duration-700">
                              {/* Glow effect on hover */}
                              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl"></div>
                              
                              <div className="aspect-[2/3] relative overflow-hidden rounded-2xl">
                                <img
                                  src={movie.poster_url || movie.thumb_url || '/placeholder-portrait.svg'}
                                  alt={movie.name}
                                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                                  loading="lazy"
                                  decoding="async"
                                />
                                
                                {/* Ranking badge with enhanced styling */}
                                <motion.div
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                                  className="absolute top-4 left-4 z-20"
                                >
                                  <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-2xl border-2 backdrop-blur-sm ${
                                    index === 0 ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-black border-yellow-300/50' :
                                    index === 1 ? 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 text-black border-gray-200/50' :
                                    index === 2 ? 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white border-orange-300/50' :
                                    'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 text-white border-slate-500/50'
                                  }`}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                                    <span className="relative z-10 font-extrabold">#{index + 1}</span>
                                    {/* Special crown for #1 */}
                                    {index === 0 && (
                                      <motion.div
                                        className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-yellow-300"
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                      >
                                        👑
                                      </motion.div>
                                    )}
                                  </div>
                                </motion.div>

                                {/* Quality badge with enhanced styling */}
                                {movie.quality && (
                                  <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 + 0.2 }}
                                    className="absolute top-4 right-4 z-10"
                                  >
                                    <Badge className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white text-xs font-bold shadow-xl border border-white/20 backdrop-blur-sm px-3 py-1">
                                      {movie.quality}
                                    </Badge>
                                  </motion.div>
                                )}

                                {/* Enhanced gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
                                
                                {/* Enhanced play button with ripple effect */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                                  <motion.div
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-orange-500/60 border-2 border-white/30"
                                  >
                                    {/* Ripple effect */}
                                    <motion.div
                                      className="absolute inset-0 rounded-full bg-white/20"
                                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full"></div>
                                    <Play className="w-8 h-8 text-white ml-1 drop-shadow-xl relative z-10" />
                                  </motion.div>
                                </div>

                                {/* Movie info overlay with enhanced styling */}
                                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                                  <motion.h3 
                                    className="text-white font-bold text-base line-clamp-2 mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-orange-400 group-hover:via-red-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-500"
                                    whileHover={{ scale: 1.02 }}
                                  >
                                    {movie.name}
                                  </motion.h3>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-300 font-medium bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                                      {movie.year} • {movie.type === 'series' ? 'Phim bộ' : 'Phim lẻ'}
                                    </span>
                                    <motion.div 
                                      className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 px-3 py-1 rounded-full backdrop-blur-sm border border-orange-500/30"
                                      whileHover={{ scale: 1.05 }}
                                    >
                                      <TrendingUp className="w-4 h-4 text-orange-400" />
                                      <span className="text-orange-300 font-bold">#{index + 1}</span>
                                    </motion.div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </motion.section>

                {/* Trending Movies */}
                <motion.section variants={itemVariants} className="mb-16 relative">
                  {/* Enhanced section header with different style */}
                  <div className="flex items-center justify-between mb-8 px-1">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30"
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                        <TrendingUp className="w-6 h-6 text-white relative z-10" />
                        {/* Animated pulse effect */}
                        <motion.div
                          className="absolute inset-0 border-2 border-indigo-400 rounded-xl"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.div>
                      <div>
                        <motion.h2 
                          className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          Xu hướng
                        </motion.h2>
                        <motion.div 
                          className="h-1 w-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mt-1"
                          initial={{ width: 0 }}
                          animate={{ width: "4rem" }}
                          transition={{ delay: 0.4, duration: 0.8 }}
                        />
                        <p className="text-sm text-slate-400 mt-1">Top phim được xem nhiều nhất</p>
                      </div>
                    </div>
                    {/* Star animation indicator */}
                    <motion.div
                      className="text-2xl"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      
                    </motion.div>
                  </div>
                  <TrendingMovies limit={10} />
                </motion.section>

                {/* Korean Movies */}
                <HorizontalMovieScroll
                  movies={koreanData?.items || []}
                  isLoading={isKoreanLoading}
                  title="Phim Hàn Quốc"
                  description="Bộ phim Hàn Quốc hay nhất"
                  icon={Film}
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {/* For non-authenticated users, show discovery content directly */}
        {!isAuthenticated && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-12"
          >
            {/* New Releases */}
            <motion.section variants={itemVariants}>
              <SectionHeader
                icon={Calendar}
                title="Phim mới cập nhật"
                description="Phim mới được thêm gần đây"
              />
              {isNewReleasesLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 auto-rows-fr">
                  {[...Array(8)].map((_, i) => (
                    <LoadingCard key={i} />
                  ))}
                </div>
              ) : (
                <motion.div 
                  variants={containerVariants}
                  className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 auto-rows-fr"
                >
                  {newReleasesData?.items?.slice(0, 8).map((movie: any, index: number) => (
                    <MovieCard key={movie.slug} movie={movie} index={index} />
                  ))}
                </motion.div>
              )}
            </motion.section>



            {/* Trending Movies */}
            <HorizontalMovieScroll
              movies={trendingData?.items || []}
              isLoading={isTrendingLoading}
              title="Xu hướng"
              description="Phim được xem nhiều nhất"
              icon={TrendingUp}
            />

            {/* Korean Movies */}
            <HorizontalMovieScroll
              movies={koreanData?.items || []}
              isLoading={isKoreanLoading}
              title="Phim Hàn Quốc"
              description="Bộ phim Hàn Quốc hay nhất"
              icon={Film}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
