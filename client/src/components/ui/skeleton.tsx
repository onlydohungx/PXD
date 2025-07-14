import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: number | string;
  width?: number | string;
  circle?: boolean;
  animated?: boolean;
}

const shimmerAnimation = {
  hidden: { backgroundPosition: "-200% 0" },
  visible: { 
    backgroundPosition: "200% 0",
    transition: {
      duration: 1.5,
      ease: "linear",
      repeat: Infinity
    }
  }
};

const pulseAnimation = {
  hidden: { opacity: 0.5 },
  visible: { 
    opacity: 0.8,
    transition: {
      duration: 0.8,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "reverse"
    }
  }
};

const skeleton = ({ 
  className, 
  height, 
  width, 
  circle = false, 
  animated = true,
  ...props
}: SkeletonProps) => {
  const style: React.CSSProperties = {};
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (circle) style.borderRadius = '50%';

  const skeletonClass = cn(
    "relative bg-muted/50 overflow-hidden",
    circle ? "rounded-full" : "rounded-md",
    className
  );

  if (animated) {
    return (
      <motion.div
        className={cn(
          skeletonClass,
          "shimmer-effect"
        )}
        initial="hidden"
        animate="visible"
        variants={shimmerAnimation}
        style={style}
        {...props}
      />
    );
  }

  // dự phòng cho bản k animation
  return <div className={skeletonClass} style={style} {...props} />;
};

export { skeleton as Skeleton };