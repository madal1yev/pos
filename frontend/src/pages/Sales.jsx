import { useState, useEffect } from 'react';
import { salesAPI } from '../services/api';
import { UZ, formatCurrency } from '../utils/uzbek';
import { HiOutlineMagnifyingGlass, HiOutlineEye, HiOutlineXMark } from 'react-icons/hi2';
import toast from 'react-hot-toast';

function InvoiceModal({ saleId, onClose }) {
  const [invoice, setInvoice] = useState(null);
  useEffect(() => { (async () => { try { const { data } = await salesAPI.getInvoice(saleId); setInvoice(data?.invoice || data); } catch { toast.error("Xato"); } })(); }, [saleId]);

  if (!invoice) return <div className="fixed inset-0 z-50 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto modal-content">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 no-print">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{UZ.invoice} #{invoice?.invoice_number}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <div className="text-center mb-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{invoice?.settings?.store_name || "Oziq-ovqat do'koni"}</h3>
            {invoice?.settings?.store_address && <p className="text-xs text-gray-500">{invoice.settings.store_address}</p>}
          </div>
          <div className="text-center text-xs text-gray-500 mb-4 border-b pb-3">
            <p>{UZ.invoice}: {invoice?.invoice_number}</p>
            <p>{UZ.date}: {new Date(invoice?.created_at).toLocaleString('uz-UZ')}</p>
            <p>{UZ.cashier}: {invoice?.cashier_name}</p>
          </div>
          <table className="w-full text-sm mb-4">
            <thead><tr className="border-b text-gray-500 text-xs"><th className="text-left py-2">{UZ.productsTitle}</th><th className="text-center py-2">{UZ.stockQuantity}</th><th className="text-right py-2">{UZ.sellingPrice.replace(' *','')}</th><th className="text-right py-2">{UZ.total}</th></tr></thead>
            <tbody>{invoice?.items?.map((item, i) => (
              <tr key={i} className="border-b border-dashed"><td className="py-2 text-gray-900 dark:text-white">{item.product_name}</td><td className="py-2 text-center">{item.quantity}</td><td className="py-2 text-right">{formatCurrency(item.price)}</td><td className="py-2 text-right font-medium">{formatCurrency(item.subtotal)}</td></tr>
            ))}</tbody>
          </table>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>{UZ.total}</span><span>{formatCurrency(invoice?.total_amount)}</span></div>
            <div className="flex justify-between text-gray-500"><span>{UZ.payment}</span><span>{invoice?.payment_method === 'cash' ? UZ.cash : invoice?.payment_method === 'card' ? UZ.card : UZ.other}</span></div>
            <div className="flex justify-between text-gray-500"><span>{UZ.receivedAmount}</span><span>{formatCurrency(invoice?.received_amount)}</span></div>
            <div className="flex justify-between text-emerald-600 font-medium"><span>{UZ.change}</span><span>{formatCurrency(invoice?.change_amount)}</span></div>
          </div>
          {invoice?.settings?.receipt_footer && <p className="text-center text-xs text-gray-500 mt-4 pt-3 border-t">{invoice.settings.receipt_footer}</p>}
        </div>
        <div className="flex justify-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 no-print">
          <button onClick={() => window.print()} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700">{UZ.print}</button>
          <button onClick={onClose} className="btn-secondary">{UZ.close}</button>
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
    try { const { data } = await salesAPI.getAll({ search, payment_method: paymentFilter, from_date: dateFrom, to_date: dateTo, page, limit: 50 }); setSales(data?.sales || []); setPagination(data?.pagination || { page: 1, total: 0 }); }
    catch { toast.error("Sotuvlar yuklanmadi"); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-down">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{UZ.salesTitle}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pagination.total} tranzaksiya</p>
      </div>
      <div className="card animate-fade-in-up stagger-1">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1"><HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder={UZ.search} value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="input-field w-auto sm:w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">{UZ.allMethods}</option>
            <option value="cash">{UZ.cash}</option>
            <option value="card">{UZ.card}</option>
            <option value="other">{UZ.other}</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin h-6 w-6 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>
        ) : sales.length === 0 ? (
          <div className="text-center py-12 text-gray-400">{UZ.noData}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="pb-3 font-medium">{UZ.invoice}</th><th className="pb-3 font-medium">{UZ.customer}</th><th className="pb-3 font-medium">{UZ.cashier}</th><th className="pb-3 font-medium">{UZ.payment}</th><th className="pb-3 font-medium text-right">{UZ.amount}</th><th className="pb-3 font-medium text-right">{UZ.date}</th><th className="pb-3 font-medium text-right"></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 font-mono text-xs font-medium text-gray-900 dark:text-white">{sale.invoice_number}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{sale.customer_name || "O'tib ketgan"}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{sale.cashier_name}</td>
                    <td className="py-3"><span className="badge-info capitalize">{sale.payment_method === 'cash' ? UZ.cash : sale.payment_method === 'card' ? UZ.card : UZ.other}</span></td>
                    <td className="py-3 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(sale.total_amount)}</td>
                    <td className="py-3 text-right text-gray-500 text-xs">{new Date(sale.created_at).toLocaleDateString('uz-UZ')}</td>
                    <td className="py-3 text-right"><button onClick={() => setViewInvoice(sale.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600"><HiOutlineEye className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500">{pagination.page} / {pagination.totalPages}</p>
            <div className="flex gap-1">{Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => loadSales(p)} className={`px-3 py-1 rounded-lg text-sm font-medium ${p === pagination.page ? 'bg-emerald-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{p}</button>
            ))}</div>
          </div>
        )}
      </div>
      {viewInvoice && <InvoiceModal saleId={viewInvoice} onClose={() => setViewInvoice(null)} />}
    </div>
  );
}
