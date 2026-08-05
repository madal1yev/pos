import { useState, useEffect } from 'react';
import { shiftsAPI } from '../services/api';
import { formatCurrency } from '../utils/uzbek';
import { getErrorMessage } from '../utils/errors';
import { HiOutlinePlay, HiOutlineStop, HiOutlineDocumentText, HiOutlineXMark, HiOutlineClock, HiOutlineUser, HiOutlineBanknotes, HiOutlineReceiptPercent, HiOutlinePrinter } from 'react-icons/hi2';
import toast from 'react-hot-toast';

function ZReportModal({ shift, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [shift?.id]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const { data } = await shiftsAPI.getZReport(shift.id);
      setReport(data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Hisobot yuklanmadi'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500">Z-hisobot yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const s = shift;
  const z = report.z_report || {};
  const paymentBreakdown = z.payment_breakdown || [];

  const openedAt = s.opened_at ? new Date(s.opened_at.replace(' ', 'T')) : new Date();
  const closedAt = s.closed_at ? new Date(s.closed_at.replace(' ', 'T')) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <HiOutlineDocumentText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold">Z-hisobot #{s.id}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>

        <div className="p-6 font-mono text-sm">
          <div className="bg-gray-900 text-gray-100 rounded-xl p-4 space-y-2 text-xs leading-relaxed">
            <div className="text-center border-b border-gray-700 pb-2 mb-2">
              <p className="font-bold text-sm">Z-HISOBOT</p>
              {s.opened_by_name && <p>Kassir: {s.opened_by_name}</p>}
              <p>Smena ID: #{s.id}</p>
            </div>

            <div className="border-b border-gray-700 pb-2">
              <p>Ochilgan: {openedAt.toLocaleString('uz-UZ')}</p>
              {closedAt && <p>Yopilgan: {closedAt.toLocaleString('uz-UZ')}</p>}
              <p>Holat: {s.status === 'closed' ? 'Yopilgan' : 'Ochiq'}</p>
            </div>

            <div className="border-b border-gray-700 pb-2 space-y-1">
              <p className="font-bold">MOLIYAVIY HISOBOT</p>
              <div className="flex justify-between"><span>Boshlang'ich naqd:</span><span>{formatCurrency(s.opening_cash || 0)}</span></div>
              <div className="flex justify-between"><span>Jami sotuv:</span><span>{formatCurrency(z.total_sales || s.total_sales || 0)}</span></div>
              <div className="flex justify-between"><span>Kutilgan summa:</span><span>{formatCurrency(s.expected_cash || 0)}</span></div>
              <div className="flex justify-between"><span>Haqiqiy summa:</span><span>{formatCurrency(s.closing_cash || 0)}</span></div>
              <div className={`flex justify-between font-bold ${s.cash_difference < 0 ? 'text-red-400' : s.cash_difference > 0 ? 'text-emerald-400' : ''}`}>
                <span>Farq:</span><span>{formatCurrency(s.cash_difference || 0)}</span>
              </div>
              <div className="flex justify-between"><span>Transaksiyalar:</span><span>{s.total_transactions || 0}</span></div>
            </div>

            {paymentBreakdown.length > 0 && (
              <div className="border-b border-gray-700 pb-2">
                <p className="font-bold mb-1">TO'LOV TURLARI</p>
                {paymentBreakdown.map((p, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{p.payment_method === 'cash' ? 'Naqd' : p.payment_method === 'card' ? 'Karta' : 'Boshqa'}:</span>
                    <span>{p.count} ta / {formatCurrency(p.total)}</span>
                  </div>
                ))}
              </div>
            )}

            {z.top_products && z.top_products.length > 0 && (
              <div className="border-b border-gray-700 pb-2">
                <p className="font-bold mb-1">Top mahsulotlar</p>
                {z.top_products.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="truncate max-w-[200px]">{i + 1}. {p.name}</span>
                    <span>{p.qty} dona</span>
                  </div>
                ))}
              </div>
            )}

            {s.notes && <div className="border-b border-gray-700 pb-2"><p>Eslatma: {s.notes}</p></div>}

            <div className="text-center pt-2">
              <p className="text-[10px] opacity-50">POS tizimi | {new Date().toLocaleString('uz-UZ')}</p>
            </div>
          </div>

          <button onClick={() => window.print()} className="w-full mt-4 bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-black transition-all flex items-center justify-center gap-2">
            <HiOutlinePrinter className="w-5 h-5" /> Chop etish
          </button>
        </div>
      </div>
    </div>
  );
}

function OpenShiftModal({ onClose, onOpened }) {
  const [openingCash, setOpeningCash] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleOpen = async () => {
    setSaving(true);
    try {
      const { data } = await shiftsAPI.open({ opening_cash: parseFloat(openingCash) || 0, notes });
      toast.success(data.message || 'Smena ochildi');
      onOpened(data.shift);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Smena ochilmadi'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HiOutlinePlay className="w-5 h-5 text-emerald-500" /> Smena ochish
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Boshlang'ich naqd pul</label>
            <input type="number" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} className="input-field" placeholder="0" />
            <p className="text-xs text-gray-400 mt-1">Kassadagi boshlang'ich pul miqdori</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Eslatma (ixtiyoriy)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" rows={2} placeholder="..." />
          </div>
          <button onClick={handleOpen} disabled={saving} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50">
            {saving ? 'Ochilmoqda...' : 'Smenani ochish'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CloseShiftModal({ shift, onClose, onClosed }) {
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Suggest expected closing cash
    if (shift) {
      const expected = parseFloat(shift.expected_cash || shift.opening_cash || 0);
      setClosingCash(String(Math.round(expected)));
    }
  }, [shift]);

  const handleClose = async () => {
    if (!closingCash || isNaN(parseFloat(closingCash))) {
      toast.error('Yopish summasini kiriting');
      return;
    }
    setSaving(true);
    try {
      const { data } = await shiftsAPI.close(shift.id, {
        closing_cash: parseFloat(closingCash),
        notes,
      });
      toast.success(data.message || 'Smena yopildi');
      onClosed(data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Smena yopilmadi'));
    } finally {
      setSaving(false);
    }
  };

  const diff = parseFloat(closingCash || 0) - parseFloat(shift.total_sales || 0) - parseFloat(shift.opening_cash || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HiOutlineStop className="w-5 h-5 text-red-500" /> Smenani yopish
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Sotuvlar:</span><span className="font-bold">{formatCurrency(shift.total_sales || 0)}</span></div>
            <div className="flex justify-between"><span>Boshlang'ich naqd:</span><span className="font-bold">{formatCurrency(shift.opening_cash || 0)}</span></div>
            <div className="flex justify-between border-t pt-2"><span>Kutilgan summa:</span><span className="font-bold text-indigo-600">{formatCurrency(parseFloat(shift.opening_cash || 0) + parseFloat(shift.total_sales || 0))}</span></div>
            <div className="flex justify-between"><span>Transaksiyalar:</span><span>{shift.total_transactions || 0} ta</span></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kassadagi haqiqiy naqd pul</label>
            <input type="number" value={closingCash} onChange={(e) => setClosingCash(e.target.value)} className="input-field text-lg font-bold" />
          </div>

          {closingCash && (
            <div className={`rounded-xl p-4 text-center ${Math.abs(diff) > 0 ? (Math.abs(diff) > 10000 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20') : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
              <p className="text-sm text-gray-500">Farq</p>
              <p className={`text-2xl font-bold ${diff === 0 ? 'text-emerald-600' : Math.abs(diff) > 10000 ? 'text-red-600' : 'text-amber-600'}`}>
                {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {diff === 0 ? 'To\'g\'ri' : diff > 0 ? 'Ortiqcha' : 'Kamomad'}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Eslatma</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" rows={2} placeholder="Sababini yozing (agar farq bo'lsa)..." />
          </div>

          <button onClick={handleClose} disabled={saving} className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50">
            {saving ? 'Yopilmoqda...' : 'Smenani yopish va Z-hisobot'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Shifts() {
  const [shifts, setShifts] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showZReport, setShowZReport] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadShifts();
    loadActiveShift();
  }, [statusFilter]);

  const loadShifts = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await shiftsAPI.getAll({ status: statusFilter || undefined, page, limit: 20 });
      setShifts(data.shifts || []);
      setPagination(data.pagination || {});
    } catch {
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveShift = async () => {
    try {
      const { data } = await shiftsAPI.getActive();
      setActiveShift(data.shift || null);
    } catch {
      setActiveShift(null);
    }
  };

  const handleShiftOpened = (shift) => {
    setActiveShift(shift);
    loadShifts();
  };

  const handleShiftClosed = () => {
    setActiveShift(null);
    setShowCloseModal(false);
    loadShifts();
    loadActiveShift();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    if (status === 'open') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Ochiq</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">Yopiq</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HiOutlineClock className="w-7 h-7 text-indigo-600" />
            Smenalar
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pagination.total} ta smena</p>
        </div>
        <div className="flex gap-2">
          {activeShift ? (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Ochiq smena</span>
              <button onClick={() => setShowCloseModal(true)} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-all">
                Yopish
              </button>
            </div>
          ) : (
            <button onClick={() => setShowOpenModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md">
              <HiOutlinePlay className="w-5 h-5" /> Smena ochish
            </button>
          )}
        </div>
      </div>

      {/* Active Shift Card */}
      {activeShift && (
        <div className="card bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-900/10 dark:to-gray-800 border border-emerald-200 dark:border-emerald-800 p-4 sm:p-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <HiOutlineReceiptPercent className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-lg">Joriy smena</p>
                <p className="text-sm text-gray-500">
                  {activeShift.opened_by_name} • {formatDate(activeShift.opened_at)}
                </p>
                <div className="flex gap-4 mt-1 text-sm">
                  <span>Sotuv: <strong>{formatCurrency(activeShift.total_sales || 0)}</strong></span>
                  <span>Trans: <strong>{activeShift.total_transactions || 0}</strong></span>
                </div>
              </div>
            </div>
            <button onClick={() => setShowZReport(activeShift)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center gap-1">
              <HiOutlineDocumentText className="w-4 h-4" /> Z-hisobot
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <button onClick={() => setStatusFilter('')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${!statusFilter ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>Barchasi</button>
        <button onClick={() => setStatusFilter('open')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === 'open' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>Ochiq</button>
        <button onClick={() => setStatusFilter('closed')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === 'closed' ? 'bg-gray-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>Yopiq</button>
      </div>

      {/* Shifts Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Kassir</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Ochilgan</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Yopilgan</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Sotuv</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Trans.</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Holat</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Farq</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {shifts.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">#{s.id}</td>
                  <td className="px-4 py-3 font-medium">{s.opened_by_name || s.cashier_name || '-'}</td>
                  <td className="px-4 py-3 text-xs">{formatDate(s.opened_at)}</td>
                  <td className="px-4 py-3 text-xs">{s.closed_at ? formatDate(s.closed_at) : '-'}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.total_sales || 0)}</td>
                  <td className="px-4 py-3 text-right">{s.total_transactions || 0}</td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(s.status)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${s.cash_difference < 0 ? 'text-red-600' : s.cash_difference > 0 ? 'text-amber-600' : ''}`}>
                    {s.cash_difference !== null ? formatCurrency(s.cash_difference) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setShowZReport(s)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 transition-colors" title="Z-hisobot">
                      <HiOutlineDocumentText className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {shifts.length === 0 && !loading && (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">Smenalar mavjud emas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showOpenModal && <OpenShiftModal onClose={() => setShowOpenModal(false)} onOpened={handleShiftOpened} />}
      {showCloseModal && activeShift && <CloseShiftModal shift={activeShift} onClose={() => setShowCloseModal(false)} onClosed={handleShiftClosed} />}
      {showZReport && <ZReportModal shift={showZReport} onClose={() => setShowZReport(null)} />}
    </div>
  );
}
