import { useState, useEffect } from 'react';
import { discountsAPI } from '../services/api';
import { formatCurrency } from '../utils/uzbek';
import { getErrorMessage } from '../utils/errors';
import { HiOutlinePlus, HiOutlineXMark, HiOutlineTag, HiOutlinePercentBadge, HiOutlineCalendarDays, HiOutlineKey } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editDiscount, setEditDiscount] = useState(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [activeTab, setActiveTab] = useState('discounts');

  const loadDiscounts = async () => {
    try {
      const { data } = await discountsAPI.getAll();
      setDiscounts(data.discounts || []);
    } catch { setDiscounts([]); }
  };

  const loadPromoCodes = async () => {
    try {
      const { data } = await discountsAPI.getPromoCodes();
      setPromoCodes(data.promo_codes || []);
    } catch { setPromoCodes([]); }
  };

  useEffect(() => {
    loadDiscounts();
    loadPromoCodes();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HiOutlinePercentBadge className="w-7 h-7 text-indigo-600" />
            Chegirma va Aksiyalar
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{discounts.length} ta chegirma, {promoCodes.length} ta promo-kod</p>
        </div>
        <button onClick={() => { setEditDiscount(null); setShowModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md">
          <HiOutlinePlus className="w-5 h-5" /> Yangi chegirma
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button onClick={() => setActiveTab('discounts')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${activeTab === 'discounts' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Chegirmalar
        </button>
        <button onClick={() => setActiveTab('promos')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${activeTab === 'promos' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Promo-kodlar
        </button>
      </div>

      {activeTab === 'discounts' && (
        <DiscountList discounts={discounts} onRefresh={loadDiscounts} onEdit={(d) => { setEditDiscount(d); setShowModal(true); }} />
      )}
      {activeTab === 'promos' && (
        <PromoList promoCodes={promoCodes} onRefresh={loadPromoCodes} onAdd={() => setShowPromoModal(true)} />
      )}

      {showModal && <DiscountModal discount={editDiscount} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); loadDiscounts(); }} />}
      {showPromoModal && <PromoModal discounts={discounts} onClose={() => setShowPromoModal(false)} onSave={() => { setShowPromoModal(false); loadPromoCodes(); }} />}
    </div>
  );
}

function DiscountList({ discounts, onRefresh, onEdit }) {
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await discountsAPI.delete(id);
      toast.success('Chegirma o\'chirildi');
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (d) => {
    try {
      await discountsAPI.update(d.id, { is_active: d.is_active ? 0 : 1 });
      toast.success(d.is_active ? 'Chegirma nofaol qilindi' : 'Chegirma faol qilindi');
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (discounts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <HiOutlineTag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium">Chegirmalar mavjud emas</p>
        <p className="text-sm mt-1">Yangi chegirma qo'shing</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {discounts.map((d) => (
        <div key={d.id} className={`card p-4 border-l-4 ${d.is_active ? 'border-l-emerald-500' : 'border-l-gray-300'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{d.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {d.is_active ? 'Faol' : 'Nofaol'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-1.5 text-sm text-gray-500">
                <span className="bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-medium">
                  {d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value)}
                </span>
                {d.min_purchase > 0 && <span>Min: {formatCurrency(d.min_purchase)}</span>}
                {d.max_discount && <span>Maks: {formatCurrency(d.max_discount)}</span>}
                {d.promo_count > 0 && <span>{d.promo_count} ta promo-kod</span>}
              </div>
              {(d.start_date || d.end_date) && (
                <p className="text-xs text-gray-400 mt-1">
                  {d.start_date && new Date(d.start_date).toLocaleDateString()} - {d.end_date && new Date(d.end_date).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => toggleActive(d)} className={`p-1.5 rounded-lg transition-colors ${d.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`} title={d.is_active ? 'Nofaol qilish' : 'Faol qilish'}>
                <HiOutlineTag className="w-4 h-4" />
              </button>
              <button onClick={() => onEdit(d)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors" title="Tahrirlash">
                <HiOutlinePlus className="w-4 h-4 rotate-45" />
              </button>
              <button onClick={() => handleDelete(d.id)} disabled={deleting === d.id} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="O'chirish">
                <HiOutlineXMark className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PromoList({ promoCodes, onRefresh, onAdd }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{promoCodes.length} ta promo-kod</p>
        <button onClick={onAdd} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all flex items-center gap-1.5">
          <HiOutlineKey className="w-4 h-4" /> Yangi kod
        </button>
      </div>
      {promoCodes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <HiOutlineKey className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Promo-kodlar mavjud emas</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {promoCodes.map((p) => (
            <div key={p.id} className="card p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                  {p.code?.slice(0, 3)}
                </div>
                <div>
                  <p className="font-mono font-bold text-gray-900 dark:text-white">{p.code}</p>
                  <p className="text-xs text-gray-500">{p.discount_name} ({p.type === 'percentage' ? `${p.value}%` : formatCurrency(p.value)})</p>
                  <p className="text-xs text-gray-400">Ishlatilgan: {p.current_uses || 0}/{p.max_uses > 0 ? p.max_uses : '∞'}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {p.is_active ? 'Faol' : 'Nofaol'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DiscountModal({ discount, onClose, onSave }) {
  const [form, setForm] = useState({
    name: discount?.name || '',
    type: discount?.type || 'percentage',
    value: discount?.value || '',
    min_purchase: discount?.min_purchase || 0,
    max_discount: discount?.max_discount || '',
    start_date: discount?.start_date ? discount.start_date.slice(0, 10) : '',
    end_date: discount?.end_date ? discount.end_date.slice(0, 10) : '',
    is_active: discount?.is_active ?? 1,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        value: parseFloat(form.value),
        min_purchase: parseFloat(form.min_purchase) || 0,
        max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        is_active: form.is_active,
      };
      if (discount) {
        await discountsAPI.update(discount.id, payload);
        toast.success('Chegirma yangilandi');
      } else {
        await discountsAPI.create(payload);
        toast.success('Chegirma qo\'shildi');
      }
      onSave();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Saqlashda xato'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{discount ? 'Chegirmani tahrirlash' : 'Yangi chegirma'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Chegirma nomi *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Masalan: Mavsumiy chegirma" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tur</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                <option value="percentage">Foiz (%)</option>
                <option value="fixed">Summa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Qiymat *</label>
              <input type="number" step={form.type === 'percentage' ? '1' : '0.01'} min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="input-field" placeholder={form.type === 'percentage' ? '10' : '5000'} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Minimal xarid</label>
              <input type="number" min="0" value={form.min_purchase} onChange={(e) => setForm({ ...form, min_purchase: e.target.value })} className="input-field" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Maksimal chegirma</label>
              <input type="number" min="0" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} className="input-field" placeholder="Cheklanmagan" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <HiOutlineCalendarDays className="w-4 h-4 inline mr-1" /> Boshlanish sanasi
              </label>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <HiOutlineCalendarDays className="w-4 h-4 inline mr-1" /> Tugash sanasi
              </label>
              <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">Faol</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">Bekor qilish</button>
            <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saqlanmoqda...' : discount ? 'Saqlash' : 'Qo\'shish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PromoModal({ discounts, onClose, onSave }) {
  const [code, setCode] = useState('');
  const [discountId, setDiscountId] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [saving, setSaving] = useState(false);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    setCode(result);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!discountId) { toast.error('Chegirma tanlang'); return; }
    setSaving(true);
    try {
      await discountsAPI.createPromoCode({ code: code || `PROMO-${Date.now().toString().slice(-6)}`, discount_id: parseInt(discountId), max_uses: parseInt(maxUses) || 0 });
      toast.success('Promo-kod yaratildi');
      onSave();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Xato'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2"><HiOutlineKey className="w-5 h-5" /> Yangi promo-kod</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Promo-kod</label>
            <div className="flex gap-2">
              <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="input-field flex-1 font-mono font-bold uppercase" placeholder="MASALAN: BONUS10" />
              <button type="button" onClick={generateCode} className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Generatsiya</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Chegirma *</label>
            <select value={discountId} onChange={(e) => setDiscountId(e.target.value)} className="input-field" required>
              <option value="">Chegirma tanlang</option>
              {discounts.filter(d => d.is_active).map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value)})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Maksimal ishlatish soni (0 = cheksiz)</label>
            <input type="number" min="0" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="input-field" placeholder="0" />
          </div>
          <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Yaratilmoqda...' : 'Promo-kod yaratish'}
          </button>
        </form>
      </div>
    </div>
  );
}
