import { useState, useEffect } from 'react';
import api from '../utils/api';
import { ArrowLeft, Trash2, UserPlus, Shield, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function Staff() {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'CASHIER' });
  const [currentAdminStoreId] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.storeId || '';
  });

  // Load Users from API
  const loadUsers = () => {
    api.get('/users').then((res: any) => setUsers(res.data));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Create New User
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdminStoreId) return toast.error("Error: Logged-in admin is not assigned to a store.");

    try {
      await api.post('/users', {
        username: form.username,
        password: form.password,
        role: form.role,
        storeId: currentAdminStoreId
      });
      setForm({ ...form, username: '', password: '' });
      loadUsers();
      toast.success(`User "${form.username}" created successfully!`);
    } catch (error: any) {
      const message = error.response?.data?.message || "Error creating user.";
      toast.error(message);
    }
  };

  // Delete User
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to fire this staff member? This action cannot be undone.")) return;
    try {
      await api.delete(`/users/${id}`);
      loadUsers();
      toast.success("Staff member removed successfully");
    } catch (error: any) {
      const message = error.response?.data?.message || "Error deleting user.";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin" className="p-2 bg-slate-800 rounded hover:bg-slate-700 border border-slate-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold">Staff Management</h1>
        </div>

        {/* Add User Form */}
        <div className="bg-slate-800 p-6 rounded-xl mb-8 border border-slate-700 shadow-lg">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-purple-400">
            <UserPlus size={18} /> Hire New Staff
          </h3>
          <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4">
            <input
              placeholder="Username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              className="bg-slate-900 p-3 rounded flex-1 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              placeholder="Temporary Password"
              type="text"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="bg-slate-900 p-3 rounded flex-1 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              className="bg-slate-900 p-3 rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="CASHIER">Cashier</option>
              <option value="ADMIN">Admin</option>
            </select>

            <button type="submit" className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded font-bold shadow-lg shadow-green-900/20 transition">
              Create Account
            </button>
          </form>
        </div>

        {/* Staff List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-slate-400">
              <tr>
                <th className="p-4">Username</th>
                <th className="p-4">Role</th>
                <th className="p-4">Store</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-700/50 transition">
                  <td className="p-4 font-medium flex items-center gap-2">
                    <User size={16} className="text-slate-500" />
                    {u.username}
                  </td>
                  <td className="p-4">
                    {u.role === 'ADMIN' ? (
                      <span className="flex items-center gap-1 text-purple-400 font-bold text-xs bg-purple-500/10 px-2 py-1 rounded w-fit">
                        <Shield size={12} /> ADMIN
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs bg-slate-700 px-2 py-1 rounded font-bold">CASHIER</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-400 text-sm">{u.store?.name}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded transition"
                      title="Fire Staff"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
