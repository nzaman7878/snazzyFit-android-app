import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/api/productService';
import { ProductListParams } from '../types/product';

export const PRODUCT_QUERY_KEYS = {
  all: ['products'] as const,
  list: (params?: ProductListParams) => ['products', 'list', params] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
  suggestions: (query: string) => ['products', 'suggestions', query] as const,
  categories: ['categories'] as const,
  discounts: ['discounts', 'active'] as const,
};

export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.list(params),
    queryFn: () => productService.getProducts(params),
    staleTime: 1000 * 60 * 3, // 3 minutes cache
  });
}

export function useProductDetail(productId: string) {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.detail(productId),
    queryFn: () => productService.getProductById(productId),
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.categories,
    queryFn: () => productService.getCategories(),
    staleTime: 1000 * 60 * 15, // 15 minutes cache
  });
}

export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.suggestions(query),
    queryFn: () => productService.getSearchSuggestions(query),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useActiveDiscounts() {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.discounts,
    queryFn: () => productService.getActiveDiscounts(),
    staleTime: 1000 * 60 * 10,
  });
}
