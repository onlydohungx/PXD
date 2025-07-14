import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Info, Star, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { fetchCountryMovies, fetchMovies, fetchTrendingMovies, fetchTrendingTodayMovies } from "@/lib/api";


interface Movie {
  name: string;
  content?: string;
  slug: string;
  thumb_url?: string;
  poster_url?: string;
  trailer_url?: string;
  category?: {
    id: string;
    name: string;
  }[];
  year?: number;
  time?: string;
  quality?: string;
  lang?: string;
  country?: string;
  tmdb?: {
    vote_average?: number;
  };
}

interface HeroSectionProps {
  movie: Movie;
}

export function HeroSection({ movie: initialMovie }: HeroSectionProps) {
  const [movies, setMovies] = useState<Movie[]>([initialMovie]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [movieDetails, setMovieDetails] = useState<Record<string, Movie>>({});
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile device
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  // Fetch thông tin chi tiết phim ngay lập tức cho phim đầu tiên
  const fetchMovieDetailsImmediate = async (movie: Movie) => {
    try {
      const response = await fetch(`https://phimapi.com/phim/${movie.slug}`);
      if (response.ok) {
        const data = await response.json();
        if (data.movie) {
          console.log(`Trailer URL for ${movie.slug}:`, data.movie.trailer_url);
          setMovieDetails(prev => ({
            ...prev,
            [movie.slug]: {
              ...movie,
              trailer_url: data.movie.trailer_url
            }
          }));
        }
      }
    } catch (error) {
      console.error(`Error fetching details for ${movie.slug}:`, error);
      // Fallback to original movie data
      setMovieDetails(prev => ({
        ...prev,
        [movie.slug]: movie
      }));
    }
  };

  // Fetch thông tin chi tiết phim để lấy trailer URL
  const fetchMovieDetails = async (movieList: Movie[]) => {
    const details: Record<string, Movie> = {};
    
    for (const movie of movieList) {
      try {
        const response = await fetch(`https://phimapi.com/phim/${movie.slug}`);
        if (response.ok) {
          const data = await response.json();
          if (data.movie) {
            details[movie.slug] = {
              ...movie,
              trailer_url: data.movie.trailer_url
            };
          }
        }
      } catch (error) {
        console.error(`Error fetching details for ${movie.slug}:`, error);
        // Fallback to original movie data
        details[movie.slug] = movie;
      }
    }
    
    setMovieDetails(prev => ({ ...prev, ...details }));
  };
  
  // Lấy 5 phim từ các danh mục khác nhau để làm slider hero
  useEffect(() => {
    const fetchHeroMovies = async () => {
      try {
        const allMovies: Movie[] = [];
        
        // 1. Phim mới cập nhật - lấy 1 phim
        const latestResponse = await fetchMovies({ 
          page: 1, 
          limit: 1, 
          sort_field: 'modified_time',
          sort_type: 'desc' 
        });
        
        if (latestResponse && latestResponse.items && latestResponse.items.length > 0) {
          allMovies.push(latestResponse.items[0]);
        }
        
        // 2. Phim xem nhiều nhất - lấy 1 phim
        const trendingResponse = await fetchTrendingMovies(1);
        if (trendingResponse && trendingResponse.items && trendingResponse.items.length > 0) {
          const trendingMovie = trendingResponse.items[0];
          if (!allMovies.some(m => m.slug === trendingMovie.slug)) {
            allMovies.push(trendingMovie);
          }
        }
        
        // 3. Phim xem nhiều nhất trong ngày - lấy 1 phim
        const trendingTodayResponse = await fetchTrendingTodayMovies(1);
        if (trendingTodayResponse && trendingTodayResponse.items && trendingTodayResponse.items.length > 0) {
          const trendingTodayMovie = trendingTodayResponse.items[0];
          if (!allMovies.some(m => m.slug === trendingTodayMovie.slug)) {
            allMovies.push(trendingTodayMovie);
          }
        }
        
        // 4. Ngẫu nhiên - lấy phim từ trang ngẫu nhiên
        const randomPage1 = Math.floor(Math.random() * 5) + 1;
        const randomResponse1 = await fetchMovies({ 
          page: randomPage1, 
          limit: 1,
          sort_field: 'modified_time',
          sort_type: 'desc' 
        });
        
        if (randomResponse1 && randomResponse1.items && randomResponse1.items.length > 0) {
          const randomMovie1 = randomResponse1.items[0];
          if (!allMovies.some(m => m.slug === randomMovie1.slug)) {
            allMovies.push(randomMovie1);
          }
        }
        
        // 5. Ngẫu nhiên thêm - lấy phim từ trang ngẫu nhiên khác
        const randomPage2 = Math.floor(Math.random() * 10) + 6;
        const randomResponse2 = await fetchMovies({ 
          page: randomPage2, 
          limit: 1,
          sort_field: 'modified_time',
          sort_type: 'desc' 
        });
        
        if (randomResponse2 && randomResponse2.items && randomResponse2.items.length > 0) {
          const randomMovie2 = randomResponse2.items[0];
          if (!allMovies.some(m => m.slug === randomMovie2.slug)) {
            allMovies.push(randomMovie2);
          }
        }
        
        // Đảm bảo có ít nhất 5 phim, nếu thiếu thì bổ sung từ initialMovie
        if (allMovies.length < 5) {
          // Thêm phim ban đầu nếu chưa có
          if (!allMovies.some(m => m.slug === initialMovie.slug)) {
            allMovies.unshift(initialMovie);
          }
          
          // Nếu vẫn thiếu, lấy thêm phim mới nhất
          if (allMovies.length < 5) {
            const additionalResponse = await fetchMovies({ 
              page: 1, 
              limit: 10, 
              sort_field: 'modified_time',
              sort_type: 'desc' 
            });
            
            if (additionalResponse && additionalResponse.items) {
              for (const movie of additionalResponse.items) {
                if (allMovies.length >= 5) break;
                if (!allMovies.some(m => m.slug === movie.slug) && movie.thumb_url && movie.poster_url) {
                  allMovies.push(movie);
                }
              }
            }
          }
        }
        
        // Lấy đúng 5 phim đầu tiên
        const finalMovies = allMovies.slice(0, 5);
        setMovies(finalMovies);
        
        // Fetch chi tiết cho từng phim để lấy trailer_url ngay lập tức (chỉ trên desktop)
        if (!isMobile && finalMovies.length > 0) {
          // Fetch trailer cho phim đầu tiên ngay lập tức
          fetchMovieDetailsImmediate(finalMovies[0]);
          // Fetch trailer cho các phim còn lại
          fetchMovieDetails(finalMovies.slice(1));
        }
      } catch (error) {
        console.error('Error fetching hero movies:', error);
        // Fallback với phim ban đầu
        setMovies([initialMovie]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHeroMovies();
  }, [initialMovie, isMobile]);
  

  
  // Xử lý chuyển slide với animation mượt
  const handleSlideChange = (newIndex: number) => {
    if (isTransitioning || newIndex === currentIndex) return;
    
    setIsTransitioning(true);
    setCurrentIndex(newIndex);
    
    // Reset trạng thái chuyển đổi sau khi hoàn thành animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 700); // Thời gian animation là 500ms, thêm 200ms để đảm bảo hoàn thành
  };
  
  // Chuyển đến phim trước đó
  const goToPrevious = () => {
    handleSlideChange(currentIndex === 0 ? movies.length - 1 : currentIndex - 1);
  };
  
  // Chuyển đến phim tiếp theo
  const goToNext = () => {
    handleSlideChange((currentIndex + 1) % movies.length);
  };
  
  // Lấy phim hiện tại đang hiển thị
  const currentMovie = movies[currentIndex] || initialMovie;
  
  // Lấy thông tin chi tiết phim hiện tại (bao gồm trailer_url)
  const currentMovieWithDetails = movieDetails[currentMovie.slug] || currentMovie;
  
  // Format rating to display only one decimal place if needed
  const rating = currentMovie.tmdb?.vote_average 
    ? (currentMovie.tmdb.vote_average).toFixed(1)
    : null;
    
  // Extract categories for display
  const categories = currentMovie.category && currentMovie.category.length > 0 
    ? currentMovie.category 
    : [];
  
  // Determine movie category based on its position in the array
  const getMovieCategoryInfo = (index: number) => {
    switch (index) {
      case 0:
        return { label: "Phim mới cập nhật", color: "from-green-500 to-emerald-500", icon: "🆕" };
      case 1:
        return { label: "Phim xem nhiều nhất", color: "from-red-500 to-pink-500", icon: "🔥" };
      case 2:
        return { label: "Phim xem nhiều nhất hôm nay", color: "from-orange-500 to-yellow-500", icon: "⭐" };
      case 3:
        return { label: "Ngẫu nhiên", color: "from-purple-500 to-indigo-500", icon: "🎲" };
      case 4:
        return { label: "Ngẫu nhiên", color: "from-blue-500 to-cyan-500", icon: "🎯" };
      default:
        return { label: "Phim hay", color: "from-gray-500 to-slate-500", icon: "🎬" };
    }
  };
  
  const currentCategoryInfo = getMovieCategoryInfo(currentIndex);
  
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative mb-12 rounded-3xl overflow-hidden shadow-2xl mt-0 border border-white/5"
    >
      {/* Hero Container with optimized height for Mobile and Desktop */}
      <div className="relative w-full h-[85vh] md:h-[90vh] overflow-hidden">
        {/* Background - Video on Desktop, Image on Mobile */}
        <motion.div 
          key={currentMovie.slug}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            opacity: { duration: 0.6, ease: "easeInOut" }, 
            scale: { duration: 12, ease: "easeInOut" } 
          }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Desktop: Video Background first, fallback to image */}
          {!isMobile ? (
            <div className="absolute inset-0 w-full h-full">
              {/* Video background when trailer is available */}
              {currentMovieWithDetails.trailer_url ? (
                <div className="absolute inset-0 w-full h-full">
                  <video
                    key={currentMovieWithDetails.trailer_url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to image if video fails to load
                      const img = document.createElement('img');
                      img.src = currentMovie.thumb_url || currentMovie.poster_url || '/placeholder-movie.jpg';
                      img.className = 'absolute inset-0 w-full h-full object-cover';
                      e.currentTarget.parentNode?.replaceChild(img, e.currentTarget);
                    }}
                  >
                    <source src={currentMovieWithDetails.trailer_url} type="video/mp4" />
                    {/* Fallback image if video doesn't load */}
                    <img
                      src={currentMovie.thumb_url || currentMovie.poster_url || '/placeholder-movie.jpg'}
                      alt={currentMovie.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </video>
                </div>
              ) : (
                /* Fallback image background for desktop when no trailer */
                <div 
                  className="absolute inset-0 w-full h-full bg-cover bg-center transform scale-105"
                  style={{
                    backgroundImage: `url(${currentMovie.thumb_url || currentMovie.poster_url})`,
                    filter: 'brightness(0.85) contrast(1.1)'
                  }}
                />
              )}
            </div>
          ) : (
            /* Mobile: Image Background - optimized to prevent cropping */
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-center transform scale-105"
              style={{
                backgroundImage: `url(${currentMovie.thumb_url || currentMovie.poster_url})`,
                filter: 'brightness(0.75) contrast(1.1)',
                backgroundPosition: 'center top'
              }}
            />
          )}
          
          {/* Smooth transition overlay */}
          <div className={`absolute inset-0 bg-black ${isTransitioning ? 'opacity-40' : 'opacity-0'} transition-opacity duration-400`}></div>
        </motion.div>
        
        {/* Enhanced cinematic overlays for better visual depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10"></div>
        
        {/* Top area with elegant gradient for navbar */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/50 via-black/20 to-transparent z-10"></div>
        
        {/* Enhanced bottom content area with sophisticated gradient - stronger on mobile */}
        <div className="absolute bottom-0 left-0 right-0 h-3/5 bg-gradient-to-t from-black/90 via-black/60 to-transparent md:from-black/80 md:via-black/40 z-10"></div>
        
        {/* Left content area with premium gradient - mobile optimized */}
        <div className="absolute left-0 top-0 bottom-0 w-full md:w-3/4 bg-gradient-to-r from-black/80 via-black/40 to-transparent md:from-black/70 md:via-black/30 z-10"></div>
        
        {/* Enhanced atmospheric light effects */}
        <div className="absolute -left-20 top-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-blue-600/12 to-purple-600/12 blur-[100px] opacity-60 hidden md:block animate-pulse"></div>
        <div className="absolute -right-20 bottom-1/4 w-[350px] h-[350px] rounded-full bg-gradient-to-l from-pink-600/12 to-red-600/12 blur-[100px] opacity-50 hidden md:block animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute left-1/2 top-1/3 w-[250px] h-[250px] rounded-full bg-gradient-to-r from-cyan-500/8 to-indigo-500/8 blur-[120px] opacity-40 hidden md:block animate-pulse" style={{ animationDelay: '4s' }}></div>
        
        {/* Subtle grain overlay for cinematic feel */}
        <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay z-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`
        }}></div>
        
        {/* Enhanced Premium Navigation arrows */}
        {movies.length > 1 && (
          <>
            <button 
              onClick={goToPrevious}
              className="absolute left-6 top-1/2 transform -translate-y-1/2 z-30 group"
              aria-label="Previous slide"
            >
              <div className="relative bg-gradient-to-r from-black/70 to-black/60 hover:from-black/90 hover:to-black/80 text-white rounded-full p-3 md:p-4 border border-white/30 hover:border-primary/50 transition-all duration-500 shadow-2xl hover:shadow-primary/20 hover:scale-110 group-active:scale-95 backdrop-blur-sm">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 transition-all duration-300 group-hover:-translate-x-1 group-hover:text-primary relative z-10" />
              </div>
            </button>
            <button 
              onClick={goToNext}
              className="absolute right-6 top-1/2 transform -translate-y-1/2 z-30 group"
              aria-label="Next slide"
            >
              <div className="relative bg-gradient-to-r from-black/70 to-black/60 hover:from-black/90 hover:to-black/80 text-white rounded-full p-3 md:p-4 border border-white/30 hover:border-primary/50 transition-all duration-500 shadow-2xl hover:shadow-primary/20 hover:scale-110 group-active:scale-95 backdrop-blur-sm">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary relative z-10" />
              </div>
            </button>
          </>
        )}
        
        {/* Enhanced Premium indicator dots with sophisticated design */}
        {movies.length > 1 && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-3 bg-gradient-to-r from-black/80 via-black/70 to-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/30 shadow-2xl hover:shadow-primary/10 transition-all duration-500">
            {movies.map((_, index) => (
              <button
                key={index}
                onClick={() => handleSlideChange(index)}
                className="group relative transition-all duration-500"
                aria-label={`Go to slide ${index + 1}`}
              >
                {/* Main indicator dot */}
                <div 
                  className={`
                    relative overflow-hidden transition-all duration-700 ease-out
                    ${index === currentIndex 
                      ? "w-12 md:w-14 h-3 md:h-3.5" 
                      : "w-3 md:w-3.5 h-3 md:h-3.5 group-hover:w-5 group-hover:scale-110"
                    }
                    rounded-full
                  `}
                >
                  {/* Enhanced background gradient */}
                  <div 
                    className={`
                      w-full h-full rounded-full transition-all duration-700
                      ${index === currentIndex 
                        ? "bg-gradient-to-r from-primary via-secondary to-primary shadow-lg shadow-primary/40 animate-pulse" 
                        : "bg-white/50 group-hover:bg-gradient-to-r group-hover:from-primary/70 group-hover:to-secondary/70"
                      }
                    `}
                  >
                    {/* Active indicator animated shine effect */}
                    {index === currentIndex && (
                      <div className="absolute inset-0 overflow-hidden rounded-full">
                        <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/70 to-transparent animate-shimmer"></div>
                      </div>
                    )}
                    
                    {/* Subtle inner glow */}
                    <div className={`
                      absolute inset-0.5 rounded-full
                      ${index === currentIndex 
                        ? 'bg-gradient-to-r from-white/20 to-transparent opacity-100' 
                        : 'opacity-0 group-hover:opacity-50'
                      }
                      transition-opacity duration-500
                    `}></div>
                  </div>
                </div>
                
                {/* Enhanced hover glow effect */}
                <div 
                  className={`
                    absolute inset-0 rounded-full transition-all duration-500
                    ${index === currentIndex 
                      ? 'shadow-lg shadow-primary/30' 
                      : 'shadow-none group-hover:shadow-lg group-hover:shadow-primary/20'
                    }
                  `}
                />
              </button>
            ))}
          </div>
        )}
        
        {/* Content container - Optimized positioning for mobile and desktop */}
        <div className="absolute inset-0 z-20 flex items-end md:items-center">
          <div className="container mx-auto px-4 md:px-12 pb-8 md:pb-0 pt-12 md:pt-20">
            <div className="md:grid md:grid-cols-12 gap-8 items-center">
              {/* Mobile layout with poster */}
              <div className="md:hidden mb-8">
                <div className="flex items-end gap-4">
                  {/* Mobile poster - compact and well-positioned */}
                  <motion.div 
                    key={`mobile-poster-${currentMovie.slug}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex-shrink-0"
                  >
                    <div className="relative w-[120px] h-[180px] rounded-2xl overflow-hidden shadow-xl border border-white/20 group">
                      {/* Subtle background glow */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-2xl blur-md opacity-70"></div>
                      
                      {/* Poster image */}
                      <img 
                        src={currentMovie.poster_url || currentMovie.thumb_url} 
                        alt={currentMovie.name}
                        className="w-full h-full object-cover relative z-10 transition-transform duration-300 group-hover:scale-105"
                      />
                      
                      {/* Rating badge - mobile optimized */}
                      {rating && (
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold text-xs rounded-lg h-8 w-8 flex flex-col items-center justify-center shadow-lg z-20">
                          <Star className="h-2 w-2 fill-current mb-0.5" />
                          <span className="text-[10px]">{rating}</span>
                        </div>
                      )}
                      
                      {/* Quality badge - mobile optimized */}
                      {currentMovie.quality && (
                        <div className="absolute bottom-2 left-2 bg-gradient-to-r from-primary to-secondary text-white font-bold text-[10px] rounded-lg px-2 py-1 shadow-lg z-20">
                          <span>{currentMovie.quality}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                  
                  {/* Mobile movie info - compact layout */}
                  <div className="flex-1 min-w-0">
                    {/* Movie type indicator */}
                    <motion.div
                      key={`mobile-type-${currentMovie.slug}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="mb-2"
                    >
                      <div className="bg-gradient-to-r from-primary to-secondary text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md inline-flex items-center gap-1">
                        {currentIndex === 0 ? (
                          <>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                            Đề Xuất
                          </>
                        ) : currentIndex <= 2 ? (
                          <>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                            </svg>
                            Mới Cập Nhật
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                            </svg>
                            Hàn Quốc
                          </>
                        )}
                      </div>
                    </motion.div>
                    

                    {/* Title - mobile optimized */}
                    <motion.h1 
                      key={`mobile-title-${currentMovie.slug}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      className="text-xl font-bold text-white leading-tight mb-2 line-clamp-2"
                    >
                      {currentMovie.name}
                    </motion.h1>
                    
                    {/* Info badges - mobile compact */}
                    <motion.div 
                      key={`mobile-info-${currentMovie.slug}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="flex flex-wrap items-center gap-2 mb-3"
                    >
                      {currentMovie.year && (
                        <div className="flex items-center gap-1 text-xs bg-black/60 border border-white/30 rounded-md px-2 py-1 text-white">
                          <Calendar className="h-3 w-3" />
                          <span>{currentMovie.year}</span>
                        </div>
                      )}
                      
                      {currentMovie.time && (
                        <div className="flex items-center gap-1 text-xs bg-black/60 border border-white/30 rounded-md px-2 py-1 text-white">
                          <Clock className="h-3 w-3" />
                          <span>{currentMovie.time}</span>
                        </div>
                      )}
                    </motion.div>
                    
                    {/* Action buttons - mobile compact */}
                    <motion.div 
                      key={`mobile-buttons-${currentMovie.slug}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="flex items-center gap-2"
                    >
                      <Button
                        asChild
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full text-xs h-8 px-4 shadow-lg"
                      >
                        <Link href={`/watch/${currentMovie.slug}`}>
                          <Play className="h-3 w-3 mr-1" fill="currentColor" />
                          Xem
                        </Link>
                      </Button>
                      
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="bg-black/60 border-white/30 text-white rounded-full text-xs h-8 px-3"
                      >
                        <Link href={`/movie/${currentMovie.slug}`}>
                          <Info className="h-3 w-3 mr-1" />
                          Chi tiết
                        </Link>
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
              
              {/* Left column for movie details - optimized for desktop */}
              <div className="hidden md:flex md:col-span-7 flex-col items-start">
                {/* Movie type indicator */}
                <motion.div
                  key={`type-${currentMovie.slug}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex mb-4"
                >
                  <div className="relative bg-gradient-to-r from-primary to-secondary text-white px-5 py-1.5 rounded-full text-sm font-semibold shadow-md overflow-hidden group">
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-center gap-1.5">
                      {currentIndex === 0 ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                          Phim Đề Xuất
                        </>
                      ) : currentIndex <= 2 ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                          </svg>
                          Phim Mới Cập Nhật
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                          </svg>
                          Phim Hàn Quốc
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
                
                {/* Category pill - visible only on desktop for cleaner mobile view */}
                {categories.length > 0 && (
                  <motion.div
                    key={`cat-${currentMovie.slug}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="hidden md:flex mb-4"
                  >
                    <div className="bg-gradient-to-r from-primary/80 to-secondary/80 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-md border border-white/10 group flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path>
                      </svg>
                      <span className="group-hover:underline transition-all duration-300">{categories[0].name}</span>
                    </div>
                  </motion.div>
                )}
                

                {/* Title with animated underline effect */}
                <div className="relative">
                  <motion.h1 
                    key={`title-${currentMovie.slug}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight md:leading-none drop-shadow-md mb-3 md:mb-4"
                  >
                    {currentMovie.name}
                  </motion.h1>
                  <motion.div 
                    key={`line-${currentMovie.slug}`}
                    initial={{ width: 0 }}
                    animate={{ width: "30%" }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="h-1 bg-gradient-to-r from-primary to-secondary rounded-full hidden md:block"
                  ></motion.div>
                </div>
                

                
                {/* Info badges - redesigned and optimized for desktop */}
                <motion.div 
                  key={`info-${currentMovie.slug}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-wrap items-center gap-3 mb-5 md:mb-8"
                >
                  {/* IMDb rating */}
                  {rating && (
                    <div className="flex items-center gap-1.5 bg-yellow-500 text-white font-bold text-xs md:text-sm rounded-lg px-3 py-1.5 shadow-lg border border-yellow-300/30">
                      <Star className="h-3.5 w-3.5 md:h-4 md:w-4 fill-white" />
                      <span className="font-mono drop-shadow-sm">{rating}</span>
                    </div>
                  )}
                  
                  {/* Year */}
                  {currentMovie.year && (
                    <div className="flex items-center gap-1.5 text-xs md:text-sm bg-black/60 shadow-lg border border-white/30 rounded-lg px-3 py-1.5 text-white">
                      <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      <span className="drop-shadow-sm">{currentMovie.year}</span>
                    </div>
                  )}
                  
                  {/* Duration */}
                  {currentMovie.time && (
                    <div className="flex items-center gap-1.5 text-xs md:text-sm bg-black/60 shadow-lg border border-white/30 rounded-lg px-3 py-1.5 text-white">
                      <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      <span className="drop-shadow-sm">{currentMovie.time}</span>
                    </div>
                  )}
                  
                  {/* Quality badge */}
                  {currentMovie.quality && (
                    <div className="flex items-center gap-1 text-xs md:text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg px-3 py-1.5 shadow-lg border border-white/30">
                      <span className="drop-shadow-sm">{currentMovie.quality}</span>
                    </div>
                  )}
                </motion.div>
                
                {/* Categories with glass effect */}
                <motion.div 
                  key={`categories-${currentMovie.slug}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex flex-wrap gap-2 mb-6 md:mb-8"
                >
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <Badge 
                        key={cat.id} 
                        variant="outline" 
                        className="bg-black/60 hover:bg-black/80 text-white text-xs md:text-sm border-white/30 hover:border-white/50 px-3 py-1 transition-all duration-200 drop-shadow-sm"
                      >
                        {cat.name}
                      </Badge>
                    ))
                  ) : (
                    <>
                      <Badge variant="outline" className="bg-black/60 hover:bg-black/80 text-white text-xs md:text-sm border-white/30 hover:border-white/50 px-3 py-1 transition-all duration-200 drop-shadow-sm">
                        Phim Hay
                      </Badge>
                      <Badge variant="outline" className="bg-black/60 hover:bg-black/80 text-white text-xs md:text-sm border-white/30 hover:border-white/50 px-3 py-1 transition-all duration-200 drop-shadow-sm">
                        Đề Xuất  
                      </Badge>
                    </>
                  )}
                </motion.div>
                
                {/* Premium action buttons with enhanced design */}
                <motion.div 
                  key={`buttons-${currentMovie.slug}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="flex items-center gap-4"
                >
                  {/* Primary Watch button */}
                  <Button
                    asChild
                    size="lg"
                    className="relative bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transition-all duration-300 rounded-full text-sm md:text-base h-12 md:h-14 px-6 md:px-10 group shadow-xl hover:shadow-2xl hover:shadow-blue-500/25 overflow-hidden"
                  >
                    <Link href={`/watch/${currentMovie.slug}`}>
                      {/* Background animation */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Content */}
                      <div className="relative flex items-center gap-3">
                        <div className="bg-white/20 rounded-full p-2 group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                          <Play className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" />
                        </div>
                        <span className="font-semibold">Xem ngay</span>
                      </div>
                    </Link>
                  </Button>
                  
                  {/* Secondary Info button */}
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="bg-black/60 hover:bg-black/80 border-white/30 hover:border-white/50 text-white transition-all duration-300 rounded-full text-sm md:text-base h-12 md:h-14 px-6 md:px-8 group shadow-lg hover:shadow-xl hover:shadow-white/10"
                  >
                    <Link href={`/movie/${currentMovie.slug}`}>
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 rounded-full p-2 group-hover:bg-white/30 transition-all duration-300">
                          <Info className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <span className="font-medium">Chi tiết</span>
                      </div>
                    </Link>
                  </Button>
                  

                </motion.div>
              </div>
              
              {/* Enhanced Right column for poster - only on desktop */}
              <motion.div 
                key={`poster-${currentMovie.slug}`}
                initial={{ opacity: 0, x: 50, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ 
                  duration: 1, 
                  delay: 0.4,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className="hidden md:col-span-5 md:flex justify-center md:justify-end pt-10"
              >
                <div className="relative w-[320px] h-[480px] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 transform rotate-1 group hover:rotate-0 transition-all duration-700 hover:scale-105">
                  {/* Enhanced background glow */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  
                  {/* Poster with enhanced hover effect */}
                  <img 
                    src={currentMovie.poster_url || currentMovie.thumb_url} 
                    alt={currentMovie.name}
                    className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 relative z-10"
                  />
                  
                  {/* Enhanced shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/15 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 z-20" />
                  
                  {/* Animated border glow */}
                  <div className="absolute inset-0 rounded-3xl border-2 border-gradient-to-r from-primary/50 via-secondary/50 to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-20"></div>
                  
                  {/* Enhanced play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-30">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary/95 to-secondary/95 text-white flex items-center justify-center cursor-pointer shadow-2xl transform scale-75 group-hover:scale-100 transition-all duration-500 backdrop-blur-sm border border-white/30">
                      <Play className="h-8 w-8 ml-1" fill="currentColor" />
                    </div>
                  </div>
                  
                  {/* Enhanced rating badge */}
                  {rating && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold text-sm rounded-xl h-12 w-12 flex flex-col items-center justify-center shadow-xl border border-yellow-300/50 z-30">
                      <Star className="h-3 w-3 fill-current mb-0.5" />
                      <span className="text-xs">{rating}</span>
                    </div>
                  )}
                  
                  {/* Enhanced quality badge */}
                  {currentMovie.quality && (
                    <div className="absolute bottom-4 left-4 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs rounded-xl px-3 py-2 flex items-center shadow-xl border border-white/30 z-30">
                      <span>{currentMovie.quality}</span>
                    </div>
                  )}
                  
                  {/* Subtle floating animation */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/20 to-transparent opacity-50 z-10"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop-only decorative curved bottom */}
      <div className="hidden md:block absolute bottom-0 left-0 right-0 h-16 bg-background" style={{ borderTopLeftRadius: '50% 100%', borderTopRightRadius: '50% 100%' }}></div>
    </motion.section>
  );
}
