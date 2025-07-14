import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, LoginData, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Định nghĩa kiểu dữ liệu cho context
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, InsertUser>;
  refetchUser: () => Promise<User | null | undefined>;
}

// Tạo context với giá trị mặc định null
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  // State để theo dõi người dùng hiện tại
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Query để lấy thông tin người dùng từ server
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 0, // Đảm bảo dữ liệu luôn được cập nhật mới nhất
  });

  // Cập nhật state khi dữ liệu người dùng thay đổi
  useEffect(() => {
    if (user !== undefined) {
      setCurrentUser(user);
    }
  }, [user]);

  // Hàm để refresh thông tin người dùng
  const refetchUser = async () => {
    const { data } = await refetch();
    return data;
  };

  // Mutation để đăng nhập
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: async (loggedInUser: User) => {
      // Cập nhật cache ngay lập tức
      queryClient.setQueryData(["/api/user"], loggedInUser);
      // Cập nhật state
      setCurrentUser(loggedInUser);
      
      toast({
        title: "Đăng nhập thành công",
        description: `Xin chào, ${loggedInUser.username}!`,
      });
      
      // Đảm bảo dữ liệu được cập nhật trên toàn bộ ứng dụng
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Đăng nhập thất bại",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation để đăng ký
  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: async (registeredUser: User) => {
      // Cập nhật cache ngay lập tức
      queryClient.setQueryData(["/api/user"], registeredUser);
      // Cập nhật state
      setCurrentUser(registeredUser);
      
      toast({
        title: "Đăng ký thành công",
        description: `Chào mừng đến với PhimXuyenDem, ${registeredUser.username}!`,
      });
      
      // Đảm bảo dữ liệu được cập nhật trên toàn bộ ứng dụng
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Đăng ký thất bại",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation để đăng xuất
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Cập nhật cache ngay lập tức
      queryClient.setQueryData(["/api/user"], null);
      // Cập nhật state
      setCurrentUser(null);
      
      toast({
        title: "Đăng xuất thành công",
        description: "Hẹn gặp lại bạn!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Đăng xuất thất bại",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cung cấp context values cho toàn bộ ứng dụng
  return (
    <AuthContext.Provider
      value={{
        user: currentUser, // Sử dụng state thay vì dữ liệu query trực tiếp
        isLoading,
        error,
        isAuthenticated: !!currentUser,
        loginMutation,
        logoutMutation,
        registerMutation,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
