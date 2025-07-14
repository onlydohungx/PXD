import { cachedGet } from './cache';

/**
 * Preload essential data into cache at server startup
 */
export async function preloadEssentialData() {
  console.log('Bắt đầu preload dữ liệu cần thiết...');
  
  try {
    // Preload các danh mục phổ biến
    const popularCategories = [
      'phim-le', 'phim-bo', 'phim-hoat-hinh', 'phim-chieu-rap',
      'tv-shows', 'hoat-hinh', 'the-thao'
    ];

    // Preload các quốc gia phổ biến
    const popularCountries = [
      'han-quoc', 'trung-quoc', 'nhat-ban', 'my', 'thai-lan', 'viet-nam'
    ];

    // Preload với API endpoints chính xác
    await Promise.all([
      cachedGet('https://phimapi.com/the-loai'),
      cachedGet('https://phimapi.com/quoc-gia'),
      
      // Preload một số phim trending để có sẵn
      cachedGet('https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1&limit=6'),
      
      // Preload theo từng thể loại phổ biến với API đúng
      cachedGet('https://phimapi.com/v1/api/the-loai/phim-le?page=1&limit=6'),
      cachedGet('https://phimapi.com/v1/api/the-loai/phim-bo?page=1&limit=6'),
      
      // Preload theo quốc gia phổ biến
      cachedGet('https://phimapi.com/v1/api/quoc-gia/han-quoc?page=1&limit=6')
    ]);

    console.log('✅ Hoàn thành preload dữ liệu cần thiết');
  } catch (error) {
    console.warn('⚠️ Lỗi khi preload dữ liệu:', error.message);
  }
}

/**
 * Background refresh of popular content
 */
export function startBackgroundRefresh() {
  // Refresh mỗi 5 phút
  setInterval(async () => {
    try {
      await Promise.all([
        cachedGet('https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1&limit=6'),
        cachedGet('https://phimapi.com/v1/api/the-loai/phim-le?page=1&limit=6'),
        cachedGet('https://phimapi.com/v1/api/quoc-gia/han-quoc?page=1&limit=6')
      ]);
      console.log('🔄 Background refresh hoàn thành');
    } catch (error) {
      console.warn('⚠️ Lỗi background refresh:', error.message);
    }
  }, 5 * 60 * 1000); // 5 phút
}