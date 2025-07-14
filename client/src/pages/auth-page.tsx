import { useEffect } from "react";
import { useLocation } from "wouter";
import { AuthForms } from "@/components/auth-forms";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);
  
  // If still loading, don't render anything yet
  if (isLoading) {
    return null;
  }
  
  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-col md:flex-row w-full">
        {/* Auth Forms Section */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
          <motion.div 
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-card rounded-xl shadow-xl overflow-hidden">
              <AuthForms onSuccess={() => navigate("/")} />
            </div>
          </motion.div>
        </div>
        
        {/* Hero Section */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/20 to-secondary/20 p-8 items-center justify-center">
          <motion.div 
            className="max-w-md text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Phim Hay Không Ngủ
            </h2>
            <div className="mb-8 backdrop-blur-md bg-card/50 p-6 rounded-xl">
              <p className="text-lg mb-4">
                Tham gia PhimXuyenDem để trải nghiệm:
              </p>
              <ul className="space-y-2 text-left">
                <li className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-primary"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Kho phim chất lượng cao, đa dạng thể loại
                </li>
                <li className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-primary"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Xem phim không giới hạn, mọi lúc mọi nơi
                </li>
                <li className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-primary"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Trình phát video hiện đại với nhiều tính năng
                </li>
                <li className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-primary"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Cập nhật phim mới hàng ngày
                </li>
              </ul>
            </div>
            <div className="blur-bg p-4 rounded-lg">
              <p>
                "Đắm chìm trong thế giới điện ảnh cùng PhimXuyenDem - nơi mang đến cho bạn những trải nghiệm xem phim tuyệt vời nhất!"
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
