import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  PropsWithChildren,
} from 'react';
import { CartData, CartItem } from '../types/cart';
import { Product } from '../types/product';
import { cartService } from '../services/api/cartService';
import { productService } from '../services/api/productService';
import { useAuth } from './AuthContext';

interface CartContextType {
  cartData: CartData;
  cartItems: CartItem[];
  cartCount: number;
  subtotal: number;
  isLoading: boolean;
  addToCart: (itemId: string, size: string) => Promise<void>;
  updateQuantity: (itemId: string, size: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string, size: string) => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, user } = useAuth();

  const [cartData, setCartData] = useState<CartData>({});
  const [productMap, setProductMap] = useState<Record<string, Product>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync cart from backend when user logs in or profile changes
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartData({});
      return;
    }

    setIsLoading(true);
    try {
      const serverCart = await cartService.getCart();
      setCartData(serverCart);

      // Collect all unique item IDs to bulk fetch full product details
      const itemIds = Object.keys(serverCart).filter((id) => {
        const sizes = serverCart[id] || {};
        return Object.values(sizes).some((qty) => qty > 0);
      });

      if (itemIds.length > 0) {
        const products = await productService.getMultipleProducts(itemIds);
        const map: Record<string, Product> = {};
        products.forEach((p) => {
          map[p._id] = p;
        });
        setProductMap(map);
      }
    } catch (err) {
      console.warn('Error fetching server cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (itemId: string, size: string) => {
    // Optimistic local update
    setCartData((prev) => {
      const updated = { ...prev };
      if (!updated[itemId]) updated[itemId] = {};
      updated[itemId][size] = (updated[itemId][size] || 0) + 1;
      return updated;
    });

    // If product details not already in map, fetch single product
    if (!productMap[itemId]) {
      try {
        const p = await productService.getProductById(itemId);
        setProductMap((prev) => ({ ...prev, [itemId]: p }));
      } catch (err) {
        console.warn('Could not fetch added product details:', err);
      }
    }

    if (isAuthenticated) {
      try {
        await cartService.addToCart(itemId, size);
      } catch (err) {
        console.error('Failed to sync addToCart with backend:', err);
        // Fallback refresh
        refreshCart();
      }
    }
  };

  const updateQuantity = async (itemId: string, size: string, quantity: number) => {
    setCartData((prev) => {
      const updated = { ...prev };
      if (!updated[itemId]) updated[itemId] = {};
      if (quantity <= 0) {
        delete updated[itemId][size];
        if (Object.keys(updated[itemId]).length === 0) {
          delete updated[itemId];
        }
      } else {
        updated[itemId][size] = quantity;
      }
      return updated;
    });

    if (isAuthenticated) {
      try {
        await cartService.updateCart(itemId, size, quantity);
      } catch (err) {
        console.error('Failed to sync updateCart with backend:', err);
        refreshCart();
      }
    }
  };

  const removeFromCart = async (itemId: string, size: string) => {
    await updateQuantity(itemId, size, 0);
  };

  const clearCart = () => {
    setCartData({});
  };

  // Convert nested cartData { [itemId]: { [size]: qty } } into a flat array of CartItems
  const cartItems: CartItem[] = [];
  let cartCount = 0;
  let subtotal = 0;

  Object.keys(cartData).forEach((itemId) => {
    const sizes = cartData[itemId] || {};
    Object.keys(sizes).forEach((size) => {
      const quantity = sizes[size];
      if (quantity > 0) {
        const product = productMap[itemId];
        cartCount += quantity;
        if (product) {
          subtotal += product.price * quantity;
        }
        cartItems.push({
          _id: `${itemId}_${size}`,
          itemId,
          size,
          quantity,
          product,
        });
      }
    });
  });

  return (
    <CartContext.Provider
      value={{
        cartData,
        cartItems,
        cartCount,
        subtotal,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
