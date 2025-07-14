import { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { insertCommentSchema } from "@shared/schema";
import { z } from "zod";

export function setupCommentRoutes(app: Express) {
  // Lấy tất cả bình luận của một phim
  app.get('/api/comments/:movieSlug', async (req, res) => {
    try {
      const { movieSlug } = req.params;
      const comments = await storage.getMovieComments(movieSlug);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Không thể lấy bình luận', error: (error as Error).message });
    }
  });

  // Thêm bình luận mới
  app.post('/api/comments', isAuthenticated, async (req, res) => {
    try {
      // Validate dữ liệu đầu vào
      const validatedData = insertCommentSchema.parse(req.body);
      
      // Kiểm tra xem người dùng có quyền thêm bình luận không
      const user = req.user as any;
      if (validatedData.userId !== user.id) {
        return res.status(403).json({ message: 'Bạn không có quyền thêm bình luận cho người dùng khác' });
      }
      
      // Thêm bình luận vào cơ sở dữ liệu
      const comment = await storage.createComment(validatedData);
      
      // Lấy thông tin người dùng để trả về cùng với bình luận
      const commentAuthor = await storage.getUser(comment.userId);
      
      // Trả về bình luận đã được tạo kèm thông tin người dùng
      res.status(201).json({
        ...comment,
        username: commentAuthor?.username
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Dữ liệu bình luận không hợp lệ', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Không thể tạo bình luận', error: (error as Error).message });
      }
    }
  });

  // Cập nhật bình luận
  app.put('/api/comments/:id', isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'Nội dung bình luận không được để trống' });
      }
      
      // Kiểm tra xem bình luận có tồn tại không
      const existingComment = await storage.getComment(commentId);
      if (!existingComment) {
        return res.status(404).json({ message: 'Không tìm thấy bình luận' });
      }
      
      // Kiểm tra quyền cập nhật bình luận
      const user = req.user as any;
      if (existingComment.userId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ message: 'Bạn không có quyền cập nhật bình luận này' });
      }
      
      // Cập nhật bình luận
      const updatedComment = await storage.updateComment(commentId, content);
      
      // Trả về bình luận đã được cập nhật
      res.json(updatedComment);
    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({ message: 'Không thể cập nhật bình luận', error: (error as Error).message });
    }
  });

  // Xóa bình luận
  app.delete('/api/comments/:id', isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      
      // Kiểm tra xem bình luận có tồn tại không
      const existingComment = await storage.getComment(commentId);
      if (!existingComment) {
        return res.status(404).json({ message: 'Không tìm thấy bình luận' });
      }
      
      // Kiểm tra quyền xóa bình luận
      const user = req.user as any;
      if (existingComment.userId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ message: 'Bạn không có quyền xóa bình luận này' });
      }
      
      // Xóa bình luận
      await storage.deleteComment(commentId);
      
      // Trả về thành công
      res.json({ message: 'Bình luận đã được xóa thành công' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ message: 'Không thể xóa bình luận', error: (error as Error).message });
    }
  });
}