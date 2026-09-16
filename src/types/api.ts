export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  limit: number;
}
