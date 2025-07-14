import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import memoizee from 'memoizee';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Cấu hình pool connection cho Supabase
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Tối ưu kết nối pool
  max: 20, // Số lượng kết nối tối đa trong pool
  idleTimeoutMillis: 30000, // Thời gian chờ trước khi đóng kết nối không sử dụng (30 giây)
  connectionTimeoutMillis: 10000, // Thời gian timeout khi tạo kết nối mới (10 giây)
});

// Kiểm tra kết nối đến Supabase
pool.connect()
  .then(client => {
    console.log('Kết nối đến Supabase PostgreSQL thành công');
    client.release();
  })
  .catch(err => {
    console.error('Lỗi kết nối đến Supabase PostgreSQL:', err);
  });

// Create a drizzle instance
export const db = drizzle(pool, { schema });

// Tạo các hàm truy vấn được cache để giảm tải database
export const cachedQueries = {
  // Lưu cache kết quả truy vấn trong 5 phút
  cacheQuery: memoizee(async (sql: string, params: any[] = []) => {
    const result = await pool.query(sql, params);
    return result.rows;
  }, { 
    maxAge: 5 * 60 * 1000, // 5 phút
    promise: true,
    normalizer: (args) => JSON.stringify(args), // Tạo key dựa trên tham số
    preFetch: true // Làm mới cache khi còn 20% thời gian
  }),
  
  // Lưu cache kết quả truy vấn ngắn hạn (30 giây)
  quickCacheQuery: memoizee(async (sql: string, params: any[] = []) => {
    const result = await pool.query(sql, params);
    return result.rows;
  }, { 
    maxAge: 30 * 1000, // 30 giây
    promise: true,
    normalizer: (args) => JSON.stringify(args), // Tạo key dựa trên tham số
  })
};