import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, ChevronRight, Heart, Share2,
  Volume2, Info, Server, Check, Download,
  ExternalLink, Maximize
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ServerOption {
  name: string;
  index: number;
}

interface PlayerControlsProps {
  movieName: string;
  episodeIndex: number;
  totalEpisodes: number;
  serverOptions?: ServerOption[];
  currentServerIndex?: number;
  languageOptions?: { name: string; index: number }[];
  currentLanguageIndex?: number;
  isFavorite?: boolean;
  onPrevEpisode: () => void;
  onNextEpisode: () => void;
  onServerChange?: (index: number) => void;
  onLanguageChange?: (index: number) => void;
  onToggleFavorite?: () => void;
  onShare?: () => void;
  onInfoClick?: () => void;
  isAuthenticated?: boolean;
  className?: string;
}

export function PlayerControls({
  movieName,
  episodeIndex,
  totalEpisodes,
  serverOptions = [],
  currentServerIndex = 0,
  languageOptions = [],
  currentLanguageIndex = 0,
  isFavorite = false,
  onPrevEpisode,
  onNextEpisode,
  onServerChange,
  onLanguageChange,
  onToggleFavorite,
  onShare,
  onInfoClick,
  isAuthenticated = false,
  className
}: PlayerControlsProps) {
  return (
    <div className={cn("w-full flex flex-wrap items-center justify-between gap-3 py-2", className)}>
      <div className="flex items-center gap-3">
        {/* Controls của tập phim - Tối ưu cho desktop */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevEpisode}
            disabled={episodeIndex <= 0}
            title="Tập trước"
            className="h-9 px-2.5 md:px-3 bg-black/40 hover:bg-black/60 border-white/10"
          >
            <ChevronLeft size={16} className="md:mr-1" />
            <span className="hidden md:inline">Tập trước</span>
          </Button>
          
          <Badge variant="secondary" className="px-3 py-1.5 text-sm md:text-base h-9 flex items-center">
            Tập {episodeIndex + 1}/{totalEpisodes}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onNextEpisode}
            disabled={episodeIndex >= totalEpisodes - 1}
            title="Tập tiếp theo"
            className="h-9 px-2.5 md:px-3 bg-black/40 hover:bg-black/60 border-white/10"
          >
            <span className="hidden md:inline">Tập tiếp</span>
            <ChevronRight size={16} className="md:ml-1" />
          </Button>
        </div>
        
        {/* Tên phim - Hiển thị trên desktop */}
        <Badge 
          variant="outline" 
          className="hidden md:flex px-3 py-1.5 max-w-[400px] bg-black/40 border-white/10 text-white h-9 items-center font-medium"
        >
          {movieName}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {/* Ngôn ngữ - Vietsub/Thuyết minh */}
        {languageOptions.length > 0 && onLanguageChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 px-3 h-9 bg-black/40 hover:bg-black/60 border-white/10"
              >
                <Volume2 size={16} />
                <span className="hidden sm:inline">{languageOptions[currentLanguageIndex]?.name || "Âm thanh"}</span>
                <span className="sm:hidden">Âm thanh</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white">
              <DropdownMenuLabel>Chọn phiên bản âm thanh</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {languageOptions.map((option) => (
                <DropdownMenuItem
                  key={option.index}
                  onClick={() => onLanguageChange(option.index)}
                  className={option.index === currentLanguageIndex ? "bg-primary/10 text-primary" : ""}
                >
                  {option.index === currentLanguageIndex && <Check size={16} className="mr-2" />}
                  {option.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Server options */}
        {serverOptions.length > 1 && onServerChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 px-3 h-9 bg-black/40 hover:bg-black/60 border-white/10"
              >
                <Server size={16} />
                <span>Server {currentServerIndex + 1}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white">
              <DropdownMenuLabel>Chọn server phát</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {serverOptions.map((server) => (
                <DropdownMenuItem
                  key={server.index}
                  onClick={() => onServerChange(server.index)}
                  className={server.index === currentServerIndex ? "bg-primary/10 text-primary" : ""}
                >
                  {server.index === currentServerIndex && <Check size={16} className="mr-2" />}
                  {server.name || `Server ${server.index + 1}`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Extra actions */}
        <div className="flex items-center gap-2">
          {/* Favorite button */}
          {onToggleFavorite && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isFavorite ? "destructive" : "outline"}
                    size="icon"
                    onClick={onToggleFavorite}
                    disabled={!isAuthenticated}
                    className={cn(
                      "h-9 w-9 md:h-9 md:w-auto md:px-3 md:gap-2",
                      isFavorite 
                        ? "md:text-white" 
                        : "hover:text-pink-600 hover:border-pink-600 bg-black/40 hover:bg-black/60 border-white/10"
                    )}
                  >
                    <Heart size={16} className={isFavorite ? "fill-current" : ""} />
                    <span className="hidden md:inline">{isFavorite ? "Đã thích" : "Yêu thích"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFavorite ? "Xóa khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Share button */}
          {onShare && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onShare}
                    className="h-9 w-9 md:h-9 md:w-auto md:px-3 md:gap-2 bg-black/40 hover:bg-black/60 border-white/10"
                  >
                    <Share2 size={16} />
                    <span className="hidden md:inline">Chia sẻ</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Chia sẻ phim này</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Thêm nút xem toàn màn hình trên desktop */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const videoElement = document.querySelector('video');
                    if (videoElement) {
                      if (document.fullscreenElement) {
                        if (document.exitFullscreen) {
                          document.exitFullscreen();
                        } else if ((document as any).webkitExitFullscreen) {
                          (document as any).webkitExitFullscreen();
                        } else if ((document as any).mozCancelFullScreen) {
                          (document as any).mozCancelFullScreen();
                        } else if ((document as any).msExitFullscreen) {
                          (document as any).msExitFullscreen();
                        }
                      } else {
                        if (videoElement.requestFullscreen) {
                          videoElement.requestFullscreen().catch(err => console.error("Fullscreen error:", err));
                        } else if ((videoElement as any).webkitRequestFullscreen) {
                          (videoElement as any).webkitRequestFullscreen();
                        } else if ((videoElement as any).mozRequestFullScreen) {
                          (videoElement as any).mozRequestFullScreen();
                        } else if ((videoElement as any).msRequestFullscreen) {
                          (videoElement as any).msRequestFullscreen();
                        } else {
                          console.log("Trình duyệt không hỗ trợ chế độ toàn màn hình");
                        }
                      }
                    }
                  }}
                  className="h-9 w-9 md:h-9 md:w-auto md:px-3 md:gap-2 bg-black/40 hover:bg-black/60 border-white/10"
                >
                  <Maximize size={16} />
                  <span className="hidden md:inline">Toàn màn hình</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Xem toàn màn hình</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Info button */}
          {onInfoClick && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onInfoClick}
                    className="h-9 w-9 md:h-9 md:w-auto md:px-3 md:gap-2 bg-black/40 hover:bg-black/60 border-white/10"
                  >
                    <Info size={16} />
                    <span className="hidden md:inline">Thông tin</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Thông tin phim</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
}