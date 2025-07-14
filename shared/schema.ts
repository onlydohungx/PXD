import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const watchHistory = pgTable("watch_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  movieSlug: text("movie_slug").notNull(),
  episodeIndex: integer("episode_index").default(0),
  watchedAt: timestamp("watched_at").defaultNow(),
  currentTime: doublePrecision("current_time").default(0), // Thời gian đã xem (giây)
  duration: doublePrecision("duration").default(0), // Tổng thời lượng (giây)
  progress: integer("progress").default(0) // Phần trăm đã xem
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  movieSlug: text("movie_slug").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  movieSlug: text("movie_slug").notNull(),
  content: text("content").notNull(),
  rating: integer("rating"),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const movieViews = pgTable("movie_views", {
  id: serial("id").primaryKey(),
  movieSlug: text("movie_slug").notNull(),
  viewCount: integer("view_count").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const movieDailyViews = pgTable("movie_daily_views", {
  id: serial("id").primaryKey(),
  movieSlug: text("movie_slug").notNull(),
  viewDate: timestamp("view_date").notNull(),
  viewCount: integer("view_count").notNull().default(0),
});

// Bảng lưu trữ thói quen xem phim của người dùng
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  // Lưu trữ các thể loại phim mà người dùng thích xem
  // Cấu trúc: { category_slug: số lần xem }
  categories: json("categories").$type<Record<string, number>>().default({}),
  // Lưu trữ các quốc gia phim mà người dùng thích xem
  // Cấu trúc: { country_slug: số lần xem }
  countries: json("countries").$type<Record<string, number>>().default({}),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Bảng lưu trữ phim đề xuất cho người dùng (được tính toán bởi AI)
export const userRecommendations = pgTable("user_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  // Danh sách slug của các phim được đề xuất
  movieSlugs: text("movie_slugs").array().notNull(),
  // Danh sách thể loại được sử dụng để đề xuất
  basedOnCategories: text("based_on_categories").array().notNull(),
  // Danh sách quốc gia được sử dụng để đề xuất
  basedOnCountries: text("based_on_countries").array().notNull(),
  // Điểm số độ chính xác của đề xuất (0-100)
  confidenceScore: integer("confidence_score").default(70),
  createdAt: timestamp("created_at").defaultNow(),
  // Đánh dấu liệu đề xuất đã được hiển thị cho người dùng chưa
  isViewed: boolean("is_viewed").default(false),
});

// Bảng lưu trữ chuỗi xem phim hàng ngày của người dùng
export const viewingStreaks = pgTable("viewing_streaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  // Số ngày liên tiếp xem phim
  currentStreak: integer("current_streak").notNull().default(0),
  // Chuỗi dài nhất đã đạt được
  longestStreak: integer("longest_streak").notNull().default(0),
  // Ngày xem gần nhất (lưu dưới dạng chuỗi ISO cho dễ xử lý)
  lastViewDate: text("last_view_date").notNull(),
  // Các mốc chuỗi đã đạt được (JSON lưu trữ các mốc đã đạt - được lưu dạng chuỗi để tương thích nhiều môi trường)
  achievedMilestones: json("achieved_milestones").$type<number[]>().default([]),
  // Phiên bản text backup của achievedMilestones để đảm bảo tương thích
  achievedMilestonesText: text("achieved_milestones_text").default("[]"),
  // Đánh dấu đã cập nhật chuỗi hôm nay chưa
  updatedToday: boolean("updated_today").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bảng cài đặt hệ thống
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    email: true,
  })
  .extend({
    username: z.string().min(3, { message: "Tên đăng nhập phải có ít nhất 3 ký tự" }),
    password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
    email: z.string().email({ message: "Email không hợp lệ" }),
    confirmPassword: z.string().min(1, { message: "Vui lòng xác nhận mật khẩu" }),
  })
  .refine(
    (data) => {
      return !!data.username && !!data.password && !!data.email && !!data.confirmPassword;
    },
    {
      message: "Vui lòng nhập đầy đủ thông tin",
      path: ["username"],
    }
  );

export const loginSchema = z.object({
  username: z.string().min(3, { message: "Tên đăng nhập phải có ít nhất 3 ký tự" }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});

export const insertWatchHistorySchema = createInsertSchema(watchHistory).pick({
  userId: true,
  movieSlug: true,
  episodeIndex: true,
  currentTime: true,
  duration: true,
  progress: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).pick({
  userId: true,
  movieSlug: true,
});

export const insertCommentSchema = createInsertSchema(comments)
  .pick({
    userId: true,
    movieSlug: true,
    content: true,
    rating: true,
    parentId: true,
  })
  .extend({
    rating: z.number().min(1).max(10).optional(),
    parentId: z.number().optional(),
  });

export const insertNotificationSchema = createInsertSchema(notifications)
  .pick({
    title: true,
    content: true,
    isActive: true,
    createdBy: true,
  });

export const insertMovieViewSchema = createInsertSchema(movieViews)
  .pick({
    movieSlug: true,
    viewCount: true
  });

export const insertMovieDailyViewSchema = createInsertSchema(movieDailyViews)
  .pick({
    movieSlug: true,
    viewDate: true,
    viewCount: true
  });

export const insertUserPreferenceSchema = createInsertSchema(userPreferences)
  .pick({
    userId: true,
    categories: true,
    countries: true
  });

export const insertUserRecommendationSchema = createInsertSchema(userRecommendations)
  .pick({
    userId: true,
    movieSlugs: true,
    basedOnCategories: true,
    basedOnCountries: true,
    confidenceScore: true
  });

export const insertViewingStreakSchema = createInsertSchema(viewingStreaks)
  .pick({
    userId: true,
    currentStreak: true,
    longestStreak: true,
    lastViewDate: true,
    achievedMilestones: true,
    updatedToday: true
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;
export type WatchHistory = typeof watchHistory.$inferSelect;
export type InsertWatchHistory = z.infer<typeof insertWatchHistorySchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type MovieView = typeof movieViews.$inferSelect;
export type InsertMovieView = z.infer<typeof insertMovieViewSchema>;
export type MovieDailyView = typeof movieDailyViews.$inferSelect;
export type InsertMovieDailyView = z.infer<typeof insertMovieDailyViewSchema>;
export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = z.infer<typeof insertUserPreferenceSchema>;
export type UserRecommendation = typeof userRecommendations.$inferSelect;
export type InsertUserRecommendation = z.infer<typeof insertUserRecommendationSchema>;
export type ViewingStreak = typeof viewingStreaks.$inferSelect;
export type InsertViewingStreak = z.infer<typeof insertViewingStreakSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;