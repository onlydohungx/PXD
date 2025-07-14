import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addToFavorites, removeFromFavorites, checkFavoriteStatus } from "@/lib/api";
import { 
  Play, 
  ArrowLeft, 
  Star, 
  Heart, 
  Download, 
  Share2, 
  Info 
} from "lucide-react";
import { motion } from "framer-motion";

interface MovieDetailsProps {
  movie: any;
  onBackClick?: () => void;
}

export function MovieDetails({ movie, onBackClick }: MovieDetailsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch favorite status if user is logged in
  const { data: favoriteData } = useQuery({
    queryKey: ['/api/favorites/check', movie.slug],
    queryFn: () => checkFavoriteStatus(movie.slug),
    enabled: !!user,
  });
  
  const isFavorite = favoriteData?.isFavorite || false;
  
  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: () => {
      return isFavorite
        ? removeFromFavorites(movie.slug)
        : addToFavorites(movie.slug);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites/check', movie.slug] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      
      toast({
        title: isFavorite ? 'Đã xóa khỏi danh sách yêu thích' : 'Đã thêm vào danh sách yêu thích',
        description: movie.title,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleToggleFavorite = () => {
    if (!user) {
      toast({
        title: 'Bạn cần đăng nhập',
        description: 'Vui lòng đăng nhập để sử dụng tính năng này',
        variant: 'destructive',
      });
      return;
    }
    
    toggleFavoriteMutation.mutate();
  };

  return (
    <div className="bg-background">
      {/* Back button */}
      <button 
        onClick={onBackClick} 
        className="fixed top-4 left-4 z-10 bg-card/70 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center text-white"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      
      {/* Movie hero section */}
      <div className="h-[50vh] md:h-[70vh] relative">
        <img 
          src={movie.thumb_url || movie.poster_url} 
          alt={`${movie.name} Backdrop`} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full flex flex-col md:flex-row items-start md:items-end">
          <div className="hidden md:block w-48 h-72 rounded-xl overflow-hidden shadow-lg mr-8 flex-shrink-0 transform -translate-y-10">
            <img 
              src={movie.poster_url} 
              alt={`${movie.name} Poster`} 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-grow">
            <h1 className="text-3xl md:text-5xl font-bold mb-2 text-white">{movie.name}</h1>
            
            <div className="flex flex-wrap items-center mb-4 text-sm">
              {movie.year && <span className="text-gray-300 mr-4">{movie.year}</span>}
              {movie.time && <span className="text-gray-300 mr-4">{movie.time}</span>}
              {movie.category && movie.category.map((cat: any) => (
                <Badge key={cat.id} variant="outline" className="bg-primary/30 text-primary border-none mr-2 mb-2">
                  {cat.name}
                </Badge>
              ))}
            </div>
            
            <div className="flex items-center mb-6">
              {movie.tmdb?.vote_average > 0 && (
                <div className="flex items-center mr-6">
                  <Star className="text-yellow-500 mr-1 h-5 w-5 fill-yellow-500" />
                  <span className="text-white font-bold">{movie.tmdb.vote_average.toFixed(1)}</span>
                  <span className="text-gray-400 ml-1">/ 10</span>
                </div>
              )}
              
              <div className="flex">
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="w-8 h-8 rounded-full mr-2"
                  onClick={handleToggleFavorite}
                >
                  <Heart 
                    className={`h-4 w-4 ${isFavorite ? 'fill-primary text-primary' : 'text-white'}`} 
                  />
                </Button>
                <Button size="icon" variant="outline" className="w-8 h-8 rounded-full mr-2">
                  <Share2 className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <Link href={`/watch/${movie.slug}`}>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg rounded-full px-6 py-3">
                  <Play className="mr-2 h-4 w-4" />
                  Xem ngay
                </Button>
              </Link>
              <Button variant="outline" className="rounded-full">
                <Info className="mr-2 h-4 w-4" />
                Chi tiết
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Movie details content */}
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Nội dung phim</h2>
              <p className="text-gray-300 leading-relaxed">
                {movie.content || 'Chưa có thông tin chi tiết về nội dung phim.'}
              </p>
            </section>
            
            {movie.actor && movie.actor.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Diễn viên</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {movie.actor.map((actorName: string, index: number) => (
                    <div key={index} className="flex items-center">
                      <div className="w-12 h-12 rounded-full overflow-hidden mr-3 bg-muted">
                        <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary">
                          {actorName?.charAt(0)}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{actorName}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            
            {movie.trailer_url && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Trailer</h2>
                <div className="rounded-xl overflow-hidden">
                  <AspectRatio ratio={16/9}>
                    <iframe 
                      src={movie.trailer_url} 
                      title={`${movie.name} Trailer`}
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </AspectRatio>
                </div>
              </section>
            )}
          </div>
          
          <div>
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Thông tin</h2>
              <div className="space-y-4">
                {movie.director && movie.director.length > 0 && (
                  <div>
                    <h4 className="text-gray-400 mb-1">Đạo diễn</h4>
                    <p className="text-white">{movie.director.join(', ')}</p>
                  </div>
                )}
                
                {movie.country && movie.country.length > 0 && (
                  <div>
                    <h4 className="text-gray-400 mb-1">Quốc gia</h4>
                    <div className="flex flex-wrap gap-2">
                      {movie.country.map((country: any) => (
                        <Badge key={country.id} className="bg-gray-700">{country.name}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {movie.lang && (
                  <div>
                    <h4 className="text-gray-400 mb-1">Ngôn ngữ</h4>
                    <p className="text-white">{movie.lang}</p>
                  </div>
                )}
                
                {movie.origin_name && (
                  <div>
                    <h4 className="text-gray-400 mb-1">Tên gốc</h4>
                    <p className="text-white">{movie.origin_name}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="text-gray-400 mb-1">Chất lượng</h4>
                  <div className="flex space-x-2">
                    <Badge className="bg-primary text-white">{movie.quality || "HD"}</Badge>
                    {movie.time && <Badge variant="outline">{movie.time}</Badge>}
                  </div>
                </div>
              </div>
            </section>
            
            {movie.childs && movie.childs.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Tập phim khác</h2>
                <div className="grid grid-cols-2 gap-4">
                  {movie.childs.slice(0, 4).map((childMovie: any, index: number) => (
                    <Link key={index} href={`/movie/${childMovie.slug}`}>
                      <motion.div 
                        className="rounded-xl overflow-hidden bg-card"
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="relative aspect-[2/3]">
                          <img 
                            src={childMovie.poster_url || childMovie.thumb_url} 
                            alt={childMovie.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2">
                          <h3 className="font-medium text-white truncate text-sm">{childMovie.name}</h3>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
