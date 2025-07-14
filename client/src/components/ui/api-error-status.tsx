import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface APIErrorStatusProps {
  isError: boolean;
  error: any;
  onRetry?: () => void;
  className?: string;
  title?: string;
}

export function APIErrorStatus({ 
  isError, 
  error, 
  onRetry, 
  className = '',
  title = "Lỗi kết nối API"
}: APIErrorStatusProps) {
  if (!isError) return null;
  
  let errorMessage = "Đã xảy ra lỗi khi tải dữ liệu";
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error?.message) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`w-full py-8 flex flex-col items-center justify-center text-center px-4 relative ${className}`}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4"
      >
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </motion.div>
      
      <h3 className="text-xl md:text-2xl font-bold mb-2 text-red-500">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{errorMessage}</p>
      
      {onRetry && (
        <Button 
          onClick={onRetry} 
          variant="outline" 
          className="bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-black/60 hover:border-white/20 text-white transform transition-transform hover:scale-105"
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