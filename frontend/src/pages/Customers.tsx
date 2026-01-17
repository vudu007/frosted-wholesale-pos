import { useState, useEffect } from 'react';
import api from '../utils/api';
import { ArrowLeft, Trash2, UserPlus, Search, User, Crown, Star, Award, Gem } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  tier: 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';
  loyaltyPoints: number;
  totalSpent: number;
  storeId: string;
  createdAt: string;
  updatedAt: string;
  store?: {
    id: string;
    name: string;
  };
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });
  const [currentStoreId, setCurrentStoreId] = useState('');
  const [loading, setLoading] = useState(false);

  // Load Customers from API
  const loadCustomers = () => {
    setLoading(true);
    api.get('/customers')
      .then(res => setCustomers(res.data))
      .catch(() => toast.error("Failed to load customers"))
      .finally(() => setLoading(false));
  };

  // Search Customers
  const searchCustomers = () => {
    if (searchQuery.trim()) {
      setLoading(true);
      api.get(`/customers/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => setCustomers(res.data))
        .catch(() => toast.error("Failed to search customers"))
        .finally(() => setLoading(false));
    } else {
      loadCustomers();
    }
  };

  useEffect(() => {
    loadCustomers();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentStoreId(user.storeId);
  }, []);

  // Create New Customer
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStoreId) return toast.error("Error: Store ID not found.");

    try {
      await api.post('/customers', {
        ...form,
        storeId: currentStoreId
      });
      setForm({ firstName: '', lastName: '', email: '', phone: '', address: '' });
      loadCustomers();
      toast.success(`Customer "${form.firstName} ${form.lastName}" created successfully!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error creating customer");
    }
  };

  // Delete Customer
  const handleDelete = async (id: string, name: string) => {
    if(!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/customers/${id}`);
      loadCustomers();
      toast.success("Customer deleted successfully!");
    } catch (err) { 
      toast.error("Error deleting customer.");
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return <Gem size={16} className="text-blue-400" />;
      case 'GOLD': return <Crown size={16} className="text-yellow-400" />;
      case 'SILVER': return <Award size={16} className="text-gray-300" />;
      default: return <Star size={16} className="text-slate-400" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return 'text-blue-400';
      case 'GOLD': return 'text-yellow-400';
      case 'SILVER': return 'text-gray-300';
      default: return 'text-slate-400';
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin" className="p-2 bg-slate-800 rounded hover:bg-slate-700 border border-slate-700">
            <ArrowLeft size={20}/>
          </Link>
          <h1 className="text-3xl font-bold">Customer Management</h1>
        </div>

        {/* Search Bar */}
        <div className="bg-slate-800 p-6 rounded-xl mb-6 border border-slate-700 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search customers by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 p-3 pl-10 pr-4 rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={searchCustomers}
              className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded font-bold transition"
            >
              Search
            </button>
          </div>
        </div>

        {/* Add Customer Form */}
        <div className="bg-slate-800 p-6 rounded-xl mb-8 border border-slate-700 shadow-lg">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-purple-400">
            <UserPlus size={18}/> Add New Customer
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input 
              placeholder="First Name"
              value={form.firstName}
              onChange={e => setForm({...form, firstName: e.target.value})}
              className="bg-slate-900 p-3 rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <input 
              placeholder="Last Name"
              value={form.lastName}
              onChange={e => setForm({...form, lastName: e.target.value})}
              className="bg-slate-900 p-3 rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <input 
              placeholder="Email (Optional)"
              type="email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className="bg-slate-900 p-3 rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input 
              placeholder="Phone (Optional)"
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              className="bg-slate-900 p-3 rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input 
              placeholder="Address (Optional)"
              value={form.address}
              onChange={e => setForm({...form, address: e.target.value})}
              className="bg-slate-900 p-3 rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 md:col-span-2"
            />
            <button type="submit" className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded font-bold shadow-lg shadow-green-900/20 transition col-span-full">
              Add Customer
            </button>
          </form>
        </div>

        {/* Customers List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <User size={20} />
              {searchQuery ? `Search Results (${filteredCustomers.length})` : `All Customers (${customers.length})`}
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-4 text-left">Customer</th>
                  <th className="p-4 text-left">Contact</th>
                  <th className="p-4 text-left">Tier</th>
                  <th className="p-4 text-left">Loyalty Points</th>
                  <th className="p-4 text-left">Total Spent</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p>Loading customers...</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-slate-700 hover:bg-slate-750 transition">
                    <td className="p-4">
                      <div className="font-medium">
                        {customer.firstName} {customer.lastName}
                      </div>
                      <div className="text-sm text-slate-400">
                        Joined {new Date(customer.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {customer.email && (
                          <div className="text-slate-300">{customer.email}</div>
                        )}
                        {customer.phone && (
                          <div className="text-slate-400">{customer.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`flex items-center gap-2 font-medium ${getTierColor(customer.tier)}`}>
                        {getTierIcon(customer.tier)}
                        {customer.tier}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-purple-400 font-semibold">
                        {customer.loyaltyPoints.toLocaleString()} pts
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-green-400 font-semibold">
                        ₦{Number(customer.totalSpent).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDelete(customer.id, `${customer.firstName} ${customer.lastName}`)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredCustomers.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              <User size={48} className="mx-auto mb-4 opacity-50" />
              <p>No customers found{searchQuery ? ' matching your search' : ''}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}