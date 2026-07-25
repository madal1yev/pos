import { useState, useEffect } from 'react';
import { categoriesAPI } from '../services/api';
import { UZ } from '../utils/uzbek';
import { getErrorMessage } from '../utils/errors';
import { emitDataChanged } from '../utils/events';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineXMark, HiOutlineCheckCircle, HiOutlineSquare3Stack3D } from 'react-icons/hi2';
import toast from 'react-hot-toast';

const CATEGORY_EMOJIS = ['🍕', '🍔', '🥤', '🥗', '🍰', '🍿', '🧃', '🧀', '🥩', '🍞', '🍎', '🥕', '🥛', '🍳', '🍜', '🥘', '🍱', '🥡', '🫕', '🧁'];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', emoji: '🍕', parent_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      const { data } = await categoriesAPI.getAll();
      setCategories(data?.categories || data || []);
    } catch {} finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditCat(null);
    setForm({ name: '', description: '', emoji: '🍕', parent_id: '' });
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditCat(cat);
    setForm({ name: cat.name || '', description: cat.description || '', emoji: cat.emoji || '🍕', parent_id: cat.parent_id || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Kategoriya nomini kiriting'); return; }
    setSaving(true);
    try {
      const payload = { ...form, parent_id: form.parent_id || null };
      if (editCat) {
        await categoriesAPI.update(editCat.id, payload);
        toast.success('Kategoriya yangilandi');
      } else {
        await categoriesAPI.create(payload);
        toast.success("Kategoriya qo'shildi");
      }
      setShowModal(false);
      loadCategories();
      emitDataChanged();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };

  const handleDelete = async (cat) => {
    if (!confirm(`"${cat.name}" o'chirilsinmi?`)) return;
    try {
      await categoriesAPI.delete(cat.id);
      toast.success("Kategoriya o'chirildi");
      loadCategories();
      emitDataChanged();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kategoriyalar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{categories.length} ta kategoriya</p>
        </div>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-[0.98]">
          <HiOutlinePlus className="w-5 h-5" /> Kategoriya qo'shish
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="card group hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 flex items-center justify-center text-2xl">
                  {cat.emoji || '📁'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
                  {cat.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{cat.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-400 hover:text-indigo-600 transition-colors">
                  <HiOutlinePencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(cat)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors">
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full text-center py-16">
            <HiOutlineSquare3Stack3D className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Kategoriyalar yo'q</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Birinchi kategoriyani qo'shing</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editCat ? 'Kategoriyani tahrirlash' : "Yangi kategoriya"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ikonka</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_EMOJIS.map((e) => (
                    <button key={e} type="button" onClick={() => setForm({ ...form, emoji: e })} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${form.emoji === e ? 'bg-indigo-100 dark:bg-indigo-900/30 ring-2 ring-indigo-500 scale-110' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nomi *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Kategoriya nomi" required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tavsif</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Qo'shimcha ma'lumot..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Asosiy kategoriya</label>
                <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="">Yo'q (asosiy)</option>
                  {categories.filter(c => c.id !== editCat?.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Bekor qilish</button>
                <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2">
                  <HiOutlineCheckCircle className="w-5 h-5" /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
