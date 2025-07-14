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
import { Edit, Trash2, Reply, Star } from "lucide-react";
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Bình luận ({comments.length})</h2>
      
      {/* Form thêm bình luận mới */}
      {isAuthenticated ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Thêm bình luận của bạn</CardTitle>
          </CardHeader>
          <CardContent>
            {renderRatingSelector()}
            <Textarea
              placeholder="Viết bình luận của bạn về bộ phim này..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handleAddComment}
              disabled={addCommentMutation.isPending}
            >
              {addCommentMutation.isPending ? "Đang gửi..." : "Gửi bình luận"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-center">Vui lòng đăng nhập để thêm bình luận</p>
          </CardContent>
        </Card>
      )}

      {/* Danh sách bình luận */}
      <div className="space-y-4">
        {mainComments.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
        ) : (
          mainComments.map((comment: any) => (
            <div key={comment.id} className="space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarFallback>{comment.username?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{comment.username || "Người dùng ẩn danh"}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</div>
                      </div>
                    </div>
                    {canModifyComment(comment.userId) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">...</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingComment({
                            id: comment.id,
                            content: comment.content
                          })}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Chỉnh sửa</span>
                          </DropdownMenuItem>
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Xóa</span>
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Xác nhận xóa</DialogTitle>
                              </DialogHeader>
                              <p>Bạn có chắc chắn muốn xóa bình luận này không?</p>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Hủy</Button>
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
                <CardContent>
                  <div className="mb-2">
                    {renderStars(comment.rating)}
                  </div>
                  <p>{comment.content}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div></div>
                  {isAuthenticated && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setReplyingTo(comment.id)}
                    >
                      <Reply className="mr-2 h-4 w-4" />
                      Trả lời
                    </Button>
                  )}
                </CardFooter>
              </Card>

              {/* Form trả lời bình luận */}
              {replyingTo === comment.id && (
                <Card className="ml-8 bg-muted/30">
                  <CardContent className="pt-4">
                    <Textarea
                      placeholder={`Trả lời bình luận của ${comment.username || "người dùng"}...`}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setReplyingTo(null)}
                    >
                      Hủy
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleAddReply}
                      disabled={addReplyMutation.isPending}
                    >
                      {addReplyMutation.isPending ? "Đang gửi..." : "Gửi trả lời"}
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {/* Hiển thị các trả lời cho bình luận này */}
              {getReplies(comment.id).length > 0 && (
                <div className="space-y-2 ml-8">
                  {getReplies(comment.id).map((reply: any) => (
                    <Card key={reply.id} className="bg-muted/30">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Avatar>
                              <AvatarFallback>{reply.username?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{reply.username || "Người dùng ẩn danh"}</div>
                              <div className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</div>
                            </div>
                          </div>
                          {canModifyComment(reply.userId) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">...</Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingComment({
                                  id: reply.id,
                                  content: reply.content
                                })}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Chỉnh sửa</span>
                                </DropdownMenuItem>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      <span>Xóa</span>
                                    </DropdownMenuItem>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Xác nhận xóa</DialogTitle>
                                    </DialogHeader>
                                    <p>Bạn có chắc chắn muốn xóa bình luận này không?</p>
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
                      <CardContent>
                        <p>{reply.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Dialog chỉnh sửa bình luận */}
      {editingComment && (
        <Dialog open={!!editingComment} onOpenChange={(open) => !open && setEditingComment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa bình luận</DialogTitle>
            </DialogHeader>
            <Textarea
              value={editingComment.content}
              onChange={(e) => setEditingComment({...editingComment, content: e.target.value})}
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditingComment(null)}
              >
                Hủy
              </Button>
              <Button 
                onClick={handleUpdateComment}
                disabled={updateCommentMutation.isPending}
              >
                {updateCommentMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}