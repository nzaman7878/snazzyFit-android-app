import { apiClient } from './client';
import {
  CategoryItem,
  Product,
  ProductListParams,
  ProductListResponse,
} from '../../types/product';

export const productService = {
  /**
   * Fetch paginated list of products with optional filters:
   * search, category, subCategory, sortType, bestseller
   */
  async getProducts(params?: ProductListParams): Promise<ProductListResponse> {
    const queryParams: Record<string, any> = {};

    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.search) queryParams.search = params.search;
    if (params?.category) queryParams.category = params.category;
    if (params?.subCategory) queryParams.subCategory = params.subCategory;
    if (params?.sortType) queryParams.sortType = params.sortType;
    if (params?.bestseller !== undefined) queryParams.bestseller = params.bestseller;

    const response = await apiClient.get<ProductListResponse>('/product/list', {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Fetch single product by ID with calculated active discounts
   */
  async getProductById(productId: string): Promise<Product> {
    const response = await apiClient.get<{ success: boolean; product: Product }>(
      '/product/single',
      {
        params: { productId },
      }
    );
    return response.data.product;
  },

  /**
   * Fetch multiple products by ID array (used by cart and order summaries)
   */
  async getMultipleProducts(ids: string[]): Promise<Product[]> {
    const response = await apiClient.post<{ success: boolean; products: Product[] }>(
      '/product/multiple',
      { ids }
    );
    return response.data.products;
  },

  /**
   * Search suggestions for fast auto-complete
   */
  async getSearchSuggestions(query: string): Promise<Product[]> {
    if (!query || query.trim().length === 0) return [];
    const response = await apiClient.get<{ success: boolean; suggestions: Product[] }>(
      '/product/search-suggestions',
      {
        params: { query: query.trim() },
      }
    );
    return response.data.suggestions || [];
  },

  /**
   * Fetch categories and subcategories
   */
  async getCategories(): Promise<CategoryItem[]> {
    const response = await apiClient.get<{ success: boolean; categories: CategoryItem[] }>(
      '/category/list'
    );
    return response.data.categories || [];
  },

  /**
   * Fetch active promotions/discounts
   */
  async getActiveDiscounts(): Promise<any[]> {
    const response = await apiClient.get<{ success: boolean; discounts: any[] }>(
      '/discounts/active'
    );
    return response.data.discounts || [];
  },
};

export default productService;
