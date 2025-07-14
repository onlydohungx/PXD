import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const { data } = await axios.get("/api/auth/user");
        return data;
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}