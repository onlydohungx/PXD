import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Home, ArrowLeft, Video, Search, Film, Clock, Clapperboard, RefreshCw } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { fetchMovies } from "@/lib/api";
import { MovieCard } from "@/components/movie-card";

export default function NotFound() {
  const [location, navigate] = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const [suggestedMovies, setSuggestedMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorPath, setErrorPath] = useState(window.location.pathname);
  
  // Theo dõi đường dẫn gây lỗi từ URL
  useEffect(() => {
    setErrorPath(window.location.pathname);
  }, [location]);

  // Tải phim đề xuất
  useEffect(() => {
    const loadSuggestedMovies = async () => {
      setIsLoading(true);
      try {
        const response = await fetchMovies({ 
          page: 1, 
          limit: 4, 
          sort_field: "view_total", 
          sort_type: "desc" 
        });
        if (response && response.items) {
          setSuggestedMovies(response.items);
        }
      } catch (error) {
        console.error("Error loading suggested movies:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSuggestedMovies();
  }, []);

  // Di chuyển về trang trước đó
  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/");
    }
  }, [navigate]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  const lightVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 2, ease: "easeInOut" }
    }
  };

  return (
    <PageContainer maxWidth="large" marginTop="large" className="relative min-h-[80vh] pt-20 md:pt-16 pb-20">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary spotlight */}
        <motion.div 
          variants={lightVariants}
          initial="hidden"
          animate="visible"
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/10 mix-blend-screen blur-[100px] opacity-30"
        />
        
        {/* Secondary spotlight */}
        <motion.div 
          variants={lightVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
          className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/10 mix-blend-screen blur-[80px] opacity-30"
        />
        
        {/* Animated decorations for desktop */}
        <div className="hidden md:block">
          <motion.div
            animate={{
              opacity: shouldReduceMotion ? 0.2 : [0.1, 0.3, 0.1],
              scale: shouldReduceMotion ? 1 : [1, 1.1, 1],
              rotate: shouldReduceMotion ? 0 : [0, 5, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-96 h-96 rounded-full bg-primary/10 blur-3xl -top-20 -left-20"
          />
          <motion.div
            animate={{
              opacity: shouldReduceMotion ? 0.2 : [0.1, 0.2, 0.1],
              scale: shouldReduceMotion ? 1 : [1, 1.2, 1],
              rotate: shouldReduceMotion ? 0 : [0, -5, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute w-72 h-72 rounded-full bg-secondary/10 blur-3xl -bottom-10 -right-10"
          />
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center"
      >
        {/* 404 Error Display */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="inline-block relative">
            <div className="text-[120px] sm:text-[160px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/90 to-secondary">
              404
            </div>
            <div className="absolute -bottom-4 w-full h-4 bg-gradient-to-r from-primary/20 to-secondary/20 blur-lg"></div>
            <div className="absolute -inset-8 bg-primary/5 rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.div variants={itemVariants} className="max-w-md text-center mb-10">
          <h1 className="text-3xl font-bold mb-4">Ooops! Trang không tồn tại</h1>
          <p className="text-muted-foreground mb-2">
            Có vẻ như trang <span className="text-foreground font-medium">{errorPath}</span> không tồn tại hoặc đã bị di chuyển.
          </p>
          <p className="text-muted-foreground mb-8">
            Vui lòng quay lại trang chủ hoặc tiếp tục khám phá các phim khác.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-4 justify-center mb-16">
          <Button
            size="lg"
            onClick={goBack}
            className="gap-2 rounded-full border border-primary/20 hover:border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Button>
          
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary gap-2 hover:shadow-lg rounded-full"
          >
            <Link href="/">
              <Home className="h-4 w-4" /> Trang chủ
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            size="lg"
            className="bg-card/40 backdrop-blur-sm border-card gap-2 rounded-full"
          >
            <Link href="/search">
              <Search className="h-4 w-4" /> Tìm kiếm phim
            </Link>
          </Button>
        </motion.div>

        {/* Suggested Movies */}
        {suggestedMovies.length > 0 && (
          <motion.div variants={itemVariants} className="w-full max-w-5xl">
            <div className="flex items-center mb-6">
              <div className="p-2 rounded-lg bg-primary/10 text-primary mr-3">
                <Clapperboard className="h-5 w-5" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold">Phim đề xuất cho bạn</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {suggestedMovies.map((movie, index) => (
                <motion.div 
                  key={movie.slug} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + (index * 0.1) }}
                >
                  <MovieCard
                    slug={movie.slug}
                    title={movie.name}
                    poster={movie.poster_url || movie.thumb_url || ''}
                    year={movie.year ? movie.year.toString() : undefined}
                    rating={movie.tmdb?.vote_average}
                    quality={movie.quality || "HD"}
                    category={movie.category && movie.category[0]?.name}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading state for suggested movies */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center mt-8"
          >
            <RefreshCw className="h-5 w-5 animate-spin text-primary mr-2" />
            <span className="text-muted-foreground">Đang tải phim đề xuất...</span>
          </motion.div>
        )}
      </motion.div>
    </PageContainer>
  );
}