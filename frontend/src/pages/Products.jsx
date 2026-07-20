import { useState, useEffect, useRef, useCallback } from 'react';
import { productsAPI, categoriesAPI, bulkAPI } from '../services/api';
import { UZ, formatCurrency } from '../utils/uzbek';
import { getErrorMessage } from '../utils/errors';
import { emitDataChanged } from '../utils/events';
import { HiOutlinePlus, HiOutlineMagnifyingGlass, HiOutlinePencil, HiOutlineTrash, HiOutlineQrCode, HiOutlineXMark, HiOutlinePhoto, HiOutlineArrowUpTray, HiOutlineArrowDownTray, HiOutlineCurrencyDollar, HiOutlineDocumentArrowUp, HiOutlineCamera } from 'react-icons/hi2';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

const FALLBACK_IMG = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect fill="%23f3f4f6" width="80" height="80" rx="8"/><text x="40" y="48" text-anchor="middle" fill="%239ca3af" font-size="24">📦</text></svg>';

function ProductImage({ src, name, size = 'w-9 h-9' }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className={`${size} rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 flex items-center justify-center text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0`}>
        {name?.charAt(0)?.toUpperCase() || '📦'}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      className={`${size} rounded-lg object-cover flex-shrink-0`}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}

function BarcodeDisplay({ value, type = 'barcode' }) {
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  useEffect(() => {
    if (type === 'barcode' && svgRef.current && value) {
      try { JsBarcode(svgRef.current, value, { format: 'CODE128', width: 1.5, height: 40, displayValue: true, fontSize: 12, margin: 5 }); } catch {}
    }
    if (type === 'qrcode' && canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, { width: 120, margin: 2 }, () => {});
    }
  }, [value, type]);
  if (type === 'barcode') return <svg ref={svgRef} />;
  return <canvas ref={canvasRef} />;
}

function ProductModal({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product?.name || '', category_id: product?.category_id || '',
    brand: product?.brand || '', purchase_price: product?.purchase_price || '',
    selling_price: product?.selling_price || '', stock_quantity: product?.stock_quantity || 0,
    minimum_stock: product?.minimum_stock || 0, unit: product?.unit || 'pcs',
    barcode: product?.barcode || '', image_url: product?.image_url || '',
    description: product?.description || '', status: product?.status || 'active',
  });
  const [saving, setSaving] = useState(false);
  const [barcodePreview, setBarcodePreview] = useState(null);
  const barcodeSvgRef = useRef(null);

  const generateBarcode = () => {
    const code = product?.product_code || ('PRD-' + Date.now().toString().slice(-6));
    setForm(f => ({ ...f, barcode: code }));
  };

  useEffect(() => {
    if (barcodePreview && barcodeSvgRef.current) {
      try { JsBarcode(barcodeSvgRef.current, barcodePreview, { format: 'CODE128', width: 1.5, height: 40, displayValue: true, fontSize: 12, margin: 5 }); } catch {}
    }
  }, [barcodePreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, category_id: form.category_id ? parseInt(form.category_id) : null, purchase_price: parseFloat(form.purchase_price) || 0, selling_price: parseFloat(form.selling_price) || 0, stock_quantity: parseInt(form.stock_quantity) || 0, minimum_stock: parseInt(form.minimum_stock) || 0 };
      if (product) { await productsAPI.update(product.id, payload); toast.success("Mahsulot yangilandi"); }
      else { await productsAPI.create(payload); toast.success("Mahsulot qo'shildi"); }
      emitDataChanged();
      onSave();
    } catch (err) { toast.error(getErrorMessage(err, "Saqlashda xato")); } finally { setSaving(false); }
  };

  const units = ['pcs','kg','g','l','ml','box','bag','bottle','jar','pack'];
  const unitLabels = { pcs: UZ.pcs, kg: UZ.kg, g: UZ.g, l: UZ.l, ml: UZ.ml, box: UZ.box, bag: UZ.bag, bottle: UZ.bottle, jar: UZ.jar, pack: UZ.pack };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-content">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{product ? UZ.editProduct : UZ.addProduct}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.productName} *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.category}</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">{UZ.noCategory}</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.brand}</label>
              <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.barcode}</label>
              <div className="flex gap-2">
                <input type="text" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="input-field flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                <button type="button" onClick={generateBarcode} className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Generatsiya
                </button>
              </div>
              {form.barcode && (
                <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 inline-block">
                  <svg ref={barcodeSvgRef} />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.unit}</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {units.map((u) => <option key={u} value={u}>{unitLabels[u] || u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.purchasePrice}</label>
              <input type="number" step="0.01" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.sellingPrice}</label>
              <input type="number" step="0.01" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.stockQuantity}</label>
              <input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.minimumStock}</label>
              <input type="number" value={form.minimum_stock} onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.status}</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="active">{UZ.active}</option>
                <option value="inactive">{UZ.inactive}</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.description}</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <span className="flex items-center gap-1.5"><HiOutlinePhoto className="w-4 h-4" /> Ras URL (ixtiyoriy)</span>
              </label>
              <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="https://example.com/rasm.jpg" />
              {form.image_url && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={form.image_url} alt="Ko'rish" className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700" onError={(e) => e.target.style.display='none'} />
                  <span className="text-xs text-gray-500">Rasm ko'rinishi</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn-secondary">{UZ.cancel}</button>
            <button type="submit" disabled={saving} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-all disabled:opacity-50">
              {saving ? UZ.loading : product ? UZ.save : UZ.add}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LabelPrintModal({ product, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg modal-content">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{UZ.labels}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6 print:p-2">
          <div className="text-center border-b pb-4 no-print">
            <h3 className="font-bold text-gray-900 dark:text-white">{product.name}</h3>
            <p className="text-sm text-gray-500">{product.product_code}</p>
          </div>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-xs font-medium text-gray-500 mb-2">{UZ.barcode}</p>
              <BarcodeDisplay value={product.barcode || product.product_code} type="barcode" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-gray-500 mb-2">QR Code</p>
              <BarcodeDisplay value={product.barcode || product.product_code} type="qrcode" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 no-print">
          <button onClick={onClose} className="btn-secondary">{UZ.close}</button>
          <button onClick={() => window.print()} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700">{UZ.print}</button>
        </div>
      </div>
    </div>
  );
}

function BulkPriceModal({ products, onClose, onApply }) {
  const [mode, setMode] = useState('percent');
  const [value, setValue] = useState('');
  const [field, setField] = useState('selling_price');
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    if (!value || isNaN(parseFloat(value))) { toast.error("Qiymat kiriting"); return; }
    setApplying(true);
    try {
      const updates = products.map(p => {
        const currentPrice = parseFloat(p[field]) || 0;
        let newPrice;
        if (mode === 'percent') {
          newPrice = Math.round(currentPrice * (1 + parseFloat(value) / 100));
        } else if (mode === 'fixed') {
          newPrice = currentPrice + parseFloat(value);
        } else {
          newPrice = parseFloat(value);
        }
        return { id: p.id, [field]: Math.max(0, newPrice) };
      });
      await bulkAPI.updatePrices(updates);
      toast.success(`${updates.length} ta mahsulot narxi yangilandi!`);
      onApply();
    } catch (err) {
      toast.error(getErrorMessage(err, "Xatolik"));
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg modal-content">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <HiOutlineCurrencyDollar className="w-5 h-5" /> Narxlarni to'g'irlash
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">{products.length} ta mahsulot tanlangan</p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qaysi narxni o'zgartirasiz?</label>
            <select value={field} onChange={(e) => setField(e.target.value)} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="selling_price">Sotish narxi</option>
              <option value="purchase_price">Sotib narxi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">O'zgartirish usuli</label>
            <div className="grid grid-cols-3 gap-2">
              {[['percent', 'Foiz (%)'], ['fixed', "Qo'shish"], ['exact', 'Aniq qiymat']].map(([m, l]) => (
                <button key={m} onClick={() => setMode(m)} className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${mode === m ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {mode === 'percent' ? 'Foiz miqdori' : mode === 'fixed' ? "Qo'shiladigan summa" : 'Yangi narx'}
            </label>
            <input type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={mode === 'percent' ? 'Masalan: 10' : 'Masalan: 5000'} />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm">
            <p className="text-gray-500">Namuna:</p>
            {products.slice(0, 3).map((p, i) => {
              const current = parseFloat(p[field]) || 0;
              let newP;
              if (mode === 'percent') newP = Math.round(current * (1 + (parseFloat(value) || 0) / 100));
              else if (mode === 'fixed') newP = current + (parseFloat(value) || 0);
              else newP = parseFloat(value) || current;
              return (
                <div key={i} className="flex justify-between mt-1">
                  <span className="text-gray-600 dark:text-gray-400 truncate">{p.name}</span>
                  <span className="font-medium">{formatCurrency(current)} → {formatCurrency(Math.max(0, newP))}</span>
                </div>
              );
            })}
            {products.length > 3 && <p className="text-gray-400 mt-1">...va yana {products.length - 3} ta</p>}
          </div>

          <button onClick={handleApply} disabled={applying || !value} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50">
            {applying ? UZ.loading : `Qo'llash (${products.length} ta)`}
          </button>
        </div>
      </div>
    </div>
  );
}

function CSVImportModal({ onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('create');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const handleImport = async () => {
    if (!file) { toast.error("Faylni tanlang"); return; }
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);
      const { data } = await bulkAPI.importCSV(formData);
      toast.success(`${data.imported} ta qo'shildi, ${data.updated || 0} ta yangilandi`);
      if (data.errors?.length > 0) {
        toast.error(`${data.errors.length} ta xatolik`);
      }
      onImport();
    } catch (err) {
      toast.error(getErrorMessage(err, "Import xatosi"));
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const { data } = await bulkAPI.exportCSV();
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products_export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("CSV yuklab olindi");
    } catch (err) {
      toast.error("Eksport xatosi");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg modal-content">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <HiOutlineDocumentArrowUp className="w-5 h-5" /> CSV Import / Eksport
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-300 mb-2">CSV formati:</p>
            <p className="text-blue-600 dark:text-blue-400">name, barcode, brand, category, selling_price, purchase_price, stock_quantity, minimum_stock, unit</p>
            <p className="text-blue-500 dark:text-blue-400 mt-1 text-xs">name majburiy. barcode bo'sh bo'lsa avtomatik generatsiya qilinadi.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Import rejimi</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setMode('create')} className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${mode === 'create' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-gray-200 dark:border-gray-700'}`}>
                Yangi qo'shish
              </button>
              <button onClick={() => setMode('update')} className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${mode === 'update' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700'}`}>
                Yangilash (barcode bo'yicha)
              </button>
            </div>
          </div>

          <div>
            <input ref={fileRef} type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0])} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors">
              <HiOutlineArrowUpTray className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              {file ? <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p> : <p className="text-sm text-gray-500">CSV faylni tanlang yoki tortib tashlang</p>}
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={handleExport} className="flex-1 btn-secondary flex items-center justify-center gap-2">
              <HiOutlineArrowDownTray className="w-4 h-4" /> CSV yuklab olish
            </button>
            <button onClick={handleImport} disabled={importing || !file} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <HiOutlineArrowUpTray className="w-4 h-4" /> {importing ? UZ.loading : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [labelProduct, setLabelProduct] = useState(null);
  const [showBulkPrice, setShowBulkPrice] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const searchTimeout = useRef(null);

  useEffect(() => { loadCategories(); loadProducts(); }, []);

  useEffect(() => {
    const handler = () => { loadProducts(pagination.page); loadCategories(); };
    window.addEventListener('pos:data-changed', handler);
    return () => window.removeEventListener('pos:data-changed', handler);
  }, [pagination.page]);

  const debouncedSearch = useCallback((val) => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => { loadProducts(1); }, 300);
  }, []);

  useEffect(() => { debouncedSearch(search); }, [search, categoryFilter]);

  const loadCategories = async () => { try { const { data } = await categoriesAPI.getAll(); setCategories(data?.categories || []); } catch { setCategories([]); } };
  const loadProducts = async (page = 1) => {
    setLoading(true);
    try { const { data } = await productsAPI.getAll({ search, category_id: categoryFilter, page, limit: 50 }); setProducts(data?.products || []); setPagination(data?.pagination || { page: 1, total: 0 }); }
    catch { toast.error("Mahsulotlar yuklanmadi"); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try { await productsAPI.delete(deleteProduct.id); toast.success("O'chirildi"); setDeleteProduct(null); loadProducts(pagination.page); emitDataChanged(); }
    catch (err) { toast.error(getErrorMessage(err, "O'chirishda xato")); }
  };

  const toggleSelect = (id) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const getSelectedProducts = () => products.filter(p => selectedProducts.has(p.id));

  const getStockStatus = (p) => {
    if (p.stock_quantity === 0) return <span className="badge-danger">{UZ.outOfStockStatus}</span>;
    if (p.stock_quantity <= p.minimum_stock) return <span className="badge-warning">{UZ.lowStockStatus}</span>;
    return <span className="badge-success">{UZ.inStockStatus}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{UZ.productsTitle}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pagination.total} {UZ.total}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowCSVImport(true)} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2 text-sm">
            <HiOutlineDocumentArrowUp className="w-4 h-4" /> CSV
          </button>
          {selectedProducts.size > 0 && (
            <button onClick={() => setShowBulkPrice(true)} className="bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center gap-2 text-sm animate-scale-in">
              <HiOutlineCurrencyDollar className="w-4 h-4" /> Narx o'zgartirish ({selectedProducts.size})
            </button>
          )}
          <button onClick={() => { setEditProduct(null); setShowModal(true); }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-all flex items-center gap-2">
            <HiOutlinePlus className="w-5 h-5" /> {UZ.addProduct}
          </button>
        </div>
      </div>

      <div className="card animate-fade-in-up stagger-1">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder={UZ.search + ' (nom, kod, shtrix-kod, brend)...'} value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field w-auto sm:w-48 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">{UZ.allCategories}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.product_count})</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin h-6 w-6 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-400">{UZ.noData}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-3 font-medium w-8">
                    <input type="checkbox" checked={selectedProducts.size === products.length && products.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-emerald-600" />
                  </th>
                  <th className="pb-3 font-medium">{UZ.productsTitle}</th>
                  <th className="pb-3 font-medium">{UZ.productCode}</th>
                  <th className="pb-3 font-medium hidden md:table-cell">{UZ.category}</th>
                  <th className="pb-3 font-medium text-right">{UZ.sellingPrice.replace(' *','')}</th>
                  <th className="pb-3 font-medium text-right">{UZ.stockQuantity}</th>
                  <th className="pb-3 font-medium">{UZ.status}</th>
                  <th className="pb-3 font-medium text-right">{UZ.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {products.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedProducts.has(product.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                    <td className="py-3">
                      <input type="checkbox" checked={selectedProducts.has(product.id)} onChange={() => toggleSelect(product.id)} className="w-4 h-4 rounded border-gray-300 text-emerald-600" />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <ProductImage src={product.image_url} name={product.name} />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                          {product.brand && <p className="text-xs text-gray-500">{product.brand}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{product.product_code}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">{product.category_name || '-'}</td>
                    <td className="py-3 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(product.selling_price)}</td>
                    <td className="py-3 text-right">
                      <span className={`font-medium ${product.stock_quantity <= product.minimum_stock ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                        {product.stock_quantity}
                      </span>
                      <span className="text-gray-400 text-xs ml-1">{product.unit}</span>
                    </td>
                    <td className="py-3">{getStockStatus(product)}</td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setLabelProduct(product)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title={UZ.labels}><HiOutlineQrCode className="w-4 h-4" /></button>
                        <button onClick={() => { setEditProduct(product); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600" title={UZ.edit}><HiOutlinePencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteProduct(product)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600" title={UZ.delete}><HiOutlineTrash className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500">Sahifa {pagination.page} / {pagination.totalPages} ({pagination.total} ta)</p>
            <div className="flex gap-1">
              <button disabled={pagination.page <= 1} onClick={() => loadProducts(pagination.page - 1)} className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50">Oldingi</button>
              {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                let p;
                if (pagination.totalPages <= 7) p = i + 1;
                else if (pagination.page <= 4) p = i + 1;
                else if (pagination.page >= pagination.totalPages - 3) p = pagination.totalPages - 6 + i;
                else p = pagination.page - 3 + i;
                return (
                  <button key={p} onClick={() => loadProducts(p)} className={`px-3 py-1 rounded-lg text-sm font-medium ${p === pagination.page ? 'bg-emerald-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{p}</button>
                );
              })}
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => loadProducts(pagination.page + 1)} className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50">Keyingi</button>
            </div>
          </div>
        )}
      </div>

      {showModal && <ProductModal product={editProduct} categories={categories} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); loadProducts(); }} />}

      {deleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={() => setDeleteProduct(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 modal-content">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <HiOutlineTrash className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{UZ.deleteProduct}</h3>
              <p className="text-sm text-gray-500 mt-2">"{deleteProduct.name}" {UZ.deleteConfirm}</p>
              <div className="flex justify-center gap-3 mt-6">
                <button onClick={() => setDeleteProduct(null)} className="btn-secondary">{UZ.cancel}</button>
                <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700">{UZ.delete}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {labelProduct && <LabelPrintModal product={labelProduct} onClose={() => setLabelProduct(null)} />}
      {showBulkPrice && <BulkPriceModal products={getSelectedProducts()} onClose={() => setShowBulkPrice(false)} onApply={() => { setShowBulkPrice(false); setSelectedProducts(new Set()); loadProducts(pagination.page); }} />}
      {showCSVImport && <CSVImportModal onClose={() => setShowCSVImport(false)} onImport={() => { setShowCSVImport(false); loadProducts(); }} />}
    </div>
  );
}
