import { useState, useRef, useEffect, useCallback } from "react";
import Hls from "hls.js";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, Check, RefreshCw,
  Monitor, Smartphone, Tv, Download, ExternalLink,
  AlertCircle, ChevronLeft, ChevronDown, Info, Heart, Share2, X,
  Lightbulb, Camera, Lock, Unlock, Eye, Flame
} from "lucide-react";
// Tính năng chuỗi xem phim đã bị gỡ bỏ
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { processVideoUrl, isM3U8Stream } from "@/lib/video-utils";

// Định nghĩa kiểu dữ liệu
export interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  quality?: {
    label: string;
    src: string;
  }[];
  subtitles?: {
    src: string;
    label: string;
    srclang: string;
  }[];
  onBack?: () => void;
  autoplay?: boolean;
  startTime?: number;
  episodeInfo?: {
    name: string;
    index: number;
    total: number;
  };
  onPrevEpisode?: () => void;
  onNextEpisode?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number, progress: number) => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  onShare?: () => void;
  serverOptions?: { name: string; index: number }[];
  currentServerIndex?: number;
  onServerChange?: (index: number) => void;
  languageOptions?: { name: string; index: number }[];
  currentLanguageIndex?: number;
  onLanguageChange?: (index: number) => void;
}

// Biến hằng số cho CSS
const PLAYER_PINK = "var(--player-pink, #ff4f9b)";
const PLAYER_BLUE = "var(--player-blue, #60a5fa)";
const PLAYER_GRADIENT = "linear-gradient(to right, #ff4f9b, #60a5fa)";

// Component VideoPlayer
export default function VideoPlayer({
  src,
  poster,
  title,
  quality = [],
  subtitles = [],
  onBack,
  autoplay = false,
  startTime = 0,
  episodeInfo,
  onPrevEpisode,
  onNextEpisode,
  onTimeUpdate,
  onToggleFavorite,
  isFavorite = false,
  onShare,
  serverOptions = [],
  currentServerIndex = 0,
  onServerChange,
  languageOptions = [],
  currentLanguageIndex = 0,
  onLanguageChange,
}: VideoPlayerProps) {
  // State để theo dõi việc video đã bắt đầu phát hay chưa (dùng cho chuỗi xem phim)
  const [videoStarted, setVideoStarted] = useState(false);
  // Tham chiếu đến phần tử
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // State quản lý UI
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // State cho chuỗi xem phim
  const [watchTimeForStreak, setWatchTimeForStreak] = useState(0);
  const [currentQualityIndex, setCurrentQualityIndex] = useState(0);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1); // -1 là không có phụ đề
  const [bufferedPercentage, setBufferedPercentage] = useState(0);
  const [isControlsLocked, setIsControlsLocked] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isWaitingForDoubleClick, setIsWaitingForDoubleClick] = useState(false);
  const [doubleClickTimer, setDoubleClickTimer] = useState<NodeJS.Timeout | null>(null);
  
  // State cho tính năng preview và chụp ảnh
  const [showPreview, setShowPreview] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [previewPosition, setPreviewPosition] = useState(0);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [screenshotTaken, setScreenshotTaken] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Phát hiện thiết bị
  const [isMobile, setIsMobile] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tv' | 'desktop'>('desktop');
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [doubleTapEnabled, setDoubleTapEnabled] = useState(true);
  const [showSkipMessage, setShowSkipMessage] = useState(false);
  const [skipMessageText, setSkipMessageText] = useState("");
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState("");
  const controlsTimeoutRef = useRef<any>(null);
  
  // Tùy chọn tốc độ phát
  const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  
  // Tạo preview khi di chuột qua thanh tiến trình
  const generatePreviewFrame = useCallback((seekTime: number) => {
    if (!videoRef.current || !previewCanvasRef.current || duration <= 0) return;
    
    try {
      const video = videoRef.current;
      const canvas = previewCanvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      // Lưu thời gian hiện tại
      const currentVideoTime = video.currentTime;
      
      // Tạm thời chuyển đến thời điểm cần preview
      video.currentTime = seekTime;
      
      // Vẽ frame hiện tại lên canvas sau khi video đã seeked
      const onSeeked = () => {
        // Thiết lập kích thước canvas
        canvas.width = video.videoWidth / 4; // Kích thước nhỏ hơn để tiết kiệm bộ nhớ
        canvas.height = video.videoHeight / 4;
        
        // Vẽ frame video lên canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Chuyển canvas thành URL dạng data:image
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setPreviewImageUrl(dataUrl);
        
        // Trở lại thời gian phát ban đầu
        video.currentTime = currentVideoTime;
        
        // Loại bỏ event listener
        video.removeEventListener('seeked', onSeeked);
      };
      
      // Lắng nghe sự kiện seeked để biết khi nào video đã chuyển đến frame cần thiết
      video.addEventListener('seeked', onSeeked, { once: true });
      
    } catch (error) {
      console.error('Lỗi khi tạo preview frame:', error);
    }
  }, [duration]);
  
  // Chức năng chụp ảnh màn hình
  const takeScreenshot = useCallback(() => {
    if (!videoRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (!context) return;
      
      // Vẽ frame hiện tại lên canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Thêm watermark
      context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      context.font = 'bold 24px Arial';
      const watermark = 'CineStream.vn';
      const textWidth = context.measureText(watermark).width;
      context.fillText(watermark, canvas.width - textWidth - 30, canvas.height - 30);
      
      // Thêm thông tin thời gian
      const minutes = Math.floor(currentTime / 60);
      const seconds = Math.floor(currentTime % 60).toString().padStart(2, '0');
      const timeStr = `${minutes}:${seconds}`;
      context.fillText(timeStr, 30, canvas.height - 30);
      
      // Thêm tên phim nếu có
      if (title) {
        context.font = 'bold 20px Arial';
        context.fillText(title, 30, 40);
      }
      
      // Chuyển canvas thành blob
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        // Tạo URL từ blob
        const url = URL.createObjectURL(blob);
        
        // Tạo thẻ a để tải về
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
        a.download = `${title ? title.replace(/[^\w\s-]/g, '_') : 'screenshot'}-${timestamp}.jpg`;
        a.href = url;
        a.style.display = 'none';
        document.body.appendChild(a);
        
        // Kích hoạt tải về
        a.click();
        
        // Dọn dẹp
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        // Hiển thị thông báo
        setScreenshotTaken(true);
        setTooltipMessage("Đã lưu ảnh chụp màn hình");
        setShowTooltip(true);
        
        setTimeout(() => {
          setScreenshotTaken(false);
          setShowTooltip(false);
        }, 2000);
      }, 'image/jpeg', 0.95);
      
    } catch (error) {
      console.error('Lỗi khi chụp ảnh màn hình:', error);
    }
  }, []);
  
  // ===== XỬ LÝ KHỞI TẠO =====
  
  // Phát hiện thiết bị khi mount
  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      setIsMobile(isMobileDevice);
      
      // Tự động phát hiện loại thiết bị
      if (isMobileDevice) {
        setDeviceType('mobile');
      } else if (
        /\bTV\b|Smart[-_]?TV|HbbTV|SmartTV|Roku|tvOS|WebOS|VIDAA|Tizen|CrKey|SamsungBrowser/.test(ua) ||
        (window.innerWidth > 1200 && window.innerHeight > 800 && window.innerWidth / window.innerHeight > 1.7)
      ) {
        setDeviceType('tv');
      } else {
        setDeviceType('desktop');
      }
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  
  // Khởi tạo video và thiết lập các sự kiện
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Xử lý sự kiện video
    const onLoadedMetadata = () => {
      setDuration(video.duration);
      setLoadError(false);
      
      // Thiết lập thời gian bắt đầu nếu có
      if (startTime > 0 && startTime < video.duration) {
        video.currentTime = startTime;
        setCurrentTime(startTime);
      }
      
      // Tự động phát nếu được yêu cầu
      if (autoplay) {
        video.play().catch((err) => {
          console.warn("Autoplay prevented by browser:", err);
        });
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Cập nhật thời gian xem cho chuỗi xem phim
      setWatchTimeForStreak(video.currentTime);
      
      // Gọi callback onTimeUpdate nếu có
      if (onTimeUpdate && video.duration > 0) {
        const progress = Math.round((video.currentTime / video.duration) * 100);
        onTimeUpdate(video.currentTime, video.duration, progress);
      }
      
      // Cập nhật buffer
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / video.duration) * 100;
        setBufferedPercentage(bufferedPercent);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      
      // Tự động chuyển tập tiếp theo nếu có
      if (onNextEpisode && episodeInfo && episodeInfo.index < episodeInfo.total) {
        setTimeout(() => {
          onNextEpisode();
        }, 1500);
      }
    };

    const onError = () => {
      setLoadError(true);
      setIsPlaying(false);
    };

    const onWaiting = () => {
      setIsBuffering(true);
    };

    const onPlaying = () => {
      setIsBuffering(false);
    };

    const onPlay = () => {
      setIsPlaying(true);
      
      // Khi video bắt đầu phát, cập nhật watchTimeForStreak để kích hoạt StreakHandler
      if (watchTimeForStreak === 0) {
        // Chỉ cần đặt một giá trị không phải 0 để đánh dấu là video đã bắt đầu phát
        setWatchTimeForStreak(0.1);
      }
    };

    const onPause = () => {
      setIsPlaying(false);
    };
    
    // Đăng ký các sự kiện
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    // Hàm dọn dẹp
    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [autoplay, startTime, onNextEpisode, episodeInfo, onTimeUpdate]);

  // Xử lý khi src thay đổi và cài đặt HLS
  useEffect(() => {
    // Thiết lập một instance HLS.js mới mỗi khi src thay đổi
    let hls: Hls | null = null;
    
    if (videoRef.current) {
      // KHÔNG reset current time để có thể tiếp tục xem từ vị trí cũ
      // setCurrentTime(0); - Đã remove để fix lỗi không resume được
      setBufferedPercentage(0);
      setIsBuffering(true);
      setLoadError(false);
      
      // Xử lý URL qua hệ thống lọc quảng cáo
      const processedSrc = processVideoUrl(src);
      console.log('Original URL:', src);
      console.log('Processed URL:', processedSrc);
      
      // Kiểm tra xem có phải là video HLS (.m3u8) không
      const isHlsSource = isM3U8Stream(src);
      
      // Nếu là HLS và trình duyệt hỗ trợ HLS.js
      if (isHlsSource && Hls.isSupported()) {
        try {
          // Tạo instance mới của Hls
          hls = new Hls({
            xhrSetup: (xhr) => {
              xhr.withCredentials = false; // Tắt credentials nếu cần thiết
            },
            // Cấu hình bổ sung để tối ưu hiệu suất
            maxBufferLength: 30,
            maxMaxBufferLength: 600,
            backBufferLength: 30,
            enableWorker: true,
            lowLatencyMode: false,
            startLevel: -1, // Tự động chọn chất lượng
            // Retry configs
            manifestLoadingMaxRetry: 5,
            manifestLoadingRetryDelay: 500,
            manifestLoadingMaxRetryTimeout: 30000,
            levelLoadingMaxRetry: 4,
            levelLoadingRetryDelay: 500,
            levelLoadingMaxRetryTimeout: 30000,
            fragLoadingMaxRetry: 6,
            fragLoadingRetryDelay: 500,
            fragLoadingMaxRetryTimeout: 60000
          });
          
          // Xóa instance cũ nếu có
          if ((videoRef.current as any).hlsPlayer) {
            ((videoRef.current as any).hlsPlayer as Hls).destroy();
            (videoRef.current as any).hlsPlayer = null;
          }
          
          // Đính kèm instance vào phần tử video
          hls.attachMedia(videoRef.current);
          
          // Lưu instance vào videoRef để truy cập sau này
          (videoRef.current as any).hlsPlayer = hls;
          
          // Đăng ký các events
          hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            console.log('HLS: Media attached, loading processed source');
            hls?.loadSource(processedSrc);
          });
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('HLS: Manifest parsed, found levels');
            
            // Thiết lập thời gian bắt đầu từ startTime parameter nếu có
            if (startTime > 0 && videoRef.current) {
              console.log(`Đặt thời gian bắt đầu tại: ${startTime} giây`);
              videoRef.current.currentTime = startTime;
              setCurrentTime(startTime);
            }
            
            if (autoplay) {
              videoRef.current?.play().catch((err) => {
                console.warn("Autoplay prevented by browser:", err);
              });
            }
          });
          
          hls.on(Hls.Events.ERROR, (event, data) => {
            console.log('HLS error:', data.type, data.details);
            
            if (data.fatal) {
              switch(data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error('HLS: Fatal network error, trying to recover');
                  hls?.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error('HLS: Fatal media error, trying to recover');
                  hls?.recoverMediaError();
                  break;
                default:
                  console.error('HLS: Fatal error, cannot recover:', data);
                  hls?.destroy();
                  setLoadError(true);
                  break;
              }
            }
          });
        } catch (error) {
          console.error('Error initializing HLS player:', error);
          setLoadError(true);
        }
      } else {
        // Sử dụng video HTML5 tiêu chuẩn cho các định dạng khác
        try {
          // Xóa HLS instance cũ nếu có
          if ((videoRef.current as any).hlsPlayer) {
            ((videoRef.current as any).hlsPlayer as Hls).destroy();
            (videoRef.current as any).hlsPlayer = null;
          }
          
          videoRef.current.src = processedSrc;
          videoRef.current.load();
          
          // Thiết lập thời gian bắt đầu cho non-HLS video sau khi load
          videoRef.current.onloadedmetadata = () => {
            if (startTime > 0 && videoRef.current) {
              console.log(`Đặt thời gian bắt đầu cho non-HLS video tại: ${startTime} giây`);
              videoRef.current.currentTime = startTime;
              setCurrentTime(startTime);
            }
          };
        } catch (error) {
          console.error('Error loading video source:', error);
          setLoadError(true);
        }
      }
    }
    
    // Clean up function
    return () => {
      // Hủy và dọn dẹp HLS instance khi component unmount hoặc src thay đổi
      if (hls) {
        console.log('Cleaning up HLS instance');
        hls.destroy();
      }
      
      // Xóa các tham chiếu
      if (videoRef.current && (videoRef.current as any).hlsPlayer) {
        ((videoRef.current as any).hlsPlayer as Hls).destroy();
        (videoRef.current as any).hlsPlayer = null;
      }
    };
  }, [src, autoplay, startTime]);
  
  // Xử lý khi startTime thay đổi sau khi video đã được tải (cho chức năng tiếp tục xem)
  useEffect(() => {
    if (videoRef.current && startTime > 0 && videoRef.current.duration > 0) {
      // Chỉ áp dụng startTime nếu video chưa được phát hoặc đang ở vị trí khác
      const currentVideoTime = videoRef.current.currentTime;
      const timeDifference = Math.abs(currentVideoTime - startTime);
      
      // Nếu thời gian hiện tại khác xa startTime (hơn 5 giây), thì cập nhật
      if (timeDifference > 5) {
        console.log(`Tiếp tục xem từ: ${Math.floor(startTime)} giây`);
        videoRef.current.currentTime = startTime;
        setCurrentTime(startTime);
      }
    }
  }, [startTime]);
  
  // Thiết lập tốc độ phát
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // ===== XỬ LÝ HIỆN/ẨN ĐIỀU KHIỂN =====
  
  // Ẩn điều khiển sau một thời gian không tương tác
  useEffect(() => {
    if (isControlsLocked) return;
    
    const hideControls = () => {
      if (isPlaying) {
        setShowControls(false);
      }
    };
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = window.setTimeout(hideControls, 3000);
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying, isControlsLocked]);
  
  // Hiện điều khiển khi di chuyển chuột hoặc chạm màn hình
  const handleMouseMove = useCallback(() => {
    if (!isControlsLocked) {
      setShowControls(true);
    }
  }, [isControlsLocked]);
  
  // Khóa điều khiển để không tự ẩn
  const toggleControlsLock = useCallback(() => {
    setIsControlsLocked(!isControlsLocked);
  }, [isControlsLocked]);

  // ===== ĐIỀU KHIỂN PHÍM =====
  
  // Hàm chuyển đổi chế độ chiếu rạp
  const toggleTheaterMode = useCallback(() => {
    setIsTheaterMode(prev => !prev);
  }, []);
  
  // Xử lý phím tắt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Kiểm tra xem người dùng có đang nhập text không
      const target = e.target as HTMLElement;
      const isInputElement = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.contentEditable === 'true' ||
                           target.getAttribute('contenteditable') === 'true';
      
      // Nếu đang nhập text thì không xử lý phím tắt
      if (isInputElement) return;
      
      if (e.key === " " || e.key === "k" || e.key === "K") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        skip(-10);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        skip(10);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        toggleTheaterMode();
      } else if (e.key === "Escape" && isFullscreen) {
        exitFullscreen();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const newVolume = Math.min(100, volume + 5);
        handleVolumeChange([newVolume]);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const newVolume = Math.max(0, volume - 5);
        handleVolumeChange([newVolume]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isFullscreen, volume, toggleTheaterMode]);
  
  // Theo dõi trạng thái toàn màn hình
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        Boolean(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        )
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);
  
  // ===== ĐIỀU KHIỂN CẢM ỨNG =====
  
  // Xử lý các sự kiện cảm ứng
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setTouchStartX(touch.clientX);
      setTouchStartY(touch.clientY);
      setIsSeeking(false);
      setShowControls(true);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;
    
    // Chỉ xử lý khi di chuyển ngang đủ lớn
    if (Math.abs(diffX) > 20 && Math.abs(diffX) > Math.abs(diffY) && !isSeeking) {
      setIsSeeking(true);
      setDoubleTapEnabled(false);
    }
    
    // Xử lý tua video
    if (isSeeking && videoRef.current) {
      const seekAmount = (diffX / videoContainerRef.current!.clientWidth) * videoRef.current.duration;
      const newTime = Math.max(0, Math.min(videoRef.current.duration, currentTime + seekAmount * 0.5));
      
      // Chỉ cập nhật UI, chưa cập nhật thời gian video thực sự
      setCurrentTime(newTime);
    }
    
    // Xử lý điều chỉnh âm lượng khi vuốt dọc (bên phải màn hình)
    if (!isSeeking && Math.abs(diffY) > 20 && Math.abs(diffY) > Math.abs(diffX) && touch.clientX > window.innerWidth * 0.7) {
      setShowVolumeSlider(true);
      const volumeChange = -(diffY / 100) * 20; // Điều chỉnh độ nhạy
      const newVolume = Math.max(0, Math.min(100, volume + volumeChange));
      handleVolumeChange([newVolume]);
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isSeeking && videoRef.current) {
      // Áp dụng thời gian mới cho video khi kết thúc vuốt
      videoRef.current.currentTime = currentTime;
      setIsSeeking(false);
    }
    
    // Hẹn giờ bật lại chức năng double tap
    setTimeout(() => {
      setDoubleTapEnabled(true);
    }, 300);
    
    // Ẩn thanh âm lượng sau một thời gian
    setTimeout(() => {
      setShowVolumeSlider(false);
    }, 2000);
  };

  // Xử lý double tap để tua
  const handleDoubleTap = (direction: 'left' | 'right') => {
    if (!doubleTapEnabled) return;
    
    const skipAmount = direction === 'left' ? -10 : 10;
    skip(skipAmount);
    
    // Hiển thị thông báo tua nhanh
    setSkipMessageText(`${skipAmount > 0 ? '+' : ''}${skipAmount}s`);
    setShowSkipMessage(true);
    setTimeout(() => setShowSkipMessage(false), 1000);
  };
  
  // ===== CÁC CHỨC NĂNG ĐIỀU KHIỂN =====
  
  // Phát/Tạm dừng
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((err) => {
        console.error("Error playing video:", err);
      });
    }
    
    // Hiển thị animation phát/dừng ở giữa màn hình
    setShowTooltip(true);
    setTooltipMessage(isPlaying ? "Tạm dừng" : "Phát");
    setTimeout(() => setShowTooltip(false), 800);
  };
  
  // Xử lý khi di chuột qua thanh tiến độ
  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current || duration <= 0) return;
    
    const progressRect = progressBarRef.current.getBoundingClientRect();
    const offsetX = e.clientX - progressRect.left;
    const percentage = Math.min(Math.max(offsetX / progressRect.width, 0), 1);
    const previewTimeValue = percentage * duration;
    
    // Hiển thị preview
    setShowPreview(true);
    setPreviewTime(previewTimeValue);
    setPreviewPosition(offsetX);
    
    // Tạo hình ảnh preview sau mỗi 500ms để tránh quá tải
    const debounceMs = 500;
    const now = Date.now();
    if (!previewImageUrl || now - (window as any).lastPreviewTime > debounceMs) {
      (window as any).lastPreviewTime = now;
      generatePreviewFrame(previewTimeValue);
    }
  };
  
  // Xử lý khi di chuột ra khỏi thanh tiến độ
  const handleProgressMouseLeave = () => {
    setShowPreview(false);
  };
  
  // Bật/Tắt âm thanh
  const toggleMute = () => {
    if (!videoRef.current) return;
    
    setIsMuted(!isMuted);
    videoRef.current.muted = !isMuted;
    saveSettings({muted: !isMuted});
  };
  
  // Điều chỉnh âm lượng
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
      
      if (newVolume === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
    
    saveSettings({volume: newVolume});
  };
  
  // Tua video
  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  // Xử lý click vào thanh tiến trình
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressBarRef.current;
    if (!progressBar || !videoRef.current) return;

    const rect = progressBar.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const newTime = position * videoRef.current.duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  // Xử lý kéo thanh tiến trình
  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressBarRef.current;
    if (!progressBar || !videoRef.current || !e.buttons) return;

    const rect = progressBar.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = position * videoRef.current.duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  // Format thời gian
  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    return [
      hours > 0 ? hours : null,
      minutes,
      seconds,
    ]
      .filter(Boolean)
      .map(unit => unit?.toString().padStart(2, '0'))
      .join(':');
  };
  
  // Thay đổi tốc độ phát
  const changePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    saveSettings({speed});
  };
  
  // Thay đổi chất lượng video
  const changeQuality = (index: number) => {
    if (quality.length === 0 || index === currentQualityIndex) return;
    
    const currentTime = videoRef.current?.currentTime || 0;
    const wasPlaying = isPlaying;
    
    setCurrentQualityIndex(index);
    
    // Lưu thời gian hiện tại và trạng thái phát
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        if (wasPlaying) {
          videoRef.current.play().catch(() => {});
        }
      }
    }, 100);
  };
  
  // Thay đổi phụ đề
  const changeSubtitle = (index: number) => {
    setCurrentSubtitleIndex(index);
    
    // Tắt tất cả phụ đề hiện tại
    if (videoRef.current) {
      for (let i = 0; i < videoRef.current.textTracks.length; i++) {
        videoRef.current.textTracks[i].mode = 'disabled';
      }
      
      // Bật phụ đề được chọn
      if (index >= 0 && index < videoRef.current.textTracks.length) {
        videoRef.current.textTracks[index].mode = 'showing';
      }
    }
  };
  
  // Thay đổi loại thiết bị (UI hint)
  const changeViewDevice = (device: 'mobile' | 'tv' | 'desktop') => {
    setDeviceType(device);
  };
  
  // ===== FULLSCREEN =====
  
  // Vào toàn màn hình
  const enterFullscreen = () => {
    try {
      // Lấy tham chiếu tới các phần tử
      const container = containerRef.current;
      const video = videoRef.current;
      
      if (!container || !video) return;
      
      // Xử lý đặc biệt cho thiết bị di động
      if (isMobile) {
        console.log("Entering fullscreen on mobile device");
        
        // Thử với video element trước vì nó hoạt động tốt hơn trên mobile
        if (video.requestFullscreen) {
          video.requestFullscreen().catch(err => {
            console.warn("Video fullscreen error, trying container:", err);
            tryContainerFullscreen();
          });
        } else if ((video as any).webkitRequestFullscreen) {
          (video as any).webkitRequestFullscreen();
        } else if ((video as any).webkitEnterFullscreen) {
          // Phương thức iOS đặc biệt
          (video as any).webkitEnterFullscreen();
        } else if ((video as any).mozRequestFullScreen) {
          (video as any).mozRequestFullScreen();
        } else {
          // Nếu không có phương thức video, thử container
          tryContainerFullscreen();
        }
        
        // Kích hoạt xoay ngang cho thiết bị di động
        if (screen.orientation && 'lock' in screen.orientation) {
          (screen.orientation as any).lock('landscape').catch((e: Error) => {
            console.warn('Failed to lock orientation:', e);
          });
        }
      } else {
        // Desktop - Sử dụng container để fullscreen
        tryContainerFullscreen();
      }
    } catch (error) {
      console.error("Error entering fullscreen:", error);
      // Cuối cùng thử với video element
      tryVideoFullscreen();
    }
  };
  
  // Thoát toàn màn hình
  const exitFullscreen = () => {
    try {
      // Kiểm tra phương thức thoát toàn màn hình
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      
      // Đặc biệt cho iOS
      const video = videoRef.current;
      if (isMobile && video && (video as any).webkitExitFullscreen) {
        (video as any).webkitExitFullscreen();
      }
      
      // Giải phóng khóa xoay cho thiết bị di động
      if (isMobile && screen.orientation && 'unlock' in screen.orientation) {
        try {
          (screen.orientation as any).unlock();
        } catch (e) {
          console.warn('Failed to unlock orientation:', e);
        }
      }
    } catch (error) {
      console.error("Error exiting fullscreen:", error);
    }
  };
  
  // Bật/tắt toàn màn hình
  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      // Nếu đang ở chế độ chiếu rạp, tắt nó khi vào chế độ toàn màn hình
      if (isTheaterMode) {
        setIsTheaterMode(false);
      }
      enterFullscreen();
    }
  };
  
  // Thử dùng container cho fullscreen
  const tryContainerFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    
    if (container.requestFullscreen) {
      container.requestFullscreen().catch(err => {
        console.error("Container fullscreen error:", err);
        tryVideoFullscreen();
      });
    } else if ((container as any).webkitRequestFullscreen) {
      (container as any).webkitRequestFullscreen();
    } else if ((container as any).mozRequestFullScreen) {
      (container as any).mozRequestFullScreen();
    } else if ((container as any).msRequestFullscreen) {
      (container as any).msRequestFullscreen();
    } else {
      console.warn("No fullscreen method available for container");
      tryVideoFullscreen();
    }
  };
  
  // Thử dùng video element cho fullscreen
  const tryVideoFullscreen = () => {
    try {
      const video = videoRef.current;
      if (!video) return;
      
      if (video.requestFullscreen) {
        video.requestFullscreen().catch(err => {
          console.error("Video fullscreen error:", err);
        });
      } else if ((video as any).webkitRequestFullscreen) {
        (video as any).webkitRequestFullscreen();
      } else if ((video as any).webkitEnterFullscreen) {
        (video as any).webkitEnterFullscreen();
      } else if ((video as any).mozRequestFullScreen) {
        (video as any).mozRequestFullScreen();
      } else if ((video as any).msRequestFullscreen) {
        (video as any).msRequestFullscreen();
      } else {
        console.log("Fullscreen API not supported by this browser");
      }
    } catch (error) {
      console.error("Failed to use video element for fullscreen:", error);
    }
  };
  
  // ===== LƯU CÀI ĐẶT =====
  
  // Tải cài đặt khi khởi tạo
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const settings = localStorage.getItem('video-player-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        
        // Áp dụng các cài đặt đã lưu
        if (parsed.volume !== undefined) {
          setVolume(parsed.volume);
          if (videoRef.current) videoRef.current.volume = parsed.volume / 100;
        }
        
        if (parsed.muted !== undefined) {
          setIsMuted(parsed.muted);
          if (videoRef.current) videoRef.current.muted = parsed.muted;
        }
        
        if (parsed.speed !== undefined) {
          setPlaybackSpeed(parsed.speed);
          if (videoRef.current) videoRef.current.playbackRate = parsed.speed;
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }, []);
  
  // Lưu cài đặt
  const saveSettings = (newSettings: {[key: string]: any}) => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    
    try {
      // Lấy cài đặt hiện tại
      let currentSettings = {};
      try {
        const currentSettingsStr = localStorage.getItem('video-player-settings');
        if (currentSettingsStr) {
          currentSettings = JSON.parse(currentSettingsStr);
        }
      } catch (e) {
        console.warn("Không thể đọc cài đặt hiện tại, tạo mới", e);
      }
      
      // Cập nhật cài đặt mới
      const updatedSettings = {...currentSettings, ...newSettings};
      localStorage.setItem('video-player-settings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };
  
  // ===== RENDER =====
  
  return (
    <div 
      ref={containerRef}
      className={`video-player relative w-full h-full bg-black overflow-hidden ${isTheaterMode ? 'theater-mode' : ''}`}
      onMouseMove={() => setShowControls(true)}
      onTouchStart={() => setShowControls(true)}
    >
      {/* Tính năng chuỗi xem phim đã bị gỡ bỏ */}
      
      {/* Video Container */}
      <div 
        ref={videoContainerRef}
        className="absolute inset-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={quality.length > 0 ? quality[currentQualityIndex].src : src}
          poster={poster}
          className="w-full h-full object-contain"
          onClick={togglePlay}
          onDoubleClick={toggleFullscreen}
          playsInline
          controls={false}
          webkit-playsinline="true"
          x5-playsinline="true"
          x5-video-player-type="h5"
          x5-video-player-fullscreen="true"
          x5-video-orientation="landscape"
        >
          {/* Phụ đề */}
          {subtitles.map((subtitle, index) => (
            <track 
              key={index}
              kind="subtitles"
              src={subtitle.src}
              srcLang={subtitle.srclang}
              label={subtitle.label}
              default={index === currentSubtitleIndex}
            />
          ))}
        </video>
      </div>

      {/* Mobile Controls - Nút chế độ chiếu rạp ẩn khi toàn màn hình */}
      {isMobile && (
        <>
          {/* Nút chế độ chiếu rạp - Ẩn khi ở chế độ toàn màn hình */}
          {!isFullscreen && (
            <button
              onClick={toggleTheaterMode}
              className="absolute bottom-[20%] right-[20%] z-30 p-3 rounded-full bg-gradient-to-r from-[#ff4f9b80] to-[#60a5fa80] shadow-lg border border-white/20"
              aria-label={isTheaterMode ? "Thoát chế độ chiếu rạp" : "Chế độ chiếu rạp"}
            >
              <Lightbulb className="w-6 h-6 text-white" strokeWidth={2} />
            </button>
          )}
          
          {/* Fullscreen Button for Mobile (always visible) */}
          <button
            onClick={toggleFullscreen}
            className="absolute bottom-[20%] right-[5%] z-30 p-3 rounded-full bg-gradient-to-r from-[#ff4f9b80] to-[#60a5fa80] shadow-lg border border-white/20"
            aria-label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          >
            {isFullscreen ? (
              <Minimize className="w-6 h-6 text-white" strokeWidth={2} />
            ) : (
              <Maximize className="w-6 h-6 text-white" strokeWidth={2} />
            )}
          </button>
        </>
      )}

      {/* Device Mode Indicator */}
      {showControls && (
        <div className="absolute top-4 right-4 z-20 p-1 px-2 rounded-md bg-gradient-to-r from-[#ff4f9b30] to-[#60a5fa30] backdrop-blur-sm text-white/80 border border-white/10 text-xs md:text-sm flex items-center">
          {deviceType === 'mobile' ? (
            <Smartphone className="w-3 h-3 mr-1" />
          ) : deviceType === 'tv' ? (
            <Tv className="w-3 h-3 mr-1" />
          ) : (
            <Monitor className="w-3 h-3 mr-1" />
          )}
          <span className="capitalize">{deviceType}</span>
        </div>
      )}
      
      {/* Skip Message Indicator */}
      {showSkipMessage && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 p-3 px-5 rounded-full bg-gradient-to-r from-[#ff4f9baa] to-[#60a5faaa] backdrop-blur-sm text-white font-bold text-xl border border-white/20 animate-pulse">
          {skipMessageText}
        </div>
      )}

      {/* Loading Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
          <div className="relative transition-transform animate-pulse">
            <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-[#ff4f9b] to-[#60a5fa] blur-xl opacity-60"></div>
            <div className="w-16 h-16 relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
              <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[#ff4f9b] animate-spin"></div>
              <div className="text-white text-xs font-medium">
                {Math.round((currentTime / (duration || 1)) * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/90 to-black/80 text-white backdrop-blur-sm z-30">
          <div className="w-16 h-16 mb-4 relative">
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse"></div>
            <AlertCircle className="w-16 h-16 text-red-500/80" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#ff4f9b] to-[#60a5fa]">
            Không thể phát video
          </h3>
          <p className="text-gray-300 text-center max-w-md mb-6 px-4">
            Có lỗi khi tải video. Vui lòng thử lại sau hoặc chọn một phiên bản khác.
          </p>
          <div className="flex flex-wrap gap-4 justify-center px-4">
            <button 
              onClick={() => {
                setLoadError(false);
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-[#ff4f9b] to-[#60a5fa] text-white rounded-md hover:opacity-90 transition-all duration-300 font-medium shadow-lg hover:shadow-[0_0_15px_rgba(255,79,155,0.5)] flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Thử lại
            </button>
            {onBack && (
              <button 
                onClick={onBack}
                className="px-5 py-2.5 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-md hover:opacity-90 border border-white/10 transition-all duration-300 flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Quay lại
              </button>
            )}
            {src && (
              <button
                onClick={() => window.open(quality.length > 0 ? quality[currentQualityIndex].src : src, '_blank')}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-md hover:opacity-90 border border-white/10 transition-all duration-300 flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Mở trực tiếp
              </button>
            )}
          </div>
        </div>
      )}

      {/* Touch Controls for Mobile - Double tap to skip */}
      <div 
        className="absolute inset-0 flex z-5" 
        onClick={(e) => {
          // Handle single click
          if (!isWaitingForDoubleClick) {
            setIsWaitingForDoubleClick(true);
            
            const timer = setTimeout(() => {
              setIsWaitingForDoubleClick(false);
              togglePlay(); // Single click action
            }, 250);
            
            setDoubleClickTimer(timer);
          }
        }}
        onDoubleClick={(e) => {
          // Clear the singleClick timer
          if (doubleClickTimer) clearTimeout(doubleClickTimer);
          setIsWaitingForDoubleClick(false);
          
          // Check which side was double-clicked
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const isLeftSide = clickX < rect.width / 2;
          
          if (isMobile) {
            // For mobile: double tap to seek
            handleDoubleTap(isLeftSide ? 'left' : 'right');
          } else {
            // For desktop: double click to fullscreen
            toggleFullscreen();
            
            // Hiển thị thông báo
            setTooltipMessage(isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình");
            setShowTooltip(true);
            setTimeout(() => setShowTooltip(false), 800);
          }
        }}
      >
        {/* On mobile, we divide the screen for left/right seeking */}
        {isMobile && (
          <>
            <div className="w-1/2 h-full" />
            <div className="w-1/2 h-full" />
          </>
        )}
      </div>

      {/* Back Button */}
      {onBack && showControls && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-20 p-2 rounded-full bg-gradient-to-r from-[#ff4f9b30] to-[#60a5fa30] backdrop-blur-sm text-white border border-white/10 hover:from-[#ff4f9b40] hover:to-[#60a5fa40] hover:scale-110 transition-all duration-300 shadow-lg"
          aria-label="Quay lại"
        >
          <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2} />
        </button>
      )}

      {/* Big Play/Pause Overlay Button */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10"
          aria-label={isPlaying ? "Tạm dừng" : "Phát"}
        >
          <div className="relative group">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#ff4f9b80] to-[#60a5fa80] blur-xl opacity-70 group-hover:opacity-90 transition-opacity duration-300"></div>
            <div className="rounded-full bg-black/50 p-5 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 relative z-10 border border-white/10">
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[#ff4f9b70] to-[#60a5fa70] blur-md opacity-70"></div>
              <Play className="w-12 h-12 md:w-16 md:h-16 text-white relative z-10" strokeWidth={1.5} />
            </div>
          </div>
        </button>
      )}

      {/* Episode Navigation Buttons (Previous/Next) */}
      {(onPrevEpisode || onNextEpisode) && episodeInfo && (
        <div className="absolute top-1/2 left-0 right-0 flex justify-between z-10 transform -translate-y-1/2 pointer-events-none">
          {onPrevEpisode && episodeInfo.index > 1 && (
            <button
              onClick={onPrevEpisode}
              className="p-2 ml-2 rounded-full bg-black/30 backdrop-blur-sm text-white border border-white/10 hover:bg-black/50 transition-all pointer-events-auto"
              aria-label="Tập trước"
            >
              <ChevronLeft className="w-8 h-8" strokeWidth={1.5} />
            </button>
          )}
          {onNextEpisode && episodeInfo.index < episodeInfo.total && (
            <button
              onClick={onNextEpisode}
              className="p-2 mr-2 rounded-full bg-black/30 backdrop-blur-sm text-white border border-white/10 hover:bg-black/50 transition-all pointer-events-auto"
              aria-label="Tập sau"
            >
              <ChevronLeft className="w-8 h-8 rotate-180" strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}

      {/* Volume Slider for Mobile */}
      {isMobile && showVolumeSlider && (
        <div className="absolute right-12 top-1/2 transform -translate-y-1/2 z-20 h-40 p-2 rounded-lg bg-black/70 backdrop-blur-md flex flex-col items-center">
          <span className="text-white text-xs mb-2">{volume}%</span>
          <div className="h-24 flex items-center">
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              orientation="vertical"
              className="h-full w-2"
            />
          </div>
          <button
            onClick={toggleMute}
            className="mt-2 p-1 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* Info Panel */}
      {showInfoPanel && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-gray-900/90 p-6 rounded-xl border border-white/10 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff4f9b] to-[#60a5fa]">
                Thông tin video
              </h3>
              <button 
                onClick={() => setShowInfoPanel(false)}
                className="p-1 text-white/70 hover:text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 text-white">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="col-span-1 text-white/60">Tiêu đề:</div>
                <div className="col-span-2 font-medium">{title || 'Không có tiêu đề'}</div>
              </div>
              
              {episodeInfo && (
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="col-span-1 text-white/60">Tập:</div>
                  <div className="col-span-2 font-medium">
                    {episodeInfo.name || `${episodeInfo.index}/${episodeInfo.total}`}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="col-span-1 text-white/60">Độ phân giải:</div>
                <div className="col-span-2 font-medium">
                  {quality.length > 0 
                    ? quality[currentQualityIndex].label 
                    : 'Mặc định'}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="col-span-1 text-white/60">Phụ đề:</div>
                <div className="col-span-2 font-medium">
                  {currentSubtitleIndex >= 0 && subtitles.length > 0
                    ? subtitles[currentSubtitleIndex].label
                    : 'Không có phụ đề'}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="col-span-1 text-white/60">Thời lượng:</div>
                <div className="col-span-2 font-medium">{formatTime(duration)}</div>
              </div>
              
              {serverOptions.length > 0 && (
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="col-span-1 text-white/60">Server:</div>
                  <div className="col-span-2 font-medium">
                    {serverOptions[currentServerIndex].name}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInfoPanel(false)}
                className="px-4 py-2 bg-gradient-to-r from-[#ff4f9b] to-[#60a5fa] text-white rounded-md hover:opacity-90 transition-all duration-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ease-in-out z-20
          ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        {/* Compact Title Bar - Moved to top for better visibility */}
        {title && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 via-black/60 to-transparent px-2 py-1.5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff4f9b] to-[#60a5fa] font-medium text-sm md:text-base truncate">
                  {title}
                </h3>
                {episodeInfo && (
                  <p className="text-white/60 text-xs mt-0.5">
                    {episodeInfo.name || `Tập ${episodeInfo.index}/${episodeInfo.total}`}
                  </p>
                )}
              </div>
              
              {/* Compact Top Right Controls */}
              <div className="flex items-center space-x-1 ml-2">
                {onToggleFavorite && (
                  <button
                    onClick={onToggleFavorite}
                    className={`p-1 rounded transition-colors ${isFavorite ? 'text-red-500 hover:text-red-400' : 'text-white/70 hover:text-white'}`}
                  >
                    <Heart className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                )}
                
                {onShare && (
                  <button
                    onClick={onShare}
                    className="p-1 text-white/70 hover:text-white rounded transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => setShowInfoPanel(true)}
                  className="p-1 text-white/70 hover:text-white rounded transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 text-white/70 hover:text-white rounded transition-colors">
                      {deviceType === 'mobile' ? (
                        <Smartphone className="w-4 h-4" />
                      ) : deviceType === 'tv' ? (
                        <Tv className="w-4 h-4" />
                      ) : (
                        <Monitor className="w-4 h-4" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="end" className="w-40 bg-black/90 border-white/10 backdrop-blur-md text-white">
                    <DropdownMenuItem 
                      onClick={() => changeViewDevice('mobile')} 
                      className="flex items-center cursor-pointer hover:bg-white/10 text-xs"
                    >
                      <Smartphone className="w-3 h-3 mr-2" />
                      <span>Mobile</span>
                      {deviceType === 'mobile' && <Check className="w-3 h-3 ml-auto" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => changeViewDevice('desktop')} 
                      className="flex items-center cursor-pointer hover:bg-white/10 text-xs"
                    >
                      <Monitor className="w-3 h-3 mr-2" />
                      <span>Desktop</span>
                      {deviceType === 'desktop' && <Check className="w-3 h-3 ml-auto" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => changeViewDevice('tv')} 
                      className="flex items-center cursor-pointer hover:bg-white/10 text-xs"
                    >
                      <Tv className="w-3 h-3 mr-2" />
                      <span>TV</span>
                      {deviceType === 'tv' && <Check className="w-3 h-3 ml-auto" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )}

        {/* Compact Controls Container */}
        <div className="bg-gradient-to-t from-black/95 via-black/80 to-transparent p-1 md:p-2 backdrop-blur-md">
          {/* Progress Bar - Moved to top for better visibility */}
          <div 
            ref={progressBarRef}
            className="relative mb-1 px-0.5 touch-none group cursor-pointer"
            onClick={handleProgressBarClick}
            onMouseMove={handleProgressDrag}
          >
            {/* Background */}
            <div className="absolute left-0 top-0 h-0.5 md:h-1 bg-white/10 rounded-full w-full"></div>
            
            {/* Buffered Progress */}
            <div 
              className="absolute left-0 top-0 h-0.5 md:h-1 bg-white/20 rounded-full transition-all"
              style={{ width: `${bufferedPercentage}%` }}
            ></div>
            
            {/* Actual Progress */}
            <div className="relative w-full h-0.5 md:h-1 bg-transparent rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full rounded-full transition-all group-hover:h-[4px]"
                style={{ 
                  width: `${(currentTime / (duration || 1)) * 100}%`,
                  background: "linear-gradient(to right, #ff4f9b, #60a5fa)" 
                }}
              ></div>
              
              {/* Progress Thumb */}
              <div 
                className="absolute h-2 w-2 md:h-3 md:w-3 rounded-full bg-white transform -translate-y-1/2 top-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ 
                  left: `calc(${(currentTime / (duration || 1)) * 100}% - 4px)`,
                  boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.1)" 
                }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#ff4f9b] to-[#60a5fa]"></div>
              </div>
            </div>
            
            {/* Time Tooltip on Hover */}
            <div 
              className="absolute -top-6 px-1.5 py-0.5 rounded bg-black/90 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ 
                left: `calc(${(currentTime / (duration || 1)) * 100}% - 15px)`,
                transform: "translateX(-50%)"
              }}
            >
              {formatTime(currentTime)}
            </div>
          </div>

          {/* Compact Control Buttons */}
          <div className="flex items-center justify-between text-white gap-0.5 px-0.5">
            {/* Left Controls */}
            <div className="flex items-center space-x-0.5">
              {/* Play/Pause Button */}
              <button 
                onClick={togglePlay}
                className="focus:outline-none hover:text-[#ff4f9b] transition-colors duration-200 p-0.5"
                aria-label={isPlaying ? "Tạm dừng" : "Phát"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>

              {/* Skip Buttons */}
              <button 
                onClick={() => skip(-10)}
                className="focus:outline-none hover:text-[#60a5fa] transition-colors duration-200 p-0.5"
                aria-label="Tua lại 10 giây"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button 
                onClick={() => skip(10)}
                className="focus:outline-none hover:text-[#60a5fa] transition-colors duration-200 p-0.5"
                aria-label="Tua đi 10 giây"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              {/* Volume Control - Simplified */}
              <button 
                onClick={toggleMute}
                className="focus:outline-none hover:text-[#ff4f9b] transition-colors duration-200 p-0.5"
                aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Volume Slider - Desktop only */}
              <div className="hidden md:flex w-12">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="h-0.5"
                />
              </div>

              {/* Time Display - Compact */}
              <div className="text-xs text-white/90 ml-1">
                {formatTime(currentTime)}<span className="text-white/50">/{formatTime(duration)}</span>
              </div>
            </div>

            {/* Compact Right Controls */}
            <div className="flex items-center space-x-1">
              {/* Episode Controls - Visible when available */}
              {(onPrevEpisode || onNextEpisode) && episodeInfo && (
                <div className="flex items-center gap-0.5 rounded-full bg-black/20 px-1 py-0.5 mr-1">
                  {onPrevEpisode && episodeInfo.index > 1 && (
                    <button
                      onClick={onPrevEpisode}
                      className="p-0.5 rounded-full text-white hover:bg-white/10 transition-colors"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  )}
                  
                  <span className="text-white/90 text-xs px-1">
                    {episodeInfo.index}/{episodeInfo.total}
                  </span>
                  
                  {onNextEpisode && episodeInfo.index < episodeInfo.total && (
                    <button
                      onClick={onNextEpisode}
                      className="p-0.5 rounded-full text-white hover:bg-white/10 transition-colors"
                    >
                      <ChevronLeft className="w-3 h-3 rotate-180" />
                    </button>
                  )}
                </div>
              )}

              {/* Server/Language Selection - Compact */}
              {((serverOptions.length > 0 && onServerChange) || (languageOptions.length > 0 && onLanguageChange)) && (
                <div className="flex items-center gap-1 text-xs">
                  {serverOptions.length > 0 && onServerChange && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="px-1.5 py-0.5 bg-gradient-to-r from-[#ff4f9b] to-[#60a5fa] text-white text-xs rounded hover:opacity-90 transition-all duration-300">
                          S{currentServerIndex + 1}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        side="top" 
                        align="end" 
                        className="w-32 bg-black/90 border-white/10 backdrop-blur-md text-white max-h-40 overflow-y-auto"
                      >
                        {serverOptions.map((server, index) => (
                          <DropdownMenuItem
                            key={index}
                            onClick={() => onServerChange(server.index)}
                            className={`text-xs cursor-pointer hover:bg-white/10 ${
                              currentServerIndex === server.index ? 'bg-white/20 text-[#ff4f9b]' : ''
                            }`}
                          >
                            {server.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  
                  {languageOptions.length > 0 && onLanguageChange && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="px-1.5 py-0.5 bg-gradient-to-r from-[#ff4f9b] to-[#60a5fa] text-white text-xs rounded hover:opacity-90 transition-all duration-300">
                          {languageOptions[currentLanguageIndex]?.name?.slice(0, 2) || 'VN'}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        side="top" 
                        align="end" 
                        className="w-32 bg-black/90 border-white/10 backdrop-blur-md text-white max-h-40 overflow-y-auto"
                      >
                        {languageOptions.map((lang, index) => (
                          <DropdownMenuItem
                            key={index}
                            onClick={() => onLanguageChange(lang.index)}
                            className={`text-xs cursor-pointer hover:bg-white/10 ${
                              currentLanguageIndex === lang.index ? 'bg-white/20 text-[#ff4f9b]' : ''
                            }`}
                          >
                            {lang.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}

              {/* Playback Speed - Compact */}
              <button 
                onClick={() => {
                  const currentIndex = playbackSpeeds.indexOf(playbackSpeed);
                  const nextIndex = (currentIndex + 1) % playbackSpeeds.length;
                  changePlaybackSpeed(playbackSpeeds[nextIndex]);
                }}
                className={`text-xs px-1 py-0.5 rounded hover:bg-white/10 transition-colors duration-200 ${
                  playbackSpeed !== 1 ? 'text-[#ff4f9b]' : 'text-white/80'
                }`}
              >
                {playbackSpeed}x
              </button>

              {/* Fullscreen Button */}
              <button 
                onClick={toggleFullscreen}
                className="focus:outline-none hover:text-[#ff4f9b] transition-colors duration-200 p-0.5"
                aria-label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>

              {/* Settings Menu - Compact */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus:outline-none hover:text-[#ff4f9b] transition-colors duration-200 p-0.5">
                    <Settings className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-40 p-2 bg-black/90 backdrop-blur-md border-white/10 text-white"
                >
                  {/* Quality Selection for Mobile */}
                  {quality.length > 0 && (
                    <>
                      <div className="px-2 py-1.5">
                        <p className="text-xs text-white/60 mb-1.5">Chất lượng</p>
                        <div className="grid grid-cols-2 gap-1">
                          {quality.map((q, index) => (
                            <button
                              key={index}
                              onClick={() => changeQuality(index)}
                              className={`text-xs px-2 py-1 rounded-sm transition-colors flex items-center justify-between
                                ${currentQualityIndex === index 
                                  ? 'bg-gradient-to-r from-[#ff4f9b] to-[#60a5fa] text-white' 
                                  : 'bg-white/10 hover:bg-white/20 text-white/80'
                                }`}
                            >
                              <span>{q.label}</span>
                              {currentQualityIndex === index && <Check className="w-3 h-3 ml-1" />}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <DropdownMenuSeparator className="my-2 bg-white/10" />
                    </>
                  )}
                  
                  {/* Subtitle Selection for Mobile */}
                  {subtitles.length > 0 && (
                    <>
                      <div className="px-2 py-1.5">
                        <p className="text-xs text-white/60 mb-1.5">Phụ đề</p>
                        <div className="grid grid-cols-1 gap-1">
                          <button
                            onClick={() => changeSubtitle(-1)}
                            className={`text-xs px-2 py-1 rounded-sm transition-colors flex items-center justify-between
                              ${currentSubtitleIndex === -1 
                                ? 'bg-gradient-to-r from-[#ff4f9b] to-[#60a5fa] text-white' 
                                : 'bg-white/10 hover:bg-white/20 text-white/80'
                              }`}
                          >
                            <span>Tắt</span>
                            {currentSubtitleIndex === -1 && <Check className="w-3 h-3 ml-1" />}
                          </button>
                          
                          {subtitles.map((subtitle, index) => (
                            <button
                              key={index}
                              onClick={() => changeSubtitle(index)}
                              className={`text-xs px-2 py-1 rounded-sm transition-colors flex items-center justify-between
                                ${currentSubtitleIndex === index 
                                  ? 'bg-gradient-to-r from-[#ff4f9b] to-[#60a5fa] text-white' 
                                  : 'bg-white/10 hover:bg-white/20 text-white/80'
                                }`}
                            >
                              <span>{subtitle.label}</span>
                              {currentSubtitleIndex === index && <Check className="w-3 h-3 ml-1" />}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <DropdownMenuSeparator className="my-2 bg-white/10" />
                    </>
                  )}
                  
                  {/* Playback Speed for Mobile */}
                  <div className="px-2 py-1.5">
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-xs text-white/60">Tốc độ phát</p>
                      <button 
                        onClick={() => changePlaybackSpeed(1)}
                        className="text-xs text-[#ff4f9b] hover:underline"
                      >
                        Reset
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {playbackSpeeds.map(speed => (
                        <button
                          key={speed}
                          onClick={() => changePlaybackSpeed(speed)}
                          className={`text-xs px-2 py-1 rounded-sm transition-colors
                            ${playbackSpeed === speed 
                              ? 'bg-gradient-to-r from-[#ff4f9b] to-[#60a5fa] text-white' 
                              : 'bg-white/10 hover:bg-white/20 text-white/80'
                            }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <DropdownMenuSeparator className="my-2 bg-white/10" />
                  
                  {/* Device Mode Selection */}
                  <div className="px-2 py-1.5">
                    <p className="text-xs text-white/60 mb-1.5">Chế độ hiển thị</p>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => changeViewDevice('mobile')}
                        className={`flex flex-col items-center justify-center text-xs p-2 rounded-sm transition-colors
                          ${deviceType === 'mobile'
                            ? 'bg-gradient-to-r from-[#ff4f9b] to-[#60a5fa] text-white' 
                            : 'bg-white/10 hover:bg-white/20 text-white/80'
                          }`}
                      >
                        <Smartphone className="w-4 h-4 mb-1" />
                        <span>Mobile</span>
                      </button>
                      <button
                        onClick={() => changeViewDevice('desktop')}
                        className={`flex flex-col items-center justify-center text-xs p-2 rounded-sm transition-colors
                          ${deviceType === 'desktop' 
                            ? 'bg-gradient-to-r from-[#ff4f9b] to-[#60a5fa] text-white' 
                            : 'bg-white/10 hover:bg-white/20 text-white/80'
                          }`}
                      >
                        <Monitor className="w-4 h-4 mb-1" />
                        <span>Desktop</span>
                      </button>
                      <button
                        onClick={() => changeViewDevice('tv')}
                        className={`flex flex-col items-center justify-center text-xs p-2 rounded-sm transition-colors
                          ${deviceType === 'tv' 
                            ? 'bg-gradient-to-r from-[#ff4f9b] to-[#60a5fa] text-white' 
                            : 'bg-white/10 hover:bg-white/20 text-white/80'
                          }`}
                      >
                        <Tv className="w-4 h-4 mb-1" />
                        <span>TV</span>
                      </button>
                    </div>
                  </div>
                  
                  <DropdownMenuSeparator className="my-2 bg-white/10" />
                  
                  {/* External Actions */}
                  <div className="px-2 py-1.5">
                    <p className="text-xs text-white/60 mb-1.5">Hành động</p>
                    <div className="space-y-1">
                      <button
                        onClick={() => window.open(quality.length > 0 ? quality[currentQualityIndex].src : src, '_blank')}
                        className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-white/10 rounded-sm transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-2 text-white/60" />
                        <span>Mở trực tiếp</span>
                      </button>
                      <button
                        onClick={() => {
                          // Create a temporary link to download the video
                          const downloadLink = document.createElement('a');
                          downloadLink.href = quality.length > 0 ? quality[currentQualityIndex].src : src;
                          downloadLink.download = title || 'video';
                          document.body.appendChild(downloadLink);
                          downloadLink.click();
                          document.body.removeChild(downloadLink);
                        }}
                        className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-white/10 rounded-sm transition-colors"
                      >
                        <Download className="w-4 h-4 mr-2 text-white/60" />
                        <span>Tải xuống</span>
                      </button>
                      {onBack && (
                        <button
                          onClick={onBack}
                          className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-white/10 rounded-sm transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4 mr-2 text-white/60" />
                          <span>Quay lại</span>
                        </button>
                      )}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theater Mode Button - Ẩn khi ở chế độ toàn màn hình */}
              {!isFullscreen && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className="focus:outline-none hover:text-[#ff4f9b] transition-colors duration-200 p-1.5 relative group"
                        onClick={toggleTheaterMode}
                        aria-label={isTheaterMode ? "Thoát chế độ chiếu rạp" : "Chế độ chiếu rạp"}
                      >
                        <div className="absolute -inset-1 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Lightbulb className={`w-5 h-5 relative ${isTheaterMode ? 'text-[#ff4f9b]' : ''}`} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black/90 text-white border-white/10">
                      <p>{isTheaterMode ? "Thoát chế độ chiếu rạp (T)" : "Chế độ chiếu rạp (T)"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Fullscreen Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className="focus:outline-none hover:text-[#ff4f9b] transition-colors duration-200 p-1.5 relative group"
                      onClick={toggleFullscreen}
                      aria-label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                    >
                      <div className="absolute -inset-1 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {isFullscreen ? (
                        <Minimize className="w-5 h-5 relative" />
                      ) : (
                        <Maximize className="w-5 h-5 relative" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-black/90 text-white border-white/10">
                    <p>{isFullscreen ? "Thoát toàn màn hình (F)" : "Toàn màn hình (F)"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}