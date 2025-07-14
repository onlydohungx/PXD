import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Settings, RefreshCw, Clock, Wrench, AlertCircle, Sparkles, Zap, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function MaintenancePage() {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number}>>([]);

  // Lấy thông tin bảo trì
  const { data: maintenanceInfo, refetch } = useQuery({
    queryKey: ["/api/maintenance-status"],
    queryFn: async () => {
      const response = await fetch("/api/maintenance-status");
      if (!response.ok) throw new Error("Không thể tải thông tin bảo trì");
      return response.json();
    },
    refetchInterval: 30000, // Kiểm tra lại mỗi 30 giây
  });

  // Progress bar animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 1;
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 30;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Floating particles
  useEffect(() => {
    const createParticle = () => {
      const newParticle = {
        id: Date.now() + Math.random(),
        x: Math.random() * 100,
        y: Math.random() * 100,
      };
      setParticles(prev => [...prev.slice(-10), newParticle]);
    };

    const interval = setInterval(createParticle, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    refetch();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-indigo-900/30 dark:to-purple-900/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 animate-gradient-x opacity-60"></div>
      
      {/* Floating particles */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-30"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 0.6, 0], 
              scale: [0, 1, 0],
              y: [0, -100],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>

      {/* Main animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-300/40 to-cyan-300/40 dark:from-blue-500/20 dark:to-cyan-500/20 rounded-full blur-2xl"
          animate={{
            x: [0, 120, 0],
            y: [0, -60, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-52 h-52 bg-gradient-to-br from-purple-300/40 to-pink-300/40 dark:from-purple-500/20 dark:to-pink-500/20 rounded-full blur-2xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 80, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-60 h-60 bg-gradient-to-br from-yellow-300/30 to-orange-300/30 dark:from-yellow-500/15 dark:to-orange-500/15 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 50, 0],
            y: [0, 50, -50, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Card className="text-center shadow-2xl backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border border-white/20 dark:border-gray-700/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20"></div>
            
            <CardHeader className="pb-8 relative">
              {/* Animated icon with enhanced design */}
              <motion.div
                className="mx-auto w-28 h-28 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden"
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Wrench className="w-14 h-14 text-white drop-shadow-lg" />
                </motion.div>
                <motion.div
                  className="absolute top-2 right-2"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </motion.div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <CardTitle className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-4 leading-tight">
                  Đang nâng cấp hệ thống
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300 text-lg font-medium">
                  Chúng tôi đang cải thiện trải nghiệm của bạn
                </CardDescription>
              </motion.div>
            </CardHeader>
            
            <CardContent className="space-y-8 relative">
              {/* Enhanced message section */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 rounded-2xl p-8 border border-indigo-100/50 dark:border-indigo-700/30 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-full blur-2xl"></div>
                <div className="flex items-start gap-4 relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <AlertCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-gray-700 dark:text-gray-200 text-base leading-relaxed text-left font-medium">
                      {maintenanceInfo?.message || "Chúng tôi đang thực hiện nâng cấp hệ thống với những tính năng mới thú vị. Hệ thống sẽ hoạt động trở lại trong ít phút."}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Progress and timer section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="space-y-6"
              >
                {/* Progress bar */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">Tiến độ nâng cấp</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3 bg-gray-200 dark:bg-gray-700">
                    <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out shadow-lg"></div>
                  </Progress>
                </div>

                {/* Countdown timer */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </motion.div>
                    <span className="text-gray-700 dark:text-gray-200 font-medium">
                      Kiểm tra lại sau: 
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold ml-2">
                        {timeLeft}s
                      </span>
                    </span>
                  </div>
                </div>

                {/* Enhanced action button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="pt-2"
                >
                  <Button 
                    onClick={handleRefresh}
                    className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group relative overflow-hidden"
                    size="lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="mr-3"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </motion.div>
                    Kiểm tra ngay bây giờ
                    <Zap className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              </motion.div>

              {/* Enhanced loading animation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="pt-6 border-t border-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex space-x-2">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.3, 1, 0.3],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      Đang cập nhật...
                    </span>
                  </div>
                  
                  <motion.div
                    animate={{
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="text-center"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium flex items-center justify-center gap-2">
                      Cảm ơn bạn đã kiên nhẫn đợi chúng tôi
                      <Heart className="w-4 h-4 text-red-500" />
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}