import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function WebsiteAnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    // Kiểm tra localStorage xem người dùng đã ẩn banner chưa
    const dismissed = localStorage.getItem('website-announcement-dismissed');
    return !dismissed;
  });

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('website-announcement-dismissed', 'true');
  };

  const handleVisitWebsite = () => {
    window.open('http://pxd.nightmarket.site', '_blank');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, height: 0 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          height: "auto",
          transition: {
            duration: 0.8,
            type: "spring",
            stiffness: 100,
            damping: 20
          }
        }}
        exit={{ 
          opacity: 0, 
          y: -100,
          height: 0,
          transition: { duration: 0.5 }
        }}
        className="relative w-full overflow-hidden"
        data-testid="website-announcement-banner"
      >
        {/* Background with gradient and animated effects */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 md:p-6">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full animate-pulse" />
            <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/10 rounded-full animate-pulse delay-700" />
            <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-white/20 rounded-full animate-ping delay-300" />
            <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-white/20 rounded-full animate-ping delay-500" />
          </div>
          
          {/* Main content */}
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              {/* Icon with animation */}
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
                className="flex-shrink-0"
              >
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </motion.div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-white/20 text-white border-white/30 text-xs font-bold">
                    🎉 MỚI
                  </Badge>
                  <h3 className="text-white font-bold text-lg md:text-xl">
                    Website Mới Đã Ra Mắt!
                  </h3>
                </div>
                <p className="text-white/90 text-sm md:text-base">
                  Trải nghiệm xem phim tuyệt vời đang chờ bạn tại website mới của chúng tôi
                </p>
              </div>

              {/* CTA Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0"
              >
                <Button
                  onClick={handleVisitWebsite}
                  className="bg-white text-purple-600 hover:bg-white/90 font-bold px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  data-testid="button-visit-new-website"
                >
                  <span className="hidden md:inline">Truy Cập Ngay</span>
                  <span className="md:hidden">Xem</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </div>

            {/* Close button */}
            <Button
              onClick={handleDismiss}
              size="icon"
              variant="ghost"
              className="flex-shrink-0 h-8 w-8 text-white hover:bg-white/20 rounded-full"
              data-testid="button-dismiss-banner"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Đóng thông báo</span>
            </Button>
          </div>

          {/* Bottom decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>

        {/* Website URL display for mobile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-purple-700 px-4 py-2 md:hidden"
        >
          <div className="flex items-center justify-center gap-2 text-white text-sm">
            <ExternalLink className="w-4 h-4" />
            <span className="font-mono">pxd.nightmarket.site</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
