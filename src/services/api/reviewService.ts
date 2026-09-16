import { apiClient } from './client';
import { Review, ReviewStats } from '../../types/review';

export interface ProductReviewsResponse {
  success: boolean;
  reviews: Review[];
  stats?: ReviewStats;
}

export const reviewService = {
  /**
   * Fetch all reviews and statistics for a given product ID
   */
  async getProductReviews(productId: string): Promise<ProductReviewsResponse> {
    const response = await apiClient.get<ProductReviewsResponse>(
      `/reviews/product/${productId}`
    );
    return response.data;
  },

  /**
   * Check if the authenticated user has purchased and can review this product
   */
  async checkCanReview(productId: string): Promise<boolean> {
    const response = await apiClient.post<{ success: boolean; canReview: boolean }>(
      '/reviews/can-review',
      { productId }
    );
    return !!response.data.canReview;
  },

  /**
   * Submit a new review for a product
   */
  async addReview(
    productId: string,
    rating: number,
    reviewText: string
  ): Promise<{ success: boolean; review: Review }> {
    const response = await apiClient.post<{ success: boolean; review: Review }>(
      '/reviews/add',
      {
        productId,
        rating,
        reviewText,
      }
    );
    return response.data;
  },
};

export default reviewService;
