import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface SectionHeadingProps {
  title: string;
  icon: React.ReactNode;
  viewAllLink?: string;
  iconColor?: string;
}

export function SectionHeading({ 
  title, 
  icon, 
  viewAllLink, 
  iconColor = "text-primary" 
}: SectionHeadingProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-10 gap-4"
    >
      <motion.div 
        className="flex items-center gap-4"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Enhanced icon container with 3D effect */}
        <div className={`p-3 md:p-4 rounded-2xl bg-gradient-to-br from-black/60 to-black/20 backdrop-blur-lg border border-white/10 shadow-xl ${iconColor} transform transition-transform duration-300 hover:scale-110 hover:rotate-3`}>
          <div className="w-6 h-6 md:w-7 md:h-7">
            {icon}
          </div>
        </div>
        
        {/* Title with animated underline */}
        <div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-300">{title}</h2>
          <div className="relative h-1 w-16 md:w-24 mt-2 overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
            <motion.div 
              className="absolute inset-0 bg-white/30 rounded-full"
              initial={{ x: '-100%' }}
              whileInView={{ x: '100%' }}
              viewport={{ once: false }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </motion.div>
      
      {viewAllLink && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Button 
            variant="outline" 
            size="sm"
            asChild
            className="gap-1.5 group bg-black/40 hover:bg-black/60 backdrop-blur-lg border-white/10 hover:border-white/20 rounded-xl h-10 px-4 text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Link href={viewAllLink}>
              Xem tất cả 
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}