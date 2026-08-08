import { useState, useEffect } from 'react';
import { suppliersAPI } from '../services/api';
import { HiOutlinePlus, HiOutlineMagnifyingGlass, HiOutlinePencil, HiOutlineTrash, HiOutlineXMark, HiOutlineTruck, HiOutlineEye } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { emitDataChanged } from '../utils/events';

const TRANSPORT_OPTIONS = [
  { value: 'car', label: 'Mashina', icon: '🚗' },
  { value: 'motorcycle', label: 'Mototsikl', icon: '🛵' },
  { value: 'bicycle', label: 'Velosiped', icon: '🚲' },
  { value: 'walking', label: 'Piyoda', icon: '🚶' },
];

const TRANSPORT_LABELS = {
  car: { label: 'Mashina', icon: '🚗' },
  motorcycle: { label: 'Mototsikl', icon: '🛵' },
  bicycle: { label: 'Velosiped', icon: '🚲' },
  walking: { label: 'Piyoda', icon: '🚶' },
};

const PHONE_REGEX = /^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;

function CourierModal({ courier, onClose, onSave }) {
  const [form, setForm] = useState({
    name: courier?.name || '',
    phone: courier?.phone || '',
    transport_type: courier?.transport_type || 'car',
    car_number: courier?.car_number || '',
    notes: courier?.notes || '',
    status: courier?.status || 'active',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Kuryer nomi majburiy';
    if (form.phone && !PHONE_REGEX.test(form.phone) && !/^\+998\d{9}$/.test(form.phone)) {
      errs.phone = 'Telefon formati: +998 90 123 45 67';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('998')) {
      const rest = digits.slice(3);
      if (rest.length <= 2) return `+998 ${rest}`;
      if (rest.length <= 5) return `+998 ${rest.slice(0, 2)} ${rest.slice(2)}`;
      if (rest.length <= 7) return `+998 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
      return `+998 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 7)} ${rest.slice(7, 9)}`;
    }
    if (digits.length <= 2) return `+998 ${digits}`;
    if (digits.length <= 4) return `+998${digits.slice(0, 2)} ${digits.slice(2)}`;
    return value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        phone: form.phone || null,
        car_number: form.car_number || null,
        notes: form.notes || null,
      };
      if (courier) {
        await suppliersAPI.update(courier.id, payload);
        toast.success('Kuryer yangilandi');
      } else {
        await suppliersAPI.create(payload);
        toast.success("Kuryer qo'shildi");
      }
      emitDataChanged();
      onSave();
    } catch { toast.error('Xatolik yuz berdi'); } finally { setSaving(false); }
  };

  const showCarNumber = form.transport_type === 'car';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto modal-content">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {courier ? 'Kuryerni tahrirlash' : "Yangi kuryer qo'shish"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nomi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Kuryer nomi"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Telefon <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
              className={`input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.phone ? 'border-red-500' : ''}`}
              placeholder="+998 90 123 45 67"
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Transport turi
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TRANSPORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, transport_type: opt.value })}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    form.transport_type === opt.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {showCarNumber && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Mashina raqami
              </label>
              <input
                type="text"
                value={form.car_number}
                onChange={(e) => setForm({ ...form, car_number: e.target.value.toUpperCase() })}
                className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono uppercase"
                placeholder="01 A 123 BC"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Holati
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, status: 'active' })}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                  form.status === 'active'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Faol
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, status: 'inactive' })}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                  form.status === 'inactive'
                    ? 'border-gray-500 bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                Faol emas
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Izoh
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Qo'shimcha ma'lumot..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn-secondary">Bekor qilish</button>
            <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-all disabled:opacity-50">
              {saving ? 'Saqlanmoqda...' : courier ? 'Saqlash' : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CourierDetailModal({ courier, onClose }) {
  const transport = TRANSPORT_LABELS[courier.transport_type] || TRANSPORT_LABELS.car;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md modal-content">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Kuryer ma'lumotlari</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {courier.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{courier.name}</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                courier.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${courier.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                {courier.status === 'active' ? 'Faol' : 'Faol emas'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Telefon</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{courier.phone || '-'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Transport</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                {transport.icon} {transport.label}
              </p>
            </div>
            {courier.car_number && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">Mashina raqami</p>
                <p className="text-sm font-mono font-medium text-gray-900 dark:text-white mt-0.5">{courier.car_number}</p>
              </div>
            )}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Yetkazilgan zakazlar</p>
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{courier.delivered_orders || 0}</p>
            </div>
          </div>

          {courier.notes && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400">Izoh</p>
              <p className="text-sm text-amber-800 dark:text-amber-300 mt-0.5">{courier.notes}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onClose} className="btn-secondary">Yopish</button>
        </div>
      </div>
    </div>
  );
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCourier, setEditCourier] = useState(null);
  const [deleteCourier, setDeleteCourier] = useState(null);
  const [detailCourier, setDetailCourier] = useState(null);

  useEffect(() => { loadSuppliers(); }, [search]);

  useEffect(() => {
    const handler = () => loadSuppliers();
    window.addEventListener('pos:data-changed', handler);
    return () => window.removeEventListener('pos:data-changed', handler);
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const { data } = await suppliersAPI.getAll({ search });
      setSuppliers(data?.suppliers || []);
    } catch { toast.error("Kuryerlar yuklanmadi"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await suppliersAPI.delete(deleteCourier.id);
      toast.success("Kuryer o'chirildi");
      setDeleteCourier(null);
      loadSuppliers();
      emitDataChanged();
    } catch { toast.error("O'chirishda xato"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kuryerlar</h1>
          <p className="text-sm text-gray-500 mt-1">{suppliers.length} ta</p>
        </div>
        <button
          onClick={() => { setEditCourier(null); setShowModal(true); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md"
        >
          <HiOutlinePlus className="w-5 h-5" /> Yangi kuryer
        </button>
      </div>

      <div className="card">
        <div className="relative flex-1 mb-4">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Qidirish (nom, telefon)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <HiOutlineTruck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Kuryer topilmadi</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
              {suppliers.map(s => {
                const transport = TRANSPORT_LABELS[s.transport_type] || TRANSPORT_LABELS.car;
                return (
                  <div
                    key={s.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setDetailCourier(s)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-lg font-bold text-indigo-600 dark:text-indigo-400">
                          {s.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{s.name}</p>
                          <p className="text-sm text-gray-500">{s.phone || '-'}</p>
                        </div>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full ${s.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-sm text-gray-500">{transport.icon} {transport.label}</span>
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {s.delivered_orders || 0} zakaz
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                    <th className="pb-3 font-medium">Nomi</th>
                    <th className="pb-3 font-medium">Telefon</th>
                    <th className="pb-3 font-medium">Transport</th>
                    <th className="pb-3 font-medium text-center">Yetkazilgan zakazlar</th>
                    <th className="pb-3 font-medium text-center">Holati</th>
                    <th className="pb-3 font-medium text-right w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {suppliers.map(s => {
                    const transport = TRANSPORT_LABELS[s.transport_type] || TRANSPORT_LABELS.car;
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => setDetailCourier(s)}>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                              {s.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-white">{s.name}</p>
                          </div>
                        </td>
                        <td className="py-3 text-gray-600 dark:text-gray-400">{s.phone || '-'}</td>
                        <td className="py-3 text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <span>{transport.icon}</span>
                            {transport.label}
                          </span>
                        </td>
                        <td className="py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                          {s.delivered_orders || 0}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            s.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                            {s.status === 'active' ? 'Faol' : 'Faol emas'}
                          </span>
                        </td>
                        <td className="py-3 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setDetailCourier(s)}
                              className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600"
                              title="Ko'rish"
                            >
                              <HiOutlineEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditCourier(s); setShowModal(true); }}
                              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"
                              title="Tahrirlash"
                            >
                              <HiOutlinePencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteCourier(s)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                              title="O'chirish"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <CourierModal
          courier={editCourier}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); loadSuppliers(); }}
        />
      )}

      {detailCourier && (
        <CourierDetailModal
          courier={detailCourier}
          onClose={() => setDetailCourier(null)}
        />
      )}

      {deleteCourier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={() => setDeleteCourier(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 modal-content text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 shadow-lg">
              <HiOutlineTrash className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Kuryerni o'chirish</h3>
            <p className="text-sm text-gray-500 mt-2">{deleteCourier.name} ni o'chirmoqchimisiz?</p>
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setDeleteCourier(null)} className="btn-secondary">Bekor qilish</button>
              <button onClick={handleDelete} className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg">
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
