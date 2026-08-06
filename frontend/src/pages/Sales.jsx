import { useState, useEffect, useRef } from 'react';
import { salesAPI } from '../services/api';
import { t, formatCurrency, formatTashkentDate, formatTashkentShort } from '../utils/uzbek';
import { HiOutlineMagnifyingGlass, HiOutlineEye, HiOutlineXMark, HiOutlinePrinter, HiOutlineCalendarDays, HiOutlineArrowPath, HiOutlineClipboardDocumentList, HiOutlineNoSymbol, HiOutlineTrash, HiOutlineCheckCircle } from 'react-icons/hi2';
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
      ${invoice?.settings?.logo_url ? `<div class="center"><img src="${invoice.settings.logo_url}" style="height:60px;max-width:60px;object-fit:contain;margin:0 auto;" /></div>` : ''}
      ${invoice?.settings?.store_address ? `<div class="center">${invoice.settings.store_address}</div>` : ''}
      ${invoice?.settings?.store_phone ? `<div class="center">${invoice.settings.store_phone}</div>` : ''}
      <div class="border-top center">
        <div>Chek: ${invoice?.invoice_number}</div>
        <div>Sana: ${formatTashkentDate(invoice?.created_at)}</div>
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chek</h2>
            <p className="text-xs text-gray-400">#{invoice?.invoice_number}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>

        <div ref={receiptRef} className="p-4 sm:p-6 print:p-0 bg-gray-100 dark:bg-gray-800">
          <div className="mx-auto w-[320px] max-w-full bg-white text-black border border-gray-200 shadow-sm p-4 font-mono text-[11px] leading-tight print:border-0 print:shadow-none">
            <div className="text-center border-b border-dashed border-black pb-2 mb-2">
              {invoice?.settings?.logo_url ? (
                <div className="flex justify-center mb-2">
                  <img src={invoice.settings.logo_url} alt="Logo" className="h-12 w-12 object-contain" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl">🧾</span>
                </div>
              )}
              <p className="text-[10px] tracking-[0.25em] uppercase">Savdo cheki</p>
              <p className="mt-1 text-base font-bold uppercase break-words">{invoice?.settings?.store_name || "Oziq-ovqat do'koni"}</p>
              {invoice?.settings?.store_address && <p className="mt-1 break-words">Manzil: {invoice.settings.store_address}</p>}
              {invoice?.settings?.store_phone && <p>Telefon: {invoice.settings.store_phone}</p>}
            </div>

            <div className="py-2 border-b border-dashed border-black space-y-1">
              <div className="flex justify-between gap-3"><span>Chek:</span><span className="font-bold text-right break-all font-mono">{invoice?.invoice_number}</span></div>
              <div className="flex justify-between"><span>Sana:</span><span>{formatTashkentDate(invoice?.created_at)}</span></div>
              <div className="flex justify-between"><span>Kassir:</span><span>{invoice?.cashier_name}</span></div>
              <div className="flex justify-between"><span>To'lov:</span><span className="font-semibold">{invoice?.payment_method === 'cash' ? '💵 Naqd' : invoice?.payment_method === 'card' ? '💳 Karta' : 'Boshqa'}</span></div>
            </div>

            <div className="py-2 border-b border-dashed border-black">
              <div className="grid grid-cols-[1fr_72px] gap-2 pb-1 border-b border-black/70 font-bold uppercase text-[10px]">
                <span>Mahsulot</span>
                <span className="text-right">Summa</span>
              </div>
              <div className="space-y-2 pt-2">
                {invoice?.items?.map((item, i) => {
                  const qty = Number(item.quantity || 0);
                  const price = Number(item.price || 0);
                  const subtotal = Number(item.subtotal || price * qty || 0);
                  return (
                    <div key={i}>
                      <div className="font-bold break-words">{i + 1}. {item.product_name}</div>
                      <div className="grid grid-cols-[1fr_72px] gap-2">
                        <span>{qty} x {formatCurrency(price)}</span>
                        <span className="text-right font-bold">{formatCurrency(subtotal)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="py-2 border-b border-dashed border-black space-y-1">
              <div className="flex justify-between items-end pt-1 text-sm font-bold uppercase">
                <span>Jami:</span>
                <span>{formatCurrency(invoice?.total_amount)}</span>
              </div>
            </div>

            <div className="py-2 border-b border-dashed border-black space-y-1">
              <div className="flex justify-between"><span>Qabul qilindi:</span><span>{formatCurrency(invoice?.received_amount)}</span></div>
              <div className="flex justify-between font-bold"><span>Qaytim:</span><span>{formatCurrency(invoice?.change_amount)}</span></div>
            </div>

            <div className="text-center pt-3">
              {invoice?.settings?.receipt_footer ? invoice.settings.receipt_footer.split('\n').map((line, i) => (
                <p key={i} className="break-words">{line}</p>
              )) : <p>Xaridingiz uchun rahmat!</p>}
              <p className="mt-2 text-[10px]">Chekni saqlab qo'ying</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 no-print">
          <button onClick={onClose} className="flex-1 btn-secondary">{t('close')}</button>
          <button onClick={handlePrint} className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
            <HiOutlinePrinter className="w-4 h-4" /> {t('print')}
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
  const [cancelling, setCancelling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [allPagesSelected, setAllPagesSelected] = useState(false);
  const [loadingAllIds, setLoadingAllIds] = useState(false);

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

  const handleCancelOrder = async (saleId, reason) => {
    if (!window.confirm('Buyurtmani bekor qilishni tasdiqlaysizmi? Mahsulotlar omborga qaytariladi.')) return;
    setCancelling(saleId);
    try {
      await salesAPI.cancelOrder(saleId, reason);
      toast.success('Buyurtma bekor qilindi');
      loadSales(pagination.page);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Xatolik';
      toast.error(msg);
    } finally {
      setCancelling(null);
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (!window.confirm("Sotuv tarixini o'chirishni tasdiqlaysizmi? Mahsulotlar omborga qaytariladi. Bu amalni bekor qilib bo'lmaydi.")) return;
    setDeleting(saleId);
    try {
      await salesAPI.delete(saleId);
      toast.success("Sotuv o'chirildi va mahsulotlar omborga qaytarildi");
      loadSales(pagination.page);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Xatolik';
      toast.error(msg);
    } finally {
      setDeleting(null);
    }
  };

  const toggleSelect = (id) => {
    setAllPagesSelected(false);
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setAllPagesSelected(false);
    if (selectedIds.length === sales.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sales.map((s) => s.id));
    }
  };

  const selectAllPages = async () => {
    if (allPagesSelected) {
      setAllPagesSelected(false);
      setSelectedIds([]);
      return;
    }
    setLoadingAllIds(true);
    try {
      const { data } = await salesAPI.getAllIds({ search, payment_method: paymentFilter, from_date: dateFrom, to_date: dateTo });
      setSelectedIds(data?.ids || []);
      setAllPagesSelected(true);
    } catch {
      toast.error("Sotuvlar yuklanmadi");
    } finally {
      setLoadingAllIds(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`${selectedIds.length} ta sotuvni o'chirishni tasdiqlaysizmi? Mahsulotlar omborga qaytariladi. Bu amalni bekor qilib bo'lmaydi.`)) return;
    setBulkDeleting(true);
    let deleted = 0;
    const errors = [];
    try {
      for (const id of selectedIds) {
        try {
          await salesAPI.delete(id);
          deleted++;
        } catch (err) {
          errors.push(err.response?.data?.error || err.message || 'Xatolik');
        }
      }
      if (deleted > 0) {
        toast.success(`${deleted} ta savdo o'chirildi va mahsulotlar omborga qaytarildi`);
        setSelectedIds([]);
        setAllPagesSelected(false);
        loadSales(pagination.page);
      } else {
        toast.error(errors[0] || "O'chirishda xatolik yuz berdi");
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Xatolik';
      toast.error(msg);
    } finally {
      setBulkDeleting(false);
    }
  };

  const totalRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('salesTitle')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pagination.total} ta sotuv</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all disabled:opacity-50 shadow-lg shadow-red-500/25"
            >
              <HiOutlineTrash className="w-4 h-4" />
              {bulkDeleting ? "O'chirilmoqda..." : `${selectedIds.length} ta o'chirish`}
            </button>
          )}
          {sales.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllPages}
                disabled={loadingAllIds}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all disabled:opacity-50 ${
                  allPagesSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                }`}
              >
                {loadingAllIds ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <HiOutlineCheckCircle className="w-4 h-4" />
                )}
                {allPagesSelected ? 'Tanlash bekor' : 'Hammasini tanlash'}
              </button>
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                <span className="text-sm text-gray-500">Ko'rsatilgan:</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(totalRevenue)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card animate-fade-in-up stagger-1">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder={`${t('search')}... (chek, mijoz)`} value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="input-field w-auto sm:w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">Barcha usul</option>
            <option value="cash">{t('cash')}</option>
            <option value="card">{t('card')}</option>
            <option value="other">{t('other')}</option>
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
                  <th className="py-3 px-4 font-medium w-10">
                    <input
                      type="checkbox"
                      checked={allPagesSelected || (sales.length > 0 && selectedIds.length === sales.length)}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4 font-medium">{t('invoice')}</th>
                  <th className="py-3 px-4 font-medium">{t('customer')}</th>
                  <th className="py-3 px-4 font-medium">{t('cashier')}</th>
                  <th className="py-3 px-4 font-medium">{t('payment')}</th>
                  <th className="py-3 px-4 font-medium text-right">{t('amount')}</th>
                  <th className="py-3 px-4 font-medium text-right">{t('date')}</th>
                  <th className="py-3 px-4 font-medium text-right w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {sales.map((sale) => (
                  <tr key={sale.id} className={`hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors cursor-pointer ${selectedIds.includes(sale.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`} onClick={() => setViewInvoice(sale.id)}>
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(sale.id)}
                        onChange={() => toggleSelect(sale.id)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold">
                      <span className={sale.sale_type === 'voided' ? 'text-gray-400 line-through' : 'text-indigo-600 dark:text-indigo-400'}>{sale.invoice_number}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-gray-900 dark:text-white font-medium">{sale.customer_name || "O'tib ketgan"}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">{sale.cashier_name}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                        sale.payment_method === 'cash' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        sale.payment_method === 'card' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                      }`}>{sale.payment_method === 'cash' ? t('cash') : sale.payment_method === 'card' ? t('card') : t('other')}</span>
                      {sale.sale_type === 'voided' && <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Bekor</span>}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold text-base ${sale.sale_type === 'voided' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{formatCurrency(sale.total_amount)}</td>
                    <td className="py-3.5 px-4 text-right text-gray-500 text-xs">{formatTashkentShort(sale.created_at)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setViewInvoice(sale.id)} className="p-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-colors" title="Ko'rish">
                          <HiOutlineEye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteSale(sale.id)} disabled={deleting === sale.id} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50" title="O'chirish">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
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
