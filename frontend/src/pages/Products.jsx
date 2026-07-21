import { useState, useEffect, useRef, useCallback } from 'react';
import { productsAPI, categoriesAPI, bulkAPI } from '../services/api';
import { UZ, formatCurrency } from '../utils/uzbek';
import { getErrorMessage } from '../utils/errors';
import { emitDataChanged } from '../utils/events';
import PRODUCT_CATEGORIES from '../utils/productImages';
import { HiOutlinePlus, HiOutlineMagnifyingGlass, HiOutlinePencil, HiOutlineTrash, HiOutlineQrCode, HiOutlineXMark, HiOutlinePhoto, HiOutlineCurrencyDollar, HiOutlineCamera } from 'react-icons/hi2';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';

const UNIT_LABELS = {
  pcs: 'Dona', kg: 'Kilogramm', g: 'Gram', l: 'Litr', ml: 'Millilitr',
  box: 'Quti', bag: 'Xalta', bottle: 'Butulka', jar: 'Idish', pack: 'Payket',
};

const UNIT_OPTIONS = [
  { value: 'pcs', label: 'Dona' }, { value: 'kg', label: 'Kilogramm' },
  { value: 'g', label: 'Gram' }, { value: 'l', label: 'Litr' },
  { value: 'ml', label: 'Millilitr' }, { value: 'box', label: 'Quti' },
  { value: 'bag', label: 'Xalta' }, { value: 'bottle', label: 'Butulka' },
  { value: 'jar', label: 'Idish' }, { value: 'pack', label: 'Payket' },
];

function ProductImage({ src, name, size = 'w-10 h-10' }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className={`${size} rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0 shadow-sm`}>
        {name?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      className={`${size} rounded-xl object-cover flex-shrink-0 shadow-sm border border-gray-100 dark:border-gray-700`}
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

function BarcodeScannerModal({ onClose, onScan }) {
  const html5QrCodeRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => { startScanner(); return () => stopScanner(); }, []);

  const stopScanner = async () => {
    try { if (html5QrCodeRef.current) { const s = html5QrCodeRef.current.getState(); if (s === 2) await html5QrCodeRef.current.stop(); html5QrCodeRef.current.clear(); html5QrCodeRef.current = null; } } catch {}
  };

  const startScanner = async () => {
    try {
      html5QrCodeRef.current = new Html5Qrcode('product-scanner-viewport');
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 150 } },
        (text) => { onScan(text); stopScanner(); onClose(); },
        () => {}
      );
    } catch { setError('Kamera mavjud emas. Shtrix-kodni qo\'lda kiriting.'); setScanning(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Shtrix-kodni skanerlash</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-4">
          <div id="product-scanner-viewport" className="rounded-xl overflow-hidden" />
          {error && <p className="text-sm text-amber-600 dark:text-amber-400 text-center mt-3">{error}</p>}
          {scanning && <p className="text-sm text-gray-500 text-center mt-3 animate-pulse">Kamerani shtrix-kodga yo'naltiring...</p>}
        </div>
      </div>
    </div>
  );
}

function ImagePickerModal({ onSelect, onClose }) {
  const [activeTab, setActiveTab] = useState(Object.keys(PRODUCT_CATEGORIES)[0]);
  const [search, setSearch] = useState('');
  const categories = Object.keys(PRODUCT_CATEGORIES);

  const filteredImages = search
    ? Object.values(PRODUCT_CATEGORIES).flat().filter(img => img.name.toLowerCase().includes(search.toLowerCase())).slice(0, 60)
    : PRODUCT_CATEGORIES[activeTab] || [];

  const productCount = filteredImages.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Rasm tanlang</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{activeTab} — {productCount} ta rasm</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>

        <div className="px-6 pt-4">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Rasm qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 h-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white" autoFocus />
          </div>
        </div>

        {!search && (
          <div className="flex gap-2 px-6 pt-4 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const count = PRODUCT_CATEGORIES[cat]?.length || 0;
              return (
                <button key={cat} onClick={() => setActiveTab(cat)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${activeTab === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'}`}>
                  <span>{cat}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === cat ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {filteredImages.map((img, i) => (
              <button key={i} onClick={() => { onSelect(img.url); onClose(); }} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 hover:border-indigo-500 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.97] bg-gray-50 dark:bg-gray-700/30">
                <img src={img.url} alt={img.name} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                  <span className="text-xs font-semibold text-white truncate">{img.name}</span>
                </div>
                <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md opacity-0 hover:opacity-100 transition-opacity">
                  <HiOutlinePlus className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
          {filteredImages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                <HiOutlinePhoto className="w-8 h-8 text-gray-300 dark:text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rasm topilmadi</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Boshqa kalit so'z bilan urinib ko'ring</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <p className="text-xs text-gray-400">{search ? 'Qidiruv natijalari' : `${activeTab} — ${productCount} ta`}</p>
          <button onClick={onClose} className="btn-secondary text-sm px-5 py-2">Bekor qilish</button>
        </div>
      </div>
    </div>
  );
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
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const barcodeSvgRef = useRef(null);

  const generateBarcode = () => {
    const code = product?.product_code || ('PRD-' + Date.now().toString().slice(-6));
    setForm(f => ({ ...f, barcode: code }));
  };

  useEffect(() => {
    if (form.barcode && barcodeSvgRef.current) {
      try { JsBarcode(barcodeSvgRef.current, form.barcode, { format: 'CODE128', width: 1.5, height: 35, displayValue: true, fontSize: 11, margin: 4 }); } catch {}
    }
  }, [form.barcode]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-content">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{product ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mahsulot nomi *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Masalan: Coca-Cola 1L" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kategoriya</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Kategoriya tanlash</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Brend</label>
              <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Masalan: Coca-Cola" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Shtrix-kod</label>
              <div className="flex gap-2">
                <input type="text" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="input-field flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono" placeholder="Shtrix-kodni kiriting" />
                <button type="button" onClick={() => setShowBarcodeScanner(true)} className="px-3 py-2 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                  <HiOutlineCamera className="w-4 h-4" /> Skanerlash
                </button>
                <button type="button" onClick={generateBarcode} className="px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 whitespace-nowrap transition-colors border border-gray-200 dark:border-gray-600">
                  Generatsiya
                </button>
              </div>
              {form.barcode && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 inline-block shadow-sm">
                  <svg ref={barcodeSvgRef} />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">O'lchov birligi</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {UNIT_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sotib narxi</label>
              <input type="number" step="0.01" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sotish narxi *</label>
              <input type="number" step="0.01" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="0" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mavjud miqdor</label>
              <input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Minimal zaxira</label>
              <input type="number" value={form.minimum_stock} onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="0" />
              <p className="text-[11px] text-gray-400 mt-1">Bu miqdordan kam qolganda ogohlantirish beriladi</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Holat</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="active">Faol</option>
                <option value="inactive">Nofaol</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tavsif</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Qo'shimcha ma'lumot..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <span className="flex items-center gap-1.5"><HiOutlinePhoto className="w-4 h-4" /> Mahsulot rasmi</span>
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="URL kiriting yoki quyidagi tugmani bosing" />
                </div>
                <button type="button" onClick={() => setShowImagePicker(true)} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors flex items-center gap-2 border border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
                  <HiOutlineCamera className="w-4 h-4" /> Tanlash
                </button>
              </div>
              {form.image_url && (
                <div className="mt-3 relative inline-block">
                  <img src={form.image_url} alt="Ko'rish" className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-700 shadow-sm" onError={(e) => { e.target.style.display='none'; toast.error('Rasm yuklanmadi'); }} />
                  <button type="button" onClick={() => setForm({ ...form, image_url: '' })} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 shadow-md transition-colors"><HiOutlineXMark className="w-3.5 h-3.5" /></button>
                </div>
              )}
              {!form.image_url && (
                <p className="text-[11px] text-gray-400 mt-1.5">Rasm tanlamangsa, avtomatik ravishda tanlab qo'yiladi</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn-secondary">Bekor qilish</button>
            <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20 active:scale-[0.98]">
              {saving ? 'Saqlanmoqda...' : product ? 'Saqlash' : "Qo'shish"}
            </button>
          </div>
        </form>
        {showImagePicker && <ImagePickerModal onSelect={(url) => setForm({ ...form, image_url: url })} onClose={() => setShowImagePicker(false)} />}
        {showBarcodeScanner && <BarcodeScannerModal onClose={() => setShowBarcodeScanner(false)} onScan={(code) => { setForm(f => ({ ...f, barcode: code })); toast.success('Shtrix-kod aniqlandi: ' + code); }} />}
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Yorliq chop etish</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6 print:p-2">
          <div className="text-center border-b pb-4 no-print">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{product.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{product.product_code}</p>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">{formatCurrency(product.selling_price)}</p>
          </div>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-xs font-medium text-gray-500 mb-2">Shtrix-kod</p>
              <BarcodeDisplay value={product.barcode || product.product_code} type="barcode" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-gray-500 mb-2">QR Code</p>
              <BarcodeDisplay value={product.barcode || product.product_code} type="qrcode" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 no-print">
          <button onClick={onClose} className="btn-secondary">Yopish</button>
          <button onClick={() => window.print()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all">Chop etish</button>
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
        if (mode === 'percent') newPrice = Math.round(currentPrice * (1 + parseFloat(value) / 100));
        else if (mode === 'fixed') newPrice = currentPrice + parseFloat(value);
        else newPrice = parseFloat(value);
        return { id: p.id, [field]: Math.max(0, newPrice) };
      });
      await bulkAPI.updatePrices(updates);
      toast.success(`${updates.length} ta mahsulot narxi yangilandi!`);
      onApply();
    } catch (err) {
      toast.error(getErrorMessage(err, "Xatolik"));
    } finally { setApplying(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg modal-content">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <HiOutlineCurrencyDollar className="w-5 h-5" /> Narxlarni to'g'irlash
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">{products.length} ta mahsulot tanlangan</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Qaysi narxni o'zgartirasiz?</label>
            <select value={field} onChange={(e) => setField(e.target.value)} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="selling_price">Sotish narxi</option>
              <option value="purchase_price">Sotib narxi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">O'zgartirish usuli</label>
            <div className="grid grid-cols-3 gap-2">
              {[['percent', 'Foiz (%)'], ['fixed', "Qo'shish"], ['exact', 'Aniq qiymat']].map(([m, l]) => (
                <button key={m} onClick={() => setMode(m)} className={`py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition-all ${mode === m ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {mode === 'percent' ? 'Foiz miqdori' : mode === 'fixed' ? "Qo'shiladigan summa" : 'Yangi narx'}
            </label>
            <input type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={mode === 'percent' ? 'Masalan: 10' : 'Masalan: 5000'} />
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-sm space-y-1.5">
            <p className="text-gray-500 font-medium">Namuna:</p>
            {products.slice(0, 3).map((p, i) => {
              const current = parseFloat(p[field]) || 0;
              let newP;
              if (mode === 'percent') newP = Math.round(current * (1 + (parseFloat(value) || 0) / 100));
              else if (mode === 'fixed') newP = current + (parseFloat(value) || 0);
              else newP = parseFloat(value) || current;
              return (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 truncate">{p.name}</span>
                  <span className="font-medium">{formatCurrency(current)} → {formatCurrency(Math.max(0, newP))}</span>
                </div>
              );
            })}
            {products.length > 3 && <p className="text-gray-400">...va yana {products.length - 3} ta</p>}
          </div>
          <button onClick={handleApply} disabled={applying || !value} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20 active:scale-[0.98]">
            {applying ? 'Qayta ishlanmoqda...' : `Qo'llash (${products.length} ta)`}
          </button>
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

  const loadCategories = async () => {
    try {
      const { data } = await categoriesAPI.getAll();
      const cats = data?.categories || [];
      const seen = new Map();
      const deduped = cats.filter(c => {
        const key = c.name.toLowerCase().trim();
        if (seen.has(key)) {
          seen.get(key).product_count += c.product_count || 0;
          return false;
        }
        seen.set(key, c);
        return true;
      });
      setCategories(deduped);
    } catch { setCategories([]); }
  };
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
    if (selectedProducts.size === products.length) setSelectedProducts(new Set());
    else setSelectedProducts(new Set(products.map(p => p.id)));
  };

  const getSelectedProducts = () => products.filter(p => selectedProducts.has(p.id));

  const getStockStatus = (p) => {
    if (p.stock_quantity === 0) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{UZ.outOfStockStatus}</span>;
    if (p.minimum_stock > 0 && p.stock_quantity <= p.minimum_stock) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{UZ.lowStockStatus}</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{UZ.inStockStatus}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{UZ.productsTitle}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pagination.total} ta mahsulot</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedProducts.size > 0 && (
            <button onClick={() => setShowBulkPrice(true)} className="bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center gap-2 text-sm shadow-md shadow-blue-500/20 active:scale-[0.98]">
              <HiOutlineCurrencyDollar className="w-4 h-4" /> Narx o'zgartirish ({selectedProducts.size})
            </button>
          )}
          <button onClick={() => { setEditProduct(null); setShowModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-[0.98]">
            <HiOutlinePlus className="w-5 h-5" /> {UZ.addProduct}
          </button>
        </div>
      </div>

      <div className="card animate-fade-in-up stagger-1">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Mahsulot qidirish (nom, kod, shtrix-kod, brend)..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field w-auto sm:w-48 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">Barcha kategoriyalar</option>
            {categories.filter(c => c.product_count > 0).map((c) => <option key={c.id} value={c.id}>{c.name} ({c.product_count})</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <HiOutlineMagnifyingGlass className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-gray-400">Mahsulot topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-3 font-medium w-8">
                    <input type="checkbox" checked={selectedProducts.size === products.length && products.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                  </th>
                  <th className="pb-3 font-medium">Mahsulot</th>
                  <th className="pb-3 font-medium hidden md:table-cell">Kod</th>
                  <th className="pb-3 font-medium hidden lg:table-cell">Kategoriya</th>
                  <th className="pb-3 font-medium text-right">Sotish narxi</th>
                  <th className="pb-3 font-medium text-right">Miqdor</th>
                  <th className="pb-3 font-medium">Holat</th>
                  <th className="pb-3 font-medium text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {products.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedProducts.has(product.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                    <td className="py-3">
                      <input type="checkbox" checked={selectedProducts.has(product.id)} onChange={() => toggleSelect(product.id)} className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <ProductImage src={product.image_url} name={product.name} />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
                          {product.brand && <p className="text-xs text-gray-500 mt-0.5">{product.brand}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400 font-mono text-xs hidden md:table-cell">{product.product_code}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{product.category_name || '-'}</span>
                    </td>
                    <td className="py-3 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(product.selling_price)}</td>
                    <td className="py-3 text-right">
                      <span className={`font-semibold ${product.stock_quantity <= (product.minimum_stock || 0) && product.minimum_stock > 0 ? 'text-amber-600 dark:text-amber-400' : product.stock_quantity === 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {product.stock_quantity}
                      </span>
                      <span className="text-gray-400 text-xs ml-1">{UNIT_LABELS[product.unit] || product.unit}</span>
                    </td>
                    <td className="py-3">{getStockStatus(product)}</td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setLabelProduct(product)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors" title="Yorliq"><HiOutlineQrCode className="w-4 h-4" /></button>
                        <button onClick={() => { setEditProduct(product); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors" title="Tahrirlash"><HiOutlinePencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteProduct(product)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors" title="O'chirish"><HiOutlineTrash className="w-4 h-4" /></button>
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
              <button disabled={pagination.page <= 1} onClick={() => loadProducts(pagination.page - 1)} className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50 transition-colors">Oldingi</button>
              {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                let p;
                if (pagination.totalPages <= 7) p = i + 1;
                else if (pagination.page <= 4) p = i + 1;
                else if (pagination.page >= pagination.totalPages - 3) p = pagination.totalPages - 6 + i;
                else p = pagination.page - 3 + i;
                return (
                  <button key={p} onClick={() => loadProducts(p)} className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${p === pagination.page ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{p}</button>
                );
              })}
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => loadProducts(pagination.page + 1)} className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50 transition-colors">Keyingi</button>
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
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 shadow-lg shadow-red-500/25">
                <HiOutlineTrash className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mahsulotni o'chirish</h3>
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400">O'chirilayotgan mahsulot:</p>
                <p className="font-semibold text-gray-900 dark:text-white mt-1">{deleteProduct.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{deleteProduct.product_code}</p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Bu amalni bekor qilib bo'lmaydi. Davom etasizmi?</p>
              <div className="flex justify-center gap-3 mt-6">
                <button onClick={() => setDeleteProduct(null)} className="flex-1 btn-secondary">Bekor qilish</button>
                <button onClick={handleDelete} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/25 active:scale-[0.98]">
                  O'chirish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {labelProduct && <LabelPrintModal product={labelProduct} onClose={() => setLabelProduct(null)} />}
      {showBulkPrice && <BulkPriceModal products={getSelectedProducts()} onClose={() => setShowBulkPrice(false)} onApply={() => { setShowBulkPrice(false); setSelectedProducts(new Set()); loadProducts(pagination.page); }} />}
    </div>
  );
}
