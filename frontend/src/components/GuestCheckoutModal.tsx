import { useState } from 'react';
import { X, User, Phone, Mail, MapPin, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: Array<{ id: string; name: string; qty: number; price: number }>;
  totalAmount: number;
  totalQuantity: number;
  onSuccess: (orderData: any) => void;
}

export default function GuestCheckoutModal({
  isOpen,
  onClose,
  cartItems,
  totalAmount,
  totalQuantity,
  onSuccess,
}: GuestCheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
  });

  // Calculate payment terms based on quantity
  const getPaymentTerms = () => {
    if (totalQuantity >= 1 && totalQuantity <= 3) {
      return {
        type: 'IMMEDIATE',
        label: 'Immediate Payment Required',
        description: 'Payment must be made now to complete your order',
        dueDate: new Date(),
        color: 'red',
        icon: CreditCard,
      };
    } else if (totalQuantity >= 4 && totalQuantity <= 10) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      return {
        type: '1_WEEK',
        label: '1 Week Credit Terms',
        description: 'Payment due within 7 days',
        dueDate,
        color: 'yellow',
        icon: Calendar,
      };
    } else {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      return {
        type: '2_WEEKS',
        label: '2 Weeks Credit Terms',
        description: 'Payment due within 14 days',
        dueDate,
        color: 'green',
        icon: Calendar,
      };
    }
  };

  const paymentTerms = getPaymentTerms();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Get the default store ID from the backend
      let storeId = localStorage.getItem('defaultStoreId');
      
      if (!storeId) {
        // Fetch the default store from the backend
        try {
          const storeResponse = await axios.get('http://localhost:3000/stores/default');
          if (storeResponse.data.success && storeResponse.data.store.id) {
            storeId = storeResponse.data.store.id;
            // Cache it for future use
            localStorage.setItem('defaultStoreId', storeId);
          } else {
            throw new Error('No store found');
          }
        } catch (error) {
          toast.error('Failed to get store information. Please try again.');
          setLoading(false);
          return;
        }
      }

      if (!storeId) {
        toast.error('Unable to determine store. Please try again.');
        setLoading(false);
        return;
      }

      const response = await axios.post('http://localhost:3000/sales/public/guest-order', {
        storeId,
        customerInfo: formData,
        items: cartItems.map(item => ({
          productId: item.id,
          qty: item.qty,
        })),
        orderType: 'ONLINE',
      });

      toast.success(response.data.message);
      onSuccess(response.data);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-primary-600 to-primary-700">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <User size={24} />
                Complete Your Order
              </h2>
              <p className="text-primary-100 text-sm mt-1">
                {totalQuantity} item{totalQuantity !== 1 ? 's' : ''} • ₦{totalAmount.toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Payment Terms Banner */}
          <div className={`p-4 border-b border-slate-200 dark:border-slate-800 bg-${paymentTerms.color}-50 dark:bg-${paymentTerms.color}-950`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 bg-${paymentTerms.color}-100 dark:bg-${paymentTerms.color}-900 rounded-lg`}>
                <paymentTerms.icon className={`text-${paymentTerms.color}-600 dark:text-${paymentTerms.color}-400`} size={24} />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-${paymentTerms.color}-900 dark:text-${paymentTerms.color}-100`}>
                  {paymentTerms.label}
                </h3>
                <p className={`text-sm text-${paymentTerms.color}-700 dark:text-${paymentTerms.color}-300 mt-1`}>
                  {paymentTerms.description}
                </p>
                {paymentTerms.type !== 'IMMEDIATE' && (
                  <p className={`text-xs text-${paymentTerms.color}-600 dark:text-${paymentTerms.color}-400 mt-2 font-semibold`}>
                    Due Date: {paymentTerms.dueDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <User size={16} />
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <User size={16} />
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Phone size={16} />
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                placeholder="08012345678"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Mail size={16} />
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                placeholder="john@example.com"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MapPin size={16} />
                Delivery Address <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition resize-none"
                placeholder="Enter your full delivery address..."
              />
            </div>

            {/* Order Summary */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Order Summary</h4>
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    {item.name} × {item.qty}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ₦{(Number(item.price) * item.qty).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-slate-900 dark:text-white">Total</span>
                  <span className="text-primary-600 dark:text-primary-400">
                    ₦{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Important Notice for Immediate Payment */}
            {paymentTerms.type === 'IMMEDIATE' && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-red-800 dark:text-red-200">
                  <p className="font-semibold mb-1">Payment Required</p>
                  <p>Orders with 1-3 items require immediate payment. You will be contacted for payment details after placing your order.</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl shadow-lg transition duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Place Order
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
