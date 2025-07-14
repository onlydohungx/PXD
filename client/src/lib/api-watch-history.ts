import api from './api-instance';

// Function to capitalize first letter of each word
const formatSlugName = (slug: string): string => {
  return slug
    .split('-')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Enhanced watchHistory functions with better error handling
export const fetchWatchHistory = async () => {
  try {
    const response = await api.get('/user/watch-history');
    const watchHistory = response.data;
    
    // Nạp thêm thông tin phim cho mỗi mục trong lịch sử
    if (Array.isArray(watchHistory) && watchHistory.length > 0) {
      const enhancedHistory = await Promise.allSettled(
        watchHistory.map(async (item) => {
          try {
            // Lấy thông tin chi tiết của phim
            const movieResponse = await api.get(`/movie/${item.movieSlug}`);
            const movieData = movieResponse.data.movie;
            
            return {
              ...item,
              movieDetails: {
                name: movieData.name,
                poster_url: movieData.poster_url,
                thumb_url: movieData.thumb_url,
                episode_current: movieData.episode_current,
                year: movieData.year,
                quality: movieData.quality,
              }
            };
          } catch (err) {
            console.error(`Error fetching details for movie ${item.movieSlug}:`, err);
            // Tạo dữ liệu phim mặc định khi không thể lấy được thông tin
            const formattedName = formatSlugName(item.movieSlug);
              
            return {
              ...item,
              movieDetails: {
                name: formattedName,
                poster_url: '',
                thumb_url: '',
                year: null,
                quality: null
              }
            };
          }
        })
      );
      
      // Xử lý kết quả từ Promise.allSettled
      return enhancedHistory
        .map(result => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            // Nếu có lỗi, trả về mục với tên được tạo từ slug
            const item = watchHistory.find((h: any) => h.movieSlug === result.reason?.movieSlug) || {};
            const formattedName = item.movieSlug
              ? formatSlugName(item.movieSlug)
              : 'Phim không rõ tên';
              
            return {
              ...item,
              movieDetails: {
                name: formattedName,
                poster_url: '',
                thumb_url: '',
                year: null,
                quality: null
              }
            };
          }
        });
    }
    
    return watchHistory;
  } catch (error: any) {
    console.error('Error fetching watch history:', error);
    return [];
  }
};

// Enhanced favorites function with better error handling
export const fetchFavorites = async () => {
  try {
    const response = await api.get('/user/favorites');
    const favorites = response.data;
    
    // Nạp thêm thông tin phim cho mỗi mục trong danh sách yêu thích
    if (Array.isArray(favorites) && favorites.length > 0) {
      const enhancedFavorites = await Promise.allSettled(
        favorites.map(async (item) => {
          try {
            // Lấy thông tin chi tiết của phim
            const movieResponse = await api.get(`/movie/${item.movieSlug}`);
            const movieData = movieResponse.data.movie;
            
            return {
              ...item,
              movieDetails: {
                name: movieData.name,
                poster_url: movieData.poster_url,
                thumb_url: movieData.thumb_url,
                episode_current: movieData.episode_current,
                year: movieData.year,
                quality: movieData.quality,
              }
            };
          } catch (err) {
            console.error(`Error fetching details for movie ${item.movieSlug}:`, err);
            // Tạo dữ liệu phim mặc định khi không thể lấy được thông tin
            const formattedName = formatSlugName(item.movieSlug);
              
            return {
              ...item,
              movieDetails: {
                name: formattedName,
                poster_url: '',
                thumb_url: '',
                year: null,
                quality: null
              }
            };
          }
        })
      );
      
      // Xử lý kết quả từ Promise.allSettled
      return enhancedFavorites
        .map(result => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            // Nếu có lỗi, trả về mục với tên được tạo từ slug
            const item = favorites.find((f: any) => f.movieSlug === result.reason?.movieSlug) || {};
            const formattedName = item.movieSlug
              ? formatSlugName(item.movieSlug)
              : 'Phim không rõ tên';
              
            return {
              ...item,
              movieDetails: {
                name: formattedName,
                poster_url: '',
                thumb_url: '',
                year: null,
                quality: null
              }
            };
          }
        });
    }
    
    return favorites;
  } catch (error: any) {
    console.error('Error fetching favorites:', error);
    return [];
  }
};

// Hàm phân tích thông tin phim để cập nhật thói quen xem
export const analyzeMovieForRecommendations = async (movieSlug: string) => {
  try {
    // Kiểm tra xem đã phân tích phim này gần đây chưa (tránh phân tích quá nhiều lần)
    const analyzeKey = `analyzed_${movieSlug}`;
    const lastAnalyzed = sessionStorage.getItem(analyzeKey);
    
    // Nếu đã phân tích trong vòng 10 phút, bỏ qua để tiết kiệm tài nguyên
    if (lastAnalyzed) {
      const timeSinceLastAnalysis = Date.now() - parseInt(lastAnalyzed);
      if (timeSinceLastAnalysis < 10 * 60 * 1000) { // 10 phút
        return { success: true, cached: true };
      }
    }
    
    // Lấy thông tin chi tiết của phim
    const movieResponse = await api.get(`/movie/${movieSlug}`);
    const movieData = movieResponse.data.movie;
    
    // Gửi categories và country tới API để cập nhật thói quen xem
    if (movieData) {
      // Lấy thể loại từ dữ liệu phim
      const categories = movieData.category ? 
        movieData.category.map((c: any) => c.slug) : [];
      
      // Lấy quốc gia từ dữ liệu phim
      let country = null;
      if (movieData.country && movieData.country.length > 0) {
        country = movieData.country[0].slug;
      }
      
      // Chỉ log khi debug mode được bật hoặc lần đầu phân tích phim này
      if (!lastAnalyzed) {
        console.log(`[ANALYZE] Phim: ${movieSlug}, Thể loại: ${categories.join(', ')}, Quốc gia: ${country || 'N/A'}`);
      }
      
      // Gửi dữ liệu lên server để cập nhật thói quen
      if (categories.length > 0 || country) {
        await api.post(`/user/watch-history/${movieSlug}/analyze`, {
          categories,
          country
        });
        
        // Lưu thời điểm phân tích
        sessionStorage.setItem(analyzeKey, Date.now().toString());
      }
      
      return { success: true };
    }
    
    return { success: false, reason: 'Không tìm thấy thông tin phim' };
  } catch (error: any) {
    console.error('[ANALYZE-ERROR] Lỗi phân tích phim:', error.message);
    return { success: false, reason: error.message };
  }
};

// Hàm chức năng lưu tiến trình xem phim mới, tự động xóa tiến trình cũ
export const addToWatchHistory = async (
  movieSlug: string, 
  episodeIndex?: number, 
  currentTime?: number, 
  duration?: number, 
  progress?: number
) => {
  try {
    if (!movieSlug) {
      console.error('Thiếu thông tin movieSlug khi lưu tiến trình xem');
      return { 
        status: false, 
        message: 'Thiếu thông tin nhận dạng phim'
      };
    }
    
    // Kiểm tra giá trị của các tham số và sử dụng giá trị mặc định nếu undefined
    const validCurrentTime = currentTime !== undefined ? currentTime : 0;
    const validDuration = duration !== undefined ? duration : 0;
    const validProgress = progress !== undefined ? progress : 0;
    
    if (validCurrentTime < 0 || validDuration < 0 || validProgress < 0 || validProgress > 100) {
      console.error('Dữ liệu tiến trình không hợp lệ:', { validCurrentTime, validDuration, validProgress });
      return { 
        status: false, 
        message: 'Dữ liệu tiến trình không hợp lệ' 
      };
    }
    
    const validEpisodeIndex = episodeIndex !== undefined ? episodeIndex : 0;
    
    // Lưu lại trạng thái cập nhật cuối cùng để tránh cập nhật quá thường xuyên
    // Sử dụng sessionStorage để lưu trữ tạm thời
    const storageKey = `last_watch_${movieSlug}_ep${validEpisodeIndex}`;
    const lastProgressStr = sessionStorage.getItem(storageKey);
    const lastProgress = lastProgressStr ? parseInt(lastProgressStr) : -1;
    const currentProgress = Math.round(validProgress);
    
    // Kiểm tra xem tiến trình đã thay đổi đáng kể chưa (ít nhất 5%)
    const significantChange = Math.abs(currentProgress - lastProgress) >= 5;
    
    // Chỉ log ra console khi có thay đổi đáng kể
    if (significantChange) {
      console.log(`Lưu tiến trình xem: ${movieSlug} - Tập ${validEpisodeIndex} - ${Math.round(validProgress)}%`);
      // Cập nhật tiến trình trong sessionStorage
      sessionStorage.setItem(storageKey, currentProgress.toString());
    }
    
    // Gửi yêu cầu lưu tiến trình xem mới (API sẽ tự động xóa tiến trình cũ của cùng phim và tập)
    const response = await api.post('/user/watch-history', { 
      movieSlug, 
      episodeIndex: validEpisodeIndex,
      currentTime: validCurrentTime,
      duration: validDuration,
      progress: validProgress
    });
    
    // Phân tích phim để cập nhật thói quen xem (bất đồng bộ - không chờ kết quả)
    analyzeMovieForRecommendations(movieSlug).catch(err => {
      console.error('Lỗi khi phân tích phim cho đề xuất:', err);
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi cập nhật tiến trình xem phim:', error);
    return { 
      status: false, 
      message: error.message || 'Lỗi khi cập nhật tiến trình xem phim',
      error: error
    };
  }
};

export const getWatchProgress = async (movieSlug: string, episodeIndex: number = 0) => {
  try {
    const response = await api.get(`/user/watch-progress/${movieSlug}/${episodeIndex}`);
    return response.data;
  } catch (error: any) {
    console.error('Error getting watch progress:', error);
    return { 
      status: false, 
      message: error.message || 'Lỗi khi lấy tiến trình xem phim',
      data: {
        currentTime: 0,
        duration: 0,
        progress: 0
      }
    };
  }
};

// Hàm mới để lấy danh sách các tập đã xem của một phim
export const getWatchedEpisodes = async (movieSlug: string) => {
  try {
    const response = await api.get(`/user/watch-history/episodes/${movieSlug}`);
    return response.data;
  } catch (error: any) {
    console.error('Error getting watched episodes:', error);
    return { 
      status: false, 
      message: error.message || 'Lỗi khi lấy danh sách tập đã xem',
      episodes: []
    };
  }
};

export const removeFromWatchHistory = async (movieSlug: string) => {
  try {
    const response = await api.delete(`/user/watch-history/${movieSlug}`);
    return response.data;
  } catch (error: any) {
    console.error('Error removing from watch history:', error);
    return { status: false, message: error.message || 'Lỗi khi xóa khỏi lịch sử xem' };
  }
};