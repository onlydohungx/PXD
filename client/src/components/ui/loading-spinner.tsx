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
    <div className="movie-card-premium h-full flex flex-col relative overflow-hidden animate-pulse">
      <div className="relative aspect-[2/3] skeleton-premium rounded-t-[20px]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Fake badges for skeleton */}
        <div className="absolute top-3 left-3 w-12 h-6 skeleton-premium rounded-full" />
        <div className="absolute top-3 right-3 w-8 h-6 skeleton-premium rounded-full" />
        
        {/* Loading spinner in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="md" variant="film" />
        </div>
      </div>
      
      <div className="movie-card-content p-5 relative flex-1 flex flex-col justify-between min-h-[110px]">
        <div className="space-y-3">
          <div className="h-4 skeleton-premium rounded-lg" />
          <div className="h-3 skeleton-premium rounded-lg w-3/4" />
        </div>
        <div className="flex items-center justify-between mt-auto pt-3">
          <div className="h-7 skeleton-premium rounded-md w-20" />
          <div className="h-7 skeleton-premium rounded-full w-12" />
        </div>
      </div>
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