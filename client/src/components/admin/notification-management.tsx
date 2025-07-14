import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchAdminNotifications, 
  createNotification, 
  updateNotification, 
  toggleNotificationStatus, 
  deleteNotification 
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Edit, BellRing, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Notification {
  id: number;
  title: string;
  content: string;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  username: string;
}

export function NotificationManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [newNotification, setNewNotification] = useState({
    title: '',
    content: '',
    isActive: true
  });
  const [editNotification, setEditNotification] = useState({
    title: '',
    content: '',
    isActive: true
  });

  // Fetch all notifications
  const { data: notifications, isLoading, isError } = useQuery({
    queryKey: ['/api/admin/notifications'],
    queryFn: fetchAdminNotifications
  });

  // Create notification mutation
  const createMutation = useMutation({
    mutationFn: createNotification,
    onSuccess: () => {
      setIsAddModalOpen(false);
      setNewNotification({
        title: '',
        content: '',
        isActive: true
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
      toast({
        title: 'Thành công',
        description: 'Thêm thông báo mới thành công',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: `Không thể thêm thông báo: ${error.message || 'Đã xảy ra lỗi'}`,
        variant: 'destructive'
      });
    }
  });

  // Update notification mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateNotification(id, data),
    onSuccess: () => {
      setIsEditModalOpen(false);
      setSelectedNotification(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
      toast({
        title: 'Thành công',
        description: 'Cập nhật thông báo thành công',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: `Không thể cập nhật thông báo: ${error.message || 'Đã xảy ra lỗi'}`,
        variant: 'destructive'
      });
    }
  });

  // Toggle notification status mutation
  const toggleMutation = useMutation({
    mutationFn: toggleNotificationStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
      toast({
        title: 'Thành công',
        description: 'Đã thay đổi trạng thái thông báo',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: `Không thể thay đổi trạng thái: ${error.message || 'Đã xảy ra lỗi'}`,
        variant: 'destructive'
      });
    }
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      setIsConfirmDeleteOpen(false);
      setSelectedNotification(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
      toast({
        title: 'Thành công',
        description: 'Đã xóa thông báo',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: `Không thể xóa thông báo: ${error.message || 'Đã xảy ra lỗi'}`,
        variant: 'destructive'
      });
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotification.title || !newNotification.content) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo',
        variant: 'destructive'
      });
      return;
    }
    createMutation.mutate(newNotification);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNotification) return;
    if (!editNotification.title || !editNotification.content) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo',
        variant: 'destructive'
      });
      return;
    }
    updateMutation.mutate({
      id: selectedNotification.id,
      data: editNotification
    });
  };

  const openEditModal = (notification: Notification) => {
    setSelectedNotification(notification);
    setEditNotification({
      title: notification.title,
      content: notification.content,
      isActive: notification.isActive
    });
    setIsEditModalOpen(true);
  };

  const confirmDelete = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsConfirmDeleteOpen(true);
  };

  const formatDate = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
    } catch (error) {
      return 'Không rõ';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6 flex items-center">
        <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
        <div>
          <h4 className="font-semibold text-red-600">Không thể tải dữ liệu</h4>
          <p className="text-sm text-red-500">Đã xảy ra lỗi khi tải thông báo. Vui lòng thử lại sau.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Danh sách thông báo</h3>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1">
              <BellRing className="h-4 w-4 mr-1" />
              Thêm thông báo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Thêm thông báo mới</DialogTitle>
              <DialogDescription>
                Tạo thông báo mới để hiển thị cho người dùng.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Tiêu đề
                  </Label>
                  <Input
                    id="title"
                    placeholder="Nhập tiêu đề thông báo"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="content" className="text-right">
                    Nội dung
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Nhập nội dung thông báo"
                    value={newNotification.content}
                    onChange={(e) => setNewNotification({...newNotification, content: e.target.value})}
                    className="col-span-3"
                    rows={5}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Kích hoạt
                  </Label>
                  <div className="flex items-center space-x-2 col-span-3">
                    <Switch
                      id="status"
                      checked={newNotification.isActive}
                      onCheckedChange={(checked) => setNewNotification({...newNotification, isActive: checked})}
                    />
                    <span className="text-sm text-muted-foreground">
                      {newNotification.isActive ? 'Hiển thị cho người dùng' : 'Ẩn'}
                    </span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Thêm thông báo
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {notifications && notifications.length > 0 ? (
        <Table>
          <TableCaption>Danh sách thông báo hệ thống</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead className="w-[250px]">Tiêu đề</TableHead>
              <TableHead>Nội dung</TableHead>
              <TableHead className="w-[120px]">Trạng thái</TableHead>
              <TableHead className="w-[150px]">Người tạo</TableHead>
              <TableHead className="w-[150px]">Thời gian</TableHead>
              <TableHead className="text-right w-[120px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.map((notification) => (
              <TableRow key={notification.id}>
                <TableCell className="font-medium">{notification.id}</TableCell>
                <TableCell className="font-medium">{notification.title}</TableCell>
                <TableCell className="truncate max-w-[300px]">
                  {notification.content}
                </TableCell>
                <TableCell>
                  <Badge variant={notification.isActive ? "default" : "secondary"} 
                    className="cursor-pointer"
                    onClick={() => toggleMutation.mutate(notification.id)}
                  >
                    {notification.isActive ? "Hiển thị" : "Ẩn"}
                  </Badge>
                </TableCell>
                <TableCell>{notification.username}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(notification.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button 
                      size="icon" 
                      variant="outline" 
                      onClick={() => openEditModal(notification)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="text-red-500 hover:text-red-600"
                      onClick={() => confirmDelete(notification)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="bg-muted/40 rounded-md p-8 text-center">
          <BellRing className="h-10 w-10 text-muted-foreground/60 mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">Chưa có thông báo</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Hiện tại chưa có thông báo nào trên hệ thống.
          </p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            Thêm thông báo đầu tiên
          </Button>
        </div>
      )}

      {/* Edit Notification Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông báo</DialogTitle>
            <DialogDescription>
              Chỉnh sửa nội dung và trạng thái thông báo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-title" className="text-right">
                  Tiêu đề
                </Label>
                <Input
                  id="edit-title"
                  placeholder="Nhập tiêu đề thông báo"
                  value={editNotification.title}
                  onChange={(e) => setEditNotification({...editNotification, title: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-content" className="text-right">
                  Nội dung
                </Label>
                <Textarea
                  id="edit-content"
                  placeholder="Nhập nội dung thông báo"
                  value={editNotification.content}
                  onChange={(e) => setEditNotification({...editNotification, content: e.target.value})}
                  className="col-span-3"
                  rows={5}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">
                  Kích hoạt
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="edit-status"
                    checked={editNotification.isActive}
                    onCheckedChange={(checked) => setEditNotification({...editNotification, isActive: checked})}
                  />
                  <span className="text-sm text-muted-foreground">
                    {editNotification.isActive ? 'Hiển thị cho người dùng' : 'Ẩn'}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Xác nhận xóa thông báo
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          {selectedNotification && (
            <div className="py-4">
              <div className="bg-muted/40 p-3 rounded-md">
                <h4 className="font-medium">{selectedNotification.title}</h4>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{selectedNotification.content}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDeleteOpen(false)}
            >
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedNotification && deleteMutation.mutate(selectedNotification.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Xóa thông báo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}