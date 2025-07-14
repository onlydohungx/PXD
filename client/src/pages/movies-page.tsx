import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMovies, fetchCategories, fetchCountries, fetchYears } from "@/lib/api";
import { CategoryFilter } from "@/components/category-filter";
import { MovieGrid } from "@/components/movie-grid";
import { Pagination } from "@/components/pagination";
import { Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function MoviesPage() {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSort, setSelectedSort] = useState("new");
  
  // Fetch movies
  const { data: moviesData, isLoading: isMoviesLoading } = useQuery({
    queryKey: ['/api/movies/single', page, selectedCategory, selectedCountry, selectedYear, selectedSort],
    queryFn: () => fetchMovies({ 
      page,
      category: selectedCategory,
      country: selectedCountry,
      year: selectedYear,
      sort: selectedSort,
      type: "single" // Quan trọng: Đây là tham số xác định đây là trang phim lẻ
    }),
  });
  
  // Fetch categories for the filter
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: fetchCategories,
  });

  // Fetch countries for filter
  const { data: countries } = useQuery({
    queryKey: ['/api/countries'],
    queryFn: fetchCountries,
  });

  // Fetch years for filter
  const { data: years } = useQuery({
    queryKey: ['/api/years'],
    queryFn: fetchYears,
  });

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedCountry("all");
    setSelectedYear("all");
    setSelectedSort("new");
    setPage(1);
  };

  // Update page when pagination changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pt-4 pb-12 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Phim Lẻ</h1>
        <p className="text-muted-foreground">
          Tuyển tập những bộ phim điện ảnh đặc sắc và mới nhất dành cho bạn
        </p>
      </div>
      
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryFilter 
            categories={categories || []} 
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setPage(1);
            }}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span>Bộ lọc</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Bộ lọc phim</SheetTitle>
                <SheetDescription>
                  Lọc phim theo các tiêu chí khác nhau
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-4 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Thể loại</Label>
                  <Select 
                    value={selectedCategory} 
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Tất cả thể loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả thể loại</SelectItem>
                      {categories?.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Quốc gia</Label>
                  <Select 
                    value={selectedCountry} 
                    onValueChange={(value) => {
                      setSelectedCountry(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Tất cả quốc gia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả quốc gia</SelectItem>
                      {countries?.map((country: any) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="year">Năm phát hành</Label>
                  <Select 
                    value={selectedYear} 
                    onValueChange={(value) => {
                      setSelectedYear(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger id="year">
                      <SelectValue placeholder="Tất cả các năm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả các năm</SelectItem>
                      {years?.map((year: any) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sort">Sắp xếp</Label>
                  <Select 
                    value={selectedSort} 
                    onValueChange={(value) => {
                      setSelectedSort(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger id="sort">
                      <SelectValue placeholder="Sắp xếp theo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Mới nhất</SelectItem>
                      <SelectItem value="name">Tên A-Z</SelectItem>
                      <SelectItem value="year">Năm phát hành</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={resetFilters} className="w-full mt-4">
                  Đặt lại bộ lọc
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          
          <Select 
            value={selectedSort} 
            onValueChange={(value) => {
              setSelectedSort(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Mới nhất</SelectItem>
              <SelectItem value="name">Tên A-Z</SelectItem>
              <SelectItem value="year">Năm phát hành</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Active Filters */}
      {(selectedCategory && selectedCategory !== "all" || selectedCountry && selectedCountry !== "all" || selectedYear && selectedYear !== "all") && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm text-muted-foreground">Bộ lọc đang áp dụng:</span>
          
          {selectedCategory && categories && (
            <div className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm">
              {categories.find((c: any) => c.id === selectedCategory)?.name || selectedCategory}
            </div>
          )}
          
          {selectedCountry && countries && (
            <div className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm">
              {countries.find((c: any) => c.id === selectedCountry)?.name || selectedCountry}
            </div>
          )}
          
          {selectedYear && (
            <div className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm">
              Năm {selectedYear}
            </div>
          )}
          
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 rounded-full">
            Xóa bộ lọc
          </Button>
        </div>
      )}
      
      {/* Movies Grid */}
      {isMoviesLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[...Array(15)].map((_, index) => (
            <div key={index} className="aspect-[2/3] bg-muted rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : moviesData?.items && moviesData.items.length > 0 ? (
        <>
          <MovieGrid movies={moviesData.items} />
          
          {/* Pagination */}
          {moviesData.pagination && moviesData.pagination.totalPages > 1 && (
            <Pagination 
              currentPage={page} 
              totalPages={moviesData.pagination.totalPages} 
              basePath="/movies"
              showPageJump={true}
            />
          )}
        </>
      ) : (
        <div className="py-20 text-center">
          <p className="text-xl text-muted-foreground mb-4">Không tìm thấy phim nào phù hợp với bộ lọc</p>
          <Button onClick={resetFilters}>Đặt lại bộ lọc</Button>
        </div>
      )}
    </div>
  );
}