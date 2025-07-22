import { Logo } from "./logo";
import { motion } from "framer-motion";
import { Film, Play, Sparkles } from "lucide-react";

export function LoadingScreen() {
  // Modern animation variants
  const containerVariants = {
    initial: { 
      opacity: 0,
      scale: 0.9
    },
    animate: { 
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0,
      scale: 1.1,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };
  
  const logoVariants = {
    initial: { 
      scale: 0,
      rotate: -180,
      opacity: 0
    },
    animate: { 
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        duration: 0.8
      }
    }
  };

  const textVariants = {
    initial: { 
      y: 30,
      opacity: 0
    },
    animate: { 
      y: 0,
      opacity: 1,
      transition: {
        delay: 0.3,
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  // Floating particles animation
  const particleVariants = {
    animate: {
      y: [-20, -40, -20],
      x: [-10, 10, -10],
      opacity: [0.3, 0.8, 0.3],
      scale: [0.8, 1.2, 0.8],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Spinning loader variants
  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-background overflow-hidden"
    >


      {/* Static gradient background - removed animations for better performance */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 blur-2xl" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Modern loading spinner */}
        <motion.div
          variants={logoVariants}
          className="relative mb-8"
        >
          <motion.div
            variants={spinnerVariants}
            animate="animate"
            className="w-20 h-20 border-4 border-transparent border-t-primary border-r-secondary rounded-full"
          />
          <motion.div
            animate={{
              rotate: -360,
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute inset-2 w-16 h-16 border-2 border-transparent border-l-primary/50 border-b-secondary/50 rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{
                scale: [0.8, 1, 0.8],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Film className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
        </motion.div>

        {/* Logo */}
        <motion.div variants={logoVariants} className="mb-6">
          <Logo size="large" />
        </motion.div>

        {/* Loading text with typewriter effect */}
        <motion.div variants={textVariants} className="text-center">
          <motion.h2 
            className="text-xl font-semibold text-white mb-2"
            animate={{
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Đang tải dữ liệu phim
          </motion.h2>
          <p className="text-sm text-muted-foreground mb-6">
            Chuẩn bị trải nghiệm giải trí tuyệt vời...
          </p>

          {/* Enhanced progress dots */}
          <div className="flex items-center justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.3, 1, 0.3],
                  backgroundColor: ["rgba(var(--primary), 0.3)", "rgba(var(--primary), 1)", "rgba(var(--primary), 0.3)"]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
                className="w-2 h-2 rounded-full bg-primary"
              />
            ))}
          </div>
        </motion.div>

        {/* Static decorative icons - removed animations for better performance */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 text-primary/10">
            <Play className="w-6 h-6" />
          </div>
          
          <div className="absolute top-1/3 right-1/4 text-secondary/10">
            <Sparkles className="w-5 h-5" />
          </div>
          
          <div className="absolute bottom-1/3 left-1/3 text-primary/10">
            <Film className="w-4 h-4" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}