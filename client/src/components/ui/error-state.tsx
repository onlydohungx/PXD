import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Không thể tải dữ liệu",
  message = "Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.",
  onRetry
}: ErrorStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full py-10 flex flex-col items-center justify-center text-center px-4"
    >
      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 animate-pulse">
        <AlertTriangle className="h-10 w-10 text-red-500" />
      </div>
      
      <h3 className="text-xl md:text-2xl font-bold mb-2 text-red-500/90">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{message}</p>
      
      {onRetry && (
        <Button 
          onClick={onRetry} 
          variant="outline" 
          className="bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-black/60 hover:border-white/20 text-white"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Thử lại
        </Button>
      )}
      
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-red-500/5 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-1/4 right-1/4 w-1/2 h-1/2 bg-orange-500/5 rounded-full blur-3xl opacity-50"></div>
      </div>
    </motion.div>
  );
}