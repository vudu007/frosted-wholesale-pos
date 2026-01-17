import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
// Staff/Admin Pages
import Login from './pages/Login';
import Ordering from './pages/Ordering';
import Orders from './pages/Orders';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Staff from './pages/Staff';
import Settings from './pages/Settings';
import Customers from './pages/Customers';
import Forecast from './pages/Forecast';
import Transactions from './pages/Transactions';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
// Customer Website Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import About from './pages/About';
import Contact from './pages/Contact';
import CustomerLogin from './pages/CustomerLogin';
import CustomerRegister from './pages/CustomerRegister';
import CustomerDashboard from './pages/CustomerDashboard';
import OrderConfirmation from './pages/OrderConfirmation';
import { ThemeProvider } from './theme';

// Helper to get user role from local storage
const getUserRole = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.role;
  } catch (e) {
    return null;
  }
};

// Component to protect routes based on login status and role
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactElement, requiredRole?: string }) => {
  const token = localStorage.getItem('token');
  const role = getUserRole();

  // If not logged in, redirect to the login page
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // If a specific role is required and the user doesn't have it, deny access
  if (requiredRole && role !== requiredRole) {
    toast.error("⛔ ACCESS DENIED: This page is for Admins only.");
    // Redirect non-admins to the Ordering screen, which everyone can access
    return <Navigate to="/ordering" replace />;
  }

  // If checks pass, render the requested component
  return children;
};

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Toaster position="top-center" />
        <Routes>
          {/* ========== CUSTOMER WEBSITE (PUBLIC) ========== */}
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<CustomerLogin />} />
          <Route path="/register" element={<CustomerRegister />} />
          <Route path="/account" element={<CustomerDashboard />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />

          {/* ========== STAFF/ADMIN PORTAL ========== */}
          {/* Staff Login */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/reset-password" element={<ResetPassword />} />

          {/* Staff Protected Routes (ADMIN & CASHIER) */}
          <Route path="/admin/pos" element={<ProtectedRoute><Ordering /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/admin/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />

          {/* Admin-Only Routes */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="ADMIN"><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/inventory" element={<ProtectedRoute requiredRole="ADMIN"><Inventory /></ProtectedRoute>} />
          <Route path="/admin/staff" element={<ProtectedRoute requiredRole="ADMIN"><Staff /></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute requiredRole="ADMIN"><Customers /></ProtectedRoute>} />
          <Route path="/admin/forecast" element={<ProtectedRoute requiredRole="ADMIN"><Forecast /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute requiredRole="ADMIN"><Settings /></ProtectedRoute>} />

          {/* Legacy redirects for backward compatibility */}
          <Route path="/ordering" element={<Navigate to="/admin/pos" replace />} />
          <Route path="/orders" element={<Navigate to="/admin/orders" replace />} />
          <Route path="/transactions" element={<Navigate to="/admin/transactions" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
