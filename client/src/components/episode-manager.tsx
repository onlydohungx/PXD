import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EpisodeData {
  name: string;
  slug: string;
  filename?: string;
  link_embed?: string;
  link_m3u8: string;
}

interface ServerData {
  server_name: string;
  server_data: EpisodeData[];
}

interface EpisodeManagerProps {
  episodes: ServerData[] | null;
  currentEpisode: number;
  onEpisodeChange: (index: number) => void;
  watchedEpisodes?: number[];
  movieName?: string;
}

export function EpisodeManager({
  episodes,
  currentEpisode,
  onEpisodeChange,
  watchedEpisodes = [],
  movieName
}: EpisodeManagerProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const episodesPerPage = 24; // Hiện số tập trong 1 trang

  // Xử lý dữ liệu tập phim từ API 
  const episodesList = React.useMemo(() => {
    if (!episodes || !episodes[0] || !episodes[0].server_data) {
      return [];
    }
    
    // Chỉ lấy server_data từ server đầu tiên (thường là Vietsub)
    return episodes[0].server_data || [];
  }, [episodes]);

  // Tổng số tập phim
  const totalEpisodes = episodesList.length;
  
  // Tổng số trang
  const totalPages = Math.ceil(totalEpisodes / episodesPerPage);
  
  // Lấy các tập phim cho trang hiện tại
  const currentPageEpisodes = React.useMemo(() => {
    const startIndex = currentPage * episodesPerPage;
    const endIndex = Math.min(startIndex + episodesPerPage, episodesList.length);
    return episodesList.slice(startIndex, endIndex);
  }, [episodesList, currentPage, episodesPerPage]);

  const startEpisodeIndex = currentPage * episodesPerPage;

  // Xử lý chuyển trang
  const nextEpisodePage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevEpisodePage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Xử lý chuyển tới trang chứa tập đang xem
  useEffect(() => {
    const episodePageIndex = Math.floor(currentEpisode / episodesPerPage);
    if (episodePageIndex !== currentPage) {
      setCurrentPage(episodePageIndex);
    }
  }, [currentEpisode, episodesPerPage, currentPage]);

  if (!episodes || !episodes[0] || !episodes[0].server_data || totalEpisodes === 0) {
    return (
      <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-white/10 p-4">
        <p className="text-white/60 text-center">Không có tập phim nào</p>
      </div>
    );
  }

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-white/10 p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-white mb-1">Danh sách tập phim</h3>
          <p className="text-xs md:text-sm text-white/60">Phim gồm {totalEpisodes} tập, chọn tập để xem</p>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md rounded-full px-3 py-2 border border-white/10 text-xs shadow-md">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 md:h-8 md:w-8 rounded-full hover:bg-white/10 transition-colors duration-200"
              onClick={prevEpisodePage}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs md:text-sm font-medium px-1">
              Trang {currentPage + 1}/{totalPages}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 md:h-8 md:w-8 rounded-full hover:bg-white/10 transition-colors duration-200"
              onClick={nextEpisodePage}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Episodes grid - giống trang chi tiết phim */}
      <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 md:gap-3">
        {currentPageEpisodes.map((episode: any, index: number) => {
          const episodeIndex = startEpisodeIndex + index;
          const episodeNumber = episode.name.match(/\d+/) ? parseInt(episode.name.match(/\d+/)[0]) : (episodeIndex + 1);
          const isCurrentEpisode = episodeIndex === currentEpisode;
          const isWatched = watchedEpisodes.includes(episodeIndex);

          return (
            <Button
              key={episodeIndex}
              variant={isCurrentEpisode ? "default" : "outline"}
              className={`w-full aspect-square text-xs rounded-xl transition-all duration-300 ${
                isCurrentEpisode 
                  ? "bg-gradient-to-br from-primary to-primary-foreground hover:brightness-110 text-white font-medium shadow-lg border-0" 
                  : isWatched
                  ? "bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30"
                  : "bg-black/30 backdrop-blur-sm hover:bg-black/40 border-white/10 hover:border-white/20 hover:shadow-md"
              }`}
              onClick={() => onEpisodeChange(episodeIndex)}
            >
              {episodeNumber}
            </Button>
          );
        })}
      </div>
    </div>
  );
}