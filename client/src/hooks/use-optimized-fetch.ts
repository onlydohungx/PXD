import { useQuery, UseQueryOptions, QueryKey, useQueryClient } from '@tanstack/react-query';

/**
 * Hook tối ưu hóa cho fetch data với caching thông minh
 * Giúp tăng tốc độ tải trang và giảm lượng request mạng
 * 
 * @param queryKey Khóa query để lưu cache
 * @param fetchFn Hàm fetch dữ liệu
 * @param options Các tùy chọn cho query
 */
export function useOptimizedFetch<TData = unknown, TError = unknown>(
  queryKey: QueryKey,
  fetchFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn: fetchFn,
    staleTime: 5 * 60 * 1000, // Cache stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000,   // Cache remains in memory for 10 minutes
    retry: 1,                 // Only retry once
    refetchOnWindowFocus: false,
    ...options
  });
}

/**
 * Hook tải trước dữ liệu để cải thiện trải nghiệm người dùng
 * Tải dữ liệu trước khi người dùng điều hướng đến trang mới
 * 
 * @param queryKey Khóa query cần tải trước
 * @param fetchFn Hàm fetch dữ liệu
 */
export function usePrefetch<TData = unknown>(
  queryKey: QueryKey,
  fetchFn: () => Promise<TData>
) {
  const queryClient = useQueryClient();
  
  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn: fetchFn,
      staleTime: 2 * 60 * 1000, // Cache từ prefetch tồn tại 2 phút
    });
  };
  
  return prefetch;
}