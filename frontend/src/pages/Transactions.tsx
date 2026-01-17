import { useState, useEffect } from 'react';
import api from '../utils/api';
import { ArrowLeft, Search, Receipt, Printer, Download, ChevronLeft, ChevronRight, Filter, X, DollarSign, FileText, Calendar, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { generateReceipt, downloadReceiptPDF, generateInvoicePDF } from '../utils/receiptGenerator';
import { useTheme } from '../theme';

type SaleItem = {
  id: string;
  productId: string;
  qty: number;
  price: number;
  product: {
    name: string;
    sku: string;
  };
};

type Payment = {
  id: string;
  paymentType: string;
  amount: number;
};

type Customer = {
  firstName: string;
  lastName: string;
};

type Sale = {
  id: string;
  storeId: string;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  discountType: 'FIXED' | 'PERCENTAGE' | null;
  discountAmount: number | null;
  createdAt: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  tableNumber?: string;
  items: SaleItem[];
  payments: Payment[];
  customer?: Customer;
};

type PaginationMeta = {
  total: number;
  page: number;
  lastPage: number;
};

type CurrentUser = {
  username?: string;
  storeId?: string;
  role?: 'ADMIN' | 'CASHIER';
};

export default function Transactions() {
  const { theme, toggleTheme } = useTheme();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, lastPage: 1 });
  const LIMIT = 20;

  // Refund State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [adminApprovalPassword, setAdminApprovalPassword] = useState('');
  const [showAdminApproval, setShowAdminApproval] = useState(false);

  // Grouped Sales State
  const [viewMode, setViewMode] = useState<'individual' | 'grouped'>('individual');
  const [groupedSales, setGroupedSales] = useState<any[]>([]);
  const [groupedLoading, setGroupedLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}') as CurrentUser;
    setCurrentUser(user);
    loadSales(user.storeId || '', 1, search, dateRange);
  }, []); // Initial load only

  // Check if user is cashier (needs admin approval)
  const isCashier = currentUser?.role === 'CASHIER';
  const isAdmin = currentUser?.role === 'ADMIN';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'PREPARING': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'READY': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'COMPLETED': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'CANCELLED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  // Trigger search when page or filters change
  useEffect(() => {
    if (currentUser?.storeId) {
      // Debounce search slightly to avoid too many requests
      const timeoutId = setTimeout(() => {
        loadSales(currentUser.storeId || '', page, search, dateRange);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [page, search, dateRange]);

  const loadSales = async (storeId: string, pageNum: number, searchQuery: string, dates: { start: string, end: string }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (storeId) params.append('storeId', storeId);
      params.append('page', pageNum.toString());
      params.append('limit', LIMIT.toString());
      if (searchQuery) params.append('search', searchQuery);
      if (dates.start) params.append('startDate', dates.start);
      if (dates.end) params.append('endDate', dates.end);

      const res = await api.get(`/sales?${params.toString()}`);

      // Backend now returns { data: [], meta: {} }
      if (res.data.data) {
        setSales(res.data.data);
        setMeta(res.data.meta);
      } else {
        // Fallback for old API structure if needed (though we updated it)
        setSales(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const loadGroupedSales = async () => {
    setGroupedLoading(true);
    try {
      const res = await api.get('/reports/sales-by-date');
      setGroupedSales(res.data);
    } catch (err: any) {
      console.error("Failed to load grouped report:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to load grouped report";
      toast.error(errorMsg);
    } finally {
      setGroupedLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'grouped') loadGroupedSales();
  }, [viewMode]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.lastPage) {
      setPage(newPage);
    }
  };

  const setPresetDate = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
    setPage(1); // Reset to first page on filter change
  };

  const clearFilters = () => {
    setSearch('');
    setDateRange({ start: '', end: '' });
    setPage(1);
  };

  const exportToCSV = () => {
    if (sales.length === 0) return;

    const headers = ["Date", "Receipt ID", "Customer", "Items", "Total", "Payment Method"];
    const rows = sales.map(sale => [
      new Date(sale.createdAt).toLocaleString(),
      sale.id,
      sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}` : 'Guest',
      sale.items.map(i => `${i.product.name} (x${i.qty})`).join('; '),
      sale.grandTotal.toFixed(2),
      sale.payments.map(p => p.paymentType).join(', ')
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(c => `"${c}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Receipt Logic
  const prepareReceiptData = async (sale: Sale) => {
    const settingsRes = await api.get('/settings');
    const settings = settingsRes.data;
    const businessInfo = {
      name: settings.businessName || 'EmmyPos',
      address: settings.businessAddress || ''
    };
    const logoUrl = settings.logoUrl ? `http://localhost:3000${settings.logoUrl}` : null;
    const currency = settings.currency || '₦';

    const cartItems = sale.items.map(item => ({
      id: item.productId,
      name: item.product.name,
      price: Number(item.price),
      qty: item.qty,
      sku: item.product.sku,
      isComposite: false
    }));

    return { cartItems, businessInfo, logoUrl, currency };
  };

  const handlePrint = async (sale: Sale) => {
    try {
      const { cartItems, businessInfo, logoUrl, currency } = await prepareReceiptData(sale);
      generateReceipt(
        cartItems,
        Number(sale.subtotal),
        Number(sale.taxAmount),
        Number(sale.grandTotal),
        sale.id.slice(0, 8),
        currentUser?.username || 'Cashier',
        businessInfo,
        logoUrl,
        null,
        sale.createdAt,
        currency
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate receipt");
    }
  };

  const handleDownloadPDF = async (sale: Sale) => {
    try {
      const { cartItems, businessInfo, logoUrl, currency } = await prepareReceiptData(sale);
      await downloadReceiptPDF(
        cartItems,
        Number(sale.subtotal),
        Number(sale.taxAmount),
        Number(sale.grandTotal),
        sale.id.slice(0, 8),
        currentUser?.username || 'Cashier',
        businessInfo,
        logoUrl,
        null,
        sale.createdAt,
        currency
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleDownloadInvoice = async (sale: Sale) => {
    try {
      const { cartItems, businessInfo, logoUrl, currency } = await prepareReceiptData(sale);
      await generateInvoicePDF(
        cartItems,
        Number(sale.subtotal),
        Number(sale.taxAmount),
        Number(sale.grandTotal),
        sale.id.slice(0, 8),
        currentUser?.username || 'Cashier',
        businessInfo,
        logoUrl,
        sale.customer ? { name: `${sale.customer.firstName} ${sale.customer.lastName}` } : null,
        new Date(sale.createdAt).toLocaleDateString(),
        currency
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate invoice");
    }
  };

  const openRefundModal = (sale: Sale) => {
    setSelectedSale(sale);
    setRefundReason('');
    setAdminApprovalPassword('');
    setShowAdminApproval(false);
    setShowRefundModal(true);
  };

  const handleAdminApproval = async () => {
    if (!adminApprovalPassword.trim()) {
      toast.error("Please enter admin password");
      return;
    }

    try {
      // Verify admin password by attempting login
      const res = await api.post('/auth/login', {
        username: 'admin',
        pass: adminApprovalPassword
      });

      if (res.data?.user?.role !== 'ADMIN') {
        toast.error("Only admins can approve refunds");
        return;
      }

      setShowAdminApproval(false);
      setAdminApprovalPassword('');
      toast.success("Admin approval verified");
    } catch (error: any) {
      toast.error("Invalid admin password");
      setAdminApprovalPassword('');
    }
  };

  const handleRefund = async () => {
    if (!selectedSale || !refundReason.trim()) {
      toast.error("Please provide a refund reason");
      return;
    }

    // Cashiers need admin approval
    if (isCashier && !showAdminApproval) {
      setShowAdminApproval(true);
      return;
    }

    try {
      await api.post(`/sales/${selectedSale.id}/refund`, {
        reason: refundReason,
        refundedBy: currentUser?.username || 'Unknown',
        approvedBy: isCashier ? 'Admin' : currentUser?.username
      });

      toast.success(`Sale #${selectedSale.id.slice(0, 8)} refunded successfully!`);
      setShowRefundModal(false);
      setSelectedSale(null);
      setRefundReason('');
      setAdminApprovalPassword('');
      setShowAdminApproval(false);

      // Reload sales to reflect changes
      if (currentUser?.storeId) {
        loadSales(currentUser.storeId, page, search, dateRange);
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Failed to process refund";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Link to="/ordering" className="p-2 hover:bg-slate-800 rounded-full transition">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-8 h-8 text-blue-400" />
            Transaction History
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 mr-4">
            <button onClick={() => setViewMode('individual')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'individual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
              <Receipt size={14} /> Individual
            </button>
            <button onClick={() => setViewMode('grouped')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'grouped' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
              <Calendar size={14} /> Grouped (By Date)
            </button>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </header>

      {/* Filters & Search */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by ID or Customer Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-200"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition border ${showFilters ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-750'}`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {viewMode === 'individual' && showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-700 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Date Range:</span>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500"
              />
              <span className="text-slate-500">-</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setPresetDate(0)} className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded">Today</button>
              <button onClick={() => setPresetDate(7)} className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded">Last 7 Days</button>
              <button onClick={() => setPresetDate(30)} className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded">Last 30 Days</button>
            </div>

            <button onClick={clearFilters} className="ml-auto text-sm text-red-400 hover:text-red-300 flex items-center gap-1">
              <X className="w-4 h-4" /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Contents based on View Mode */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
        {viewMode === 'individual' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-750 border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
                  <th className="p-4 font-semibold">Date & Time</th>
                  <th className="p-4 font-semibold">Receipt ID</th>
                  <th className="p-4 font-semibold">Customer</th>
                  <th className="p-4 font-semibold">Items</th>
                  <th className="p-4 font-semibold">Total</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      Loading transactions...
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      <p className="text-lg mb-2">No transactions found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-750 transition group">
                      <td className="p-4 text-slate-300 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium">{new Date(sale.createdAt).toLocaleDateString()}</span>
                          <span className="text-xs text-slate-500">{new Date(sale.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm text-blue-400">#{sale.id.slice(0, 8)}</td>
                      <td className="p-4 text-slate-300">
                        {sale.customer ? (
                          <div>
                            <div className="font-medium">{sale.customer.firstName} {sale.customer.lastName}</div>
                            {/* <div className="text-xs text-slate-500">Tier: {sale.customer.tier || 'Standard'}</div> */}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Guest</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-300 max-w-xs truncate" title={sale.items.map(i => `${i.product.name} (x${i.qty})`).join(', ')}>
                        {sale.items.length} items <span className="text-slate-500 text-xs">({sale.items.slice(0, 2).map(i => i.product.name).join(', ')}{sale.items.length > 2 ? '...' : ''})</span>
                      </td>
                      <td className="p-4 font-bold text-green-400 whitespace-nowrap">
                        ₦{Number(sale.grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        <div className="flex flex-col gap-1">
                          <span className="inline-block px-2 py-1 rounded bg-slate-700 text-xs w-fit">{sale.orderType}</span>
                          {sale.tableNumber && <span className="text-[10px] text-indigo-400 font-bold">Table: {sale.tableNumber}</span>}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(sale.status)}`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handlePrint(sale)}
                            className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition tooltip"
                            title="Reprint Receipt (Thermal)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(sale)}
                            className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadInvoice(sale)}
                            className="p-2 hover:bg-purple-500/20 text-purple-400 rounded-lg transition"
                            title="Download Invoice (A4)"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openRefundModal(sale)}
                            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                            title="Refund Sale"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-750 border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
                  <th className="p-4 font-semibold">Calendar Date</th>
                  <th className="p-4 font-semibold text-center">Sales Count</th>
                  <th className="p-4 font-semibold text-right">Revenue</th>
                  <th className="p-4 font-semibold text-right">Tax Collected</th>
                  <th className="p-4 font-semibold text-right">Avg Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {groupedLoading ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic">Calculating daily aggregates...</td></tr>
                ) : groupedSales.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic">No historical data found.</td></tr>
                ) : (
                  groupedSales.map(g => (
                    <tr key={g.date} className="hover:bg-slate-750 transition">
                      <td className="p-4 font-bold text-indigo-400">{new Date(g.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      <td className="p-4 text-center font-mono">{g.count}</td>
                      <td className="p-4 text-right font-bold text-emerald-400">₦{g.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-right text-indigo-300">₦{(g.revenue / g.count).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer - Only show in Individual mode */}
        {viewMode === 'individual' && (
          <div className="bg-slate-750 p-4 border-t border-slate-700 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Showing page <span className="font-bold text-slate-200">{meta.page}</span> of <span className="font-bold text-slate-200">{meta.lastPage}</span>
              <span className="mx-2">|</span>
              Total: {meta.total} records
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === meta.lastPage}
                className="p-2 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {
        showRefundModal && selectedSale && (
          <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-black/60' : 'bg-white/80'} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
            <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'} rounded-2xl border max-w-md w-full p-6 shadow-2xl`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                  <DollarSign size={24} />
                  Refund Sale #{selectedSale.id.slice(0, 8)}
                </h3>
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} transition`}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                >
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </button>
              </div>

              <div className={`mb-4 p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'} rounded-lg`}>
                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>Amount to be refunded:</p>
                <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>₦{Number(selectedSale.grandTotal).toLocaleString()}</p>

                <div className={`mt-3 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                  <p>Customer: {selectedSale.customer ? `${selectedSale.customer.firstName} ${selectedSale.customer.lastName}` : 'Guest'}</p>
                  <p>Items: {selectedSale.items.map(i => `${i.qty}x ${i.product.name}`).join(', ')}</p>
                  <p>Date: {new Date(selectedSale.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {showAdminApproval && isCashier && (
                <div className={`mb-4 p-4 ${theme === 'dark' ? 'bg-blue-900/20 border-blue-500/30' : 'bg-blue-50 border-blue-200'} border rounded-lg`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} size={18} />
                    <p className={`font-semibold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>Admin Approval Required</p>
                  </div>
                  <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
                    Cashiers require admin password approval to process refunds.
                  </p>
                  <input
                    type="password"
                    value={adminApprovalPassword}
                    onChange={(e) => setAdminApprovalPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className={`w-full ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none`}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { setShowAdminApproval(false); setAdminApprovalPassword(''); }}
                      className={`flex-1 px-3 py-1.5 ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg text-sm font-semibold transition`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAdminApproval}
                      disabled={!adminApprovalPassword.trim()}
                      className={`flex-1 px-3 py-1.5 ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'} disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition`}
                    >
                      Verify
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>Refund Reason *</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className={`w-full ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg p-3 focus:ring-2 focus:ring-red-500 outline-none resize-none`}
                  rows={3}
                  placeholder="e.g., Customer returned damaged item, Wrong order..."
                  required
                />
              </div>

              <div className={`${theme === 'dark' ? 'bg-amber-900/20 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'} border rounded-lg p-3 mb-6`}>
                <p className={`text-xs flex items-start gap-2 ${theme === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}>
                  <span className={`font-bold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>⚠️</span>
                  <span>This action will restore inventory and reverse loyalty points. This cannot be undone.</span>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowRefundModal(false); setSelectedSale(null); setRefundReason(''); setAdminApprovalPassword(''); setShowAdminApproval(false); }}
                  className={`flex-1 px-4 py-2 ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg font-semibold transition`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefund}
                  disabled={!refundReason.trim() || (isCashier && !showAdminApproval)}
                  className={`flex-1 px-4 py-2 ${theme === 'dark' ? 'bg-red-600 hover:bg-red-500' : 'bg-red-500 hover:bg-red-600'} disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition`}
                >
                  {isCashier && !showAdminApproval ? 'Request Approval' : 'Confirm Refund'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
