import { useState, useEffect } from 'react';
import api, { settingsAPI } from '../services/api';
import { UZ } from '../utils/uzbek';
import { getErrorMessage } from '../utils/errors';
import { emitDataChanged } from '../utils/events';
import { HiOutlineCheckCircle, HiOutlineCloudArrowUp, HiOutlineXMark, HiOutlinePhoto, HiOutlineUser } from 'react-icons/hi2';
import toast from 'react-hot-toast';

async function uploadImage(file) {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post('/upload/image', form);
  return data.url;
}

export default function Settings() {
  const [settings, setSettings] = useState({ store_name: '', store_address: '', store_phone: '', store_email: '', currency: 'UZS', currency_symbol: "so'm", tax_percentage: 0, receipt_header: '', receipt_footer: '', low_stock_threshold: 10, logo_url: '', admin_telegram: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { (async () => { try { const { data } = await settingsAPI.get(); if (data.settings) setSettings(s => ({ ...s, ...Object.fromEntries(Object.entries(data.settings).map(([k,v]) => [k, v ?? ''])) })); } catch {} finally { setLoading(false); } })(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await settingsAPI.update({ ...settings, tax_percentage: parseFloat(settings.tax_percentage) || 0, low_stock_threshold: parseInt(settings.low_stock_threshold) || 10 }); toast.success(UZ.settingsSaved); emitDataChanged(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setSettings(s => ({ ...s, logo_url: url }));
      toast.success('Logo yuklandi');
    } catch { toast.error('Logo yuklanmadi'); } finally { setUploading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">{UZ.settingsTitle}</h1></div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{UZ.storeInfo}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Do'kon logosi</label>
              <div className="flex items-center gap-3">
                {settings.logo_url ? (
                  <div className="relative">
                    <img src={settings.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-700" />
                    <button type="button" onClick={() => setSettings(s => ({ ...s, logo_url: '' }))} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"><HiOutlineXMark className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><HiOutlinePhoto className="w-6 h-6 text-gray-400" /></div>
                )}
                <label className="cursor-pointer px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors border border-indigo-200 dark:border-indigo-800">
                  <HiOutlineCloudArrowUp className="w-4 h-4 inline mr-1" />{uploading ? 'Yuklanmoqda...' : 'Yuklash'}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.storeName}</label><input type="text" value={settings.store_name || ''} onChange={(e) => setSettings({ ...settings, store_name: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.phone}</label><input type="text" value={settings.store_phone || ''} onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.email}</label><input type="email" value={settings.store_email || ''} onChange={(e) => setSettings({ ...settings, store_email: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.address}</label><textarea value={settings.store_address || ''} onChange={(e) => setSettings({ ...settings, store_address: e.target.value })} rows={2} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
          </div>
        </div>
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{UZ.currencyTax}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.currency}</label>
              <select value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="UZS">UZS - O'zbek so'mi</option>
                <option value="USD">USD - AQSH dollari</option>
                <option value="RUB">RUB - Rossiya rubli</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.symbol}</label><input type="text" value={settings.currency_symbol || ''} onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.taxPercent}</label><input type="number" step="0.01" value={settings.tax_percentage || 0} onChange={(e) => setSettings({ ...settings, tax_percentage: e.target.value })} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
          </div>
        </div>
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Aloqa va admin</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><HiOutlineUser className="w-4 h-4 inline mr-1" />Admin Telegram</label>
              <div className="flex gap-2">
                <span className="flex items-center text-gray-400 text-sm">@</span>
                <input type="text" value={settings.admin_telegram?.replace('@', '') || ''} onChange={(e) => setSettings({ ...settings, admin_telegram: e.target.value })} className="input-field flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="admin_username" />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Chek va botda admin bilan bog'lanish uchun</p>
            </div>
          </div>
        </div>
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{UZ.receiptSettings}</h2>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.receiptHeader} <span className="text-xs text-gray-400">(chek yuqorisida ko'rinadi)</span></label><textarea value={settings.receipt_header || ''} onChange={(e) => setSettings({ ...settings, receipt_header: e.target.value })} rows={2} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Masalan: Xush kelibsiz!" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.receiptFooter} <span className="text-xs text-gray-400">(chek pastida ko'rinadi)</span></label><textarea value={settings.receipt_footer || ''} onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })} rows={2} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Masalan: Admin: @username" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{UZ.lowStockThreshold}</label><input type="number" value={settings.low_stock_threshold || 10} onChange={(e) => setSettings({ ...settings, low_stock_threshold: e.target.value })} className="input-field w-32 dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-[0.98]">
            <HiOutlineCheckCircle className="w-5 h-5" /> {saving ? UZ.loading : UZ.saveSettings}
          </button>
        </div>
      </form>
    </div>
  );
}
