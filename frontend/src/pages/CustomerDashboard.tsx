import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, User, Award, Clock, Calendar, DollarSign, IceCream } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import WebsiteHeader from '../components/WebsiteHeader';
import WebsiteFooter from '../components/WebsiteFooter';

type Order = {
  id: string;
  createdAt: string;
  grandTotal: string;
  status: string;
  paymentTerms?: string;
  paymentDueDate?: string;
  items: Array<{
    product: { name: string };
    qty: number;
  }>;
};

type Customer = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  loyaltyPoints: number;
  tier: string;
  totalSpent: string;
};

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [profileRes, ordersRes] = await Promise.all([
        api.get('/customer-auth/profile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('customerToken')}` },
        }),
        api.get('/customer-auth/orders', {
          headers: { Authorization: `Bearer ${localStorage.getItem('customerToken')}` },
        }),
      ]);

      setCustomer(profileRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      toast.error('Failed to load data');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return 'bg-gradient-to-r from-gray-400 to-gray-600';
      case 'GOLD':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 'SILVER':
        return 'bg-gradient-to-r from-gray-300 to-gray-500';
      default:
        return 'bg-gradient-frosted';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <WebsiteHeader />

      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-frosted rounded-2xl p-8 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-display font-bold mb-2">
                  Welcome back, {customer?.firstName}!
                </h1>
                <p className="text-white/80">
                  Manage your orders and account settings
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                  <IceCream className="text-white" size={48} />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${getTierColor(customer?.tier || 'STANDARD')} rounded-full flex items-center justify-center`}>
                  <Award className="text-white" size={24} />
                </div>
                <span className="text-sm font-semibold text-gray-500">{customer?.tier}</span>
              </div>
              <div className="text-3xl font-display font-bold text-frosted-purple mb-1">
                {customer?.loyaltyPoints || 0}
              </div>
              <div className="text-sm text-gray-600">Loyalty Points</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-frosted rounded-full flex items-center justify-center">
                  <Package className="text-white" size={24} />
                </div>
              </div>
              <div className="text-3xl font-display font-bold text-frosted-purple mb-1">
                {orders.length}
              </div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-frosted rounded-full flex items-center justify-center">
                  <DollarSign className="text-white" size={24} />
                </div>
              </div>
              <div className="text-3xl font-display font-bold text-frosted-purple mb-1">
                ₦{parseFloat(customer?.totalSpent || '0').toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                    activeTab === 'orders'
                      ? 'text-frosted-purple border-b-2 border-frosted-purple'
                      : 'text-gray-600 hover:text-frosted-purple'
                  }`}
                >
                  <Package className="inline mr-2" size={20} />
                  Order History
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                    activeTab === 'profile'
                      ? 'text-frosted-purple border-b-2 border-frosted-purple'
                      : 'text-gray-600 hover:text-frosted-purple'
                  }`}
                >
                  <User className="inline mr-2" size={20} />
                  Profile
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'orders' ? (
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="mx-auto text-gray-400 mb-4" size={64} />
                      <h3 className="text-xl font-display font-bold text-gray-700 mb-2">
                        No orders yet
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Start shopping to see your orders here
                      </p>
                      <a href="/shop" className="btn-frosted-primary inline-block">
                        Browse Products
                      </a>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-card transition-all"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-display font-bold text-lg">
                                Order #{order.id.slice(0, 8)}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 space-x-4">
                              <span className="flex items-center">
                                <Calendar size={14} className="mr-1" />
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                              {order.paymentTerms && (
                                <span className="flex items-center">
                                  <Clock size={14} className="mr-1" />
                                  {order.paymentTerms}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0 text-right">
                            <div className="text-2xl font-display font-bold text-frosted-purple">
                              ₦{parseFloat(order.grandTotal).toLocaleString()}
                            </div>
                            {order.paymentDueDate && order.status === 'PENDING' && (
                              <div className="text-sm text-gray-600">
                                Due: {new Date(order.paymentDueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="font-semibold text-gray-700 mb-2">Items:</h4>
                          <ul className="space-y-1">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="text-sm text-gray-600">
                                {item.product.name} × {item.qty}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-bold text-xl mb-4 text-frosted-purple">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          First Name
                        </label>
                        <div className="text-gray-900">{customer?.firstName}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Last Name
                        </label>
                        <div className="text-gray-900">{customer?.lastName}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Email
                        </label>
                        <div className="text-gray-900">{customer?.email}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Phone
                        </label>
                        <div className="text-gray-900">{customer?.phone || 'Not provided'}</div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Address
                        </label>
                        <div className="text-gray-900">{customer?.address || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-display font-bold text-xl mb-4 text-frosted-purple">
                      Account Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Member Tier
                        </label>
                        <div className="flex items-center space-x-2">
                          <span className={`px-4 py-2 rounded-full text-white font-semibold ${getTierColor(customer?.tier || 'STANDARD')}`}>
                            {customer?.tier}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Loyalty Points
                        </label>
                        <div className="text-2xl font-bold text-frosted-purple">
                          {customer?.loyaltyPoints || 0} points
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <WebsiteFooter />
    </div>
  );
}
