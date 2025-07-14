import axios from "axios";

// Tạo API client với cấu hình nâng cao
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 10000, // Timeout sau 10 giây
  headers: {
    'Accept': 'application/json',
    'Cache-Control': 'max-age=300' // Cho phép cache 5 phút ở browser
  }
});

// Thiết lập cache phía client cho các response
const apiCache = new Map<string, {data: any, timestamp: number}>();
const CACHE_DURATION = 5 * 60 * 1000; // Cache 5 phút

// Interceptor để xử lý cache
api.interceptors.request.use((config) => {
  // Chỉ cache các GET request
  if (config.method?.toLowerCase() === 'get' && config.url) {
    const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
    const cachedData = apiCache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
      // Nếu dữ liệu còn trong thời gian cache, trả về từ cache
      config.adapter = () => {
        return Promise.resolve({
          data: cachedData.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: {}
        });
      };
    }
  }
  return config;
}, Promise.reject);

// Interceptor cho response để lưu vào cache
api.interceptors.response.use(response => {
  if (response.config.method?.toLowerCase() === 'get' && response.config.url) {
    const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
    apiCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });
  }
  return response;
}, error => {
  return Promise.reject(error);
});

// Movie APIs
export const fetchMovies = async (filters: {
  page?: number;
  category?: string;
  search?: string;
  year?: string;
  country?: string;
  sort?: string;
  type?: string;
  sort_field?: string;
  sort_type?: string;
  sort_lang?: string;
  limit?: number;
} = {}) => {
  const { 
    page = 1, 
    category = "", 
    search = "", 
    year = "", 
    country = "", 
    sort = "",
    type = "",  // Giá trị có thể là "series" hoặc "single"
    sort_field = "modified_time",
    sort_type = "desc",
    sort_lang = "",
    limit = 24
  } = filters;
  
  // Nếu có từ khóa tìm kiếm thì sử dụng endpoint tìm kiếm
  if (search && search.trim() !== "") {
    const params = { 
      keyword: search.trim(),  // Đảm bảo keyword không có khoảng trắng thừa
      page,
      category, 
      year, 
      country,
      sort_field,
      sort_type,
      sort_lang, 
      limit
    };

    try {
      const response = await api.get("/search", { params });
      return response.data;
    } catch (error: any) {
      // Return empty results with pagination information for better UX
      return { 
        status: true, 
        items: [],
        error: {
          message: error.message || "Lỗi kết nối đến API phim",
        },
        pagination: {
          current_page: page,
          total_pages: 0,
          total_items: 0,
          per_page: limit
        }
      };
    }
  }
  
  // Nếu không, sử dụng endpoint danh sách phim
  const params: any = { page, limit, sort_field, sort_type };
  
  // Thêm tham số tùy chọn
  if (type) params.type = type;
  if (sort_lang) params.sort_lang = sort_lang;
  if (country) params.country = country;
  
  try {
    const response = await api.get("/movies", { params });
    return response.data;
  } catch (error: any) {

    // Return empty results with pagination information for better UX
    return { 
      status: true, 
      items: [],
      error: {
        message: error.message || "Lỗi kết nối đến API phim",
      },
      pagination: {
        current_page: page,
        total_pages: 0,
        total_items: 0,
        per_page: limit
      }
    };
  }
};

export const fetchMovieDetails = async (slug: string) => {
  try {
    const response = await api.get(`/movie/${slug}`);
    return response.data;
  } catch (error: any) {

    return { 
      status: false, 
      message: error.message || "Không thể tải chi tiết phim", 
      movie: null 
    };
  }
};

export const fetchActorImages = async (slug: string) => {
  try {
    const response = await api.get(`/movies/${slug}/actors`);
    return response.data;
  } catch (error: any) {

    return { 
      success: false, 
      actors: [], 
      message: error.message || "Không thể tải ảnh diễn viên" 
    };
  }
};

export const fetchMovieDetailsWithActors = async (slug: string) => {
  try {
    const response = await api.get(`/movies/${slug}/details-with-actors`);
    return response.data;
  } catch (error: any) {

    return { 
      status: false, 
      message: error.message || "Không thể tải chi tiết phim và diễn viên", 
      movie: null 
    };
  }
};

export const fetchCategories = async () => {
  try {
    const response = await api.get('/categories');
    return response.data;
  } catch (error: any) {

    return [];
  }
};

export const fetchCategoryMovies = async (categorySlug: string, filters: {
  page?: number;
  country?: string;
  year?: string;
  sort_field?: string;
  sort_type?: string;
  sort_lang?: string;
  limit?: number;
  type?: string;
} = {}) => {
  try {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 24,
      sort_field: filters.sort_field || 'modified_time',
      sort_type: filters.sort_type || 'desc',
      country: filters.country || '',
      year: filters.year || '',
      sort_lang: filters.sort_lang || '',
      type: filters.type || ''
    };
    
    const response = await api.get(`/category/${categorySlug}`, { params });
    return response.data;
  } catch (error: any) {

    // Return empty results with pagination information for better UX
    return { 
      status: true, 
      items: [],
      error: {
        message: error.message || "Lỗi kết nối đến API phim",
      },
      pagination: {
        current_page: filters.page || 1,
        total_pages: 0,
        total_items: 0,
        per_page: filters.limit || 24
      }
    };
  }
};

export const fetchCountries = async () => {
  try {
    const response = await api.get('/countries');
    return response.data;
  } catch (error: any) {
    return [];
  }
};

export const fetchCountryMovies = async (countrySlug: string, filters: {
  page?: number;
  category?: string;
  year?: string;
  sort_field?: string;
  sort_type?: string;
  sort_lang?: string;
  limit?: number;
  type?: string;
} = {}) => {
  try {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 24,
      sort_field: filters.sort_field || 'modified_time',
      sort_type: filters.sort_type || 'desc',
      category: filters.category || '',
      year: filters.year || '',
      sort_lang: filters.sort_lang || '',
      type: filters.type || ''
    };
    
    const response = await api.get(`/country/${countrySlug}`, { params });
    return response.data;
  } catch (error: any) {
    // Return empty results with pagination information for better UX
    return { 
      status: true, 
      items: [],
      error: {
        message: error.message || "Lỗi kết nối đến API phim",
      },
      pagination: {
        current_page: filters.page || 1,
        total_pages: 0,
        total_items: 0,
        per_page: filters.limit || 24
      }
    };
  }
};

export const fetchYears = async () => {
  try {
    const response = await api.get('/years');
    return response.data;
  } catch (error: any) {
    return [];
  }
};

export const fetchYearMovies = async (year: string, filters: {
  page?: number;
  category?: string;
  country?: string;
  sort_field?: string;
  sort_type?: string;
  sort_lang?: string;
  limit?: number;
  type?: string;
} = {}) => {
  try {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 24,
      sort_field: filters.sort_field || 'modified_time',
      sort_type: filters.sort_type || 'desc',
      category: filters.category || '',
      country: filters.country || '',
      sort_lang: filters.sort_lang || '',
      type: filters.type || ''
    };
    
    const response = await api.get(`/year/${year}`, { params });
    return response.data;
  } catch (error: any) {
    // Return empty results with pagination information for better UX
    return { 
      status: true, 
      items: [],
      error: {
        message: error.message || "Lỗi kết nối đến API phim",
      },
      pagination: {
        current_page: filters.page || 1,
        total_pages: 0,
        total_items: 0,
        per_page: filters.limit || 24
      }
    };
  }
};

// User history APIs - Imported from api-watch-history.ts
export { 
  fetchWatchHistory, 
  addToWatchHistory, 
  getWatchProgress, 
  getWatchedEpisodes,
  removeFromWatchHistory 
} from './api-watch-history';

// Favorites APIs - Imported from api-watch-history.ts
export { fetchFavorites } from './api-watch-history';

export const addToFavorites = async (movieSlug: string) => {
  try {
    const response = await api.post('/user/favorites', { movieSlug });
    return response.data;
  } catch (error: any) {
    return { status: false, message: error.message || 'Lỗi khi thêm vào yêu thích' };
  }
};

export const removeFromFavorites = async (movieSlug: string) => {
  try {
    const response = await api.delete(`/user/favorites/${movieSlug}`);
    return response.data;
  } catch (error: any) {
    return { status: false, message: error.message || 'Lỗi khi xóa khỏi yêu thích' };
  }
};

export const checkFavoriteStatus = async (movieSlug: string) => {
  try {
    const response = await api.get(`/favorites/check/${movieSlug}`);
    return { isFavorite: response.data.isFavorite || false };
  } catch (error: any) {
    return { isFavorite: false };
  }
};

// User profile APIs
export const updateUserProfile = async (userData: any) => {
  try {
    const response = await api.put('/user/profile', userData);
    return response.data;
  } catch (error: any) {
    return { status: false, message: error.message || 'Lỗi khi cập nhật thông tin người dùng' };
  }
};

// Admin APIs
export const fetchUsers = async () => {
  try {
    const response = await api.get('/admin/users');
    return response.data;
  } catch (error: any) {
    return [];
  }
};

export const updateUser = async (userId: number, userData: any) => {
  try {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  } catch (error: any) {
    return { status: false, message: error.message || 'Lỗi khi cập nhật người dùng' };
  }
};

export const deleteUser = async (userId: number) => {
  try {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  } catch (error: any) {
    return { status: false, message: error.message || 'Lỗi khi xóa người dùng' };
  }
};

export const fetchAdminStats = async () => {
  try {
    const response = await api.get('/admin/stats');
    return response.data;
  } catch (error: any) {
    return { 
      totalUsers: 0,
      adminCount: 0,
      userCount: 0
    };
  }
};

// Comments APIs
export const fetchMovieComments = async (movieSlug: string) => {
  try {
    const response = await api.get(`/comments/${movieSlug}`);
    return response.data;
  } catch (error: any) {
    return [];
  }
};

export const addComment = async (data: {
  userId: number;
  movieSlug: string;
  content: string;
  rating?: number;
  parentId?: number;
}) => {
  try {
    const response = await api.post('/comments', data);
    return response.data;
  } catch (error: any) {
    return { status: false, message: error.message || 'Lỗi khi thêm bình luận' };
  }
};

export const updateComment = async (commentId: number, content: string) => {
  try {
    const response = await api.put(`/comments/${commentId}`, { content });
    return response.data;
  } catch (error: any) {
    return { status: false, message: error.message || 'Lỗi khi cập nhật bình luận' };
  }
};

export const deleteComment = async (commentId: number) => {
  try {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  } catch (error: any) {
    return { status: false, message: error.message || 'Lỗi khi xóa bình luận' };
  }
};

// Notifications APIs
export const fetchAdminNotifications = async () => {
  try {
    const response = await api.get('/admin/notifications');
    return response.data;
  } catch (error: any) {
    return [];
  }
};

export const fetchLatestNotification = async () => {
  try {
    const response = await api.get('/notifications/latest');
    return response.data;
  } catch (error: any) {
    return null;
  }
};

export const fetchNotification = async (id: number) => {
  try {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  } catch (error: any) {
    return null;
  }
};

export const createNotification = async (data: {
  title: string;
  content: string;
  isActive: boolean;
}) => {
  try {
    const response = await api.post('/admin/notifications', data);
    return response.data;
  } catch (error: any) {
    return { status: false, message: error.message || 'Lỗi khi tạo thông báo' };
  }
};

export const updateNotification = async (id: number, data: {
  title: string;
  content: string;
  isActive?: boolean;
}) => {
  try {
    const response = await api.put(`/admin/notifications/${id}`, data);
    return response.data;
  } catch (error: any) {
    return { status: false, message: error.message || 'Lỗi khi cập nhật thông báo' };
  }
};

export const toggleNotificationStatus = async (id: number) => {
  try {
    const response = await api.patch(`/admin/notifications/${id}/toggle`);
    return response.data;
  } catch (error: any) {
    return { status: false, message: error.message || 'Lỗi khi thay đổi trạng thái thông báo' };
  }
};

export const deleteNotification = async (id: number) => {
  try {
    const response = await api.delete(`/admin/notifications/${id}`);
    return response.data;
  } catch (error: any) {
    return { status: false, message: error.message || 'Lỗi khi xóa thông báo' };
  }
};

// Movie Views APIs
export const fetchTrendingMovies = async (limit: number = 10) => {
  try {
    const response = await api.get('/movies/trending', { params: { limit } });
    return response.data;
  } catch (error: any) {
    return { status: false, items: [] };
  }
};

// Lấy phim thịnh hành hôm nay
export const fetchTrendingTodayMovies = async (limit: number = 10) => {
  try {
    const response = await api.get('/movies/trending-today', { params: { limit } });
    return response.data;
  } catch (error: any) {
    return { status: false, items: [] };
  }
};



export const incrementMovieViewCount = async (slug: string) => {
  try {
    const response = await api.post(`/movie/${slug}/view`);
    return response.data;
  } catch (error: any) {
    return { status: false, message: error.message || 'Lỗi khi tăng lượt xem phim' };
  }
};

export const getMovieViewCount = async (slug: string) => {
  try {
    const response = await api.get(`/movie/${slug}/views`);
    return response.data;
  } catch (error: any) {
    return { status: false, viewCount: 0 };
  }
};

// Phim đề xuất tương tự
export const fetchSimilarMovies = async (slug: string, limit: number = 8) => {
  try {
    const response = await api.get(`/movie/${slug}/similar`, { params: { limit } });
    return response.data;
  } catch (error: any) {
    return { status: false, items: [] };
  }
};
