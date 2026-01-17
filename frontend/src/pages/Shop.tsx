import { useEffect, useState } from 'react';
import axios from 'axios';
import { useGuestCartStore } from '../guestStore';
import { 
  Search, 
  ShoppingCart, 
  Package,
  X,
  Trash2,
  IceCream,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GuestCheckoutModal from '../components/GuestCheckoutModal';
import WebsiteHeader from '../components/WebsiteHeader';
import WebsiteFooter from '../components/WebsiteFooter';
import { toast } from 'react-hot-toast';

type Product = {
  id: string;
  name: string;
  price: number;
  image?: string;
  sku: string;
  group?: string;
};

export default function Shop() {
  const { cart, addToCart, removeFromCart, updateCartItemQuantity, clearCart, subtotal, totalQuantity } = useGuestCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState('name-asc');
  const [settings, setSettings] = useState<any>({ businessName: 'Frosted Wholesale', currency: '₦' });
  const [isCheckoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [isCartDrawerOpen, setCartDrawerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch products
    axios.get('http://localhost:3000/products')
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load products');
        setLoading(false);
      });

    // Fetch settings
    axios.get('http://localhost:3000/settings')
      .then((res) => setSettings(res.data))
      .catch(() => console.log('Settings not loaded'));
  }, []);

  const categories = ['All', ...new Set(products.map((p: any) => p.group).filter(Boolean) as string[])];

  // Filter and sort products
  const filteredProducts = products
    .filter(p => {
      const matchesSearch = !searchQuery.trim() || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || (p as any).group === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc':
          return Number(a.price) - Number(b.price);
        case 'price-desc':
          return Number(b.price) - Number(a.price);
        default:
          return 0;
      }
    });

  const cartItemCount = totalQuantity();
  const cartSubtotal = subtotal();

  const handleCheckoutSuccess = (orderData: any) => {
    clearCart();
    navigate(`/order-confirmation/${orderData.orderId}`, { state: { orderData } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <WebsiteHeader />

      {/* Hero Section */}
      <section className="hero-gradient py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-shadow">
            Browse Our Premium Ice Cream
          </h1>
          <p className="text-xl text-white/90 mb-6">
            Wholesale prices on the finest ice cream flavors
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search for ice cream flavors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white rounded-full text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Sort Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-20 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Categories */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 shrink-0">
                <Filter size={18} className="text-frosted-purple" />
                <span className="text-sm font-semibold text-gray-700">Categories:</span>
              </div>
              
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-gradient-frosted text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort & Results Count */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </span>
              
              <div className="flex items-center gap-2">
                <ArrowUpDown size={18} className="text-frosted-purple" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-frosted-purple"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-gradient-frosted rounded-full flex items-center justify-center mb-4 animate-bounce">
              <IceCream className="text-white" size={32} />
            </div>
            <p className="text-gray-600 font-semibold">Loading delicious ice cream...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Package size={48} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-2 text-gray-900">No products found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="btn-frosted-primary"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product: any) => (
              <div key={product.id} className="frosted-card group">
                {/* Product Image */}
                <div className="relative frosted-card-image bg-gradient-frosted flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img 
                      src={`http://localhost:3000${product.image}`} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <IceCream className="text-white" size={64} />
                  )}
                </div>

                {/* Product Info */}
                <div className="frosted-card-content">
                  {product.group && (
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full mb-2">
                      {product.group}
                    </span>
                  )}
                  
                  <h3 className="text-lg font-display font-bold mb-2 text-gray-900 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-frosted-purple">
                        {settings.currency}{Number(product.price).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      addToCart(product);
                      toast.success(`${product.name} added to cart!`);
                    }}
                    className="w-full py-3 bg-gradient-frosted text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={18} />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Cart Button - Mobile */}
      {cartItemCount > 0 && (
        <button
          onClick={() => setCartDrawerOpen(true)}
          className="fixed bottom-6 right-6 lg:hidden z-30 p-4 bg-gradient-frosted text-white rounded-full shadow-2xl hover:scale-110 transition-transform"
        >
          <ShoppingCart size={24} />
          <span className="absolute -top-2 -right-2 w-7 h-7 bg-secondary text-white text-xs font-bold rounded-full flex items-center justify-center">
            {cartItemCount}
          </span>
        </button>
      )}

      {/* Dark-Themed Cart Drawer - Matching POS Design */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCartDrawerOpen(false)}></div>
          <div className="relative w-full max-w-md bg-[#2C3E50] shadow-2xl overflow-y-auto animate-slide-left">
            {/* Cart Header - Dark Theme */}
            <div className="sticky top-0 bg-[#34495E] text-white p-6 z-10 border-b border-[#1A252F]">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-display font-bold">Your Cart</h2>
                <button 
                  onClick={() => setCartDrawerOpen(false)} 
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-white/70 text-sm">
                {cartItemCount} item{cartItemCount !== 1 ? 's' : ''} • {settings.currency}{cartSubtotal.toLocaleString()}
              </p>
            </div>

            {/* Cart Items - Dark Theme */}
            <div className="p-6 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-[#34495E] rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart size={40} className="text-gray-500" />
                  </div>
                  <p className="text-white/70 font-semibold">Your cart is empty</p>
                  <p className="text-sm text-white/50 mt-2">Add some delicious ice cream!</p>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-4 bg-[#34495E] rounded-xl hover:bg-[#3D5A73] transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-base mb-1">{item.name}</h3>
                        <p className="text-white/60 text-sm">
                          {item.qty} x {settings.currency}{Number(item.price).toLocaleString()}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => {
                          removeFromCart(item.id);
                          toast.success('Item removed from cart');
                        }}
                        className="p-2 text-[#E74C3C] hover:bg-[#E74C3C]/10 rounded-lg transition-colors ml-4"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}

                  {/* Cart Summary - Dark Theme */}
                  <div className="border-t border-[#1A252F] pt-6 mt-6 space-y-4">
                    <div className="flex justify-between items-center text-white">
                      <span className="text-lg">Subtotal</span>
                      <span className="text-2xl font-bold">
                        {settings.currency}{cartSubtotal.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-white/60 text-center py-2">
                      Payment terms apply at checkout
                    </div>

                    <button
                      onClick={() => {
                        setCartDrawerOpen(false);
                        setCheckoutModalOpen(true);
                      }}
                      className="w-full bg-[#27AE60] hover:bg-[#229954] text-white font-bold py-4 rounded-xl transition-colors shadow-lg"
                    >
                      Proceed to Checkout
                    </button>
                    
                    <button
                      onClick={() => {
                        clearCart();
                        toast.success('Cart cleared');
                      }}
                      className="w-full text-[#E74C3C] hover:bg-[#E74C3C]/10 font-semibold py-3 rounded-xl transition-colors"
                    >
                      Clear Cart
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <GuestCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        cartItems={cart}
        totalAmount={cartSubtotal}
        totalQuantity={cartItemCount}
        onSuccess={handleCheckoutSuccess}
      />

      <WebsiteFooter />
    </div>
  );
}
