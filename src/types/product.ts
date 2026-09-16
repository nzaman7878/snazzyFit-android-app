export type ProductCategory = 'Men' | 'Women' | 'Kids';
export type ProductSubCategory = 'Topwear' | 'Bottomwear' | 'Winterwear';
export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

export interface DiscountInfo {
  type: 'percentage' | 'fixed';
  value: number;
  amountSaved: number;
  percentageSaved: number;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountInfo?: DiscountInfo;
  image: string[];
  category: ProductCategory;
  subCategory: ProductSubCategory;
  sizes: ProductSize[];
  stockQuantities: Record<string, number>;
  bestseller: boolean;
  outOfStock: boolean;
  date?: string | number;
  averageRating?: number;
  totalReviews?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryItem {
  _id: string;
  name: string;
  type: 'category' | 'subCategory';
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  subCategory?: string;
  sortType?: 'low - high' | 'high - low';
  bestseller?: boolean;
}

export interface ProductListResponse {
  success: boolean;
  message?: string;
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    limit: number;
  };
}
