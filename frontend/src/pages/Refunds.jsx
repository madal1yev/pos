import { useState, useEffect } from 'react';
import { refundsAPI, salesAPI } from '../services/api';
import { formatCurrency, formatTashkentDate } from '../utils/uzbek';
import { getErrorMessage } from '../utils/errors';
import { HiOutlineArrowUturnLeft, HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineEye, HiOutlineCalendarDays, HiOutlineDocumentText } from 'react-icons/hi2';
import toast from 'react-hot-toast';

function RefundModal({ sale, onClose, onRefunded }) {
  const [saleData, setSaleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refundItems, setRefundItems] = useState({});
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSale();
  }, [sale?.id]);

  const loadSale = async () => {
    setLoading(true);
    try {
      const { data } = await salesAPI.getById(sale.id);
      setSaleData(data.sale);
      // Initialize refund items
      const init = {};
      (data.sale?.items || []).forEach(item => {
        init[item.product_id] = 0;
      });
      setRefundItems(init);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Savdo ma\'lumotlari yuklanmadi'));
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const toggleRefund = (productId, maxQty) => {
    setRefundItems(prev => ({
      ...prev,
      [productId]: prev[productId] > 0 ? 0 : maxQty,
    }));
  };

  const setQty = (productId, qty, maxQty) => {
    setRefundItems(prev => ({
      ...prev,
      [productId]: Math.min(Math.max(0, parseInt(qty) || 0), maxQty),
    }));
  };

  const totalRefund = saleData?.items?.reduce((sum, item) => {
    const qty = parseInt(refundItems[item.product_id] || 0);
    return sum + (qty * parseFloat(item.price));
  }, 0) || 0;

  const hasRefunds = Object.values(refundItems).some(v => v > 0);

  const handleRefund = async () => {
    if (!hasRefunds) { toast.error('Qaytariladigan mahsulot tanlang'); return; }
    setProcessing(true);
    try {
      const items = saleData.items
        .filter(item => parseInt(refundItems[item.product_id] || 0) > 0)
        .map(item => ({
          product_id: item.product_id,
          quantity: parseInt(refundItems[item.product_id]),
          price: parseFloat(item.price),
        }));

      await refundsAPI.create({ sale_id: sale.id, items, reason: reason || undefined });
      toast.success(`Qaytarish amalga oshirildi: ${formatCurrency(totalRefund)}`);
      onRefunded();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Qaytarishda xato'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto modal-content">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <HiOutlineArrowUturnLeft className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mahsulot qaytarish</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Chek:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{sale.invoice_number}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Sana:</span>
              <span>{formatTashkentDate(sale.created_at)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Mijoz:</span>
              <span>{sale.customer_name || 'Anonim'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Qaytariladigan mahsulotlar:</p>
            {saleData?.items?.map((item) => {
              const qty = parseInt(refundItems[item.product_id] || 0);
              const maxQty = item.quantity;
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(item.price)} x {maxQty} dona</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleRefund(item.product_id, maxQty)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${qty > 0 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 text-orange-700 dark:text-orange-400' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
                      {qty > 0 ? `${qty} dona` : 'Tanlash'}
                    </button>
                    {qty > 0 && (
                      <input type="number" min={1} max={maxQty} value={qty} onChange={(e) => setQty(item.product_id, e.target.value, maxQty)} className="w-14 text-center text-sm px-1 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sabab (ixtiyoriy)</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={2} placeholder="Masalan: Mijozga yoqmadi, nuqsonli mahsulot..." />
          </div>

          {hasRefunds && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Qaytariladigan summa:</span>
              <span className="text-xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(totalRefund)}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 btn-secondary">Bekor qilish</button>
            <button onClick={handleRefund} disabled={!hasRefunds || processing} className="flex-1 bg-orange-600 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <HiOutlineArrowUturnLeft className="w-4 h-4" />
              {processing ? 'Jarayonda...' : `${formatCurrency(totalRefund)} qaytarish`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Refunds() {
  const [refunds, setRefunds] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(null);
  const [searchInvoice, setSearchInvoice] = useState('');

  useEffect(() => { loadRefunds(); }, [dateFrom, dateTo]);

  const loadRefunds = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await refundsAPI.getAll({ from_date: dateFrom || undefined, to_date: dateTo || undefined, page, limit: 20 });
      setRefunds(data.refunds || []);
      setPagination(data.pagination || {});
    } catch {
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  };

  const searchSaleForRefund = async () => {
    if (!searchInvoice) return;
    try {
      const { data } = await salesAPI.getAll({ search: searchInvoice, limit: 1 });
      const sale = data?.sales?.[0];
      if (sale) {
        setShowRefundModal(sale);
      } else {
        toast.error('Savdo topilmadi');
      }
    } catch {
      toast.error('Xatolik');
    }
  };

  const totalRefundAmount = refunds.reduce((sum, r) => sum + parseFloat(r.refund_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HiOutlineArrowUturnLeft className="w-7 h-7 text-orange-500" />
            Qaytarishlar
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pagination.total} ta qaytarish</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <input type="text" value={searchInvoice} onChange={(e) => setSearchInvoice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchSaleForRefund()}
              placeholder="Chek raqami..." className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <button onClick={searchSaleForRefund} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-all flex items-center gap-2 whitespace-nowrap shadow-md">
            <HiOutlineArrowUturnLeft className="w-5 h-5" /> Qaytarish
          </button>
        </div>
      </div>

      <div className="card animate-fade-in-up">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <HiOutlineCalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-sm text-gray-500 hover:text-red-600">Tozalash</button>
          )}
          <div className="flex-1" />
          {refunds.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <span className="text-sm text-gray-500">Jami qaytarilgan:</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">{formatCurrency(totalRefundAmount)}</span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : refunds.length === 0 ? (
        <div className="card text-center py-16">
          <HiOutlineArrowUturnLeft className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">Qaytarishlar mavjud emas</p>
          <p className="text-sm text-gray-400 mt-1">Chek raqamini qidirib qaytarishni boshlang</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-left text-gray-500 dark:text-gray-400">
                  <th className="py-3 px-4 font-semibold">ID</th>
                  <th className="py-3 px-4 font-semibold">Chek</th>
                  <th className="py-3 px-4 font-semibold">Mijoz</th>
                  <th className="py-3 px-4 font-semibold">Kassir</th>
                  <th className="py-3 px-4 font-semibold text-right">Summa</th>
                  <th className="py-3 px-4 font-semibold">Sabab</th>
                  <th className="py-3 px-4 font-semibold text-right">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {refunds.map((r) => (
                  <tr key={r.id} className="hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs">#{r.id}</td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-indigo-600">{r.sale_invoice}</td>
                    <td className="py-3 px-4">{r.customer_name || '-'}</td>
                    <td className="py-3 px-4 text-gray-500">{r.cashier_name}</td>
                    <td className="py-3 px-4 text-right font-bold text-orange-600">{formatCurrency(r.refund_amount)}</td>
                    <td className="py-3 px-4 text-xs text-gray-500 max-w-[200px] truncate">{r.reason || '-'}</td>
                    <td className="py-3 px-4 text-right text-xs text-gray-400">{formatTashkentDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">{pagination.page}/{pagination.totalPages}</p>
          <div className="flex gap-1">
            <button disabled={pagination.page <= 1} onClick={() => loadRefunds(pagination.page - 1)} className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50">Oldingi</button>
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => loadRefunds(pagination.page + 1)} className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50">Keyingi</button>
          </div>
        </div>
      )}

      {showRefundModal && (
        <RefundModal sale={showRefundModal} onClose={() => setShowRefundModal(null)} onRefunded={() => loadRefunds()} />
      )}
    </div>
  );
}
