import { useEffect } from 'react';
import { useQuery, QueryKey, useQueryClient } from '@tanstack/react-query';

/**
 * Hook để tải trước (prefetch) dữ liệu cho các trang dự kiến sẽ được truy cập tiếp theo
 * Giúp cải thiện UX bằng cách giảm thời gian chờ khi chuyển trang
 * 
 * @param queryKeys Mảng chứa các query key cần tải trước
 * @param options Tùy chọn bổ sung
 */
export function usePrefetchData(
  queryKeys: QueryKey[],
  options?: {
    staleTime?: number;
    onSuccess?: () => void;
  }
) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Tải trước tất cả các query key được cung cấp
    for (const queryKey of queryKeys) {
      queryClient.prefetchQuery({
        queryKey,
        staleTime: options?.staleTime || 30 * 1000, // Mặc định 30 giây
      });
    }
    
    if (options?.onSuccess) {
      options.onSuccess();
    }
  }, [queryKeys, queryClient, options]);
}

/**
 * Hook tải dữ liệu tối ưu với khả năng caching và tái sử dụng
 * Bao gồm xử lý cho các trạng thái tải, lỗi, và thành công
 * 
 * @param queryKey Khóa query
 * @param fetchFn Hàm fetch dữ liệu
 * @param options Tùy chọn bổ sung
 */
export function useOptimizedQuery<TData>(
  queryKey: QueryKey,
  fetchFn: () => Promise<TData>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    retry?: number | boolean;
  }
) {
  return useQuery({
    queryKey,
    queryFn: fetchFn,
    staleTime: options?.staleTime || 5 * 60 * 1000, // Mặc định 5 phút - tăng thời gian cache
    gcTime: options?.cacheTime || 10 * 60 * 1000, // Mặc định 10 phút
    retry: options?.retry ?? 1, // Mặc định retry 1 lần
    enabled: options?.enabled !== undefined ? options.enabled : true,
    refetchOnWindowFocus: false, // Tắt refetch khi focus lại cửa sổ để tăng hiệu suất
  });
}