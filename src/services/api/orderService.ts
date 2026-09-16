import { apiClient } from './client';
import { Order, PlaceOrderPayload } from '../../types/order';

export const orderService = {
  /**
   * Place an order using Cash On Delivery (COD)
   */
  async placeOrderCOD(payload: PlaceOrderPayload): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/order/place',
      payload
    );
    return response.data;
  },

  /**
   * Initialize a Razorpay order
   */
  async placeOrderRazorpay(payload: PlaceOrderPayload): Promise<{ success: boolean; order: any }> {
    const response = await apiClient.post<{ success: boolean; order: any }>(
      '/order/razorpay',
      payload
    );
    return response.data;
  },

  /**
   * Verify Razorpay payment signature
   */
  async verifyRazorpay(verificationData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/order/verifyRazorpay',
      verificationData
    );
    return response.data;
  },

  /**
   * Fetch order history for the authenticated user
   */
  async getUserOrders(): Promise<Order[]> {
    const response = await apiClient.post<{ success: boolean; orders: Order[] }>(
      '/order/userorders'
    );
    return response.data.orders || [];
  },
};

export default orderService;
