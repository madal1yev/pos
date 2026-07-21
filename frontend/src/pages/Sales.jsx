import { useState, useEffect, useRef } from 'react';
import { salesAPI } from '../services/api';
import { UZ, formatCurrency } from '../utils/uzbek';
import { HiOutlineMagnifyingGlass, HiOutlineEye, HiOutlineXMark, HiOutlinePrinter, HiOutlineCalendarDays, HiOutlineArrowPath, HiOutlineClipboardDocumentList } from 'react-icons/hi2';
import { emitDataChanged } from '../utils/events';
import toast from 'react-hot-toast';

function InvoiceModal({ saleId, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef(null);

  useEffect(() => {
    (async () => {
      try { const { data } = await salesAPI.getInvoice(saleId); setInvoice(data?.invoice || data); }
      catch { toast.error("Xato"); }
      finally { setLoading(false); }
    })();
  }, [saleId]);

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Chek</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 16px; color: #000; max-width: 300px; margin: 0 auto; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .large { font-size: 16px; }
        .border-top { border-top: 1px dashed #000; margin: 8px 0; padding-top: 8px; }
        .border-bottom { border-bottom: 1px dashed #000; margin: 8px 0; padding-bottom: 8px; }
        table { width: 100%; }
        td { padding: 2px 0; }
        .right { text-align: right; }
      </style></head><body>
      <div class="center bold large">${invoice?.settings?.store_name || "Do'kon"}</div>
      ${invoice?.settings?.store_address ? `<div class="center">${invoice.settings.store_address}</div>` : ''}
      ${invoice?.settings?.store_phone ? `<div class="center">${invoice.settings.store_phone}</div>` : ''}
      <div class="border-top center">
        <div>Chek: ${invoice?.invoice_number}</div>
        <div>Sana: ${new Date(invoice?.created_at).toLocaleString('uz-UZ')}</div>
        <div>Kassir: ${invoice?.cashier_name}</div>
      </div>
      <table>${invoice?.items?.map(item => `<tr><td>${item.product_name} x${item.quantity}</td><td class="right bold">${formatCurrency(item.subtotal)}</td></tr>`).join('')}</table>
      <div class="border-top">
        <table>
          <tr><td class="bold">JAMI:</td><td class="right bold large">${formatCurrency(invoice?.total_amount)}</td></tr>
          <tr><td>To'lov:</td><td class="right">${invoice?.payment_method === 'cash' ? 'Naqd' : invoice?.payment_method === 'card' ? 'Karta' : 'Boshqa'}</td></tr>
          <tr><td>Qabul qilindi:</td><td class="right">${formatCurrency(invoice?.received_amount)}</td></tr>
          <tr><td class="bold">Yetib qoldi:</td><td class="right bold">${formatCurrency(invoice?.change_amount)}</td></tr>
        </table>
      </div>
      ${invoice?.settings?.receipt_footer ? `<div class="border-top center">${invoice.settings.receipt_footer.replace(/\n/g, '<br>')}</div>` : ''}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto modal-content">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 no-print">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{UZ.invoice}</h2>
            <p className="text-xs text-gray-400">#{invoice?.invoice_number}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>

        <div ref={receiptRef} className="p-6">
          <div className="text-center mb-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">🧾</span>
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{invoice?.settings?.store_name || "Oziq-ovqat do'koni"}</h3>
            {invoice?.settings?.store_address && <p className="text-xs text-gray-500 mt-0.5">{invoice.settings.store_address}</p>}
            {invoice?.settings?.store_phone && <p className="text-xs text-gray-500">{invoice.settings.store_phone}</p>}
          </div>

          <div className="border-t border-b border-dashed border-gray-200 dark:border-gray-600 py-3 my-4">
            <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
              <span>{UZ.invoice}:</span><span className="text-right font-medium text-gray-900 dark:text-white font-mono">{invoice?.invoice_number}</span>
              <span>{UZ.date}:</span><span className="text-right text-gray-900 dark:text-white">{new Date(invoice?.created_at).toLocaleString('uz-UZ')}</span>
              <span>{UZ.cashier}:</span><span className="text-right text-gray-900 dark:text-white">{invoice?.cashier_name}</span>
              <span>{UZ.payment}:</span>
              <span className="text-right">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                  invoice?.payment_method === 'cash' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  invoice?.payment_method === 'card' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                }`}>{invoice?.payment_method === 'cash' ? UZ.cash : invoice?.payment_method === 'card' ? UZ.card : UZ.other}</span>
              </span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {invoice?.items?.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                  <p className="text-xs text-gray-400">{item.quantity} x {formatCurrency(item.price)}</p>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white ml-3">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-600 pt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">{UZ.receivedAmount}</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(invoice?.received_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{UZ.change}</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{formatCurrency(invoice?.change_amount)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between">
              <span className="font-bold text-gray-900 dark:text-white">{UZ.total}</span>
              <span className="font-bold text-gray-900 dark:text-white text-xl">{formatCurrency(invoice?.total_amount)}</span>
            </div>
          </div>

          {invoice?.settings?.receipt_footer && (
            <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-gray-600">
              {invoice.settings.receipt_footer.split('\n').map((line, i) => (
                <p key={i} className="text-xs text-gray-500">{line}</p>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 no-print">
          <button onClick={onClose} className="flex-1 btn-secondary">{UZ.close}</button>
          <button onClick={handlePrint} className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
            <HiOutlinePrinter className="w-4 h-4" /> {UZ.print}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewInvoice, setViewInvoice] = useState(null);

  useEffect(() => { loadSales(); }, [search, paymentFilter, dateFrom, dateTo]);

  useEffect(() => {
    const handler = () => loadSales(pagination.page);
    window.addEventListener('pos:data-changed', handler);
    return () => window.removeEventListener('pos:data-changed', handler);
  }, [pagination.page]);

  const loadSales = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await salesAPI.getAll({ search, payment_method: paymentFilter, from_date: dateFrom, to_date: dateTo, page, limit: 50 });
      setSales(data?.sales || []);
      setPagination(data?.pagination || { page: 1, total: 0 });
    } catch { toast.error("Sotuvlar yuklanmadi"); } finally { setLoading(false); }
  };

  const totalRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{UZ.salesTitle}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pagination.total} tranzaksiya</p>
        </div>
        {sales.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
            <span className="text-sm text-gray-500">Ko'rsatilgan:</span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(totalRevenue)}</span>
          </div>
        )}
      </div>

      <div className="card animate-fade-in-up stagger-1">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder={`${UZ.search}... (chia, mijoz, tranzaksiya)`} value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="input-field w-auto sm:w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">Barcha usul</option>
            <option value="cash">{UZ.cash}</option>
            <option value="card">{UZ.card}</option>
            <option value="other">{UZ.other}</option>
          </select>
          <div className="relative">
            <HiOutlineCalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field pl-10 w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          {(dateFrom || dateTo || search || paymentFilter) && (
            <button onClick={() => { setSearch(''); setPaymentFilter(''); setDateFrom(''); setDateTo(''); }} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
              <HiOutlineArrowPath className="w-4 h-4" /> Tozalash
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-400">Sotuvlar yuklanmoqda...</p>
          </div>
        </div>
      ) : sales.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
            <HiOutlineClipboardDocumentList className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Sotuvlar topilmadi</p>
          <p className="text-sm text-gray-400 mt-1">Filtrlarni o'zgartiring yoki yangi sotuv amalga oshiring</p>
        </div>
      ) : (
        <div className="card animate-fade-in-up stagger-2 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50">
                  <th className="py-3 px-4 font-medium">{UZ.invoice}</th>
                  <th className="py-3 px-4 font-medium">{UZ.customer}</th>
                  <th className="py-3 px-4 font-medium">{UZ.cashier}</th>
                  <th className="py-3 px-4 font-medium">{UZ.payment}</th>
                  <th className="py-3 px-4 font-medium text-right">{UZ.amount}</th>
                  <th className="py-3 px-4 font-medium text-right">{UZ.date}</th>
                  <th className="py-3 px-4 font-medium text-right w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors cursor-pointer" onClick={() => setViewInvoice(sale.id)}>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">{sale.invoice_number}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-gray-900 dark:text-white font-medium">{sale.customer_name || "O'tib ketgan"}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">{sale.cashier_name}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                        sale.payment_method === 'cash' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        sale.payment_method === 'card' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                      }`}>{sale.payment_method === 'cash' ? UZ.cash : sale.payment_method === 'card' ? UZ.card : UZ.other}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-gray-900 dark:text-white text-base">{formatCurrency(sale.total_amount)}</td>
                    <td className="py-3.5 px-4 text-right text-gray-500 text-xs">{new Date(sale.created_at).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="p-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-colors">
                        <HiOutlineEye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between animate-fade-in">
          <p className="text-sm text-gray-500">{pagination.page} / {pagination.totalPages} sahifa</p>
          <div className="flex gap-1">
            <button disabled={pagination.page <= 1} onClick={() => loadSales(pagination.page - 1)} className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50 transition-colors">Oldingi</button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => loadSales(p)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${p === pagination.page ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{p}</button>
            ))}
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => loadSales(pagination.page + 1)} className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50 transition-colors">Keyingi</button>
          </div>
        </div>
      )}

      {viewInvoice && <InvoiceModal saleId={viewInvoice} onClose={() => setViewInvoice(null)} />}
    </div>
  );
}
