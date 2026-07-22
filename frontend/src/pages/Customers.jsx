import { useState, useEffect } from 'react';
import { customersAPI } from '../services/api';
import { formatCurrency } from '../utils/uzbek';
import { HiOutlinePlus, HiOutlineMagnifyingGlass, HiOutlinePencil, HiOutlineTrash, HiOutlineXMark, HiOutlinePhone, HiOutlineEnvelope, HiOutlineMapPin } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { emitDataChanged } from '../utils/events';

function CustomerModal({ customer, onClose, onSave }) {
  const [form, setForm] = useState({
    name: customer?.name || '', phone: customer?.phone || '',
    email: customer?.email || '', address: customer?.address || '',
    type: customer?.type || 'regular', tax_id: customer?.tax_id || '', notes: customer?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (customer) { await customersAPI.update(customer.id, form); toast.success('Mijoz yangilandi'); }
      else { await customersAPI.create(form); toast.success("Mijoz qo'shildi"); }
      emitDataChanged(); onSave();
    } catch (err) { toast.error('Xatolik yuz berdi'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto modal-content">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{customer ? 'Mijozni tahrirlash' : "Yangi mijoz qo'shish"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mijoz ismi *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Telefon</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="+998901234567" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Manzil</label>
              <input type="text" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tur</label>
              <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="regular">Jismoniy shaxs</option>
                <option value="business">Yuridik shaxs</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">INN/STIR</label>
              <input type="text" value={form.tax_id} onChange={(e) => setForm({...form, tax_id: e.target.value})} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Izoh</label>
              <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={2} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn-secondary">Bekor qilish</button>
            <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-all disabled:opacity-50">
              {saving ? 'Saqlanmoqda...' : customer ? 'Saqlash' : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
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

  useEffect(() => { loadCustomers(); }, [search]);

  useEffect(() => {
    const handler = () => loadCustomers();
    window.addEventListener('pos:data-changed', handler);
    return () => window.removeEventListener('pos:data-changed', handler);
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try { const { data } = await customersAPI.getAll({ search }); setCustomers(data?.customers || []); }
    catch { toast.error("Mijozlar yuklanmadi"); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try { await customersAPI.delete(deleteCustomer.id); toast.success("O'chirildi"); setDeleteCustomer(null); loadCustomers(); emitDataChanged(); }
    catch { toast.error("O'chirishda xato"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-down">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mijozlar</h1><p className="text-sm text-gray-500 mt-1">{customers.length} ta mijoz</p></div>
        <button onClick={() => { setEditCustomer(null); setShowModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md">
          <HiOutlinePlus className="w-5 h-5" /> Mijoz qo'shish
        </button>
      </div>

      <div className="card">
        <div className="relative flex-1 mb-4">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Mijoz qidirish (ism, telefon, email)..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full" />
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Mijoz topilmadi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-3 font-medium">Mijoz</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">Telefon</th>
                  <th className="pb-3 font-medium hidden md:table-cell">Manzil</th>
                  <th className="pb-3 font-medium text-right">Qarzdorlik</th>
                  <th className="pb-3 font-medium text-right">Bonus</th>
                  <th className="pb-3 font-medium text-right">Xaridlar</th>
                  <th className="pb-3 font-medium text-right w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{c.name}</p>
                          {c.email && <p className="text-[11px] text-gray-400">{c.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{c.phone || '-'}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell max-w-[150px] truncate">{c.address || '-'}</td>
                    <td className="py-3 text-right">
                      <span className={`font-bold ${parseFloat(c.debt) > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatCurrency(c.debt || 0)}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-amber-600 dark:text-amber-400">{c.bonus_points || 0}</td>
                    <td className="py-3 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(c.total_purchases || 0)}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditCustomer(c); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"><HiOutlinePencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteCustomer(c)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"><HiOutlineTrash className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <CustomerModal customer={editCustomer} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); loadCustomers(); }} />}

      {deleteCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={() => setDeleteCustomer(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 modal-content text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 shadow-lg"><HiOutlineTrash className="w-8 h-8 text-white" /></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mijozni o'chirish</h3>
            <p className="text-sm text-gray-500 mt-2">{deleteCustomer.name} ni o'chirmoqchimisiz?</p>
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setDeleteCustomer(null)} className="btn-secondary">Bekor qilish</button>
              <button onClick={handleDelete} className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg">O'chirish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
