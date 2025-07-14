import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Star, CalendarDays } from "lucide-react";

interface MovieCardProps {
  slug: string;
  title: string;
  poster: string;
  year?: string;
  rating?: number;
  quality?: string;
  category?: string;
  episodes?: number;
  onPlayClick?: (e: React.MouseEvent) => void;
}

export function MovieCard({
  slug,
  title,
  poster,
  year,
  rating,
  quality = "HD",
  category,
  episodes,
  onPlayClick,
}: MovieCardProps) {
  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onPlayClick) onPlayClick(e);
  };

  // Format rating to display only one decimal place if needed
  const formattedRating = rating ? rating.toFixed(1) : null;

  return (
    <Link href={`/movie/${slug}`}>
      <div className="movie-card relative group overflow-hidden rounded-xl bg-card shadow-lg hover:shadow-2xl transition-all duration-300 ease-out">
        {/* Poster image with responsive design */}
        <div className="relative aspect-[2/3] bg-muted overflow-hidden">
          <img
            srcSet={`${poster} 500w, ${poster} 1000w`}
            sizes="(max-width: 640px) 100vw, 500px"
            src={poster || 'https://via.placeholder.com/500x750?text=Phim+Xuyen+Dem'}
            alt={`${title} Poster`}
            className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
            loading="lazy"
            // Bỏ fetchPriority vì gây lỗi trong React DOM
            decoding="async"
            onError={(e) => {
              const imgElement = e.target as HTMLImageElement;
              if (imgElement.src !== 'https://via.placeholder.com/500x750?text=Phim+Xuyen+Dem') {
                imgElement.src = 'https://via.placeholder.com/500x750?text=Phim+Xuyen+Dem';
              }
            }}
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>

          {/* Play button with bounce effect on hover */}
          <div className="absolute inset-0 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-100 scale-75">
            <Button
              size="icon"
              className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)] backdrop-blur-sm border border-white/10"
              onClick={handlePlayClick}
            >
              <Play className="h-6 w-6 ml-1" />
            </Button>
          </div>

          {/* Quality badge - subtle design */}
          {quality && (
            <div className="absolute top-3 right-3 z-10">
              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white border-0 px-2.5 py-1 text-xs font-medium shadow-lg">
                {quality}
              </Badge>
            </div>
          )}

          {/* Episodes badge - improved contrast */}
          {episodes && (
            <div className="absolute top-3 left-3 z-10">
              <Badge variant="outline" className="bg-black/60 text-white border-white/20 px-2.5 py-1 backdrop-blur-sm">
                {episodes} tập
              </Badge>
            </div>
          )}
        </div>

        {/* Title and additional information with glass effect */}
        <div className="p-4 relative z-10 bg-gradient-to-t from-card to-card/90">
          <h3 className="font-bold text-base mb-2 line-clamp-1 text-gradient-primary group-hover:text-glow transition-all duration-300">
            {title}
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {year && (
                <div className="flex items-center text-xs text-foreground/80">
                  <CalendarDays className="h-3.5 w-3.5 mr-1 text-primary/70" />
                  <span>{year}</span>
                </div>
              )}

              {category && (
                <div className="hidden sm:block text-xs text-foreground/70 truncate max-w-[100px]">
                  {category}
                </div>
              )}
            </div>

            {formattedRating && (
              <div className="flex items-center text-xs bg-yellow-500/10 px-2 py-0.5 rounded-full">
                <Star className="text-yellow-500 h-3.5 w-3.5 mr-1 fill-yellow-500" />
                <span className="text-yellow-400 font-medium">{formattedRating}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}