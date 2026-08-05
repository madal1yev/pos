import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '../context/CartContext';
import { productsAPI, salesAPI, settingsAPI } from '../services/api';
import { t, formatCurrency } from '../utils/uzbek';
import { getErrorMessage } from '../utils/errors';
import { emitDataChanged } from '../utils/events';
import { playSuccessSound, playScanSound } from '../utils/sounds';
import { HiOutlineMinus, HiOutlinePlus, HiOutlineTrash, HiOutlineCamera, HiOutlineMagnifyingGlass, HiOutlineCheckCircle, HiOutlineXMark, HiOutlineShoppingCart, HiOutlineCalculator, HiOutlinePause, HiOutlinePlay, HiOutlineTag } from 'react-icons/hi2';
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

function CalculatorPanel({ onInput, onClose }) {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [prevValue, setPrevValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waiting, setWaiting] = useState(false);

  const opSymbol = { '+': '+', '-': '−', '*': '×', '/': '÷' };

  const inputDigit = (d) => {
    if (waiting) {
      setDisplay(String(d));
      setExpression(prev => prev + ' ' + String(d));
      setWaiting(false);
    } else {
      setDisplay(display === '0' ? String(d) : display + d);
      if (operator) {
        setExpression(prev => prevValue + ' ' + (opSymbol[operator] || operator) + ' ' + (display === '0' ? String(d) : display.slice(0, -1) + String(d)));
      } else {
        setExpression(display === '0' ? String(d) : display + d);
      }
    }
  };

  const inputDecimal = () => {
    if (waiting) { setDisplay('0.'); setExpression(prev => prev + ' 0.'); setWaiting(false); return; }
    if (!display.includes('.')) setDisplay(display + '.');
  };

  const clear = () => { setDisplay('0'); setExpression(''); setPrevValue(null); setOperator(null); setWaiting(false); };

  const calculate = (a, op, b) => {
    const numA = parseFloat(a), numB = parseFloat(b);
    switch (op) {
      case '+': return numA + numB;
      case '-': return numA - numB;
      case '*': return numA * numB;
      case '/': return numB !== 0 ? numA / numB : 0;
      default: return numB;
    }
  };

  const handleOperator = (op) => {
    if (operator && !waiting) {
      const result = calculate(prevValue, operator, display);
      const rounded = Math.round(result * 100) / 100;
      setDisplay(String(rounded));
      setExpression(prevValue + ' ' + (opSymbol[operator] || operator) + ' ' + display + ' = ' + rounded);
      setPrevValue(String(rounded));
    } else {
      setPrevValue(display);
      setExpression(display + ' ' + (opSymbol[op] || op));
    }
    setOperator(op);
    setWaiting(true);
  };

  const handleEquals = () => {
    if (!operator) return;
    const result = calculate(prevValue, operator, display);
    const rounded = Math.round(result * 100) / 100;
    setExpression(prevValue + ' ' + (opSymbol[operator] || operator) + ' ' + display + ' =');
    setDisplay(String(rounded));
    setPrevValue(null);
    setOperator(null);
    setWaiting(true);
  };

  const handleUse = () => {
    onInput(parseFloat(display));
    onClose();
  };

  const btn = (label, action, cls = '') => (
    <button onClick={action} className={`py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 ${cls}`}>{label}</button>
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 mb-3 text-right min-h-[4.5rem] flex flex-col justify-end">
        {expression && <span className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">{expression}</span>}
        <span className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{display}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {btn('C', clear, 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400')}
        {btn('±', () => setDisplay(String(parseFloat(display) * -1)), 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200')}
        {btn('%', () => setDisplay(String(parseFloat(display) / 100)), 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200')}
        {btn('÷', () => handleOperator('/'), 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400')}
        {btn('7', () => inputDigit(7), 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm')}
        {btn('8', () => inputDigit(8), 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm')}
        {btn('9', () => inputDigit(9), 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm')}
        {btn('×', () => handleOperator('*'), 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400')}
        {btn('4', () => inputDigit(4), 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm')}
        {btn('5', () => inputDigit(5), 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm')}
        {btn('6', () => inputDigit(6), 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm')}
        {btn('−', () => handleOperator('-'), 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400')}
        {btn('1', () => inputDigit(1), 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm')}
        {btn('2', () => inputDigit(2), 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm')}
        {btn('3', () => inputDigit(3), 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm')}
        {btn('+', () => handleOperator('+'), 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400')}
        {btn('0', () => inputDigit(0), 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm col-span-2')}
        {btn('.', inputDecimal, 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm')}
        {btn('=', handleEquals, 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25')}
      </div>
      <button onClick={handleUse} className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all">
        Qo'llash ({display})
      </button>
    </div>
  );
}

function QuantityModal({ product, onClose, onAdd }) {
  const defaultUnit = product.unit || 'pcs';
  const [selectedUnit, setSelectedUnit] = useState(UNIT_OPTIONS.find(u => u.value === defaultUnit) || UNIT_OPTIONS[0]);
  const [quantity, setQuantity] = useState(defaultUnit === 'pcs' ? 1 : (selectedUnit.min || 1));
  const [showCalc, setShowCalc] = useState(false);
  const unitPrice = product.selling_price;
  const total = Math.round(unitPrice * quantity * 100) / 100;

  const handleAdd = () => {
    if (quantity <= 0) { toast.error('Miqdor kiriting'); return; }
    onAdd(product, quantity, selectedUnit.value);
    onClose();
  };

  const increment = () => {
    setQuantity(q => Math.round((q + selectedUnit.step) * 100) / 100);
  };

  const decrement = () => {
    setQuantity(q => {
      const n = Math.round((q - selectedUnit.step) * 100) / 100;
      return n >= selectedUnit.min ? n : q;
    });
  };

  const quickAmounts = selectedUnit.value === 'pcs' ? [1, 2, 3, 5, 10] : [0.5, 1, 2, 3, 5];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md modal-content max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Miqdor tanlash</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCalc(!showCalc)} className={`p-1.5 rounded-lg transition-colors ${showCalc ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'}`}>
              <HiOutlineCalculator className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><HiOutlineXMark className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {showCalc ? (
            <CalculatorPanel onInput={(v) => { setQuantity(v); }} onClose={() => setShowCalc(false)} />
          ) : (
            <>
              <div className="flex items-center gap-3">
                <POSImage src={product.image_url} name={product.name} size="w-14 h-14" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{product.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(unitPrice)}</span>
                    <span className="text-xs text-gray-400">/ {selectedUnit.short}</span>
                    {product.stock_quantity < product.minimum_stock && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-medium">Zaxirada: {product.stock_quantity}</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">O'lchov birligi</label>
                <div className="flex flex-wrap gap-1.5">
                  {UNIT_OPTIONS.map((u) => (
                    <button key={u.value} onClick={() => { setSelectedUnit(u); setQuantity(u.value === 'pcs' ? 1 : u.min); }} className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${selectedUnit.value === u.value ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'}`}>
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {quickAmounts.map(a => (
                  <button key={a} onClick={() => setQuantity(a)} className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${quantity === a ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    {a} {selectedUnit.short}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Miqdor ({selectedUnit.short})</label>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button onClick={decrement} className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors active:scale-90 flex-shrink-0 border border-gray-200 dark:border-gray-600 shadow-sm">
                    <HiOutlineMinus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <input type="text" inputMode="decimal" value={quantity} onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9.]/g, '');
                    const n = parseFloat(v);
                    setQuantity(isNaN(n) ? selectedUnit.min : Math.max(selectedUnit.min, n));
                  }} className="w-0 flex-1 text-center text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-indigo-500 outline-none py-3 px-2 min-w-0" />
                  <button onClick={increment} className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors active:scale-90 flex-shrink-0 border border-indigo-200 dark:border-indigo-800 shadow-sm">
                    <HiOutlinePlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Jami</p>
                  <p className="text-xs text-gray-400">{quantity} × {formatCurrency(unitPrice)}</p>
                </div>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(total)}</span>
              </div>

              <button onClick={handleAdd} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3.5 rounded-xl text-base font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98] flex items-center justify-center gap-2">
                <HiOutlinePlus className="w-5 h-5" /> Savatga qo'shish
              </button>
            </>
          )}
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
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
      const viewport = document.getElementById('scanner-viewport');
      if (viewport) {
        const video = viewport.querySelector('video');
        if (video && video.srcObject) {
          video.srcObject.getTracks().forEach((t) => t.stop());
          video.srcObject = null;
        }
      }
    } catch {}
  };

  const startScanner = async () => {
    try {
      html5QrCodeRef.current = new Html5Qrcode('scanner-viewport');
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 150 } },
        async (text) => { onScan(text); await stopScanner(); onClose(); },
        () => {}
      );
    } catch { setError(t('cameraError')); setScanning(false); }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={handleClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md modal-content">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('scanBarcode')}</h2>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-4">
          <div id="scanner-viewport" className="rounded-lg overflow-hidden" />
          {error && <p className="text-sm text-amber-600 dark:text-amber-400 text-center mt-3">{error}</p>}
          {scanning && <p className="text-sm text-gray-500 text-center mt-3 animate-pulse">{t('pointCamera')}</p>}
        </div>
      </div>
    </div>
  );
}

function CheckoutModal({ total, taxRate, onClose, onComplete }) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receivedAmount, setReceivedAmount] = useState(total.toFixed(0));
  const [customerName, setCustomerName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showDelivery, setShowDelivery] = useState(false);
  const [processing, setProcessing] = useState(false);
  const change = Math.max(0, parseFloat(receivedAmount || 0) - total);
  const taxAmount = Math.round(total * taxRate / (1 + taxRate));
  const subtotal = total - taxAmount;

  const handleComplete = async () => {
    if (parseFloat(receivedAmount) < total) { toast.error("Qabul qilingan summa kam"); return; }
    setProcessing(true);
    await onComplete({
      payment_method: paymentMethod,
      received_amount: parseFloat(receivedAmount),
      customer_name: customerName || undefined,
      promo_code: promoCode || undefined,
      delivery_address: showDelivery ? (deliveryAddress || undefined) : undefined,
    });
    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] modal-content flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('checkout')}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="text-center py-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl">
            <p className="text-sm text-gray-500 mb-1">{t('totalAmount')}</p>
            <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(total)}</p>
          </div>
          {taxRate > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{t('subtotal') || 'Oraliq yig'}</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('tax') || 'Soliq'} ({(taxRate * 100).toFixed(0)}%)</span><span className="font-medium">{formatCurrency(taxAmount)}</span></div>
              <div className="flex justify-between font-bold border-t border-gray-200 dark:border-gray-600 pt-1.5"><span>{t('total')}</span><span>{formatCurrency(total)}</span></div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('customerName')}</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={t('walkInCustomer')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">🏷️ Promo-kod</label>
            <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono uppercase" placeholder="Masalan: BONUS10" />
          </div>
          <div>
            <button onClick={() => setShowDelivery(!showDelivery)} className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${showDelivery ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">🚚</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Yetkazib berish</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${showDelivery ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                {showDelivery && <span className="w-2 h-2 rounded-full bg-white"></span>}
              </div>
            </button>
          </div>
          {showDelivery && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">🚚 Yetkazib berish manzili</label>
              <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Manzilni kiriting..." rows={2} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('paymentMethod')}</label>
            <div className="grid grid-cols-3 gap-2">
              {[['cash', t('cash'), '💵'], ['card', t('card'), '💳'], ['other', t('other'), '📱']].map(([m, l, e]) => (
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('receivedAmount')}</label>
                <input type="number" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} className="input-field text-lg font-semibold dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">{t('change')}</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(change)}</p>
              </div>
            </>
          )}
          <button onClick={handleComplete} disabled={processing} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3.5 rounded-xl text-base font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25 active:scale-[0.98]">
            {processing ? t('processing') : t('completeSale')}
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

  const receiptDate = sale.created_at ? new Date(String(sale.created_at).replace(' ', 'T')) : new Date();
  const validDate = Number.isNaN(receiptDate.getTime()) ? new Date() : receiptDate;
  const dateStr = validDate.toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent' });
  const timeStr = validDate.toLocaleTimeString('uz-UZ', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit' });

  const storeName = settings?.store_name || "Oziq-ovqat Do'koni";
  const storeAddress = settings?.store_address || "Toshkent shahri, Bunyodkor ko'chasi 15";
  const storePhone = settings?.store_phone || "+998 90 123 45 67";
  const receiptHeader = settings?.receipt_header || '';
  const receiptFooter = settings?.receipt_footer || 'Xaridingiz uchun rahmat!\nYana kutamiz!';
  const receiptItems = sale.items || [];
  const totalAmount = Number(sale.total_amount || receiptItems.reduce((sum, item) => sum + Number(item.subtotal || item.price * item.quantity || 0), 0));
  const receivedAmount = Number(sale.received_amount || totalAmount);
  const changeAmount = Number(sale.change_amount || Math.max(0, receivedAmount - totalAmount));
  const taxAmount = receiptItems.reduce((sum, item) => sum + Number(item.tax || 0), 0);
  const discountAmount = receiptItems.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  const paymentLabel = sale.payment_method === 'cash' ? t('cash') : sale.payment_method === 'card' ? t('card') : t('other');

  const formatQty = (qty) => {
    const num = Number(qty || 0);
    return Number.isInteger(num) ? String(num) : num.toLocaleString('uz-UZ');
  };

  const handlePrint = () => {
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      document.body.classList.remove('printing-receipt');
      window.removeEventListener('afterprint', cleanup);
    };
    document.body.classList.add('printing-receipt');
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay no-print" onClick={onClose} />
      <div className="relative bg-neutral-100 dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto modal-content">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 no-print sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('receipt') || 'Chek'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-4 sm:p-6 print:p-0 bg-neutral-100 dark:bg-gray-800">
          <div id="receipt-content" className="thermal-receipt mx-auto w-[320px] max-w-full bg-white text-black border border-neutral-200 shadow-sm p-4 font-mono text-[11px] leading-tight print:border-0 print:shadow-none">
            <div className="text-center border-b border-dashed border-black pb-2">
              {settings?.logo_url && (
                <div className="flex justify-center mb-2">
                  <img src={settings.logo_url} alt="Logo" className="h-12 w-12 object-contain" />
                </div>
              )}
              {receiptHeader && <p className="mb-1 whitespace-pre-line">{receiptHeader}</p>}
              <p className="text-[10px] tracking-[0.25em] uppercase">Savdo cheki</p>
              <p className="mt-1 text-base font-bold uppercase break-words">{storeName}</p>
              {storeAddress && <p className="mt-1 break-words">Manzil: {storeAddress}</p>}
              {storePhone && <p>Telefon: {storePhone}</p>}
            </div>

            <div className="py-2 border-b border-dashed border-black space-y-1">
              <div className="flex justify-between gap-3"><span>Chek raqami:</span><span className="font-bold text-right break-all">{sale.invoice_number}</span></div>
              <div className="flex justify-between"><span>Sana:</span><span>{dateStr}</span></div>
              <div className="flex justify-between"><span>Vaqt:</span><span>{timeStr}</span></div>
              {sale.customer_name && <div className="flex justify-between gap-3"><span>Mijoz:</span><span className="text-right break-words">{sale.customer_name}</span></div>}
              {sale.delivery_address && <div className="flex justify-between gap-3"><span>Manzil:</span><span className="text-right break-words">{sale.delivery_address}</span></div>}
            </div>

            <div className="py-2 border-b border-dashed border-black">
              <div className="grid grid-cols-[1fr_72px] gap-2 pb-1 border-b border-black/70 font-bold uppercase text-[10px]">
                <span>Mahsulot</span>
                <span className="text-right">Summa</span>
              </div>
              <div className="space-y-2 pt-2">
                {receiptItems.map((item, i) => {
                  const qty = Number(item.quantity || 0);
                  const price = Number(item.price || 0);
                  const subtotal = Number(item.subtotal || price * qty || 0);
                  return (
                    <div key={i}>
                      <div className="font-bold break-words">{i + 1}. {item.product_name || item.name}</div>
                      <div className="grid grid-cols-[1fr_72px] gap-2">
                        <span>{formatQty(qty)} {item.unit || 'dona'} x {formatCurrency(price)}</span>
                        <span className="text-right font-bold">{formatCurrency(subtotal)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="py-2 border-b border-dashed border-black space-y-1">
              {discountAmount > 0 && <div className="flex justify-between"><span>Chegirma:</span><span>-{formatCurrency(discountAmount)}</span></div>}
              {taxAmount > 0 && <div className="flex justify-between"><span>Soliq:</span><span>{formatCurrency(taxAmount)}</span></div>}
              <div className="flex justify-between items-end pt-1 text-sm font-bold uppercase">
                <span>Jami:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <div className="py-2 border-b border-dashed border-black space-y-1">
              <div className="flex justify-between"><span>To'lov turi:</span><span>{paymentLabel}</span></div>
              <div className="flex justify-between"><span>Qabul qilindi:</span><span>{formatCurrency(receivedAmount)}</span></div>
              <div className="flex justify-between font-bold"><span>Qaytim:</span><span>{formatCurrency(changeAmount)}</span></div>
            </div>

            <div className="text-center pt-3">
              {receiptFooter.split('\n').map((line, i) => (
                <p key={i} className="break-words">{line}</p>
              ))}
              <p className="mt-2 text-[10px]">Chekni saqlab qo'ying</p>
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 no-print">
          <button onClick={handlePrint} className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-black">{t('print')}</button>
          <button onClick={onClose} className="btn-secondary">{t('close')}</button>
        </div>
      </div>
    </div>
  );
}

export default function POS() {
  const { items, addItem, updateQuantity, updateDiscount, removeItem, clearCart, getTotal, getItemCount, holdOrder, resumeOrder, heldOrders, removeHeldOrder, currentHoldId } = useCartStore();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [taxRate, setTaxRate] = useState(0);
  const [quantityProduct, setQuantityProduct] = useState(null);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
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
      playScanSound();
      const { data } = await productsAPI.getByBarcode(barcode);
      if (!data?.product) { toast.error(t('notFound')); return; }
      setQuantityProduct(data.product);
    } catch { toast.error(t('notFound')); }
  };

  const handleAddToCart = (product, quantity, unit) => {
    const added = addItem(product, quantity, unit);
    if (!added) toast.error(t('notEnoughStock'));
    else toast.success(`${product.name} ${quantity} ${unit} ${t('productAdded')}`);
  };

  const handleHoldOrder = () => {
    if (items.length === 0) { toast.error("Savat bo'sh"); return; }
    holdOrder();
    toast.success("Buyurtma saqlandi");
  };

  const handleResumeOrder = (holdId) => {
    resumeOrder(holdId);
    setShowHeldOrders(false);
    toast.success("Buyurtma qaytarildi");
  };

  const handleDiscountApply = (productId, value) => {
    const num = parseFloat(value) || 0;
    updateDiscount(productId, num);
    setEditingDiscount(null);
  };

  const handleCheckout = async (info) => {
    try {
      const { data } = await salesAPI.create({ ...info, items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, price: i.price, unit: i.unit || 'pcs', discount: i.discount || 0, tax: i.tax || 0 })) });
      const saleWithItems = { ...data?.sale, items: items.map((i) => ({ ...i, product_name: i.name })) };
      setReceipt(saleWithItems); setShowCheckout(false); clearCart(); loadProducts(); emitDataChanged();
      playSuccessSound();
    } catch (err) { toast.error(getErrorMessage(err, "Sotuvda xato")); }
  };

  return (
    <div className="h-[calc(100vh-4rem)] sm:h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4 animate-fade-in pb-20 lg:pb-0">
      <div className="flex-1 flex flex-col min-w-0 order-1">
        <div className="card flex flex-col h-full">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input ref={searchRef} type="text" placeholder={t('searchOrScan')} value={search} onChange={(e) => setSearch(e.target.value)} data-barcode="true" className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCalcModal(true)} className="bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-1.5 border border-gray-200 dark:border-gray-600 shadow-sm">
                <HiOutlineCalculator className="w-4 h-4" /> Kalk
              </button>
              <button onClick={() => setShowScanner(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-md shadow-indigo-500/20">
                <HiOutlineCamera className="w-4 h-4" /> {t('scan')}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-fr">
            {products.map((product, i) => (
              <button key={product.id} onClick={() => setQuantityProduct(product)} className="flex flex-col items-center justify-between gap-2 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-150 text-center hover:shadow-md border border-gray-100 dark:border-gray-700/50 h-full min-h-[160px] sm:min-h-[180px]" style={{ animationDelay: `${i * 0.02}s` }}>
                <div className="flex flex-col items-center gap-2 flex-1 justify-center">
                  <POSImage src={product.image_url} name={product.name} size="w-16 h-16 sm:w-20 sm:h-20" />
                  <div className="w-full min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white leading-tight break-words line-clamp-2">{product.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{product.product_code}</p>
                  </div>
                </div>
                <div className="w-full flex items-center justify-between gap-1 mt-auto pt-2 border-t border-gray-50 dark:border-gray-700/30">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(product.selling_price)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${product.stock_quantity === 0 ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : product.stock_quantity < product.minimum_stock ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>{product.stock_quantity}</span>
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
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{t('cart')}</h2>
                {items.length > 0 && <p className="text-[10px] text-gray-400">{items.length} {t('items')} / {getItemCount()} dona</p>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {heldOrders.length > 0 && (
                <button onClick={() => setShowHeldOrders(true)} className="relative text-xs text-amber-600 hover:text-amber-700 font-medium px-2 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center gap-1">
                  <HiOutlinePause className="w-3.5 h-3.5" /> Saqlangan ({heldOrders.length})
                </button>
              )}
              {items.length > 0 && (
                <>
                  <button onClick={handleHoldOrder} className="text-xs text-amber-600 hover:text-amber-700 font-medium px-2 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center gap-1" title="Buyurtmani saqlash">
                    <HiOutlinePause className="w-3.5 h-3.5" /> Saqlash
                  </button>
                  <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    {t('clear')}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                  <HiOutlineShoppingCart className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('emptyCart')}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('emptyCartHint')}</p>
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
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight line-clamp-1">{item.name}</p>
                    {item.discount > 0 && (
                      <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                        SALE
                      </span>
                    )}
                  </div>
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
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => setEditingDiscount(editingDiscount === item.product_id ? null : item.product_id)} className={`p-1 rounded-md transition-colors ${item.discount > 0 ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`} title="Chegirma">
                      <HiOutlineTag className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeItem(item.product_id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors">
                      <HiOutlineTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {editingDiscount === item.product_id && (
                    <div className="flex items-center gap-1 mt-0.5 animate-fade-in">
                      <input type="number" defaultValue={item.discount || 0} onBlur={(e) => handleDiscountApply(item.product_id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleDiscountApply(item.product_id, e.target.value); }} className="w-16 text-[10px] px-1.5 py-1 rounded border border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:border-orange-500" placeholder="Chegirma" autoFocus />
                      <span className="text-[10px] text-gray-400">so'm</span>
                    </div>
                  )}
                  {item.discount > 0 && editingDiscount !== item.product_id && (
                    <span className="text-[9px] text-orange-500 font-medium">-{formatCurrency(item.discount)}</span>
                  )}
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
                {t('proceedCheckout')}
              </button>
            </div>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg safe-area-bottom">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <HiOutlineShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{getItemCount()} {t('items')}</p>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(getTotal())}</p>
              </div>
            </div>
            <button onClick={() => setShowCheckout(true)} className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98] flex items-center justify-center gap-2">
              <HiOutlineCheckCircle className="w-5 h-5" />
              {t('completeSale')}
            </button>
          </div>
        </div>
      )}

      {showScanner && <ScannerModal onClose={() => setShowScanner(false)} onScan={(text) => handleBarcodeScan(text)} />}
      {quantityProduct && <QuantityModal product={quantityProduct} onClose={() => setQuantityProduct(null)} onAdd={handleAddToCart} />}
      {showCheckout && <CheckoutModal total={getTotal()} taxRate={taxRate} onClose={() => setShowCheckout(false)} onComplete={handleCheckout} />}
      {receipt && <ReceiptModal sale={receipt} onClose={() => setReceipt(null)} />}
      {showCalcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={() => setShowCalcModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xs">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Kalkulyator</h3>
              <button onClick={() => setShowCalcModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <CalculatorPanel onInput={() => {}} onClose={() => setShowCalcModal(false)} />
            </div>
          </div>
        </div>
      )}
      {showHeldOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={() => setShowHeldOrders(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md modal-content max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Saqlangan buyurtmalar</h2>
              <button onClick={() => setShowHeldOrders(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {heldOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <HiOutlinePause className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Saqlangan buyurtmalar yo'q</p>
                </div>
              ) : heldOrders.map((order) => (
                <div key={order.id} className={`p-3 rounded-xl border transition-all ${order.id === currentHoldId ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-700' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{order.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{order.items.length} mahsulot / {formatCurrency(order.total)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{new Date(order.heldAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleResumeOrder(order.id)} className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors" title="Davom ettirish">
                        <HiOutlinePlay className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeHeldOrder(order.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors" title="O'chirish">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
