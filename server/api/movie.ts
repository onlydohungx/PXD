import { Express, Request, Response } from "express";
import axios from 'axios';
import { storage } from '../storage';
import { isAuthenticated } from '../auth';
import { cachedGet, CacheType } from '../cache';

// Hàm tiện ích để lọc phim theo loại (series/single)
function filterMoviesByType(movies: any[], type: string | undefined) {
  if (!type || (type !== 'series' && type !== 'single')) {
    return movies;
  }
  
  console.log(`Lọc danh sách ${movies.length} phim theo loại: ${type}`);
  
  const filteredMovies = movies.filter((movie: any) => {
    // Kiểm tra loại phim (phim bộ hoặc phim lẻ)
    const isSeriesMovie = movie.episode_current && movie.episode_current !== "Full"; // Nếu có số tập và không phải "Full" thì là phim bộ
    
    if (type === 'series') {
      return isSeriesMovie; // Giữ lại các phim bộ
    } else if (type === 'single') {
      return !isSeriesMovie; // Giữ lại các phim lẻ
    }
    return true;
  });
  
  console.log(`Kết quả sau khi lọc: ${filteredMovies.length} phim`);
  return filteredMovies;
}

export function setupMovieRoutes(app: Express) {

  // API để lấy danh sách phim được xem nhiều nhất trong ngày (Trending Today)
  app.get('/api/movies/trending-today', async (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query;
      const limitNum = typeof limit === 'string' ? parseInt(limit) : 10;
      
      // Lấy danh sách phim được xem nhiều nhất trong ngày hôm nay từ cơ sở dữ liệu
      const trendingMoviesToday = await storage.getTopViewedMoviesToday(limitNum);
      
      // Nếu có dữ liệu trong database thì xử lý và trả về
      if (trendingMoviesToday && trendingMoviesToday.length > 0) {
        // Lấy thông tin chi tiết của các phim từ API với cache
        const moviePromises = trendingMoviesToday.map(async (movie) => {
          try {
            const response = await cachedGet(`https://phimapi.com/phim/${movie.movieSlug}`, {}, false, CacheType.DETAIL);
            
            if (response.data && response.data.movie) {
              const baseCdnUrl = "https://phimimg.com/";
              const movieData = response.data.movie;
              
              // Xử lý poster_url
              if (movieData.poster_url && 
                  !movieData.poster_url.startsWith("http") && 
                  !movieData.poster_url.startsWith("https")) {
                movieData.poster_url = baseCdnUrl + movieData.poster_url;
              }
              
              // Xử lý thumb_url
              if (movieData.thumb_url && 
                  !movieData.thumb_url.startsWith("http") && 
                  !movieData.thumb_url.startsWith("https")) {
                movieData.thumb_url = baseCdnUrl + movieData.thumb_url;
              }
              
              // Thêm thông tin lượt xem trong ngày
              movieData.dailyViewCount = movie.viewCount;
              
              return movieData;
            }
            return null;
          } catch (error) {
            console.error(`Error fetching details for trending today movie ${movie.movieSlug}:`, error);
            return null;
          }
        });
        
        const movieDetails = await Promise.all(moviePromises);
        const validMovies = movieDetails.filter(movie => movie !== null);
        
        res.json({
          status: true,
          items: validMovies
        });
      } else {
        // Nếu không có dữ liệu trong database, lấy trực tiếp từ API movies mới nhất
        console.log("Không tìm thấy dữ liệu trending today từ DB, lấy từ API...");
        
        // Lấy dữ liệu từ API /api/movies với cache
        const response = await cachedGet('https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3', {
          params: {
            page: 1,
            limit: limitNum,
            sort_field: 'modified_time',  // Sort theo thời gian cập nhật
            sort_type: 'desc'          // Giảm dần
          }
        }, false, CacheType.MOVIE);
        
        if (response.data && response.data.items && Array.isArray(response.data.items)) {
          const baseCdnUrl = "https://phimimg.com/";
          
          // Xử lý URL cho ảnh
          const processedItems = response.data.items.map((item: any) => {
            // Xử lý poster_url
            if (item.poster_url && 
                !item.poster_url.startsWith("http") && 
                !item.poster_url.startsWith("https")) {
              item.poster_url = baseCdnUrl + item.poster_url;
            }
            
            // Xử lý thumb_url
            if (item.thumb_url && 
                !item.thumb_url.startsWith("http") && 
                !item.thumb_url.startsWith("https")) {
              item.thumb_url = baseCdnUrl + item.thumb_url;
            }
            
            // Thêm dailyViewCount giả lập (thực tế dữ liệu này sẽ được cập nhật từ người dùng)
            return {
              ...item,
              dailyViewCount: Math.floor(Math.random() * 50) + 10
            };
          });
          
          return res.json({
            status: true,
            items: processedItems
          });
        }
        
        // Trường hợp không lấy được dữ liệu từ API
        return res.json({
          status: true,
          items: []
        });
      }
    } catch (error) {
      console.error('Error fetching trending today movies:', error);
      res.status(500).json({
        status: false,
        message: 'Failed to fetch trending today movies',
        items: []
      });
    }
  });

  // API để lấy danh sách phim được xem nhiều nhất tổng thể
  app.get('/api/movies/trending', async (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query;
      const limitNum = typeof limit === 'string' ? parseInt(limit) : 10;
      
      // Lấy danh sách phim được xem nhiều nhất từ cơ sở dữ liệu
      const trendingMovies = await storage.getTopViewedMovies(limitNum);
      
      // Nếu có dữ liệu trong database thì xử lý và trả về
      if (trendingMovies && trendingMovies.length > 0) {
        // Lấy thông tin chi tiết của các phim từ API với cache
        const moviePromises = trendingMovies.map(async (movie) => {
          try {
            const response = await cachedGet(`https://phimapi.com/phim/${movie.movieSlug}`, {}, false, CacheType.DETAIL);
            
            if (response.data && response.data.movie) {
              const baseCdnUrl = "https://phimimg.com/";
              const movieData = response.data.movie;
              
              // Xử lý poster_url
              if (movieData.poster_url && 
                  !movieData.poster_url.startsWith("http") && 
                  !movieData.poster_url.startsWith("https")) {
                movieData.poster_url = baseCdnUrl + movieData.poster_url;
              }
              
              // Xử lý thumb_url
              if (movieData.thumb_url && 
                  !movieData.thumb_url.startsWith("http") && 
                  !movieData.thumb_url.startsWith("https")) {
                movieData.thumb_url = baseCdnUrl + movieData.thumb_url;
              }
              
              // Thêm thông tin lượt xem
              movieData.viewCount = movie.viewCount;
              
              return movieData;
            }
            return null;
          } catch (error) {
            console.error(`Error fetching details for trending movie ${movie.movieSlug}:`, error);
            return null;
          }
        });
        
        const movieDetails = await Promise.all(moviePromises);
        const validMovies = movieDetails.filter(movie => movie !== null);
        
        res.json({
          status: true,
          items: validMovies
        });
      } else {
        // Nếu không có dữ liệu trong database, lấy trực tiếp từ API movies với sort=view_total
        console.log("Không tìm thấy dữ liệu trending từ DB, lấy từ API...");
        
        // Lấy dữ liệu từ API /api/movies với cache
        const response = await cachedGet('https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3', {
          params: {
            page: 1,
            limit: limitNum,
            sort_field: 'view_total',  // Sort theo lượt xem
            sort_type: 'desc'          // Giảm dần
          }
        }, false, CacheType.MOVIE);
        
        if (response.data && response.data.items && Array.isArray(response.data.items)) {
          const baseCdnUrl = "https://phimimg.com/";
          
          // Xử lý URL cho ảnh
          const processedItems = response.data.items.map((item: any) => {
            // Xử lý poster_url
            if (item.poster_url && 
                !item.poster_url.startsWith("http") && 
                !item.poster_url.startsWith("https")) {
              item.poster_url = baseCdnUrl + item.poster_url;
            }
            
            // Xử lý thumb_url
            if (item.thumb_url && 
                !item.thumb_url.startsWith("http") && 
                !item.thumb_url.startsWith("https")) {
              item.thumb_url = baseCdnUrl + item.thumb_url;
            }
            
            // Thêm viewCount giả lập (thực tế dữ liệu này sẽ được cập nhật từ người dùng)
            return {
              ...item,
              viewCount: Math.floor(Math.random() * 1000) + 100
            };
          });
          
          return res.json({
            status: true,
            items: processedItems
          });
        }
        
        // Trường hợp không lấy được dữ liệu từ API
        return res.json({
          status: true,
          items: []
        });
      }
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      res.status(500).json({
        status: false,
        message: 'Failed to fetch trending movies',
        items: []
      });
    }
  });
  
  // API để tăng lượt xem cho phim
  app.post('/api/movie/:slug/view', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      if (!slug) {
        return res.status(400).json({
          status: false,
          message: 'Movie slug is required'
        });
      }
      
      // Tăng lượt xem cho phim (tổng hợp)
      const movieView = await storage.incrementMovieViewCount(slug);
      
      // Tăng lượt xem cho phim theo ngày (hôm nay)
      const dailyView = await storage.incrementDailyMovieViewCount(slug);
      
      res.json({
        status: true,
        message: 'View count incremented successfully',
        viewCount: movieView.viewCount,
        dailyViewCount: dailyView.viewCount
      });
    } catch (error) {
      console.error(`Error incrementing view count for movie ${req.params.slug}:`, error);
      res.status(500).json({
        status: false,
        message: 'Failed to increment view count'
      });
    }
  });
  
  // API để lấy lượt xem của phim
  app.get('/api/movie/:slug/views', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      if (!slug) {
        return res.status(400).json({
          status: false,
          message: 'Movie slug is required'
        });
      }
      
      // Lấy lượt xem tổng của phim
      const totalViewCount = await storage.getMovieViewCount(slug);
      
      // Lấy lượt xem trong ngày hôm nay của phim
      const dailyViewCount = await storage.getDailyMovieViewCount(slug);
      
      res.json({
        status: true,
        totalViewCount,
        dailyViewCount
      });
    } catch (error) {
      console.error(`Error getting view count for movie ${req.params.slug}:`, error);
      res.status(500).json({
        status: false,
        message: 'Failed to get view count',
        totalViewCount: 0,
        dailyViewCount: 0
      });
    }
  });
  
  // API để lấy phim tương tự/đề xuất
  app.get('/api/movie/:slug/similar', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const { limit = 8 } = req.query;
      const limitNum = typeof limit === 'string' ? parseInt(limit) : 8;
      
      if (!slug) {
        return res.status(400).json({
          status: false,
          message: 'Movie slug is required',
          items: []
        });
      }
      
      // Lấy chi tiết phim để biết thể loại với cache
      const movieResponse = await cachedGet(`https://phimapi.com/phim/${slug}`, {}, false, CacheType.DETAIL);
      
      if (!movieResponse.data || !movieResponse.data.movie) {
        return res.status(404).json({
          status: false,
          message: 'Movie not found',
          items: []
        });
      }
      
      const movie = movieResponse.data.movie;
      let categoryId = '';
      
      // Lấy thể loại đầu tiên của phim làm căn cứ để tìm phim tương tự
      if (movie.category && Array.isArray(movie.category) && movie.category.length > 0) {
        categoryId = movie.category[0].id;
      }
      
      // Nếu không có thể loại, trả về danh sách trống
      if (!categoryId) {
        return res.json({
          status: true,
          items: []
        });
      }
      
      // Lấy danh sách phim theo thể loại
      const categoryUrl = `https://phimapi.com/v1/api/the-loai/${categoryId}`;
      const params = {
        page: 1,
        limit: limitNum + 1, // Lấy thêm một phim để phòng trường hợp phim hiện tại nằm trong kết quả
        sort_field: 'modified_time',
        sort_type: 'desc'
      };
      
      const categoryResponse = await cachedGet(categoryUrl, { params }, false, CacheType.CATEGORY);
      
      if (!categoryResponse.data || !categoryResponse.data.data || !categoryResponse.data.data.items) {
        return res.json({
          status: true,
          items: []
        });
      }
      
      // Xử lý URL hình ảnh và loại bỏ phim hiện tại khỏi kết quả
      const baseCdnUrl = "https://phimimg.com/";
      const processedItems = categoryResponse.data.data.items
        .filter((item: any) => item.slug !== slug) // Loại bỏ phim hiện tại
        .slice(0, limitNum) // Giới hạn số lượng phim trả về
        .map((item: any) => {
          // Xử lý poster_url
          if (item.poster_url && 
              !item.poster_url.startsWith("http") && 
              !item.poster_url.startsWith("https")) {
            item.poster_url = baseCdnUrl + item.poster_url;
          }
          
          // Xử lý thumb_url
          if (item.thumb_url && 
              !item.thumb_url.startsWith("http") && 
              !item.thumb_url.startsWith("https")) {
            item.thumb_url = baseCdnUrl + item.thumb_url;
          }
          
          return item;
        });
      
      res.json({
        status: true,
        items: processedItems
      });
    } catch (error) {
      console.error(`Error fetching similar movies for ${req.params.slug}:`, error);
      res.status(500).json({
        status: false,
        message: 'Failed to fetch similar movies',
        items: []
      });
    }
  });
  
  // API để lấy chi tiết phim
  app.get('/api/movie/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      
      // Chỉ log khi debug mode
      if (process.env.DEBUG_API) {
        console.log(`Fetching movie details for slug: ${slug}`);
        console.log(`Using API: https://phimapi.com/phim/${slug}`);
      }
      
      const response = await cachedGet(`https://phimapi.com/phim/${slug}`, {}, false, CacheType.DETAIL);
      
      // Xử lý URL hình ảnh nếu cần
      if (response.data && response.data.movie) {
        const baseCdnUrl = "https://phimimg.com/";
        const movie = response.data.movie;
        
        // Xử lý poster_url
        if (movie.poster_url && 
            !movie.poster_url.startsWith("http") && 
            !movie.poster_url.startsWith("https")) {
          movie.poster_url = baseCdnUrl + movie.poster_url;
        }
        
        // Xử lý thumb_url
        if (movie.thumb_url && 
            !movie.thumb_url.startsWith("http") && 
            !movie.thumb_url.startsWith("https")) {
          movie.thumb_url = baseCdnUrl + movie.thumb_url;
        }
      }
      
      res.json(response.data);
    } catch (error) {
      console.error(`Error fetching movie details for ${req.params.slug}:`, error);
      res.status(500).json({
        status: false, 
        message: 'Failed to fetch movie details',
        movie: null
      });
    }
  });
  
  // Cache cho danh mục
let categoriesCache: {
  data: any[] | null;
  lastFetched: number;
} = {
  data: null,
  lastFetched: 0
};

// Thời gian cache hết hạn (5 phút)
const CACHE_EXPIRY = 5 * 60 * 1000;

// Danh sách thể loại mặc định nếu API lỗi
const DEFAULT_CATEGORIES = [
  { id: "hanh-dong", name: "Hành Động", _id: "hanh-dong" },
  { id: "tinh-cam", name: "Tình Cảm", _id: "tinh-cam" },
  { id: "hai-huoc", name: "Hài Hước", _id: "hai-huoc" },
  { id: "co-trang", name: "Cổ Trang", _id: "co-trang" },
  { id: "tam-ly", name: "Tâm Lý", _id: "tam-ly" },
  { id: "hinh-su", name: "Hình Sự", _id: "hinh-su" },
  { id: "chien-tranh", name: "Chiến Tranh", _id: "chien-tranh" },
  { id: "the-thao", name: "Thể Thao", _id: "the-thao" },
  { id: "vo-thuat", name: "Võ Thuật", _id: "vo-thuat" },
  { id: "vien-tuong", name: "Viễn Tưởng", _id: "vien-tuong" },
  { id: "phieu-luu", name: "Phiêu Lưu", _id: "phieu-luu" },
  { id: "khoa-hoc", name: "Khoa Học", _id: "khoa-hoc" },
  { id: "kinh-di", name: "Kinh Dị", _id: "kinh-di" },
  { id: "am-nhac", name: "Âm Nhạc", _id: "am-nhac" },
  { id: "than-thoai", name: "Thần Thoại", _id: "than-thoai" },
  { id: "tam-linh", name: "Tâm Linh", _id: "tam-linh" },
  { id: "gia-dinh", name: "Gia Đình", _id: "gia-dinh" },
  { id: "chinh-kich", name: "Chính Kịch", _id: "chinh-kich" },
  { id: "bi-an", name: "Bí Ẩn", _id: "bi-an" },
  { id: "tieu-su", name: "Tiểu Sử", _id: "tieu-su" },
  { id: "hoat-hinh", name: "Hoạt Hình", _id: "hoat-hinh" },
  { id: "tv-show", name: "TV Show", _id: "tv-show" },
  { id: "khac", name: "Khác", _id: "khac" }
];

// API để lấy danh sách thể loại với cache tối ưu
app.get('/api/categories', async (req, res) => {
  try {
    const response = await cachedGet('https://phimapi.com/the-loai', {
      timeout: 5000
    }, false, CacheType.CATEGORY);
    
    if (response.data && Array.isArray(response.data)) {
      res.json(response.data);
    } else {
      console.error('Invalid response format from categories API');
      res.json(DEFAULT_CATEGORIES);
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.json(DEFAULT_CATEGORIES);
  }
});
  
  // Cache cho countries đã được chuyển vào cache.ts

  // Danh sách quốc gia mặc định nếu API lỗi
  const DEFAULT_COUNTRIES = [
    { id: "viet-nam", name: "Việt Nam", _id: "viet-nam" },
    { id: "trung-quoc", name: "Trung Quốc", _id: "trung-quoc" },
    { id: "han-quoc", name: "Hàn Quốc", _id: "han-quoc" },
    { id: "nhat-ban", name: "Nhật Bản", _id: "nhat-ban" },
    { id: "thai-lan", name: "Thái Lan", _id: "thai-lan" },
    { id: "an-do", name: "Ấn Độ", _id: "an-do" },
    { id: "my", name: "Mỹ", _id: "my" },
    { id: "au-my", name: "Âu Mỹ", _id: "au-my" },
    { id: "chau-a", name: "Châu Á", _id: "chau-a" },
    { id: "anh", name: "Anh", _id: "anh" },
    { id: "phap", name: "Pháp", _id: "phap" },
    { id: "khac", name: "Khác", _id: "khac" }
  ];

  // API để lấy danh sách quốc gia với cache tối ưu
  app.get('/api/countries', async (req, res) => {
    try {
      const response = await cachedGet('https://phimapi.com/quoc-gia', {
        timeout: 5000
      }, false, CacheType.COUNTRY);
      
      if (response.data && Array.isArray(response.data)) {
        res.json(response.data);
      } else {
        console.error('Invalid response format from countries API');
        res.json(DEFAULT_COUNTRIES);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      res.json(DEFAULT_COUNTRIES);
    }
  });
  
  // API để lấy danh sách năm
  app.get('/api/years', async (req, res) => {
    try {
      // Tạo danh sách năm từ 2025 đến 1970
      const currentYear = new Date().getFullYear();
      const years = [];
      
      for (let year = currentYear; year >= 1970; year--) {
        years.push({
          id: year.toString(),
          name: year.toString()
        });
      }
      
      res.json(years);
    } catch (error) {
      console.error('Error generating year list:', error);
      res.status(500).json({ 
        status: false, 
        message: 'Failed to generate year list' 
      });
    }
  });
  // API để lấy danh sách phim
  app.get('/api/movies', async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 24, 
        sort_field = 'modified_time', 
        sort_type = 'desc', 
        type, 
        sort_lang,
        country // Thêm tham số country
      } = req.query;
      
      // API endpoint
      const apiUrl = 'https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3';
      
      // Tham số query
      const params: any = {
        page,
        limit,
        sort_field,
        sort_type
      };
      
      // Thêm các tham số tùy chọn
      if (type) params.type = type;
      if (sort_lang) params.sort_lang = sort_lang;
      if (country && country !== "all") params.country = country;
      
      // Chỉ log khi debug mode
      if (process.env.DEBUG_API) {
        console.log('Fetching movies from API:', apiUrl);
        console.log('Params:', params);
      }
      
      const response = await cachedGet(apiUrl, { params }, false, CacheType.MOVIE);
      
      // Xử lý URL hình ảnh nếu cần
      if (response.data && response.data.items && Array.isArray(response.data.items)) {
        const baseCdnUrl = "https://phimimg.com/";
        let processedItems = response.data.items.map((item: any) => {
          // Xử lý poster_url
          if (item.poster_url && 
              !item.poster_url.startsWith("http") && 
              !item.poster_url.startsWith("https")) {
            item.poster_url = baseCdnUrl + item.poster_url;
          }
          
          // Xử lý thumb_url
          if (item.thumb_url && 
              !item.thumb_url.startsWith("http") && 
              !item.thumb_url.startsWith("https")) {
            item.thumb_url = baseCdnUrl + item.thumb_url;
          }
          
          return item;
        });
        
        // Áp dụng bộ lọc phim theo loại
        processedItems = filterMoviesByType(processedItems, type as string | undefined);
        
        response.data.items = processedItems;
      }
      
      res.json(response.data);
    } catch (error) {
      console.error('Error fetching movies:', error);
      res.status(500).json({
        status: false, 
        message: 'Failed to fetch movies',
        items: [],
        pagination: {
          current_page: 1,
          total_pages: 0
        }
      });
    }
  });
  
  // API để lấy danh sách phim theo thể loại
  app.get('/api/category/:categoryId', async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { 
        page = 1, 
        limit = 24, 
        sort_field = 'modified_time', 
        sort_type = 'desc', 
        country, 
        year,
        sort_lang,
        type
      } = req.query;
      
      if (process.env.DEBUG_API) {
        console.log(`Fetching movies for category: ${categoryId}`);
      }
      
      // URL API cho thể loại phim
      const url = `https://phimapi.com/v1/api/the-loai/${categoryId}`;
      
      // Tham số query
      const params: any = {
        page,
        limit,
        sort_field,
        sort_type
      };
      
      // Thêm các tham số tùy chọn
      if (sort_lang) params.sort_lang = sort_lang;
      if (country && country !== "all") params.country = country;
      if (year && year !== "all") params.year = year;
      if (type) {
        params.type = type; // Thêm tham số type nếu có (series hoặc single)
        if (process.env.DEBUG_API) {
          console.log(`Áp dụng bộ lọc CATEGORY theo loại phim: ${type}`);
        }
      }
      
      if (process.env.DEBUG_API) {
        console.log(`Using API: ${url} with params:`, params);
      }
      
      const response = await axios.get(url, { params });
      
      // API trả về cấu trúc phức tạp, phần dữ liệu phim nằm trong data.data.items
      if (response.data && response.data.data && response.data.data.items && Array.isArray(response.data.data.items)) {
        const baseCdnUrl = "https://phimimg.com/";
        let processedItems = response.data.data.items.map((item: any) => {
          // Xử lý poster_url
          if (item.poster_url && 
              !item.poster_url.startsWith("http") && 
              !item.poster_url.startsWith("https")) {
            item.poster_url = baseCdnUrl + item.poster_url;
          }
          
          // Xử lý thumb_url
          if (item.thumb_url && 
              !item.thumb_url.startsWith("http") && 
              !item.thumb_url.startsWith("https")) {
            item.thumb_url = baseCdnUrl + item.thumb_url;
          }
          
          return item;
        });
        
        // Áp dụng bộ lọc phim theo loại
        processedItems = filterMoviesByType(processedItems, type as string | undefined);
        
        // Trả về định dạng chuẩn cho frontend
        return res.json({
          status: true,
          items: processedItems,
          pagination: {
            current_page: response.data.data.params?.pagination?.currentPage || page,
            total_pages: response.data.data.params?.pagination?.totalPages || 1,
            total_items: response.data.data.params?.pagination?.totalItems || processedItems.length,
            per_page: response.data.data.params?.pagination?.totalItemsPerPage || limit
          }
        });
      }
      
      // Fallback nếu API trả về dữ liệu không hợp lệ
      return res.json({
        status: true,
        items: [],
        pagination: {
          current_page: page,
          total_pages: 0,
          total_items: 0,
          per_page: limit
        }
      });
    } catch (error) {
      console.error(`Error fetching movies for category:`, error);
      // Trả về dữ liệu fallback để tránh lỗi UI
      res.json({
        status: true,
        items: [],
        pagination: {
          current_page: 1,
          total_pages: 0,
          total_items: 0,
          per_page: 24
        }
      });
    }
  });
  
  // API để lấy danh sách phim theo quốc gia
  app.get('/api/country/:countryId', async (req, res) => {
    try {
      const { countryId } = req.params;
      const { 
        page = 1, 
        limit = 24, 
        sort_field = 'modified_time', 
        sort_type = 'desc', 
        category, 
        year,
        sort_lang,
        type
      } = req.query;
      
      if (process.env.DEBUG_API) {
        console.log(`Fetching movies for country: ${countryId}`);
      }
      
      // URL API cho quốc gia phim
      const url = `https://phimapi.com/v1/api/quoc-gia/${countryId}`;
      
      // Tham số query
      const params: any = {
        page,
        limit,
        sort_field,
        sort_type
      };
      
      // Thêm các tham số tùy chọn
      if (sort_lang) params.sort_lang = sort_lang;
      if (category && category !== "all") params.category = category;
      if (year && year !== "all") params.year = year;
      if (type) {
        params.type = type; // Thêm tham số type nếu có (series hoặc single)
        if (process.env.DEBUG_API) {
          console.log(`Áp dụng bộ lọc COUNTRY theo loại phim: ${type}`);
        }
      }
      
      if (process.env.DEBUG_API) {
        console.log(`Using API: ${url} with params:`, params);
      }
      
      const response = await cachedGet(url, { params }, false, CacheType.COUNTRY);
      
      // API trả về cấu trúc phức tạp, phần dữ liệu phim nằm trong data.data.items
      if (response.data && response.data.data && response.data.data.items && Array.isArray(response.data.data.items)) {
        const baseCdnUrl = "https://phimimg.com/";
        let processedItems = response.data.data.items.map((item: any) => {
          // Xử lý poster_url
          if (item.poster_url && 
              !item.poster_url.startsWith("http") && 
              !item.poster_url.startsWith("https")) {
            item.poster_url = baseCdnUrl + item.poster_url;
          }
          
          // Xử lý thumb_url
          if (item.thumb_url && 
              !item.thumb_url.startsWith("http") && 
              !item.thumb_url.startsWith("https")) {
            item.thumb_url = baseCdnUrl + item.thumb_url;
          }
          
          return item;
        });
        
        // Áp dụng bộ lọc phim theo loại
        processedItems = filterMoviesByType(processedItems, type as string | undefined);
        
        // Trả về định dạng chuẩn cho frontend
        return res.json({
          status: true,
          items: processedItems,
          pagination: {
            current_page: response.data.data.params?.pagination?.currentPage || page,
            total_pages: response.data.data.params?.pagination?.totalPages || 1,
            total_items: response.data.data.params?.pagination?.totalItems || processedItems.length,
            per_page: response.data.data.params?.pagination?.totalItemsPerPage || limit
          }
        });
      }
      
      // Fallback nếu API trả về dữ liệu không hợp lệ
      return res.json({
        status: true,
        items: [],
        pagination: {
          current_page: page,
          total_pages: 0,
          total_items: 0,
          per_page: limit
        }
      });
    } catch (error) {
      console.error(`Error fetching movies for country:`, error);
      // Trả về dữ liệu fallback để tránh lỗi UI
      res.json({
        status: true,
        items: [],
        pagination: {
          current_page: 1,
          total_pages: 0,
          total_items: 0,
          per_page: 24
        }
      });
    }
  });
  
  // API để lấy danh sách phim theo năm
  app.get('/api/year/:yearId', async (req, res) => {
    try {
      const { yearId } = req.params;
      const { 
        page = 1, 
        limit = 24, 
        sort_field = 'modified_time', 
        sort_type = 'desc', 
        category, 
        country,
        sort_lang,
        type
      } = req.query;
      
      if (process.env.DEBUG_API) {
        console.log(`Fetching movies for year: ${yearId}`);
      }
      
      // URL API cho năm phát hành
      const url = `https://phimapi.com/v1/api/nam/${yearId}`;
      
      // Tham số query
      const params: any = {
        page,
        limit,
        sort_field,
        sort_type
      };
      
      // Thêm các tham số tùy chọn
      if (sort_lang) params.sort_lang = sort_lang;
      if (category && category !== "all") params.category = category;
      if (country && country !== "all") params.country = country;
      if (type) {
        params.type = type; // Thêm tham số type nếu có (series hoặc single)
        if (process.env.DEBUG_API) {
          console.log(`Áp dụng bộ lọc YEAR theo loại phim: ${type}`);
        }
      }
      
      if (process.env.DEBUG_API) {
        console.log(`Using API: ${url} with params:`, params);
      }
      
      const response = await cachedGet(url, { params }, false, CacheType.MOVIE);
      
      // API trả về cấu trúc phức tạp, phần dữ liệu phim nằm trong data.data.items
      if (response.data && response.data.data && response.data.data.items && Array.isArray(response.data.data.items)) {
        const baseCdnUrl = "https://phimimg.com/";
        let processedItems = response.data.data.items.map((item: any) => {
          // Xử lý poster_url
          if (item.poster_url && 
              !item.poster_url.startsWith("http") && 
              !item.poster_url.startsWith("https")) {
            item.poster_url = baseCdnUrl + item.poster_url;
          }
          
          // Xử lý thumb_url
          if (item.thumb_url && 
              !item.thumb_url.startsWith("http") && 
              !item.thumb_url.startsWith("https")) {
            item.thumb_url = baseCdnUrl + item.thumb_url;
          }
          
          return item;
        });
        
        // Áp dụng bộ lọc phim theo loại
        processedItems = filterMoviesByType(processedItems, type as string | undefined);
        
        // Trả về định dạng chuẩn cho frontend
        return res.json({
          status: true,
          items: processedItems,
          pagination: {
            current_page: response.data.data.params?.pagination?.currentPage || page,
            total_pages: response.data.data.params?.pagination?.totalPages || 1,
            total_items: response.data.data.params?.pagination?.totalItems || processedItems.length,
            per_page: response.data.data.params?.pagination?.totalItemsPerPage || limit
          }
        });
      }
      
      // Fallback nếu API trả về dữ liệu không hợp lệ
      return res.json({
        status: true,
        items: [],
        pagination: {
          current_page: page,
          total_pages: 0,
          total_items: 0,
          per_page: limit
        }
      });
    } catch (error) {
      console.error(`Error fetching movies for year:`, error);
      // Trả về dữ liệu fallback để tránh lỗi UI
      res.json({
        status: true,
        items: [],
        pagination: {
          current_page: 1,
          total_pages: 0,
          total_items: 0,
          per_page: 24
        }
      });
    }
  });

  // API tìm kiếm phim
  app.get('/api/search', async (req, res) => {
    try {
      const { 
        keyword, 
        page = 1, 
        category = "all", 
        year = "all", 
        country = "all",
        sort_field = "modified_time",
        sort_type = "desc",
        sort_lang = "",
        limit = 24,
        type
      } = req.query;
      
      if (!keyword) {
        return res.json({
          status: "success",
          data: {
            items: [],
            params: {
              pagination: {
                totalItems: 0,
                totalItemsPerPage: Number(limit),
                currentPage: Number(page),
                totalPages: 0
              }
            }
          }
        });
      }
      
      if (process.env.DEBUG_API) {
        console.log(`Thực hiện tìm kiếm từ khóa: "${keyword}" với bộ lọc: { category: '${category}', year: '${year}', country: '${country}' }`);
      }
      
      // URL API tìm kiếm
      const url = `https://phimapi.com/v1/api/tim-kiem`;
      
      // Tham số query
      const params: any = {
        keyword,
        page,
        limit,
        sort_field,
        sort_type
      };
      
      // Thêm các tham số tùy chọn
      if (category && category !== "all") params.category = category;
      if (year && year !== "all") params.year = year;
      if (country && country !== "all") params.country = country;
      if (sort_lang) params.sort_lang = sort_lang;
      if (type) {
        params.type = type; // Thêm tham số type nếu có (series hoặc single)
        if (process.env.DEBUG_API) {
          console.log(`Áp dụng bộ lọc SEARCH theo loại phim: ${type}`);
        }
      }
      
      if (process.env.DEBUG_API) {
        console.log(`Sending search request to API: ${url}`, params);
      }
      
      const response = await cachedGet(url, { params }, false, CacheType.SEARCH);
      
      // API trả về cấu trúc phức tạp, phần dữ liệu phim nằm trong data.data.items
      if (response.data && response.data.data && response.data.data.items && Array.isArray(response.data.data.items)) {
        const baseCdnUrl = "https://phimimg.com/";
        let processedItems = response.data.data.items.map((item: any) => {
          // Xử lý poster_url
          if (item.poster_url && 
              !item.poster_url.startsWith("http") && 
              !item.poster_url.startsWith("https")) {
            item.poster_url = baseCdnUrl + item.poster_url;
          }
          
          // Xử lý thumb_url
          if (item.thumb_url && 
              !item.thumb_url.startsWith("http") && 
              !item.thumb_url.startsWith("https")) {
            item.thumb_url = baseCdnUrl + item.thumb_url;
          }
          
          return item;
        });
        
        // Áp dụng bộ lọc phim theo loại
        processedItems = filterMoviesByType(processedItems, type as string | undefined);
        
        // Trả về định dạng chuẩn cho frontend
        return res.json({
          status: true,
          items: processedItems,
          pagination: {
            current_page: response.data.data.params?.pagination?.currentPage || page,
            total_pages: response.data.data.params?.pagination?.totalPages || 1,
            total_items: response.data.data.params?.pagination?.totalItems || processedItems.length,
            per_page: response.data.data.params?.pagination?.totalItemsPerPage || limit
          }
        });
      }
      
      // Fallback nếu API trả về dữ liệu không hợp lệ
      return res.json({
        status: true,
        items: [],
        pagination: {
          current_page: page,
          total_pages: 0,
          total_items: 0,
          per_page: limit
        }
      });
    } catch (error) {
      console.error('Error searching movies:', error);
      res.status(500).json({
        status: false,
        message: 'Failed to search for movies',
        items: [],
        pagination: {
          current_page: 1,
          total_pages: 0,
          total_items: 0,
          per_page: 24
        }
      });
    }
  });
}
