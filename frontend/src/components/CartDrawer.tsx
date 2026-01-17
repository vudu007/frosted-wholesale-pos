import { X, Trash2, Plus, Minus, ShoppingCart, Receipt } from 'lucide-react';
import type { CartItem } from '../store';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onPlaceOrder: () => void;
  subtotal: number;
  currency?: string;
  loading?: boolean;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onPlaceOrder,
  subtotal,
  currency = '₦',
  loading = false,
}: CartDrawerProps) {
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-xl">
                <ShoppingCart size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Shopping Cart</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-8">
                <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                  <ShoppingCart size={48} className="text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Your cart is empty</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Add some products to get started
                </p>
                <button
                  onClick={onClose}
                  className="btn-primary"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 transition-all group"
                  >
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                      {(item as any).image ? (
                        <img
                          src={(item as any).image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🛍️
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm mb-1 truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        {currency}{Number(item.price).toLocaleString()} each
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <button
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.qty - 1))}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-l-lg"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-12 text-center text-sm font-bold">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.qty + 1)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-r-lg"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <p className="font-bold text-primary-600 dark:text-primary-400">
                          {currency}{(Number(item.price) * item.qty).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="self-start p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                {/* Clear Cart Button */}
                <button
                  onClick={onClearCart}
                  className="w-full py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl transition-colors"
                >
                  Clear All Items
                </button>
              </>
            )}
          </div>

          {/* Footer - Checkout */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 space-y-4 bg-slate-50 dark:bg-slate-900/50">
              {/* Subtotal */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                  <span className="font-semibold">
                    {currency}{subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-black text-primary-600 dark:text-primary-400">
                    {currency}{subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onPlaceOrder}
                  disabled={loading}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={18} />
                  Place Order
                </button>
                <button
                  onClick={onCheckout}
                  disabled={loading}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="spinner" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Receipt size={18} />
                      Checkout
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
