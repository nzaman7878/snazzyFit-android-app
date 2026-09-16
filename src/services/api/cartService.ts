import { apiClient } from './client';
import { CartCalculationResult, CartData } from '../../types/cart';

export const cartService = {
  /**
   * Fetch authenticated user's cartData dictionary:
   * { [itemId]: { [size]: quantity } }
   */
  async getCart(): Promise<CartData> {
    const response = await apiClient.post<{ success: boolean; cartData: CartData }>(
      '/cart/get'
    );
    return response.data.cartData || {};
  },

  /**
   * Add 1 item of a given size to the user's cart
   */
  async addToCart(itemId: string, size: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>('/cart/add', {
      itemId,
      size,
    });
    return response.data;
  },

  /**
   * Update quantity of an item size (quantity = 0 removes it)
   */
  async updateCart(
    itemId: string,
    size: string,
    quantity: number
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>('/cart/update', {
      itemId,
      size,
      quantity,
    });
    return response.data;
  },

  /**
   * Calculate live cart totals, discounts, inventory validation, and coupon application
   */
  async calculateCart(
    items: { _id?: string; itemId?: string; size: string; quantity: number }[],
    couponCode?: string
  ): Promise<CartCalculationResult> {
    const response = await apiClient.post<{
      success: boolean;
      calculation: CartCalculationResult;
    }>('/cart/calculate', {
      items,
      couponCode,
    });
    return response.data.calculation;
  },
};

export default cartService;
