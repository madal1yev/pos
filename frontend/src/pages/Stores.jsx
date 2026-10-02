import { useState, useEffect } from 'react';
import { storesAPI, usersAPI } from '../services/api';
import { useAuthStore } from '../context/AuthContext';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineBuildingStorefront,
  HiOutlineUsers, HiOutlineCube, HiOutlineReceiptRefund, HiOutlineXMark, HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { emitDataChanged } from '../utils/events';

function StoreModal({ store, onClose, onSave }) {
  const [name, setName] = useState(store?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Do'kon nomini kiriting"); return; }
    setSaving(true);
    try {
      if (store) { await storesAPI.update(store.id, { name: trimmed }); toast.success("Do'kon yangilandi"); }
      else { await storesAPI.create({ name: trimmed }); toast.success("Do'kon yaratildi"); }
      emitDataChanged(); onSave();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Xatolik yuz berdi');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {store ? "Do'konni tahrirlash" : "Yangi do'kon"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <HiOutlineXMark className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Do'kon nomi *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Masalan: Asosiy do'kon"
              autoFocus
              required
            />
            <p className="mt-2 text-xs text-gray-400">
              Har bir do'konning mahsulot, savdo va sozlamalari boshqa do'konda ko'rinmaydi.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Bekor qilish</button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Saqlanmoqda...' : store ? 'Saqlash' : "Yaratish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Stores() {
  const { user } = useAuthStore();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'create' } | { type: 'edit', store }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [moving, setMoving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await storesAPI.getAll();
      setStores(data?.stores || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Do'konlarni yuklab bo'lmadi");
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await storesAPI.remove(deleteTarget.id);
      toast.success("Do'kon o'chirildi");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || "O'chirishda xato");
    }
  };

  const handleMoveUser = async (userId, storeId) => {
    setMoving(true);
    try {
      await usersAPI.update(userId, { store_id: parseInt(storeId, 10) });
      toast.success("Foydalanuvchi boshqa do'konga ko'chirildi");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Ko'chirishda xato");
    } finally { setMoving(false); }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="card text-center py-12 text-gray-500">
        Bu sahifa faqat administrator uchun.
      </div>
    );
  }

  const allUsers = stores.flatMap((s) => (s.users || []).map((u) => ({ ...u, _store: s.id })));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Do'konlar</h1>
          <p className="text-sm text-gray-500 mt-1">
            {stores.length} ta do'kon — har birining ma'lumotlari alohida saqlanadi
          </p>
        </div>
        <button onClick={() => setModal({ type: 'create' })} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus className="w-5 h-5" /> Yangi do'kon
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((s) => (
              <div key={s.id} className="card hover-lift">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center shrink-0">
                      <HiOutlineBuildingStorefront className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{s.name}</h3>
                      <p className="text-xs text-gray-400">ID: {s.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setModal({ type: 'edit', store: s })}
                      title="Tahrirlash"
                      className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(s)}
                      title="O'chirish"
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 py-2">
                    <HiOutlineUsers className="w-4 h-4 mx-auto text-gray-400" />
                    <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">{s.user_count || 0}</p>
                    <p className="text-[10px] text-gray-400">Foydalanuvchi</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 py-2">
                    <HiOutlineCube className="w-4 h-4 mx-auto text-gray-400" />
                    <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">{s.product_count || 0}</p>
                    <p className="text-[10px] text-gray-400">Mahsulot</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 py-2">
                    <HiOutlineReceiptRefund className="w-4 h-4 mx-auto text-gray-400" />
                    <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">{s.sales_count || 0}</p>
                    <p className="text-[10px] text-gray-400">Savdo</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Foydalanuvchilarni do'konga ko'chirish</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Tanlangan do'konga o'tkazilgan foydalanuvchi faqat o'sha do'kon ma'lumotlarini ko'radi
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                    <th className="px-4 py-3 font-medium">Foydalanuvchi</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Rol</th>
                    <th className="px-4 py-3 font-medium">Do'kon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {allUsers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-400">Foydalanuvchi topilmadi</td>
                    </tr>
                  ) : allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{u.name}</p>
                            <p className="text-xs font-mono text-gray-400">{u.account_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                          {u.role || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u._store || ''}
                          onChange={(e) => handleMoveUser(u.id, e.target.value)}
                          disabled={moving}
                          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500 min-w-[140px]"
                        >
                          {stores.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {modal && (
        <StoreModal
          store={modal.type === 'edit' ? modal.store : null}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 shadow-lg">
              <HiOutlineExclamationTriangle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Do'konni o'chirish</h3>
            <p className="text-sm text-gray-500 mt-2">
              <strong>{deleteTarget.name}</strong> do'konini o'chirmoqchimisiz?
            </p>
            <p className="text-xs text-gray-400 mt-1">Faqat bo'sh do'konni o'chirish mumkin.</p>
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Bekor qilish</button>
              <button onClick={handleDelete} className="btn-danger">O'chirish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
