import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '../context/CartContext';
import { productsAPI, salesAPI, settingsAPI } from '../services/api';
import { UZ, formatCurrency } from '../utils/uzbek';
import { HiOutlineMinus, HiOutlinePlus, HiOutlineTrash, HiOutlineCamera, HiOutlineMagnifyingGlass, HiOutlineCheckCircle, HiOutlineXMark, HiOutlineShoppingCart } from 'react-icons/hi2';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';

function POSImage({ src, name }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 flex items-center justify-center text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
        {name?.charAt(0)?.toUpperCase() || '📦'}
      </div>
    );
  }
  return <img src={src} alt={name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" onError={() => setError(true)} loading="lazy" />;
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{UZ.checkout}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">{UZ.totalAmount}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(total)}</p>
          </div>
          {taxRate > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{UZ.subtotal || 'Oraliq yig'}</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{UZ.tax || 'Soliq'} ({(taxRate * 100).toFixed(0)}%)</span><span>{formatCurrency(taxAmount)}</span></div>
              <div className="flex justify-between font-bold border-t border-gray-200 dark:border-gray-600 pt-1"><span>{UZ.total}</span><span>{formatCurrency(total)}</span></div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.customerName}</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={UZ.walkInCustomer} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{UZ.paymentMethod}</label>
            <div className="grid grid-cols-3 gap-2">
              {[['cash', UZ.cash], ['card', UZ.card], ['other', UZ.other]].map(([m, l]) => (
                <button key={m} onClick={() => setPaymentMethod(m)} className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${paymentMethod === m ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {paymentMethod === 'cash' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.receivedAmount}</label>
                <input type="number" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} className="input-field text-lg font-semibold dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-500">{UZ.change}</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(change)}</p>
              </div>
            </>
          )}
          <button onClick={handleComplete} disabled={processing} className="w-full bg-emerald-600 text-white py-3 rounded-lg text-base font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50">
            {processing ? UZ.processing : UZ.completeSale}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiptModal({ sale, onClose }) {
  if (!sale) return null;
  const now = new Date();
  const dateStr = now.toLocaleDateString('uz-UZ');
  const timeStr = now.toLocaleTimeString('uz-UZ');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 no-print sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{UZ.receipt || 'Chek'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-6 print:p-2" id="receipt-content">
          <div className="text-center mb-4">
            <p className="text-lg font-bold text-gray-900 dark:text-white">Oziq-ovqat Do'koni</p>
            <p className="text-xs text-gray-500">Toshkent shahri, Bunyodkor ko'chasi 15</p>
            <p className="text-xs text-gray-500">Tel: +998 90 123 45 67</p>
          </div>
          <div className="border-t border-b border-dashed border-gray-300 dark:border-gray-600 py-2 my-3 text-xs text-gray-500 flex justify-between">
            <span>{UZ.invoice}: {sale.invoice_number}</span>
            <span>{dateStr} {timeStr}</span>
          </div>
          {sale.items && sale.items.length > 0 && (
            <div className="space-y-1.5 text-sm mb-3">
              {sale.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">{item.product_name || item.name} x{item.quantity}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.subtotal || item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-dashed border-gray-300 dark:border-gray-600 pt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">{UZ.total}</span><span className="font-bold text-gray-900 dark:text-white text-lg">{formatCurrency(sale.total_amount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{UZ.payment}</span><span className="text-gray-700 dark:text-gray-300">{sale.payment_method === 'cash' ? UZ.cash : sale.payment_method === 'card' ? UZ.card : UZ.other}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{UZ.receivedAmount}</span><span>{formatCurrency(sale.received_amount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{UZ.change}</span><span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(sale.change_amount)}</span></div>
          </div>
          <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-300 dark:border-gray-600">
            <p className="text-xs text-gray-500">Xaridingiz uchun rahmat!</p>
            <p className="text-xs text-gray-400 mt-1">Yana kutamiz!</p>
          </div>
        </div>
        <div className="flex justify-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 no-print">
          <button onClick={() => window.print()} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700">{UZ.print}</button>
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
  const searchRef = useRef(null);
  const barcodeBuffer = useRef('');
  const barcodeTimer = useRef(null);

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

  const loadProducts = async () => { try { const { data } = await productsAPI.getAll({ search, status: 'active', limit: 50 }); setProducts(data?.products || []); } catch { setProducts([]); } };
  const loadSettings = async () => { try { const { data } = await settingsAPI.get(); setTaxRate(parseFloat(data?.settings?.tax_percentage || 0) / 100); } catch {} };

  const handleBarcodeScan = async (barcode) => {
    try {
      const { data } = await productsAPI.getByBarcode(barcode);
      if (!data?.product) { toast.error(UZ.notFound); return; }
      const added = addItem(data.product);
      if (added) toast.success(`${data.product.name} ${UZ.productAdded}`);
      else toast.error(UZ.notEnoughStock);
    } catch { toast.error(UZ.notFound); }
  };

  const handleCheckout = async (info) => {
    try {
      const { data } = await salesAPI.create({ ...info, items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, price: i.price, discount: i.discount || 0, tax: i.tax || 0 })) });
      const saleWithItems = { ...data?.sale, items: items.map((i) => ({ ...i, product_name: i.name })) };
      setReceipt(saleWithItems); setShowCheckout(false); clearCart(); loadProducts();
    } catch (err) { toast.error(err.response?.data?.error || "Sotuvda xato"); }
  };

  return (
    <div className="h-[calc(100vh-4rem)] sm:h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4">
      <div className="flex-1 flex flex-col min-w-0 order-1">
        <div className="card flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input ref={searchRef} type="text" placeholder={UZ.searchOrScan} value={search} onChange={(e) => setSearch(e.target.value)} data-barcode="true" className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <button onClick={() => setShowScanner(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
              <HiOutlineCamera className="w-4 h-4" /> {UZ.scan}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {products.map((product) => (
              <button key={product.id} onClick={() => { const a = addItem(product); if (!a) toast.error(UZ.notEnoughStock); else toast.success(`${product.name} ${UZ.productAdded}`); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
                <POSImage src={product.image_url} name={product.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.brand || product.product_code}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(product.selling_price)}</p>
                  <p className={`text-xs ${product.stock_quantity <= product.minimum_stock ? 'text-red-500' : 'text-gray-400'}`}>{UZ.stockQuantity}: {product.stock_quantity}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-96 flex flex-col order-2">
        <div className="card flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">{UZ.cart}</h2>
            {items.length > 0 && <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 font-medium">{UZ.clear}</button>}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <HiOutlineShoppingCart className="w-12 h-12 mb-2 opacity-30" />
                <p className="text-sm">{UZ.emptyCart}</p>
                <p className="text-xs">{UZ.emptyCartHint}</p>
              </div>
            ) : items.map((item) => (
              <div key={item.product_id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <POSImage src={item.image_url} name={item.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(item.price)} x {item.quantity}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100"><HiOutlineMinus className="w-3 h-3" /></button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100"><HiOutlinePlus className="w-3 h-3" /></button>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white w-24 text-right">{formatCurrency(item.subtotal)}</p>
                <button onClick={() => removeItem(item.product_id)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><HiOutlineTrash className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          {items.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4 space-y-3">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{UZ.items} ({getItemCount()})</span>
                <span>{formatCurrency(getTotal())}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                <span>{UZ.total}</span>
                <span>{formatCurrency(getTotal())}</span>
              </div>
              <button onClick={() => setShowCheckout(true)} className="w-full bg-emerald-600 text-white py-3 rounded-lg text-base font-semibold hover:bg-emerald-700 transition-all">
                {UZ.proceedCheckout}
              </button>
            </div>
          )}
        </div>
      </div>

      {showScanner && <ScannerModal onClose={() => setShowScanner(false)} onScan={(text) => handleBarcodeScan(text)} />}
      {showCheckout && <CheckoutModal total={getTotal()} taxRate={taxRate} onClose={() => setShowCheckout(false)} onComplete={handleCheckout} />}
      {receipt && <ReceiptModal sale={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
