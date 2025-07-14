import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Play, Clock } from "lucide-react";

interface ContinueWatchingCardProps {
  movieSlug: string;
  title: string;
  poster: string;
  year?: string;
  quality?: string;
  episodeIndex?: number;
  progress?: number;
  currentTime?: number;
  duration?: number;
}

export function ContinueWatchingCard({
  movieSlug,
  title,
  poster,
  year,
  quality = "HD",
  episodeIndex = 0,
  progress = 0,
  currentTime = 0,
  duration = 0,
}: ContinueWatchingCardProps) {
  // Chuyển từ index (bắt đầu từ 0) sang episode number (bắt đầu từ 1) cho URL
  const watchUrl = `/watch/${movieSlug}${episodeIndex !== undefined && episodeIndex >= 0 ? `/${episodeIndex + 1}` : ''}`;
  
  // Format thời gian xem
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <Link href={watchUrl}>
      <div className="movie-card relative group overflow-hidden rounded-xl bg-card shadow-lg hover:shadow-2xl transition-all duration-300 ease-out">
        {/* Poster image */}
        <div className="relative aspect-[2/3] bg-muted overflow-hidden">
          <img
            src={poster || 'https://via.placeholder.com/500x750?text=Phim+Xuyen+Dem'}
            alt={`${title} Poster`}
            className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              const imgElement = e.target as HTMLImageElement;
              if (imgElement.src !== 'https://via.placeholder.com/500x750?text=Phim+Xuyen+Dem') {
                imgElement.src = 'https://via.placeholder.com/500x750?text=Phim+Xuyen+Dem';
              }
            }}
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
          
          {/* Quality badge */}
          {quality && (
            <Badge className="absolute top-2 right-2 bg-primary/90 text-white text-xs px-2 py-1">
              {quality}
            </Badge>
          )}

          {/* Progress bar */}
          {progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div 
                className="h-full bg-primary transition-all duration-300" 
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          )}

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-16 h-16 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-6 h-6 text-white ml-1" />
            </div>
          </div>

          {/* Continue watching info */}
          <div className="absolute bottom-2 left-2 right-2 text-white">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{progress}%</span>
              </div>
              {episodeIndex !== undefined && episodeIndex >= 0 && (
                <span className="bg-black/50 px-2 py-1 rounded">
                  Tập {episodeIndex + 1}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Movie info */}
        <div className="p-3">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{year}</span>
            {duration > 0 && currentTime > 0 && (
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
