import { Film } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface LogoProps {
  size?: "small" | "medium" | "large";
  variant?: "full" | "icon";
  className?: string;
  onClick?: () => void;
}

export function Logo({ size = "medium", variant = "full", className = "", onClick }: LogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const logoRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Theo dõi vị trí chuột cho hiệu ứng 3D
  const handleMouseMove = (e: React.MouseEvent) => {
    if (logoRef.current) {
      const rect = logoRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePosition({ x, y });
    }
  };
  
  const sizeClasses = {
    small: "text-xl md:text-2xl",
    medium: "text-2xl md:text-3xl",
    large: "text-3xl md:text-4xl",
  };

  const iconSizes = {
    small: "w-7 h-7",
    medium: "w-8 h-8",
    large: "w-10 h-10",
  };

  const text = variant === "full" ? (isMobile ? "PXD" : "PhimXuyenDem") : "PXD";
  
  return (
    <div
      ref={logoRef}
      className={`flex items-center gap-3 ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      style={{
        perspective: "1000px",
        transformStyle: "preserve-3d"
      }}
    >
      {/* Logo icon với hiệu ứng 3D và ánh sáng */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-lg transition-all duration-300`}
        style={{
          transform: isHovered 
            ? `translateY(-2px) scale(1.05) 
               rotateY(${(mousePosition.x - 0.5) * 20}deg) 
               rotateX(${(mousePosition.y - 0.5) * -20}deg)`
            : "translateY(0) scale(1) rotateY(0) rotateX(0)",
          background: `linear-gradient(225deg, 
            hsl(var(--primary)) 0%, 
            hsl(var(--gradient-purple)) 50%, 
            hsl(var(--secondary)) 100%)`,
          boxShadow: isHovered 
            ? `0 10px 30px -10px rgba(var(--primary-rgb), 0.5),
               0 0 20px rgba(var(--primary-rgb), 0.3),
               inset 0 0 20px rgba(255,255,255,0.2)`
            : `0 4px 12px rgba(0, 0, 0, 0.2)`,
          transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
        }}
      >
        <Film className="text-white w-[60%] h-[60%] drop-shadow-[0_0_3px_rgba(255,255,255,0.8)] flex-shrink-0" />
        
        {/* Lớp overlay gradient */}
        <div 
          className="absolute inset-0 rounded-lg"
          style={{
            background: `linear-gradient(225deg,
              rgba(255,255,255,0.2) 0%,
              rgba(255,255,255,0.1) 50%,
              rgba(255,255,255,0) 100%)`,
            opacity: isHovered ? 1 : 0.5,
            transition: "opacity 0.3s ease"
          }}
        />
        
        {/* Hiệu ứng tia sáng */}
        <div 
          className="absolute -inset-1 rounded-xl opacity-0 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, 
              rgba(var(--primary-rgb), 0.8),
              transparent 70%)`,
            opacity: isHovered ? 0.6 : 0,
            filter: "blur(8px)"
          }}
        />
        
        {/* Điểm sáng góc */}
        <div 
          className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full"
          style={{
            opacity: isHovered ? 0.9 : 0.5,
            transform: isHovered ? "scale(1.5) translate(1px, -1px)" : "scale(1)",
            boxShadow: isHovered 
              ? "0 0 15px 5px rgba(255,255,255,0.9),0 0 30px 10px rgba(var(--primary-rgb),0.5)" 
              : "0 0 6px 1px rgba(255,255,255,0.5)",
            transition: "all 0.3s ease"
          }}
        />
      </div>

      {/* Logo text với hiệu ứng 3D và gradient */}
      <div 
        className={`${sizeClasses[size]} font-bold tracking-tight relative`}
        style={{
          transformStyle: "preserve-3d",
          perspective: "1000px"
        }}
      >
        {/* Base text */}
        <span className="text-white select-none opacity-0">{text}</span>
        
        {/* Gradient text layer */}
        <span 
          className="absolute inset-0 bg-clip-text text-transparent pointer-events-none select-none"
          style={{
            background: `linear-gradient(90deg,
              hsl(var(--primary)) 0%,
              hsl(var(--gradient-purple)) 25%,
              hsl(var(--secondary)) 50%,
              hsl(var(--gradient-purple)) 75%,
              hsl(var(--primary)) 100%)`,
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            transform: isHovered 
              ? `scale(1.05) 
                 rotateY(${(mousePosition.x - 0.5) * 10}deg) 
                 rotateX(${(mousePosition.y - 0.5) * -10}deg)`
              : "scale(1) rotateY(0) rotateX(0)",
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            animation: "gradient 8s linear infinite"
          }}
        >
          {text}
        </span>
        
        {/* Glow text layer */}
        <span 
          className="absolute inset-0 bg-clip-text text-transparent pointer-events-none select-none"
          style={{
            opacity: isHovered ? 0.7 : 0,
            textShadow: "0 0 20px rgba(var(--primary-rgb), 0.9), 0 0 40px rgba(var(--primary-rgb), 0.5)",
            transition: "all 0.3s ease"
          }}
        >
          {text}
        </span>

        {/* Underline với gradient và glow */}
        <div 
          className="absolute left-0 -bottom-1 h-[2px] rounded-full"
          style={{
            background: `linear-gradient(90deg,
              hsl(var(--primary)) 0%,
              hsl(var(--gradient-purple)) 50%,
              hsl(var(--secondary)) 100%)`,
            width: isHovered ? "105%" : "0%",
            opacity: isHovered ? 1 : 0,
            boxShadow: isHovered 
              ? "0 0 10px rgba(var(--primary-rgb), 0.8), 0 0 20px rgba(var(--primary-rgb), 0.4)" 
              : "none",
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            backgroundSize: "200% 100%",
            animation: "gradient 4s linear infinite"
          }}
        />
      </div>
    </div>
  );
}