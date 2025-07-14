import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export function useMaintenance() {
  const { user } = useAuth();
  
  const { data: maintenanceStatus, isLoading } = useQuery({
    queryKey: ["/api/maintenance-status"],
    queryFn: async () => {
      const response = await fetch("/api/maintenance-status");
      if (!response.ok) return { maintenanceMode: false, message: "" };
      return response.json();
    },
    refetchInterval: 60000, // Kiểm tra mỗi phút
    retry: false,
  });

  // Admin có thể truy cập dù đang bảo trì
  const shouldShowMaintenance = maintenanceStatus?.maintenanceMode && user?.role !== "admin";

  return {
    isMaintenanceMode: shouldShowMaintenance,
    maintenanceMessage: maintenanceStatus?.message || "",
    isLoading
  };
}