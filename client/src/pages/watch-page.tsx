import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchMovieDetails, 
  addToWatchHistory, 
  addToFavorites, 
  removeFromFavorites, 
  checkFavoriteStatus,
  incrementMovieViewCount,
  getMovieViewCount,
  getWatchProgress,
  getWatchedEpisodes
} from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import VideoPlayer from '@/components/VideoPlayer';
import { EpisodeManager } from '@/components/episode-manager';
import { PlayerControls } from '@/components/player-controls';
import { CommentList } from '@/components/comments/comment-list';
import {
  Loader2, ArrowLeft, AlertCircle, Container, Film, Calendar, 
  Clock, Star, Info, ChevronRight, MessageCircle, User,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function WatchPage() {
  // URL params & navigation
  const { slug, episode } = useParams<{ slug: string; episode?: string }>();
  const [location, navigate] = useLocation();
  
  // States
  // Nếu URL có số tập, trừ đi 1 để chuyển từ hiển thị trên URL (bắt đầu từ 1) sang index (bắt đầu từ 0)
  const initialEpisodeIndex = episode ? Math.max(0, parseInt(episode, 10) - 1) : 0;
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(initialEpisodeIndex);
  const [currentServerIndex, setCurrentServerIndex] = useState(0);
  const [currentLanguageIndex, setCurrentLanguageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [watchedEpisodes, setWatchedEpisodes] = useState<number[]>([]);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [isEpisodeChanging, setIsEpisodeChanging] = useState(false);
  
  // Refs
  const playerRef = useRef<HTMLDivElement>(null);
  
  // Hooks
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

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

  // Check if movie is in favorites
  const { 
    data: favoriteData,
    isLoading: isFavoriteLoading,
  } = useQuery({
    queryKey: ['/api/favorites/check', slug],
    queryFn: () => checkFavoriteStatus(slug || ""),
    enabled: !!slug && isAuthenticated,
  });
  
  // Get watch progress for resuming playback
  const {
    data: watchProgressData,
    isLoading: isWatchProgressLoading
  } = useQuery({
    queryKey: ['/api/watch-progress', slug, currentEpisodeIndex],
    queryFn: () => getWatchProgress(slug || "", currentEpisodeIndex),
    enabled: !!slug && isAuthenticated
  });
  
  // Get watched episodes list for this movie
  const {
    data: watchedEpisodesData,
    isLoading: isWatchedEpisodesLoading
  } = useQuery({
    queryKey: ['/api/watched-episodes', slug],
    queryFn: () => getWatchedEpisodes(slug || ""),
    enabled: !!slug && isAuthenticated
  });
  
  // Update favorite status when data changes
  useEffect(() => {
    if (favoriteData) {
      setIsFavorite(favoriteData.isFavorite || false);
    }
  }, [favoriteData]);

  // Update watched episodes list when data changes
  useEffect(() => {
    if (watchedEpisodesData && watchedEpisodesData.status && watchedEpisodesData.episodes) {
      setWatchedEpisodes(watchedEpisodesData.episodes);
    }
  }, [watchedEpisodesData]);

  // State for tracking video playback progress
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [lastSavedTime, setLastSavedTime] = useState(0);
  
  // Ref để theo dõi xem mutation đang chạy không
  const isSavingRef = useRef(false);
  
  // Add to watch history mutation
  const updateHistoryMutation = useMutation({
    mutationFn: () => {
      // Đánh dấu đang trong quá trình lưu
      isSavingRef.current = true;
      
      // Cập nhật thời gian lưu cuối cùng
      setLastSavedTime(currentVideoTime);
      
      return addToWatchHistory(
        slug || "", 
        currentEpisodeIndex,
        currentVideoTime,
        videoDuration,
        videoProgress
      );
    },
    onSuccess: () => {
      // Hiển thị số tập bắt đầu từ 1 cho log
      console.log("Đã cập nhật lịch sử xem:", slug, "tập", currentEpisodeIndex + 1, "thời gian:", Math.floor(currentVideoTime), "s");
      
      // Add to watched episodes
      if (!watchedEpisodes.includes(currentEpisodeIndex)) {
        setWatchedEpisodes(prev => [...prev, currentEpisodeIndex]);
      }
      
      // Đã ẩn thông báo cập nhật lịch sử xem theo yêu cầu của người dùng
      // Chỉ ghi log nhưng không hiện thông báo toast
      
      // Cập nhật cache để các components khác cũng cập nhật
      queryClient.invalidateQueries({ queryKey: ['/api/watched-episodes', slug] });
      queryClient.invalidateQueries({ queryKey: ['/api/watch-history'] });
      
      // Đánh dấu đã lưu xong
      isSavingRef.current = false;
    },
    onError: (error: Error) => {
      console.error("Lỗi khi cập nhật lịch sử xem:", error);
      // Đánh dấu đã lưu xong (mặc dù bị lỗi)
      isSavingRef.current = false;
    }
  });

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: () => addToFavorites(slug || ""),
    onSuccess: () => {
      setIsFavorite(true);
      toast({
        title: "Đã thêm vào danh sách yêu thích",
        description: "Phim đã được thêm vào danh sách yêu thích của bạn",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites/check', slug] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể thêm phim vào danh sách yêu thích",
        variant: "destructive",
      });
    }
  });

  // Remove from favorites mutation
  const removeFromFavoritesMutation = useMutation({
    mutationFn: () => removeFromFavorites(slug || ""),
    onSuccess: () => {
      setIsFavorite(false);
      toast({
        title: "Đã xóa khỏi danh sách yêu thích",
        description: "Phim đã được xóa khỏi danh sách yêu thích của bạn",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites/check', slug] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa phim khỏi danh sách yêu thích",
        variant: "destructive",
      });
    }
  });
  
  // Increment movie view count mutation
  const incrementViewCountMutation = useMutation({
    mutationFn: () => incrementMovieViewCount(slug || ""),
    onSuccess: (data) => {
      console.log("Đã tăng lượt xem phim:", slug, "lượt xem hiện tại:", data.viewCount);
      // Invalidate trending movies query to update the list
      queryClient.invalidateQueries({ queryKey: ['/api/movies/trending'] });
    },
    onError: (error: Error) => {
      console.error("Lỗi khi tăng lượt xem phim:", error);
    }
  });

  // Check user authentication for watch page
  useEffect(() => {
    if (!isAuthenticated) {
      // show notification
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để xem phim",
        variant: "destructive",
      });
      
      // redirect to auth page
      const timer = setTimeout(() => {
        navigate(`/auth`);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate, toast]);

  // Update history after a delay when starting to watch
  useEffect(() => {
    if (movieData && isAuthenticated && slug) {
      const timer = setTimeout(() => {
        updateHistoryMutation.mutate();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [movieData, isAuthenticated, slug, currentEpisodeIndex]);
  
  // Save progress when user leaves the page
  useEffect(() => {
    // Create a function to save progress
    const saveProgress = () => {
      // Nếu đang lưu, bỏ qua để tránh lưu nhiều lần
      if (isSavingRef.current) {
        console.log("Đang lưu tiến trình, bỏ qua yêu cầu lưu mới");
        return;
      }
      
      if (isAuthenticated && slug && currentVideoTime > 10 && videoDuration > 0) {
        // Kiểm tra xem đã lưu gần đây chưa để tránh gọi API không cần thiết
        const timeSinceLastSave = Math.abs(currentVideoTime - lastSavedTime);
        
        // Chỉ lưu nếu:
        // - Chưa từng lưu (lastSavedTime = 0)
        // - Hoặc đã lưu nhưng hiện tại đã xem thêm ít nhất 15 giây
        if (lastSavedTime === 0 || timeSinceLastSave > 15) {
          console.log("Lưu tiến trình xem khi thoát:", Math.floor(currentVideoTime), "giây");
          // Để tránh nhiều lần gọi, thiết lập một biến cờ trên ref
          isSavingRef.current = true;
          updateHistoryMutation.mutate();
        } else {
          console.log("Bỏ qua lưu khi thoát - đã lưu gần đây");
        }
      }
    };
    
    // Chỉ thêm sự kiện beforeunload nếu trang đã được tải và đang phát
    let unloadHandler: (() => void) | null = null;
    
    if (videoDuration > 0 && currentVideoTime > 0) {
      unloadHandler = saveProgress;
      window.addEventListener('beforeunload', unloadHandler);
    }
    
    // Handle navigation within the app
    return () => {
      if (unloadHandler) {
        window.removeEventListener('beforeunload', unloadHandler);
      }
      
      // Chỉ lưu tiến trình khi rời khỏi trang nếu đang xem phim thật sự
      if (currentVideoTime > 10 && videoDuration > 0 && !isSavingRef.current) {
        saveProgress();
      }
    };
  }, [isAuthenticated, slug, currentVideoTime, videoDuration, videoProgress, lastSavedTime]);
  
  // Scroll to player and reload video when changing server or language
  useEffect(() => {
    if (playerRef.current) {
      // Scroll to player
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentServerIndex, currentLanguageIndex]);
  
  // Increment view count when user watches a movie
  useEffect(() => {
    if (movieData && isAuthenticated && slug) {
      // Increment view count after 10 seconds of viewing to avoid counting brief visits
      const timer = setTimeout(() => {
        incrementViewCountMutation.mutate();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [movieData, isAuthenticated, slug]);

  // Change episode handler
  const handleEpisodeChange = (episodeIndex: number) => {
    if (episodeIndex === currentEpisodeIndex) return;
    
    // Update watch history before changing with current progress
    if (currentVideoTime > 0 && videoDuration > 0) {
      // Kiểm tra xem đã lưu gần đây chưa để tránh gọi API không cần thiết
      const timeSinceLastSave = Math.abs(currentVideoTime - lastSavedTime);
      const significantProgress = timeSinceLastSave > 10; // Đã xem thêm ít nhất 10 giây
      
      // Chỉ cập nhật nếu có tiến độ xem đáng kể mới
      if (significantProgress) {
        console.log("Lưu tiến trình xem trước khi chuyển tập: ", Math.floor(currentVideoTime), "giây");
        // Gọi mutation đồng bộ để đảm bảo rằng nó được gọi trước khi chuyển tập
        updateHistoryMutation.mutate();
      }
    }
    
    // Hiện loading state
    setIsEpisodeChanging(true);
    
    // Reset trạng thái tiến trình
    setLastSavedTime(0);
    
    // Update state without page reload
    setCurrentEpisodeIndex(episodeIndex);
    
    // Reset video progress states for the new episode
    setCurrentVideoTime(0);
    setVideoDuration(0);
    setVideoProgress(0);
    
    // Update URL without page reload - Bắt đầu từ 1 thay vì 0 cho URL
    navigate(`/watch/${slug}/${episodeIndex + 1}`, {
      replace: true // Replace instead of push to avoid building up history
    });
    
    // Đảm bảo rằng loading state sẽ được loại bỏ sau khi video bắt đầu phát
    // Đây là một biện pháp phòng ngừa trong trường hợp video không tải được
    setTimeout(() => {
      setIsEpisodeChanging(false);
    }, 3000);
  };

  // Handle previous episode
  const handlePrevEpisode = () => {
    if (currentEpisodeIndex > 0) {
      handleEpisodeChange(currentEpisodeIndex - 1);
    }
  };

  // Handle next episode
  const handleNextEpisode = () => {
    const totalEpisodes = getEpisodeCount();
    if (currentEpisodeIndex < totalEpisodes - 1) {
      handleEpisodeChange(currentEpisodeIndex + 1);
    }
  };

  // Toggle favorite status
  const handleToggleFavorite = () => {
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

  // Share movie
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

  // Helper to get total episode count
  const getEpisodeCount = (): number => {
    if (!movieData || !movieData.episodes || !movieData.episodes[0]) {
      return 0;
    }
    
    // Lấy số tập dựa trên server_data của server đầu tiên
    return movieData.episodes[0].server_data?.length || 0;
  };

  // Helper to get current episode's server data
  const getCurrentEpisodeServer = () => {
    if (!movieData || !movieData.episodes || !movieData.episodes[currentLanguageIndex]) {
      return null;
    }
    
    const serverData = movieData.episodes[currentLanguageIndex].server_data;
    if (!serverData || serverData.length === 0 || !serverData[currentEpisodeIndex]) {
      return null;
    }
    
    return serverData[currentEpisodeIndex];
  };

  // Helper to get current server options
  const getServerOptions = () => {
    if (!movieData || !movieData.episodes || !movieData.episodes[currentLanguageIndex]) {
      return [];
    }
    
    const serverData = movieData.episodes[currentLanguageIndex].server_data;
    if (!serverData || serverData.length === 0) {
      return [];
    }
    
    return serverData.map((_: any, index: number) => ({
      name: `Server ${index + 1}`,
      index
    }));
  };

  // Helper to get language options
  const getLanguageOptions = () => {
    if (!movieData || !movieData.episodes) {
      return [];
    }
    
    return movieData.episodes.map((episode: any, index: number) => {
      // Phân tích tên server để biết là Vietsub hay Thuyết minh
      let name = "Server " + (index + 1);
      
      if (episode.server_name) {
        if (episode.server_name.includes("Vietsub")) {
          name = "Vietsub";
        } else if (episode.server_name.includes("Thuyết Minh")) {
          name = "Thuyết Minh";
        } else {
          name = episode.server_name;
        }
      }
      
      return {
        name,
        index
      };
    });
  };

  // Get player source
  const getPlayerSources = () => {
    const episodeServer = getCurrentEpisodeServer();
    if (!episodeServer || !episodeServer.link_m3u8) {
      return [];
    }
    
    return [
      {
        src: episodeServer.link_m3u8,
        type: "application/x-mpegURL",
        quality: "HD"
      }
    ];
  };

  // Show authentication required state
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-4 text-center">
          Yêu cầu đăng nhập
        </h1>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Vui lòng đăng nhập để có thể xem phim này. Bạn sẽ được chuyển đến trang đăng nhập.
        </p>
        <Button 
          onClick={() => navigate("/auth")} 
          variant="default"
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <User className="h-4 w-4 mr-2" />
          Đăng nhập ngay
        </Button>
      </div>
    );
  }
  
  // Show loading state
  if (isLoading || isEpisodeChanging) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[var(--player-pink)] to-[var(--player-blue)] blur-md opacity-70 animate-pulse"></div>
            <Loader2 className="h-12 w-12 animate-spin text-white relative z-10" />
          </div>
          <p className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-[var(--player-pink)] to-[var(--player-blue)] animate-pulse">
            {isEpisodeChanging ? 'Đang chuyển tập phim...' : 'Đang tải phim...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError || !movieData || !movieData.movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-500 mb-4">
          Không thể tải nguồn phát phim
        </h1>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          {error instanceof Error ? error.message : "Không tìm thấy nguồn phát phim hoặc phim không tồn tại"}
        </p>
        <Button
          onClick={() => navigate(`/movie/${slug}`)}
          variant="default"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại trang chi tiết
        </Button>
      </div>
    );
  }

  const { movie, episodes } = movieData;
  
  // Check if we have valid episode data
  if (!episodes || episodes.length === 0 || !episodes[0].server_data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-500 mb-4">
          Không tìm thấy tập phim
        </h1>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Phim này không có tập nào hoặc dữ liệu không hợp lệ
        </p>
        <Button
          onClick={() => navigate(`/movie/${slug}`)}
          variant="default"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại trang chi tiết
        </Button>
      </div>
    );
  }
  
  // Validate current episode index
  const totalEpisodes = getEpisodeCount();
  if (currentEpisodeIndex >= totalEpisodes) {
    setCurrentEpisodeIndex(0);
    return null; // prevent render until state is updated
  }
  
  // Get player sources
  const playerSources = getPlayerSources();
  
  // Check if we have valid player sources
  if (!playerSources || playerSources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-500 mb-4">
          Không tìm thấy nguồn phát
        </h1>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Không có link phát cho phim này. Vui lòng thử lại sau hoặc chọn một tập khác.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate(`/movie/${slug}`)}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại trang chi tiết
          </Button>
          <Button
            onClick={() => {
              // Tải lại dữ liệu phim bằng cách invalidate query
              queryClient.invalidateQueries({ queryKey: [`/api/watch/${slug}`] });
            }}
            variant="default"
          >
            <Loader2 className="h-4 w-4 mr-2" /> Tải lại dữ liệu
          </Button>
        </div>
      </div>
    );
  }

  // Get episode name - Bảo đảm hiển thị số tập bắt đầu từ 1
  const episodeServer = getCurrentEpisodeServer();
  // Nếu đã có tên tập từ server nhưng có chứa "Tập XX", thì thay thế bằng số tập thực tế
  let episodeName = '';
  if (episodeServer?.name) {
    if (episodeServer.name.includes("Tập")) {
      // Thay thế số trong "Tập XX" bằng số tập thực tế (currentEpisodeIndex + 1)
      episodeName = episodeServer.name.replace(/Tập\s+\d+/i, `Tập ${currentEpisodeIndex + 1}`);
    } else {
      episodeName = episodeServer.name;
    }
  } else {
    episodeName = `Tập ${currentEpisodeIndex + 1}`;
  }
  
  // Get episode title
  const episodeTitle = `${movie.name} - ${episodeName}`;
  
  // Get server options
  const serverOptions = getServerOptions();
  
  // Get language options
  const languageOptions = getLanguageOptions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/50 relative overflow-hidden">
      {/* Enhanced animated background for immersive experience */}
      <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.1) 0%, transparent 25%), 
                             radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 25%),
                             radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Enhanced Player Section with cinematic immersion */}
      <div ref={playerRef} className="relative w-full bg-gradient-to-b from-black to-slate-950/80">
        {/* Player Container - Enhanced cinematic mode */}
        <div className="w-full max-w-[1920px] aspect-video max-h-[calc(100vh-80px)] mx-auto shadow-2xl shadow-indigo-500/20 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none z-10 rounded-lg" />
          <VideoPlayer
            key={`${slug}-${currentEpisodeIndex}-${currentServerIndex}-${currentLanguageIndex}`}
            src={playerSources[0].src}
            title={episodeTitle}
            poster={movie.thumb_url || movie.poster_url}
            onBack={() => navigate(`/movie/${slug}`)}
            autoplay={true}
            startTime={watchProgressData?.data?.currentTime || 0}
            episodeInfo={{
              name: episodeName,
              index: currentEpisodeIndex,
              total: totalEpisodes
            }}
            onPrevEpisode={handlePrevEpisode}
            onNextEpisode={handleNextEpisode}
            onTimeUpdate={(currentTime: number, duration: number, progress: number) => {
              // Update states for tracking progress
              setCurrentVideoTime(currentTime);
              setVideoDuration(duration);
              setVideoProgress(progress);
              
              // Cập nhật tiến trình xem vào lịch sử với các điều kiện sau:
              if (currentTime > 0 && duration > 0 && currentTime > 10) {
                // Chỉ xử lý nếu không đang trong quá trình lưu
                if (!isSavingRef.current) {
                  // Tính khoảng cách thời gian kể từ lần lưu cuối cùng
                  const timeSinceLastSave = Math.abs(currentTime - lastSavedTime);
                  
                  // Chỉ lưu nếu thỏa mãn một trong các điều kiện sau:
                  // 1. Thời gian xem đã tăng thêm ít nhất 60 giây kể từ lần lưu cuối
                  // 2. Tiến trình xem đã đạt chính xác các mốc 25%, 50%, 75%, 90% của video
                  // 3. Người dùng đã xem gần hết video (progress > 95%)
                  const progressMilestones = [25, 50, 75, 90];
                  const isAtMilestone = progressMilestones.some(
                    milestone => 
                      Math.floor(progress) === milestone || 
                      (Math.floor(progress) === milestone - 1 && progress % 1 > 0.8)
                  );
                  
                  // Kiểm tra điều kiện lưu
                  const shouldSaveByTime = timeSinceLastSave >= 60;
                  const shouldSaveByMilestone = isAtMilestone && timeSinceLastSave > 5; // Tránh lưu lại quá nhanh khi đạt mốc
                  const isNearEnd = progress > 95 && timeSinceLastSave > 5;
                  
                  if (shouldSaveByTime || shouldSaveByMilestone || isNearEnd) {
                    console.log(`Lưu tại ${Math.floor(progress)}% tiến trình, thời gian từ lần lưu cuối: ${Math.floor(timeSinceLastSave)}s`);
                    updateHistoryMutation.mutate();
                  }
                }
              }
            }}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={isFavorite}
            onShare={handleShareMovie}
            serverOptions={serverOptions}
            currentServerIndex={currentServerIndex}
            onServerChange={setCurrentServerIndex}
            languageOptions={languageOptions}
            currentLanguageIndex={currentLanguageIndex}
            onLanguageChange={setCurrentLanguageIndex}
          />
        </div>
      </div>
      
      {/* Enhanced Breadcrumb with glass morphism design */}
      <div className="backdrop-blur-xl bg-gradient-to-r from-slate-900/80 via-slate-800/60 to-slate-900/80 border-b border-slate-700/30 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-[1800px] py-4 relative">
          <div className="flex items-center gap-3 text-sm md:text-base">
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => navigate("/")}
              className="p-0 h-auto text-indigo-400 hover:text-indigo-300 transition-all duration-300 font-medium hover:scale-105"
            >
              Trang chủ
            </Button>
            <ChevronRight size={16} className="text-slate-500" />
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => navigate(`/movie/${slug}`)}
              className="p-0 h-auto text-indigo-400 hover:text-indigo-300 transition-all duration-300 font-medium hover:scale-105 max-w-[200px] truncate"
            >
              {movie.name}
            </Button>
            <ChevronRight size={16} className="text-slate-500" />
            <span className="text-white font-semibold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
              {episodeName}
            </span>
          </div>
        </div>
      </div>
      
      {/* Content Section - Optimized layout */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-[1800px] py-6">
        {/* Title and Episode Info - Compact header */}
        <div className="bg-gradient-to-r from-slate-900/80 to-slate-800/60 rounded-xl backdrop-blur-md border border-slate-700/40 p-4 mb-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">
                {movie.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1 h-4 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full" />
                <span className="text-sm text-slate-200 font-medium">{episodeName}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 px-3 py-1 text-sm font-medium">
                <Film className="w-3 h-3 mr-1" />
                {currentEpisodeIndex + 1}/{totalEpisodes}
              </Badge>
              
              {movie.quality && (
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 px-3 py-1 text-sm font-medium">
                  {movie.quality}
                </Badge>
              )}
              
              {movie.year && (
                <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-600/50 px-3 py-1 text-sm">
                  {movie.year}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Player Controls and Episode Manager Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-3">
            {/* Player Controls - Compact */}
            <div className="bg-black/80 rounded-lg border border-white/10 p-3 mb-4">
              <PlayerControls
                movieName={movie.name}
                episodeIndex={currentEpisodeIndex}
                totalEpisodes={totalEpisodes}
                serverOptions={serverOptions}
                currentServerIndex={currentServerIndex}
                languageOptions={languageOptions}
                currentLanguageIndex={currentLanguageIndex}
                isFavorite={isFavorite}
                onPrevEpisode={handlePrevEpisode}
                onNextEpisode={handleNextEpisode}
                onServerChange={setCurrentServerIndex}
                onLanguageChange={setCurrentLanguageIndex}
                onToggleFavorite={handleToggleFavorite}
                onShare={handleShareMovie}
                onInfoClick={() => setIsInfoExpanded(!isInfoExpanded)}
                isAuthenticated={isAuthenticated}
                className="p-0"
              />
            </div>
            
            {/* Episode Manager */}
            <div className="bg-black/80 rounded-lg border border-white/10 p-3 mb-6">
              <h2 className="text-base font-bold text-white mb-2 flex items-center">
                <Film className="w-4 h-4 mr-2 text-primary" />
                Chọn tập
              </h2>
              <EpisodeManager
                episodes={episodes}
                currentEpisode={currentEpisodeIndex}
                onEpisodeChange={handleEpisodeChange}
                watchedEpisodes={watchedEpisodes}
                movieName={movie.name}
              />
            </div>
          </div>
        </div>

        {/* Comments Section - Full width like movie details page */}
        <div className="bg-black/80 rounded-lg border border-white/10 p-4 md:p-6">
          {/* Comments Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-full bg-gradient-to-br from-primary/30 to-secondary/20 backdrop-blur-sm border border-white/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
              Bình luận phim
            </h3>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-primary/50 via-white/10 to-transparent"></div>
          </div>

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
          
          {/* Comments List */}
          <CommentList movieSlug={slug || ""} />
        </div>
      </div>
    </div>
  );
}