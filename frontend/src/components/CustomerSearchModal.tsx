import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Search, X, User, UserPlus, Phone, Mail, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

type Customer = {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    loyaltyPoints: number;
    tier: string;
};

interface CustomerSearchModalProps {
    onSelect: (customer: Customer) => void;
    onClose: () => void;
}

export default function CustomerSearchModal({ onSelect, onClose }: CustomerSearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'SEARCH' | 'CREATE'>('SEARCH');

    // Create Customer Form State
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: ''
    });

    const [currentStoreId, setCurrentStoreId] = useState('');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.storeId) setCurrentStoreId(user.storeId);
    }, []);

    useEffect(() => {
        if (mode === 'CREATE') return;
        if (query.length < 2) {
            setResults([]);
            return;
        }
        const timeoutId = setTimeout(() => {
            setLoading(true);
            api.get(`/customers/search?q=${encodeURIComponent(query)}`)
                .then(res => setResults(res.data))
                .catch(() => toast.error("Search failed"))
                .finally(() => setLoading(false));
        }, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [query, mode]);

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentStoreId) return toast.error("Store ID not found");
        if (!form.firstName || !form.lastName) return toast.error("Name is required");

        setLoading(true);
        try {
            const res = await api.post('/customers', {
                ...form,
                storeId: currentStoreId
            });
            toast.success("Customer created and selected!");
            onSelect(res.data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create customer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700 overflow-hidden"
                >
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            {mode === 'SEARCH' ? (
                                <><User size={20} className="text-purple-400" /> Select Customer</>
                            ) : (
                                <><UserPlus size={20} className="text-green-400" /> Add New Customer</>
                            )}
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
                    </div>

                    <div className="p-4">
                        {/* Mode Toggle */}
                        <div className="flex bg-slate-900 p-1 rounded-xl mb-6">
                            <button
                                onClick={() => setMode('SEARCH')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${mode === 'SEARCH' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Search Existing
                            </button>
                            <button
                                onClick={() => setMode('CREATE')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${mode === 'CREATE' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Quick Add
                            </button>
                        </div>

                        {mode === 'SEARCH' ? (
                            <>
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <input
                                        autoFocus
                                        placeholder="Search by name or phone..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    />
                                </div>

                                <div className="h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {loading && (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                                            <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                                            <p className="text-sm">Searching...</p>
                                        </div>
                                    )}
                                    {!loading && results.length === 0 && query.length > 2 && (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-500 py-4 italic">
                                            No customers found. Try "Quick Add".
                                        </div>
                                    )}
                                    {!loading && query.length <= 2 && (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-600 py-4 text-center">
                                            <Search size={32} className="mb-2 opacity-20" />
                                            <p className="text-xs">Enter at least 2 characters to search</p>
                                        </div>
                                    )}

                                    {results.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => onSelect(c)}
                                            className="w-full text-left p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700 border border-slate-700/50 hover:border-purple-500/50 transition flex justify-between items-center group shadow-sm"
                                        >
                                            <div>
                                                <div className="font-bold text-slate-200 group-hover:text-white transition">{c.firstName} {c.lastName}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Phone size={10} /> {c.phone || 'No Phone'}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-extrabold bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full mb-1 border border-purple-500/20">{c.tier}</div>
                                                <div className="text-[10px] text-slate-400 font-medium">{c.loyaltyPoints} pts</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <form onSubmit={handleCreateCustomer} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1">First Name</label>
                                        <input
                                            required
                                            value={form.firstName}
                                            onChange={e => setForm({ ...form, firstName: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1">Last Name</label>
                                        <input
                                            required
                                            value={form.lastName}
                                            onChange={e => setForm({ ...form, lastName: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1 flex items-center gap-1">
                                        <Phone size={10} /> Phone Number
                                    </label>
                                    <input
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition"
                                        placeholder="08012345678"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1 flex items-center gap-1">
                                        <Mail size={10} /> Email (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1 flex items-center gap-1">
                                        <MapPin size={10} /> Address (Optional)
                                    </label>
                                    <textarea
                                        value={form.address}
                                        onChange={e => setForm({ ...form, address: e.target.value })}
                                        rows={2}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition resize-none"
                                        placeholder="123 Store Street..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-900/20 transition duration-300 mt-2 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    ) : (
                                        <><UserPlus size={18} /> Create & Select Customer</>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
