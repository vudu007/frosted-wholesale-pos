import { useState } from 'react';
import { Lock, X, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

interface PasswordPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
}

export function PasswordPromptModal({ isOpen, onClose, onConfirm, title, description }: PasswordPromptModalProps) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user.id) throw new Error("User session not found");

            await api.post('/auth/verify-password', {
                userId: user.id,
                pass: password
            });

            toast.success("Identity Verified");
            setPassword('');
            onConfirm();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Verification Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                <ShieldCheck size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-white">{title}</h2>
                        </div>
                        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition">
                            <X size={20} />
                        </button>
                    </div>

                    <p className="text-slate-400 text-sm mb-6">
                        {description}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 text-slate-500 h-4 w-4" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-white"
                                    placeholder="••••••••"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                        >
                            {loading ? "Verifying..." : "Verify & Proceed"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
