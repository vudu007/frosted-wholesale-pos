// frontend/src/components/AdjustStockModal.tsx

import { useState } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';

// Define the properties the modal will accept
interface AdjustStockModalProps {
  material: { id: string; name: string; unit: string; };
  onClose: () => void;
  onAdjust: (payload: { quantity: number; reason: string; }) => void;
}

export const AdjustStockModal = ({ material, onClose, onAdjust }: AdjustStockModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('Spoiled');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For spoilage/damage, the quantity sent to the backend should be negative
    // as it's a deduction from stock.
    onAdjust({ quantity: -Math.abs(quantity), reason });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl w-full max-w-md p-6 border border-slate-700 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <SlidersHorizontal size={20} className="text-purple-400"/>
              Adjust Stock
            </h2>
            <p className="text-slate-400 text-sm">Log spoilage, damage, or corrections for: <span className="font-bold text-white">{material.name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="text-sm font-medium text-slate-300">Reason for Adjustment</label>
            <select 
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="mt-1 w-full bg-slate-900 p-3 rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option>Spoiled</option>
              <option>Damaged</option>
              <option>Theft</option>
              <option>Stock Count Correction</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-slate-300">Quantity to Remove ({material.unit})</label>
            <input 
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="mt-1 w-full bg-slate-900 p-3 rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
             <p className="text-xs text-slate-500 mt-1">This amount will be deducted from current stock.</p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
             <button type="button" onClick={onClose} className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded font-bold">
                Cancel
             </button>
             <button type="submit" className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded font-bold">
                Log Adjustment
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};