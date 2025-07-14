import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  fetchCategories, 
  fetchCountries, 
  fetchYears,
  fetchCategoryMovies,
  fetchCountryMovies,
  fetchYearMovies
} from '@/lib/api';
import { MovieGrid } from '@/components/movie-grid';

import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FilterX, Filter, Film, Flag, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import useMobile from '@/hooks/use-mobile';
import { MovieGridSkeleton } from '@/components/ui/skeleton-loader';

// Interface for category, country, year
interface FilterItem {
  id?: string;
  _id?: string;
  name: string;
  slug?: string;
}

// Filter options
interface FilterOptions {
  page: number;
  category?: string; 
  country?: string;
  year?: string;
  sort_field?: string;
  sort_type?: string;
  sort_lang?: string;
  limit?: number;
  type?: string; // type: 'series' hoặc 'single'
}

export default function FilterPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const isMobile = useMobile();
  
  // Determine the active tab based on URL path
  const path = location.split('/')[1] || '';
  const initialTab = path === 'the-loai' ? 'category' : 
                     path === 'quoc-gia' ? 'country' : 
                     path === 'nam' ? 'year' : 
                     path === 'filter' ? 'category' : 'category';
  
  // Get filter parameters from URL
  const initialFilterId = searchParams.get('id') || '';
  const initialPage = parseInt(searchParams.get('page') || '1');
  const initialSortField = searchParams.get('sort_field') || 'modified_time';
  const initialSortType = searchParams.get('sort_type') || 'desc';
  const initialSortLang = searchParams.get('sort_lang') || '';
  
  // Filter states
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [page, setPage] = useState(initialPage);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [sortOption, setSortOption] = useState(`${initialSortField}-${initialSortType}`);
  
  // Get slug from URL if available (for new URL format)
  const pathParts = location.split('/');
  const slug = pathParts.length > 2 ? pathParts[2] : '';
  
  // Set initial filter values based on URL
  useEffect(() => {
    // First check if we have a slug in the new URL format
    if (slug) {
      if (path === 'the-loai') {
        setActiveTab('category');
        setSelectedCategory(slug);
        // Keep other selections for combined filtering
        // Parse additional filters from URL query params if present
        if (searchParams.get('country')) setSelectedCountry(searchParams.get('country') || '');
        if (searchParams.get('year')) setSelectedYear(searchParams.get('year') || '');
      }
      else if (path === 'quoc-gia') {
        setActiveTab('country');
        setSelectedCountry(slug);
        // Keep other selections for combined filtering
        if (searchParams.get('category')) setSelectedCategory(searchParams.get('category') || '');
        if (searchParams.get('year')) setSelectedYear(searchParams.get('year') || '');
      }
      else if (path === 'nam') {
        setActiveTab('year');
        setSelectedYear(slug);
        // Keep other selections for combined filtering
        if (searchParams.get('category')) setSelectedCategory(searchParams.get('category') || '');
        if (searchParams.get('country')) setSelectedCountry(searchParams.get('country') || '');
      }
    }
    // Fallback to old query param format if no slug
    else if (initialFilterId) {
      if (activeTab === 'category') {
        setSelectedCategory(initialFilterId);
        // Parse additional filters from URL query params if present
        if (searchParams.get('country')) setSelectedCountry(searchParams.get('country') || '');
        if (searchParams.get('year')) setSelectedYear(searchParams.get('year') || '');
      }
      else if (activeTab === 'country') {
        setSelectedCountry(initialFilterId);
        // Parse additional filters from URL query params if present
        if (searchParams.get('category')) setSelectedCategory(searchParams.get('category') || '');
        if (searchParams.get('year')) setSelectedYear(searchParams.get('year') || '');
      }
      else if (activeTab === 'year') {
        setSelectedYear(initialFilterId);
        // Parse additional filters from URL query params if present
        if (searchParams.get('category')) setSelectedCategory(searchParams.get('category') || '');
        if (searchParams.get('country')) setSelectedCountry(searchParams.get('country') || '');
      }
    }
  }, [initialFilterId, activeTab, path, slug, searchParams]);
  
  // Fetch filter options
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: fetchCategories
  });
  
  const { data: countries } = useQuery({
    queryKey: ['/api/countries'],
    queryFn: fetchCountries
  });
  
  const { data: years } = useQuery({
    queryKey: ['/api/years'],
    queryFn: fetchYears
  });
  
  // Create filter options based on active tab with memoization to prevent recreating object on each render
  const [sortField, sortType] = useMemo(() => sortOption.split('-'), [sortOption]);
  
  const filterOptions = useMemo(() => {
    const options: FilterOptions = {
      page,
      limit: 24,
      sort_field: sortField,
      sort_type: sortType,
      sort_lang: initialSortLang
    };
    
    // Thêm lọc theo loại phim (bộ/lẻ) nếu có
    if (selectedType) {
      options.type = selectedType;
      console.log('Đang áp dụng bộ lọc loại phim:', selectedType);
    }
    
    // Add secondary filters based on active tab
    if (activeTab === 'category' && selectedCategory) {
      if (selectedCountry && selectedCountry !== 'all') options.country = selectedCountry;
      if (selectedYear && selectedYear !== 'all') options.year = selectedYear;
    } else if (activeTab === 'country' && selectedCountry) {
      if (selectedCategory && selectedCategory !== 'all') options.category = selectedCategory;
      if (selectedYear && selectedYear !== 'all') options.year = selectedYear;
    } else if (activeTab === 'year' && selectedYear) {
      if (selectedCategory && selectedCategory !== 'all') options.category = selectedCategory;
      if (selectedCountry && selectedCountry !== 'all') options.country = selectedCountry;
    }
    
    return options;
  }, [activeTab, page, selectedCategory, selectedCountry, selectedYear, selectedType, sortField, sortType, initialSortLang]);
  
  // Fetch filtered movies based on active tab
  const { data: moviesData, isLoading, error } = useQuery({
    queryKey: [`/api/${activeTab}`, 
      activeTab === 'category' ? selectedCategory : 
      activeTab === 'country' ? selectedCountry : 
      activeTab === 'year' ? selectedYear : '',
      filterOptions
    ],
    queryFn: () => {
      if (activeTab === 'category' && selectedCategory) {
        return fetchCategoryMovies(selectedCategory, filterOptions);
      } else if (activeTab === 'country' && selectedCountry) {
        return fetchCountryMovies(selectedCountry, filterOptions);
      } else if (activeTab === 'year' && selectedYear) {
        return fetchYearMovies(selectedYear, filterOptions);
      }
      // Fallback - fetch categories by default
      return { status: true, items: [], pagination: { current_page: 1, total_pages: 0 } };
    },
    enabled: (
      (activeTab === 'category' && !!selectedCategory) || 
      (activeTab === 'country' && !!selectedCountry) || 
      (activeTab === 'year' && !!selectedYear)
    ),
    staleTime: 5 * 60 * 1000 // Keep data fresh for 5 minutes to reduce API calls
  });
  
  // Helper to update URL when filters change - memoized to prevent recreating on each render
  const updateUrl = useCallback((type: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    
    // Reset page to 1 when filter changes
    params.delete('page');
    
    // Keep sort parameters if they exist
    if (sortField !== 'modified_time') params.set('sort_field', sortField);
    else params.delete('sort_field');
    
    if (sortType !== 'desc') params.set('sort_type', sortType);
    else params.delete('sort_type');
    
    if (initialSortLang) params.set('sort_lang', initialSortLang);
    
    // Create new URL path based on filter type
    let newPath = '';
    if (type === 'category') {
      newPath = value ? `/the-loai/${value}` : '/the-loai';
    } else if (type === 'country') {
      newPath = value ? `/quoc-gia/${value}` : '/quoc-gia';
    } else if (type === 'year') {
      newPath = value ? `/nam/${value}` : '/nam';
    } else {
      newPath = '/filter';
    }
    
    const newUrl = `${newPath}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.pushState({}, '', newUrl);
  }, [sortField, sortType, initialSortLang]);

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    
    // Keep all filters when changing tabs to allow combined filtering
    // Just change the active tab to determine the primary filter
    
    // Update URL with new path format
    let newPath = '';
    let params = new URLSearchParams();
    
    // Set ID parameter based on active tab
    if (value === 'category') {
      // For categories tab
      if (selectedCategory) {
        newPath = `/the-loai/${selectedCategory}`;
        // Add secondary filters as query params
        if (selectedCountry && selectedCountry !== 'all') params.set('country', selectedCountry);
        if (selectedYear && selectedYear !== 'all') params.set('year', selectedYear);
      } else {
        newPath = '/the-loai';
      }
    } else if (value === 'country') {
      // For countries tab
      if (selectedCountry) {
        newPath = `/quoc-gia/${selectedCountry}`;
        // Add secondary filters as query params
        if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
        if (selectedYear && selectedYear !== 'all') params.set('year', selectedYear);
      } else {
        newPath = '/quoc-gia';
      }
    } else if (value === 'year') {
      // For years tab
      if (selectedYear) {
        newPath = `/nam/${selectedYear}`;
        // Add secondary filters as query params
        if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
        if (selectedCountry && selectedCountry !== 'all') params.set('country', selectedCountry);
      } else {
        newPath = '/nam';
      }
    } else {
      newPath = '/filter';
    }
    
    // Reset to page 1 when switching tabs
    setPage(1);
    
    // Add other filter parameters if they exist
    if (sortField !== 'modified_time') params.set('sort_field', sortField);
    if (sortType !== 'desc') params.set('sort_type', sortType);
    if (initialSortLang) params.set('sort_lang', initialSortLang);
    // Add type filter if exists
    if (selectedType) params.set('type', selectedType);
    
    const newUrl = `${newPath}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.pushState({}, '', newUrl);
  }, [selectedCategory, selectedCountry, selectedYear, selectedType, sortField, sortType, initialSortLang]);
  
  // Handle filter selections
  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value);
    // Don't reset other filters to allow combined filtering
    setPage(1);
    
    // Update URL with all active filters
    const params = new URLSearchParams();
    // Add all current filters to URL for persistence
    if (selectedCountry && selectedCountry !== 'all') params.set('country', selectedCountry);
    if (selectedYear && selectedYear !== 'all') params.set('year', selectedYear);
    if (selectedType) params.set('type', selectedType);
    
    // Generate the base path from the active tab and primary filter
    let newPath = '';
    if (activeTab === 'category') {
      newPath = value ? `/the-loai/${value}` : '/the-loai';
    } else if (activeTab === 'country' && selectedCountry) {
      newPath = `/quoc-gia/${selectedCountry}`;
      if (value && value !== 'all') params.set('category', value);
    } else if (activeTab === 'year' && selectedYear) {
      newPath = `/nam/${selectedYear}`;
      if (value && value !== 'all') params.set('category', value);
    }
    
    // Add sort parameters
    if (sortField !== 'modified_time') params.set('sort_field', sortField);
    if (sortType !== 'desc') params.set('sort_type', sortType);
    if (initialSortLang) params.set('sort_lang', initialSortLang);
    
    const newUrl = `${newPath}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.pushState({}, '', newUrl);
  }, [updateUrl, activeTab, selectedCountry, selectedYear, selectedType, sortField, sortType, initialSortLang]);
  
  const handleCountryChange = useCallback((value: string) => {
    setSelectedCountry(value);
    // Don't reset other filters to allow combined filtering
    setPage(1);
    
    // Update URL with all active filters
    const params = new URLSearchParams();
    // Add all current filters to URL for persistence
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedYear && selectedYear !== 'all') params.set('year', selectedYear);
    if (selectedType) params.set('type', selectedType);
    
    // Generate the base path from the active tab and primary filter
    let newPath = '';
    if (activeTab === 'country') {
      newPath = value ? `/quoc-gia/${value}` : '/quoc-gia';
    } else if (activeTab === 'category' && selectedCategory) {
      newPath = `/the-loai/${selectedCategory}`;
      if (value && value !== 'all') params.set('country', value);
    } else if (activeTab === 'year' && selectedYear) {
      newPath = `/nam/${selectedYear}`;
      if (value && value !== 'all') params.set('country', value);
    }
    
    // Add sort parameters
    if (sortField !== 'modified_time') params.set('sort_field', sortField);
    if (sortType !== 'desc') params.set('sort_type', sortType);
    if (initialSortLang) params.set('sort_lang', initialSortLang);
    
    const newUrl = `${newPath}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.pushState({}, '', newUrl);
  }, [updateUrl, activeTab, selectedCategory, selectedYear, selectedType, sortField, sortType, initialSortLang]);
  
  const handleYearChange = useCallback((value: string) => {
    setSelectedYear(value);
    // Don't reset other filters to allow combined filtering
    setPage(1);
    
    // Update URL with all active filters
    const params = new URLSearchParams();
    // Add all current filters to URL for persistence
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedCountry && selectedCountry !== 'all') params.set('country', selectedCountry);
    if (selectedType) params.set('type', selectedType);
    
    // Generate the base path from the active tab and primary filter
    let newPath = '';
    if (activeTab === 'year') {
      newPath = value ? `/nam/${value}` : '/nam';
    } else if (activeTab === 'category' && selectedCategory) {
      newPath = `/the-loai/${selectedCategory}`;
      if (value && value !== 'all') params.set('year', value);
    } else if (activeTab === 'country' && selectedCountry) {
      newPath = `/quoc-gia/${selectedCountry}`;
      if (value && value !== 'all') params.set('year', value);
    }
    
    // Add sort parameters
    if (sortField !== 'modified_time') params.set('sort_field', sortField);
    if (sortType !== 'desc') params.set('sort_type', sortType);
    if (initialSortLang) params.set('sort_lang', initialSortLang);
    
    const newUrl = `${newPath}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.pushState({}, '', newUrl);
  }, [updateUrl, activeTab, selectedCategory, selectedCountry, selectedType, sortField, sortType, initialSortLang]);
  
  // Xử lý khi chọn loại phim: bộ hoặc lẻ
  const handleTypeChange = useCallback((value: string) => {
    // Nếu là 'all', đặt giá trị rỗng để không lọc theo loại phim
    const typeValue = value === 'all' ? '' : value;
    setSelectedType(typeValue);
    setPage(1);
    
    // Update URL with type parameter
    const params = new URLSearchParams(window.location.search);
    if (typeValue) params.set('type', typeValue);
    else params.delete('type');
    
    // Giữ các tham số khác
    if (sortField !== 'modified_time') params.set('sort_field', sortField);
    else params.delete('sort_field');
    
    if (sortType !== 'desc') params.set('sort_type', sortType);
    else params.delete('sort_type');
    
    if (initialSortLang) params.set('sort_lang', initialSortLang);
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
  }, [sortField, sortType, initialSortLang]);
  
  const handleSortChange = useCallback((value: string) => {
    setSortOption(value);
    setPage(1);
    const [field, type] = value.split('-');
    
    // Update URL with sort parameters
    const params = new URLSearchParams(window.location.search);
    if (field !== 'modified_time') params.set('sort_field', field);
    else params.delete('sort_field');
    
    if (type !== 'desc') params.set('sort_type', type);
    else params.delete('sort_type');
    
    if (initialSortLang) params.set('sort_lang', initialSortLang);
    
    // Duy trì tham số type nếu đã được chọn
    if (selectedType) params.set('type', selectedType);
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
  }, [initialSortLang, selectedType]);
  
  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    
    // Update URL with page parameter
    const params = new URLSearchParams(window.location.search);
    if (newPage > 1) params.set('page', newPage.toString());
    else params.delete('page');
    
    // Preserve other query parameters
    if (sortField !== 'modified_time') params.set('sort_field', sortField);
    if (sortType !== 'desc') params.set('sort_type', sortType);
    if (initialSortLang) params.set('sort_lang', initialSortLang);
    if (selectedType) params.set('type', selectedType);
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
    
    // Tránh animation scroll cho thiết bị yếu
    if (reduceMotion) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [sortField, sortType, initialSortLang, selectedType, reduceMotion]);
  
  // Get current filter name for display
  const currentFilterName = useMemo(() => {
    // Create array to collect all active filter parts
    const filterParts = [];
    
    // Add primary filter based on active tab
    if (activeTab === 'category' && selectedCategory && categories) {
      const category = categories.find((c: FilterItem) => 
        c.id === selectedCategory || c._id === selectedCategory
      );
      if (category) filterParts.push(category.name);
    } else if (activeTab === 'country' && selectedCountry && countries) {
      const country = countries.find((c: FilterItem) => 
        c._id === selectedCountry || c.id === selectedCountry
      );
      if (country) filterParts.push(country.name);
    } else if (activeTab === 'year' && selectedYear) {
      filterParts.push(`Phim năm ${selectedYear}`);
    }
    
    // Add secondary filters
    if (activeTab !== 'country' && selectedCountry && selectedCountry !== 'all' && countries) {
      const country = countries.find((c: FilterItem) => 
        c._id === selectedCountry || c.id === selectedCountry
      );
      if (country) filterParts.push(`Quốc gia: ${country.name}`);
    }
    
    if (activeTab !== 'category' && selectedCategory && selectedCategory !== 'all' && categories) {
      const category = categories.find((c: FilterItem) => 
        c.id === selectedCategory || c._id === selectedCategory
      );
      if (category) filterParts.push(`Thể loại: ${category.name}`);
    }
    
    if (activeTab !== 'year' && selectedYear && selectedYear !== 'all') {
      filterParts.push(`Năm: ${selectedYear}`);
    }
    
    // Thêm type vào filter parts
    if (selectedType === 'series') {
      filterParts.push('Phim bộ');
    } else if (selectedType === 'single') {
      filterParts.push('Phim lẻ');
    }
    
    // Return combined filter name or default
    return filterParts.length > 0 ? filterParts.join(' | ') : 'Lọc phim';
  }, [activeTab, selectedCategory, selectedCountry, selectedYear, selectedType, categories, countries]);
  
  // Kiểm tra thiết bị có yêu cầu giảm chuyển động không
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLowEndDevice = /Android 5|Android 6|Android 7|iPhone OS [789]/.test(navigator.userAgent);
    
    if (prefersReducedMotion || isLowEndDevice) {
      setReduceMotion(true);
    }
  }, []);
  
  // Update title to display current filter name
  useEffect(() => {
    // Thêm type vào filter name nếu có
    let title = currentFilterName;
    if (selectedType === 'series') {
      title = `${title} | Phim bộ`;
    } else if (selectedType === 'single') {
      title = `${title} | Phim lẻ`;
    }
    document.title = `${title} | PXD`;
  }, [currentFilterName, selectedType]);
  
  // Get current active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeTab === 'category') {
      if (selectedCountry && selectedCountry !== 'all') count++;
      if (selectedYear && selectedYear !== 'all') count++;
    } else if (activeTab === 'country') {
      if (selectedCategory && selectedCategory !== 'all') count++;
      if (selectedYear && selectedYear !== 'all') count++;
    } else if (activeTab === 'year') {
      if (selectedCategory && selectedCategory !== 'all') count++;
      if (selectedCountry && selectedCountry !== 'all') count++;
    }
    // Thêm điều kiện loại phim
    if (selectedType) count++;
    return count;
  }, [activeTab, selectedCategory, selectedCountry, selectedYear, selectedType]);
  
  return (
    <div className="py-6 px-4 md:px-8 lg:px-12 xl:px-16">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-6 relative">
          {/* Background decoration */}
          <div className="absolute -z-10 top-0 left-1/2 transform -translate-x-1/2 w-full max-w-3xl h-20 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 blur-3xl opacity-50 rounded-full"></div>
          
          {/* Page title with current filter */}
          <h1 className="text-2xl md:text-4xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary">
            {currentFilterName}
          </h1>
          
          {/* Filter tabs */}
          <div className="filter-container max-w-3xl mx-auto mb-4">
            <Tabs 
              defaultValue={activeTab} 
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 w-full bg-card/40 backdrop-blur-sm rounded-xl p-1">
                <TabsTrigger 
                  value="category" 
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Film className="h-4 w-4 mr-2" />
                  Thể loại
                </TabsTrigger>
                <TabsTrigger 
                  value="country" 
                  className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Quốc gia
                </TabsTrigger>
                <TabsTrigger 
                  value="year" 
                  className="rounded-lg data-[state=active]:bg-green-500 data-[state=active]:text-white"
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Năm
                </TabsTrigger>
              </TabsList>
              
              <div className="py-4">
                <TabsContent value="category" className="mt-0">
                  <Card className="glass-card border-muted/30">
                    <CardHeader className="pb-3">
                      <CardTitle>Chọn thể loại phim</CardTitle>
                      <CardDescription>
                        Lọc phim theo thể loại yêu thích
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Select
                            value={selectedCategory}
                            onValueChange={handleCategoryChange}
                          >
                            <SelectTrigger className="bg-background/40 border-muted">
                              <SelectValue placeholder="Chọn thể loại" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories && categories.length > 0 ? (
                                categories.map((category: FilterItem) => (
                                  <SelectItem 
                                    key={category.id || category._id || "key-" + Math.random()} 
                                    value={category.slug || category.id || category._id || "unknown"}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading">Đang tải...</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Select
                            value={selectedCountry}
                            onValueChange={handleCountryChange}
                          >
                            <SelectTrigger className="bg-background/40 border-muted">
                              <SelectValue placeholder="Quốc gia (tùy chọn)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tất cả quốc gia</SelectItem>
                              {countries && countries.length > 0 ? (
                                countries.map((country: FilterItem) => (
                                  <SelectItem 
                                    key={country.id || country._id || "key-" + Math.random()} 
                                    value={country.slug || country.id || country._id || "unknown"}
                                  >
                                    {country.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading">Đang tải...</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Select
                            value={selectedYear}
                            onValueChange={handleYearChange}
                          >
                            <SelectTrigger className="bg-background/40 border-muted">
                              <SelectValue placeholder="Năm (tùy chọn)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tất cả các năm</SelectItem>
                              {years && years.length > 0 ? (
                                years.map((year: FilterItem) => (
                                  <SelectItem 
                                    key={year.id || "key-" + Math.random()} 
                                    value={year.id || "unknown"}
                                  >
                                    {year.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading">Đang tải...</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="country" className="mt-0">
                  <Card className="glass-card border-muted/30">
                    <CardHeader className="pb-3">
                      <CardTitle>Chọn quốc gia</CardTitle>
                      <CardDescription>
                        Lọc phim theo quốc gia sản xuất
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Select
                            value={selectedCountry}
                            onValueChange={handleCountryChange}
                          >
                            <SelectTrigger className="bg-background/40 border-muted">
                              <SelectValue placeholder="Chọn quốc gia" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries && countries.length > 0 ? (
                                countries.map((country: FilterItem) => (
                                  <SelectItem 
                                    key={country.id || country._id || "key-" + Math.random()} 
                                    value={country.slug || country.id || country._id || "unknown"}
                                  >
                                    {country.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading">Đang tải...</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Select
                            value={selectedCategory}
                            onValueChange={handleCategoryChange}
                          >
                            <SelectTrigger className="bg-background/40 border-muted">
                              <SelectValue placeholder="Thể loại (tùy chọn)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tất cả thể loại</SelectItem>
                              {categories && categories.length > 0 ? (
                                categories.map((category: FilterItem) => (
                                  <SelectItem 
                                    key={category.id || category._id || "key-" + Math.random()} 
                                    value={category.slug || category.id || category._id || "unknown"}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading">Đang tải...</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Select
                            value={selectedYear}
                            onValueChange={handleYearChange}
                          >
                            <SelectTrigger className="bg-background/40 border-muted">
                              <SelectValue placeholder="Năm (tùy chọn)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tất cả các năm</SelectItem>
                              {years && years.length > 0 ? (
                                years.map((year: FilterItem) => (
                                  <SelectItem 
                                    key={year.id || "key-" + Math.random()} 
                                    value={year.id || "unknown"}
                                  >
                                    {year.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading">Đang tải...</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="year" className="mt-0">
                  <Card className="glass-card border-muted/30">
                    <CardHeader className="pb-3">
                      <CardTitle>Chọn năm phát hành</CardTitle>
                      <CardDescription>
                        Lọc phim theo năm sản xuất
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Select
                            value={selectedYear}
                            onValueChange={handleYearChange}
                          >
                            <SelectTrigger className="bg-background/40 border-muted">
                              <SelectValue placeholder="Chọn năm" />
                            </SelectTrigger>
                            <SelectContent>
                              {years && years.length > 0 ? (
                                years.map((year: FilterItem) => (
                                  <SelectItem 
                                    key={year.id || "key-" + Math.random()} 
                                    value={year.id || "unknown"}
                                  >
                                    {year.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading">Đang tải...</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Select
                            value={selectedCategory}
                            onValueChange={handleCategoryChange}
                          >
                            <SelectTrigger className="bg-background/40 border-muted">
                              <SelectValue placeholder="Thể loại (tùy chọn)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tất cả thể loại</SelectItem>
                              {categories && categories.length > 0 ? (
                                categories.map((category: FilterItem) => (
                                  <SelectItem 
                                    key={category.id || category._id || "key-" + Math.random()} 
                                    value={category.slug || category.id || category._id || "unknown"}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading">Đang tải...</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Select
                            value={selectedCountry}
                            onValueChange={handleCountryChange}
                          >
                            <SelectTrigger className="bg-background/40 border-muted">
                              <SelectValue placeholder="Quốc gia (tùy chọn)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tất cả quốc gia</SelectItem>
                              {countries && countries.length > 0 ? (
                                countries.map((country: FilterItem) => (
                                  <SelectItem 
                                    key={country.id || country._id || "key-" + Math.random()} 
                                    value={country.slug || country.id || country._id || "unknown"}
                                  >
                                    {country.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading">Đang tải...</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
          
          {/* Sort options & active filters */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center max-w-3xl mx-auto mb-4 gap-2">
            <div className="flex-1 flex flex-wrap gap-2 items-center">
              {/* Bộ lọc loại phim */}
              <Select
                value={selectedType}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger className="bg-background/40 border-muted w-auto">
                  <SelectValue placeholder="Tất cả phim" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phim</SelectItem>
                  <SelectItem value="series">Phim bộ</SelectItem>
                  <SelectItem value="single">Phim lẻ</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Sắp xếp */}
              <Select
                value={sortOption}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="bg-background/40 border-muted w-auto">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modified_time-desc">Mới cập nhật</SelectItem>
                  <SelectItem value="year-desc">Năm (mới nhất)</SelectItem>
                  <SelectItem value="year-asc">Năm (cũ nhất)</SelectItem>
                  <SelectItem value="view_total-desc">Lượt xem (cao nhất)</SelectItem>
                  <SelectItem value="name-asc">A-Z</SelectItem>
                  <SelectItem value="name-desc">Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Show applied filters */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                {/* Hiển thị loại phim đã chọn (phim bộ/phim lẻ) */}
                {selectedType && (
                  <Badge variant="outline" className="glass-card">
                    {selectedType === 'series' ? 'Phim bộ' : selectedType === 'single' ? 'Phim lẻ' : selectedType}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 ml-1"
                      onClick={() => handleTypeChange('all')}
                    >
                      <FilterX className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}

                {activeTab === 'category' && selectedCountry && selectedCountry !== 'all' && countries && (
                  <Badge variant="outline" className="glass-card">
                    {countries.find((c: FilterItem) => 
                      c.id === selectedCountry || c._id === selectedCountry
                    )?.name || selectedCountry}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 ml-1"
                      onClick={() => handleCountryChange('all')}
                    >
                      <FilterX className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                
                {activeTab === 'category' && selectedYear && selectedYear !== 'all' && (
                  <Badge variant="outline" className="glass-card">
                    Năm {selectedYear}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 ml-1"
                      onClick={() => handleYearChange('all')}
                    >
                      <FilterX className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                
                {activeTab === 'country' && selectedCategory && selectedCategory !== 'all' && categories && (
                  <Badge variant="outline" className="glass-card">
                    {categories.find((c: FilterItem) => 
                      c.id === selectedCategory || c._id === selectedCategory
                    )?.name || selectedCategory}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 ml-1"
                      onClick={() => handleCategoryChange('all')}
                    >
                      <FilterX className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                
                {activeTab === 'country' && selectedYear && selectedYear !== 'all' && (
                  <Badge variant="outline" className="glass-card">
                    Năm {selectedYear}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 ml-1"
                      onClick={() => handleYearChange('all')}
                    >
                      <FilterX className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                
                {activeTab === 'year' && selectedCategory && selectedCategory !== 'all' && categories && (
                  <Badge variant="outline" className="glass-card">
                    {categories.find((c: FilterItem) => 
                      c.id === selectedCategory || c._id === selectedCategory
                    )?.name || selectedCategory}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 ml-1"
                      onClick={() => handleCategoryChange('all')}
                    >
                      <FilterX className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                
                {activeTab === 'year' && selectedCountry && selectedCountry !== 'all' && countries && (
                  <Badge variant="outline" className="glass-card">
                    {countries.find((c: FilterItem) => 
                      c.id === selectedCountry || c._id === selectedCountry
                    )?.name || selectedCountry}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 ml-1"
                      onClick={() => handleCountryChange('all')}
                    >
                      <FilterX className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs glow-effect"
                  onClick={() => {
                    // Xóa bộ lọc loại phim
                    handleTypeChange('all');
                    
                    if (activeTab === 'category') {
                      handleCountryChange('all');
                      handleYearChange('all');
                    } else if (activeTab === 'country') {
                      handleCategoryChange('all');
                      handleYearChange('all');
                    } else if (activeTab === 'year') {
                      handleCategoryChange('all');
                      handleCountryChange('all');
                    }
                  }}
                >
                  <Filter className="h-3 w-3 mr-1" />
                  Xóa bộ lọc
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Movies grid */}
        <div className="fade-in-up">
          {isLoading ? (
            <div className="py-4">
              <MovieGridSkeleton count={12} />
            </div>
          ) : error ? (
            <div className="text-center py-12 glass-card p-8 rounded-xl">
              <p className="text-destructive mb-2">Có lỗi xảy ra khi tải dữ liệu phim.</p>
              <p className="text-muted-foreground text-sm mb-4">Vui lòng thử lại sau hoặc kiểm tra kết nối mạng của bạn.</p>
              <Button
                variant="outline"
                className="glow-effect"
                onClick={() => window.location.reload()}
              >
                Thử lại
              </Button>
            </div>
          ) : moviesData && moviesData.items && moviesData.items.length > 0 ? (
            <>
              <MovieGrid movies={moviesData.items} />
              
              {/* Pagination */}
              {moviesData.pagination && moviesData.pagination.total_pages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={parseInt(String(moviesData.pagination.current_page))}
                    totalPages={parseInt(String(moviesData.pagination.total_pages))}
                    basePath={window.location.pathname}
                    showPageJump={!reduceMotion}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 glass-card p-8 rounded-xl max-w-lg mx-auto">
              <div className="mb-4">
                <svg className="w-12 h-12 mx-auto text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 13a1 1 0 100-2 1 1 0 000 2z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Không tìm thấy phim nào</h3>
              <p className="text-muted-foreground mb-4">Không có phim nào phù hợp với bộ lọc bạn đã chọn. Vui lòng thử với các bộ lọc khác.</p>
              <Button
                variant="outline"
                className="glow-effect"
                onClick={() => {
                  // Xóa cả bộ lọc loại phim 
                  handleTypeChange('all');
                  
                  if (activeTab === 'category') {
                    handleCountryChange('all');
                    handleYearChange('all');
                  } else if (activeTab === 'country') {
                    handleCategoryChange('all');
                    handleYearChange('all');
                  } else if (activeTab === 'year') {
                    handleCategoryChange('all');
                    handleCountryChange('all');
                  }
                }}
              >
                <FilterX className="h-4 w-4 mr-2" />
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
