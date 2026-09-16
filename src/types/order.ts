import { Address } from './auth';

export interface OrderItem {
  _id: string;
  name: string;
  originalPrice?: number;
  price: number;
  quantity: number;
  size: string;
  image?: string[];
}

export type PaymentMethod = 'COD' | 'Stripe' | 'Razorpay';
export type OrderStatus = 'Order Placed' | 'Packing' | 'Shipped' | 'Out for delivery' | 'Delivered';

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  amount: number;
  address: Address;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  payment: boolean;
  date: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlaceOrderPayload {
  items: {
    _id?: string;
    itemId?: string;
    size: string;
    quantity: number;
  }[];
  address: Address;
  couponCode?: string;
}
