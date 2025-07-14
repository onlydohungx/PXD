# Hệ thống đề xuất phim AI - Tài liệu phát triển

## Tổng quan kiến trúc

Hệ thống đề xuất phim AI được xây dựng dựa trên các thành phần chính sau:

1. **Cơ sở dữ liệu (PostgreSQL)**
   - Bảng `user_preferences`: Lưu trữ thói quen xem phim của người dùng
   - Bảng `user_recommendations`: Lưu trữ đề xuất phim được tạo bởi AI

2. **Mô-đun AI (Hugging Face)**
   - Kết nối qua API để phân tích dữ liệu và tạo đề xuất
   - Hỗ trợ cả chế độ có API key và không có API key

3. **API endpoints**
   - API quản lý thói quen xem phim
   - API tạo và lấy đề xuất phim
   - API tìm phim tương tự

4. **Storage Interface**
   - Trung gian giữa API và cơ sở dữ liệu
   - Xử lý logic tạo đề xuất cơ bản

## Luồng dữ liệu

1. Người dùng xem phim → Cập nhật `user_preferences`
2. Ứng dụng yêu cầu đề xuất → Phân tích dữ liệu bằng Hugging Face → Tạo đề xuất mới
3. Đề xuất được lưu vào `user_recommendations` → Trả về cho frontend

## API Endpoints

### Quản lý thói quen xem phim

- `POST /api/user/preferences/update`: Cập nhật thói quen xem phim
- `GET /api/user/preferences/categories`: Lấy thể loại phim yêu thích
- `GET /api/user/preferences/countries`: Lấy quốc gia phim yêu thích
- `GET /api/user/preferences`: Lấy tất cả thông tin sở thích xem phim
- `POST /api/user/watch-history/:movieSlug/analyze`: Phân tích phim đã xem

### Đề xuất phim

- `GET /api/user/preferences/analyze`: Phân tích sở thích người dùng bằng AI
- `POST /api/user/recommendations/generate`: Tạo đề xuất phim mới
- `GET /api/user/recommendations`: Lấy đề xuất phim hiện tại
- `POST /api/user/recommendations/viewed`: Đánh dấu đề xuất đã xem
- `GET /api/movies/:movieSlug/similar`: Tìm phim tương tự với phim đang xem

## Hàm AI của Hugging Face

### 1. analyzeUserPreferences
```typescript
// Phân tích sở thích người dùng dựa trên lịch sử xem
function analyzeUserPreferences(
  userPreferences: { categories: Record<string, number>, countries: Record<string, number> },
  categoryInfo: Array<{ slug: string, name: string }>,
  countryInfo: Array<{ slug: string, name: string }>
): Promise<{
  preferredCategories: string[],  // Danh sách slug thể loại ưa thích
  preferredCountries: string[],   // Danh sách slug quốc gia ưa thích
  confidenceScore: number         // Điểm tin cậy (0-100)
}>
```

### 2. findSimilarMovies
```typescript
// Tìm phim tương tự dựa trên nội dung và thể loại
function findSimilarMovies(
  movieTitle: string,  // Tiêu đề phim
  genre: string        // Thể loại phim
): Promise<string[]>   // Danh sách tên phim tương tự
```

### 3. generatePreferenceDescription
```typescript
// Tạo mô tả về sở thích xem phim
function generatePreferenceDescription(
  categories: Array<{category: string, count: number}>,  // Thống kê thể loại
  countries: Array<{country: string, count: number}>     // Thống kê quốc gia
): Promise<string>  // Mô tả sở thích bằng ngôn ngữ tự nhiên
```

### 4. fetchMoviesByPreferences
```typescript
// Tìm phim phù hợp với sở thích
function fetchMoviesByPreferences(
  categorySlug: string,  // Slug thể loại ưa thích
  countrySlug: string    // Slug quốc gia ưa thích
): Promise<any[]>        // Danh sách phim phù hợp
```

## Hướng dẫn mở rộng

### 1. Thêm mô hình AI mới

Để thêm mô hình AI mới, cập nhật file `server/huggingface.ts`:

1. Thêm hàm mới sử dụng mô hình mong muốn
2. Đảm bảo xử lý lỗi và trường hợp không có API key
3. Xuất hàm để sử dụng trong API endpoints

### 2. Thêm thuộc tính phân tích

Để phân tích thêm thuộc tính của phim (ngoài thể loại và quốc gia):

1. Cập nhật bảng `user_preferences` trong `shared/schema.ts`
2. Mở rộng hàm `analyzeUserPreferences` để xử lý thuộc tính mới
3. Cập nhật logic đề xuất trong `generateRecommendationsWithData`

### 3. Cải thiện đề xuất

Để cải thiện chất lượng đề xuất:

1. Tinh chỉnh tham số trong các cuộc gọi API Hugging Face
2. Cải thiện thuật toán tính điểm tin cậy và độ ưu tiên
3. Thêm logic xử lý coldstart cho người dùng mới

## Tối ưu hiệu suất

- Sử dụng bộ nhớ đệm cho các kết quả phân tích
- Tạo đề xuất định kỳ thay vì theo yêu cầu
- Giới hạn số lượng cuộc gọi API Hugging Face để tiết kiệm tài nguyên