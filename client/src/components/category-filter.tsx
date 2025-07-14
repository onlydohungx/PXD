import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useMobile from "@/hooks/use-mobile";

interface Category {
  id: string;
  name: string;
  _id?: string; // Đôi khi API trả về _id thay vì id
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const isMobile = useMobile();
  
  // Xử lý thay đổi thể loại - sử dụng callback để cập nhật state thay vì tải lại trang
  const handleCategoryChange = (categoryId: string) => {
    onSelectCategory(categoryId);
  };
  
  // Get selected category name for display
  const getSelectedCategoryName = () => {
    if (!selectedCategory || selectedCategory === "all") return "Tất cả";
    const category = categories.find(cat => cat.id === selectedCategory || cat._id === selectedCategory);
    return category ? category.name : "Tất cả";
  };

  if (isMobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-1 bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60 hover:border-white/20 rounded-xl h-10"
          >
            <span className="font-medium">{getSelectedCategoryName()}</span>
            <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-black/80 backdrop-blur-md border border-white/10 shadow-xl">
          <DropdownMenuItem
            className={!selectedCategory || selectedCategory === "all" ? "bg-primary/20 text-primary font-medium" : "text-white/90 hover:bg-white/10"}
            onClick={() => handleCategoryChange("all")}
          >
            Tất cả
          </DropdownMenuItem>
          {categories.map((category) => (
            <DropdownMenuItem
              key={category.id || category._id}
              className={selectedCategory === category.id || selectedCategory === category._id ? 
                "bg-primary/20 text-primary font-medium" : 
                "text-white/90 hover:bg-white/10"
              }
              onClick={() => handleCategoryChange(category.id || category._id || "")}
            >
              {category.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Enhanced desktop version
  return (
    <div className="relative">
      {/* Subtle gradient decoration for desktop */}
      <div className="absolute -z-10 inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-xl blur-xl opacity-50"></div>
      
      <ScrollArea className="whitespace-nowrap w-full max-w-4xl">
        <div className="flex space-x-3 py-2 px-1">
          <Button
            variant={!selectedCategory || selectedCategory === "all" ? "default" : "ghost"}
            className={!selectedCategory || selectedCategory === "all" ? 
              "bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:shadow-lg hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 rounded-xl h-10" : 
              "bg-black/30 text-white/80 hover:text-white hover:bg-black/50 rounded-xl h-10 backdrop-blur-sm border border-white/10"
            }
            onClick={() => handleCategoryChange("all")}
          >
            <span className="font-medium">Tất cả</span>
          </Button>
          
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id || selectedCategory === category._id;
            return (
              <Button
                key={category.id || category._id}
                variant={isSelected ? "default" : "ghost"}
                className={isSelected ? 
                  "bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:shadow-lg hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 rounded-xl h-10" : 
                  "bg-black/30 text-white/80 hover:text-white hover:bg-black/50 rounded-xl h-10 backdrop-blur-sm border border-white/10"
                }
                onClick={() => handleCategoryChange(category.id || category._id || "")}
              >
                <span className="font-medium">{category.name}</span>
              </Button>
            );
          })}
        </div>
        <ScrollBar 
          orientation="horizontal" 
          className="h-2.5 bg-transparent" 
        />
      </ScrollArea>
    </div>
  );
}
