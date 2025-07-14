import { Request, Response } from "express";
import { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated, isAdmin } from "../auth";
import { insertNotificationSchema } from "@shared/schema";

export function setupNotificationRoutes(app: Express) {
  // Lấy tất cả thông báo (chỉ dành cho admin)
  app.get("/api/admin/notifications", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getNotifications(false); // Lấy tất cả thông báo, kể cả không active
      
      // Ở đây có thể bổ sung phân trang nếu số lượng thông báo nhiều

      return res.json(notifications);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({ error: error.message || "Không thể lấy danh sách thông báo" });
    }
  });

  // Lấy thông báo mới nhất (có thể dùng cho trang chủ)
  app.get("/api/notifications/latest", async (req: Request, res: Response) => {
    try {
      const notification = await storage.getLatestNotification(true); // Chỉ lấy thông báo active
      
      if (!notification) {
        return res.status(404).json({ error: "Không tìm thấy thông báo nào" });
      }

      return res.json(notification);
    } catch (error: any) {
      console.error("Error fetching latest notification:", error);
      return res.status(500).json({ error: error.message || "Không thể lấy thông báo mới nhất" });
    }
  });

  // Lấy thông báo theo ID
  app.get("/api/notifications/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID thông báo không hợp lệ" });
      }

      const notification = await storage.getNotification(id);
      
      if (!notification) {
        return res.status(404).json({ error: "Không tìm thấy thông báo" });
      }

      return res.json(notification);
    } catch (error: any) {
      console.error("Error fetching notification:", error);
      return res.status(500).json({ error: error.message || "Không thể lấy thông báo" });
    }
  });

  // Tạo thông báo mới (chỉ dành cho admin)
  app.post("/api/admin/notifications", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const schema = insertNotificationSchema.extend({
        title: z.string().min(3, "Tiêu đề phải có ít nhất 3 ký tự").max(100, "Tiêu đề không được quá 100 ký tự"),
        content: z.string().min(5, "Nội dung phải có ít nhất 5 ký tự").max(1000, "Nội dung không được quá 1000 ký tự"),
      });
      
      const validatedData = schema.parse({
        ...req.body,
        createdBy: req.user?.id // Thêm ID của người tạo (admin)
      });

      const notification = await storage.createNotification(validatedData);
      
      return res.status(201).json(notification);
    } catch (error: any) {
      console.error("Error creating notification:", error);
      
      if (error.name === "ZodError") {
        // Xử lý lỗi validation từ Zod
        return res.status(400).json({ 
          error: "Dữ liệu không hợp lệ", 
          details: error.errors 
        });
      }
      
      return res.status(500).json({ error: error.message || "Không thể tạo thông báo" });
    }
  });

  // Cập nhật thông báo (chỉ dành cho admin)
  app.put("/api/admin/notifications/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID thông báo không hợp lệ" });
      }

      // Kiểm tra xem thông báo có tồn tại không
      const existingNotification = await storage.getNotification(id);
      if (!existingNotification) {
        return res.status(404).json({ error: "Không tìm thấy thông báo" });
      }

      // Validate request body
      const schema = z.object({
        title: z.string().min(3, "Tiêu đề phải có ít nhất 3 ký tự").max(100, "Tiêu đề không được quá 100 ký tự"),
        content: z.string().min(5, "Nội dung phải có ít nhất 5 ký tự").max(1000, "Nội dung không được quá 1000 ký tự"),
        isActive: z.boolean().optional(),
      });
      
      const validatedData = schema.parse(req.body);

      const updatedNotification = await storage.updateNotification(id, validatedData);
      
      return res.json(updatedNotification);
    } catch (error: any) {
      console.error("Error updating notification:", error);
      
      if (error.name === "ZodError") {
        // Xử lý lỗi validation từ Zod
        return res.status(400).json({ 
          error: "Dữ liệu không hợp lệ", 
          details: error.errors 
        });
      }
      
      return res.status(500).json({ error: error.message || "Không thể cập nhật thông báo" });
    }
  });

  // Thay đổi trạng thái thông báo (chỉ dành cho admin)
  app.patch("/api/admin/notifications/:id/toggle", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID thông báo không hợp lệ" });
      }

      // Kiểm tra xem thông báo có tồn tại không
      const existingNotification = await storage.getNotification(id);
      if (!existingNotification) {
        return res.status(404).json({ error: "Không tìm thấy thông báo" });
      }

      const updatedNotification = await storage.toggleNotificationStatus(id);
      
      return res.json(updatedNotification);
    } catch (error: any) {
      console.error("Error toggling notification status:", error);
      return res.status(500).json({ error: error.message || "Không thể thay đổi trạng thái thông báo" });
    }
  });

  // Xóa thông báo (chỉ dành cho admin)
  app.delete("/api/admin/notifications/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID thông báo không hợp lệ" });
      }

      // Kiểm tra xem thông báo có tồn tại không
      const existingNotification = await storage.getNotification(id);
      if (!existingNotification) {
        return res.status(404).json({ error: "Không tìm thấy thông báo" });
      }

      await storage.deleteNotification(id);
      
      return res.json({ success: true, message: "Đã xóa thông báo thành công" });
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      return res.status(500).json({ error: error.message || "Không thể xóa thông báo" });
    }
  });
}