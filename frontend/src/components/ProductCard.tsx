import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '../store';

interface ProductCardProps {
  product: Product & { image?: string; group?: string };
  onAddToCart: (product: Product, qty: number) => void;
  currency?: string;
}

export default function ProductCard({ product, onAddToCart, currency = '₦' }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    onAddToCart(product, quantity);
    
    // Reset animation after a short delay
    setTimeout(() => {
      setIsAdding(false);
      setQuantity(1);
    }, 600);
  };

  const incrementQty = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(prev => prev + 1);
  };

  const decrementQty = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const stockLevel = product.inventory?.[0]?.stock || product.stock || 0;
  const isLowStock = stockLevel > 0 && stockLevel <= 10;
  const isOutOfStock = stockLevel === 0;

  return (
    <div className="product-card group">
      {/* Product Image */}
      <div className="relative aspect-square bg-slate-100 dark:bg-slate-950 overflow-hidden">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="product-card-image"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-20 group-hover:opacity-30 transition-opacity">
              🛍️
            </span>
          </div>
        )}
        
        {/* Gradient Overlay on Hover */}
        <div className="gradient-overlay" />
        
        {/* Stock Badge */}
        {isOutOfStock && (
          <div className="product-card-badge bg-red-500 text-white">
            Out of Stock
          </div>
        )}
        {isLowStock && !isOutOfStock && (
          <div className="product-card-badge bg-amber-500 text-white">
            Low Stock
          </div>
        )}
        
        {/* Quick Add Button - Shows on Hover */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl p-2 shadow-2xl">
            <button
              onClick={decrementQty}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              disabled={quantity <= 1}
            >
              <Minus size={16} className="text-slate-600 dark:text-slate-400" />
            </button>
            
            <span className="flex-1 text-center font-bold text-sm">
              {quantity}
            </span>
            
            <button
              onClick={incrementQty}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Plus size={16} className="text-slate-600 dark:text-slate-400" />
            </button>
            
            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock || isAdding}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                isAdding 
                  ? 'bg-green-500 text-white scale-95' 
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ShoppingCart size={16} />
              {isAdding ? 'Added!' : 'Add'}
            </button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-2">
        {/* Category */}
        {product.group && (
          <span className="inline-block px-2 py-1 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 rounded-md">
            {product.group}
          </span>
        )}
        
        {/* Product Name */}
        <h3 className="font-bold text-base leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {product.name}
        </h3>
        
        {/* SKU */}
        {product.sku && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            SKU: {product.sku}
          </p>
        )}
        
        {/* Price and Stock */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-2xl font-black text-primary-600 dark:text-primary-400">
              {currency}{Number(product.price).toLocaleString()}
            </p>
            {stockLevel > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {stockLevel} in stock
              </p>
            )}
          </div>
          
          {/* Quick Add Icon Button (Mobile) */}
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className="lg:hidden p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
