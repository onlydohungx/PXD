import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { createServer } from 'http';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';
import path from 'path';
import { db } from './db';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { storage } from './storage';
import { preloadCache } from './cache';

// Tạo ứng dụng Express
const app = express();

// Cấu hình giới hạn yêu cầu API để tránh quá tải
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 200, // giới hạn mỗi IP đến 200 yêu cầu trong 15 phút
  standardHeaders: true, // Trả về thông tin giới hạn trong headers
  legacyHeaders: false, // Tắt headers `X-RateLimit-*`
  message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút'
});

// Middleware cơ bản
app.use(compression({
  level: 6, // mức nén tối ưu
  threshold: 0 // nén tất cả responses
}));
app.use(express.json({ limit: '1mb' })); // Giới hạn kích thước request
app.use(helmet({
  contentSecurityPolicy: false, // Tắt CSP để không ảnh hưởng đến CDN bên ngoài
  crossOriginEmbedderPolicy: false
}));

// Áp dụng giới hạn cho API routes
app.use('/api/', apiLimiter);

// Xử lý các CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Hàm lên lịch tự động xóa dữ liệu lượt xem phim hàng ngày vào nửa đêm
function scheduleMovieDailyViewsCleanup() {
  // Tính toán thời gian còn lại cho đến nửa đêm
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Đặt thời gian là 00:00:00 của ngày tiếp theo
  
  const timeToMidnight = midnight.getTime() - now.getTime();
  
  console.log(`Đã lên lịch xóa dữ liệu lượt xem phim theo ngày vào nửa đêm, còn ${Math.floor(timeToMidnight / 60000)} phút nữa`);
  
  // Đặt timeout cho lần chạy đầu tiên vào nửa đêm
  setTimeout(async () => {
    try {
      // Xóa dữ liệu của ngày hôm qua và cũ hơn
      const today = new Date();
      const deletedCount = await storage.cleanupOldDailyMovieViews(today);
      console.log(`Đã xóa ${deletedCount} bản ghi lượt xem phim cũ vào ${new Date().toISOString()}`);
      
      // Sau đó lên lịch chạy mỗi 24 giờ
      setInterval(async () => {
        try {
          const cleanupDate = new Date();
          const count = await storage.cleanupOldDailyMovieViews(cleanupDate);
          console.log(`Định kỳ: Đã xóa ${count} bản ghi lượt xem phim cũ vào ${new Date().toISOString()}`);
        } catch (error) {
          console.error('Lỗi khi tự động xóa dữ liệu lượt xem phim theo ngày:', error);
        }
      }, 24 * 60 * 60 * 1000); // 24 giờ
      
    } catch (error) {
      console.error('Lỗi khi xóa dữ liệu lượt xem phim theo ngày lần đầu:', error);
    }
  }, timeToMidnight);
}

// Khởi chạy ứng dụng
async function startServer() {
  // Đăng ký các routes API
  const server = await registerRoutes(app);
  
  // Preload cache cho dữ liệu thường dùng
  try {
    await preloadCache();
    // Preload dữ liệu cần thiết ngay khi server khởi động
    setTimeout(async () => {
      const { preloadEssentialData, startBackgroundRefresh } = await import('./preload-cache');
      await preloadEssentialData();
      startBackgroundRefresh();
    }, 2000); // Delay 2 giây để server khởi động xong
  } catch (error) {
    console.error('Lỗi khi preload cache:', error);
  }
  
  if (process.env.NODE_ENV === 'development') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  
  // Xử lý lỗi chung
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Đã xảy ra lỗi server' });
  });
  
  // Xác định port từ biến môi trường hoặc mặc định là 5000
  const port = process.env.PORT || 5000;
  
  // Lên lịch tự động xóa dữ liệu lượt xem phim theo ngày
  scheduleMovieDailyViewsCleanup();
  
  // Lắng nghe kết nối
  server.listen(port, () => {
    log(`Đang phục vụ tại cổng ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Lỗi khi khởi động server:', error);
});
