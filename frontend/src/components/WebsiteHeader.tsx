import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, LogOut, Package, IceCream } from 'lucide-react';
import { useGuestCartStore } from '../guestStore';

export default function WebsiteHeader() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const { cart } = useGuestCartStore();
  const navigate = useNavigate();

  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const isLoggedIn = !!localStorage.getItem('customerToken');
  const customerData = localStorage.getItem('customer');
  const customer = customerData ? JSON.parse(customerData) : null;

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customer');
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-gradient-frosted rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <IceCream className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-frosted-purple">
                Frosted Wholesale
              </h1>
              <p className="text-xs text-gray-500 font-body">Premium Ice Cream Supplier</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-frosted-purple font-semibold transition-colors"
            >
              Home
            </Link>
            <Link 
              to="/shop" 
              className="text-gray-700 hover:text-frosted-purple font-semibold transition-colors"
            >
              Shop
            </Link>
            <Link 
              to="/about" 
              className="text-gray-700 hover:text-frosted-purple font-semibold transition-colors"
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className="text-gray-700 hover:text-frosted-purple font-semibold transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link 
              to="/shop" 
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ShoppingCart className="text-gray-700" size={24} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-frosted text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className="relative">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => setUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-frosted rounded-full flex items-center justify-center">
                      <User className="text-white" size={16} />
                    </div>
                    <span className="hidden lg:block text-sm font-semibold text-gray-700">
                      {customer?.firstName || 'Account'}
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2">
                      <Link
                        to="/account"
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Package size={16} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">My Orders</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors w-full text-left"
                      >
                        <LogOut size={16} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Logout</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-frosted text-white rounded-full font-semibold hover:shadow-lg transition-all"
                >
                  <User size={16} />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="text-gray-700" size={24} />
              ) : (
                <Menu className="text-gray-700" size={24} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-frosted-purple font-semibold transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/shop"
                className="text-gray-700 hover:text-frosted-purple font-semibold transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Shop
              </Link>
              <Link
                to="/about"
                className="text-gray-700 hover:text-frosted-purple font-semibold transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-gray-700 hover:text-frosted-purple font-semibold transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
