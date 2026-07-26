import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { categoriesAPI, productsAPI } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { emitDataChanged } from '../utils/events';
import { formatCurrency } from '../utils/uzbek';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineXMark,
  HiOutlineCheckCircle, HiOutlineMagnifyingGlass, HiOutlineTableCells,
  HiOutlineExclamationTriangle, HiOutlineCheck,
  HiOutlineShoppingCart,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

// ─── Helpers ───────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  'from-indigo-400 to-indigo-600', 'from-blue-400 to-blue-600',
  'from-violet-400 to-purple-600', 'from-pink-400 to-rose-600',
  'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-600',
  'from-cyan-400 to-blue-500', 'from-fuchsia-400 to-pink-600',
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Sub-components ────────────────────────────────────────
function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className={`card bg-gradient-to-br ${gradient} text-white`} role="status" aria-label={label}>
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-white/20"><Icon className="w-5 h-5" /></div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs opacity-75">{label}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <HiOutlineTableCells className="w-10 h-10 text-gray-300 dark:text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Kategoriyalar mavjud emas</h3>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-4">Birinchi kategoriyani yarating</p>
      <button onClick={onCreate} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all inline-flex items-center gap-2 shadow-md shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900" aria-label="Yangi kategoriya yaratish">
        <HiOutlinePlus className="w-5 h-5" /> Yangi kategoriya
      </button>
    </div>
  );
}

// ─── Mahsulot qo'shish modal ───────────────────────────────
function AddProductsModal({ category, allProducts, onClose, onRefresh }) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return allProducts.filter(p =>
      !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.product_code || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [allProducts, search]);

  const handleToggle = (id) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const handleSave = async () => {
    if (selectedIds.size === 0) { toast.error('Mahsulot tanlang'); return; }
    setSaving(true);
    try {
      let updated = 0;
      for (const id of selectedIds) {
        await productsAPI.update(id, { category_id: category.id });
        updated++;
      }
      toast.success(`${updated} ta mahsulot "${category.name}" ga qo'shildi`);
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Qo\'shishda xato'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="add-products-title">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 id="add-products-title" className="text-lg font-semibold text-gray-900 dark:text-white">Mahsulot qo'shish</h2>
            <p className="text-xs text-gray-400 mt-0.5">Kategoriya: <span className="font-medium text-indigo-600 dark:text-indigo-400">{category.name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mahsulot qidirish..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Mahsulotlar topilmadi</div>
          ) : filtered.map(p => (
            <label key={p.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 border ${selectedIds.has(p.id) ? 'border-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/10 dark:border-indigo-700' : 'border-transparent'}`}>
              <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => handleToggle(p.id)} className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{p.product_code} — {formatCurrency(p.selling_price)}</p>
              </div>
              <span className="text-xs text-gray-400 tabular-nums whitespace-nowrap">Z: {p.stock_quantity}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Bekor qilish</button>
          <button onClick={handleSave} disabled={saving || selectedIds.size === 0} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-indigo-500/20">
            {saving ? (
              <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Saqlanmoqda...</>
            ) : (
              <><HiOutlineCheck className="w-5 h-5" /> {selectedIds.size > 0 ? `${selectedIds.size} ta qo'shish` : 'Qo\'shish'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────
export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', parent_id: '' });
  const [errors, setErrors] = useState({});

  // Search
  const [search, setSearch] = useState('');

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Add products
  const [addProductsCat, setAddProductsCat] = useState(null);

  const nameRef = useRef(null);

  // ── Data loading ────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await categoriesAPI.getAll();
      setCategories(data?.categories || data || []);
    } catch {
      toast.error('Kategoriyalar yuklanmadi');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllProducts = useCallback(async () => {
    try {
      const { data } = await productsAPI.getAll({ limit: 500 });
      setAllProducts(data?.products || []);
    } catch {}
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  // ── Modal handlers ──────────────────────────────────────
  const openCreate = useCallback(() => {
    setEditCat(null);
    setForm({ name: '', description: '', parent_id: '' });
    setErrors({});
    setShowModal(true);
  }, []);

  const openEdit = useCallback((cat) => {
    setEditCat(cat);
    setForm({ name: cat.name || '', description: cat.description || '', parent_id: cat.parent_id ?? '' });
    setErrors({});
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditCat(null);
    setErrors({});
  }, []);

  useEffect(() => {
    if (!showModal) return;
    const handler = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showModal, closeModal]);

  useEffect(() => {
    if (showModal) setTimeout(() => nameRef.current?.focus(), 50);
  }, [showModal]);

  // ── Validation ──────────────────────────────────────────
  const validateForm = useCallback((f) => {
    const e = {};
    const trimmed = (f.name || '').trim();
    if (!trimmed) e.name = 'Kategoriya nomi majburiy';
    else if (trimmed.length > 100) e.name = 'Nom 100 belgidan oshmasligi kerak';
    else if (/^\s+$/.test(f.name)) e.name = 'Bo\'sh joylardan iborat nom qabul qilinmaydi';
    if (f.description && f.description.length > 300) e.description = 'Tavsif 300 belgidan oshmasligi kerak';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, []);

  // ── CRUD handlers ───────────────────────────────────────
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() || undefined, parent_id: form.parent_id || null };
      if (editCat) {
        await categoriesAPI.update(editCat.id, payload);
        toast.success('Kategoriya yangilandi');
      } else {
        await categoriesAPI.create(payload);
        toast.success('Kategoriya qo\'shildi');
      }
      closeModal();
      emitDataChanged();
      loadCategories();
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('allaqachon mavjud')) {
        setErrors((prev) => ({ ...prev, name: 'Bunday nomli kategoriya allaqachon mavjud' }));
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  }, [form, editCat, validateForm, closeModal, loadCategories]);

  const handleDelete = useCallback(async (cat) => {
    try {
      await categoriesAPI.delete(cat.id);
      toast.success('Kategoriya o\'chirildi');
      setDeleteConfirm(null);
      emitDataChanged();
      loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, 'O\'chirishda xato'));
    }
  }, [loadCategories]);

  // ── Derived state ───────────────────────────────────────
  const filtered = useMemo(() => {
    return categories.filter(c => !search || (c.name || '').toLowerCase().includes(search.toLowerCase()));
  }, [categories, search]);

  const totalProducts = useMemo(() => categories.reduce((sum, c) => sum + (c.product_count || 0), 0), [categories]);

  // ── Render ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Yuklanmoqda">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Kategoriyalar boshqaruvi">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kategoriyalar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mahsulot kategoriyalarini boshqaring</p>
        </div>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900" aria-label="Yangi kategoriya qo'shish">
          <HiOutlinePlus className="w-5 h-5" /> Yangi kategoriya
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={HiOutlineTableCells} label="Kategoriyalar" value={categories.length} gradient="from-indigo-500 to-indigo-600" />
        <StatCard icon={HiOutlineCheckCircle} label="Jami mahsulotlar" value={totalProducts} gradient="from-emerald-500 to-teal-400" />
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kategoriya qidirish..." aria-label="Kategoriya qidirish" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all" />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table" aria-label="Kategoriyalar ro'yxati">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-4 py-3.5 font-medium min-w-[160px]">Nomi</th>
                  <th className="px-4 py-3.5 font-medium min-w-[90px] text-right">Mahsulotlar</th>
                  <th className="px-4 py-3.5 font-medium min-w-[120px]">Yaratilgan</th>
                  <th className="px-4 py-3.5 font-medium min-w-[220px] text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((cat) => {
                  const avatarColor = getAvatarColor(cat.name);
                  return (
                    <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group" role="row">
                      {/* Name with avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0`}>
                            {getInitials(cat.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{cat.name}</p>
                            {cat.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{cat.description}</p>}
                          </div>
                        </div>
                      </td>
                      {/* Products count */}
                      <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300 tabular-nums">{cat.product_count ?? 0}</td>
                      {/* Date */}
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono whitespace-nowrap tabular-nums">{formatDate(cat.created_at)}</td>
                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { loadAllProducts(); setAddProductsCat(cat); }} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-400 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500" title="Mahsulot qo'shish" aria-label={`${cat.name} ga mahsulot qo'shish`}>
                            <HiOutlineShoppingCart className="w-4 h-4" />
                          </button>

                          <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-400 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500" title="Tahrirlash" aria-label={`${cat.name} kategoriyasini tahrirlash`}>
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteConfirm(cat)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500" title="O'chirish" aria-label={`${cat.name} kategoriyasini o'chirish`}>
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
        </div>
      )}

      {/* ── Delete confirmation modal ────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <HiOutlineExclamationTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 id="delete-title" className="text-lg font-bold text-gray-900 dark:text-white mb-2">O'chirilsinmi?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              <span className="font-medium text-gray-700 dark:text-gray-300">{deleteConfirm.name}</span> o'chiriladi. Bu amalni bekor qilib bo'lmaydi.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400">Bekor qilish</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500" aria-label="O'chirishni tasdiqlash">O'chirish</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Products modal ───────────────────────────── */}
      {addProductsCat && (
        <AddProductsModal
          category={addProductsCat}
          allProducts={allProducts}
          onClose={() => setAddProductsCat(null)}
          onRefresh={() => { loadCategories(); loadAllProducts(); }}
        />
      )}

      {/* ── Create / Edit modal ──────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">{editCat ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editCat ? "Ma'lumotlarni o'zgartiring" : 'Yangi kategoriya yarating'}</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400" aria-label="Yopish"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
              <div>
                <label htmlFor="cat-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nomi <span className="text-red-500">*</span></label>
                <input ref={nameRef} id="cat-name" type="text" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors(prev => ({ ...prev, name: null })); }} maxLength={100} required placeholder="Masalan: Ichimliklar" className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all ${errors.name ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-600'}`} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'cat-name-error' : undefined} />
                {errors.name && <p id="cat-name-error" className="mt-1 text-xs text-red-500" role="alert">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="cat-desc" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tavsif</label>
                <textarea id="cat-desc" value={form.description} onChange={(e) => { setForm({ ...form, description: e.target.value }); if (errors.description) setErrors(prev => ({ ...prev, description: null })); }} rows={2} maxLength={300} placeholder="Qo'shimcha ma'lumot..." className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all resize-none ${errors.description ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-600'}`} />
                <div className="flex justify-between mt-1">
                  {errors.description && <p className="text-xs text-red-500" role="alert">{errors.description}</p>}
                  <span className="text-xs text-gray-400 ml-auto">{form.description.length}/300</span>
                </div>
              </div>
              {/* Parent category */}
              <div>
                <label htmlFor="cat-parent" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Asosiy kategoriya</label>
                <select id="cat-parent" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all" aria-label="Asosiy kategoriya tanlash">
                  <option value="">Asosiy kategoriya</option>
                  {categories.filter(c => c.id !== editCat?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400">Bekor qilish</button>
                <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800" aria-label="Saqlash">
                  {saving ? (
                    <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Saqlanmoqda...</>
                  ) : (
                    <><HiOutlineCheck className="w-5 h-5" /> Saqlash</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
