import { create } from 'zustand';

// Types
export type Product = {
  id: string;
  name: string;
  price: number;
  sku: string;
  barcode?: string;
  stock?: number;
  inventory?: { stock: number }[];
};
export type CartItem = Product & { qty: number };

export const TAX_RATE = 0.075;

interface CartState {
  cart: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  // Financial functions
  subtotal: () => number;
  tax: () => number;
  grandTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  addToCart: (product, qty = 1) => set((state) => {
    const exists = state.cart.find((item) => item.id === product.id);
    if (exists) {
      return { cart: state.cart.map((item) => item.id === product.id ? { ...item, qty: item.qty + qty } : item) };
    }
    return { cart: [...state.cart, { ...product, qty }] };
  }),
  removeFromCart: (id) => set((state) => ({ cart: state.cart.filter((item) => item.id !== id) })),
  updateCartItemQuantity: (productId, qty) => set((state) => ({
    cart: state.cart.map((item) => item.id === productId ? { ...item, qty: Math.max(1, qty) } : item)
  })),
  clearCart: () => set({ cart: [] }),

  subtotal: () => get().cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0),
  tax: () => get().subtotal() * TAX_RATE,
  grandTotal: () => get().subtotal() + get().tax(),
}));