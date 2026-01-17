import { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2, Wallet } from 'lucide-react';

interface Payment { type: string; amount: number; }
interface PaymentModalProps {
  grandTotal: number;
  onFinalize: (payments: Payment[]) => void;
  onClose: () => void;
  loading: boolean;
}

export default function PaymentModal({ grandTotal, onFinalize, onClose, loading }: PaymentModalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentType, setPaymentType] = useState('Cash');
  const [tenderedAmount, setTenderedAmount] = useState<number | string>('');

  // --- THIS IS THE CORRECT AND COMPLETE LOGIC ---
  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
  const amountDue = useMemo(() => grandTotal - totalPaid, [grandTotal, totalPaid]);
  const changeDue = useMemo(() => (totalPaid > grandTotal) ? totalPaid - grandTotal : 0, [totalPaid, grandTotal]);

  useEffect(() => {
    setTenderedAmount(parseFloat(amountDue.toFixed(2)));
  }, [amountDue]);

  const handleAddPayment = () => {
    const amount = Number(tenderedAmount);
    if (amount <= 0 || isNaN(amount)) return;
    const newPayment: Payment = { type: paymentType, amount };
    setPayments([...payments, newPayment]);
  };

  const handleRemovePayment = (indexToRemove: number) => {
    setPayments(payments.filter((_, index) => index !== indexToRemove));
  };
  
  const isFinalizable = totalPaid >= grandTotal;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl w-full max-w-lg p-6 border border-slate-700 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Process Payment</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full"><X size={20}/></button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900 p-4 rounded-lg text-center">
            <p className="text-slate-400">Total Bill</p>
            <h3 className="text-3xl font-bold text-white">₦{grandTotal.toFixed(2)}</h3>
          </div>
          <div className={`p-4 rounded-lg text-center ${isFinalizable ? 'bg-green-500/10' : 'bg-purple-500/10'}`}>
            <p className={`${isFinalizable ? 'text-green-400' : 'text-purple-400'}`}>Amount Due</p>
            <h3 className={`text-3xl font-bold ${isFinalizable ? 'text-green-400' : 'text-purple-400'}`}>
              {isFinalizable ? '₦0.00' : `₦${amountDue.toFixed(2)}`}
            </h3>
          </div>
        </div>
        
        <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
            {payments.map((p, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg">
                    <span className="font-medium flex items-center gap-2"><Wallet size={16}/> {p.type}</span>
                    <div className="flex items-center gap-3">
                        <span className="font-bold">₦{p.amount.toFixed(2)}</span>
                        <button onClick={() => handleRemovePayment(i)} className="text-red-400 hover:text-red-300"><Trash2 size={16}/></button>
                    </div>
                </div>
            ))}
        </div>

        {!isFinalizable && (
            <div className="flex gap-2 items-end border-t border-slate-700 pt-4">
                <div className="flex-1">
                    <label className="text-xs text-slate-400">Tendered Amount</label>
                    <input type="number" value={tenderedAmount} onChange={e => setTenderedAmount(e.target.value)} className="bg-slate-700 p-3 rounded w-full mt-1" step="0.01"/>
                </div>
                <div className="w-1/3">
                    <label className="text-xs text-slate-400">Method</label>
                    <select value={paymentType} onChange={e => setPaymentType(e.target.value)} className="bg-slate-700 p-3 rounded w-full mt-1">
                        <option>Cash</option><option>Card</option><option>Transfer</option>
                    </select>
                </div>
                <button onClick={handleAddPayment} className="bg-blue-600 hover:bg-blue-500 p-3 rounded font-bold" title="Add Payment"><Plus /></button>
            </div>
        )}
        
        <div className="mt-6">
            {changeDue > 0 && (
                <div className="bg-amber-500/10 text-amber-400 p-3 rounded-lg text-center mb-4">
                    <p className="font-bold">Change Due: ₦{changeDue.toFixed(2)}</p>
                </div>
            )}
            <button onClick={() => onFinalize(payments)} disabled={!isFinalizable || loading} className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-lg font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : ( 'Finalize Sale' )}
            </button>
        </div>
      </div>
    </div>
  );
}