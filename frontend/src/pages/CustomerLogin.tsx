import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, IceCream } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import WebsiteHeader from '../components/WebsiteHeader';
import WebsiteFooter from '../components/WebsiteFooter';

export default function CustomerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/customer-auth/login', {
        email,
        password,
      });

      localStorage.setItem('customerToken', response.data.access_token);
      localStorage.setItem('customer', JSON.stringify(response.data.customer));

      toast.success('Welcome back!');
      navigate('/account');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <WebsiteHeader />

      <div className="py-20 px-4">
        <div className="max-w-md mx-auto">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-frosted rounded-full flex items-center justify-center mx-auto mb-4">
              <IceCream className="text-white" size={40} />
            </div>
            <h1 className="text-4xl font-display font-bold text-frosted-purple mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Sign in to your Frosted Wholesale account
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-frosted-purple focus:border-transparent transition-all"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-frosted-purple focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-frosted-purple border-gray-300 rounded focus:ring-frosted-purple"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-frosted-purple hover:text-secondary transition-colors">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-frosted-primary flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="spinner" />
                ) : (
                  <>
                    <LogIn size={20} />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-frosted-purple hover:text-secondary font-semibold transition-colors">
                  Create one now
                </Link>
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              By signing in, you agree to our{' '}
              <a href="#" className="text-frosted-purple hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-frosted-purple hover:underline">Privacy Policy</a>
            </p>
          </div>

          {/* Back to Shop */}
          <div className="mt-6 text-center">
            <Link to="/shop" className="text-gray-600 hover:text-frosted-purple transition-colors">
              ← Continue shopping as guest
            </Link>
          </div>
        </div>
      </div>

      <WebsiteFooter />
    </div>
  );
}
