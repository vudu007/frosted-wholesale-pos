import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useCartStore, type Product } from '../store';
import { 
  Search, 
  LogOut, 
  ShoppingCart, 
  UserCircle, 
  Menu,
  SlidersHorizontal,
  Sun,
  Moon,
  LayoutDashboard,
  Package,
  History,
  Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { generateReceipt } from '../utils/receiptGenerator';
import PaymentModal from '../components/PaymentModal';
import CustomerSearchModal from '../components/CustomerSearchModal';
import { PasswordPromptModal } from '../components/PasswordPromptModal';
import ProductCard from '../components/ProductCard';
import CartDrawer from '../components/CartDrawer';
import { useTheme } from '../theme';
import { toast } from 'react-hot-toast';

type UserData = { username: string; id: string; storeId: string; role: 'ADMIN' | 'CASHIER'; };
type OrderType = 'IN_STORE' | 'ONLINE' | 'CURBSIDE';

export default function Ordering() {
  const { theme, toggleTheme } = useTheme();
  const { cart, addToCart, removeFromCart, updateCartItemQuantity, clearCart, subtotal } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const navigate = useNavigate();
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [discount, setDiscount] = useState({ type: 'FIXED' as 'FIXED' | 'PERCENTAGE', value: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [orderType, setOrderType] = useState<OrderType>('IN_STORE');
  const [settings, setSettings] = useState<any>({ businessName: 'EmmyOrder', currency: '₦', logoUrl: '' });
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string, name: string, points: number } | null>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'ZOUT' | 'LOGOUT' } | null>(null);
  
  // New state for drawer and filters
  const [isCartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState('name-asc');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { navigate('/'); return; }
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    if (!user?.storeId) { navigate('/'); return; }
    
    api.get('/products').then((res) => setProducts(res.data));
    
    const startShift = async () => {
      try {
        const res = await api.post('/shifts/start', { userId: user.id, storeId: user.storeId, openingCash: 100 });
        setActiveShiftId(res.data.id);
      } catch (e) { console.log("Shift start skipped."); }
    };
    startShift();
    api.get('/settings').then((res) => setSettings(res.data));
  }, [navigate]);

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

  const discountValue = discount.type === 'PERCENTAGE' ? subtotal() * (discount.value / 100) : discount.value;
  const subtotalAfterDiscount = subtotal() - discountValue;
  const finalGrandTotal = subtotalAfterDiscount;

  const handlePlaceOrder = async (isPaid: boolean = false, payments: { type: string; amount: number }[] = []) => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      const storeId = currentUser?.storeId;
      if (!storeId) throw new Error("User has no assigned store.");

      const payload = {
        storeId,
        items: cart.map(i => ({ productId: i.id, qty: i.qty })),
        payments: isPaid ? payments : [],
        discount: discount.value > 0 ? discount : undefined,
        customerId: selectedCustomer?.id,
        orderType,
        tableNumber: null,
        status: isPaid ? 'COMPLETED' : 'PENDING'
      };

      const saleRes = await api.post('/sales', payload);

      if (isPaid) {
        generateReceipt(
          cart,
          subtotal(),
          0,
          finalGrandTotal,
          saleRes.data.id.slice(0, 8),
          currentUser?.username || 'Staff',
          { name: settings.businessName, address: settings.businessAddress || '' },
          settings.logoUrl ? `http://localhost:3000${settings.logoUrl}` : null,
          null,
          new Date().toLocaleString(),
          settings.currency || '₦'
        );
        toast.success("Order Paid & Completed!");
      } else {
        toast.success("Order placed successfully!");
      }

      clearCart();
      setDiscount({ type: 'FIXED', value: 0 });
      setSelectedCustomer(null);
      setPaymentModalOpen(false);
      setCartDrawerOpen(false);
    } catch (error: any) {
      toast.error(`Order Failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleZOut = () => {
    if (!activeShiftId) return alert("Error: No active shift found.");
    setPendingAction({ type: 'ZOUT' });
    setIsPassModalOpen(true);
  };

  const executeZOut = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/shifts/${activeShiftId}/auto-end`);
      alert(`✅ SHIFT CLOSED SUCCESSFULLY!\nSystem Total: ₦${Number(res.data.systemCash).toFixed(2)}`);
      setActiveShiftId(null);
    } catch (error: any) {
      alert("Failed to perform Z-Out.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setPendingAction({ type: 'LOGOUT' });
    setIsPassModalOpen(true);
  };

  const executeLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Top Navigation Bar */}
      <header className={`sticky top-0 z-30 backdrop-blur-glass border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'} shadow-sm`}>
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Logo & Navigation */}
            <div className="flex items-center gap-6">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Menu size={24} />
              </button>

              {/* Logo */}
              <Link to="/ordering" className="flex items-center gap-3">
                {settings.logoUrl ? (
                  <img src={`http://localhost:3000${settings.logoUrl}`} alt="Logo" className="h-10 w-10 object-contain" />
                ) : (
                  <div className="p-2 bg-primary-600 rounded-xl">
                    <ShoppingCart size={24} className="text-white" />
                  </div>
                )}
                <div className="hidden sm:block">
                  <h1 className="text-xl font-black tracking-tight">{settings.businessName}</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Wholesale Ordering</p>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <Link to="/ordering" className="px-4 py-2 rounded-lg text-sm font-semibold bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm">
                  <Package size={16} className="inline mr-2" />
                  Products
                </Link>
                <Link to="/orders" className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 transition">
                  <History size={16} className="inline mr-2" />
                  Orders
                </Link>
                <Link to="/transactions" className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 transition">
                  <History size={16} className="inline mr-2" />
                  History
                </Link>
                {currentUser?.role === 'ADMIN' && (
                  <Link to="/admin" className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 transition">
                    <LayoutDashboard size={16} className="inline mr-2" />
                    Admin
                  </Link>
                )}
              </nav>
            </div>

            {/* Right Section - Search, Cart, User */}
            <div className="flex items-center gap-3">
              {/* Search Bar - Hidden on small screens */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-primary-500 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Cart Button */}
              <button
                onClick={() => setCartDrawerOpen(true)}
                className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <ShoppingCart size={24} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce-subtle">
                    {cartItemCount}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
                <div className="text-right">
                  <p className="text-sm font-semibold">{currentUser?.username}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">{currentUser?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-all"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-primary-500 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Category Bar */}
      <div className={`sticky top-16 z-20 backdrop-blur-glass border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 shrink-0">
              <SlidersHorizontal size={20} className="text-slate-500" />
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Filter:</span>
            </div>
            
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`category-pill ${
                  selectedCategory === cat ? 'category-pill-active' : 'category-pill-inactive'
                }`}
              >
                {cat}
              </button>
            ))}

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="ml-auto shrink-0 px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Info Bar */}
      {selectedCustomer && (
        <div className="bg-primary-50 dark:bg-primary-950 border-b border-primary-200 dark:border-primary-900">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCircle size={20} className="text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-semibold text-primary-900 dark:text-primary-100">
                  Customer: {selectedCustomer.name}
                </span>
                <span className="text-xs text-primary-600 dark:text-primary-400">
                  {selectedCustomer.points} Points
                </span>
              </div>
              <button
                onClick={() => setCustomerModalOpen(true)}
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
              >
                Change Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <Package size={48} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No products found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
            {filteredProducts.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                currency={settings.currency || '₦'}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Buttons - Mobile */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 lg:hidden z-20">
        {!selectedCustomer && (
          <button
            onClick={() => setCustomerModalOpen(true)}
            className="p-4 bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 rounded-full shadow-2xl hover:scale-110 transition-transform border border-slate-200 dark:border-slate-800"
          >
            <Users size={24} />
          </button>
        )}
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        cart={cart}
        onUpdateQuantity={updateCartItemQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onCheckout={() => {
          setCartDrawerOpen(false);
          setPaymentModalOpen(true);
        }}
        onPlaceOrder={() => handlePlaceOrder(false)}
        subtotal={subtotal()}
        currency={settings.currency || '₦'}
        loading={loading}
      />

      {/* Modals */}
      <PasswordPromptModal
        isOpen={isPassModalOpen}
        onClose={() => { setIsPassModalOpen(false); setPendingAction(null); }}
        onConfirm={() => {
          if (pendingAction?.type === 'ZOUT') executeZOut();
          if (pendingAction?.type === 'LOGOUT') executeLogout();
        }}
        title={pendingAction?.type === 'ZOUT' ? "Verify Z-OUT" : "Confirm Logout"}
        description="Enter your password to verify your identity."
      />

      {isPaymentModalOpen && (
        <PaymentModal
          grandTotal={finalGrandTotal}
          onClose={() => setPaymentModalOpen(false)}
          onFinalize={(payments) => handlePlaceOrder(true, payments)}
          loading={loading}
        />
      )}

      {isCustomerModalOpen && (
        <CustomerSearchModal
          onClose={() => setCustomerModalOpen(false)}
          onSelect={(c) => {
            setSelectedCustomer({ id: c.id, name: `${c.firstName} ${c.lastName}`, points: c.loyaltyPoints });
            setCustomerModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
