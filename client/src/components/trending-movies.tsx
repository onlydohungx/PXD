import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { fetchTrendingMovies } from '@/lib/api';
import { FiTrendingUp, FiStar, FiPlay, FiChevronRight, FiEye } from 'react-icons/fi';
import { RiFireFill, RiFilmFill } from 'react-icons/ri';
import useMobile from '@/hooks/use-mobile';
import { motion } from 'framer-motion';

// Định nghĩa interface cho phim
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
  viewCount?: number;
}

interface TrendingMoviesProps {
  limit?: number;
}

export function TrendingMovies({ limit = 10 }: TrendingMoviesProps) {
  const isMobile = useMobile();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/movies/trending', limit],
    queryFn: () => fetchTrendingMovies(limit),
  });
  
  // Kiểm tra lỗi hoặc không có dữ liệu
  if (error || (!isLoading && (!data || !data.items || data.items.length === 0))) {
    return null;
  }
  
  // Lấy phim để hiển thị
  const movies: Movie[] = data?.items || [];
  
  // Animation variants - mịn hơn
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };
  
  const itemVariants = {
    hidden: { x: 20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 12, mass: 0.5 }
    }
  };
  
  return (
    <section className="mb-16 relative overflow-hidden">
      {/* Section header with enhanced styling */}
      <div className="flex items-center justify-between mb-8 px-1">
        <div className="flex items-center gap-3">
          <RiFireFill className="text-2xl md:text-3xl text-primary animate-pulse" />
          <h2 className="text-xl md:text-2xl font-bold">
            <span className="text-gradient-primary">Phim Nổi Bật</span>
            <div className="h-1 w-1/2 bg-gradient-to-r from-primary to-transparent rounded-full mt-1"></div>
          </h2>
        </div>
        <Link href="/trending" className="text-primary hover:text-primary/80 text-sm flex items-center bg-background/80 py-1.5 px-4 rounded-full transition-all hover:bg-background/95 hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] border border-primary/20">
          Xem thêm <FiChevronRight className="ml-1" />
        </Link>
      </div>
      
      {/* Glass card effect scrollable container */}
      <div className="relative rounded-2xl p-0.5 overflow-hidden">
        {/* Gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-50 z-0"></div>
        
        <div className="relative overflow-hidden rounded-2xl bg-card/30 backdrop-blur-sm p-5">
          {/* Left scroll indicator */}
          <div className="absolute left-0 top-0 bottom-0 w-12 md:w-16 z-10 bg-gradient-to-r from-background/70 to-transparent flex items-center justify-start pl-2 pointer-events-none">
            <FiChevronRight className="rotate-180 text-primary/70 text-2xl md:text-3xl" />
          </div>
          
          {/* Right scroll indicator */}
          <div className="absolute right-0 top-0 bottom-0 w-12 md:w-16 z-10 bg-gradient-to-l from-background/70 to-transparent flex items-center justify-end pr-2 pointer-events-none">
            <FiChevronRight className="text-primary/70 text-2xl md:text-3xl" />
          </div>
            
          {/* Loading skeleton - horizontal scroll */}
          {isLoading ? (
            <div className="flex space-x-4 py-2 overflow-x-scroll hide-scrollbar">
              {Array(isMobile ? 4 : 8).fill(0).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[180px] md:w-[220px]">
                  <div className="trending-movie-card h-full">
                    <div className="aspect-[2/3] bg-gradient-to-br from-gray-800/60 to-gray-900/60 animate-pulse rounded-xl relative">
                      <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col">
                        <div className="h-4 bg-gray-700/60 rounded w-2/3 mb-2"></div>
                        <div className="h-3 bg-gray-700/40 rounded w-1/3"></div>
                      </div>
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
              {movies.slice(0, isMobile ? 8 : 12).map((movie, index) => (
                <motion.div 
                  key={movie.slug} 
                  variants={itemVariants} 
                  className="flex-shrink-0 w-[180px] md:w-[220px] group"
                >
                  <Link href={`/movie/${movie.slug}`} className="block h-full">
                    <div className="trending-movie-card h-full">
                      <div className="aspect-[2/3] h-full relative overflow-hidden rounded-xl">
                        <img 
                          src={movie.poster_url} 
                          alt={movie.name}
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        
                        {/* Ranking badge for top movies */}
                        {index < 3 && (
                          <div className="absolute top-0 left-0 w-12 h-12">
                            <div className="absolute top-2 left-2 -rotate-12 bg-gradient-to-br from-primary to-secondary text-white font-bold text-lg rounded-lg w-8 h-8 flex items-center justify-center shadow-lg z-10 transform transition-transform group-hover:scale-110 group-hover:rotate-0">
                              {index + 1}
                            </div>
                          </div>
                        )}
                        
                        {/* Quality badge with better visibility */}
                        {movie.quality && (
                          <div className="absolute top-3 right-3 bg-primary/90 text-white text-xs py-1 px-2.5 rounded-md font-semibold shadow-lg z-10 backdrop-blur-sm">
                            {movie.quality}
                          </div>
                        )}
                        
                        {/* Play button with enhanced animation */}
                        <div className="trending-movie-play-btn">
                          <div className="w-14 h-14 bg-primary/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-primary/40 border border-white/20">
                            <FiPlay className="text-white text-xl ml-1" />
                          </div>
                        </div>
                        
                        {/* Enhanced info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                          <h3 className="text-sm font-medium trending-movie-title">
                            {movie.name}
                          </h3>
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center gap-2">
                              {movie.year && (
                                <span className="text-xs bg-background/60 backdrop-blur-sm text-white/90 px-2 py-0.5 rounded shadow-md">
                                  {movie.year}
                                </span>
                              )}
                              {movie.tmdb?.vote_average && (
                                <span className="flex items-center text-xs bg-yellow-500/30 backdrop-blur-sm text-yellow-300 px-2 py-0.5 rounded shadow-md">
                                  <FiStar className="mr-1 w-3 h-3" />
                                  {movie.tmdb.vote_average.toFixed(1)}
                                </span>
                              )}
                            </div>
                            {movie.viewCount && (
                              <span className="flex items-center text-xs bg-background/40 backdrop-blur-sm text-white/90 px-2 py-0.5 rounded shadow-md">
                                <FiEye className="mr-1 w-3 h-3" />
                                {movie.viewCount > 1000 ? `${(movie.viewCount/1000).toFixed(1)}K` : movie.viewCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
              
              {/* Enhanced view all button */}
              <motion.div variants={itemVariants} className="flex-shrink-0 w-[180px] md:w-[220px] flex items-center">
                <Link href="/movies" className="block h-full w-full">
                  <div className="h-full aspect-[2/3] flex flex-col items-center justify-center bg-background/20 border border-primary/20 rounded-xl transition-all duration-500 hover:bg-background/40 hover:border-primary/50 hover:-translate-x-2 hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)]">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                      <RiFilmFill className="text-4xl text-primary" />
                    </div>
                    <span className="text-primary font-medium">Xem tất cả</span>
                    <span className="text-primary/80 text-sm mt-1">phim hay</span>
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Enhanced background decorative elements */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl opacity-70 -z-10 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-20 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl opacity-70 -z-10 animate-blob animation-delay-4000"></div>
    </section>
  );
}