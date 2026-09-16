import { apiClient } from './client';
import { Product } from '../../types/product';
import { userService } from './userService';
import { productService } from './productService';

export const wishlistService = {
  /**
   * Toggle a product ID in user's wishlist
   */
  async toggleWishlist(productId: string): Promise<string[]> {
    return userService.toggleWishlist(productId);
  },

  /**
   * Fetch full product details for all items in the user's wishlist
   */
  async getWishlistProducts(): Promise<Product[]> {
    const profile = await userService.getProfile();
    const productIds = profile.wishlist || [];
    if (productIds.length === 0) return [];

    return productService.getMultipleProducts(productIds);
  },
};

export default wishlistService;
