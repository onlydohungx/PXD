import { useQuery } from "@tanstack/react-query";
import { fetchAdminStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, ShieldCheck, UserCheck, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";

export function AdminStats() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: fetchAdminStats,
    refetchInterval: 30000 // Tự động cập nhật mỗi 30 giây
  });

  // Loading state
  if (statsLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (statsError) {
    const errorMessage = statsError instanceof Error 
      ? statsError.message 
      : "Lỗi không xác định";
        
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-2">
          {errorMessage}
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => refetchStats()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Cập nhật thống kê
          </Button>
        </div>
      </div>
    );
  }

  // Format data for charts
  const userRoleData = [
    { name: "Quản trị viên", value: stats?.adminCount || 0 },
    { name: "Người dùng", value: stats?.userCount || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Bảng điều khiển</h2>
          <p className="text-sm text-muted-foreground">
            Cập nhật lần cuối: {format(lastUpdated, 'HH:mm:ss, dd/MM/yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setLastUpdated(new Date());
              refetchStats();
            }}
            disabled={statsLoading}
          >
            {statsLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Cập nhật dữ liệu
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tổng số tài khoản trong hệ thống
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Người dùng thường</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.userCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Số tài khoản người dùng thường
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quản trị viên</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.adminCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Số tài khoản quản trị viên
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Thống kê người dùng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userRoleData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "none",
                    borderRadius: "var(--radius)",
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 4, 4]}
                  label={{ position: "right", fill: "hsl(var(--foreground))" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}