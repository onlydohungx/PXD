import { 
  users, watchHistory, favorites, comments, notifications, movieViews, movieDailyViews,
  userPreferences, userRecommendations,
  type User, type InsertUser, type WatchHistory, type InsertWatchHistory, 
  type Favorite, type InsertFavorite, type Comment, type InsertComment, 
  type Notification, type InsertNotification, type MovieView, type InsertMovieView,
  type MovieDailyView, type InsertMovieDailyView, type UserPreference, type InsertUserPreference,
  type UserRecommendation, type InsertUserRecommendation
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;
  
  getWatchHistory(userId: number): Promise<WatchHistory[]>;
  addToWatchHistory(data: InsertWatchHistory): Promise<WatchHistory>;
  getWatchProgress(userId: number, movieSlug: string, episodeIndex?: number): Promise<{currentTime: number, duration: number, progress: number} | null>;
  removeFromWatchHistory(userId: number, movieSlug: string): Promise<void>;
  
  getFavorites(userId: number): Promise<Favorite[]>;
  addToFavorites(data: InsertFavorite): Promise<Favorite>;
  removeFromFavorites(userId: number, movieSlug: string): Promise<void>;
  isFavorite(userId: number, movieSlug: string): Promise<boolean>;
  
  // Phương thức cho bình luận
  getMovieComments(movieSlug: string): Promise<Comment[]>;
  getComment(id: number): Promise<Comment | undefined>;
  createComment(data: InsertComment): Promise<Comment>;
  updateComment(id: number, content: string): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<void>;
  
  // Phương thức cho thông báo
  getNotifications(activeOnly?: boolean): Promise<Notification[]>;
  getLatestNotification(activeOnly?: boolean): Promise<Notification | undefined>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(data: InsertNotification): Promise<Notification>;
  updateNotification(id: number, data: Partial<Notification>): Promise<Notification | undefined>;
  toggleNotificationStatus(id: number): Promise<Notification | undefined>;
  deleteNotification(id: number): Promise<void>;
  
  // Phương thức cho lượt xem phim
  getMovieViewCount(movieSlug: string): Promise<number>;
  incrementMovieViewCount(movieSlug: string): Promise<MovieView>;
  getTopViewedMovies(limit?: number): Promise<MovieView[]>;
  
  // Phương thức cho lượt xem phim theo ngày
  getDailyMovieViewCount(movieSlug: string, date?: Date): Promise<number>;
  incrementDailyMovieViewCount(movieSlug: string): Promise<MovieDailyView>;
  getTopViewedMoviesToday(limit?: number): Promise<MovieDailyView[]>;
  cleanupOldDailyMovieViews(olderThan?: Date): Promise<number>;
  
  // Phương thức cho AI theo dõi thói quen xem phim
  getUserPreferences(userId: number): Promise<UserPreference | undefined>;
  updateUserPreferences(userId: number, movieData: {movieSlug: string, categories: string[], country?: string}): Promise<UserPreference>;
  getTopUserCategories(userId: number, limit?: number): Promise<{category: string, count: number}[]>;
  getTopUserCountries(userId: number, limit?: number): Promise<{country: string, count: number}[]>;
  
  // Phương thức cho AI đề xuất phim
  getUserRecommendations(userId: number): Promise<UserRecommendation | undefined>;
  generateRecommendations(userId: number): Promise<UserRecommendation>;
  markRecommendationsAsViewed(userId: number): Promise<void>;
  
  // Phương thức cho quản lý phiên
  getActiveSessions(): Promise<Array<{id: number, username: string, lastActive: Date}>>;
  
  sessionStore: any; // Sử dụng any để tránh lỗi type
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool: db.driver as any,
      tableName: 'session',
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15, // Clean up expired sessions every 15 minutes
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      password: users.password,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt
    }).from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Chỉ chọn các cột đã tồn tại trong schema hiện tại để tránh lỗi
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      password: users.password,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt
    }).from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    // Chỉ cập nhật các trường hiện có để tránh lỗi
    const updateData: any = {};
    
    if (userData.email !== undefined) {
      updateData.email = userData.email;
    }
    
    if (userData.role !== undefined) {
      updateData.role = userData.role;
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        username: users.username,
        password: users.password,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt
      });
    
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.username);
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getWatchHistory(userId: number): Promise<WatchHistory[]> {
    // Lấy tất cả các mục trong lịch sử xem của người dùng
    const result = await db
      .select()
      .from(watchHistory)
      .where(eq(watchHistory.userId, userId))
      .orderBy(desc(watchHistory.watchedAt));
    
    // Nhóm theo movieSlug và chỉ lấy mục mới nhất
    const movieMap = new Map<string, WatchHistory>();
    
    result.forEach(item => {
      if (!movieMap.has(item.movieSlug) || 
          new Date(item.watchedAt) > new Date(movieMap.get(item.movieSlug)!.watchedAt)) {
        movieMap.set(item.movieSlug, item);
      }
    });
    
    // Chuyển đổi Map trở lại thành mảng và sắp xếp theo thời gian giảm dần
    return Array.from(movieMap.values())
      .sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime());
  }

  async addToWatchHistory(data: InsertWatchHistory): Promise<WatchHistory> {
    // Remove existing entry if exists
    await db
      .delete(watchHistory)
      .where(
        and(
          eq(watchHistory.userId, data.userId),
          eq(watchHistory.movieSlug, data.movieSlug),
          eq(watchHistory.episodeIndex, data.episodeIndex || 0)
        )
      );
    
    // Add new entry
    const [entry] = await db
      .insert(watchHistory)
      .values(data)
      .returning();
    return entry;
  }

  async getWatchProgress(userId: number, movieSlug: string, episodeIndex: number = 0): Promise<{currentTime: number, duration: number, progress: number} | null> {
    const [entry] = await db
      .select({
        currentTime: watchHistory.currentTime,
        duration: watchHistory.duration,
        progress: watchHistory.progress
      })
      .from(watchHistory)
      .where(
        and(
          eq(watchHistory.userId, userId),
          eq(watchHistory.movieSlug, movieSlug),
          eq(watchHistory.episodeIndex, episodeIndex)
        )
      );
      
    return entry || null;
  }

  async removeFromWatchHistory(userId: number, movieSlug: string): Promise<void> {
    await db
      .delete(watchHistory)
      .where(
        and(
          eq(watchHistory.userId, userId),
          eq(watchHistory.movieSlug, movieSlug)
        )
      );
  }

  async getFavorites(userId: number): Promise<Favorite[]> {
    return await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.addedAt));
  }

  async addToFavorites(data: InsertFavorite): Promise<Favorite> {
    // Check if already exists
    const [existing] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, data.userId),
          eq(favorites.movieSlug, data.movieSlug)
        )
      );
    
    if (existing) {
      return existing;
    }
    
    const [entry] = await db
      .insert(favorites)
      .values(data)
      .returning();
    return entry;
  }

  async removeFromFavorites(userId: number, movieSlug: string): Promise<void> {
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.movieSlug, movieSlug)
        )
      );
  }

  async isFavorite(userId: number, movieSlug: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.movieSlug, movieSlug)
        )
      );
    return !!existing;
  }

  // Phương thức cho bình luận
  async getMovieComments(movieSlug: string): Promise<Comment[]> {
    return await db
      .select({
        id: comments.id,
        userId: comments.userId,
        username: users.username,
        movieSlug: comments.movieSlug,
        content: comments.content,
        rating: comments.rating,
        parentId: comments.parentId,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.movieSlug, movieSlug))
      .orderBy(desc(comments.createdAt));
  }

  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id));
    return comment;
  }

  async createComment(data: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(data)
      .returning();
    return comment;
  }

  async updateComment(id: number, content: string): Promise<Comment | undefined> {
    const [updatedComment] = await db
      .update(comments)
      .set({
        content,
        updatedAt: new Date()
      })
      .where(eq(comments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteComment(id: number): Promise<void> {
    await db
      .delete(comments)
      .where(eq(comments.id, id));
  }

  // Các phương thức cho thông báo
  async getNotifications(activeOnly: boolean = false): Promise<Notification[]> {
    let query = db
      .select({
        id: notifications.id,
        title: notifications.title,
        content: notifications.content,
        isActive: notifications.isActive,
        createdBy: notifications.createdBy,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
        username: users.username,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.createdBy, users.id))
      .orderBy(desc(notifications.createdAt));
    
    if (activeOnly) {
      query = query.where(eq(notifications.isActive, true));
    }
    
    return await query;
  }

  async getLatestNotification(activeOnly: boolean = true): Promise<Notification | undefined> {
    let query = db
      .select({
        id: notifications.id,
        title: notifications.title,
        content: notifications.content,
        isActive: notifications.isActive,
        createdBy: notifications.createdBy,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
        username: users.username,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.createdBy, users.id))
      .orderBy(desc(notifications.createdAt))
      .limit(1);
    
    if (activeOnly) {
      query = query.where(eq(notifications.isActive, true));
    }
    
    const [notification] = await query;
    return notification;
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .select({
        id: notifications.id,
        title: notifications.title,
        content: notifications.content,
        isActive: notifications.isActive,
        createdBy: notifications.createdBy,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
        username: users.username,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.createdBy, users.id))
      .where(eq(notifications.id, id));
    
    return notification;
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(data)
      .returning();
    
    return notification;
  }

  async updateNotification(id: number, data: Partial<Notification>): Promise<Notification | undefined> {
    const updateData: any = {};
    
    if (data.title !== undefined) {
      updateData.title = data.title;
    }
    
    if (data.content !== undefined) {
      updateData.content = data.content;
    }
    
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }
    
    updateData.updatedAt = new Date();
    
    const [updatedNotification] = await db
      .update(notifications)
      .set(updateData)
      .where(eq(notifications.id, id))
      .returning();
    
    return updatedNotification;
  }

  async toggleNotificationStatus(id: number): Promise<Notification | undefined> {
    // Lấy thông báo hiện tại
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    
    if (!notification) {
      return undefined;
    }
    
    // Đảo ngược trạng thái
    const [updatedNotification] = await db
      .update(notifications)
      .set({
        isActive: !notification.isActive,
        updatedAt: new Date()
      })
      .where(eq(notifications.id, id))
      .returning();
    
    return updatedNotification;
  }

  async deleteNotification(id: number): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.id, id));
  }

  // Phương thức cho lượt xem phim
  async getMovieViewCount(movieSlug: string): Promise<number> {
    const [result] = await db
      .select({
        viewCount: movieViews.viewCount
      })
      .from(movieViews)
      .where(eq(movieViews.movieSlug, movieSlug));
    
    return result ? result.viewCount : 0;
  }

  async incrementMovieViewCount(movieSlug: string): Promise<MovieView> {
    // Kiểm tra xem phim đã có trong bảng movie_views chưa
    const [existingView] = await db
      .select()
      .from(movieViews)
      .where(eq(movieViews.movieSlug, movieSlug));
    
    if (existingView) {
      // Nếu đã có, tăng số lượt xem lên 1
      const [updatedView] = await db
        .update(movieViews)
        .set({
          viewCount: existingView.viewCount + 1,
          lastUpdated: new Date()
        })
        .where(eq(movieViews.movieSlug, movieSlug))
        .returning();
      
      return updatedView;
    } else {
      // Nếu chưa có, tạo mới với số lượt xem là 1
      const [newView] = await db
        .insert(movieViews)
        .values({
          movieSlug,
          viewCount: 1,
          lastUpdated: new Date()
        })
        .returning();
      
      return newView;
    }
  }

  async getTopViewedMovies(limit: number = 10): Promise<MovieView[]> {
    return await db
      .select()
      .from(movieViews)
      .orderBy(desc(movieViews.viewCount))
      .limit(limit);
  }
  
  // Phương thức cho lượt xem phim theo ngày
  async getDailyMovieViewCount(movieSlug: string, date: Date = new Date()): Promise<number> {
    // Format date to YYYY-MM-DD để chỉ so sánh ngày, không quan tâm đến giờ
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const [result] = await db
      .select({
        viewCount: movieDailyViews.viewCount
      })
      .from(movieDailyViews)
      .where(
        and(
          eq(movieDailyViews.movieSlug, movieSlug),
          // Kiểm tra xem viewDate có trong khoảng ngày hôm nay không
          sql`${movieDailyViews.viewDate} >= ${startDate.toISOString()} AND ${movieDailyViews.viewDate} <= ${endDate.toISOString()}`
        )
      );
    
    return result ? result.viewCount : 0;
  }
  
  async incrementDailyMovieViewCount(movieSlug: string): Promise<MovieDailyView> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Đặt thời gian về đầu ngày
    
    // Kiểm tra xem đã có dữ liệu cho ngày hôm nay chưa
    const [existingView] = await db
      .select()
      .from(movieDailyViews)
      .where(
        and(
          eq(movieDailyViews.movieSlug, movieSlug),
          sql`DATE(${movieDailyViews.viewDate}) = DATE(${today.toISOString()})`
        )
      );
    
    if (existingView) {
      // Nếu đã có, tăng số lượt xem lên 1
      const [updatedView] = await db
        .update(movieDailyViews)
        .set({
          viewCount: existingView.viewCount + 1
        })
        .where(eq(movieDailyViews.id, existingView.id))
        .returning();
      
      return updatedView;
    } else {
      // Nếu chưa có, tạo mới với số lượt xem là 1
      const [newView] = await db
        .insert(movieDailyViews)
        .values({
          movieSlug,
          viewDate: today,
          viewCount: 1
        })
        .returning();
      
      return newView;
    }
  }
  
  async getTopViewedMoviesToday(limit: number = 10): Promise<MovieDailyView[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Đặt thời gian về đầu ngày
    
    return await db
      .select()
      .from(movieDailyViews)
      .where(sql`DATE(${movieDailyViews.viewDate}) = DATE(${today.toISOString()})`)
      .orderBy(desc(movieDailyViews.viewCount))
      .limit(limit);
  }
  
  /**
   * Xóa dữ liệu lượt xem phim theo ngày cũ hơn ngày đã chỉ định
   * Mặc định sẽ xóa các bản ghi của ngày hôm qua trở về trước
   * @param olderThan Ngày cũ nhất mà bạn muốn giữ lại dữ liệu (mặc định: hôm nay)
   * @returns Số lượng bản ghi đã bị xóa
   */
  async cleanupOldDailyMovieViews(olderThan: Date = new Date()): Promise<number> {
    // Đặt thời gian về đầu ngày
    olderThan.setHours(0, 0, 0, 0);
    
    const result = await db
      .delete(movieDailyViews)
      .where(sql`${movieDailyViews.viewDate} < ${olderThan.toISOString()}`)
      .returning();
    
    return result.length;
  }
  
  async getActiveSessions(): Promise<Array<{id: number, username: string, lastActive: Date}>> {
    try {
      const usersData = await this.getAllUsers();
      
      // Sử dụng sessionStore để tìm các phiên người dùng đang hoạt động
      return new Promise((resolve, reject) => {
        const activeUsers: Array<{id: number, username: string, lastActive: Date}> = [];
        
        try {
          if (!this.sessionStore || typeof this.sessionStore.all !== 'function') {
            // Nếu không thể truy cập sessionStore, trả về danh sách trống
            console.warn("Session store is not available.");
            return resolve([]);
          }
          
          this.sessionStore.all((err: Error | null, sessions: Record<string, any> | null) => {
            if (err) {
              console.error("Error getting sessions:", err);
              // Nếu có lỗi, trả về danh sách trống
              return resolve([]);
            }
            
            if (sessions) {
              const now = new Date();
              
              // Tìm các phiên hợp lệ (còn hoạt động)
              Object.values(sessions).forEach((session: any) => {
                if (session?.passport?.user) {
                  const userId = session.passport.user;
                  // Session cookie expires thường được set vào tương lai (thời điểm hết hạn)
                  // Để tính thời gian hoạt động cuối, ta lấy thời gian hiện tại trừ đi một khoảng thời gian
                  // dựa trên thời gian còn lại của cookie
                  const expiryTime = session.cookie._expires 
                    ? new Date(session.cookie._expires) 
                    : new Date(now.getTime() + 1000 * 60 * 30); // Mặc định 30 phút
                  
                  // Tính thời gian hoạt động cuối
                  // Sử dụng lastAccess của session nếu có, nếu không thì tính toán dựa trên thời gian hết hạn
                  let lastActiveTime;
                  if (session.lastAccess) {
                    lastActiveTime = new Date(session.lastAccess);
                  } else {
                    // Dự đoán thời gian hoạt động cuối dựa trên thời gian hết hạn và thời gian sống của session
                    const sessionMaxAge = session.cookie.originalMaxAge || (1000 * 60 * 60); // Mặc định 1 giờ
                    lastActiveTime = new Date(expiryTime.getTime() - sessionMaxAge);
                  }
                  
                  // Tính thời gian chênh lệch giữa now và thời gian hoạt động cuối
                  const timeDiff = now.getTime() - lastActiveTime.getTime();
                  
                  // Chỉ thêm người dùng hoạt động trong 15 phút gần đây (900000ms = 15 phút)
                  if (expiryTime > now && timeDiff < 900000) {
                    // Tìm thông tin người dùng từ danh sách users
                    const user = usersData.find(u => u.id === userId);
                    if (user) {
                      // Thêm vào danh sách người dùng đang hoạt động nếu chưa tồn tại
                      if (!activeUsers.some(u => u.id === user.id)) {
                        activeUsers.push({
                          id: user.id,
                          username: user.username,
                          lastActive: lastActiveTime
                        });
                      }
                    }
                  }
                }
              });
            }
            
            // Sắp xếp danh sách người dùng theo thời gian hoạt động mới nhất
            activeUsers.sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
            resolve(activeUsers);
          });
        } catch (error) {
          console.error("Error in session processing:", error);
          // Trả về danh sách trống nếu có lỗi trong quá trình xử lý
          resolve([]);
        }
      });
    } catch (error) {
      console.error("Error getting active sessions:", error);
      return [];
    }
  }
  
  async getUserPreferences(userId: number): Promise<UserPreference | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    
    return preferences;
  }

  async updateUserPreferences(userId: number, movieData: {movieSlug: string, categories: string[], country?: string}): Promise<UserPreference> {
    // Tìm đối tượng preferences hiện tại của người dùng
    const existingPrefs = await this.getUserPreferences(userId);
    
    let newCategories: Record<string, number> = {};
    let newCountries: Record<string, number> = {};
    
    // Nếu đã có preferences, cập nhật thông tin hiện có
    if (existingPrefs) {
      // Sao chép dữ liệu hiện tại
      newCategories = { ...existingPrefs.categories as Record<string, number> };
      newCountries = { ...existingPrefs.countries as Record<string, number> };
      
      // Cập nhật số lần xem cho từng thể loại
      movieData.categories.forEach(category => {
        if (newCategories[category]) {
          newCategories[category] += 1;
        } else {
          newCategories[category] = 1;
        }
      });
      
      // Cập nhật số lần xem cho quốc gia (nếu có)
      if (movieData.country) {
        if (newCountries[movieData.country]) {
          newCountries[movieData.country] += 1;
        } else {
          newCountries[movieData.country] = 1;
        }
      }
      
      // Cập nhật vào database
      const [updatedPrefs] = await db
        .update(userPreferences)
        .set({
          categories: newCategories,
          countries: newCountries,
          lastUpdated: new Date()
        })
        .where(eq(userPreferences.userId, userId))
        .returning();
      
      return updatedPrefs;
    } else {
      // Tạo đối tượng preferences mới cho người dùng
      
      // Khởi tạo số lần xem cho từng thể loại
      movieData.categories.forEach(category => {
        newCategories[category] = 1;
      });
      
      // Khởi tạo số lần xem cho quốc gia (nếu có)
      if (movieData.country) {
        newCountries[movieData.country] = 1;
      }
      
      // Thêm vào database
      const [newPrefs] = await db
        .insert(userPreferences)
        .values({
          userId,
          categories: newCategories,
          countries: newCountries,
          lastUpdated: new Date()
        })
        .returning();
      
      return newPrefs;
    }
  }

  async getTopUserCategories(userId: number, limit: number = 5): Promise<{category: string, count: number}[]> {
    const prefs = await this.getUserPreferences(userId);
    
    if (!prefs || !prefs.categories) {
      return [];
    }
    
    // Chuyển đổi từ đối tượng thành mảng và sắp xếp theo số lần xem giảm dần
    const categoriesArray = Object.entries(prefs.categories as Record<string, number>)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return categoriesArray;
  }

  async getTopUserCountries(userId: number, limit: number = 3): Promise<{country: string, count: number}[]> {
    const prefs = await this.getUserPreferences(userId);
    
    if (!prefs || !prefs.countries) {
      return [];
    }
    
    // Chuyển đổi từ đối tượng thành mảng và sắp xếp theo số lần xem giảm dần
    const countriesArray = Object.entries(prefs.countries as Record<string, number>)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return countriesArray;
  }
  
  // PHƯƠNG THỨC CHO AI ĐỀ XUẤT PHIM
  
  async getUserRecommendations(userId: number): Promise<UserRecommendation | undefined> {
    // Tìm đề xuất đã được tạo và chưa hiển thị cho người dùng
    const [recommendations] = await db
      .select()
      .from(userRecommendations)
      .where(
        and(
          eq(userRecommendations.userId, userId),
          eq(userRecommendations.isViewed, false)
        )
      )
      .orderBy(desc(userRecommendations.createdAt))
      .limit(1);
    
    return recommendations;
  }

  async generateRecommendations(userId: number): Promise<UserRecommendation> {
    // 1. Lấy thông tin sở thích của người dùng
    const topCategories = await this.getTopUserCategories(userId, 3);
    const topCountries = await this.getTopUserCountries(userId, 2);
    
    // Nếu người dùng chưa có dữ liệu xem phim, trả về đề xuất trống
    if (topCategories.length === 0 && topCountries.length === 0) {
      // Tạo đề xuất mặc định (sử dụng các phim phổ biến)
      const [newRecommendation] = await db
        .insert(userRecommendations)
        .values({
          userId,
          // Trường hợp chưa có dữ liệu, đặt là mảng rỗng - frontend sẽ hiển thị phim trending thay thế
          movieSlugs: [],
          basedOnCategories: [],
          basedOnCountries: [],
          confidenceScore: 50, // Độ tin cậy thấp vì không dựa trên dữ liệu người dùng
          createdAt: new Date(),
          isViewed: false
        })
        .returning();
      
      return newRecommendation;
    }
    
    // 2. Lấy phim thuộc các thể loại và quốc gia yêu thích của người dùng
    // Đánh dấu các đề xuất cũ là đã xem
    await this.markRecommendationsAsViewed(userId);
    
    // Tạo danh sách thể loại và quốc gia để sử dụng trong đề xuất
    const categoryList = topCategories.map(c => c.category);
    const countryList = topCountries.map(c => c.country);
    
    // 3. Tạo đề xuất mới và lưu vào cơ sở dữ liệu
    // Phía frontend sẽ thực hiện việc lấy phim theo các thể loại và quốc gia này
    const [newRecommendation] = await db
      .insert(userRecommendations)
      .values({
        userId,
        movieSlugs: [], // Trong thực tế, chúng ta sẽ lấy danh sách phim từ API bên ngoài
        basedOnCategories: categoryList,
        basedOnCountries: countryList,
        confidenceScore: Math.min(100, 60 + topCategories.length * 10 + topCountries.length * 5), 
        createdAt: new Date(),
        isViewed: false
      })
      .returning();
    
    return newRecommendation;
  }
  
  /**
   * Tạo đề xuất phim dựa trên dữ liệu từ mô hình AI
   * @param userId ID của người dùng
   * @param preferredCategories Danh sách thể loại ưa thích
   * @param preferredCountries Danh sách quốc gia ưa thích
   * @param confidenceScore Điểm tin cậy (0-100)
   * @returns Promise<UserRecommendation>
   */
  async generateRecommendationsWithData(
    userId: number, 
    preferredCategories: string[],
    preferredCountries: string[],
    confidenceScore: number
  ): Promise<UserRecommendation> {
    // Đánh dấu các đề xuất cũ là đã xem trước khi tạo mới
    await this.markRecommendationsAsViewed(userId);
    
    // Tạo một đề xuất mới với dữ liệu từ AI
    const [newRecommendation] = await db
      .insert(userRecommendations)
      .values({
        userId,
        movieSlugs: [], // Phía API sẽ lấy danh sách phim
        basedOnCategories: preferredCategories,
        basedOnCountries: preferredCountries,
        confidenceScore: confidenceScore,
        createdAt: new Date(),
        isViewed: false
      })
      .returning();
    
    return newRecommendation;
  }

  async markRecommendationsAsViewed(userId: number): Promise<void> {
    await db
      .update(userRecommendations)
      .set({ isViewed: true })
      .where(eq(userRecommendations.userId, userId));
  }
}

export const storage = new DatabaseStorage();