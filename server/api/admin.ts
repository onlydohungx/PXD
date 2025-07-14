import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAdmin } from "../auth";
import { User } from "@shared/schema";
import { db } from "../db.js";
import * as schema from "../../shared/schema.js";
import { eq } from "drizzle-orm";

export function setupAdminRoutes(app: Express) {
  
  // API để xóa dữ liệu lượt xem phim theo ngày cũ
  app.post("/api/admin/cleanup-daily-views", isAdmin, async (req: Request, res: Response) => {
    try {
      // Nếu có cung cấp date trong request, sử dụng nó, nếu không thì mặc định là ngày hiện tại
      const dateStr = req.body.date;
      let date = new Date(); // Mặc định là ngày hiện tại
      
      if (dateStr) {
        date = new Date(dateStr);
      }
      
      // Xóa dữ liệu cũ hơn ngày đã chỉ định
      const deletedCount = await storage.cleanupOldDailyMovieViews(date);
      
      res.json({
        status: true,
        message: `Đã xóa ${deletedCount} bản ghi lượt xem phim cũ hơn ${date.toISOString().split('T')[0]}`,
        deletedCount
      });
    } catch (error) {
      console.error("Error cleaning up daily movie views:", error);
      res.status(500).json({
        status: false,
        message: "Có lỗi xảy ra khi xóa dữ liệu lượt xem phim theo ngày",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  // Get all users
  app.get("/api/admin/users", isAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove password from the response
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Không thể tải danh sách người dùng" });
    }
  });

  // Update user
  app.put("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { username, email, role } = req.body;
      
      // Make sure admin can't downgrade themselves
      if (req.user!.id === userId && role !== "admin") {
        return res.status(400).json({ message: "Không thể thay đổi quyền của chính mình" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        username,
        email,
        role,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Không thể cập nhật người dùng" });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Admin can't delete themselves
      if (req.user!.id === userId) {
        return res.status(400).json({ message: "Không thể xóa tài khoản của chính mình" });
      }
      
      await storage.deleteUser(userId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Không thể xóa người dùng" });
    }
  });

  // Database Stats API
  app.get("/api/admin/db-stats", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const comments = await storage.getMovieComments(""); // Get all comments
      
      res.json({
        totalUsers: users.length,
        totalComments: comments.length,
        totalViews: 0, // Simplified for now
        dailyViewsCount: 0
      });
    } catch (error) {
      console.error("Error fetching database stats:", error);
      res.status(500).json({ message: "Không thể lấy thống kê database" });
    }
  });

  // Maintenance Mode APIs
  app.get("/api/admin/maintenance", isAdmin, async (req: Request, res: Response) => {
    try {
      // Check if maintenance mode is enabled
      const setting = await db.select()
        .from(schema.systemSettings)
        .where(eq(schema.systemSettings.key, 'maintenance_mode'))
        .limit(1);
      
      const isMaintenanceMode = setting.length > 0 ? setting[0].value === 'true' : false;
      
      res.json({ 
        maintenanceMode: isMaintenanceMode,
        message: setting.length > 0 ? setting[0].description : ''
      });
    } catch (error) {
      console.error("Error fetching maintenance status:", error);
      res.status(500).json({ message: "Không thể lấy trạng thái bảo trì" });
    }
  });

  app.post("/api/admin/maintenance", isAdmin, async (req: Request, res: Response) => {
    try {
      const { enabled, message } = req.body;
      
      // Update or create maintenance mode setting
      await db.insert(schema.systemSettings)
        .values({
          key: 'maintenance_mode',
          value: enabled ? 'true' : 'false',
          description: message || 'Hệ thống đang bảo trì'
        })
        .onConflictDoUpdate({
          target: schema.systemSettings.key,
          set: {
            value: enabled ? 'true' : 'false',
            description: message || 'Hệ thống đang bảo trì',
            updatedAt: new Date()
          }
        });
      
      res.json({ 
        success: true, 
        message: enabled ? "Đã bật chế độ bảo trì" : "Đã tắt chế độ bảo trì" 
      });
    } catch (error) {
      console.error("Error updating maintenance mode:", error);
      res.status(500).json({ message: "Không thể cập nhật chế độ bảo trì" });
    }
  });

  // Check maintenance status for all users
  app.get("/api/maintenance-status", async (req: Request, res: Response) => {
    try {
      const setting = await db.select()
        .from(schema.systemSettings)
        .where(eq(schema.systemSettings.key, 'maintenance_mode'))
        .limit(1);
      
      const isMaintenanceMode = setting.length > 0 ? setting[0].value === 'true' : false;
      
      res.json({ 
        maintenanceMode: isMaintenanceMode,
        message: setting.length > 0 ? setting[0].description : ''
      });
    } catch (error) {
      res.json({ maintenanceMode: false, message: '' });
    }
  });

  // Stats API
  app.get("/api/admin/stats", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Count users by role
      const adminCount = users.filter(user => user.role === "admin").length;
      const userCount = users.filter(user => user.role === "user").length;
      
      res.json({
        totalUsers: users.length,
        adminCount,
        userCount
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Không thể tải thống kê" });
    }
  });
}
