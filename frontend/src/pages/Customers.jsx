import { useState, useEffect, useRef } from 'react';
import { customersAPI } from '../services/api';
import { formatCurrency } from '../utils/uzbek';
import { HiOutlinePlus, HiOutlineMagnifyingGlass, HiOutlinePencil, HiOutlineTrash, HiOutlineXMark, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineEllipsisVertical, HiOutlineCurrencyDollar, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import { Banknote, UserCheck, BadgeAlert, MoreVertical, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { emitDataChanged } from '../utils/events';

function CustomerModal({ customer, onClose, onSave }) {
  const [form, setForm] = useState({
    name: customer?.name || '', phone: customer?.phone || '',
    debt: customer?.debt || '', address: customer?.address || '',
    notes: customer?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone || null,
        debt: parseFloat(form.debt) || 0,
        address: form.address || null,
        notes: form.notes || null,
      };
      if (customer) { await customersAPI.update(customer.id, payload); toast.success('Qarzdor yangilandi'); }
      else { await customersAPI.create(payload); toast.success("Qarzdor qo'shildi"); }
      emitDataChanged(); onSave();
    } catch (err) { toast.error('Xatolik yuz berdi'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{customer ? 'Qarzdorni tahrirlash' : "Yangi qarzdor qo'shish"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ism familiya *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" placeholder="Qarzdor ismi" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Telefon</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" placeholder="+998901234567" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Qarz miqdori (so'm)</label>
              <input type="number" step="0.01" min="0" value={form.debt} onChange={(e) => setForm({...form, debt: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" placeholder="0" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Manzil</label>
              <input type="text" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Izoh</label>
              <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none" placeholder="Qo'shimcha ma'lumot..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Bekor qilish</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25">
              {saving ? 'Saqlanmoqda...' : customer ? 'Saqlash' : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DebtModal({ customer, onClose, onSave }) {
  const currentDebt = parseFloat(customer.debt_amount) || parseFloat(customer.debt) || 0;
  const isDebtor = customer.debt_status === 'has_debt' || currentDebt > 0;
  const [amount, setAmount] = useState(isDebtor ? String(currentDebt) : '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount) || 0;
    if (val <= 0 && isDebtor) { toast.error('Summani kiriting'); return; }
    setSaving(true);
    try {
      if (isDebtor) {
        // To'lash — qarzni kamaytirish
        const newDebt = Math.max(0, currentDebt - val);
        const newStatus = newDebt > 0 ? 'has_debt' : 'no_debt';
        await customersAPI.updateDebt(customer.id, { debt_amount: newDebt, debt_status: newStatus });
        toast.success(val >= currentDebt ? 'Qarz to\'liq to\'landi!' : `${formatCurrency(val)} to\'landi. Qoldiq: ${formatCurrency(newDebt)}`);
      } else {
        // Qarz qo'shish
        const newDebt = currentDebt + val;
        await customersAPI.updateDebt(customer.id, { debt_amount: newDebt, debt_status: 'has_debt' });
        toast.success(`${formatCurrency(val)} qarz qo'shildi`);
      }
      emitDataChanged(); onSave();
    } catch (err) { toast.error('Xatolik yuz berdi'); } finally { setSaving(false); }
  };

  const quickAmounts = [10000, 25000, 50000, 100000, 250000, 500000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isDebtor ? 'Qarzni to\'lash' : 'Qarz qo\'shish'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{customer.name}</p>
              <p className="text-xs text-gray-500">Joriy qarz: <span className="font-semibold text-red-600">{formatCurrency(currentDebt)}</span></p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {isDebtor ? 'Qancha summa to\'layapsiz? (so\'m)' : 'Qarz summasi (so\'m)'}
            </label>
            <input type="number" step="1000" min="0" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-2xl font-bold text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-center"
              placeholder="0" autoFocus />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {quickAmounts.map(a => (
              <button key={a} type="button" onClick={() => setAmount(String(a))} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 transition-all">
                {formatCurrency(a)}
              </button>
            ))}
          </div>

          {isDebtor && amount && parseFloat(amount) > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 text-center">
                Qoldiq: <span className="font-bold">{formatCurrency(Math.max(0, currentDebt - parseFloat(amount)))}</span>
                {parseFloat(amount) >= currentDebt && <span className="block text-xs mt-1 font-semibold">To'liq to'lanadi ✓</span>}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Bekor qilish</button>
            <button type="submit" disabled={saving || !amount || parseFloat(amount) <= 0} className={`flex-1 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 shadow-lg ${isDebtor ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/25'}`}>
              {saving ? 'Saqlanmoqda...' : isDebtor ? 'To\'lash' : "Qarz qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActionsDropdown({ customer, onEdit, onDelete, onDebtAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentDebt = parseFloat(customer.debt_amount) || parseFloat(customer.debt) || 0;
  const isDebtor = customer.debt_status === 'has_debt' || currentDebt > 0;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 animate-fade-in">
          {isDebtor ? (
            <button onClick={() => { setOpen(false); onDebtAction(customer, 'pay'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
              <Banknote className="w-4 h-4" />
              <span>To'landi</span>
              <span className="ml-auto text-xs font-semibold text-emerald-600">{formatCurrency(currentDebt)}</span>
            </button>
          ) : (
            <button onClick={() => { setOpen(false); onDebtAction(customer, 'add'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
              <BadgeAlert className="w-4 h-4" />
              <span>Qarzdor</span>
            </button>
          )}
          <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
          <button onClick={() => { setOpen(false); onEdit(customer); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <Pencil className="w-4 h-4" />
            <span>Tahrirlash</span>
          </button>
          <button onClick={() => { setOpen(false); onDelete(customer); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <Trash2 className="w-4 h-4" />
            <span>O'chirish</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [deleteCustomer, setDeleteCustomer] = useState(null);
  const [debtModalCustomer, setDebtModalCustomer] = useState(null);
  const [debtAction, setDebtAction] = useState('add');

  useEffect(() => { loadCustomers(); }, [search]);

  useEffect(() => {
    const handler = () => loadCustomers();
    window.addEventListener('pos:data-changed', handler);
    return () => window.removeEventListener('pos:data-changed', handler);
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try { const { data } = await customersAPI.getAll({ search }); setCustomers(data?.customers || []); }
    catch {} finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteCustomer) return;
    try {
      await customersAPI.delete(deleteCustomer.id);
      toast.success("O'chirildi");
      setDeleteCustomer(null);
      loadCustomers();
      emitDataChanged();
    } catch (err) {
      console.error('Delete error:', err?.response?.data || err.message);
      toast.error(err?.response?.data?.error || "O'chirishda xato");
    }
  };

  const handleDebtAction = (customer, action) => {
    setDebtModalCustomer(customer);
    setDebtAction(action);
  };

  const totalDebt = customers.reduce((sum, c) => {
    const debtVal = parseFloat(c.debt_amount) || parseFloat(c.debt) || 0;
    return sum + ((c.debt_status === 'has_debt' || debtVal > 0) ? debtVal : 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Qarzdorlar</h1>
          <p className="text-sm text-gray-500 mt-1">{customers.length} ta qarzdor, jami: <span className={`font-bold ${totalDebt > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatCurrency(totalDebt)}</span></p>
        </div>
        <button onClick={() => { setEditCustomer(null); setShowModal(true); }} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25">
          <HiOutlinePlus className="w-5 h-5" /> Qarzdor qo'shish
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Qarzdor qidirish (ism, telefon)..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Qarzdor topilmadi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-4 pb-3 font-medium">Qarzdor</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">Telefon</th>
                  <th className="pb-3 font-medium text-center">Holat</th>
                  <th className="pb-3 font-medium text-right">Qarz miqdori</th>
                  <th className="pb-3 font-medium text-right w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {customers.map(c => {
                  const debtVal = parseFloat(c.debt_amount) || parseFloat(c.debt) || 0;
                  const hasDebt = c.debt_status === 'has_debt' || debtVal > 0;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{c.name}</p>
                            {c.phone && <p className="text-xs text-gray-400 truncate">{c.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{c.phone || '-'}</td>
                      <td className="py-3 text-center">
                        {hasDebt
                          ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">Qarzdor</span>
                          : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">To'langan</span>}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`font-bold text-sm ${hasDebt ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {formatCurrency(debtVal)}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <ActionsDropdown customer={c} onEdit={(c) => { setEditCustomer(c); setShowModal(true); }} onDelete={setDeleteCustomer} onDebtAction={handleDebtAction} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <CustomerModal customer={editCustomer} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); loadCustomers(); }} />}

      {debtModalCustomer && (
        <DebtModal customer={debtModalCustomer} onClose={() => setDebtModalCustomer(null)} onSave={() => { setDebtModalCustomer(null); loadCustomers(); }} />
      )}

      {deleteCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteCustomer(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 shadow-lg">
              <HiOutlineExclamationTriangle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Qarzdorni o'chirish</h3>
            <p className="text-sm text-gray-500 mt-2"><strong>{deleteCustomer.name}</strong> ni o'chirmoqchimisiz?</p>
            <p className="text-xs text-gray-400 mt-1">Bu amal bekor qilib bo'lmaydi.</p>
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setDeleteCustomer(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Bekor qilish</button>
              <button onClick={handleDelete} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/25">
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
