import { pool, db } from '../server/db';
import { movieDailyViews } from '../shared/schema';

async function main() {
  try {
    console.log('Creating movie_daily_views table...');
    
    // SQL trực tiếp để tạo bảng
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "movie_daily_views" (
        "id" SERIAL PRIMARY KEY,
        "movie_slug" TEXT NOT NULL,
        "view_date" TIMESTAMP NOT NULL,
        "view_count" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Table movie_daily_views created successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

main();