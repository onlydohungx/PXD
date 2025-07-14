import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface MovieCardWithProgressProps {
  slug: string;
  title: string;
  poster: string;
  year?: string;
  rating?: number;
  quality?: string;
  category?: string;
  episodes?: number;
  progress?: number; // Tiến trình xem phim (0-100)
  onPlayClick?: (e: React.MouseEvent) => void;
}

export function MovieCardWithProgress({
  slug,
  title,
  poster,
  year,
  rating,
  quality,
  category,
  episodes,
  progress = 0,
  onPlayClick
}: MovieCardWithProgressProps) {
  
  // Xác định màu của thanh tiến trình dựa trên giá trị
  const getProgressColor = (value: number) => {
    if (value > 95) return "bg-green-500"; // Đã xem gần hết
    if (value > 10) return "bg-blue-500"; // Đang xem
    return "bg-primary"; // Mới bắt đầu xem
  };
  
  return (
    <div className="group relative overflow-hidden rounded-lg transition-all duration-300">
      <Link href={`/movie/${slug}`} className="block">
        <div className="aspect-[2/3] relative overflow-hidden rounded-lg border border-white/10 bg-card/30 hover:bg-card/60 hover:border-white/20 transition-all duration-300">
          {/* Movie Poster */}
          <img 
            src={poster} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              // Khi lỗi ảnh, thay thế bằng placeholder
              (e.target as HTMLImageElement).src = '/placeholder-portrait.svg';
            }}
          />
          
          {/* Quality Badge */}
          {quality && (
            <div className="absolute top-2 right-2 z-20">
              <Badge className="bg-primary/70 backdrop-blur-sm text-white text-xs py-0 px-1.5">
                {quality}
              </Badge>
            </div>
          )}
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-70"></div>
          
          {/* Watch Progress */}
          {progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 px-0 py-0 z-20">
              <div className="h-[1px] w-full bg-black/50 backdrop-blur-sm overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(progress)} rounded-full shadow-glow transition-all duration-300`} 
                  style={{ 
                    width: `${progress}%`,
                    boxShadow: progress > 95 ? '0 0 5px rgba(34, 197, 94, 0.5)' : 
                               progress > 10 ? '0 0 5px rgba(59, 130, 246, 0.5)' : 
                               '0 0 5px rgba(168, 85, 247, 0.5)'
                  }}
                ></div>
              </div>
              
              {/* Progress Badge */}
              {progress > 10 && progress < 95 && (
                <div className="absolute bottom-2 right-2 z-20">
                  <Badge variant="outline" className="bg-black/70 text-white border-white/20 px-2 py-0.5 text-[10px] backdrop-blur-sm rounded-full shadow-md">
                    {Math.round(progress)}%
                  </Badge>
                </div>
              )}
              
              {progress >= 95 && (
                <div className="absolute bottom-2 right-2 z-20">
                  <Badge variant="outline" className="bg-green-500/40 text-white border-green-500/50 px-2 py-0.5 text-[10px] backdrop-blur-sm rounded-full shadow-md animate-pulse">
                    Đã xem
                  </Badge>
                </div>
              )}
            </div>
          )}
          
          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full bg-primary/80 h-12 w-12 backdrop-blur-sm transform group-hover:scale-110 transition-transform duration-300"
              onClick={onPlayClick}
            >
              <Play className="h-5 w-5 text-white ml-1" />
            </Button>
          </div>
          
          {/* Title and Info */}
          <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
            <h3 className="font-medium text-sm md:text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <div className="flex items-center text-xs text-white/60 space-x-2">
              {year && <span>{year}</span>}
              {rating && (
                <div className="flex items-center">
                  <span className="text-yellow-400 mr-1">★</span>
                  <span>{rating}</span>
                </div>
              )}
              {category && <span className="hidden sm:inline-block">{category}</span>}
              {episodes !== undefined && episodes > 0 && (
                <span className="hidden sm:inline-block">{episodes} tập</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}