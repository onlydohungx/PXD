import { useOfflineDetection } from '@/hooks/use-offline-detection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineIndicator() {
  const { isOnline, isChecking, message, checkNetworkStatus } = useOfflineDetection();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-6 md:right-6 z-50"
        >
          <div className="bg-gradient-to-r from-red-600/95 via-red-500/95 to-orange-500/95 backdrop-blur-xl border border-red-400/30 rounded-2xl shadow-2xl shadow-red-500/20">
            <Alert className="border-none bg-transparent text-white p-4 md:p-6">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-white/20 rounded-full blur-sm"
                    />
                    <div className="relative p-2 bg-white/10 rounded-full backdrop-blur-sm">
                      <WifiOff className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-white flex-shrink-0" />
                      <h3 className="font-semibold text-white text-sm">
                        Mất kết nối mạng
                      </h3>
                    </div>
                    <p className="text-white/90 text-xs md:text-sm leading-relaxed">
                      {message || 'Vui lòng kiểm tra kết nối internet của bạn'}
                    </p>
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={checkNetworkStatus}
                    disabled={isChecking}
                    className="text-white hover:bg-white/20 border border-white/30 hover:border-white/50 transition-all duration-200 ml-4 px-4 py-2 rounded-xl backdrop-blur-sm"
                  >
                    {isChecking ? (
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        <span className="text-xs font-medium">Đang kiểm tra...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        <span className="text-xs font-medium">Thử lại</span>
                      </div>
                    )}
                  </Button>
                </motion.div>
              </div>
            </Alert>
            
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-t-2xl" />
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-0 w-1/3 h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-t-2xl"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function OfflineOverlay() {
  const { isOnline, checkNetworkStatus, isChecking } = useOfflineDetection();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="text-center p-8 max-w-md w-full bg-gradient-to-br from-slate-900/90 via-blue-900/90 to-indigo-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl"
          >
            <div className="mb-8">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative mx-auto mb-6 w-20 h-20"
              >
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
                <div className="relative bg-gradient-to-br from-red-500 to-orange-500 rounded-full p-4 shadow-lg">
                  <WifiOff className="h-12 w-12 text-white mx-auto" />
                </div>
              </motion.div>
              
              <h2 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Mất kết nối mạng
              </h2>
              <p className="text-white/80 leading-relaxed">
                Ứng dụng cần kết nối internet để hoạt động. Vui lòng kiểm tra kết nối mạng của bạn.
              </p>
            </div>
            
            <div className="space-y-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={checkNetworkStatus}
                  disabled={isChecking}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isChecking ? (
                    <div className="flex items-center justify-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                      />
                      <span>Đang kiểm tra kết nối...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Wifi className="h-5 w-5" />
                      <span>Thử kết nối lại</span>
                    </div>
                  )}
                </Button>
              </motion.div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <p className="text-sm text-white/70 mb-3 font-medium">Gợi ý khắc phục:</p>
                <ul className="text-left space-y-2 text-sm text-white/60">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Kiểm tra kết nối WiFi hoặc dữ liệu di động</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Tắt và bật lại WiFi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Khởi động lại ứng dụng</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}