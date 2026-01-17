import Papa from 'papaparse';
import { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus, Box, Package, SlidersHorizontal, Download, Upload, Edit3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { AdjustStockModal } from '../components/AdjustStockModal';

export default function Inventory() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);

  // Updated state for new fields
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    costPrice: '',
    sku: '',
    barcode: '',
    size: '',
    group: '',
    image: '',
    // isTaxable removed from UI
  });

  const [materialForm, setMaterialForm] = useState({ name: '', unit: 'pcs', stock: '', image: '' });
  const [allocationForm, setAllocationForm] = useState({ materialId: '', quantity: '', reason: '' });

  const [activeTab, setActiveTab] = useState('goods');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);

  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isEditMaterialModalOpen, setIsEditMaterialModalOpen] = useState(false);

  const loadData = () => {
    api.get('/products').then(res => setProducts(res.data));
    api.get('/raw-materials').then(res => setRawMaterials(res.data));
    api.get('/material-allocations').then(res => setAllocations(res.data));
  };
  useEffect(loadData, []);

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post('/uploads/image', formData);
      return res.data.url;
    } catch (err) {
      toast.error("Failed to upload image");
      return null;
    }
  };

  // --- CRUD & Modal Handlers ---
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.storeId) return toast.error("Admin missing Store ID");
    try {
      await api.post('/products', {
        ...productForm,
        price: Number(productForm.price),
        costPrice: Number(productForm.costPrice) || 0,
        storeId: user.storeId
      });
      setProductForm({ name: '', price: '', costPrice: '', sku: '', barcode: '', size: '', group: '', image: '' });
      loadData();
      toast.success("Product created successfully!");
    } catch (err) { toast.error("Error creating product"); }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.storeId) return toast.error("Admin missing Store ID");
    try {
      await api.post('/raw-materials', { ...materialForm, initialStock: Number(materialForm.stock), storeId: user.storeId });
      setMaterialForm({ name: '', unit: 'pcs', stock: '', image: '' });
      loadData();
      toast.success("Material created successfully!");
    } catch (err) { toast.error("Error creating material"); }
  };

  const handleDelete = async (id: string, type: 'product' | 'material') => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      if (type === 'product') {
        await api.delete(`/products/${id}`);
      } else {
        await api.delete(`/raw-materials/${id}`);
      }
      loadData();
      toast.success("Item deleted successfully");
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const handleOpenAdjustModal = (material: any) => { setSelectedMaterial(material); setIsAdjustModalOpen(true); };
  const handleCloseAdjustModal = () => { setSelectedMaterial(null); setIsAdjustModalOpen(false); };

  const handleAdjustSubmit = async (payload: { quantity: number; reason: string; }) => {
    if (!selectedMaterial) return;
    try {
      await api.post('/inventory-adjustments', {
        rawMaterialId: selectedMaterial.id,
        quantityChange: payload.quantity, // backend expects quantityChange
        reason: payload.reason,
        storeId: selectedMaterial.storeId
      });
      loadData();
      handleCloseAdjustModal();
      toast.success("Stock adjusted successfully");
    } catch (error) {
      toast.error("Failed to adjust stock");
    }
  };

  const handleCreateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await api.post('/material-allocations', {
        ...allocationForm,
        quantity: Number(allocationForm.quantity),
        storeId: user.storeId
      });
      toast.success("Materials allocated successfully!");
      setAllocationForm({ materialId: '', quantity: '', reason: '' });
      setIsAllocationModalOpen(false);
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to allocate materials");
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await api.patch(`/products/${editingProduct.id}`, {
        ...editingProduct,
        price: Number(editingProduct.price),
        costPrice: Number(editingProduct.costPrice) || 0
      });
      toast.success("Product updated successfully!");
      setIsEditProductModalOpen(false);
      loadData();
    } catch (err) { toast.error("Error updating product"); }
  };

  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    try {
      await api.patch(`/raw-materials/${editingMaterial.id}`, {
        name: editingMaterial.name,
        unit: editingMaterial.unit,
        image: editingMaterial.image
      });
      toast.success("Material updated successfully!");
      setIsEditMaterialModalOpen(false);
      loadData();
    } catch (err) { toast.error("Error updating material"); }
  };

  const handleDownloadTemplate = () => {
    // Updated CSV Template
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Name,Group,Price,CostPrice,SKU,Barcode,Size,IsTaxable,InitialStock\n"
      + "Example Burger,Food,1500,1000,BURG001,123456789,Large,TRUE,100\n"
      + "Cola,Drinks,500,300,DRK001,,35cl,TRUE,200";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const items = results.data.map((row: any) => ({
          name: row.Name,
          group: row.Group || undefined,
          price: Number(row.Price),
          costPrice: Number(row.CostPrice) || 0,
          sku: row.SKU,
          barcode: row.Barcode || undefined,
          size: row.Size || undefined,
          isTaxable: row.IsTaxable === 'TRUE' || row.IsTaxable === 'true',
          initialStock: Number(row.InitialStock) || 0,
          storeId: JSON.parse(localStorage.getItem('user') || '{}').storeId
        })).filter((i: any) => i.name && i.price && i.sku); // Simple validation

        if (items.length === 0) return toast.error("No valid items found in CSV");

        try {
          await api.post('/products/bulk-import', items);
          toast.success(`Successfully imported ${items.length} products!`);
          loadData();
        } catch (e) {
          toast.error("Failed to import products. Check console.");
          console.error(e);
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (err) => {
        toast.error("Failed to parse CSV file");
        console.error(err);
      }
    });
  };

  return (
    <>
      <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
        <div className="max-w-6xl mx-auto">
          {/* Header and Tabs */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="p-2 bg-slate-800 rounded hover:bg-slate-700 border border-slate-700"><ArrowLeft size={20} /></Link>
              <h1 className="text-3xl font-bold">Inventory Manager</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDownloadTemplate} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg border border-slate-700 font-semibold transition">
                <Download size={18} /> Template
              </button>
              <button onClick={handleImportClick} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition">
                <Upload size={18} /> Import CSV
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                className="hidden"
              />
            </div>
          </div>

          <div className="flex border-b border-slate-700 mb-8">
            <button onClick={() => setActiveTab('goods')} className={`px-4 py-2 flex items-center gap-2 font-bold ${activeTab === 'goods' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500'}`}><Box size={16} /> Finished Goods</button>
            <button onClick={() => setActiveTab('raw')} className={`px-4 py-2 flex items-center gap-2 font-bold ${activeTab === 'raw' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500'}`}><Package size={16} /> Raw Materials</button>
            <button onClick={() => setActiveTab('allocation')} className={`px-4 py-2 flex items-center gap-2 font-bold ${activeTab === 'allocation' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500'}`}><SlidersHorizontal size={16} /> Production Allocations</button>
          </div>

          {/* --- FINISHED GOODS VIEW --- */}
          {activeTab === 'goods' && (
            <div>
              {/* --- NEW EXTENDED FORM --- */}
              <div className="bg-slate-800 p-6 rounded-xl mb-8 border border-slate-700">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-purple-400"><Plus size={18} /> Add New Product</h3>
                <form onSubmit={handleCreateProduct} className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <input placeholder="Product Name" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="bg-slate-900 p-3 rounded flex-1 border border-slate-700" required />
                    <input placeholder="SKU" value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} className="bg-slate-900 p-3 rounded w-32 border border-slate-700" required />
                    <input placeholder="Barcode (Optional)" value={productForm.barcode} onChange={e => setProductForm({ ...productForm, barcode: e.target.value })} className="bg-slate-900 p-3 rounded w-40 border border-slate-700" />
                  </div>
                  <div className="flex gap-4 items-center">
                    <input placeholder="Cost Price (₦)" type="number" step="0.01" value={productForm.costPrice} onChange={e => setProductForm({ ...productForm, costPrice: e.target.value })} className="bg-slate-900 p-3 rounded w-32 border border-slate-700" />
                    <input placeholder="Selling Price (₦)" type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} className="bg-slate-900 p-3 rounded w-32 border border-slate-700" required />
                    <input placeholder="Size (e.g. 50cl)" value={productForm.size} onChange={e => setProductForm({ ...productForm, size: e.target.value })} className="bg-slate-900 p-3 rounded w-32 border border-slate-700" />
                    <input placeholder="Product Group" value={productForm.group} onChange={e => setProductForm({ ...productForm, group: e.target.value })} className="bg-slate-900 p-3 rounded flex-1 border border-slate-700" />

                    <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-3 rounded border border-slate-700">
                      <input type="checkbox" checked={productForm.isTaxable} onChange={e => setProductForm({ ...productForm, isTaxable: e.target.checked })} className="accent-purple-500 w-4 h-4" />
                      <span className="text-sm">Taxable</span>
                    </label>

                    <input type="file" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleImageUpload(file);
                        if (url) setProductForm({ ...productForm, image: url });
                      }
                    }} className="text-xs text-slate-500 w-48" />

                    <button type="submit" className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded font-bold ml-auto">Add Product</button>
                  </div>
                  {/* Markup Indicator */}
                  {productForm.price && productForm.costPrice && (
                    <div className="text-xs text-slate-400">
                      Markup: <span className="text-green-400 font-bold">{(((Number(productForm.price) - Number(productForm.costPrice)) / Number(productForm.costPrice)) * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </form>
              </div>

              {/* The Product Table */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400">
                    <tr>
                      <th className="p-4 w-16">Img</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Group</th>
                      <th className="p-4">Size</th>
                      <th className="p-4">SKU / Barcode</th>
                      <th className="p-4">Cost</th>
                      <th className="p-4">Price</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr><td colSpan={7} className="p-4 text-center text-slate-500">No products found.</td></tr>
                    ) : (
                      products.map(p => (
                        <tr key={p.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                          <td className="p-4">
                            <div className="w-10 h-10 bg-slate-900 rounded overflow-hidden border border-slate-700 flex items-center justify-center">
                              {p.image ? <img src={p.image} className="w-full h-full object-cover" alt="" /> : <Box size={16} className="text-slate-700" />}
                            </div>
                          </td>
                          <td className="p-4 font-medium">{p.name}</td>
                          <td className="p-4 text-xs">
                            <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded-full">{p.group || 'General'}</span>
                          </td>
                          <td className="p-4 text-slate-400 text-sm">{p.size || '-'}</td>
                          <td className="p-4 text-slate-400 text-sm">
                            <div className="font-mono">{p.sku}</div>
                            {p.barcode && <div className="text-xs text-slate-500">{p.barcode}</div>}
                          </td>
                          <td className="p-4 text-slate-500">₦{Number(p.costPrice || 0).toFixed(2)}</td>
                          <td className="p-4 text-green-400 font-bold">₦{Number(p.price).toFixed(2)}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => { setEditingProduct(p); setIsEditProductModalOpen(true); }} className="text-blue-400 hover:text-blue-300 p-2"><Edit3 size={18} /></button>
                            <button onClick={() => handleDelete(p.id, 'product')} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={18} /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- RAW MATERIALS VIEW --- */}
          {activeTab === 'raw' && (
            <div>
              <div className="bg-slate-800 p-6 rounded-xl mb-8 border border-slate-700">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-purple-400"><Plus size={18} /> Add New Raw Material</h3>
                <form onSubmit={handleCreateMaterial} className="flex gap-4">
                  <input placeholder="Material Name (e.g. Yeast)" value={materialForm.name} onChange={e => setMaterialForm({ ...materialForm, name: e.target.value })} className="bg-slate-900 p-3 rounded flex-1 border border-slate-700" required />
                  <select value={materialForm.unit} onChange={e => setMaterialForm({ ...materialForm, unit: e.target.value })} className="bg-slate-900 p-3 rounded border border-slate-700 w-32">
                    <option value="pcs">pcs</option><option value="kg">kg</option><option value="liters">liters</option><option value="g">g</option>
                  </select>
                  <input placeholder="Initial Stock" type="number" step="0.01" value={materialForm.stock} onChange={e => setMaterialForm({ ...materialForm, stock: e.target.value })} className="bg-slate-900 p-3 rounded w-32 border border-slate-700" required />
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await handleImageUpload(file);
                      if (url) setMaterialForm({ ...materialForm, image: url });
                    }
                  }} className="text-xs text-slate-500 w-48" />
                  <button type="submit" className="bg-green-600 hover:bg-green-500 px-6 rounded font-bold">Add</button>
                </form>
              </div>
              {/* The Raw Materials Table */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400">
                    <tr>
                      <th className="p-4 w-16">Img</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Stock Level</th>
                      <th className="p-4">Unit</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawMaterials.length === 0 ? (
                      <tr><td colSpan={4} className="p-4 text-center text-slate-500">No raw materials found.</td></tr>
                    ) : (
                      rawMaterials.map(m => (
                        <tr key={m.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                          <td className="p-4">
                            <div className="w-10 h-10 bg-slate-900 rounded overflow-hidden border border-slate-700 flex items-center justify-center">
                              {m.image ? <img src={m.image} className="w-full h-full object-cover" alt="" /> : <Package size={16} className="text-slate-700" />}
                            </div>
                          </td>
                          <td className="p-4 font-medium">{m.name}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${m.stock < 10 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                              {m.stock}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">{m.unit}</td>
                          <td className="p-4 text-right flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setAllocationForm({ ...allocationForm, materialId: m.id }); setIsAllocationModalOpen(true); }}
                              className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 px-3 py-1 rounded text-xs font-bold transition"
                            >
                              Allocate
                            </button>
                            <button onClick={() => { setEditingMaterial(m); setIsEditMaterialModalOpen(true); }} className="text-yellow-400 hover:text-yellow-300 p-2" title="Edit"><Edit3 size={18} /></button>
                            <button onClick={() => handleOpenAdjustModal(m)} className="text-blue-400 hover:text-blue-300 p-2" title="Adjust Stock"><SlidersHorizontal size={18} /></button>
                            <button onClick={() => handleDelete(m.id, 'material')} className="text-red-400 hover:text-red-300 p-2" title="Delete"><Trash2 size={18} /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'allocation' && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl animate-in fade-in duration-300">
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold flex items-center gap-2">Production Allocation History</h2>
                <p className="text-xs text-slate-500 mt-1">Movement of raw materials into production phases</p>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-extrabold tracking-widest">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Material</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Reason / Batch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {allocations.length === 0 ? (
                    <tr><td colSpan={4} className="p-12 text-center text-slate-500 italic">No allocations recorded.</td></tr>
                  ) : (
                    allocations.map(a => (
                      <tr key={a.id} className="hover:bg-slate-700/30 transition">
                        <td className="p-4 text-sm text-slate-400">{new Date(a.allocatedAt).toLocaleString()}</td>
                        <td className="p-4 font-bold">{a.material?.name}</td>
                        <td className="p-4">
                          <span className="bg-rose-500/10 text-rose-400 px-3 py-1 rounded-full font-mono font-bold">-{Number(a.quantity).toFixed(2)} {a.material?.unit}</span>
                        </td>
                        <td className="p-4 text-xs italic text-slate-300">{a.reason || 'Not specified'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Allocation Modal */}
      {isAllocationModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">Material Allocation</h3>
              <button onClick={() => setIsAllocationModalOpen(false)} className="text-slate-500 hover:text-white"><Plus size={24} className="rotate-45" /></button>
            </div>
            <form onSubmit={handleCreateAllocation} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Source Material</label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  value={allocationForm.materialId}
                  onChange={e => setAllocationForm({ ...allocationForm, materialId: e.target.value })}
                  required
                >
                  <option value="">Select Raw Material...</option>
                  {rawMaterials.map(m => (
                    <option key={m.id} value={m.id} className="bg-slate-800">{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Quantity to Deplete</label>
                <input
                  type="number" step="0.01"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  placeholder="0.00"
                  value={allocationForm.quantity}
                  onChange={e => setAllocationForm({ ...allocationForm, quantity: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Production Reason / Batch #</label>
                <textarea
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  rows={3}
                  placeholder="e.g. Allocation for Burger Bun Batch #102"
                  value={allocationForm.reason}
                  onChange={e => setAllocationForm({ ...allocationForm, reason: e.target.value })}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAllocationModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-bold transition">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition">Confirm Allocation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditProductModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">Edit Finished Good</h3>
              <button onClick={() => setIsEditProductModalOpen(false)} className="text-slate-500 hover:text-white"><Plus size={24} className="rotate-45" /></button>
            </div>
            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Product Name</label>
                  <input className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Selling Price (₦)</label>
                  <input type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Cost Price (₦)</label>
                  <input type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3" value={editingProduct.costPrice} onChange={e => setEditingProduct({ ...editingProduct, costPrice: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">SKU</label>
                  <input className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3" value={editingProduct.sku} onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Barcode</label>
                  <input className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3" value={editingProduct.barcode || ''} onChange={e => setEditingProduct({ ...editingProduct, barcode: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Size</label>
                  <input className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3" value={editingProduct.size || ''} onChange={e => setEditingProduct({ ...editingProduct, size: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Product Group</label>
                  <input className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3" value={editingProduct.group || ''} onChange={e => setEditingProduct({ ...editingProduct, group: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-5 h-5 accent-purple-500" checked={editingProduct.isTaxable} onChange={e => setEditingProduct({ ...editingProduct, isTaxable: e.target.checked })} id="edit-taxable" />
                  <label htmlFor="edit-taxable" className="font-bold text-sm">Taxable Product</label>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Change Product Image</label>
                  <div className="flex items-center gap-4">
                    {editingProduct.image && <img src={editingProduct.image} className="w-16 h-16 object-cover rounded-lg border border-slate-700" alt="" />}
                    <input type="file" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleImageUpload(file);
                        if (url) setEditingProduct({ ...editingProduct, image: url });
                      }
                    }} className="text-xs text-slate-500" />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsEditProductModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-bold transition">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Material Modal */}
      {isEditMaterialModalOpen && editingMaterial && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">Edit Raw Material</h3>
              <button onClick={() => setIsEditMaterialModalOpen(false)} className="text-slate-500 hover:text-white"><Plus size={24} className="rotate-45" /></button>
            </div>
            <form onSubmit={handleUpdateMaterial} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Material Name</label>
                <input className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3" value={editingMaterial.name} onChange={e => setEditingMaterial({ ...editingMaterial, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Unit of Measure</label>
                <select className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3" value={editingMaterial.unit} onChange={e => setEditingMaterial({ ...editingMaterial, unit: e.target.value })} required>
                  <option value="pcs">pcs</option><option value="kg">kg</option><option value="liters">liters</option><option value="g">g</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Change Material Image</label>
                <div className="flex items-center gap-4">
                  {editingMaterial.image && <img src={editingMaterial.image} className="w-16 h-16 object-cover rounded-lg border border-slate-700" alt="" />}
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await handleImageUpload(file);
                      if (url) setEditingMaterial({ ...editingMaterial, image: url });
                    }
                  }} className="text-xs text-slate-500" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsEditMaterialModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-bold transition">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAdjustModalOpen && selectedMaterial && (<AdjustStockModal material={selectedMaterial} onClose={handleCloseAdjustModal} onAdjust={handleAdjustSubmit} />)}
    </>
  );
}