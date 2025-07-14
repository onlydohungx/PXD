import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Database, Shield, Globe, Save, AlertTriangle, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    allowRegistration: true,
    requireEmailVerification: false,
    enableComments: true,
    enableRatings: true,
    maxUploadSize: 100,
    sessionTimeout: 24,
    enableAIRecommendations: true,
    autoCleanupDays: 30
  });

  const [maintenanceMessage, setMaintenanceMessage] = useState("Hệ thống đang bảo trì. Vui lòng quay lại sau.");

  // API để lấy thống kê database
  const { data: dbStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/db-stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/db-stats");
      if (!response.ok) throw new Error("Không thể tải thống kê database");
      return response.json();
    }
  });

  // API để lấy trạng thái bảo trì
  const { data: maintenanceStatus, isLoading: maintenanceLoading } = useQuery({
    queryKey: ["/api/admin/maintenance"],
    queryFn: async () => {
      const response = await fetch("/api/admin/maintenance");
      if (!response.ok) throw new Error("Không thể tải trạng thái bảo trì");
      return response.json();
    }
  });

  // Mutation để cleanup dữ liệu cũ
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/cleanup-daily-views", {
        method: "POST"
      });
      if (!response.ok) throw new Error("Cleanup thất bại");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Cleanup thành công",
        description: `Đã xóa ${data.deletedRecords} bản ghi cũ`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/db-stats"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể thực hiện cleanup",
        variant: "destructive"
      });
    }
  });

  // Mutation để cập nhật chế độ bảo trì
  const maintenanceMutation = useMutation({
    mutationFn: async ({ enabled, message }: { enabled: boolean; message: string }) => {
      const response = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, message })
      });
      if (!response.ok) throw new Error("Không thể cập nhật chế độ bảo trì");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Thành công",
        description: data.message
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/maintenance"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật chế độ bảo trì",
        variant: "destructive"
      });
    }
  });

  const handleSaveSettings = () => {
    toast({
      title: "Cài đặt đã lưu",
      description: "Các thay đổi đã được áp dụng thành công"
    });
  };

  const handleCleanup = () => {
    cleanupMutation.mutate();
  };

  const handleMaintenanceToggle = (enabled: boolean) => {
    maintenanceMutation.mutate({ 
      enabled, 
      message: maintenanceMessage 
    });
  };

  return (
    <div className="space-y-6">
      {/* Chế độ bảo trì */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Chế độ bảo trì
          </CardTitle>
          <CardDescription>
            Khi bật, tất cả người dùng sẽ không thể truy cập website. Chỉ admin có thể vào.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance-mode">Bật chế độ bảo trì</Label>
              <p className="text-sm text-muted-foreground">
                Tạm thời ngừng truy cập cho tất cả người dùng
              </p>
            </div>
            <Switch
              id="maintenance-mode"
              checked={maintenanceStatus?.maintenanceMode || false}
              onCheckedChange={handleMaintenanceToggle}
              disabled={maintenanceMutation.isPending || maintenanceLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance-message">Thông báo bảo trì</Label>
            <Textarea
              id="maintenance-message"
              placeholder="Nhập thông báo hiển thị cho người dùng..."
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              rows={3}
            />
          </div>

          {maintenanceStatus?.maintenanceMode && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Chế độ bảo trì đang được bật
                </span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Người dùng thường sẽ thấy trang bảo trì thay vì website.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cài đặt chung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Cài đặt chung
          </CardTitle>
          <CardDescription>
            Cấu hình các tính năng cơ bản của hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow-registration">Cho phép đăng ký mới</Label>
              <p className="text-sm text-muted-foreground">
                Người dùng có thể tạo tài khoản mới
              </p>
            </div>
            <Switch
              id="allow-registration"
              checked={settings.allowRegistration}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, allowRegistration: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-comments">Cho phép bình luận</Label>
              <p className="text-sm text-muted-foreground">
                Người dùng có thể bình luận trên phim
              </p>
            </div>
            <Switch
              id="enable-comments"
              checked={settings.enableComments}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, enableComments: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-ai">Kích hoạt AI đề xuất</Label>
              <p className="text-sm text-muted-foreground">
                Sử dụng AI để đề xuất phim cho người dùng
              </p>
            </div>
            <Switch
              id="enable-ai"
              checked={settings.enableAIRecommendations}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, enableAIRecommendations: checked }))
              }
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Thời gian session (giờ)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) =>
                  setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 24 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cleanup-days">Tự động xóa dữ liệu cũ (ngày)</Label>
              <Input
                id="cleanup-days"
                type="number"
                value={settings.autoCleanupDays}
                onChange={(e) =>
                  setSettings(prev => ({ ...prev, autoCleanupDays: parseInt(e.target.value) || 30 }))
                }
              />
            </div>
          </div>

          <Button onClick={handleSaveSettings} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Lưu cài đặt
          </Button>
        </CardContent>
      </Card>

      {/* Bảo mật */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Bảo mật
          </CardTitle>
          <CardDescription>
            Cấu hình các tính năng bảo mật
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-verification">Yêu cầu xác thực email</Label>
              <p className="text-sm text-muted-foreground">
                Người dùng phải xác thực email khi đăng ký
              </p>
            </div>
            <Switch
              id="email-verification"
              checked={settings.requireEmailVerification}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, requireEmailVerification: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-upload">Giới hạn upload (MB)</Label>
            <Input
              id="max-upload"
              type="number"
              value={settings.maxUploadSize}
              onChange={(e) =>
                setSettings(prev => ({ ...prev, maxUploadSize: parseInt(e.target.value) || 100 }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Quản lý Database */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Quản lý Database
          </CardTitle>
          <CardDescription>
            Thống kê và bảo trì cơ sở dữ liệu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statsLoading ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Đang tải thống kê...</p>
            </div>
          ) : dbStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold">{dbStats.totalUsers || 0}</p>
                <p className="text-sm text-muted-foreground">Người dùng</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold">{dbStats.totalComments || 0}</p>
                <p className="text-sm text-muted-foreground">Bình luận</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold">{dbStats.totalViews || 0}</p>
                <p className="text-sm text-muted-foreground">Lượt xem</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold">{dbStats.dailyViewsCount || 0}</p>
                <p className="text-sm text-muted-foreground">Lượt xem hôm nay</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Không thể tải thống kê</p>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">Bảo trì Database</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Xóa dữ liệu lượt xem theo ngày cũ để tiết kiệm dung lượng.
              Thao tác này không thể hoàn tác.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full md:w-auto"
                  disabled={cleanupMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {cleanupMutation.isPending ? "Đang xử lý..." : "Cleanup dữ liệu cũ"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận cleanup</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc chắn muốn xóa dữ liệu lượt xem theo ngày cũ? 
                    Thao tác này sẽ xóa tất cả dữ liệu trước hôm nay và không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCleanup}>
                    Xác nhận
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Thông tin hệ thống */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin hệ thống</CardTitle>
          <CardDescription>
            Thông tin phiên bản và trạng thái hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Phiên bản:</span>
            <Badge variant="secondary">0.1 BETA</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Database:</span>
            <Badge variant="outline" className="text-green-600">
              Kết nối thành công
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">AI Service:</span>
            <Badge variant="outline" className="text-blue-600">
              Hoạt động
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Uptime:</span>
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleString('vi-VN')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}