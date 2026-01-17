import { useState, useEffect } from 'react';
import api from '../utils/api';
import { ArrowLeft, Save, Building, Mail, Image, Server, ShieldCheck, User, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    businessName: '',
    businessAddress: '',
    reportEmail: '',
    logoUrl: '',
    emailHost: '',
    emailPort: 587,
    emailUser: '',
    emailPass: '',
    emailSecure: false
  });
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/settings').then(res => {
      setSettings(res.data);
      if (res.data.logoUrl) {
        setLogoPreview(`${api.defaults.baseURL?.replace('/api', '')}${res.data.logoUrl}`);
      }
    });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setSettings({ ...settings, [name]: finalValue });
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/settings', {
        ...settings,
        emailPort: Number(settings.emailPort)
      });
      toast.success('Settings updated successfully!');
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await api.post('/settings/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSettings(res.data);
      setLogoPreview(`${api.defaults.baseURL?.replace('/api', '')}${res.data.logoUrl}`);
      toast.success('Logo uploaded!');
    } catch {
      toast.error('Logo upload failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 font-sans pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin" className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 border border-slate-700 transition">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">System Settings</h1>
            <p className="text-slate-400 text-sm">Configure store identity and universal integrations</p>
          </div>
        </div>

        <form onSubmit={handleSaveChanges} className="space-y-6">
          {/* General Section */}
          <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-xl">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-3">
              <Building className="text-indigo-400" size={20} />
              <h2 className="text-lg font-bold">Business Identity</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Business Name</label>
                  <input
                    name="businessName"
                    value={settings.businessName || ''}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    placeholder="EmmyPos Enterprise"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Report Recipient Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                    <input
                      type="email"
                      name="reportEmail"
                      value={settings.reportEmail || ''}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900 p-3 pl-11 rounded-xl border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      placeholder="manager@example.com"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 px-1">This email receives Z-OUT summaries and automated reports.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Business Address (Receipts)</label>
                  <textarea
                    name="businessAddress"
                    value={settings.businessAddress || ''}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    rows={4}
                    placeholder="123 Store Street, City, Country"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Store Logo</label>
              <div className="flex flex-wrap items-center gap-6 bg-slate-900/50 p-4 rounded-2xl border border-dashed border-slate-700">
                <div className="w-20 h-20 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Image className="text-slate-600" size={32} />
                  )}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <p className="text-xs text-slate-400 mb-3 font-medium">Clear, high-contrast images work best. Max 2MB (PNG/JPG).</p>
                  <input
                    type="file"
                    onChange={handleLogoUpload}
                    accept="image/png, image/jpeg"
                    className="text-xs file:mr-4 file:py-2 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:transition cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Universal Email Section */}
          <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-xl">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-3">
              <Server className="text-emerald-400" size={20} />
              <h2 className="text-lg font-bold">Universal Email (SMTP)</h2>
              <span className="ml-auto bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">Universal Integration</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">SMTP Host</label>
                    <input
                      name="emailHost"
                      value={settings.emailHost || ''}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Port</label>
                    <input
                      type="number"
                      name="emailPort"
                      value={settings.emailPort || ''}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-1"><User size={12} /> Username / Email</label>
                    <input
                      name="emailUser"
                      value={settings.emailUser || ''}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                      placeholder="pos-reports@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-1"><Lock size={12} /> App Password</label>
                    <input
                      type="password"
                      name="emailPass"
                      value={settings.emailPass || ''}
                      onChange={handleInputChange}
                      className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition font-mono"
                      placeholder="••••••••••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-300">SSL/TLS Secure</label>
                    <input
                      type="checkbox"
                      name="emailSecure"
                      checked={settings.emailSecure}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">Enable for port 465 (Direct SSL) or Gmail/SMTP security standards.</p>
                </div>

                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <ShieldCheck className="text-amber-500 shrink-0" size={18} />
                  <p className="text-[10px] text-amber-200 leading-relaxed">
                    <strong>Security Tip:</strong> When using Gmail, use an "App Password" rather than your main account password.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 px-10 py-4 rounded-2xl font-extrabold flex items-center gap-2 shadow-2xl shadow-indigo-500/20 transition-all duration-300 hover:scale-105"
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <><Save size={20} /> Save All Settings</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}