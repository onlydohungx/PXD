import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchMovieDetails, checkFavoriteStatus, addToFavorites, removeFromFavorites, fetchSimilarMovies, fetchActorImages } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { 
  Heart, Play, Calendar, Clock, Film, Star, Info, 
  Award, MapPin, Loader2, ArrowLeft, Share2, 
  ChevronRight, ChevronLeft, ExternalLink, 
  Globe, User, MessageCircle, Bookmark, Tag,
  Smartphone, Tv, Youtube, AlertTriangle, RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { CommentList } from '@/components/comments/comment-list';

export default function MovieDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(0);
  const [currentEpisodePage, setCurrentEpisodePage] = useState(0);
  const [showMoreSimilar, setShowMoreSimilar] = useState(false);
  
  // Fetch movie details
  const { 
    data: movieData, 
    isLoading, 
    error,
    isError
  } = useQuery({
    queryKey: ['/api/movie', slug],
    queryFn: () => fetchMovieDetails(slug || ""),
    enabled: !!slug,
  });

  // Kiểm tra trạng thái yêu thích
  const { 
    data: favoriteData,
    isLoading: isFavoriteLoading,
  } = useQuery({
    queryKey: ['/api/favorites/check', slug],
    queryFn: () => checkFavoriteStatus(slug || ""),
    enabled: !!slug && isAuthenticated,
  });
  
  // Lấy danh sách phim đề xuất/tương tự
  const {
    data: similarMoviesData,
    isLoading: isSimilarMoviesLoading,
  } = useQuery({
    queryKey: ['/api/movie/similar', slug],
    queryFn: () => fetchSimilarMovies(slug || ""),
    enabled: !!slug,
  });
  
  // Cập nhật trạng thái yêu thích khi dữ liệu thay đổi
  useEffect(() => {
    if (favoriteData && 'isFavorite' in favoriteData) {
      setIsFavorite(favoriteData.isFavorite);
    }
  }, [favoriteData]);

  // Mutation để thêm/xóa khỏi danh sách yêu thích
  const addToFavoritesMutation = useMutation({
    mutationFn: () => addToFavorites(slug || ""),
    onSuccess: () => {
      setIsFavorite(true);
      toast({
        title: "Đã thêm vào danh sách yêu thích",
        description: "Phim đã được thêm vào danh sách yêu thích của bạn",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể thêm phim vào danh sách yêu thích",
        variant: "destructive",
      });
    }
  });

  const removeFromFavoritesMutation = useMutation({
    mutationFn: () => removeFromFavorites(slug || ""),
    onSuccess: () => {
      setIsFavorite(false);
      toast({
        title: "Đã xóa khỏi danh sách yêu thích",
        description: "Phim đã được xóa khỏi danh sách yêu thích của bạn",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa phim khỏi danh sách yêu thích",
        variant: "destructive",
      });
    }
  });

  // Fetch actor images
  const { 
    data: actorImagesData, 
    isLoading: isActorImagesLoading 
  } = useQuery({
    queryKey: ['/api/movies/actors', slug],
    queryFn: () => fetchActorImages(slug || ""),
    enabled: !!slug && !!movieData?.movie?.actor && movieData.movie.actor.length > 0,
  });

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để sử dụng tính năng này",
        variant: "destructive",
      });
      return;
    }

    if (isFavorite) {
      removeFromFavoritesMutation.mutate();
    } else {
      addToFavoritesMutation.mutate();
    }
  };
  
  const handleWatchMovie = () => {
    // Bỏ kiểm tra đăng nhập để cho phép người dùng xem phim mà không cần đăng nhập
    navigate(`/watch/${slug}/${selectedEpisodeIndex}`);
  };
  
  const handleShareMovie = () => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = window.location.href;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        toast({
          title: "Đã sao chép liên kết",
          description: "Liên kết phim đã được sao chép vào clipboard",
          variant: "default",
        });
      } else {
        toast({
          title: "Lỗi sao chép",
          description: "Không thể sao chép liên kết, vui lòng thử lại",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Không thể sao chép: ", err);
      toast({
        title: "Lỗi sao chép",
        description: "Không thể sao chép liên kết, vui lòng thử lại",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state
  if (isError || !movieData || !movieData.movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-red-500 mb-4">
          {movieData?.name || "Không thể tải thông tin phim"}
        </h1>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          {movieData?.error?.message || (error instanceof Error ? error.message : "Không tìm thấy phim hoặc đã xảy ra lỗi kết nối đến API phim")}
        </p>
        <div className="flex gap-4">
          <Button onClick={() => navigate("/")} variant="default">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Trang chủ
          </Button>
          <Button 
            onClick={() => {
              if (slug) {
                // Tải lại dữ liệu phim bằng cách invalidate query
                queryClient.invalidateQueries({ queryKey: [`/api/movie/${slug}`] });
              }
            }} 
            variant="outline" 
            className="bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-black/60 hover:border-white/20 text-white"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-red-500/5 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-1/4 right-1/4 w-1/2 h-1/2 bg-orange-500/5 rounded-full blur-3xl opacity-50"></div>
        </div>
      </div>
    );
  }

  const { movie, episodes } = movieData;
  const isMultiEpisode = movie.type === 'series';
  const serverCount = episodes?.length || 0;
  
  // Lấy danh sách tập từ server đầu tiên
  const episodeList = episodes?.[0]?.server_data || [];
  const episodeCount = episodeList?.length || 0;
  
  // Hiển thị 20 tập mỗi trang
  const episodesPerPage = 20;
  const totalEpisodePages = Math.ceil(episodeCount / episodesPerPage);
  
  const startEpisodeIndex = currentEpisodePage * episodesPerPage;
  const endEpisodeIndex = Math.min(startEpisodeIndex + episodesPerPage, episodeCount);
  const currentEpisodes = episodeList?.slice(startEpisodeIndex, endEpisodeIndex) || [];
  
  const nextEpisodePage = () => {
    if (currentEpisodePage < totalEpisodePages - 1) {
      setCurrentEpisodePage(currentEpisodePage + 1);
    }
  };
  
  const prevEpisodePage = () => {
    if (currentEpisodePage > 0) {
      setCurrentEpisodePage(currentEpisodePage - 1);
    }
  };
  
  const formatCategory = (categories: any) => {
    if (!categories) return "Chưa phân loại";
    if (Array.isArray(categories)) {
      return categories.map(cat => cat.name).join(', ');
    }
    return categories;
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/50 overflow-hidden">
      {/* Enhanced animated background */}
      <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), 
                             radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
                             radial-gradient(circle at 40% 40%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)`,
          }}
        />

      </div>

      {/* Hero Section - Enhanced cinematic experience */}
      <div className="relative w-full h-[92vh] sm:h-[85vh] md:h-[80vh] overflow-hidden">
        {/* Background Image with enhanced effects */}
        <motion.div 
          initial={{ scale: 1.1, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${movie.thumb_url || movie.poster_url})` }}
        />
        
        {/* Enhanced gradient overlays for premium look */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-slate-950/30 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-slate-950/60 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 mix-blend-overlay z-10"></div>
        
        {/* Cinematic glow effects */}
        <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl opacity-40 z-10"></div>
        
        {/* Enhanced Back Button with glass morphism */}
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6, type: "spring", stiffness: 200 }}
          className="absolute top-6 left-6 z-30"
        >
          <Button 
            variant="ghost" 
            size="sm" 
            className="bg-gradient-to-r from-slate-800/60 via-slate-700/50 to-slate-800/60 backdrop-blur-xl hover:from-slate-700/70 hover:via-slate-600/60 hover:to-slate-700/70 rounded-2xl h-11 px-6 text-white text-sm font-medium border border-slate-600/40 hover:border-slate-500/60 shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 hover:scale-105 group"
            onClick={() => navigate("/")}
          >
            <motion.div
              animate={{ x: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            </motion.div>
            Trang chủ
          </Button>
        </motion.div>
        
        {/* Mobile Nav Fix - Prevent overlap with navbar */}
        <div className="h-16 md:hidden"></div>
        
        {/* Content Container */}
        <div className="container mx-auto px-4 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] relative z-20 h-full flex flex-col justify-end pb-6 md:pb-10">
          {/* Mobile View - Modern Stacked Layout */}
          <div className="block md:hidden">
            <div className="flex flex-col items-center px-4 mt-8">
              {/* Movie Poster - Floating design with glow effect for mobile */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative w-[170px] h-[255px] rounded-2xl overflow-hidden shadow-2xl mb-6 border border-white/10 z-30"
              >
                {/* Subtle glow behind poster */}
                <div className="absolute -inset-1 bg-gradient-to-br from-primary/30 via-primary/5 to-secondary/30 rounded-3xl blur-xl opacity-70 -z-10"></div>
                
                {/* Image with subtle zoom on hover */}
                <div className="absolute inset-0 w-full h-full overflow-hidden group">
                  <img 
                    src={movie.poster_url} 
                    alt={movie.name} 
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
                  />
                  
                  {/* Soft gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-60"></div>
                </div>
                
                {/* Rating badge - redesigned with shadow */}
                {movie.tmdb?.vote_average > 0 && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg">
                    <Star className="h-2.5 w-2.5 fill-black" /> 
                    <span>{movie.tmdb.vote_average}</span>
                  </div>
                )}
                
                {/* Quality badge - redesigned with glow */}
                {movie.quality && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-primary to-primary-foreground text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-lg">
                    {movie.quality}
                  </div>
                )}
              </motion.div>
              
              {/* Movie Info - Enhanced design for mobile */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="flex flex-col text-center w-full"
              >
                {/* Title with glow effect and Origin Name */}
                <h1 className="text-2xl font-bold text-white mb-1.5 leading-tight drop-shadow-md">{movie.name}</h1>
                {movie.origin_name && (
                  <p className="text-xs text-white/70 mb-3 line-clamp-1">{movie.origin_name}</p>
                )}
                
                {/* Tags/Badges - Modern with rounded corners */}
                <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                  {movie.type === 'series' && (
                    <Badge variant="outline" className="bg-secondary/20 text-secondary text-xs font-medium border-secondary/30 py-0.5 px-2.5 rounded-full shadow-sm">
                      Phim bộ
                    </Badge>
                  )}
                  {movie.type === 'single' && (
                    <Badge variant="outline" className="bg-secondary/20 text-secondary text-xs font-medium border-secondary/30 py-0.5 px-2.5 rounded-full shadow-sm">
                      Phim lẻ
                    </Badge>
                  )}
                  {movie.quality && (
                    <Badge variant="outline" className="bg-primary/20 text-primary text-xs font-medium border-primary/30 py-0.5 px-2.5 rounded-full shadow-sm">
                      {movie.quality}
                    </Badge>
                  )}
                  {movie.status === 'ongoing' && (
                    <Badge variant="outline" className="bg-green-500/20 text-green-500 text-xs font-medium border-green-500/30 py-0.5 px-2.5 rounded-full shadow-sm">
                      Đang chiếu
                    </Badge>
                  )}
                </div>
                
                {/* Mobile - Enhanced movie info with glass effect */}
                <div className="flex justify-center gap-4 mb-5 bg-black/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/5 shadow-inner">
                  <span className="flex items-center gap-1.5 text-xs text-white/80">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    {movie.year || 'N/A'}
                  </span>
                  
                  {isMultiEpisode && (
                    <span className="flex items-center gap-1.5 text-xs text-white/80">
                      <Film className="h-3.5 w-3.5 text-primary" />
                      {episodeCount} tập
                    </span>
                  )}
                  
                  {movie.tmdb?.vote_average > 0 && (
                    <span className="flex items-center gap-1.5 text-xs text-white/80">
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                      {movie.tmdb.vote_average}/10
                    </span>
                  )}
                </div>
                
                {/* Action Buttons - Modernized with animations */}
                <div className="flex flex-col items-center gap-3">
                  <Button 
                    className="bg-gradient-to-r from-primary to-primary-foreground hover:brightness-110 w-full sm:w-auto text-sm font-medium rounded-full py-2 h-auto shadow-lg flex items-center justify-center gap-2 px-7 transition-all duration-300" 
                    onClick={handleWatchMovie}
                  >
                    <Play className="h-4 w-4" /> Xem phim
                  </Button>
                  
                  <div className="flex justify-center gap-3 mt-2">
                    <Button 
                      variant={isFavorite ? "destructive" : "outline"} 
                      className={`text-xs rounded-full h-9 px-4 transition-all duration-300 ${isFavorite ? 'bg-gradient-to-r from-pink-500 to-pink-600 hover:brightness-110 border-0 shadow-lg' : 'bg-black/40 backdrop-blur-md hover:bg-black/60 border-white/10 hover:border-white/20'}`} 
                      onClick={handleToggleFavorite}
                      disabled={!isAuthenticated || isFavoriteLoading}
                    >
                      <Heart className={`h-3.5 w-3.5 mr-1.5 ${isFavorite ? 'fill-current' : ''}`} />
                      {isFavorite ? 'Đã thích' : 'Yêu thích'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-black/40 backdrop-blur-md hover:bg-black/60 border-white/10 hover:border-white/20 text-xs rounded-full h-9 px-4 transition-all duration-300 shadow-md" 
                      onClick={handleShareMovie}
                    >
                      <Share2 className="h-3.5 w-3.5 mr-1.5" /> Chia sẻ
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Desktop View - Modern Side by Side Layout with Enhanced Design */}
          <div className="hidden md:grid md:grid-cols-12 gap-10">
            {/* Movie Poster - Left Side with Floating Effect */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="md:col-span-3 lg:col-span-2 flex justify-start items-center"
            >
              <div className="relative w-[220px] lg:w-[240px] h-[330px] lg:h-[360px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group z-20">
                {/* Glowing effect behind poster */}
                <div className="absolute -inset-2 bg-gradient-to-br from-primary/30 via-primary/5 to-secondary/30 rounded-3xl blur-xl opacity-70 -z-10 group-hover:opacity-90 transition-all duration-700"></div>
                
                {/* Shine effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-tr from-white to-transparent z-10 transition-all duration-1000"></div>
                
                {/* Image with enhanced hover animation */}
                <div className="absolute inset-0 overflow-hidden">
                  <img 
                    src={movie.poster_url} 
                    alt={movie.name} 
                    className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-110"
                  />
                  
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-50 group-hover:opacity-40 transition-opacity duration-500"></div>
                  
                  {/* Noise texture overlay */}
                  <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-soft-light"></div>
                </div>
                
                {/* Rating badge with enhanced design */}
                {movie.tmdb?.vote_average > 0 && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg z-20">
                    <Star className="h-3.5 w-3.5 fill-black" /> 
                    <span>{movie.tmdb.vote_average}/10</span>
                  </div>
                )}
                
                {/* Quality badge with enhanced design */}
                {movie.quality && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-primary to-primary-foreground text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg z-20">
                    {movie.quality}
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* Movie Info - Right Side with Modern Layout */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="md:col-span-9 lg:col-span-10 flex flex-col text-left"
            >
              {/* Title with glow effect and Origin Name */}
              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 leading-tight drop-shadow-md">{movie.name}</h1>
              {movie.origin_name && (
                <p className="text-sm lg:text-base text-white/70 mb-4">{movie.origin_name}</p>
              )}
              
              {/* Enhanced Tags/Badges with modern design */}
              <div className="flex flex-wrap gap-2 mb-5">
                {movie.lang && (
                  <Badge variant="outline" className="bg-white/10 backdrop-blur-sm text-white text-xs font-medium border-white/10 py-1 px-3 rounded-full shadow-sm">
                    {movie.lang}
                  </Badge>
                )}
                {movie.type === 'series' && (
                  <Badge variant="outline" className="bg-secondary/20 text-secondary text-xs font-medium border-secondary/30 py-1 px-3 rounded-full shadow-sm">
                    Phim bộ
                  </Badge>
                )}
                {movie.type === 'single' && (
                  <Badge variant="outline" className="bg-secondary/20 text-secondary text-xs font-medium border-secondary/30 py-1 px-3 rounded-full shadow-sm">
                    Phim lẻ
                  </Badge>
                )}
                {movie.status === 'ongoing' && (
                  <Badge variant="outline" className="bg-green-500/20 text-green-500 text-xs font-medium border-green-500/30 py-1 px-3 rounded-full shadow-sm">
                    Đang chiếu
                  </Badge>
                )}
                {movie.status === 'completed' && (
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-500 text-xs font-medium border-blue-500/30 py-1 px-3 rounded-full shadow-sm">
                    Hoàn thành
                  </Badge>
                )}
              </div>
              
              {/* Movie Attributes with glass effect panel */}
              <div className="flex flex-wrap gap-5 mb-6 p-3 lg:p-4 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/5 shadow-inner text-sm">
                <div className="flex items-center gap-2 text-white/80">
                  <div className="p-1.5 rounded-full bg-primary/20">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <span>{movie.year || 'N/A'}</span>
                </div>
                {movie.time && (
                  <div className="flex items-center gap-2 text-white/80">
                    <div className="p-1.5 rounded-full bg-primary/20">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <span>{movie.time}</span>
                  </div>
                )}
                {isMultiEpisode && (
                  <div className="flex items-center gap-2 text-white/80">
                    <div className="p-1.5 rounded-full bg-primary/20">
                      <Film className="h-4 w-4 text-primary" />
                    </div>
                    <span>{episodeCount} tập</span>
                  </div>
                )}
                {movie.category && movie.category.length > 0 && (
                  <div className="flex items-center gap-2 text-white/80">
                    <div className="p-1.5 rounded-full bg-primary/20">
                      <Tag className="h-4 w-4 text-primary" />
                    </div>
                    <span className="line-clamp-1">{formatCategory(movie.category)}</span>
                  </div>
                )}
                {movie.country && (
                  <div className="flex items-center gap-2 text-white/80">
                    <div className="p-1.5 rounded-full bg-primary/20">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <span>{typeof movie.country === 'object' ? 
                      (movie.country.name || 'Không xác định') : 
                      movie.country}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons with enhanced modern style */}
              <div className="flex flex-wrap gap-3 mt-2">
                <Button 
                  className="bg-gradient-to-r from-primary to-primary-foreground hover:brightness-110 text-sm font-medium rounded-full h-10 px-6 flex items-center shadow-lg transition-all duration-300" 
                  onClick={handleWatchMovie}
                >
                  <Play className="h-4 w-4 mr-2" /> Xem phim
                </Button>
                <Button 
                  variant={isFavorite ? "destructive" : "outline"} 
                  className={`text-sm rounded-full h-10 px-4 transition-all duration-300 ${isFavorite ? 'bg-gradient-to-r from-pink-500 to-pink-600 hover:brightness-110 border-0 shadow-lg' : 'bg-black/40 backdrop-blur-md hover:bg-black/60 border-white/10 hover:border-white/20 shadow-md'}`} 
                  onClick={handleToggleFavorite}
                  disabled={!isAuthenticated || isFavoriteLoading}
                >
                  <Heart className={`h-4 w-4 mr-1.5 ${isFavorite ? 'fill-current' : ''}`} /> 
                  {isFavorite ? 'Đã thích' : 'Yêu thích'}
                </Button>
                <Button 
                  variant="outline" 
                  className="bg-black/40 backdrop-blur-md hover:bg-black/60 border-white/10 hover:border-white/20 text-sm rounded-full h-10 px-4 transition-all duration-300 shadow-md" 
                  onClick={handleShareMovie}
                >
                  <Share2 className="h-4 w-4 mr-1.5" /> Chia sẻ
                </Button>
                {movie.trailer_url && (
                  <Button 
                    variant="outline" 
                    className="bg-black/40 backdrop-blur-md hover:bg-black/60 border-white/10 hover:border-white/20 text-sm rounded-full h-10 px-4 transition-all duration-300 shadow-md" 
                    onClick={() => window.open(movie.trailer_url, '_blank')}
                  >
                    <Youtube className="h-4 w-4 mr-1.5 text-red-500" /> Trailer
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Content Section - Enhanced with Modern Design */}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] py-8 md:py-12">
        {/* Decorative elements */}
        <div className="absolute left-0 right-0 h-32 -top-5 bg-gradient-to-b from-background to-transparent z-0"></div>
        <div className="absolute left-0 w-1/3 h-64 opacity-30 bg-primary/5 blur-3xl rounded-full -bottom-10"></div>
        <div className="absolute right-0 w-1/3 h-64 opacity-30 bg-secondary/5 blur-3xl rounded-full -bottom-10"></div>
        
        <Card className="border-white/10 bg-black/30 backdrop-blur-md shadow-2xl overflow-hidden rounded-2xl relative z-10">
          <CardContent className="p-0">
            <Tabs defaultValue={isMultiEpisode ? "episodes" : "info"} className="w-full">
              <TabsList className="w-full grid grid-cols-4 bg-black/60 rounded-t-xl p-1.5 border-b border-white/5 text-xs md:text-sm">
                {isMultiEpisode && (
                  <TabsTrigger 
                    value="episodes" 
                    className="rounded-lg py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-foreground/80 data-[state=active]:text-white transition-all duration-300"
                  >
                    Tập phim
                  </TabsTrigger>
                )}
                <TabsTrigger 
                  value="info" 
                  className="rounded-lg py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-foreground/80 data-[state=active]:text-white transition-all duration-300"
                >
                  Thông tin
                </TabsTrigger>
                <TabsTrigger 
                  value="cast" 
                  className="rounded-lg py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-foreground/80 data-[state=active]:text-white transition-all duration-300"
                >
                  Diễn viên
                </TabsTrigger>
                <TabsTrigger 
                  value="comments" 
                  className="rounded-lg py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-foreground/80 data-[state=active]:text-white transition-all duration-300"
                >
                  Bình luận
                </TabsTrigger>
              </TabsList>
            
              {isMultiEpisode && (
                <TabsContent value="episodes" className="p-3 sm:p-4 md:p-6">
                  {/* Authentication Notice for Non-logged in Users */}
                  {!isAuthenticated && (
                    <div className="mb-4">
                      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
                        <h3 className="text-lg font-bold text-primary mb-1">Đăng nhập để xem phim</h3>
                        <p className="text-sm text-white/70 mb-2">Vui lòng đăng nhập để có thể xem phim này.</p>
                        <Button 
                          variant="default" 
                          className="bg-primary hover:bg-primary/90 text-white rounded"
                          onClick={() => navigate("/auth")}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Đăng nhập ngay
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Phần thông tin phim và chất lượng - Enhanced */}
                  <div className="p-5 rounded-xl bg-gradient-to-r from-black/40 to-black/30 backdrop-blur-lg border border-white/10 mb-6 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full shadow-inner">
                        <Film className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white mb-1">Chất lượng {movie.quality || 'HD'}</h3>
                        <p className="text-xs text-white/60">{movie.lang || 'Phụ đề Tiếng Việt'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 md:mb-6">
                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-white mb-1 md:mb-1.5">Danh sách tập phim</h3>
                      <p className="text-xs md:text-sm text-white/60">Phim gồm {episodeCount} tập, chọn tập để xem</p>
                    </div>
                    
                    {totalEpisodePages > 1 && (
                      <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md rounded-full px-3 py-2 border border-white/10 text-xs shadow-md">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 md:h-8 md:w-8 rounded-full hover:bg-white/10 transition-colors duration-200"
                          onClick={prevEpisodePage}
                          disabled={currentEpisodePage === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs md:text-sm font-medium px-1">
                          Trang {currentEpisodePage + 1}/{totalEpisodePages}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 md:h-8 md:w-8 rounded-full hover:bg-white/10 transition-colors duration-200"
                          onClick={nextEpisodePage}
                          disabled={currentEpisodePage >= totalEpisodePages - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Episodes grid - enhanced with modern styling */}
                  <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 md:gap-3 mb-5 md:mb-6">
                    {currentEpisodes.map((episode: any, index: number) => {
                      const episodeIndex = startEpisodeIndex + index;
                      // Lấy số tập từ tên episode (e.g., "Tập 01" -> 1)
                      const episodeNumber = episode.name.match(/\d+/) ? parseInt(episode.name.match(/\d+/)[0]) : (episodeIndex + 1);
                      
                      return (
                        <Button
                          key={episodeIndex}
                          variant={selectedEpisodeIndex === episodeIndex ? "default" : "outline"}
                          className={`w-full aspect-square text-xs rounded-xl transition-all duration-300 ${
                            selectedEpisodeIndex === episodeIndex 
                              ? "bg-gradient-to-br from-primary to-primary-foreground hover:brightness-110 text-white font-medium shadow-lg border-0" 
                              : "bg-black/30 backdrop-blur-sm hover:bg-black/40 border-white/10 hover:border-white/20 hover:shadow-md"
                          }`}
                          onClick={() => setSelectedEpisodeIndex(episodeIndex)}
                        >
                          {episodeNumber}
                        </Button>
                      );
                    })}
                  </div>
                  
                  {/* Mobile optimized footer */}
                  <div className="flex flex-col xs:flex-row justify-between items-center gap-3 mt-4 pt-3 border-t border-white/5">
                    <div className="flex items-center text-[10px] md:text-xs text-white/60 gap-1.5">
                      <Film className="h-3 w-3 md:h-3.5 md:w-3.5" />
                      {serverCount > 1 ? (
                        <span>{serverCount} phiên bản audio · {movie.lang}</span>
                      ) : (
                        <span>1 phiên bản audio · {movie.lang || 'Không rõ'}</span>
                      )}
                    </div>
                    
                    <Button 
                      onClick={handleWatchMovie}
                      className="bg-primary hover:bg-primary/90 text-[10px] md:text-xs rounded-md h-7 md:h-8 px-2.5 md:px-3 w-full xs:w-auto"
                    >
                      <Play className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1.5 md:mr-2" />
                      {currentEpisodes[selectedEpisodeIndex - startEpisodeIndex] ? 
                        `Xem ${currentEpisodes[selectedEpisodeIndex - startEpisodeIndex].name}` : 
                        `Xem tập ${selectedEpisodeIndex + 1}`}
                    </Button>
                  </div>
                </TabsContent>
              )}
              
              <TabsContent value="info" className="p-3 sm:p-4 md:p-6">
                {/* Authentication Notice for Non-logged in Users */}
                {!isAuthenticated && (
                  <div className="mb-4">
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
                      <h3 className="text-lg font-bold text-primary mb-1">Đăng nhập để xem phim</h3>
                      <p className="text-sm text-white/70 mb-2">Vui lòng đăng nhập để có thể xem phim này.</p>
                      <Button 
                        variant="default" 
                        className="bg-primary hover:bg-primary/90 text-white rounded"
                        onClick={() => navigate("/auth")}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Đăng nhập ngay
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Content description - optimize for mobile */}
                <div className="mb-4 md:mb-6">
                  <h3 className="text-sm md:text-base font-medium text-white mb-2 md:mb-3">Nội dung phim</h3>
                  <p className="text-xs md:text-sm leading-relaxed text-white/70">
                    {movie.content || "Nội dung phim đang được cập nhật..."}
                  </p>
                </div>
                
                <Separator className="my-4 md:my-6 bg-white/5" />
                
                {/* Mobile first layout - stack on mobile, grid on desktop */}
                <div className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-8">
                  <div className="md:col-span-7">
                    <h3 className="text-sm md:text-base font-medium text-white mb-3 md:mb-4">Chi tiết phim</h3>
                    
                    <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                      <div className="flex gap-2">
                        <span className="text-white/50 w-24 md:w-28">Tên phim:</span>
                        <span className="text-white font-medium flex-1">{movie.name}</span>
                      </div>
                      
                      {movie.origin_name && (
                        <div className="flex gap-2">
                          <span className="text-white/50 w-24 md:w-28">Tên gốc:</span>
                          <span className="text-white font-medium flex-1">{movie.origin_name}</span>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <span className="text-white/50 w-24 md:w-28">Thể loại:</span>
                        <span className="text-white font-medium flex-1 line-clamp-2">{formatCategory(movie.category)}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <span className="text-white/50 w-24 md:w-28">Năm sản xuất:</span>
                        <span className="text-white font-medium flex-1">{movie.year || 'N/A'}</span>
                      </div>
                      
                      {movie.time && (
                        <div className="flex gap-2">
                          <span className="text-white/50 w-24 md:w-28">Thời lượng:</span>
                          <span className="text-white font-medium flex-1">{movie.time}</span>
                        </div>
                      )}
                      
                      {movie.country && (
                        <div className="flex gap-2">
                          <span className="text-white/50 w-24 md:w-28">Quốc gia:</span>
                          <span className="text-white font-medium flex-1">
                            {typeof movie.country === 'object' ? 
                              (movie.country.name || 'Không xác định') : 
                              movie.country}
                          </span>
                        </div>
                      )}
                      
                      {movie.director && (
                        <div className="flex gap-2">
                          <span className="text-white/50 w-24 md:w-28">Đạo diễn:</span>
                          <span className="text-white font-medium flex-1">{movie.director}</span>
                        </div>
                      )}
                      
                      {movie.lang && (
                        <div className="flex gap-2">
                          <span className="text-white/50 w-24 md:w-28">Ngôn ngữ:</span>
                          <span className="text-white font-medium flex-1">{movie.lang}</span>
                        </div>
                      )}
                      
                      {movie.quality && (
                        <div className="flex gap-2">
                          <span className="text-white/50 w-24 md:w-28">Chất lượng:</span>
                          <span className="text-white font-medium flex-1">{movie.quality}</span>
                        </div>
                      )}
                      
                      {movie.status && (
                        <div className="flex gap-2">
                          <span className="text-white/50 w-24 md:w-28">Trạng thái:</span>
                          <span className="text-white font-medium flex-1">
                            {movie.status === 'ongoing' ? 'Đang chiếu' : 'Hoàn thành'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Info cards - optimized for mobile */}
                  <div className="md:col-span-5 flex flex-col gap-4">
                    {movie.tmdb && movie.tmdb.vote_average > 0 && (
                      <div className="bg-black/30 rounded-lg p-3 md:p-4 border border-white/5">
                        <h3 className="text-sm md:text-base font-medium text-white mb-3 md:mb-4">Đánh giá</h3>
                        <div className="flex gap-3 md:gap-4 items-center">
                          <div className="bg-yellow-500 text-black font-bold rounded-md h-12 w-12 md:h-14 md:w-14 flex flex-col items-center justify-center text-xs md:text-sm">
                            <span className="text-base md:text-lg">{movie.tmdb.vote_average}</span>
                            <span className="text-[10px] md:text-xs">/10</span>
                          </div>
                          <div>
                            <span className="block text-white font-medium text-xs md:text-sm">IMDb Rating</span>
                            <span className="block text-[10px] md:text-xs text-white/50">
                              {movie.tmdb.vote_count || 0} lượt đánh giá
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {isMultiEpisode && (
                      <div className="bg-black/30 rounded-lg p-3 md:p-4 border border-white/5">
                        <h3 className="text-sm md:text-base font-medium text-white mb-3 md:mb-4">Thông tin phim bộ</h3>
                        <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/50">Số tập:</span>
                            <span className="text-white font-medium">{episodeCount} tập</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Số phiên bản:</span>
                            <span className="text-white font-medium">{serverCount} server</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Tập hiện tại:</span>
                            <span className="text-primary font-medium">
                              {episodeList[selectedEpisodeIndex] ? 
                                episodeList[selectedEpisodeIndex].name : 
                                `Tập ${selectedEpisodeIndex + 1}`}
                            </span>
                          </div>
                          <Separator className="my-2 bg-white/5" />
                          <Button 
                            className="w-full mt-2 md:mt-3 h-7 md:h-8 text-[10px] md:text-xs bg-primary hover:bg-primary/90 rounded-md" 
                            onClick={handleWatchMovie}
                          >
                            <Play className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1.5 md:mr-2" /> Xem ngay
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="cast" className="p-3 sm:p-4 md:p-6">
                {/* Authentication Notice for Non-logged in Users */}
                {!isAuthenticated && (
                  <div className="mb-4">
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
                      <h3 className="text-lg font-bold text-primary mb-1">Đăng nhập để xem phim</h3>
                      <p className="text-sm text-white/70 mb-2">Vui lòng đăng nhập để có thể xem phim này.</p>
                      <Button 
                        variant="default" 
                        className="bg-primary hover:bg-primary/90 text-white rounded"
                        onClick={() => navigate("/auth")}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Đăng nhập ngay
                      </Button>
                    </div>
                  </div>
                )}

                {movie.actor && movie.actor.length > 0 ? (
                  <>
                    {/* Enhanced header with decorative elements */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-gradient-to-br from-primary/30 to-secondary/20 backdrop-blur-sm border border-white/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                          Diễn viên
                        </h3>
                      </div>
                      <div className="flex-1 h-[1px] bg-gradient-to-r from-primary/50 via-white/10 to-transparent"></div>
                    </div>
                    
                    {isActorImagesLoading ? (
                      <div className="grid grid-cols-2 gap-6">
                        {movie.actor.map((actor: string, index: number) => (
                          <div key={index} className="group">
                            <div className="aspect-[3/4] rounded-2xl border border-white/10 bg-black/40 shadow-2xl animate-pulse" />
                            <div className="mt-4 space-y-2">
                              <div className="h-5 bg-white/10 rounded animate-pulse" />
                              <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-6">
                        {movie.actor.map((actor: string, index: number) => {
                          const actorImage = actorImagesData?.actors?.find((a: any) => a.name === actor);
                          
                          return (
                            <motion.div 
                              key={index} 
                              className="group cursor-pointer"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1, duration: 0.6 }}
                              whileHover={{ y: -8 }}
                            >
                              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-black/60 to-black/30 shadow-2xl group-hover:shadow-primary/20 transition-all duration-500">
                                {/* Animated background glow */}
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                
                                {actorImage?.imageUrl ? (
                                  <img 
                                    src={actorImage.imageUrl} 
                                    alt={actor}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-secondary/20 relative overflow-hidden">
                                    {/* Animated background pattern */}
                                    <div className="absolute inset-0 opacity-20">
                                      <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl -translate-x-16 -translate-y-16 group-hover:translate-x-8 group-hover:translate-y-8 transition-transform duration-1000" />
                                      <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary rounded-full blur-2xl translate-x-12 translate-y-12 group-hover:-translate-x-4 group-hover:-translate-y-4 transition-transform duration-1000" />
                                    </div>
                                    <span className="text-5xl font-bold text-white/90 relative z-10 transition-transform duration-500 group-hover:scale-110">
                                      {actor.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Enhanced gradient overlays */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                
                                {/* Subtle border glow effect */}
                                <div className="absolute inset-0 rounded-2xl border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                
                                {/* Actor info with enhanced styling */}
                                <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                  <div className="space-y-1">
                                    <h4 className="text-white font-bold text-lg leading-tight tracking-wide group-hover:text-primary transition-colors duration-300">
                                      {actor}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      <div className="w-1 h-4 bg-gradient-to-b from-primary to-secondary rounded-full opacity-80" />
                                      <p className="text-white/80 text-sm font-medium">
                                        {index === 0 ? "Vai chính" : 
                                         index === 1 ? "Vai phụ" : 
                                         index === 2 ? "Vai phụ" : 
                                         index === 3 ? "Vai phụ" : 
                                         "Diễn viên"}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Subtle action indicator */}
                                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                    <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                      <ExternalLink className="h-4 w-4 text-white/80" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center relative">
                    {/* Decorative background */}
                    <div className="absolute inset-0 opacity-30">
                      <div className="absolute top-8 left-1/3 w-20 h-20 bg-primary/20 rounded-full blur-2xl" />
                      <div className="absolute bottom-8 right-1/3 w-16 h-16 bg-secondary/20 rounded-full blur-2xl" />
                    </div>
                    
                    <div className="relative z-10 space-y-4">
                      <div className="p-4 rounded-full bg-gradient-to-br from-black/60 to-black/30 border border-white/10 inline-block">
                        <User className="h-12 w-12 text-white/30" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-white/70 text-lg font-medium">Thông tin diễn viên</h4>
                        <p className="text-white/40 text-sm max-w-xs">Danh sách diễn viên đang được cập nhật. Vui lòng quay lại sau.</p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="comments" className="p-3 sm:p-4 md:p-6">
                {/* Authentication Notice for Non-logged in Users */}
                {!isAuthenticated && (
                  <div className="mb-4">
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
                      <h3 className="text-lg font-bold text-primary mb-1">Đăng nhập để bình luận</h3>
                      <p className="text-sm text-white/70 mb-2">Vui lòng đăng nhập để có thể bình luận phim này.</p>
                      <Button 
                        variant="default" 
                        className="bg-primary hover:bg-primary/90 text-white rounded"
                        onClick={() => navigate("/auth")}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Đăng nhập ngay
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Comments Section */}
                <CommentList movieSlug={slug} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Phần phim đề xuất tương tự */}
        {similarMoviesData && similarMoviesData.items && similarMoviesData.items.length > 0 && (
          <div className="mt-8 mb-16 relative">
            {/* Background decoration */}
            <div className="absolute -top-10 -right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 -left-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl"></div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-black/60 to-black/20 backdrop-blur-lg border border-white/10 shadow-xl text-primary">
                  <Tag className="h-5 w-5" />
                </div>
                
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-300">Phim tương tự</h2>
                  <div className="relative h-1 w-16 md:w-20 mt-1 overflow-hidden rounded-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="text-xs md:text-sm text-white/70 hover:text-white"
                onClick={() => setShowMoreSimilar(!showMoreSimilar)}
              >
                {showMoreSimilar ? 'Thu gọn' : 'Xem thêm'}
                {showMoreSimilar ? (
                  <ChevronLeft className="h-3 w-3 ml-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 ml-1" />
                )}
              </Button>
            </div>
            
            {isSimilarMoviesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 lg:gap-5">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div 
                    key={index} 
                    className="aspect-[2/3] rounded-lg bg-black/20 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 lg:gap-5">
                {similarMoviesData.items
                  .slice(0, showMoreSimilar ? 12 : 6)
                  .map((movie: any, index: number) => (
                    <motion.div
                      key={movie.slug}
                      className="group relative rounded-lg overflow-hidden cursor-pointer hover-card-3d"
                      whileHover={{ scale: 1.03 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        transition: { delay: index * 0.05 } 
                      }}
                      onClick={() => {
                        navigate(`/movie/${movie.slug}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <div className="relative aspect-[2/3]">
                        <img
                          src={movie.poster_url || movie.thumb_url}
                          alt={movie.name}
                          className="w-full h-full object-cover rounded-lg"
                          loading="lazy"
                        />
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
                            <Play className="h-8 w-8 text-white" fill="white" />
                          </div>
                        </div>
                        
                        {/* Rating badge */}
                        {movie.tmdb?.vote_average > 0 && (
                          <div className="absolute top-1.5 right-1.5 bg-yellow-500 text-black font-bold text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-black" /> 
                            <span>{movie.tmdb.vote_average}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-2">
                        <h3 className="font-medium text-white text-sm line-clamp-1 group-hover:text-primary transition-colors duration-200">
                          {movie.name}
                        </h3>
                        <p className="text-white/60 text-xs mt-0.5">
                          {movie.year || ''}
                        </p>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
