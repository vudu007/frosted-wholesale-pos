import { useEffect, useState } from 'react';
import api from '../utils/api'; // Use configured API
import { useNavigate } from 'react-router-dom';
import { DollarSign, ArrowLeft, Box, Users, Settings, User, TrendingUp, AlertTriangle, FileText, Receipt, Mail, Server, Lock, ShieldCheck, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTheme } from '../theme';

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState({
    revenue: 0,
    flagged: 0,
    lowStock: 0,
    recent: [] as any[],
    salesTrend: [] as any[]
  });
  const [groupedSales, setGroupedSales] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    businessName: '',
    businessAddress: '',
    reportEmail: '',
    logoUrl: '',
    emailHost: '',
    emailPort: 587,
    emailUser: '',
    emailPass: '',
    emailSecure: false,
    currency: '₦'
  });
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = () => {
    api.get('/reports/dashboard')
      .then((res) => setStats(res.data))
      .catch((err) => {
        console.error("Failed to fetch dashboard stats", err);
        if (err.response?.status === 401) {
          navigate('/');
        }
      });
    api.get('/settings').then(res => setSettings(res.data));
  };

  const fetchGroupedSales = () => {
    setIsRefreshing(true);
    api.get('/reports/sales-by-date')
      .then((res) => {
        setGroupedSales(res.data || []);
        setLastUpdated(new Date());
      })
      .catch((err: any) => {
        console.error("Failed to fetch grouped sales", err);
        const errorMsg = err?.response?.data?.message || err?.message || "Failed to load sales data";
        toast.error(errorMsg);
      })
      .finally(() => setIsRefreshing(false));
  };

  const handleManualRefresh = () => {
    fetchDashboardData();
    fetchGroupedSales();
  };

  const handleSmtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveSmtpSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpLoading(true);
    try {
      await api.patch('/settings', {
        ...settings,
        emailPort: Number(settings.emailPort)
      });
      toast.success('SMTP Settings Securely Saved');
    } catch (err) {
      toast.error('Failed to update Mail Setup');
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const res = await api.post('/settings/upload-logo', formData);
      setSettings(prev => ({ ...prev, logoUrl: res.data.logoUrl }));
      toast.success('Business Logo Updated');
    } catch (err) {
      toast.error('Failed to upload logo');
    }
  };

  const exportSalesToPDF = () => {
    // Use landscape for better column visibility
    const doc = new jsPDF('l', 'mm', 'a4');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const storeName = settings.businessName || 'Enterprise POS';

    // --- Header Section ---
    doc.setFillColor(79, 70, 229); // Indigo-600
    doc.rect(0, 0, 297, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('REAL-TIME SALES REPORT', 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Store: ${storeName}`, 15, 30);
    doc.text(`Exported by: ${user.username || 'Admin'}`, 15, 35);

    const now = new Date();
    doc.text(`Report Type: Grouped by Date`, 282, 20, { align: 'right' });
    doc.text(`Generated: ${now.toLocaleString('en-NG')}`, 282, 25, { align: 'right' });
    doc.text(`Report ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 282, 30, { align: 'right' });

    // --- Totals Summary Boxes ---
    const totalRevenue = groupedSales.reduce((sum, group) => sum + group.revenue, 0);
    const totalTax = groupedSales.reduce((sum, group) => sum + group.tax, 0);
    const totalDiscount = groupedSales.reduce((sum, group) => sum + group.discount, 0);
    const totalTransactions = groupedSales.reduce((sum, group) => sum + group.count, 0);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Daily Sales Summary', 15, 55);

    // Grouped sales table data
    const tableData = groupedSales.map(group => {
      const date = new Date(group.date);
      const avgTransaction = group.count > 0 ? group.revenue / group.count : 0;
      
      return [
        date.toLocaleDateString('en-NG', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        group.count.toString(),
        `₦${group.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `₦${group.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `₦${avgTransaction.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      ];
    });

    autoTable(doc, {
      startY: 60,
      head: [['Date', 'Sales Count', 'Revenue', 'Discounts', 'Avg Transaction']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 40, halign: 'right' },
        4: { cellWidth: 45, halign: 'right' }
      },
      margin: { left: 15, right: 15 },
      didDrawPage: function (data) {
        // Footer - Page Numbers
        const str = 'Page ' + (doc as any).internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(str, 282, 200, { align: 'right' });
      }
    });

    // --- Footer Summary section ---
    let finalY = (doc as any).lastAutoTable.finalY + 15;

    // Check for page overflow
    if (finalY > 150) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Overall Summary', 15, finalY);

    const summaryData = [
      ['Total Days', groupedSales.length.toString()],
      ['Total Transactions', totalTransactions.toString()],
      ['Total Discounts', `₦${totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
      ['NET REVENUE', `₦${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]
    ];

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Description', 'Amount']],
      body: summaryData,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [45, 55, 72] },
      margin: { left: 15 },
      tableWidth: 120
    });

    // Final signature line
    const footerY = Math.max((doc as any).lastAutoTable.finalY + 20, 180);
    doc.setDrawColor(200);
    doc.line(15, footerY, 70, footerY);
    doc.setFontSize(8);
    doc.text('Authorized Signature', 15, footerY + 5);

    // Save with dynamic filename
    const fileName = `SalesReport_Grouped_${storeName.replace(/\s+/g, '_')}_${now.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  useEffect(() => {
    fetchDashboardData();
    fetchGroupedSales();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchGroupedSales();
    }, 30000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className={`min-h-screen p-8 font-sans selection:bg-indigo-500 selection:text-white ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header with Glassmorphism */}
        <div className={`flex flex-col md:flex-row justify-between items-end mb-8 backdrop-blur-lg p-6 rounded-2xl border shadow-xl ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200'}`}>
          <div className="mb-4 md:mb-0">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Enterprise Dashboard
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Real-time store overview & controls</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`px-3 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'}`}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <Link
              to="/admin/settings"
              className={`hover:scale-105 px-4 py-2 rounded-xl flex items-center gap-2 transition duration-300 font-semibold shadow-lg backdrop-blur-md border ${theme === 'dark' ? 'bg-slate-700/50 hover:bg-slate-600/50 border-slate-600 text-slate-100' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'}`}
            >
              <Settings size={18} className="text-indigo-400" /> Settings
            </Link>

            <Link to="/admin/staff" className={`${theme === 'dark' ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border-blue-500/30' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 border-blue-200'} border px-4 py-2 rounded-xl flex items-center gap-2 transition duration-300 font-semibold`}>
              <Users size={18} /> Staff
            </Link>

            <Link to="/admin/customers" className={`${theme === 'dark' ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 border-emerald-500/30' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-900 border-emerald-200'} border px-4 py-2 rounded-xl flex items-center gap-2 transition duration-300 font-semibold`}>
              <User size={18} /> Customers
            </Link>

            <Link to="/admin/forecast" className={`${theme === 'dark' ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 hover:text-amber-200 border-amber-500/30' : 'bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-900 border-amber-200'} border px-4 py-2 rounded-xl flex items-center gap-2 transition duration-300 font-semibold`}>
              <TrendingUp size={18} /> Forecast
            </Link>

            <Link to="/admin/inventory" className={`${theme === 'dark' ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 border-purple-500/30' : 'bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 border-purple-200'} border px-4 py-2 rounded-xl flex items-center gap-2 transition duration-300 font-semibold`}>
              <Box size={18} /> Inventory
            </Link>

            <Link to="/transactions" className={`${theme === 'dark' ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border-indigo-500/30' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border-indigo-200'} border px-4 py-2 rounded-xl flex items-center gap-2 transition duration-300 font-semibold`}>
              <Receipt size={18} /> Transactions
            </Link>

            <Link to="/" className={`${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900'} px-4 py-2 rounded-xl flex items-center gap-2 transition border`}>
              <ArrowLeft size={18} /> POS
            </Link>
          </div>
        </div>

        {/* Integration & Branding Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Branding Settings Panel */}
          <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Branding & Local</h3>
                <p className="text-xs text-slate-400">Company identity and currency</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-950/30 rounded-xl border border-slate-800">
                <div className="w-16 h-16 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center overflow-hidden">
                  {settings.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-contain" alt="Logo" /> : <Box className="text-slate-600" />}
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Business Logo</label>
                  <input type="file" onChange={handleLogoUpload} className="text-xs text-slate-400 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Business Name</label>
                  <input name="businessName" value={settings.businessName} onChange={handleSmtpChange} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Currency Symbol</label>
                  <input name="currency" value={settings.currency} onChange={handleSmtpChange} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-sm" placeholder="₦" />
                </div>
              </div>
              <button onClick={saveSmtpSettings} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition">Save Branding</button>
            </div>
          </div>

          {/* Email Setup Panel */}
          <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Mail Setup</h3>
                  <p className="text-xs text-slate-400">Configure End-of-Sales reporting</p>
                </div>
              </div>
              <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest">Universal SMTP</span>
            </div>

            <form onSubmit={saveSmtpSettings} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">SMTP Host</label>
                  <input name="emailHost" value={settings.emailHost} onChange={handleSmtpChange} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Port</label>
                  <input name="emailPort" type="number" value={settings.emailPort} onChange={handleSmtpChange} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="587" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">User / Email</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-600" size={14} />
                    <input name="emailUser" value={settings.emailUser} onChange={handleSmtpChange} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 pl-9 text-sm focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="pos@example.com" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">App Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-600" size={14} />
                    <input name="emailPass" type="password" value={settings.emailPass} onChange={handleSmtpChange} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 pl-9 text-sm focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="••••••••" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950/30 rounded-xl border border-slate-800/50">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span className="text-xs text-slate-300">SSL/TLS Security</span>
                </div>
                <input type="checkbox" name="emailSecure" checked={settings.emailSecure} onChange={handleSmtpChange} className="w-4 h-4 rounded accent-emerald-500" />
              </div>

              <button disabled={smtpLoading} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2">
                {smtpLoading ? "Saving..." : <><Server size={18} /> Update SMTP Integration</>}
              </button>
            </form>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col justify-center">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3 italic">
              <span className="bg-indigo-500 w-1 h-6 rounded-full inline-block"></span>
              Reporting Destination
            </h3>
            <p className="text-slate-400 text-sm mb-6">Reports are automatically sent during Shift closure (Z-OUT) if a destination email is set.</p>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Recipient Email</label>
              <input name="reportEmail" value={settings.reportEmail} onChange={handleSmtpChange} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="manager@business.com" />
            </div>
            <p className="text-[10px] text-slate-500 mt-2 italic px-1">* This should be the email of the business owner or financial manager.</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-lg group hover:bg-slate-800/60 transition duration-300">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:scale-110 transition duration-300">
                <DollarSign size={28} />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Daily Revenue</p>
                <h3 className="text-3xl font-bold mt-1">₦{stats.revenue ? stats.revenue.toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '0.00'}</h3>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-lg group hover:bg-slate-800/60 transition duration-300">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-amber-500/10 text-amber-400 rounded-xl group-hover:scale-110 transition duration-300">
                <AlertTriangle size={28} />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Low Stock Items</p>
                <h3 className="text-3xl font-bold mt-1 text-amber-500">{stats.lowStock}</h3>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-lg group hover:bg-slate-800/60 transition duration-300">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-rose-500/10 text-rose-400 rounded-xl group-hover:scale-110 transition duration-300">
                <TrendingUp size={28} />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Flagged Shifts</p>
                <h3 className="text-3xl font-bold mt-1 text-rose-500">{stats.flagged}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Sales Trend Chart */}
          <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-lg">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="text-indigo-400" size={20} /> Sales Trend (Last 7 Days)
            </h3>
            <div className="h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.salesTrend || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₦${value / 1000}k`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#818cf8' }}
                    formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-lg">
            <h3 className="text-lg font-bold mb-6 text-slate-200">Recent Shift Activity</h3>
            <div className="space-y-4">
              {stats.recent.length > 0 ? (
                stats.recent.map((shift: any) => (
                  <div key={shift.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-700/50 transition border border-transparent hover:border-slate-600">
                    <div className={`w-2 h-12 rounded-full ${shift.status === 'CLOSED' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                    <div>
                      <p className="font-semibold">{shift.cashier?.username || 'Unknown Cashier'}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •
                        <span className={shift.status === 'CLOSED' ? 'text-green-400 ml-1' : 'text-amber-400 ml-1'}>
                          {shift.status}
                        </span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Sales Report */}
      <div className="bg-slate-800/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <DollarSign className="text-green-400" size={20} />
            Real-Time Sales Report
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Updated: {lastUpdated.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={exportSalesToPDF}
              disabled={groupedSales.length === 0}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition"
            >
              <FileText size={16} />
              Export PDF
            </button>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition"
            >
              <TrendingUp size={16} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {groupedSales.length > 0 ? (
            groupedSales.map((group: any) => {
              const date = new Date(group.date);
              const avgTransaction = group.count > 0 ? group.revenue / group.count : 0;
              
              return (
                <div key={group.date} className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/50 hover:border-purple-500/50 transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-lg font-bold text-indigo-400">
                        {date.toLocaleDateString('en-NG', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {group.count} {group.count === 1 ? 'transaction' : 'transactions'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">
                        {settings.currency || '₦'}{group.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Avg: {settings.currency || '₦'}{avgTransaction.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-600/50">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase mb-1">Discounts</p>
                      <p className="text-sm font-semibold text-amber-400">
                        {settings.currency || '₦'}{group.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase mb-1">Net Revenue</p>
                      <p className="text-sm font-semibold text-emerald-400">
                        {settings.currency || '₦'}{group.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-slate-500 text-center py-8">No sales data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
