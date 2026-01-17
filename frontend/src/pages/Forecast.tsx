import { useEffect, useState } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, Package } from 'lucide-react';

interface ForecastItem {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    avgDailySales: number;
    daysRemaining: number;
    status: 'CRITICAL' | 'LOW' | 'GOOD';
    suggestedRestock: number;
}

export default function Forecast() {
    const [data, setData] = useState<ForecastItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/reports/forecast')
            .then(res => setData(res.data))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/admin" className="p-2 bg-slate-800 rounded hover:bg-slate-700 border border-slate-700"><ArrowLeft size={20} /></Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <TrendingUp className="text-purple-400" /> AI Demand Forecast
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Predictive analysis based on last 30 days of sales.</p>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-500/30 p-6 rounded-2xl">
                        <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2"><AlertTriangle size={20} /> Critical (Out in 3 Days)</h3>
                        <p className="text-4xl font-bold">{data.filter(i => i.status === 'CRITICAL').length}</p>
                        <div className="text-xs text-red-300 mt-2">Immediate action required</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-600/20 to-amber-900/20 border border-amber-500/30 p-6 rounded-2xl">
                        <h3 className="text-amber-400 font-bold mb-2 flex items-center gap-2"><Package size={20} /> Low Stock (Out in 7 Days)</h3>
                        <p className="text-4xl font-bold">{data.filter(i => i.status === 'LOW').length}</p>
                        <div className="text-xs text-amber-300 mt-2">Planning required</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/30 p-6 rounded-2xl">
                        <h3 className="text-green-400 font-bold mb-2 flex items-center gap-2"><CheckCircle size={20} /> Healthy Stock</h3>
                        <p className="text-4xl font-bold">{data.filter(i => i.status === 'GOOD').length}</p>
                        <div className="text-xs text-green-300 mt-2">Sufficient inventory for &gt; 7 days</div>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-slate-700">
                        <h3 className="font-bold text-lg">Inventory Health Report</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-slate-400 text-sm">
                                <tr>
                                    <th className="p-4">Product</th>
                                    <th className="p-4">Current Stock</th>
                                    <th className="p-4">Daily Sales (Avg)</th>
                                    <th className="p-4">Runway (Days)</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right bg-slate-900/50">Suggested Restock</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">Analysing sales patterns...</td></tr>
                                ) : data.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">No inventory data available for forecasting.</td></tr>
                                ) : (
                                    data.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-700/30 transition">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-200">{item.name}</div>
                                                <div className="text-xs text-slate-500">{item.sku}</div>
                                            </td>
                                            <td className="p-4 font-mono">{item.currentStock}</td>
                                            <td className="p-4 font-mono">{item.avgDailySales} / day</td>
                                            <td className="p-4">
                                                <span className={`font-bold ${item.daysRemaining < 3 ? 'text-red-400' :
                                                    item.daysRemaining < 7 ? 'text-amber-400' : 'text-green-400'
                                                    }`}>
                                                    {item.daysRemaining === 999 ? '∞' : item.daysRemaining} Days
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {item.status === 'CRITICAL' && <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded font-bold border border-red-500/30">CRITICAL</span>}
                                                {item.status === 'LOW' && <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded font-bold border border-amber-500/30">LOW</span>}
                                                {item.status === 'GOOD' && <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded font-bold border border-green-500/30">GOOD</span>}
                                            </td>
                                            <td className="p-4 text-right bg-slate-900/30">
                                                {item.suggestedRestock > 0 ? (
                                                    <span className="text-purple-400 font-bold flex items-center justify-end gap-1">
                                                        +{item.suggestedRestock} <span className="text-slate-500 text-xs font-normal">units</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-600 text-xs">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
