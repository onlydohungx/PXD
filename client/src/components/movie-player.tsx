import { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  Settings,
  Loader2
} from 'lucide-react';

interface MoviePlayerProps {
  title: string;
  sources: {
    src: string;
    type: string;
    quality: string;
  }[];
  subtitles?: {
    src: string;
    label: string;
    srclang: string;
  }[];
  poster?: string;
  slug: string;
}

export function MoviePlayer({ title, sources, subtitles = [], poster, slug }: MoviePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sourceUrl = useRef<string>(sources[0]?.src || "");

  // Xử lý sự kiện phát/tạm dừng video
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  // Xử lý sự kiện tắt/bật âm thanh
  const toggleMute = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Xử lý sự kiện toàn màn hình
  const toggleFullscreen = () => {
    try {
      if (!isFullscreen) {
        // Thử với container trước
        if (containerRef.current) {
          // Đảm bảo kiểm tra tất cả các phiên bản của API Fullscreen
          if (containerRef.current.requestFullscreen) {
            containerRef.current.requestFullscreen().catch(err => {

              tryVideoFullscreen();
            });
          } else if ((containerRef.current as any).webkitRequestFullscreen) {
            (containerRef.current as any).webkitRequestFullscreen();
          } else if ((containerRef.current as any).msRequestFullscreen) {
            (containerRef.current as any).msRequestFullscreen();
          } else if ((containerRef.current as any).mozRequestFullScreen) {
            (containerRef.current as any).mozRequestFullScreen();
          } else {
            // Nếu container không có phương thức fullscreen, thử với video element
            tryVideoFullscreen();
          }
        } else {
          // Nếu không có container, thử với video element
          tryVideoFullscreen();
        }
      } else {
        // Thoát chế độ toàn màn hình
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        }
      }
    } catch (error) {

    }
  };

  // Thử sử dụng video element để fullscreen nếu container không hoạt động
  const tryVideoFullscreen = () => {
    if (!videoRef.current) return;
    
    try {

      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen().catch(err => 

        );
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      } else if ((videoRef.current as any).msRequestFullscreen) {
        (videoRef.current as any).msRequestFullscreen();
      } else if ((videoRef.current as any).mozRequestFullScreen) {
        (videoRef.current as any).mozRequestFullScreen();
      } else {

      }
    } catch (error) {
    }
  };

  // Cập nhật thời gian và progress khi video đang chạy
  const updateProgress = () => {
    if (!videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    
    if (duration > 0) {
      const progressPercent = (currentTime / duration) * 100;
      setProgress(progressPercent);
      setCurrentTime(currentTime);
    }
  };

  // Xử lý khi user click vào thanh progress để tua video
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * videoRef.current.duration;
  };

  // Xử lý khi thay đổi âm lượng
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    
    const value = parseInt(e.target.value);
    videoRef.current.volume = value / 100;
    setVolume(value);
    
    if (value === 0) {
      setIsMuted(true);
      videoRef.current.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  };

  // Định dạng thời gian (giây -> mm:ss)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Tua nhanh/lùi video
  const seekVideo = (seconds: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime += seconds;
  };

  // Ẩn/hiện điều khiển
  const hideControls = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 3000);
  };

  // Hiện điều khiển khi di chuột
  const showControls = () => {
    setControlsVisible(true);
    hideControls();
  };
  
  // Hiện điều khiển khi tạm dừng
  useEffect(() => {
    if (!isPlaying) {
      setControlsVisible(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    } else {
      hideControls();
    }
  }, [isPlaying]);

  // Bắt sự kiện keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      // Kiểm tra xem người dùng có đang nhập text không
      const target = e.target as HTMLElement;
      const isInputElement = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.contentEditable === 'true' ||
                           target.getAttribute('contenteditable') === 'true';
      
      // Nếu đang nhập text thì không xử lý phím tắt
      if (isInputElement) return;
      
      switch (e.code) {
        case 'Space':
          togglePlay();
          e.preventDefault();
          break;
        case 'ArrowRight':
          seekVideo(10);
          e.preventDefault();
          break;
        case 'ArrowLeft':
          seekVideo(-10);
          e.preventDefault();
          break;
        case 'KeyM':
          toggleMute();
          e.preventDefault();
          break;
        case 'KeyF':
          toggleFullscreen();
          e.preventDefault();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, isMuted, isFullscreen]);

  // Bắt sự kiện fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement !== null ||
        (document as any).webkitFullscreenElement !== null ||
        (document as any).msFullscreenElement !== null ||
        (document as any).mozFullScreenElement !== null
      );
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Xử lý khi source mới được cung cấp
  useEffect(() => {
    // Kiểm tra sources hợp lệ để tránh lỗi
    if (!sources || sources.length === 0 || !sources[0]?.src) {
      return;
    }
    
    // Kiểm tra xem source có thay đổi không
    if (sources[0]?.src !== sourceUrl.current) {
      sourceUrl.current = sources[0].src;
      
      if (videoRef.current) {
        setIsBuffering(true); // Hiển thị trạng thái đang tải
        
        // Lưu trạng thái hiện tại
        const wasPlaying = !videoRef.current.paused;
        const currentVolume = videoRef.current.volume;
        const wasMuted = videoRef.current.muted;
        
        try {
          // Cập nhật video source bằng cách set src trực tiếp
          // Điều này đáng tin cậy hơn so với gọi load() mà không đợi
          videoRef.current.src = sources[0].src;
          
          // Khôi phục trạng thái
          videoRef.current.volume = currentVolume;
          videoRef.current.muted = wasMuted;
          
          // Sử dụng Promise.resolve để đảm bảo xử lý lỗi
          Promise.resolve().then(() => {
            if (wasPlaying && videoRef.current) {
              videoRef.current.play().catch(error => {
                // Không hiển thị lỗi cho người dùng
              });
            }
          });
        } catch (error) {
          setIsBuffering(false);
        }
      }
    }
  }, [sources]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-black overflow-hidden"
      onMouseMove={showControls}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        preload="auto"
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={updateProgress}
        onLoadedData={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
            setIsBuffering(false);
            // Chỉ tự động phát khi có nguồn hợp lệ
            if (sources.length > 0 && sources[0].src) {
              videoRef.current.play().catch(error => {
                // Không hiển thị lỗi này cho người dùng
              });
            }
          }
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onSeeking={() => setIsBuffering(true)}
        onSeeked={() => setIsBuffering(false)}
        onError={(e) => {
          setIsBuffering(false);
        }}
      >
        {/* Chỉ hiển thị source hợp lệ */}
        {sources && sources.length > 0 && sources.map((source, index) => (
          source && source.src ? (
            <source key={index} src={source.src} type={source.type || 'video/mp4'} />
          ) : null
        ))}
        
        {/* Chỉ hiển thị subtitle hợp lệ */}
        {subtitles && subtitles.length > 0 && subtitles.map((subtitle, index) => (
          subtitle && subtitle.src ? (
            <track
              key={index}
              src={subtitle.src}
              kind="subtitles"
              srcLang={subtitle.srclang || 'vi'}
              label={subtitle.label || 'Vietnamese'}
              default={index === 0}
            />
          ) : null
        ))}
        
        Trình duyệt của bạn không hỗ trợ tag video HTML5.
      </video>
      
      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-20">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      )}
      
      {/* Video Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent 
        p-2 transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Progress Bar */}
        <div 
          ref={progressRef}
          className="w-full h-2 bg-gray-600 cursor-pointer rounded-full mb-3"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-primary rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-primary rounded-full"></div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Play/Pause Button */}
            <button 
              onClick={togglePlay}
              className="text-white hover:text-primary transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>
            
            {/* Skip Backward */}
            <button 
              onClick={() => seekVideo(-10)}
              className="text-white hover:text-primary transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            
            {/* Skip Forward */}
            <button 
              onClick={() => seekVideo(10)}
              className="text-white hover:text-primary transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            
            {/* Volume Controls */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleMute}
                className="text-white hover:text-primary transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-24 h-1.5 rounded-lg accent-primary cursor-pointer hidden md:block"
              />
            </div>
            
            {/* Time Display */}
            <div className="text-white text-sm">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Settings Button */}
            <button className="text-white hover:text-primary transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            
            {/* Fullscreen Button */}
            <button 
              onClick={toggleFullscreen}
              className="text-white hover:text-primary transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
