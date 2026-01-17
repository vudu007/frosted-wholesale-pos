import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  sku: string;
  group?: string;
}

export interface CartItem extends Product {
  qty: number;
}

interface GuestCartStore {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  totalQuantity: () => number;
}

export const useGuestCartStore = create<GuestCartStore>((set, get) => ({
  cart: [],
  
  addToCart: (product) => {
    set((state) => {
      const existing = state.cart.find((item) => item.id === product.id);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.id === product.id ? { ...item, qty: item.qty + 1 } : item
          ),
        };
      }
      return { cart: [...state.cart, { ...product, qty: 1 }] };
    });
  },
  
  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== productId),
    }));
  },
  
  updateCartItemQuantity: (productId, qty) => {
    if (qty <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === productId ? { ...item, qty } : item
      ),
    }));
  },
  
  clearCart: () => set({ cart: [] }),
  
  subtotal: () => {
    return get().cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
  },
  
  totalQuantity: () => {
    return get().cart.reduce((sum, item) => sum + item.qty, 0);
  },
}));
