import { useState, useEffect, useCallback, useMemo } from 'react';
import { categoriesAPI, productsAPI } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { emitDataChanged } from '../utils/events';
import { formatCurrency } from '../utils/uzbek';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineXMark,
  HiOutlineCheckCircle, HiOutlineMagnifyingGlass, HiOutlineTableCells,
  HiOutlineCheck, HiOutlineShoppingCart,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

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
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
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
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 id="add-products-title" className="text-lg font-semibold text-gray-900 dark:text-white">Mahsulot qo'shish</h2>
            <p className="text-xs text-gray-400 mt-0.5">Kategoriya: <span className="font-medium text-indigo-600 dark:text-indigo-400">{category.name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mahsulot qidirish..." className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
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
          <button onClick={onClose} className="btn-secondary">Bekor qilish</button>
          <button onClick={handleSave} disabled={saving || selectedIds.size === 0} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-indigo-500/20">
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

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', parent_id: '' });
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [addProductsCat, setAddProductsCat] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await categoriesAPI.getAll();
      setCategories(data?.categories || data || []);
    } catch {
      toast.error('Kategoriyalar yuklanmadi');
    } finally { setLoading(false); }
  }, []);

  const loadAllProducts = useCallback(async () => {
    try {
      const { data } = await productsAPI.getAll({ limit: 500 });
      setAllProducts(data?.products || []);
    } catch {}
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

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

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setDeleteConfirm(null);
  }, []);

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }, []);

  const handleBulkStatus = useCallback(async (status) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkProcessing(true);
    try {
      await categoriesAPI.bulkStatus(ids, status);
      toast.success(`${ids.length} ta kategoriya ${status === 'active' ? 'faollashtirildi' : 'faolsizlantirildi'}`);
      clearSelection();
      emitDataChanged();
      loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Xatolik yuz berdi'));
    } finally { setBulkProcessing(false); }
  }, [selectedIds, clearSelection, loadCategories]);

  const handleBulkDelete = useCallback(async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkProcessing(true);
    try {
      await categoriesAPI.bulkDelete(ids);
      toast.success(`${ids.length} ta kategoriya o'chirildi`);
      clearSelection();
      emitDataChanged();
      loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, 'O\'chirishda xato'));
    } finally { setBulkProcessing(false); }
  }, [selectedIds, clearSelection, loadCategories]);

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
    } finally { setSaving(false); }
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

  const filtered = useMemo(() => {
    return categories.filter(c => !search || (c.name || '').toLowerCase().includes(search.toLowerCase()));
  }, [categories, search]);

  const totalProducts = useMemo(() => categories.reduce((sum, c) => sum + (c.product_count || 0), 0), [categories]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, safePage]);
  const allVisibleSelected = paginated.length > 0 && paginated.every(c => selectedIds.has(c.id));

  const toggleSelectAll = useCallback(() => {
    if (allVisibleSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginated.map(c => c.id)));
  }, [allVisibleSelected, paginated]);

  const getSelectedProducts = useCallback(() => categories.filter(c => selectedIds.has(c.id)), [categories, selectedIds]);

  const paginationButtons = useMemo(() => {
    if (totalPages <= 1) return [];
    const buttons = [];
    const start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, safePage + 2);
    for (let i = start; i <= end; i++) buttons.push(i);
    return buttons;
  }, [totalPages, safePage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-400 dark:text-gray-500">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kategoriyalar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{categories.length} ta kategoriya, {totalProducts} ta mahsulot</p>
        </div>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-[0.98]">
          <HiOutlinePlus className="w-5 h-5" /> Yangi kategoriya
        </button>
      </div>

      <div className="card animate-fade-in-up stagger-1">
        <div className="relative">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Kategoriya qidirish..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-900/10 p-3 sm:p-4 shadow-sm animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Tanlandi: {selectedIds.size} ta kategoriya</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Belgilangan kategoriyalarga bitta joydan amal qiling.</p>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              <button onClick={() => handleBulkStatus('active')} disabled={bulkProcessing} className="min-h-11 bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 px-3 py-2 rounded-xl font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all flex items-center justify-center gap-2 text-sm border border-emerald-200 dark:border-emerald-800 disabled:opacity-50">
                <HiOutlineCheckCircle className="w-4 h-4" /> Faol
              </button>
              <button onClick={() => handleBulkStatus('inactive')} disabled={bulkProcessing} className="min-h-11 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 text-sm border border-gray-200 dark:border-gray-700 disabled:opacity-50">
                <HiOutlineXMark className="w-4 h-4" /> Nofaol
              </button>
              <button onClick={() => setDeleteConfirm({ bulk: true })} disabled={bulkProcessing} className="min-h-11 bg-white dark:bg-gray-800 text-red-700 dark:text-red-300 px-3 py-2 rounded-xl font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2 text-sm border border-red-200 dark:border-red-800 disabled:opacity-50">
                <HiOutlineTrash className="w-4 h-4" /> Delete
              </button>
              <button onClick={clearSelection} disabled={bulkProcessing} className="min-h-11 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm border border-gray-200 dark:border-gray-700 disabled:opacity-50">
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {paginated.length === 0 ? (
        <div className="card text-center py-12">
          <HiOutlineTableCells className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Kategoriyalar mavjud emas</p>
          <button onClick={openCreate} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all inline-flex items-center gap-2 shadow-md shadow-indigo-500/20">
            <HiOutlinePlus className="w-5 h-5" /> Birinchi kategoriyani yarating
          </button>
        </div>
      ) : (
        <div className="card animate-fade-in-up stagger-1 p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-10" />
                <col />
                <col className="w-20" />
                <col className="w-20 sm:w-24" />
                <col className="w-24 hidden sm:table-column" />
                <col className="w-28 sm:w-32" />
              </colgroup>
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-4 pt-4 pb-3 font-medium">
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} className="w-5 h-5 rounded border-gray-300 text-indigo-600" />
                  </th>
                  <th className="px-4 pt-4 pb-3 font-medium">Nomi</th>
                  <th className="px-4 pt-4 pb-3 font-medium text-center">Holati</th>
                  <th className="px-4 pt-4 pb-3 font-medium text-right">Mahsulotlar</th>
                  <th className="px-4 pt-4 pb-3 font-medium text-center hidden sm:table-cell">Yaratilgan</th>
                  <th className="px-4 pt-4 pb-3 font-medium text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {paginated.map((cat) => (
                  <tr key={cat.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedIds.has(cat.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                    <td className="px-4 py-3 align-middle">
                      <input type="checkbox" checked={selectedIds.has(cat.id)} onChange={() => toggleSelect(cat.id)} className="w-5 h-5 rounded border-gray-300 text-indigo-600" />
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{cat.name}</p>
                          {cat.description && <p className="text-xs text-gray-400 truncate max-w-full">{cat.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        cat.status === 'active' || !cat.status
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {cat.status === 'active' || !cat.status ? '✅ Faol' : '⛔ Nofaol'}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap">{cat.product_count ?? 0}</td>
                    <td className="px-4 py-3 align-middle text-center hidden sm:table-cell">
                      <span className="inline-block text-gray-400 text-xs font-mono whitespace-nowrap bg-gray-50 dark:bg-gray-700/50 px-2 py-0.5 rounded-md">{formatDate(cat.created_at)}</span>
                    </td>
                    <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { loadAllProducts(); setAddProductsCat(cat); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors" title="Mahsulot qo'shish">
                          <HiOutlineShoppingCart className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors" title="Tahrirlash">
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm(cat)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors" title="O'chirish">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 pb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-500">Sahifa {safePage} / {totalPages} ({filtered.length} ta)</p>
              <div className="flex gap-1">
                <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50 transition-colors">Oldingi</button>
                {paginationButtons.map(p => (
                  <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${p === safePage ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{p}</button>
                ))}
                <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50 transition-colors">Keyingi</button>
              </div>
            </div>
          )}
        </div>
      )}

      {deleteConfirm && !deleteConfirm.bulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 modal-content">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 shadow-lg shadow-red-500/25">
                <HiOutlineTrash className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Kategoriyani o'chirish</h3>
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400">O'chirilayotgan kategoriya:</p>
                <p className="font-semibold text-gray-900 dark:text-white mt-1">{deleteConfirm.name}</p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Bu amalni bekor qilib bo'lmaydi. Davom etasizmi?</p>
              <div className="flex justify-center gap-3 mt-6">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-secondary">Bekor qilish</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/25 active:scale-[0.98]">O'chirish</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm?.bulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={clearSelection} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 modal-content">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 shadow-lg shadow-red-500/25">
                <HiOutlineTrash className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tanlanganlarni o'chirish</h3>
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-left">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">O'chiriladigan kategoriyalar: <span className="font-bold text-gray-900 dark:text-white">{selectedIds.size} ta</span></p>
                <div className="mt-3 max-h-32 overflow-y-auto space-y-1">
                  {getSelectedProducts().slice(0, 8).map((c) => (
                    <p key={c.id} className="text-xs text-gray-600 dark:text-gray-300 truncate">- {c.name}</p>
                  ))}
                  {getSelectedProducts().length > 8 && <p className="text-xs text-gray-400">...va yana {getSelectedProducts().length - 8} ta</p>}
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Bu amalni bekor qilib bo'lmaydi. Davom etasizmi?</p>
              <div className="flex justify-center gap-3 mt-6">
                <button onClick={clearSelection} disabled={bulkProcessing} className="flex-1 btn-secondary disabled:opacity-50">Bekor qilish</button>
                <button onClick={handleBulkDelete} disabled={bulkProcessing} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/25 active:scale-[0.98] disabled:opacity-50">{bulkProcessing ? "O'chirilmoqda..." : "O'chirish"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {addProductsCat && (
        <AddProductsModal
          category={addProductsCat}
          allProducts={allProducts}
          onClose={() => setAddProductsCat(null)}
          onRefresh={() => { loadCategories(); loadAllProducts(); }}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md modal-content" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editCat ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}</h2>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
              <div>
                <label htmlFor="cat-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nomi *</label>
                <input id="cat-name" type="text" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors(prev => ({ ...prev, name: null })); }} maxLength={100} required placeholder="Masalan: Ichimliklar" className={`input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.name ? 'border-red-300 dark:border-red-700' : ''}`} />
                {errors.name && <p className="mt-1 text-xs text-red-500" role="alert">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="cat-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tavsif</label>
                <textarea id="cat-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} maxLength={300} placeholder="Qo'shimcha ma'lumot..." className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none" />
              </div>
              <div>
                <label htmlFor="cat-parent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Asosiy kategoriya</label>
                <div className="relative">
                  <select id="cat-parent" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} className="input-field w-full appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10 cursor-pointer">
                    <option value="">Asosiy kategoriya</option>
                    {categories.filter(c => c.id !== editCat?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={closeModal} className="btn-secondary">Bekor qilish</button>
                <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20 active:scale-[0.98]">
                  {saving ? 'Saqlanmoqda...' : (editCat ? 'Saqlash' : 'Qo\'shish')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
