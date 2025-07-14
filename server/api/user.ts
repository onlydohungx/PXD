import { Request, Response } from "express";
import { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { insertWatchHistorySchema, insertFavoriteSchema } from "@shared/schema";

export function setupUserRoutes(app: Express) {
  // Lấy lịch sử xem phim
  app.get("/api/user/watch-history", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Xác thực đã được thực hiện thông qua middleware isAuthenticated
      const userId = (req as any).user.id;
      const watchHistory = await storage.getWatchHistory(userId);
      return res.json(watchHistory);
    } catch (error: any) {
      console.error("Error fetching watch history:", error);
      return res.status(500).json({ error: error.message || "Không thể lấy lịch sử xem" });
    }
  });

  // Thêm vào lịch sử xem phim
  app.post("/api/user/watch-history", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { movieSlug, episodeIndex, currentTime, duration, progress } = req.body;
      
      if (!movieSlug) {
        return res.status(400).json({ error: "Thiếu thông tin phim" });
      }
      
      const userId = (req as any).user.id;
      const result = await storage.addToWatchHistory({
        userId,
        movieSlug,
        episodeIndex: episodeIndex || 0,
        currentTime: currentTime || 0,
        duration: duration || 0,
        progress: progress || 0
      });
      
      return res.status(201).json({
        status: true,
        message: "Đã thêm vào lịch sử xem",
        data: result
      });
    } catch (error: any) {
      console.error("Error adding to watch history:", error);
      return res.status(500).json({ error: error.message || "Lỗi khi thêm vào lịch sử xem" });
    }
  });
  
  // Lấy tiến trình xem phim
  app.get("/api/user/watch-progress/:movieSlug/:episodeIndex?", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { movieSlug, episodeIndex } = req.params;
      const userId = (req as any).user.id;
      
      const watchProgress = await storage.getWatchProgress(
        userId, 
        movieSlug, 
        episodeIndex ? parseInt(episodeIndex) : 0
      );
      
      if (watchProgress) {
        return res.json({
          status: true,
          data: watchProgress
        });
      } else {
        return res.json({
          status: false,
          message: "Không tìm thấy tiến trình xem",
          data: {
            currentTime: 0,
            duration: 0,
            progress: 0
          }
        });
      }
    } catch (error: any) {
      console.error("Error fetching watch progress:", error);
      return res.status(500).json({ 
        error: error.message || "Lỗi khi lấy tiến trình xem phim",
        data: {
          currentTime: 0,
          duration: 0,
          progress: 0
        }
      });
    }
  });
  
  // Lấy danh sách các tập đã xem của một phim
  app.get("/api/user/watch-history/episodes/:movieSlug", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { movieSlug } = req.params;
      const userId = (req as any).user.id;
      
      // Lấy toàn bộ lịch sử xem của người dùng với bộ phim này
      const watchHistory = await storage.getWatchHistory(userId);
      
      // Lọc ra các tập của bộ phim cụ thể này
      const movieWatchHistory = watchHistory.filter(item => item.movieSlug === movieSlug);
      
      // Trích xuất các tập đã xem (có progress > 0)
      const watchedEpisodes = movieWatchHistory
        .filter(item => item.progress && item.progress > 0)
        .map(item => item.episodeIndex);
      
      return res.json({
        status: true,
        episodes: watchedEpisodes
      });
    } catch (error: any) {
      console.error("Error fetching watched episodes:", error);
      return res.status(500).json({ 
        status: false,
        message: error.message || "Lỗi khi lấy danh sách tập đã xem",
        episodes: []
      });
    }
  });

  // Xóa khỏi lịch sử xem phim
  app.delete("/api/user/watch-history/:movieSlug", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { movieSlug } = req.params;
      const userId = (req as any).user.id;
      
      await storage.removeFromWatchHistory(userId, movieSlug);
      
      return res.json({
        status: true,
        message: "Đã xóa khỏi lịch sử xem"
      });
    } catch (error: any) {
      console.error("Error removing from watch history:", error);
      return res.status(500).json({ error: error.message || "Lỗi khi xóa khỏi lịch sử xem" });
    }
  });

  // Lấy danh sách phim yêu thích
  app.get("/api/user/favorites", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const favorites = await storage.getFavorites(userId);
      return res.json(favorites);
    } catch (error: any) {
      console.error("Error fetching favorites:", error);
      return res.status(500).json({ error: error.message || "Không thể lấy danh sách phim yêu thích" });
    }
  });

  // Thêm vào danh sách phim yêu thích
  app.post("/api/user/favorites", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { movieSlug } = req.body;
      
      if (!movieSlug) {
        return res.status(400).json({ error: "Thiếu thông tin phim" });
      }
      
      const userId = (req as any).user.id;
      const result = await storage.addToFavorites({
        userId,
        movieSlug
      });
      
      return res.status(201).json({
        status: true,
        message: "Đã thêm vào danh sách yêu thích",
        data: result
      });
    } catch (error: any) {
      console.error("Error adding to favorites:", error);
      return res.status(500).json({ error: error.message || "Lỗi khi thêm vào danh sách yêu thích" });
    }
  });

  // Xóa khỏi danh sách phim yêu thích
  app.delete("/api/user/favorites/:movieSlug", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { movieSlug } = req.params;
      const userId = (req as any).user.id;
      
      await storage.removeFromFavorites(userId, movieSlug);
      
      return res.json({
        status: true,
        message: "Đã xóa khỏi danh sách yêu thích"
      });
    } catch (error: any) {
      console.error("Error removing from favorites:", error);
      return res.status(500).json({ error: error.message || "Lỗi khi xóa khỏi danh sách yêu thích" });
    }
  });

  // Kiểm tra phim có trong danh sách yêu thích không
  app.get("/api/user/favorites/check/:movieSlug", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { movieSlug } = req.params;
      const userId = (req as any).user.id;
      
      const isFavorite = await storage.isFavorite(userId, movieSlug);
      
      return res.json({
        isFavorite
      });
    } catch (error: any) {
      console.error("Error checking favorite status:", error);
      return res.status(500).json({ error: error.message || "Lỗi khi kiểm tra trạng thái yêu thích" });
    }
  });
}