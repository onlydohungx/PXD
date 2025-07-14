import { Express, Request, Response } from "express";
import axios from 'axios';
import { storage } from '../storage';
import { isAuthenticated } from '../auth';

// Hàm tiện ích để lọc phim theo loại (series/single)
function filterMoviesByType(movies: any[], type: string | undefined) {
  if (!type || (type !== 'series' && type !== 'single')) {
    return movies;
  }
  
  console.log(`Lọc danh sách ${movies.length} phim theo loại: ${type}`);
  
  const filteredMovies = movies.filter((movie: any) => {
    // Kiểm tra loại phim (phim bộ hoặc phim lẻ) với nhiều điều kiện hơn
    // Lưu ý rằng cấu trúc dữ liệu phim có thể khác nhau tùy nguồn
    const isSeriesMovie = (
      // Kiểm tra nếu movie.type tồn tại
      (movie.type === 'series' || movie.type === 'tv-series' || movie.type === 'hoat-hinh-bo') ||
      // Hoặc kiểm tra episode_current
      (movie.episode_current && movie.episode_current !== "Full" && movie.episode_current !== "1") ||
      // Hoặc kiểm tra số tập hiện tại
      (movie.episode_current_1 && parseInt(movie.episode_current_1) > 1) ||
      // Hoặc kiểm tra tổng số tập
      (movie.episode_total && parseInt(movie.episode_total) > 1)
    );
    
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
      // KHÔNG thêm tham số type vào API call vì API bên ngoài có thể không hiểu tham số này
      // Thay vào đó, lưu lại giá trị để lọc sau khi nhận response
      if (sort_lang) params.sort_lang = sort_lang;
      if (country && country !== "all") params.country = country;
      
      if (type) {
        console.log(`Sẽ lọc danh sách phim MOVIES theo loại: ${type} sau khi nhận dữ liệu`);
      }
      
      console.log('Fetching movies from API:', apiUrl);
      console.log('Params:', params);
      
      const response = await axios.get(apiUrl, { params });
      
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
      
      console.log(`Fetching movies for category: ${categoryId}`);
      
      // API bên ngoài sử dụng slug, không phải ID
      // Nếu categoryId là ID, hãy dùng slug từ danh sách thể loại
      let categorySlug = categoryId;
      
      // Nếu có dạng ID (mã hex dài 32 ký tự), thì cần lấy slug từ danh sách thể loại
      if (categoryId.match(/^[0-9a-f]{32}$/)) {
        try {
          // Lấy danh sách thể loại
          const categoriesResponse = await axios.get('https://phimapi.com/the-loai');
          if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
            // Tìm thể loại có _id trùng với categoryId
            const category = categoriesResponse.data.find((cat: any) => cat._id === categoryId);
            if (category && category.slug) {
              categorySlug = category.slug;
              console.log(`Found category slug ${categorySlug} for ID ${categoryId}`);
            } else {
              console.log(`Could not find category slug for ID ${categoryId}, using as is`);
              // Trả về mảng rỗng nếu không tìm thấy slug phù hợp
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
            }
          }
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      }
      
      // URL API cho thể loại phim, dùng slug thay vì ID
      const url = `https://phimapi.com/v1/api/the-loai/${categorySlug}`;
      
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
      
      // KHÔNG thêm tham số type vào API call vì API bên ngoài không hiểu tham số này
      // Điều này dẫn đến việc API trả về mảng rỗng
      // Thay vào đó, lưu lại giá trị để lọc sau khi nhận response
      if (type) {
        console.log(`Sẽ lọc danh sách phim CATEGORY theo loại: ${type} sau khi nhận dữ liệu`);
      }
      
      
      console.log(`Using API: ${url} with params:`, params);
      
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
      
      console.log(`Fetching movies for country: ${countryId}`);
      
      // API bên ngoài sử dụng slug, không phải ID
      // Nếu countryId là ID, hãy dùng slug từ danh sách thể loại
      let countrySlug = countryId;
      
      // Nếu có dạng ID (mã hex dài 32 ký tự), thì cần lấy slug từ danh sách quốc gia
      if (countryId.match(/^[0-9a-f]{32}$/)) {
        try {
          // Lấy danh sách quốc gia
          const countriesResponse = await axios.get('https://phimapi.com/quoc-gia');
          if (countriesResponse.data && Array.isArray(countriesResponse.data)) {
            // Tìm quốc gia có _id trùng với countryId
            const country = countriesResponse.data.find((c: any) => c._id === countryId);
            if (country && country.slug) {
              countrySlug = country.slug;
              console.log(`Found country slug ${countrySlug} for ID ${countryId}`);
            } else {
              console.log(`Could not find country slug for ID ${countryId}, using as is`);
              // Trả về mảng rỗng nếu không tìm thấy slug phù hợp
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
            }
          }
        } catch (error) {
          console.error('Error fetching countries:', error);
        }
      }
      
      // URL API cho quốc gia phim, dùng slug thay vì ID
      const url = `https://phimapi.com/v1/api/quoc-gia/${countrySlug}`;
      
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
      
      // KHÔNG thêm tham số type vào API call vì API bên ngoài không hiểu tham số này
      // Điều này dẫn đến việc API trả về mảng rỗng
      // Thay vào đó, lưu lại giá trị để lọc sau khi nhận response
      if (type) {
        console.log(`Sẽ lọc danh sách phim COUNTRY theo loại: ${type} sau khi nhận dữ liệu`);
      }
      
      
      console.log(`Using API: ${url} with params:`, params);
      
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
      
      console.log(`Fetching movies for year: ${yearId}`);
      
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
      
      // KHÔNG thêm tham số type vào API call vì API bên ngoài không hiểu tham số này
      // Điều này dẫn đến việc API trả về mảng rỗng
      // Thay vào đó, lưu lại giá trị để lọc sau khi nhận response
      if (type) {
        console.log(`Sẽ lọc danh sách phim YEAR theo loại: ${type} sau khi nhận dữ liệu`);
      }
      
      
      console.log(`Using API: ${url} with params:`, params);
      
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
      
      console.log(`Thực hiện tìm kiếm từ khóa: "${keyword}" với bộ lọc: { category: '${category}', year: '${year}', country: '${country}' }`);
      
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
      
      // KHÔNG thêm tham số type vào API call vì API bên ngoài không hiểu tham số này
      // Điều này dẫn đến việc API trả về mảng rỗng
      // Thay vào đó, lưu lại giá trị để lọc sau khi nhận response
      if (type) {
        console.log(`Sẽ lọc danh sách phim SEARCH theo loại: ${type} sau khi nhận dữ liệu`);
      }
      
      
      console.log(`Sending search request to API: ${url}`, params);
      
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
