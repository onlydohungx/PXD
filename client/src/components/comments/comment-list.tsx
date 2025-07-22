import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMovieComments, addComment, updateComment, deleteComment } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit, Trash2, Reply, Star, MoreVertical, MessageCircle, User, Heart, ThumbsUp } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
// Import axios để sử dụng trực tiếp với API endpoint
import axios from "axios";

interface CommentListProps {
  movieSlug: string;
}

export function CommentList({ movieSlug }: CommentListProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<{id: number, content: string} | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Query để lấy danh sách bình luận
  const { data: comments = [], isLoading, isError } = useQuery({ 
    queryKey: ['comments', movieSlug],
    queryFn: () => fetchMovieComments(movieSlug)
  });

  // Mutation để thêm bình luận mới
  const addCommentMutation = useMutation({
    mutationFn: (data: {
      userId: number;
      movieSlug: string;
      content: string;
      rating?: number;
      parentId?: number;
    }) => addComment(data),
    onMutate: async (newCommentData) => {
      // Hủy các yêu cầu đang chờ xử lý để tránh ghi đè dữ liệu lạc hậu
      await queryClient.cancelQueries({ queryKey: ['comments', movieSlug] });
      
      // Lưu trữ trạng thái hiện tại để có thể khôi phục khi có lỗi
      const previousComments = queryClient.getQueryData(['comments', movieSlug]);
      
      // Thêm bình luận mới vào danh sách ngay lập tức
      queryClient.setQueryData(['comments', movieSlug], (old: any) => {
        const newComment = {
          id: Date.now(), // ID tạm thời
          userId: newCommentData.userId,
          username: user?.username,
          movieSlug: newCommentData.movieSlug,
          content: newCommentData.content,
          rating: newCommentData.rating,
          parentId: newCommentData.parentId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        return [...(old || []), newComment];
      });
      
      // Trả về ngữ cảnh để sử dụng trong onError
      return { previousComments };
    },
    onSuccess: (result, variables) => {
      // Cập nhật dữ liệu để ID bình luận tạm thời được thay thế bằng ID thực từ máy chủ
      queryClient.invalidateQueries({ queryKey: ['comments', movieSlug] });
      setNewComment("");
      setRating(5);
      toast({
        title: "Thành công",
        description: "Bình luận của bạn đã được thêm",
      });
    },
    onError: (error: any, variables, context) => {
      // Khôi phục trạng thái trước khi bình luận
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', movieSlug], context.previousComments);
      }
      
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm bình luận",
        variant: "destructive",
      });
    }
  });

  // Mutation để cập nhật bình luận
  const updateCommentMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => updateComment(id, content),
    onMutate: async (updatedCommentData) => {
      // Hủy các yêu cầu đang chờ xử lý để tránh ghi đè dữ liệu lạc hậu
      await queryClient.cancelQueries({ queryKey: ['comments', movieSlug] });
      
      // Lưu trữ trạng thái hiện tại để có thể khôi phục khi có lỗi
      const previousComments = queryClient.getQueryData(['comments', movieSlug]);
      
      // Cập nhật bình luận trong danh sách ngay lập tức
      queryClient.setQueryData(['comments', movieSlug], (old: any) => {
        return (old || []).map((comment: any) => {
          if (comment.id === updatedCommentData.id) {
            return {
              ...comment,
              content: updatedCommentData.content,
              updatedAt: new Date().toISOString()
            };
          }
          return comment;
        });
      });
      
      // Đóng hộp thoại chỉnh sửa
      setEditingComment(null);
      
      // Trả về ngữ cảnh để sử dụng trong onError
      return { previousComments };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', movieSlug] });
      toast({
        title: "Thành công",
        description: "Bình luận đã được cập nhật",
      });
    },
    onError: (error: any, variables, context) => {
      // Khôi phục trạng thái trước khi cập nhật
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', movieSlug], context.previousComments);
      }
      // Mở lại hộp thoại chỉnh sửa trong trường hợp lỗi
      setEditingComment({
        id: variables.id,
        content: variables.content
      });
      
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật bình luận",
        variant: "destructive",
      });
    }
  });

  // Mutation để xóa bình luận
  const deleteCommentMutation = useMutation({
    mutationFn: (id: number) => deleteComment(id),
    onMutate: async (commentId) => {
      // Hủy các yêu cầu đang chờ xử lý để tránh ghi đè dữ liệu lạc hậu
      await queryClient.cancelQueries({ queryKey: ['comments', movieSlug] });
      
      // Lưu trữ trạng thái hiện tại để có thể khôi phục khi có lỗi
      const previousComments = queryClient.getQueryData(['comments', movieSlug]);
      
      // Xóa bình luận khỏi danh sách ngay lập tức
      queryClient.setQueryData(['comments', movieSlug], (old: any) => {
        return (old || []).filter((comment: any) => comment.id !== commentId);
      });
      
      // Trả về ngữ cảnh để sử dụng trong onError
      return { previousComments };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', movieSlug] });
      toast({
        title: "Thành công",
        description: "Bình luận đã được xóa",
      });
    },
    onError: (error: any, commentId, context) => {
      // Khôi phục trạng thái trước khi xóa
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', movieSlug], context.previousComments);
      }
      
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa bình luận",
        variant: "destructive",
      });
    }
  });

  // Mutation để thêm bình luận trả lời
  const addReplyMutation = useMutation({
    mutationFn: (data: {
      userId: number;
      movieSlug: string;
      content: string;
      parentId: number;
    }) => addComment(data),
    onMutate: async (newReplyData) => {
      // Hủy các yêu cầu đang chờ xử lý để tránh ghi đè dữ liệu lạc hậu
      await queryClient.cancelQueries({ queryKey: ['comments', movieSlug] });
      
      // Lưu trữ trạng thái hiện tại để có thể khôi phục khi có lỗi
      const previousComments = queryClient.getQueryData(['comments', movieSlug]);
      
      // Thêm trả lời mới vào danh sách ngay lập tức
      queryClient.setQueryData(['comments', movieSlug], (old: any) => {
        const newReply = {
          id: Date.now(), // ID tạm thời
          userId: newReplyData.userId,
          username: user?.username,
          movieSlug: newReplyData.movieSlug,
          content: newReplyData.content,
          parentId: newReplyData.parentId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        return [...(old || []), newReply];
      });
      
      // Trả về ngữ cảnh để sử dụng trong onError
      return { previousComments };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', movieSlug] });
      setReplyingTo(null);
      setReplyContent("");
      toast({
        title: "Thành công",
        description: "Trả lời bình luận đã được thêm",
      });
    },
    onError: (error: any, variables, context) => {
      // Khôi phục trạng thái trước khi trả lời
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', movieSlug], context.previousComments);
      }
      
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm trả lời",
        variant: "destructive",
      });
    }
  });

  // Xử lý thêm bình luận mới
  const handleAddComment = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để bình luận",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập nội dung bình luận",
        variant: "destructive",
      });
      return;
    }

    try {
      // Tạo bình luận tạm thời và cập nhật UI trước
      const tempComment = {
        id: Date.now(), // ID tạm thời
        userId: user.id,
        username: user.username,
        movieSlug,
        content: newComment,
        rating,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Cập nhật UI cục bộ ngay lập tức
      const currentComments = queryClient.getQueryData(['comments', movieSlug]) || [];
      queryClient.setQueryData(['comments', movieSlug], [...(Array.isArray(currentComments) ? currentComments : []), tempComment]);

      // Reset form
      setNewComment("");
      setRating(5);

      // Gọi API để lưu trữ bình luận thực
      const response = await axios.post('/api/comments', {
        userId: user.id,
        movieSlug,
        content: newComment,
        rating
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      // Cập nhật cache với dữ liệu thực từ máy chủ
      queryClient.setQueryData(['comments', movieSlug], (old: any) => {
        // Thay thế bình luận tạm thời bằng bình luận thực
        return old.map((comment: any) => 
          comment.id === tempComment.id ? response.data : comment
        );
      });

      toast({
        title: "Thành công",
        description: "Bình luận của bạn đã được thêm",
      });
    } catch (error: any) {
      console.error('Error adding comment:', error);
      
      // Xóa bình luận tạm thời nếu có lỗi
      queryClient.setQueryData(['comments', movieSlug], (old: any) => {
        return (old || []).filter((comment: any) => 
          !(comment.id === Date.now() && comment.content === newComment)
        );
      });
      
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm bình luận",
        variant: "destructive",
      });
    }
  };

  // Xử lý cập nhật bình luận
  const handleUpdateComment = async () => {
    if (!editingComment) return;
    
    if (!editingComment.content.trim()) {
      toast({
        title: "Lỗi",
        description: "Nội dung bình luận không được để trống",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdating(true);
      
      // Lưu nội dung bình luận gốc để có thể khôi phục nếu lỗi
      const currentComments = queryClient.getQueryData(['comments', movieSlug]) || [];
      const allComments = Array.isArray(currentComments) ? currentComments : [];
      const originalComment = allComments.find((c: any) => c.id === editingComment.id);
      
      if (!originalComment) {
        throw new Error("Không thể tìm thấy bình luận để cập nhật");
      }
      
      // Cập nhật UI cục bộ ngay lập tức
      queryClient.setQueryData(['comments', movieSlug], 
        allComments.map((comment: any) => 
          comment.id === editingComment.id 
            ? { ...comment, content: editingComment.content, updatedAt: new Date().toISOString() } 
            : comment
        )
      );
      
      // Đóng form chỉnh sửa
      setEditingComment(null);
      
      // Gọi API để cập nhật bình luận thực
      const response = await axios.put(`/api/comments/${editingComment.id}`, {
        content: editingComment.content
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      toast({
        title: "Thành công",
        description: "Bình luận đã được cập nhật",
      });
    } catch (error: any) {
      console.error('Error updating comment:', error);
      
      // Khôi phục lại bình luận gốc nếu có lỗi
      const currentComments = queryClient.getQueryData(['comments', movieSlug]) || [];
      const allComments = Array.isArray(currentComments) ? currentComments : [];
      const originalComment = allComments.find((c: any) => c.id === editingComment.id);
      
      if (originalComment && editingComment) {
        // Hiển thị lại form chỉnh sửa với nội dung gốc
        setEditingComment({
          id: editingComment.id,
          content: originalComment.content
        });
      }
      
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật bình luận",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Xử lý xóa bình luận
  const handleDeleteComment = async (id: number) => {
    try {
      setIsDeleting(true);
      
      // Lưu trữ danh sách bình luận hiện tại để có thể khôi phục nếu có lỗi
      const currentComments = queryClient.getQueryData(['comments', movieSlug]) || [];
      const allComments = Array.isArray(currentComments) ? currentComments : [];
      const commentToDelete = allComments.find((c: any) => c.id === id);
      
      if (!commentToDelete) {
        throw new Error("Không thể tìm thấy bình luận để xóa");
      }
      
      // Xóa bình luận và tất cả trả lời của nó khỏi UI ngay lập tức
      queryClient.setQueryData(['comments', movieSlug], 
        allComments.filter((comment: any) => 
          comment.id !== id && comment.parentId !== id
        )
      );
      
      // Gọi API để xóa bình luận thực
      await axios.delete(`/api/comments/${id}`, {
        withCredentials: true
      });
      
      toast({
        title: "Thành công",
        description: "Bình luận đã được xóa",
      });
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      
      // Khôi phục lại danh sách bình luận ban đầu nếu có lỗi
      queryClient.invalidateQueries({ queryKey: ['comments', movieSlug] });
      
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa bình luận",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Xử lý thêm trả lời bình luận
  const handleAddReply = async () => {
    if (!isAuthenticated || !user || !replyingTo) return;

    if (!replyContent.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập nội dung trả lời",
        variant: "destructive",
      });
      return;
    }

    try {
      // Tạo trả lời tạm thời và cập nhật UI trước
      const tempReply = {
        id: Date.now(), // ID tạm thời
        userId: user.id,
        username: user.username,
        movieSlug,
        content: replyContent,
        parentId: replyingTo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Cập nhật UI cục bộ ngay lập tức
      const currentComments = queryClient.getQueryData(['comments', movieSlug]) || [];
      queryClient.setQueryData(['comments', movieSlug], [...(Array.isArray(currentComments) ? currentComments : []), tempReply]);

      // Reset form
      setReplyContent("");
      setReplyingTo(null);

      // Gọi API để lưu trữ trả lời thực
      const response = await axios.post('/api/comments', {
        userId: user.id,
        movieSlug,
        content: replyContent,
        parentId: replyingTo
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      // Cập nhật cache với dữ liệu thực từ máy chủ
      queryClient.setQueryData(['comments', movieSlug], (old: any) => {
        // Thay thế trả lời tạm thời bằng trả lời thực
        return old.map((comment: any) => 
          comment.id === tempReply.id ? response.data : comment
        );
      });

      toast({
        title: "Thành công",
        description: "Trả lời bình luận đã được thêm",
      });
    } catch (error: any) {
      console.error('Error adding reply:', error);
      
      // Xóa trả lời tạm thời nếu có lỗi
      queryClient.setQueryData(['comments', movieSlug], (old: any) => {
        return (old || []).filter((comment: any) => 
          !(comment.id === Date.now() && comment.content === replyContent)
        );
      });
      
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm trả lời",
        variant: "destructive",
      });
    }
  };

  // Hàm hiển thị sao đánh giá
  const renderStars = (rating?: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
        ))}
        {Array.from({ length: 10 - rating }).map((_, i) => (
          <Star key={i + rating} size={16} className="text-gray-300" />
        ))}
      </div>
    );
  };

  // Hàm hiển thị bộ chọn sao đánh giá
  const renderRatingSelector = () => {
    return (
      <div className="flex flex-col gap-2 mb-4">
        <div className="text-sm font-medium">Đánh giá của bạn:</div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <Star 
              key={i} 
              size={20} 
              className={`cursor-pointer ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
              onClick={() => setRating(i + 1)}
            />
          ))}
        </div>
      </div>
    );
  };

  // Hàm kiểm tra người dùng có quyền chỉnh sửa bình luận không
  const canModifyComment = (commentUserId: number) => {
    return isAuthenticated && user && (user.id === commentUserId || user.role === 'admin');
  };

  // Hàm lọc các bình luận chính (không có parentId)
  const mainComments = comments.filter((comment: any) => !comment.parentId);
  
  // Hàm lọc các bình luận trả lời cho một bình luận chính
  const getReplies = (commentId: number) => {
    return comments.filter((comment: any) => comment.parentId === commentId);
  };

  // Hàm định dạng thời gian
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-6">Đang tải bình luận...</div>;
  }

  if (isError) {
    return <div className="flex justify-center p-6 text-red-500">Không thể tải bình luận</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Bình luận</h2>
            <p className="text-muted-foreground mt-1">
              {comments.length === 0 ? 'Chưa có bình luận nào' : `${comments.length} bình luận`}
            </p>
          </div>
        </div>
        {comments.length > 0 && (
          <Badge variant="secondary" className="px-3 py-1">
            {mainComments.length} bình luận gốc
          </Badge>
        )}
      </div>

      {/* Add Comment Form */}
      {isAuthenticated ? (
        <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">Chia sẻ ý kiến của bạn</CardTitle>
                <p className="text-sm text-muted-foreground">Bạn nghĩ gì về bộ phim này?</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderRatingSelector()}
            <div className="relative">
              <Textarea
                placeholder="Viết bình luận của bạn về bộ phim này... Hãy chia sẻ cảm nhận chân thật nhất!"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[120px] resize-none border-2 focus:border-primary/50 transition-colors"
              />
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                {newComment.length}/1000
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Đăng nhập với tư cách <span className="font-medium text-primary">{user?.username}</span>
            </p>
            <Button 
              onClick={handleAddComment}
              disabled={addCommentMutation.isPending || !newComment.trim()}
              className="px-6"
            >
              {addCommentMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Gửi bình luận
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-2 border-dashed border-muted-foreground/20">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium">Bạn cần đăng nhập để bình luận</p>
                <p className="text-muted-foreground">Chia sẻ ý kiến của bạn về bộ phim này</p>
              </div>
              <Button variant="outline" className="mt-4">
                Đăng nhập ngay
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="my-8" />

      {/* Comments List */}
      <div className="space-y-6">
        {mainComments.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="p-6 bg-muted/20 rounded-full w-fit mx-auto">
              <MessageCircle className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-muted-foreground">Chưa có bình luận nào</h3>
              <p className="text-muted-foreground mt-2">
                Hãy là người đầu tiên chia sẻ ý kiến về bộ phim này!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {mainComments.map((comment: any) => (
              <div key={comment.id} className="group">
                {/* Main Comment */}
                <Card className="border-l-4 border-l-primary/20 hover:border-l-primary/60 transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
                            {comment.username?.substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-lg">
                              {comment.username || "Người dùng ẩn danh"}
                            </h4>
                            {comment.rating && (
                              <Badge variant="outline" className="px-2 py-1">
                                {comment.rating}/10 ⭐
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(comment.createdAt)}
                            {comment.updatedAt !== comment.createdAt && " • Đã chỉnh sửa"}
                          </p>
                        </div>
                      </div>
                      {canModifyComment(comment.userId) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setEditingComment({
                              id: comment.id,
                              content: comment.content
                            })}>
                              <Edit className="mr-2 h-4 w-4" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <Dialog>
                              <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Xóa bình luận
                                </DropdownMenuItem>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Xác nhận xóa bình luận</DialogTitle>
                                </DialogHeader>
                                <p>Bạn có chắc chắn muốn xóa bình luận này không? Hành động này không thể hoàn tác.</p>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Hủy bỏ</Button>
                                  </DialogClose>
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => handleDeleteComment(comment.id)}
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? "Đang xóa..." : "Xóa"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    {comment.rating && (
                      <div className="flex items-center gap-1 mb-3">
                        {Array.from({ length: comment.rating }).map((_, i) => (
                          <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                        ))}
                        {Array.from({ length: 10 - comment.rating }).map((_, i) => (
                          <Star key={i + comment.rating} size={16} className="text-gray-300" />
                        ))}
                      </div>
                    )}
                    <p className="text-base leading-relaxed text-foreground">
                      {comment.content}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center pt-0">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {getReplies(comment.id).length > 0 && (
                        <span className="flex items-center gap-1">
                          <Reply className="h-3 w-3" />
                          {getReplies(comment.id).length} trả lời
                        </span>
                      )}
                    </div>
                    {isAuthenticated && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setReplyingTo(comment.id)}
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Reply className="mr-2 h-4 w-4" />
                        Trả lời
                      </Button>
                    )}
                  </CardFooter>
                </Card>

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <div className="ml-8 mt-4 animate-in slide-in-from-left-5 duration-300">
                    <Card className="border-dashed border-primary/30">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium">
                            Trả lời bình luận của <span className="text-primary">{comment.username || "người dùng"}</span>
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          placeholder="Viết trả lời của bạn..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="min-h-[80px] resize-none"
                          autoFocus
                        />
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent("");
                          }}
                        >
                          Hủy
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleAddReply}
                          disabled={addReplyMutation.isPending || !replyContent.trim()}
                        >
                          {addReplyMutation.isPending ? "Đang gửi..." : "Gửi trả lời"}
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                )}

                {/* Replies */}
                {getReplies(comment.id).length > 0 && (
                  <div className="ml-8 mt-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <div className="h-px bg-border flex-1"></div>
                      <span className="px-2 bg-background">
                        {getReplies(comment.id).length} trả lời
                      </span>
                      <div className="h-px bg-border flex-1"></div>
                    </div>
                    {getReplies(comment.id).map((reply: any) => (
                      <Card key={reply.id} className="bg-muted/30 border-l-2 border-l-muted-foreground/30">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                                  {reply.username?.substring(0, 2).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h5 className="font-medium">
                                  {reply.username || "Người dùng ẩn danh"}
                                </h5>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(reply.createdAt)}
                                  {reply.updatedAt !== reply.createdAt && " • Đã chỉnh sửa"}
                                </p>
                              </div>
                            </div>
                            {canModifyComment(reply.userId) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingComment({
                                    id: reply.id,
                                    content: reply.content
                                  })}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Chỉnh sửa
                                  </DropdownMenuItem>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Xóa
                                      </DropdownMenuItem>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Xác nhận xóa trả lời</DialogTitle>
                                      </DialogHeader>
                                      <p>Bạn có chắc chắn muốn xóa trả lời này không?</p>
                                      <DialogFooter>
                                        <DialogClose asChild>
                                          <Button variant="outline">Hủy</Button>
                                        </DialogClose>
                                        <Button 
                                          variant="destructive" 
                                          onClick={() => handleDeleteComment(reply.id)}
                                          disabled={deleteCommentMutation.isPending}
                                        >
                                          {deleteCommentMutation.isPending ? "Đang xóa..." : "Xóa"}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm leading-relaxed">
                            {reply.content}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Comment Dialog */}
      {editingComment && (
        <Dialog open={!!editingComment} onOpenChange={(open) => !open && setEditingComment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Chỉnh sửa bình luận
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={editingComment.content}
                onChange={(e) => setEditingComment({...editingComment, content: e.target.value})}
                className="min-h-[120px] resize-none"
                placeholder="Nhập nội dung bình luận..."
              />
              <div className="text-xs text-muted-foreground text-right">
                {editingComment.content?.length || 0}/1000 ký tự
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditingComment(null)}
              >
                Hủy bỏ
              </Button>
              <Button 
                onClick={handleUpdateComment}
                disabled={updateCommentMutation.isPending || !editingComment.content?.trim()}
              >
                {updateCommentMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Đang cập nhật...
                  </>
                ) : (
                  "Cập nhật"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}