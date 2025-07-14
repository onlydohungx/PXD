import { HfInference } from '@huggingface/inference';
import axios from 'axios';
import { cachedGet, CacheType } from './cache';

// Khởi tạo client Hugging Face, bạn có thể thêm API key sau nếu cần
let hf: HfInference;

try {
  // Nếu có API key trong biến môi trường
  if (process.env.HUGGINGFACE_API_KEY) {
    hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    console.log('Hugging Face API đã được khởi tạo với API key');
  } else {
    // Sử dụng không có API key (giới hạn lượt gọi)
    hf = new HfInference();
    console.log('Hugging Face API đã được khởi tạo mà không có API key (có giới hạn lượt gọi)');
  }
} catch (error) {
  console.error('Lỗi khi khởi tạo Hugging Face API:', error);
}

/**
 * Phân tích sở thích về thể loại/quốc gia dựa trên lịch sử xem của người dùng
 * @param userPreferences Thông tin về sở thích người dùng
 * @param categoryInfo Thông tin về thể loại phim
 * @param countryInfo Thông tin về quốc gia sản xuất phim
 * @returns Promise<{preferredCategories: string[], preferredCountries: string[], confidenceScore: number}>
 */
export async function analyzeUserPreferences(
  userPreferences: { 
    categories: Record<string, number>,
    countries: Record<string, number>
  },
  categoryInfo: Array<{ slug: string, name: string }>,
  countryInfo: Array<{ slug: string, name: string }>
) {
  try {
    // Chuyển đổi dữ liệu thành định dạng phù hợp cho mô hình
    const categories = Object.entries(userPreferences.categories || {})
      .map(([slug, count]) => {
        // Tìm tên đầy đủ của thể loại
        const category = categoryInfo.find(cat => cat.slug === slug);
        return {
          slug,
          name: category?.name || slug,
          count
        };
      })
      .sort((a, b) => b.count - a.count);

    const countries = Object.entries(userPreferences.countries || {})
      .map(([slug, count]) => {
        // Tìm tên đầy đủ của quốc gia
        const country = countryInfo.find(c => c.slug === slug);
        return {
          slug,
          name: country?.name || slug,
          count
        };
      })
      .sort((a, b) => b.count - a.count);

    // Nếu không có đủ dữ liệu, trả về giá trị mặc định
    if (categories.length === 0 && countries.length === 0) {
      return {
        preferredCategories: [],
        preferredCountries: [],
        confidenceScore: 0
      };
    }

    // Nếu có Hugging Face, sử dụng mô hình feature-extraction
    if (hf) {
      try {
        // Tạo mô tả về sở thích người dùng
        const userProfile = `Người dùng thích xem phim thuộc thể loại: ${categories.slice(0, 3).map(c => c.name).join(', ')}. 
        Người dùng thích xem phim từ quốc gia: ${countries.slice(0, 2).map(c => c.name).join(', ')}.`;

        // Sử dụng mô hình zero-shot-classification để phân loại sở thích
        const result = await hf.textClassification({
          model: 'facebook/bart-large-mnli',
          inputs: userProfile,
          parameters: {
            candidate_labels: [
              'phim hành động', 'phim tình cảm', 'phim hài', 'phim kinh dị',
              'phim Hàn Quốc', 'phim Trung Quốc', 'phim Mỹ', 'phim Việt Nam'
            ]
          }
        });

        console.log('Kết quả phân tích HF:', result);

        // Tính toán điểm tin cậy dựa trên kết quả của mô hình
        // Hugging Face API trả về kết quả với cấu trúc khác nhau tùy theo mô hình
        // Bảo đảm sử dụng typecasting an toàn do interface của HF có thể thay đổi
        const score = ((result as any).scores?.[0] || (result as any).score || 0.7);
        const confidenceScore = Math.min(100, Math.round(score * 100));

        // Đề xuất thể loại và quốc gia phù hợp nhất
        return {
          preferredCategories: categories.slice(0, 3).map(c => c.slug),
          preferredCountries: countries.slice(0, 2).map(c => c.slug),
          confidenceScore
        };
      } catch (hfError) {
        console.error('Lỗi khi sử dụng Hugging Face API:', hfError);
        // Nếu lỗi, sử dụng phương pháp đơn giản hơn
      }
    }

    // Nếu không dùng được Hugging Face, sử dụng phương pháp đơn giản hơn
    const categoryCount = categories.reduce((sum, cat) => sum + cat.count, 0);
    const countryCount = countries.reduce((sum, country) => sum + country.count, 0);

    // Tính điểm tin cậy dựa trên số lượng xem
    const confidenceScore = Math.min(100, 
      50 + 
      Math.floor(categoryCount / 2) + 
      Math.floor(countryCount / 2)
    );

    return {
      preferredCategories: categories.slice(0, 3).map(c => c.slug),
      preferredCountries: countries.slice(0, 2).map(c => c.slug),
      confidenceScore
    };
  } catch (error) {
    console.error('Lỗi khi phân tích sở thích người dùng:', error);
    // Trả về một số kết quả mặc định nếu có lỗi
    return {
      preferredCategories: [],
      preferredCountries: [],
      confidenceScore: 0
    };
  }
}

/**
 * Tìm kiếm phim tương tự dựa trên nội dung và thể loại
 * @param movieTitle Tiêu đề phim
 * @param genre Thể loại phim
 * @returns Promise<Array<string>> Danh sách phim tương tự
 */
export async function findSimilarMovies(movieTitle: string, genre: string) {
  if (!hf) {
    console.warn('Không thể tìm phim tương tự: Hugging Face API chưa được khởi tạo');
    return getGenreBasedSuggestions(genre);
  }

  try {
    // Fallback: Sử dụng các đề xuất dựa trên thể loại thay vì gọi API
    return getGenreBasedSuggestions(genre);
  } catch (error) {
    console.error('Lỗi khi tìm phim tương tự:', error);
    return getGenreBasedSuggestions(genre);
  }
}

// Hàm phụ trợ để tạo đề xuất dựa trên thể loại khi AI không hoạt động
function getGenreBasedSuggestions(genre: string): string[] {
  // Ánh xạ thể loại phim đến danh sách các phim phổ biến
  const genreToMovies: Record<string, string[]> = {
    'Hành Động': ['Nhiệm Vụ Bất Khả Thi', 'John Wick', 'Fast and Furious', 'The Avengers', 'Die Hard'],
    'Tình Cảm': ['Titanic', 'The Notebook', 'La La Land', 'Pride and Prejudice', 'Me Before You'],
    'Kinh Dị': ['The Conjuring', 'Insidious', 'The Shining', 'Get Out', 'A Quiet Place'],
    'Hài': ['The Hangover', 'Deadpool', 'Dumb and Dumber', 'Superbad', 'Borat'],
    'Viễn Tưởng': ['Star Wars', 'Interstellar', 'The Matrix', 'Inception', 'Avatar'],
    'Hoạt Hình': ['Toy Story', 'Frozen', 'The Lion King', 'Up', 'Finding Nemo'],
    'Phiêu Lưu': ['Indiana Jones', 'Jurassic Park', 'Pirates of the Caribbean', 'The Mummy', 'National Treasure']
  };

  // Trả về đề xuất dựa trên thể loại, hoặc danh sách mặc định nếu không tìm thấy thể loại
  return genreToMovies[genre] || 
    ['The Godfather', 'Pulp Fiction', 'The Dark Knight', 'Forrest Gump', 'The Shawshank Redemption'];
}

/**
 * Phân tích mô tả phim và tạo từ khóa tìm kiếm hiệu quả
 * @param movieDescription Mô tả phim
 * @returns Promise<Array<string>> Danh sách từ khóa
 */
export async function generateMovieKeywords(movieDescription: string) {
  if (!hf) {
    console.warn('Không thể tạo từ khóa: Hugging Face API chưa được khởi tạo');
    return [];
  }

  try {
    // Sử dụng mô hình đơn giản để trích xuất từ khóa từ mô tả phim
    const result = await hf.summarization({
      model: 'facebook/bart-large-cnn',
      inputs: movieDescription,
      parameters: {
        max_length: 20,
        min_length: 5
      }
    });

    // Trích xuất từ khóa từ bản tóm tắt
    const keywords = result.summary_text
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5);

    return keywords;
  } catch (error) {
    console.error('Lỗi khi tạo từ khóa phim:', error);
    return [];
  }
}

/**
 * Xây dựng mô tả về sở thích của người dùng để hiển thị trong giao diện
 * @param categories Danh sách thể loại ưa thích
 * @param countries Danh sách quốc gia ưa thích
 * @returns Promise<string> Mô tả về sở thích
 */
export async function generatePreferenceDescription(
  categories: Array<{category: string, count: number}>,
  countries: Array<{country: string, count: number}>
) {
  try {
    // Tạo mô tả đơn giản không dùng Hugging Face tạm thời
    let description = 'Bạn thích xem ';
    if (categories.length > 0) {
      description += `phim thuộc thể loại ${categories.map(c => c.category).join(', ')}`;
    } else {
      description += 'nhiều thể loại phim khác nhau';
    }
    if (countries.length > 0) {
      description += `. Bạn hay xem phim từ ${countries.map(c => c.country).join(', ')}`;
    }
    if (categories.length > 0 && countries.length > 0) {
      description += '. Hệ thống sẽ ưu tiên đề xuất những phim phù hợp với sở thích của bạn.';
    }
    return description;
  } catch (error) {
    console.error('Lỗi khi tạo mô tả sở thích:', error);
    return `Bạn thích xem phim ${categories.map(c => c.category).join(', ')} từ ${countries.map(c => c.country).join(', ')}.`;
  }
}

/**
 * Lấy danh sách phim dựa trên thể loại và quốc gia
 * @param categorySlug Slug của thể loại
 * @param countrySlug Slug của quốc gia
 * @returns Promise<any[]> Danh sách phim
 */
export async function fetchMoviesByPreferences(categorySlug: string, countrySlug: string) {
  try {
    console.log(`Fetching movies for category: ${categorySlug} and country: ${countrySlug}`);

    let foundMovies: any[] = [];

    // 1. Thử lấy tất cả phim từ nhiều trang và lọc thủ công
    try {
      console.log('Trying to fetch movies from multiple pages and filter');

      // Lấy phim từ 3 trang đầu tiên với cache
      const moviePromises = [1, 2, 3, 4, 5].map(page => 
        cachedGet('https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3', {
          params: {
            page,
            limit: 64, // Tăng giới hạn để lấy nhiều phim hơn
            sort_field: 'view_total',
            sort_type: 'desc'
          }
        }, false, CacheType.MOVIE)
      );

      // Chờ tất cả các request hoàn thành
      const responses = await Promise.all(moviePromises);

      // Gộp tất cả các phim thành một mảng
      let allMovies: any[] = [];

      // Kiểm tra từng response và gộp phim vào
      responses.forEach((response, index) => {
        if (response.data && response.data.status && response.data.items) {
          console.log(`Fetched ${response.data.items.length} movies from page ${index + 1}`);
          allMovies = [...allMovies, ...response.data.items];
        }
      });

      console.log(`Fetched a total of ${allMovies.length} movies, now filtering by category and country`);

      // Lọc phim theo thể loại và quốc gia
      const filteredMovies = allMovies.filter((movie: any) => {
        // Kiểm tra thể loại
        const hasCategoryMatch = !categorySlug || (
          movie.category && 
          Array.isArray(movie.category) && 
          movie.category.some((c: any) => c.slug === categorySlug)
        );

        // Kiểm tra quốc gia
        const hasCountryMatch = !countrySlug || (
          movie.country && 
          Array.isArray(movie.country) && 
          movie.country.some((c: any) => c.slug === countrySlug)
        );

        // Nếu cả hai điều kiện đều thỏa mãn
        return hasCategoryMatch && hasCountryMatch;
      });

      if (filteredMovies.length > 0) {
        console.log(`Found ${filteredMovies.length} movies matching criteria`);

        // Đánh dấu đây là phim được đề xuất
        const markedMovies = filteredMovies.map(movie => ({
          ...movie,
          isRecommended: true,
          recommendReason: `Phim phù hợp với sở thích của bạn`
        }));

        // Trả về nhiều phim hơn (tối đa 20)
        return markedMovies.slice(0, 20);
      }
    } catch (error) {
      console.error('Error fetching and filtering all movies:', error);
    }

    // 2. Thử lấy phim theo thể loại từ nhiều trang
    if (categorySlug) {
      try {
        console.log(`Trying to find movies with category ${categorySlug} from multiple pages`);

        // Lấy dữ liệu từ 2 trang cho thể loại này với cache
        const categoryPromises = [1, 2, 3].map(page => 
          cachedGet(`https://phimapi.com/v1/api/the-loai/${categorySlug}`, {
            params: {
              page,
              limit: 24, // Tăng giới hạn để lấy nhiều phim hơn
              sort_field: 'view_total',
              sort_type: 'desc'
            }
          }, false, CacheType.CATEGORY)
        );

        // Chờ tất cả các request hoàn thành
        const responses = await Promise.all(categoryPromises);

        // Gộp tất cả các phim thành một mảng
        let categoryMovies: any[] = [];
        responses.forEach((response, index) => {
          if (response.data && response.data.status && response.data.items) {
            console.log(`Fetched ${response.data.items.length} movies with category ${categorySlug} from page ${index + 1}`);
            categoryMovies = [...categoryMovies, ...response.data.items];
          }
        });

        if (categoryMovies.length > 0) {
          console.log(`Found a total of ${categoryMovies.length} movies matching category ${categorySlug}`);

          // Lọc bỏ các bản trùng dựa trên slug
          const uniqueMovies = Array.from(
            new Map(categoryMovies.map(movie => [movie.slug, movie])).values()
          );

          // Đánh dấu rằng đây là phim từ thể loại đề xuất
          foundMovies = uniqueMovies.map(movie => ({
            ...movie,
            isRecommended: true,
            recommendReason: `Phim thuộc thể loại ${categorySlug}`
          }));

          // Trả về tối đa 20 phim
          return foundMovies.slice(0, 20);
        }
      } catch (error) {
        console.error(`Lỗi khi lấy phim theo thể loại ${categorySlug}:`, error);
      }
    }

    // 3. Thử lấy phim theo quốc gia từ nhiều trang
    if (countrySlug) {
      try {
        console.log(`Trying to find movies with country ${countrySlug} from multiple pages`);

        // Lấy dữ liệu từ 3 trang cho quốc gia này
        const countryPromises = [1, 2, 3].map(page => 
          axios.get(`https://phimapi.com/v1/api/quoc-gia/${countrySlug}`, {
            params: {
              page,
              limit: 24, // Tăng giới hạn để lấy nhiều phim hơn
              sort_field: 'view_total',
              sort_type: 'desc'
            }
          })
        );

        // Chờ tất cả các request hoàn thành
        const responses = await Promise.all(countryPromises);

        // Gộp tất cả các phim thành một mảng
        let countryMovies: any[] = [];
        responses.forEach((response, index) => {
          if (response.data && response.data.status && response.data.items) {
            console.log(`Fetched ${response.data.items.length} movies with country ${countrySlug} from page ${index + 1}`);
            countryMovies = [...countryMovies, ...response.data.items];
          }
        });

        if (countryMovies.length > 0) {
          console.log(`Found a total of ${countryMovies.length} movies matching country ${countrySlug}`);

          // Lọc bỏ các bản trùng dựa trên slug
          const uniqueMovies = Array.from(
            new Map(countryMovies.map(movie => [movie.slug, movie])).values()
          );

          // Đánh dấu rằng đây là phim từ quốc gia đề xuất
          foundMovies = uniqueMovies.map(movie => ({
            ...movie,
            isRecommended: true,
            recommendReason: `Phim sản xuất tại ${countrySlug}`
          }));

          // Trả về tối đa 20 phim
          return foundMovies.slice(0, 20);
        }
      } catch (error) {
        console.error(`Lỗi khi lấy phim theo quốc gia ${countrySlug}:`, error);
      }
    }

    // 4. Lấy phim trending từ nhiều trang nếu không tìm thấy phim phù hợp
    try {
      console.log(`Falling back to trending movies from multiple pages`);

      // Lấy trending phim từ 3 trang đầu tiên
      const trendingPromises = [1, 2, 3].map(page => 
        axios.get("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3", {
          params: {
            page,
            limit: 24,
            sort_field: 'view_total',
            sort_type: 'desc'
          }
        })
      );

      // Chờ tất cả các request hoàn thành
      const responses = await Promise.all(trendingPromises);

      // Gộp tất cả các phim thành một mảng
      let trendingMovies: any[] = [];
      responses.forEach((response, index) => {
        if (response.data && response.data.status && response.data.items) {
          console.log(`Fetched ${response.data.items.length} trending movies from page ${index + 1}`);
          trendingMovies = [...trendingMovies, ...response.data.items];
        }
      });

      if (trendingMovies.length > 0) {
        console.log(`Found a total of ${trendingMovies.length} trending movies`);

        // Lọc bỏ các bản trùng dựa trên slug
        const uniqueMovies = Array.from(
          new Map(trendingMovies.map(movie => [movie.slug, movie])).values()
        );

        // Đánh dấu rằng đây là phim trending
        foundMovies = uniqueMovies.map(movie => ({
          ...movie,
          isRecommended: false,
          recommendReason: 'Phim đang thịnh hành'
        }));

        // Trả về tới 12 phim trending
        return foundMovies.slice(0, 12);
      }
    } catch (error) {
      console.error(`Lỗi khi lấy phim trending:`, error);
    }

    // Nếu không có kết quả, trả về mảng rỗng
    return [];
  } catch (error) {
    console.error('Lỗi khi tìm phim theo sở thích:', error);
    return [];
  }
}
