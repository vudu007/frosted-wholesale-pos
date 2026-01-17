import { useEffect, useState } from 'react';
import api from '../utils/api';
import { io } from 'socket.io-client';
import { 
  ChevronRight, 
  Clock, 
  Utensils, 
  ShoppingBasket, 
  Truck, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Timer,
  LayoutDashboard,
  ArrowLeft,
  ShoppingBag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../theme';
import { toast } from 'react-hot-toast';

type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
type OrderType = 'IN_STORE' | 'ONLINE' | 'CURBSIDE';

interface Order {
  id: string;
  orderType: OrderType;
  status: OrderStatus;
  tableNumber?: string;
  grandTotal: number;
  createdAt: string;
  items: {
    id: string;
    qty: number;
    product: {
      name: string;
    };
  }[];
  customer?: {
    firstName: string;
    lastName: string;
  };
}

export default function Orders() {
  const { theme } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<any>(null);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/sales');
      // Filter for active orders (not completed or cancelled)
      const activeOrders = res.data.data.filter((o: Order) => 
        ['PENDING', 'PREPARING', 'READY'].includes(o.status)
      );
      setOrders(activeOrders);
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Setup Socket.io
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const newSocket = io('http://localhost:3000'); // Replace with your backend URL
    
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      if (user.storeId) {
        newSocket.emit('join-store', { storeId: user.storeId });
      }
    });

    newSocket.on('order-update', (data: { order: Order }) => {
      console.log('Order update received:', data);
      setOrders(prevOrders => {
        const orderExists = prevOrders.find(o => o.id === data.order.id);
        const isActive = ['PENDING', 'PREPARING', 'READY'].includes(data.order.status);

        if (orderExists) {
          if (isActive) {
            // Update existing order
            return prevOrders.map(o => o.id === data.order.id ? data.order : o);
          } else {
            // Remove order if no longer active
            return prevOrders.filter(o => o.id !== data.order.id);
          }
        } else if (isActive) {
          // Add new order
          return [data.order, ...prevOrders];
        }
        return prevOrders;
      });
      
      if (['PENDING', 'READY'].includes(data.order.status)) {
        toast.success(`Order #${data.order.id.slice(0, 8)} is ${data.order.status.toLowerCase()}!`, { icon: '🔔' });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.post(`/sales/${orderId}/status`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'PREPARING': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'READY': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getOrderTypeIcon = (type: OrderType) => {
    switch (type) {
      case 'IN_STORE': return <ShoppingBag size={16} />;
      case 'ONLINE': return <Truck size={16} />;
      case 'CURBSIDE': return <ShoppingBasket size={16} />;
    }
  };

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/ordering" className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-black tracking-tight">Active <span className="text-indigo-500">Orders</span></h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">Manage and track kitchen preparation in real-time</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-400">
            <Clock size={14} className="text-indigo-500" />
            Auto-refreshing
          </div>
          <Link to="/ordering" className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-500/20">
            <LayoutDashboard size={18} /> New Order
          </Link>
        </div>
      </header>

      {loading && orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] opacity-30">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-bold">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 border border-slate-800 shadow-xl">
            <CheckCircle2 size={40} className="text-slate-700" />
          </div>
          <h2 className="text-2xl font-black mb-2">All Caught Up!</h2>
          <p className="text-slate-500 max-w-xs">There are no active orders at the moment. New orders will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map((order) => (
            <div key={order.id} className={`flex flex-col rounded-2xl border transition-all duration-300 hover:shadow-2xl ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              {/* Card Header */}
              <div className="p-5 border-b border-slate-800">
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">#{order.id.slice(0, 8)}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                    {getOrderTypeIcon(order.orderType)}
                  </div>
                  <div>
                    <h3 className="font-black text-lg leading-none mb-1">
                      {order.orderType === 'IN_STORE' ? `Order #${order.id.slice(0, 8)}` : order.orderType}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Timer size={12} /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Content: Items */}
              <div className="flex-1 p-5 space-y-3 overflow-y-auto max-h-[250px] custom-scrollbar">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-md bg-slate-800 text-[10px] font-black flex items-center justify-center text-indigo-400 border border-slate-700">{item.qty}</span>
                    <span className="text-sm font-bold text-slate-300">{item.product.name}</span>
                  </div>
                ))}
              </div>

              {/* Card Footer: Actions */}
              <div className="p-5 bg-slate-950/30 border-t border-slate-800 rounded-b-2xl">
                <div className="flex flex-col gap-2">
                  {order.status === 'PENDING' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-2"
                    >
                      Start Preparing <ChevronRight size={14} />
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'READY')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-2"
                    >
                      Mark as Ready <CheckCircle2 size={14} />
                    </button>
                  )}
                  {order.status === 'READY' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-2"
                    >
                      Complete Order <CheckCircle2 size={14} />
                    </button>
                  )}
                  
                  <button 
                    onClick={() => {
                      if(confirm("Cancel this order?")) updateOrderStatus(order.id, 'CANCELLED')
                    }}
                    className="w-full py-2 text-slate-600 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-1"
                  >
                    <XCircle size={12} /> Cancel Order
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
