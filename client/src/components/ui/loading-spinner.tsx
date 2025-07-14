import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2, Film } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "dots" | "pulse" | "film";
  className?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  variant = "default", 
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
            className={cn(
              "rounded-full bg-primary",
              size === "sm" && "w-1 h-1",
              size === "md" && "w-1.5 h-1.5",
              size === "lg" && "w-2 h-2"
            )}
          />
        ))}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={cn(
          "rounded-full bg-primary/20 border-2 border-primary/50",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  if (variant === "film") {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
        className={cn("text-primary", className)}
      >
        <Film className={sizeClasses[size]} />
      </motion.div>
    );
  }

  return (
    <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />
  );
}

export function LoadingCard() {
  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-white/10 p-6">
      <motion.div
        animate={{
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="flex flex-col items-center text-center space-y-4"
      >
        <LoadingSpinner size="lg" variant="film" />
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Đang tải...</h3>
          <p className="text-sm text-white/60">Vui lòng chờ trong giây lát</p>
        </div>
      </motion.div>
    </div>
  );
}

export function LoadingOverlay({ children, isLoading }: { children: React.ReactNode, isLoading: boolean }) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg"
        >
          <LoadingSpinner size="lg" variant="film" />
        </motion.div>
      )}
    </div>
  );
}