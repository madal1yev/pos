import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '../context/CartContext';
import { productsAPI, salesAPI, settingsAPI } from '../services/api';
import { UZ, formatCurrency } from '../utils/uzbek';
import { getErrorMessage } from '../utils/errors';
import { emitDataChanged } from '../utils/events';
import { HiOutlineMinus, HiOutlinePlus, HiOutlineTrash, HiOutlineCamera, HiOutlineMagnifyingGlass, HiOutlineCheckCircle, HiOutlineXMark, HiOutlineShoppingCart } from 'react-icons/hi2';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';

const UNIT_OPTIONS = [
  { value: 'pcs', label: 'Dona', short: 'dona', step: 1, min: 1 },
  { value: 'kg', label: 'Kilogramm', short: 'kg', step: 0.1, min: 0.1 },
  { value: 'g', label: 'Gram', short: 'gr', step: 10, min: 10 },
  { value: 'l', label: 'Litr', short: 'l', step: 0.1, min: 0.1 },
  { value: 'ml', label: 'Millilitr', short: 'ml', step: 50, min: 50 },
];

const AVATAR_COLORS = [
  'from-indigo-400 to-indigo-600',
  'from-blue-400 to-blue-600',
  'from-violet-400 to-purple-600',
  'from-pink-400 to-rose-600',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-600',
  'from-cyan-400 to-blue-500',
  'from-fuchsia-400 to-pink-600',
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function QuantityModal({ product, onClose, onAdd }) {
  const defaultUnit = product.unit || 'pcs';
  const [selectedUnit, setSelectedUnit] = useState(UNIT_OPTIONS.find(u => u.value === defaultUnit) || UNIT_OPTIONS[0]);
  const [quantity, setQuantity] = useState(defaultUnit === 'pcs' ? 1 : (selectedUnit.min || 1));
  const unitPrice = product.selling_price;
  const total = (unitPrice * quantity).toFixed(0);

  const handleAdd = () => {
    if (quantity <= 0) { toast.error('Miqdor kiriting'); return; }
    onAdd(product, quantity, selectedUnit.value);
    onClose();
  };

  const increment = () => {
    const newQty = Math.round((quantity + selectedUnit.step) * 100) / 100;
    setQuantity(newQty);
  };

  const decrement = () => {
    const newQty = Math.round((quantity - selectedUnit.step) * 100) / 100;
    if (newQty >= selectedUnit.min) setQuantity(newQty);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm modal-content">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Miqdor tanlash</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <POSImage src={product.image_url} name={product.name} size="w-12 h-12" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">{formatCurrency(unitPrice)} / {selectedUnit.short}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">O'lchov birligi</label>
            <div className="grid grid-cols-5 gap-1.5">
              {UNIT_OPTIONS.map((u) => (
                <button key={u.value} onClick={() => { setSelectedUnit(u); if (u.value === 'pcs') setQuantity(1); else setQuantity(u.min); }} className={`py-2 px-1 rounded-xl text-xs font-medium border-2 transition-all ${selectedUnit.value === u.value ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Miqdor ({selectedUnit.short})</label>
            <div className="flex items-center gap-3">
              <button onClick={decrement} className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors active:scale-95">
                <HiOutlineMinus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(selectedUnit.min, parseFloat(e.target.value) || selectedUnit.min))} step={selectedUnit.step} min={selectedUnit.min} className="flex-1 text-center text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-gray-200 dark:border-gray-600 focus:border-indigo-500 outline-none py-2" />
              <button onClick={increment} className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors active:scale-95">
                <HiOutlinePlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Jami:</span>
            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(total)}</span>
          </div>

          <button onClick={handleAdd} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3.5 rounded-xl text-base font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98]">
            Savatga qo'shish
          </button>
        </div>
      </div>
    </div>
  );
}

function POSImage({ src, name, size = 'w-11 h-11' }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className={`${size} rounded-xl bg-gradient-to-br ${getAvatarColor(name)} flex items-center justify-center text-sm font-bold text-white shadow-sm flex-shrink-0`}>
        {getInitials(name)}
      </div>
    );
  }
  return <img src={src} alt={name} className={`${size} rounded-xl object-cover flex-shrink-0`} onError={() => setError(true)} loading="lazy" />;
}

function ScannerModal({ onClose, onScan }) {
  const html5QrCodeRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => { startScanner(); return () => stopScanner(); }, []);

  const stopScanner = async () => {
    try { if (html5QrCodeRef.current) { const s = html5QrCodeRef.current.getState(); if (s === 2) await html5QrCodeRef.current.stop(); html5QrCodeRef.current.clear(); html5QrCodeRef.current = null; } } catch {}
  };

  const startScanner = async () => {
    try {
      html5QrCodeRef.current = new Html5Qrcode('scanner-viewport');
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 150 } },
        (text) => { onScan(text); stopScanner(); onClose(); },
        () => {}
      );
    } catch { setError(UZ.cameraError); setScanning(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md modal-content">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{UZ.scanBarcode}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-4">
          <div id="scanner-viewport" className="rounded-lg overflow-hidden" />
          {error && <p className="text-sm text-amber-600 dark:text-amber-400 text-center mt-3">{error}</p>}
          {scanning && <p className="text-sm text-gray-500 text-center mt-3 animate-pulse">{UZ.pointCamera}</p>}
        </div>
      </div>
    </div>
  );
}

function CheckoutModal({ total, taxRate, onClose, onComplete }) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receivedAmount, setReceivedAmount] = useState(total.toFixed(0));
  const [customerName, setCustomerName] = useState('');
  const [processing, setProcessing] = useState(false);
  const change = Math.max(0, parseFloat(receivedAmount || 0) - total);
  const taxAmount = Math.round(total * taxRate / (1 + taxRate));
  const subtotal = total - taxAmount;

  const handleComplete = async () => {
    if (parseFloat(receivedAmount) < total) { toast.error("Qabul qilingan summa kam"); return; }
    setProcessing(true);
    await onComplete({ payment_method: paymentMethod, received_amount: parseFloat(receivedAmount), customer_name: customerName || undefined });
    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md modal-content">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{UZ.checkout}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="text-center py-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl">
            <p className="text-sm text-gray-500 mb-1">{UZ.totalAmount}</p>
            <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(total)}</p>
          </div>
          {taxRate > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{UZ.subtotal || 'Oraliq yig'}</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{UZ.tax || 'Soliq'} ({(taxRate * 100).toFixed(0)}%)</span><span className="font-medium">{formatCurrency(taxAmount)}</span></div>
              <div className="flex justify-between font-bold border-t border-gray-200 dark:border-gray-600 pt-1.5"><span>{UZ.total}</span><span>{formatCurrency(total)}</span></div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{UZ.customerName}</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={UZ.walkInCustomer} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{UZ.paymentMethod}</label>
            <div className="grid grid-cols-3 gap-2">
              {[['cash', UZ.cash, '💵'], ['card', UZ.card, '💳'], ['other', UZ.other, '📱']].map(([m, l, e]) => (
                <button key={m} onClick={() => setPaymentMethod(m)} className={`py-3 px-3 rounded-xl text-sm font-medium border-2 transition-all ${paymentMethod === m ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-md shadow-indigo-500/10' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300'}`}>
                  <span className="text-lg block mb-0.5">{e}</span>
                  <span>{l}</span>
                </button>
              ))}
            </div>
          </div>
          {paymentMethod === 'cash' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{UZ.receivedAmount}</label>
                <input type="number" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} className="input-field text-lg font-semibold dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">{UZ.change}</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(change)}</p>
              </div>
            </>
          )}
          <button onClick={handleComplete} disabled={processing} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3.5 rounded-xl text-base font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25 active:scale-[0.98]">
            {processing ? UZ.processing : UZ.completeSale}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiptModal({ sale, onClose }) {
  const [settings, setSettings] = useState(null);
  
  useEffect(() => {
    settingsAPI.get().then(({ data }) => setSettings(data?.settings)).catch(() => {});
  }, []);

  if (!sale) return null;
  const now = new Date();
  const dateStr = now.toLocaleDateString('uz-UZ');
  const timeStr = now.toLocaleTimeString('uz-UZ');

  const storeName = settings?.store_name || "Oziq-ovqat Do'koni";
  const storeAddress = settings?.store_address || "Toshkent shahri, Bunyodkor ko'chasi 15";
  const storePhone = settings?.store_phone || "Tel: +998 90 123 45 67";
  const receiptHeader = settings?.receipt_header || '';
  const receiptFooter = settings?.receipt_footer || 'Xaridingiz uchun rahmat!\nYana kutamiz!';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto modal-content">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 no-print sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{UZ.receipt || 'Chek'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-6 print:p-2" id="receipt-content">
          <div className="text-center mb-4">
            {receiptHeader && <p className="text-xs text-gray-500 mb-2">{receiptHeader}</p>}
            <p className="text-lg font-bold text-gray-900 dark:text-white">{storeName}</p>
            {storeAddress && <p className="text-xs text-gray-500">{storeAddress}</p>}
            {storePhone && <p className="text-xs text-gray-500">{storePhone}</p>}
          </div>
          <div className="border-t border-b border-dashed border-gray-300 dark:border-gray-600 py-2 my-3 text-xs text-gray-500 flex justify-between">
            <span>{UZ.invoice}: {sale.invoice_number}</span>
            <span>{dateStr} {timeStr}</span>
          </div>
          {sale.items && sale.items.length > 0 && (
            <div className="space-y-1.5 text-sm mb-3">
              {sale.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">{item.product_name || item.name} x{item.quantity} {item.unit || 'dona'}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.subtotal || item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-dashed border-gray-300 dark:border-gray-600 pt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">{UZ.total}</span><span className="font-bold text-gray-900 dark:text-white text-lg">{formatCurrency(sale.total_amount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{UZ.payment}</span><span className="text-gray-700 dark:text-gray-300">{sale.payment_method === 'cash' ? UZ.cash : sale.payment_method === 'card' ? UZ.card : UZ.other}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{UZ.receivedAmount}</span><span>{formatCurrency(sale.received_amount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{UZ.change}</span><span className="font-semibold text-indigo-600 dark:text-indigo-400">{formatCurrency(sale.change_amount)}</span></div>
          </div>
          <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-300 dark:border-gray-600">
            {receiptFooter.split('\n').map((line, i) => (
              <p key={i} className="text-xs text-gray-500">{line}</p>
            ))}
          </div>
        </div>
        <div className="flex justify-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 no-print">
          <button onClick={() => window.print()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">{UZ.print}</button>
          <button onClick={onClose} className="btn-secondary">{UZ.close}</button>
        </div>
      </div>
    </div>
  );
}

export default function POS() {
  const { items, addItem, updateQuantity, removeItem, clearCart, getTotal, getItemCount } = useCartStore();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [taxRate, setTaxRate] = useState(0);
  const [quantityProduct, setQuantityProduct] = useState(null);
  const searchRef = useRef(null);
  const barcodeBuffer = useRef('');
  const barcodeTimer = useRef(null);
  const searchTimeout = useRef(null);

  useEffect(() => { loadProducts(); loadSettings(); }, [search]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' && e.target.dataset.barcode !== 'true') return;
      clearTimeout(barcodeTimer.current);
      barcodeTimer.current = setTimeout(() => { barcodeBuffer.current = ''; }, 200);
      barcodeBuffer.current += e.key;
      if (e.key === 'Enter' && barcodeBuffer.current.length > 3) {
        handleBarcodeScan(barcodeBuffer.current.replace('Enter', ''));
        barcodeBuffer.current = '';
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => { window.removeEventListener('keydown', handleKey); clearTimeout(barcodeTimer.current); };
  }, []);

  const loadProducts = async () => {
    try {
      const { data } = await productsAPI.getAll({ search, status: 'active', limit: 50 });
      setProducts(data?.products || []);
    } catch { setProducts([]); }
  };

  const loadSettings = async () => {
    try {
      const { data } = await settingsAPI.get();
      setTaxRate(parseFloat(data?.settings?.tax_percentage || 0) / 100);
    } catch {}
  };

  const handleBarcodeScan = async (barcode) => {
    try {
      const { data } = await productsAPI.getByBarcode(barcode);
      if (!data?.product) { toast.error(UZ.notFound); return; }
      setQuantityProduct(data.product);
    } catch { toast.error(UZ.notFound); }
  };

  const handleAddToCart = (product, quantity, unit) => {
    const added = addItem(product, quantity, unit);
    if (!added) toast.error(UZ.notEnoughStock);
    else toast.success(`${product.name} ${quantity} ${unit} ${UZ.productAdded}`);
  };

  const handleCheckout = async (info) => {
    try {
      const { data } = await salesAPI.create({ ...info, items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, price: i.price, unit: i.unit || 'pcs', discount: i.discount || 0, tax: i.tax || 0 })) });
      const saleWithItems = { ...data?.sale, items: items.map((i) => ({ ...i, product_name: i.name })) };
      setReceipt(saleWithItems); setShowCheckout(false); clearCart(); loadProducts(); emitDataChanged();
    } catch (err) { toast.error(getErrorMessage(err, "Sotuvda xato")); }
  };

  return (
    <div className="h-[calc(100vh-4rem)] sm:h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4 animate-fade-in">
      <div className="flex-1 flex flex-col min-w-0 order-1">
        <div className="card flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input ref={searchRef} type="text" placeholder={UZ.searchOrScan} value={search} onChange={(e) => setSearch(e.target.value)} data-barcode="true" className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <button onClick={() => setShowScanner(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-md shadow-indigo-500/20">
              <HiOutlineCamera className="w-4 h-4" /> {UZ.scan}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
            {products.map((product, i) => (
              <button key={product.id} onClick={() => setQuantityProduct(product)} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-150 text-center hover:shadow-md border border-gray-100 dark:border-gray-700/50" style={{ animationDelay: `${i * 0.02}s` }}>
                <POSImage src={product.image_url} name={product.name} size="w-14 h-14" />
                <div className="w-full min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight break-words line-clamp-2 min-h-[2rem]">{product.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{product.brand || product.product_code}</p>
                </div>
                <div className="w-full flex items-center justify-between gap-1 mt-auto">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(product.selling_price)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${product.stock_quantity <= product.minimum_stock ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>{product.stock_quantity}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-96 flex flex-col order-2">
        <div className="card flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <HiOutlineShoppingCart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{UZ.cart}</h2>
                {items.length > 0 && <p className="text-[10px] text-gray-400">{items.length} {UZ.items} / {getItemCount()} dona</p>}
              </div>
            </div>
            {items.length > 0 && (
              <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                {UZ.clear}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                  <HiOutlineShoppingCart className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{UZ.emptyCart}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{UZ.emptyCartHint}</p>
              </div>
            ) : items.map((item, idx) => (
              <div key={item.product_id} className="group flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all animate-fade-in" style={{ animationDelay: `${idx * 0.03}s` }}>
                <div className="relative flex-shrink-0">
                  <POSImage src={item.image_url} name={item.name} size="w-10 h-10" />
                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-indigo-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {idx + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight line-clamp-1">{item.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">{formatCurrency(item.price)}</span>
                    <span className="text-[10px] text-gray-400">/ {item.unit || 'dona'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                  <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="w-7 h-7 rounded-l-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors active:scale-90">
                    <HiOutlineMinus className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <span className="w-7 text-center text-sm font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="w-7 h-7 rounded-r-lg flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors active:scale-90">
                    <HiOutlinePlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  </button>
                </div>
                <div className="flex flex-col items-end gap-1 min-w-[70px]">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{formatCurrency(item.subtotal)}</p>
                  <button onClick={() => removeItem(item.product_id)} className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-all">
                    <HiOutlineTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {items.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3 space-y-2.5 bg-gradient-to-t from-gray-50/50 to-transparent dark:from-gray-800/50 -mx-6 px-6 pb-1 -mb-6">
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>Jami mahsulotlar</span>
                <span className="font-medium">{getItemCount()} dona</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Jami summa</span>
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(getTotal())}</span>
              </div>
              <button onClick={() => setShowCheckout(true)} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3.5 rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all hover-lift shadow-lg shadow-indigo-500/25 active:scale-[0.98] flex items-center justify-center gap-2">
                <HiOutlineCheckCircle className="w-5 h-5" />
                {UZ.proceedCheckout}
              </button>
            </div>
          )}
        </div>
      </div>

      {showScanner && <ScannerModal onClose={() => setShowScanner(false)} onScan={(text) => handleBarcodeScan(text)} />}
      {quantityProduct && <QuantityModal product={quantityProduct} onClose={() => setQuantityProduct(null)} onAdd={handleAddToCart} />}
      {showCheckout && <CheckoutModal total={getTotal()} taxRate={taxRate} onClose={() => setShowCheckout(false)} onComplete={handleCheckout} />}
      {receipt && <ReceiptModal sale={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
