import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, Calendar, Clock, CreditCard, MapPin, User, Mail, Phone, IceCream, ArrowRight } from 'lucide-react';
import WebsiteHeader from '../components/WebsiteHeader';
import WebsiteFooter from '../components/WebsiteFooter';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const location = useLocation();
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    // Get order data from navigation state
    if (location.state?.orderData) {
      setOrderData(location.state.orderData);
    }
  }, [location]);

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <WebsiteHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Order not found</h2>
            <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
            <Link to="/shop" className="btn-frosted-primary inline-block">
              Continue Shopping
            </Link>
          </div>
        </div>
        <WebsiteFooter />
      </div>
    );
  }

  const getPaymentTermsDisplay = () => {
    if (!orderData.paymentTerms) return null;
    
    switch (orderData.paymentTerms) {
      case 'IMMEDIATE':
        return {
          title: 'Payment Required',
          description: 'Immediate payment required for orders of 1-3 items',
          color: 'bg-green-100 text-green-800 border-green-200',
        };
      case '1_WEEK':
        return {
          title: '1 Week Payment Terms',
          description: 'Payment due within 7 days for orders of 4-10 items',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case '2_WEEKS':
        return {
          title: '2 Week Payment Terms',
          description: 'Payment due within 14 days for orders of 11+ items',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
        };
      default:
        return null;
    }
  };

  const paymentTerms = getPaymentTermsDisplay();

  return (
    <div className="min-h-screen bg-gray-50">
      <WebsiteHeader />

      {/* Success Hero */}
      <section className="hero-gradient py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <CheckCircle size={48} className="text-frosted-purple" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-shadow">
            Order Confirmed!
          </h1>
          <p className="text-xl text-white/90 mb-2">
            Thank you for your order
          </p>
          <p className="text-lg text-white/80">
            Order ID: <span className="font-mono font-bold">#{orderData.orderId?.slice(0, 8)}</span>
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Payment Terms Card */}
        {paymentTerms && (
          <div className={`mb-8 p-6 rounded-2xl border-2 ${paymentTerms.color} animate-slide-up`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <CreditCard size={24} className="text-frosted-purple" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-display font-bold mb-2">{paymentTerms.title}</h3>
                <p className="text-sm mb-3">{paymentTerms.description}</p>
                {orderData.paymentDueDate && (
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Calendar size={16} />
                    <span>Payment Due: {new Date(orderData.paymentDueDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-2xl shadow-card p-6 animate-slide-up animation-delay-100">
              <h2 className="text-2xl font-display font-bold mb-6 text-frosted-purple flex items-center gap-2">
                <User size={24} />
                Customer Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Full Name</label>
                  <p className="text-gray-900 font-medium">{orderData.customerInfo?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Email</label>
                  <p className="text-gray-900 font-medium flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    {orderData.customerInfo?.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Phone</label>
                  <p className="text-gray-900 font-medium flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    {orderData.customerInfo?.phone}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Delivery Address</label>
                  <p className="text-gray-900 font-medium flex items-start gap-2">
                    <MapPin size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                    <span>{orderData.customerInfo?.address}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-card p-6 animate-slide-up animation-delay-200">
              <h2 className="text-2xl font-display font-bold mb-6 text-frosted-purple flex items-center gap-2">
                <Package size={24} />
                Order Items
              </h2>
              <div className="space-y-4">
                {orderData.items?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-16 h-16 bg-gradient-frosted rounded-lg flex items-center justify-center flex-shrink-0">
                      <IceCream className="text-white" size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-frosted-purple">
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">₦{item.price.toLocaleString()} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-card p-6 sticky top-24 animate-slide-up animation-delay-300">
              <h2 className="text-xl font-display font-bold mb-6 text-frosted-purple">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">₦{orderData.subtotal?.toLocaleString()}</span>
                </div>
                
                {orderData.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-semibold">-₦{orderData.discount?.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span className="font-semibold">₦{orderData.tax?.toLocaleString()}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-display font-bold text-frosted-purple">
                      ₦{orderData.total?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock size={16} className="text-frosted-purple" />
                  <span>Order placed on {new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Package size={16} className="text-frosted-purple" />
                  <span>{orderData.items?.length} item{orderData.items?.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Link
                  to="/account"
                  className="block w-full text-center py-3 bg-gradient-frosted text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  View Order History
                </Link>
                <Link
                  to="/shop"
                  className="block w-full text-center py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next Section */}
        <div className="mt-12 bg-gradient-frosted rounded-2xl p-8 text-white animate-slide-up animation-delay-400">
          <h2 className="text-3xl font-display font-bold mb-6 text-center">What Happens Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={28} />
              </div>
              <h3 className="font-bold text-lg mb-2">1. Confirmation Email</h3>
              <p className="text-white/80 text-sm">
                You'll receive an order confirmation email with all the details
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={28} />
              </div>
              <h3 className="font-bold text-lg mb-2">2. Order Processing</h3>
              <p className="text-white/80 text-sm">
                We'll prepare your order and get it ready for delivery
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <IceCream size={28} />
              </div>
              <h3 className="font-bold text-lg mb-2">3. Delivery</h3>
              <p className="text-white/80 text-sm">
                Your premium ice cream will be delivered fresh to your location
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Need help with your order?</p>
          <Link to="/contact" className="inline-flex items-center gap-2 text-frosted-purple hover:text-secondary font-semibold transition-colors">
            Contact our support team
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      <WebsiteFooter />
    </div>
  );
}
