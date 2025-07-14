import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserManagement } from "@/components/admin/user-management";
import { AdminStats } from "@/components/admin/admin-stats";
import { NotificationManagement } from "@/components/admin/notification-management";
import { AdminSettings } from "@/components/admin/admin-settings";
import { useAuth } from "@/hooks/use-auth";
import { Users, BarChart3, Settings, Bell } from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user } = useAuth();

  return (
    <div className="pt-6 pb-12 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Quản trị hệ thống</h1>
            <p className="text-muted-foreground mt-1">
              Xin chào, {user?.username}. Bạn có quyền quản trị viên.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 md:w-[520px]">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Thống kê</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Người dùng</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Thông báo</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Cài đặt</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Thống kê hệ thống</CardTitle>
                <CardDescription>
                  Tổng quan về thống kê người dùng và hoạt động trên hệ thống.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminStats />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý người dùng</CardTitle>
                <CardDescription>
                  Xem, chỉnh sửa và xóa tài khoản người dùng.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý thông báo</CardTitle>
                <CardDescription>
                  Tạo và quản lý thông báo hệ thống cho người dùng.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationManagement />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}