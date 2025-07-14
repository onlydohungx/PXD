import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRecommendations } from '@/lib/api-recommendations';
import { MovieCard } from '@/components/movie-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';


export function RecommendedMoviesSection() {
  const { isAuthenticated } = useAuth();

  // Chỉ hiển thị phần này khi người dùng đã đăng nhập
  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="mb-12 relative">
      {/* Background decoration */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl"></div>
      <RecommendedMovies />
    </section>
  );
}

function RecommendedMovies() {
  const { 
    data: recommendations, 
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['/api/user/recommendations'],
    queryFn: getRecommendations,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const handleGenerateNewRecommendations = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Failed to generate new recommendations:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container px-4 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-black/60 to-black/20 backdrop-blur-lg border border-white/10 shadow-xl text-purple-400 transform transition-transform duration-300 hover:scale-110 hover:rotate-3">
              <div className="w-6 h-6 md:w-7 md:h-7">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                Đề Xuất Cho Bạn
                <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full font-semibold text-purple-400 shadow-lg shadow-purple-500/10 animate-pulse">BETA</span>
              </h2>
              <p className="text-sm text-muted-foreground">Phim được đề xuất dựa trên thói quen xem của bạn</p>
            </div>
          </div>
        </div>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex-none w-[160px] md:w-[180px] flex flex-col gap-2">
              <Skeleton className="aspect-[2/3] w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !recommendations || !recommendations.movies || recommendations.movies.length === 0) {
    return (
      <div className="container px-4 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-black/60 to-black/20 backdrop-blur-lg border border-white/10 shadow-xl text-purple-400 transform transition-transform duration-300 hover:scale-110 hover:rotate-3">
              <div className="w-6 h-6 md:w-7 md:h-7">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                Đề Xuất Cho Bạn
                <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full font-semibold text-purple-400 shadow-lg shadow-purple-500/10 animate-pulse">BETA</span>
              </h2>
              <p className="text-sm text-muted-foreground">Phim được đề xuất dựa trên thói quen xem của bạn</p>
            </div>
          </div>
          <Button onClick={handleGenerateNewRecommendations} size="sm" variant="outline">
            <Sparkles className="w-4 h-4 mr-2" />
            Tạo Đề Xuất Mới
          </Button>
        </div>
        <p className="text-muted-foreground mb-4">
          Hệ thống AI chưa có đề xuất nào cho bạn. Hãy xem thêm phim để nhận được đề xuất phù hợp hơn.
        </p>
      </div>
    );
  }

  const movieItems = recommendations.movies.map(movie => ({
    name: movie.name,
    slug: movie.slug,
    poster_url: movie.poster_url || '',
    thumb_url: movie.thumb_url || '',
    year: movie.year,
    quality: movie.quality,
    _id: movie._id
  }));

  return (
    <div className="container px-4 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-black/60 to-black/20 backdrop-blur-lg border border-white/10 shadow-xl text-purple-400 transform transition-transform duration-300 hover:scale-110 hover:rotate-3">
            <div className="w-6 h-6 md:w-7 md:h-7">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              Đề Xuất Cho Bạn
              <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full font-semibold text-purple-400 shadow-lg shadow-purple-500/10 animate-pulse">BETA</span>
            </h2>
            <p className="text-sm text-muted-foreground">Phim được đề xuất dựa trên thói quen xem của bạn</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 mt-2">
        {movieItems.slice(0, 8).map((movie, index) => (
          <MovieCard key={movie.slug || movie._id} movie={movie} index={index} />
        ))}
      </div>

      {/* Bottom glass style separator - desktop only */}
      <div className="hidden lg:block h-0.5 w-full mt-8 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full"></div>
    </div>
  );
}