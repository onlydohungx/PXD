import { Request, Response, Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import axios from "axios";
import { 
  analyzeUserPreferences, 
  findSimilarMovies, 
  generatePreferenceDescription, 
  fetchMoviesByPreferences 
} from "../huggingface";

// API đường dẫn cơ sở cho việc lấy phim theo thể loại
const CATEGORY_API_BASE_URL = "https://phimapi.com/v1/api/the-loai";
const COUNTRY_API_BASE_URL = "https://phimapi.com/v1/api/quoc-gia";

export function setupAIRecommendationsRoutes(app: Express) {
  // API để cập nhật thói quen xem phim của người dùng
  app.post("/api/user/preferences/update", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { movieSlug, categories, country } = req.body;
      
      if (!movieSlug || !categories || !Array.isArray(categories)) {
        return res.status(400).json({ error: "Dữ liệu không hợp lệ" });
      }
      
      const updatedPreferences = await storage.updateUserPreferences(userId, {
        movieSlug,
        categories,
        country
      });
      
      res.json(updatedPreferences);
    } catch (error) {
      console.error("Lỗi khi cập nhật thói quen xem phim:", error);
      res.status(500).json({ error: "Đã xảy ra lỗi khi cập nhật thói quen xem phim" });
    }
  });
  
  // API để lấy thể loại phim yêu thích của người dùng
  app.get("/api/user/preferences/categories", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const topCategories = await storage.getTopUserCategories(userId, 5);
      res.json(topCategories);
    } catch (error) {
      console.error("Lỗi khi lấy thể loại phim yêu thích:", error);
      res.status(500).json({ error: "Đã xảy ra lỗi khi lấy thể loại phim yêu thích" });
    }
  });
  
  // API để lấy quốc gia phim yêu thích của người dùng
  app.get("/api/user/preferences/countries", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const topCountries = await storage.getTopUserCountries(userId, 3);
      res.json(topCountries);
    } catch (error) {
      console.error("Lỗi khi lấy quốc gia phim yêu thích:", error);
      res.status(500).json({ error: "Đã xảy ra lỗi khi lấy quốc gia phim yêu thích" });
    }
  });
  
  // API để AI phân tích sở thích người dùng (mới)
  app.get("/api/user/preferences/analyze", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      
      // Lấy dữ liệu về thói quen xem phim
      const preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        return res.json({
          preferredCategories: [],
          preferredCountries: [],
          confidenceScore: 0,
          description: "Chưa có dữ liệu về sở thích xem phim của bạn."
        });
      }
      
      // Lấy danh sách thể loại và quốc gia từ API
      const [categoriesResponse, countriesResponse] = await Promise.all([
        axios.get('/api/categories'),
        axios.get('/api/countries')
      ]);
      
      const categoryInfo = categoriesResponse.data || [];
      const countryInfo = countriesResponse.data || [];
      
      // Phân tích sở thích bằng Hugging Face
      const { 
        preferredCategories, 
        preferredCountries, 
        confidenceScore 
      } = await analyzeUserPreferences({
        categories: preferences?.categories || {},
        countries: preferences?.countries || {}
      }, categoryInfo, countryInfo);
      
      // Tạo danh sách đầy đủ thể loại và quốc gia
      const categoriesArray = Object.entries(preferences.categories || {})
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);
      
      const countriesArray = Object.entries(preferences.countries || {})
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);
      
      // Tạo mô tả sở thích người dùng
      const description = await generatePreferenceDescription(
        categoriesArray.slice(0, 3), 
        countriesArray.slice(0, 2)
      );
      
      res.json({
        preferredCategories,
        preferredCountries,
        confidenceScore,
        description,
        categories: categoriesArray,
        countries: countriesArray
      });
    } catch (error) {
      console.error("Lỗi khi phân tích sở thích xem phim:", error);
      res.status(500).json({ error: "Đã xảy ra lỗi khi phân tích sở thích xem phim" });
    }
  });
  
  // API để tạo đề xuất phim mới cho người dùng
  app.post("/api/user/recommendations/generate", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      
      // Đánh dấu các đề xuất cũ là đã xem
      await storage.markRecommendationsAsViewed(userId);
      
      // Phân tích sở thích người dùng bằng AI
      const preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        // Tạo đề xuất mặc định nếu không có dữ liệu
        const newRecommendations = await storage.generateRecommendations(userId);
        return res.json(newRecommendations);
      }
      
      // Lấy danh sách thể loại và quốc gia từ API
      const [categoriesResponse, countriesResponse] = await Promise.all([
        axios.get('/api/categories'),
        axios.get('/api/countries')
      ]);
      
      const categoryInfo = categoriesResponse.data || [];
      const countryInfo = countriesResponse.data || [];
      
      // Phân tích sở thích bằng Hugging Face
      const { 
        preferredCategories, 
        preferredCountries, 
        confidenceScore 
      } = await analyzeUserPreferences({
        categories: preferences?.categories || {},
        countries: preferences?.countries || {}
      }, categoryInfo, countryInfo);
      
      // Tạo đề xuất mới với thông tin từ AI
      const newRecommendations = await storage.generateRecommendationsWithData(
        userId, 
        preferredCategories, 
        preferredCountries, 
        confidenceScore
      );
      
      res.json(newRecommendations);
    } catch (error) {
      console.error("Lỗi khi tạo đề xuất phim:", error);
      res.status(500).json({ error: "Đã xảy ra lỗi khi tạo đề xuất phim" });
    }
  });

  // API để lấy đề xuất phim hiện tại cho người dùng
  app.get("/api/user/recommendations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      
      // Lấy thông tin lịch sử xem phim
      const watchHistory = await storage.getWatchHistory(userId);
      
      // Lấy thông tin chi tiết từ phim đã xem gần đây nhất (nếu có)
      let recentMovie = null;
      if (watchHistory && watchHistory.length > 0) {
        try {
          // Sắp xếp lịch sử xem theo thời gian mới nhất
          const sortedHistory = [...watchHistory].sort((a, b) => 
            new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
          );
          
          // Lấy thông tin phim đã xem gần đây nhất
          const latestMovie = sortedHistory[0];
          console.log(`Tìm thông tin phim gần đây nhất: ${latestMovie.movieSlug}`);
          
          const movieResponse = await axios.get(`https://phimapi.com/phim/${latestMovie.movieSlug}`);
          if (movieResponse.data && movieResponse.data.status && movieResponse.data.movie) {
            recentMovie = movieResponse.data.movie;
          }
        } catch (error) {
          console.error('Error fetching recent movie details:', error);
        }
      }
      
      // Tìm đề xuất hiện tại
      let recommendations = await storage.getUserRecommendations(userId);
      
      // Nếu không có đề xuất hoặc đề xuất đã được xem, tạo mới
      if (!recommendations) {
        // Tạo đề xuất mới với AI
        try {
          // Lấy danh sách thể loại và quốc gia từ API
          const [categoriesResponse, countriesResponse] = await Promise.all([
            axios.get('/api/categories'),
            axios.get('/api/countries')
          ]);
          
          const categoryInfo = categoriesResponse.data || [];
          const countryInfo = countriesResponse.data || [];
          
          // Lấy thông tin sở thích người dùng
          const preferences = await storage.getUserPreferences(userId);
          
          // Xử lý nếu đã có phim gần đây
          if (recentMovie) {
            console.log(`Sử dụng thông tin từ phim gần đây: ${recentMovie.name}`);
            
            // Lấy thể loại từ phim gần đây
            const recentCategories = recentMovie.category ? 
              recentMovie.category.map((c: any) => c.slug) : [];
            
            // Lấy quốc gia từ phim gần đây
            const recentCountries = recentMovie.country ? 
              recentMovie.country.map((c: any) => c.slug) : [];
              
            // Tạo đề xuất dựa trên phim gần đây
            recommendations = await storage.generateRecommendationsWithData(
              userId,
              recentCategories.length > 0 ? recentCategories : ['hanh-dong'],
              recentCountries.length > 0 ? recentCountries : ['han-quoc'],
              80 // Tin cậy cao vì dựa trên phim đã xem
            );
          }
          // Nếu không có phim gần đây nhưng có dữ liệu sở thích
          else if (preferences && Object.keys(preferences.categories || {}).length > 0) {
            // Phân tích sở thích bằng Hugging Face
            const { 
              preferredCategories, 
              preferredCountries, 
              confidenceScore 
            } = await analyzeUserPreferences({
              categories: preferences.categories || {},
              countries: preferences.countries || {}
            }, categoryInfo, countryInfo);
            
            // Đảm bảo luôn có thể loại và quốc gia
            let finalCategories = preferredCategories && preferredCategories.length > 0 ? 
              preferredCategories : ['hanh-dong'];
            
            let finalCountries = preferredCountries && preferredCountries.length > 0 ? 
              preferredCountries : ['han-quoc'];
            
            // Tạo đề xuất mới với thông tin từ AI
            recommendations = await storage.generateRecommendationsWithData(
              userId, 
              finalCategories, 
              finalCountries, 
              confidenceScore || 70
            );
          } else {
            // Tạo đề xuất mặc định nếu không có dữ liệu
            recommendations = await storage.generateRecommendationsWithData(
              userId, 
              ['hanh-dong', 'tinh-cam'], 
              ['han-quoc', 'my'], 
              50
            );
          }
        } catch (aiError) {
          console.error("Lỗi khi sử dụng AI để tạo đề xuất:", aiError);
          // Sử dụng phương pháp đơn giản nếu có lỗi
          recommendations = await storage.generateRecommendationsWithData(
            userId, 
            ['hanh-dong', 'tinh-cam'], 
            ['han-quoc', 'my'], 
            50
          );
        }
      }
      
      // Chuẩn bị kết quả trả về
      const movieResults = {
        basedOnCategories: recommendations?.basedOnCategories || [],
        basedOnCountries: recommendations?.basedOnCountries || [],
        confidenceScore: recommendations?.confidenceScore || 0,
        recentMovieInfo: recentMovie ? {
          name: recentMovie.name,
          slug: recentMovie.slug,
          categories: recentMovie.category ? recentMovie.category.map((c: any) => c.name) : [],
          countries: recentMovie.country ? recentMovie.country.map((c: any) => c.name) : []
        } : null,
        movies: [] as any[],
        similarTitles: [] as string[]
      };
      
      // Đảm bảo luôn có thể loại và quốc gia trong đề xuất
      if (!movieResults.basedOnCategories || movieResults.basedOnCategories.length === 0) {
        movieResults.basedOnCategories = ['hanh-dong'];
      }
      
      if (!movieResults.basedOnCountries || movieResults.basedOnCountries.length === 0) {
        movieResults.basedOnCountries = ['han-quoc'];
      }
      
      try {
        // Sử dụng thể loại và quốc gia từ phim gần đây nếu có
        let categorySlug = movieResults.basedOnCategories[0];
        let countrySlug = movieResults.basedOnCountries[0];
        
        // Nếu có phim gần đây, ưu tiên dùng thông tin từ phim đó
        if (recentMovie && recentMovie.category && recentMovie.category.length > 0) {
          categorySlug = recentMovie.category[0].slug;
        }
        
        if (recentMovie && recentMovie.country && recentMovie.country.length > 0) {
          countrySlug = recentMovie.country[0].slug;
        }
        
        console.log(`AI tìm phim thể loại ${categorySlug} của quốc gia ${countrySlug}`);
        const movies = await fetchMoviesByPreferences(categorySlug, countrySlug);
        
        if (movies && movies.length > 0) {
          console.log(`AI tìm thấy ${movies.length} phim phù hợp`);
          movieResults.movies = movies;
        } else {
          console.log("Không tìm thấy phim phù hợp, tìm theo thể loại/quốc gia khác");
          
          // Thử tìm theo thể loại/quốc gia khác
          for (const catSlug of movieResults.basedOnCategories) {
            for (const countSlug of movieResults.basedOnCountries) {
              if (catSlug !== categorySlug || countSlug !== countrySlug) {
                const altMovies = await fetchMoviesByPreferences(catSlug, countSlug);
                if (altMovies && altMovies.length > 0) {
                  console.log(`Tìm thấy phim với thể loại ${catSlug} và quốc gia ${countSlug}`);
                  movieResults.movies = altMovies;
                  break;
                }
              }
            }
            if (movieResults.movies.length > 0) break;
          }
          
          // Nếu vẫn không tìm thấy, sử dụng phim trending
          if (movieResults.movies.length === 0) {
            console.log("Sử dụng phim trending làm đề xuất");
            const trendingResponse = await axios.get("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3", {
              params: {
                page: 1,
                limit: 8,
                sort_field: 'view_total',
                sort_type: 'desc'
              }
            });
            
            if (trendingResponse.data && trendingResponse.data.status && trendingResponse.data.items) {
              movieResults.movies = trendingResponse.data.items;
            }
          }
        }
      } catch (aiError) {
        console.error("Lỗi khi sử dụng AI để tìm phim:", aiError);
        
        // Nếu có lỗi, lấy phim trending làm fallback
        try {
          console.log("Sử dụng phim trending làm fallback do lỗi");
          const trendingResponse = await axios.get("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3", {
            params: {
              page: 1,
              limit: 8,
              sort_field: 'view_total',
              sort_type: 'desc'
            }
          });
          
          if (trendingResponse.data && trendingResponse.data.status && trendingResponse.data.items) {
            movieResults.movies = trendingResponse.data.items;
          }
        } catch (fallbackError) {
          console.error("Lỗi khi lấy phim trending làm fallback:", fallbackError);
        }
      }
      
      // Cập nhật tìm kiếm phim tương tự cho từng phim đề xuất (nếu có đủ dữ liệu)
      if (movieResults.movies.length > 0 && recommendations?.basedOnCategories?.length > 0) {
        try {
          // Lấy phim đầu tiên là phim chính
          const mainMovie = movieResults.movies[0];
          const mainGenre = recommendations.basedOnCategories[0];
          
          // Tìm phim tương tự cho phim chính
          const similarMovieTitles = await findSimilarMovies(mainMovie.name, mainGenre);
          
          // Thêm thông tin này vào kết quả
          if (similarMovieTitles && similarMovieTitles.length > 0) {
            movieResults.similarTitles = similarMovieTitles;
          }
        } catch (similarError) {
          console.error("Lỗi khi tìm phim tương tự:", similarError);
        }
      }
      
      res.json(movieResults);
    } catch (error) {
      console.error("Lỗi khi lấy đề xuất phim:", error);
      res.status(500).json({ error: "Đã xảy ra lỗi khi lấy đề xuất phim" });
    }
  });
  
  // API để đánh dấu đề xuất phim đã xem
  app.post("/api/user/recommendations/viewed", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      await storage.markRecommendationsAsViewed(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Lỗi khi đánh dấu đề xuất phim đã xem:", error);
      res.status(500).json({ error: "Đã xảy ra lỗi khi đánh dấu đề xuất phim đã xem" });
    }
  });
  
  // API để lấy cả thể loại và quốc gia yêu thích của người dùng
  app.get("/api/user/preferences", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        return res.json({
          categories: [],
          countries: []
        });
      }
      
      // Chuyển đổi từ đối tượng JSON thành mảng sắp xếp theo số lần xem
      const categoriesArray = Object.entries(preferences.categories || {})
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);
      
      const countriesArray = Object.entries(preferences.countries || {})
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);
      
      res.json({
        categories: categoriesArray,
        countries: countriesArray
      });
    } catch (error) {
      console.error("Lỗi khi lấy thói quen xem phim:", error);
      res.status(500).json({ error: "Đã xảy ra lỗi khi lấy thói quen xem phim" });
    }
  });

  // API để cập nhật thói quen xem phim dựa trên phim đã xem
  app.post("/api/user/watch-history/:movieSlug/analyze", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { movieSlug } = req.params;
      const { categories, country } = req.body;
      
      if (!categories || !Array.isArray(categories)) {
        return res.status(400).json({ error: "Dữ liệu thể loại không hợp lệ" });
      }
      
      // Cập nhật thói quen xem phim
      const updatedPreferences = await storage.updateUserPreferences(userId, {
        movieSlug,
        categories,
        country
      });
      
      res.json({
        success: true,
        preferences: updatedPreferences
      });
    } catch (error) {
      console.error("Lỗi khi phân tích thói quen xem phim:", error);
      res.status(500).json({ error: "Đã xảy ra lỗi khi phân tích thói quen xem phim" });
    }
  });
  
  // API tìm phim tương tự (mới)
  app.get("/api/movies/:movieSlug/similar", async (req: Request, res: Response) => {
    try {
      const { movieSlug } = req.params;
      const { genre } = req.query as { genre?: string };
      
      if (!movieSlug) {
        return res.status(400).json({ error: "Thiếu thông tin phim" });
      }
      
      // Lấy thông tin phim
      try {
        const movieResponse = await axios.get(`https://phimapi.com/phim/${movieSlug}`);
        if (!movieResponse.data || !movieResponse.data.status) {
          return res.status(404).json({ error: "Không tìm thấy phim" });
        }
        
        const movie = movieResponse.data.movie;
        const movieTitle = movie.name;
        const movieGenre = genre || (movie.category && movie.category.length > 0 
          ? movie.category[0].name : "");
        
        if (!movieTitle || !movieGenre) {
          return res.status(400).json({ error: "Thiếu thông tin phim để tìm kiếm" });
        }
        
        // Tìm phim tương tự bằng AI
        const similarMovies = await findSimilarMovies(movieTitle, movieGenre);
        
        res.json({
          status: true,
          movieTitle,
          genre: movieGenre,
          similarTitles: similarMovies
        });
      } catch (error) {
        console.error("Lỗi khi lấy thông tin phim:", error);
        res.status(500).json({ error: "Không thể lấy thông tin phim" });
      }
    } catch (error) {
      console.error("Lỗi khi tìm phim tương tự:", error);
      res.status(500).json({ error: "Đã xảy ra lỗi khi tìm phim tương tự" });
    }
  });
}

// Hàm phụ trợ để lấy phim bằng phương pháp cũ
async function fetchMoviesUsingLegacyMethod(
  recommendations: { basedOnCategories: string[]; basedOnCountries: string[] },
  movieResults: { movies: any[] }
) {
  let foundMovies = false;
  
  // Thử kết hợp thể loại và quốc gia (ưu tiên cao nhất)
  if (recommendations.basedOnCategories.length > 0 && recommendations.basedOnCountries.length > 0) {
    const categorySlug = recommendations.basedOnCategories[0];
    const countrySlug = recommendations.basedOnCountries[0];
    
    console.log(`Tìm phim thể loại ${categorySlug} của quốc gia ${countrySlug}`);
    
    try {
      // Lấy tất cả phim thuộc thể loại ưa thích
      const categoryResponse = await axios.get(`${CATEGORY_API_BASE_URL}/${categorySlug}`, {
        params: {
          page: 1,
          limit: 20, // Lấy nhiều hơn để lọc
          sort_field: "view_total",
          sort_type: "desc"
        }
      });
      
      if (categoryResponse.data && categoryResponse.data.status && categoryResponse.data.items) {
        // Lọc phim có quốc gia phù hợp
        const filteredMovies = categoryResponse.data.items.filter((movie: any) => {
          return movie.country && 
                 movie.country.some((c: any) => c.slug === countrySlug);
        });
        
        // Nếu có phim phù hợp, sử dụng chúng
        if (filteredMovies.length > 0) {
          console.log(`Tìm thấy ${filteredMovies.length} phim thể loại ${categorySlug} của quốc gia ${countrySlug}`);
          movieResults.movies = filteredMovies.slice(0, 8);
          foundMovies = true;
        }
      }
    } catch (error) {
      console.error(`Lỗi khi tìm phim kết hợp thể loại và quốc gia:`, error);
    }
  }
  
  // Nếu không tìm thấy phim kết hợp, thử lấy theo thể loại
  if (!foundMovies && recommendations.basedOnCategories.length > 0) {
    // Lặp qua tất cả các thể loại ưa thích
    for (const categorySlug of recommendations.basedOnCategories) {
      if (foundMovies) break;
      
      console.log(`Lấy phim theo thể loại: ${categorySlug}`);
      
      try {
        const response = await axios.get(`${CATEGORY_API_BASE_URL}/${categorySlug}`, {
          params: {
            page: 1,
            limit: 10,
            sort_field: "view_total",
            sort_type: "desc"
          }
        });
        
        if (response.data && response.data.status && response.data.items && response.data.items.length > 0) {
          movieResults.movies = response.data.items.slice(0, 8);
          foundMovies = true;
          break;
        }
      } catch (error) {
        console.error(`Lỗi khi lấy phim theo thể loại ${categorySlug}:`, error);
      }
    }
  }
  
  // Nếu vẫn không tìm thấy, thử lấy theo quốc gia
  if (!foundMovies && recommendations.basedOnCountries.length > 0) {
    // Lặp qua tất cả các quốc gia ưa thích
    for (const countrySlug of recommendations.basedOnCountries) {
      if (foundMovies) break;
      
      console.log(`Lấy phim theo quốc gia: ${countrySlug}`);
      
      try {
        const response = await axios.get(`${COUNTRY_API_BASE_URL}/${countrySlug}`, {
          params: {
            page: 1,
            limit: 10,
            sort_field: "view_total", 
            sort_type: "desc"
          }
        });
        
        if (response.data && response.data.status && response.data.items && response.data.items.length > 0) {
          movieResults.movies = response.data.items.slice(0, 8);
          foundMovies = true;
          break;
        }
      } catch (error) {
        console.error(`Lỗi khi lấy phim theo quốc gia ${countrySlug}:`, error);
      }
    }
  }
  
  // Nếu không có phim nào được tìm thấy sau tất cả các phương pháp, sử dụng danh sách phim trending
  if (!foundMovies || movieResults.movies.length === 0) {
    console.log("Không tìm thấy phim đề xuất phù hợp, sử dụng phim trending");
    
    try {
      const response = await axios.get("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3", {
        params: {
          page: 1,
          limit: 8,
          sort_field: "view_total",
          sort_type: "desc"
        }
      });
      
      if (response.data && response.data.status && response.data.items) {
        movieResults.movies = response.data.items;
      }
    } catch (error) {
      console.error("Lỗi khi lấy phim trending:", error);
    }
  }
}