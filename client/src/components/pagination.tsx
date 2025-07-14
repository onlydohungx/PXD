import { useState, useCallback } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal, 
  ChevronsLeft, 
  ChevronsRight,
  CornerDownRight
} from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  showPageJump?: boolean;
  onPageChange?: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, basePath, showPageJump = true, onPageChange }: PaginationProps) {
  const [, setLocation] = useLocation();
  const [jumpValue, setJumpValue] = useState("");
  const [jumpError, setJumpError] = useState(false);
  
  // Tạo URL với tham số page mới
  const createPageUrl = useCallback((page: number) => {
    try {
      // Lấy URL hiện tại và giữ lại các tham số khác
      const currentParams = new URLSearchParams(window.location.search);
      
      // Đặt tham số page mới
      currentParams.set("page", page.toString());
      
      // Trả về đường dẫn mới
      return `${basePath}?${currentParams.toString()}`;
    } catch (error) {
      console.error("Error creating page URL:", error);
      // Fallback đơn giản nếu có lỗi
      return `${basePath}?page=${page}`;
    }
  }, [basePath]);
  
  // Xử lý thay đổi trang
  const handlePageChange = useCallback((page: number) => {
    if (page === currentPage) return;
    
    // Nếu có callback từ parent component, dùng nó trước
    if (onPageChange) {
      onPageChange(page);
    } else {
      // Tạo URL mới và điều hướng
      const newUrl = createPageUrl(page);
      console.log("Navigating to:", newUrl);
      
      try {
        // Sử dụng setLocation của wouter để thay đổi URL
        setLocation(newUrl);
        
        // Để component cha kiểm soát việc scroll, không tự cuộn ở đây khi có onPageChange
      } catch (error) {
        console.error("Navigation error:", error);
        // Fallback dùng window.location nếu wouter thất bại
        window.location.href = newUrl;
      }
    }
  }, [currentPage, onPageChange, createPageUrl, setLocation]);

  // Tạo mảng các số trang để hiển thị
  const getPageNumbers = useCallback(() => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 7; // Số trang tối đa hiển thị cùng lúc
    const siblingsCount = 1; // Số trang hiển thị bên cạnh trang hiện tại
    
    // Nếu tổng số trang ít, hiển thị tất cả
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }
    
    // Tính toán khoảng cách từ trang hiện tại đến đầu/cuối
    const leftSiblingIndex = Math.max(currentPage - siblingsCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingsCount, totalPages);
    
    // Xác định xem có cần hiển thị dấu "..." không
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;
    
    // Luôn hiển thị trang đầu và trang cuối
    pageNumbers.push(1);
    
    // Hiển thị các dấu ... và trang xung quanh trang hiện tại
    if (shouldShowLeftDots && shouldShowRightDots) {
      // Trường hợp 1: Hiển thị ... ở cả hai bên
      pageNumbers.push("left-dots");
      
      // Thêm các trang xung quanh trang hiện tại
      for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
        pageNumbers.push(i);
      }
      
      pageNumbers.push("right-dots");
    } 
    else if (!shouldShowLeftDots && shouldShowRightDots) {
      // Trường hợp 2: Chỉ hiển thị ... bên phải
      for (let i = 2; i <= rightSiblingIndex; i++) {
        pageNumbers.push(i);
      }
      
      pageNumbers.push("right-dots");
    } 
    else if (shouldShowLeftDots && !shouldShowRightDots) {
      // Trường hợp 3: Chỉ hiển thị ... bên trái
      pageNumbers.push("left-dots");
      
      // Hiển thị các trang từ leftSiblingIndex đến gần cuối
      for (let i = leftSiblingIndex; i < totalPages; i++) {
        pageNumbers.push(i);
      }
    }
    
    // Đảm bảo trang cuối cùng được thêm vào (trừ khi đã có)
    if (pageNumbers[pageNumbers.length - 1] !== totalPages) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  }, [currentPage, totalPages]);

  // Xử lý nhảy đến trang cụ thể
  const handleJumpToPage = useCallback(() => {
    // Parse giá trị nhập vào
    const pageNumber = parseInt(jumpValue);
    
    // Kiểm tra giá trị
    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
      setJumpError(true);
      return;
    }
    
    // Nếu hợp lệ, chuyển đến trang đó
    setJumpError(false);
    handlePageChange(pageNumber);
    setJumpValue("");
  }, [jumpValue, totalPages, handlePageChange]);

  // Xử lý sự kiện nhấn Enter
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleJumpToPage();
    }
  }, [handleJumpToPage]);

  return (
    <div className="flex flex-col items-center gap-4 mt-8 md:mt-12">
      <nav 
        className="relative flex items-center flex-wrap justify-center space-x-1 md:space-x-2 p-2 md:p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/5 shadow-lg"
        style={{
          background: "radial-gradient(circle at center, rgba(30,30,30,0.3) 0%, rgba(10,10,10,0.1) 100%)"
        }}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-2xl">
          <div className="absolute -top-10 left-1/4 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-5 right-1/4 w-20 h-20 bg-secondary/10 rounded-full blur-xl"></div>
        </div>
      
        {/* First page button */}
        <Button
          variant="outline"
          size="icon"
          className={`hidden md:flex w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/10 backdrop-blur-sm 
            ${currentPage !== 1 ? 'hover:border-primary/30 hover:bg-primary/10 transition-all duration-300' : ''}`}
          disabled={currentPage === 1}
          onClick={() => currentPage !== 1 && handlePageChange(1)}
          aria-label="Trang đầu tiên"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page button */}
        <Button
          variant="outline"
          size="icon"
          className={`w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/10 backdrop-blur-sm 
            ${currentPage !== 1 ? 'hover:border-primary/30 hover:bg-primary/10 transition-all duration-300' : ''}`}
          disabled={currentPage === 1}
          onClick={() => currentPage !== 1 && handlePageChange(currentPage - 1)}
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {/* Page number buttons */}
        <div className="flex items-center space-x-1 md:space-x-2">
          {getPageNumbers().map((page, index) => {
            // Xử lý dấu ...
            if (typeof page === "string") {
              const isLeftDots = page === "left-dots";
              const isRightDots = page === "right-dots";
              
              // Tính toán trang đích khi bấm vào dấu ...
              let targetPage = currentPage;
              if (isLeftDots) {
                targetPage = Math.max(Math.floor((1 + currentPage) / 2), 2);
              } else if (isRightDots) {
                targetPage = Math.min(Math.floor((currentPage + totalPages) / 2), totalPages - 1);
              }
              
              return (
                <Button
                  key={`${page}-${index}`}
                  variant="outline"
                  size="icon"
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/10 backdrop-blur-sm hover:border-white/30 hover:bg-white/5"
                  onClick={() => handlePageChange(targetPage)}
                  aria-label={isLeftDots ? "Trang trước" : "Trang sau"}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              );
            }
            
            // Xử lý các nút số trang
            return (
              <Button
                key={`page-${page}`}
                variant={page === currentPage ? "default" : "outline"}
                className={`w-9 h-9 md:w-10 md:h-10 rounded-full transition-all duration-300 
                  ${page === currentPage 
                    ? "bg-gradient-to-r from-primary to-secondary border-none shadow-lg shadow-primary/20"
                    : "border-white/10 hover:border-white/30 backdrop-blur-sm hover:bg-white/5"
                  }`}
                onClick={() => page !== currentPage && handlePageChange(page)}
                aria-label={`Trang ${page}`}
                aria-current={page === currentPage ? "page" : undefined}
              >
                <span className={page === currentPage ? "font-medium" : ""}>{page}</span>
              </Button>
            );
          })}
        </div>
        
        {/* Next page button */}
        <Button
          variant="outline"
          size="icon"
          className={`w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/10 backdrop-blur-sm 
            ${currentPage !== totalPages ? 'hover:border-primary/30 hover:bg-primary/10 transition-all duration-300' : ''}`}
          disabled={currentPage === totalPages}
          onClick={() => currentPage !== totalPages && handlePageChange(currentPage + 1)}
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page button */}
        <Button
          variant="outline"
          size="icon"
          className={`hidden md:flex w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/10 backdrop-blur-sm 
            ${currentPage !== totalPages ? 'hover:border-primary/30 hover:bg-primary/10 transition-all duration-300' : ''}`}
          disabled={currentPage === totalPages}
          onClick={() => currentPage !== totalPages && handlePageChange(totalPages)}
          aria-label="Trang cuối cùng"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </nav>

      {/* Nhảy đến trang cụ thể */}
      {showPageJump && totalPages > 7 && (
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md rounded-lg border border-white/5 p-1.5">
            <span className="text-white/70 text-xs ml-1">Đến trang:</span>
            <div className="relative">
              <Input
                type="number"
                value={jumpValue}
                onChange={(e) => {
                  setJumpValue(e.target.value);
                  if (jumpError) setJumpError(false);
                }}
                onKeyDown={handleKeyDown}
                min={1}
                max={totalPages}
                className={`w-16 h-8 px-2 py-1 bg-black/40 border ${jumpError ? 'border-red-500' : 'border-white/10'} rounded-md text-center`}
                aria-label="Nhập số trang"
                aria-invalid={jumpError}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 py-1 bg-black/20 border border-white/10 rounded-md hover:bg-primary/20 hover:border-primary/30"
              onClick={handleJumpToPage}
              aria-label="Đi đến trang đã nhập"
            >
              <CornerDownRight className="h-3.5 w-3.5 mr-1" /> Đi
            </Button>
          </div>
          <span className="text-white/60 text-xs">(1-{totalPages})</span>
        </div>
      )}
      
      {/* Thông báo trang hiện tại */}
      <div className="text-sm text-white/60">
        Trang {currentPage} / {totalPages}
      </div>
    </div>
  );
}
