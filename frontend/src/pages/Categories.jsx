import { useState, useEffect } from 'react';
import { categoriesAPI, productsAPI } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { emitDataChanged } from '../utils/events';
import { formatCurrency } from '../utils/uzbek';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineXMark, HiOutlineCheckCircle, HiOutlineSquare3Stack3D, HiOutlineMagnifyingGlass, HiOutlineCube, HiOutlineFunnel, HiOutlineArrowLeft } from 'react-icons/hi2';
import toast from 'react-hot-toast';

const CATEGORY_EMOJIS = ['🍕', '🍔', '🥤', '🥗', '🍰', '🍿', '🧃', '🧀', '🥩', '🍞', '🍎', '🥕', '🥛', '🍳', '🍜', '🥘', '🍱', '🥡', '🫕', '🧁', '🐟', '🍕', '🫒', '🧅', '🌶️', '🥫', '🫘', '🥜'];

const GRADIENTS = [
  'from-blue-500 to-cyan-400',
  'from-indigo-500 to-purple-400',
  'from-emerald-500 to-teal-400',
  'from-orange-500 to-amber-400',
  'from-pink-500 to-rose-400',
  'from-violet-500 to-fuchsia-400',
  'from-red-500 to-orange-400',
  'from-cyan-500 to-sky-400',
];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', emoji: '🍕', parent_id: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewCategory, setViewCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      const { data } = await categoriesAPI.getAll();
      setCategories(data?.categories || data || []);
    } catch (err) { toast.error('Kategoriyalar yuklanmadi'); } finally { setLoading(false); }
  };

  const loadCategoryProducts = async (cat) => {
    setViewCategory(cat);
    setLoadingProducts(true);
    try {
      const { data } = await productsAPI.getAll({ category_id: cat.id, limit: 100 });
      setCategoryProducts(data?.products || []);
    } catch { setCategoryProducts([]); } finally { setLoadingProducts(false); }
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
    try {
      await categoriesAPI.delete(cat.id);
      toast.success("Kategoriya o'chirildi");
      setDeleteConfirm(null);
      loadCategories();
      emitDataChanged();
    } catch (err) { toast.error(getErrorMessage(err, "O'chirishda xato")); }
  };

  const filtered = categories.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));
  const totalProducts = categories.reduce((sum, c) => sum + (c.product_count || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-gray-400">Yuklanmoqda...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kategoriyalar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Barcha mahsulot kategoriyalari</p>
        </div>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-[0.98]">
          <HiOutlinePlus className="w-5 h-5" /> Kategoriya qo'shish
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20"><HiOutlineSquare3Stack3D className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold">{categories.length}</p>
              <p className="text-xs opacity-75">Kategoriyalar</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20"><HiOutlineCube className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold">{totalProducts}</p>
              <p className="text-xs opacity-75">Mahsulotlar</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 p-1">
          <div className="flex-1 relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kategoriya qidirish..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((cat, idx) => (
          <div key={cat.id} className="card group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: `${idx * 50}ms` }}>
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${GRADIENTS[idx % GRADIENTS.length]}`} />
            <div className="pt-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${GRADIENTS[idx % GRADIENTS.length]} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {cat.emoji || '📁'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{cat.name}</h3>
                    {cat.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-[140px]">{cat.description}</p>}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <HiOutlineCube className="w-3.5 h-3.5" />
                    <span className="font-medium">{cat.product_count || 0} mahsulot</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button onClick={() => openEdit(cat)} className="p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-400 hover:text-indigo-600 transition-all hover:scale-110" title="Tahrirlash">
                    <HiOutlinePencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirm(cat)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-all hover:scale-110" title="O'chirish">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && !search && (
          <div className="col-span-full text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 flex items-center justify-center mx-auto mb-4">
              <HiOutlineSquare3Stack3D className="w-10 h-10 text-indigo-400" />
            </div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Kategoriyalar yo'q</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-4">Birinchi kategoriyani qo'shing</p>
            <button onClick={openCreate} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all inline-flex items-center gap-2">
              <HiOutlinePlus className="w-4 h-4" /> Kategoriya qo'shish
            </button>
          </div>
        )}

        {filtered.length === 0 && search && (
          <div className="col-span-full text-center py-16">
            <HiOutlineMagnifyingGlass className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">"{search}" bo'yicha topilmadi</p>
          </div>
        )}
      </div>

      {viewCategory && (
        <div className="card mb-4 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setViewCategory(null)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><HiOutlineArrowLeft className="w-5 h-5" /></button>
            <span className="text-2xl">{viewCategory.emoji || '📁'}</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{viewCategory.name}</h2>
              <p className="text-xs text-gray-400">{categoryProducts.length} ta mahsulot</p>
            </div>
          </div>
          {loadingProducts ? (
            <div className="flex items-center justify-center h-32"><div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>
          ) : categoryProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                    <th className="pb-3 font-medium">Mahsulot</th>
                    <th className="pb-3 font-medium">Kod</th>
                    <th className="pb-3 font-medium text-right">Sotish narxi</th>
                    <th className="pb-3 font-medium text-right">Zaxira</th>
                    <th className="pb-3 font-medium">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {categoryProducts.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                      <td className="py-3 text-gray-500 font-mono text-xs">{p.product_code}</td>
                      <td className="py-3 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(p.selling_price)}</td>
                      <td className="py-3 text-right text-gray-600 dark:text-gray-400">{p.stock_quantity} {p.unit}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.stock_quantity === 0 ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' : p.stock_quantity < (p.minimum_stock || 0) ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                          {p.stock_quantity === 0 ? 'Tugagan' : p.stock_quantity < (p.minimum_stock || 0) ? 'Kam qoldi' : 'Mavjud'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">Bu kategoriyada mahsulotlar yo'q</div>
          )}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <HiOutlineTrash className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">O'chirilsinmi?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              <span className="font-medium text-gray-700 dark:text-gray-300">{deleteConfirm.emoji} {deleteConfirm.name}</span> kategoriyasi o'chiriladi. Bu amalni bekor qilib bo'lmaydi.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Bekor qilish</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors">O'chirish</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  {form.emoji ? <span className="text-xl">{form.emoji}</span> : <HiOutlineSquare3Stack3D className="w-5 h-5 text-indigo-600" />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editCat ? 'Kategoriyani tahrirlash' : "Yangi kategoriya"}</h2>
                  <p className="text-xs text-gray-400">{editCat ? 'Ma\'lumotlarni o\'zgartiring' : 'Yangi kategoriya yarating'}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ikonka tanlang</label>
                <div className="grid grid-cols-7 gap-1.5 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl max-h-32 overflow-y-auto">
                  {CATEGORY_EMOJIS.map((e) => (
                    <button key={e} type="button" onClick={() => setForm({ ...form, emoji: e })} className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all duration-200 ${form.emoji === e ? 'bg-indigo-100 dark:bg-indigo-900/40 ring-2 ring-indigo-500 scale-110 shadow-md' : 'bg-white dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 hover:scale-105'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nomi *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all" placeholder="Masalan: Ichimliklar" required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tavsif</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all resize-none" placeholder="Qo'shimcha ma'lumot..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Asosiy kategoriya</label>
                <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all">
                  <option value="">Yo'q (asosiy)</option>
                  {categories.filter(c => c.id !== editCat?.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Bekor qilish</button>
                <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-[0.98]">
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
