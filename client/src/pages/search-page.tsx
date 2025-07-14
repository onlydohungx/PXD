import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchMovies, fetchCategories, fetchCountries, fetchYears } from "@/lib/api";
import { MovieGrid } from "@/components/movie-grid";
import { Pagination } from "@/components/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, FilterX, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface SearchFilters {
  page: number;
  search?: string;
  category?: string;
  country?: string;
  year?: string;
  sort_field?: string;
  sort_type?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _id?: string; // Đôi khi API trả về _id thay vì id
}

interface Country {
  _id: string;
  name: string;
  slug: string;
}

interface Year {
  id: string;
  name: string;
}

export default function SearchPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";
  const initialPage = parseInt(searchParams.get("page") || "1");
  const initialCategory = searchParams.get("category") || "all";
  const initialCountry = searchParams.get("country") || "all";
  const initialYear = searchParams.get("year") || "all";
  const initialSortField = searchParams.get("sort_field") || "modified_time";
  const initialSortType = searchParams.get("sort_type") || "desc";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({
    page: initialPage,
    search: initialQuery,
    category: initialCategory || undefined,
    country: initialCountry || undefined,
    year: initialYear || undefined,
    sort_field: initialSortField,
    sort_type: initialSortType
  });
  
  // Tham chiếu để lưu timeout cho search debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.country) count++;
    if (filters.year) count++;
    if (filters.sort_field !== "modified_time" || filters.sort_type !== "desc") count++;
    setActiveFiltersCount(count);
  }, [filters]);
  
  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: fetchCategories
  });
  
  // Fetch countries
  const { data: countries } = useQuery({
    queryKey: ['/api/countries'],
    queryFn: fetchCountries
  });
  
  // Fetch years
  const { data: years } = useQuery({
    queryKey: ['/api/years'],
    queryFn: fetchYears
  });
  
  // Fetch search results - include even when there's no search query to show all movies with filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/movies', filters],
    queryFn: () => fetchMovies(filters)
  });
  
  // Update search parameters in URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("q", filters.search);
    if (filters.page > 1) params.set("page", filters.page.toString());
    if (filters.category) params.set("category", filters.category);
    if (filters.country) params.set("country", filters.country);
    if (filters.year) params.set("year", filters.year);
    if (filters.sort_field !== "modified_time") params.set("sort_field", filters.sort_field || "");
    if (filters.sort_type !== "desc") params.set("sort_type", filters.sort_type || "");
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [filters]);
  
  // Không cần hàm handleSearch nữa vì đã có tìm kiếm tự động
  
  // Handle clear search - giữ lại các bộ lọc khác
  const handleClearSearch = () => {
    setSearchQuery("");
    setFilters({
      ...filters,
      search: undefined,
      page: 1
    });
  };
  
  // Handle filter changes
  const handleFilterChange = (filter: Partial<SearchFilters>) => {
    // Xử lý giá trị "all" - chuyển thành undefined để xóa bộ lọc
    const processedFilter = { ...filter };
    
    if (processedFilter.category === "all") processedFilter.category = undefined;
    if (processedFilter.country === "all") processedFilter.country = undefined;
    if (processedFilter.year === "all") processedFilter.year = undefined;
    
    setFilters({
      ...filters,
      ...processedFilter,
      page: 1
    });
  };
  
  // Kiểm tra thiết bị có yêu cầu giảm chuyển động không
  const [reduceMotion, setReduceMotion] = useState(false);
  
  // Kiểm tra thiết bị có yêu cầu giảm chuyển động không
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLowEndDevice = /Android 5|Android 6|Android 7|iPhone OS [789]/.test(navigator.userAgent);
    
    if (prefersReducedMotion || isLowEndDevice) {
      setReduceMotion(true);
    }
  }, []);

  // Handle page change - cải thiện với useCallback
  const handlePageChange = useCallback((newPage: number) => {
    setFilters({
      ...filters,
      page: newPage
    });
    
    // Tránh animation scroll cho thiết bị yếu
    if (reduceMotion) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [filters, reduceMotion]);
  
  // Handle clear all filters
  const handleClearFilters = () => {
    setFilters({
      ...filters,
      category: undefined,
      country: undefined,
      year: undefined,
      sort_field: "modified_time",
      sort_type: "desc"
    });
  };

  return (
    <div className="py-8 px-4 md:px-8 lg:px-12 xl:px-16">
      <div className="max-w-[1800px] mx-auto">
        {/* Header with decoration */}
        <div className="mb-8 relative">
          <div className="absolute -z-10 top-0 left-1/2 transform -translate-x-1/2 w-full max-w-3xl h-20 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 blur-3xl opacity-50 rounded-full"></div>
          
          {/* Page title */}
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary">
            Tìm Kiếm Phim
          </h1>
          
          {/* Search form */}
          <div className="flex flex-wrap gap-3 mb-6 max-w-3xl mx-auto">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Nhập tên phim, diễn viên, đạo diễn..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  
                  // Thực hiện tìm kiếm tự động sau khi người dùng nhập ít nhất 2 ký tự
                  if (e.target.value.trim().length >= 2) {
                    // Sử dụng debounce để tránh gọi API quá nhiều lần
                    if (searchTimeoutRef.current) {
                      clearTimeout(searchTimeoutRef.current);
                    }
                    
                    searchTimeoutRef.current = setTimeout(() => {
                      setFilters({
                        ...filters,
                        search: e.target.value.trim(),
                        page: 1
                      });
                    }, 500); // Delay 500ms
                  } else if (e.target.value.trim() === "") {
                    // Nếu người dùng xóa hết nội dung, xóa bộ lọc tìm kiếm
                    if (filters.search) {
                      setFilters({
                        ...filters,
                        search: undefined,
                        page: 1
                      });
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
                    // Gọi ngay lập tức nếu nhấn Enter
                    if (searchTimeoutRef.current) {
                      clearTimeout(searchTimeoutRef.current);
                    }
                    setFilters({
                      ...filters,
                      search: searchQuery.trim(),
                      page: 1
                    });
                  }
                }}
                className="pl-11 py-6 bg-card/40 backdrop-blur-sm border-muted focus-visible:ring-primary rounded-xl w-full"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              {searchQuery.length > 0 && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xs opacity-70">
                  {searchQuery.length >= 2 ? 'Đang tìm...' : 'Nhập thêm ký tự...'}
                </div>
              )}
            </div>
            
            {/* Bộ lọc nâng cao */}
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 rounded-xl py-6 w-full sm:w-auto bg-card/40 backdrop-blur-sm hover:bg-card/70 border-muted transition-all duration-300"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Bộ lọc</span>
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-1 bg-primary text-white" variant="default">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[340px] sm:w-[400px] bg-card/95 backdrop-blur-md border-muted">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-bold text-center">Bộ lọc tìm kiếm</SheetTitle>
                  <SheetDescription className="text-center">
                    Lọc kết quả tìm kiếm theo tiêu chí
                  </SheetDescription>
                </SheetHeader>
                
                <div className="py-6 space-y-6">
                  {/* Thể loại */}
                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-sm font-medium">Thể loại</Label>
                    <Select
                      value={filters.category || "all"}
                      onValueChange={(value) => handleFilterChange({ category: value })}
                    >
                      <SelectTrigger id="category" className="bg-background/40 border-muted">
                        <SelectValue placeholder="Tất cả thể loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả thể loại</SelectItem>
                        {categories?.map((category: Category) => (
                          <SelectItem key={category.id || category._id} value={category.slug || category._id || category.id || "invalid-slug"}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Quốc gia */}
                  <div className="space-y-3">
                    <Label htmlFor="country" className="text-sm font-medium">Quốc gia</Label>
                    <Select
                      value={filters.country || "all"}
                      onValueChange={(value) => handleFilterChange({ country: value })}
                    >
                      <SelectTrigger id="country" className="bg-background/40 border-muted">
                        <SelectValue placeholder="Tất cả quốc gia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả quốc gia</SelectItem>
                        {countries?.map((country: Country) => (
                          <SelectItem key={country._id} value={country.slug || country._id}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Năm */}
                  <div className="space-y-3">
                    <Label htmlFor="year" className="text-sm font-medium">Năm phát hành</Label>
                    <Select
                      value={filters.year || "all"}
                      onValueChange={(value) => handleFilterChange({ year: value })}
                    >
                      <SelectTrigger id="year" className="bg-background/40 border-muted">
                        <SelectValue placeholder="Tất cả các năm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả các năm</SelectItem>
                        {years?.map((year: Year) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Sắp xếp */}
                  <div className="space-y-3">
                    <Label htmlFor="sort" className="text-sm font-medium">Sắp xếp theo</Label>
                    <Select
                      value={`${filters.sort_field || "modified_time"}-${filters.sort_type || "desc"}`}
                      onValueChange={(value) => {
                        const [sort_field, sort_type] = value.split("-");
                        handleFilterChange({ sort_field, sort_type });
                      }}
                    >
                      <SelectTrigger id="sort" className="bg-background/40 border-muted">
                        <SelectValue placeholder="Mới nhất" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modified_time-desc">Mới nhất</SelectItem>
                        <SelectItem value="modified_time-asc">Cũ nhất</SelectItem>
                        <SelectItem value="year-desc">Năm (mới đến cũ)</SelectItem>
                        <SelectItem value="year-asc">Năm (cũ đến mới)</SelectItem>
                        <SelectItem value="name-asc">Tên A-Z</SelectItem>
                        <SelectItem value="name-desc">Tên Z-A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-between mt-6 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="flex items-center gap-2 border-muted"
                  >
                    <FilterX className="h-4 w-4" />
                    Xóa bộ lọc
                  </Button>
                  <SheetClose asChild>
                    <Button className="flex-1 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/20">
                      Áp dụng
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Nút xóa tìm kiếm */}
            {filters.search && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClearSearch}
                className="flex items-center gap-2 rounded-xl py-6 w-full sm:w-auto bg-card/40 backdrop-blur-sm hover:bg-card/70 border-muted"
              >
                <FilterX className="h-4 w-4" />
                <span className="hidden sm:inline">Xóa tìm kiếm</span>
              </Button>
            )}
          </div>
          
          {/* Hiển thị bộ lọc đang áp dụng */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6 max-w-3xl mx-auto">
              {filters.category && categories && (
                <Badge variant="secondary" className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-none transition-all">
                  <span className="font-medium">Thể loại:</span> {categories.find((c: Category) => c.id === filters.category || c._id === filters.category)?.name || 'Không xác định'}
                  <button
                    className="ml-2 rounded-full hover:bg-primary/10 p-0.5"
                    onClick={() => handleFilterChange({ category: undefined })}
                  >
                    ×
                  </button>
                </Badge>
              )}
              
              {filters.country && countries && (
                <Badge variant="secondary" className="px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-none transition-all">
                  <span className="font-medium">Quốc gia:</span> {countries.find((c: Country) => c._id === filters.country)?.name || 'Không xác định'}
                  <button
                    className="ml-2 rounded-full hover:bg-blue-500/10 p-0.5"
                    onClick={() => handleFilterChange({ country: undefined })}
                  >
                    ×
                  </button>
                </Badge>
              )}
              
              {filters.year && (
                <Badge variant="secondary" className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 border-none transition-all">
                  <span className="font-medium">Năm:</span> {filters.year}
                  <button
                    className="ml-2 rounded-full hover:bg-green-500/10 p-0.5"
                    onClick={() => handleFilterChange({ year: undefined })}
                  >
                    ×
                  </button>
                </Badge>
              )}
              
              {(filters.sort_field !== "modified_time" || filters.sort_type !== "desc") && (
                <Badge variant="secondary" className="px-3 py-1.5 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-none transition-all">
                  <span className="font-medium">Sắp xếp:</span> {filters.sort_field === "modified_time" 
                    ? (filters.sort_type === "desc" ? "Mới nhất" : "Cũ nhất")
                    : filters.sort_field === "year" 
                      ? (filters.sort_type === "desc" ? "Năm (mới đến cũ)" : "Năm (cũ đến mới)")
                      : filters.sort_field === "name"
                        ? (filters.sort_type === "asc" ? "Tên A-Z" : "Tên Z-A")
                        : "Tùy chỉnh"
                  }
                  <button
                    className="ml-2 rounded-full hover:bg-purple-500/10 p-0.5"
                    onClick={() => handleFilterChange({ 
                      sort_field: "modified_time", 
                      sort_type: "desc" 
                    })}
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
          
          {/* Search query display */}
          {filters.search && (
            <div className="text-center mb-8">
              <p className="text-muted-foreground">
                Kết quả tìm kiếm cho: <span className="text-primary font-medium">"{filters.search}"</span>
              </p>
            </div>
          )}
        </div>
        
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Đang tìm kiếm phim...</p>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="text-center py-20 bg-card/20 backdrop-blur-sm rounded-xl px-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-500 mb-2">Lỗi tìm kiếm</h2>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : "Đã xảy ra lỗi khi tìm kiếm phim"}
            </p>
            <Button 
              variant="outline" 
              className="mt-4 border-red-500/20 text-red-500 hover:bg-red-500/10"
              onClick={handleClearSearch}
            >
              Thử lại
            </Button>
          </div>
        )}
        
        {/* Results */}
        {!isLoading && !error && data && (
          <div>
            {data.items?.length > 0 || (data.data?.items && data.data.items.length > 0) ? (
              <>
                <MovieGrid movies={data.items || data.data?.items || []} />
                
                {(data.pagination?.totalPages > 1 || data.data?.params?.pagination?.totalPages > 1) && (
                  <div className="mt-10 flex justify-center">
                    <Pagination 
                      currentPage={filters.page} 
                      totalPages={data.pagination?.totalPages || data.data?.params?.pagination?.totalPages || 1} 
                      basePath="/search"
                      showPageJump={true}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-card/20 backdrop-blur-sm rounded-xl">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">Không tìm thấy kết quả</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Không tìm thấy phim phù hợp với tiêu chí tìm kiếm. Vui lòng thử với từ khóa khác hoặc điều chỉnh bộ lọc.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={handleClearSearch}
                >
                  Xóa tìm kiếm
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
