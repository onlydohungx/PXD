import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  noPadding?: boolean;
  maxWidth?: "default" | "small" | "large" | "full"; // Các kích thước khác nhau
  marginTop?: "none" | "small" | "default" | "large"; // Khoảng cách padding top đa dạng
}

export function PageContainer({
  children,
  className,
  fullWidth = false,
  noPadding = false,
  maxWidth = "default",
  marginTop = "default"
}: PageContainerProps) {
  // Tính toán max width dựa trên cấu hình
  const maxWidthClass = {
    default: "max-w-7xl",
    small: "max-w-5xl",
    large: "max-w-8xl",
    full: "max-w-full"
  }[maxWidth];
  
  // Tính toán margin top dựa trên cấu hình
  const marginTopClass = {
    none: "mt-0",
    small: "mt-6",
    default: "mt-12 sm:mt-16",
    large: "mt-16 sm:mt-24"
  }[marginTop];
  
  return (
    <div 
      className={cn(
        "w-full mx-auto",
        fullWidth ? "" : maxWidthClass,
        noPadding ? "" : "px-4 sm:px-6 lg:px-8",
        marginTopClass,
        className
      )}
    >
      {children}
    </div>
  );
}

interface PageSectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  noPadding?: boolean;
  marginBottom?: "none" | "small" | "default" | "large";
}

export function PageSection({
  children,
  className,
  id,
  noPadding = false,
  marginBottom = "default"
}: PageSectionProps) {
  // Tính toán margin bottom dựa trên cấu hình
  const marginBottomClass = {
    none: "mb-0",
    small: "mb-6",
    default: "mb-12 sm:mb-16",
    large: "mb-16 sm:mb-24"
  }[marginBottom];
  
  return (
    <section 
      id={id}
      className={cn(
        marginBottomClass,
        noPadding ? "" : "py-4 sm:py-6",
        className
      )}
    >
      {children}
    </section>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  centered?: boolean;
  marginBottom?: "none" | "small" | "default" | "large";
}

export function PageHeader({
  title,
  description,
  children,
  className,
  centered = false,
  marginBottom = "default"
}: PageHeaderProps) {
  // Tính toán margin bottom dựa trên cấu hình
  const marginBottomClass = {
    none: "mb-0",
    small: "mb-4 sm:mb-6",
    default: "mb-8 sm:mb-10",
    large: "mb-12 sm:mb-16"
  }[marginBottom];
  
  return (
    <div 
      className={cn(
        marginBottomClass,
        centered ? "text-center" : "",
        className
      )}
    >
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      
      {description && (
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
          {description}
        </p>
      )}
      
      {children && (
        <div className={cn("mt-6", centered ? "flex justify-center" : "")}>
          {children}
        </div>
      )}
    </div>
  );
}

interface PageGridProps {
  children: ReactNode;
  className?: string;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: "none" | "small" | "default" | "large";
}

export function PageGrid({
  children,
  className,
  columns = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 4
  },
  gap = "default"
}: PageGridProps) {
  // Tính toán columns cho mỗi breakpoint
  const columnsClass = [
    `grid-cols-${columns.xs || 1}`,
    `sm:grid-cols-${columns.sm || 2}`,
    `md:grid-cols-${columns.md || 3}`,
    `lg:grid-cols-${columns.lg || 4}`,
    `xl:grid-cols-${columns.xl || 4}`
  ].join(" ");
  
  // Tính toán gap dựa trên cấu hình
  const gapClass = {
    none: "gap-0",
    small: "gap-2 sm:gap-3",
    default: "gap-4 sm:gap-6",
    large: "gap-6 sm:gap-8"
  }[gap];
  
  return (
    <div className={cn("grid", columnsClass, gapClass, className)}>
      {children}
    </div>
  );
}