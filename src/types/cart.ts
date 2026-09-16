import { Product } from './product';

export type CartData = Record<string, Record<string, number>>; // { [itemId]: { [size]: quantity } }

export interface CartItem {
  _id: string;
  itemId: string;
  size: string;
  quantity: number;
  product?: Product;
}

export interface CartCalculationItem {
  _id: string;
  name: string;
  originalPrice: number;
  price: number;
  quantity: number;
  size: string;
}

export interface CouponApplied {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue: number;
}

export interface CartCalculationResult {
  baseTotal: number;
  discountAmount: number;
  subtotal: number;
  couponDiscount: number;
  finalTotal: number;
  finalItems: CartCalculationItem[];
  couponApplied: CouponApplied | null;
  couponError: string | null;
  stockError: string | null;
}
