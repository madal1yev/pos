import { useState, useEffect, useMemo } from 'react';
import { reportsAPI } from '../services/api';
import { UZ, formatCurrency } from '../utils/uzbek';
import {
  HiOutlineChartBar, HiOutlineCube, HiOutlineArrowTrendingUp, HiOutlineCalendarDays,
  HiOutlineDocumentChartBar, HiOutlineMagnifyingGlass, HiOutlineBanknotes,
  HiOutlineShoppingCart, HiOutlineCurrencyDollar, HiOutlineFire, HiOutlineReceiptPercent,
  HiOutlineArrowDown, HiOutlineArrowUp
} from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend } from 'recharts';
import { emitDataChanged } from '../utils/events';
import toast from 'react-hot-toast';

const CHART_COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

const PIE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6'];

function SummaryCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1.5 ${color || 'text-gray-900 dark:text-white'}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-900/20' : trend === 'down' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
          <Icon className={`w-5 h-5 ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600'}`}>
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {count !== undefined && count !== null && <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>{count}</span>}
    </button>
  );
}

function InventoryRow({ product, index }) {
  const ratio = product.minimum_stock > 0 ? (product.stock_quantity / product.minimum_stock) : 999;
  let status;
  if (product.stock_quantity === 0) status = { label: 'Tugagan', cls: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
  else if (ratio <= 1) status = { label: 'Kam qoldi', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
  else status = { label: 'Mavjud', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };

  const barWidth = Math.min(100, (product.stock_quantity / Math.max(product.minimum_stock, 1)) * 100);

  return (
    <tr className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">{index + 1}</div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{product.name}</p>
            {product.brand && <p className="text-[11px] text-gray-400 truncate">{product.brand}</p>}
          </div>
        </div>
      </td>
      <td className="py-3 px-4 hidden md:table-cell"><span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{product.category_name || '—'}</span></td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden hidden sm:block" style={{ minWidth: '60px' }}>
            <div className={`h-full rounded-full transition-all ${product.stock_quantity === 0 ? 'bg-red-400' : ratio <= 1 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${barWidth}%` }} />
          </div>
          <span className={`text-sm font-bold whitespace-nowrap ${product.stock_quantity <= product.minimum_stock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{product.stock_quantity}</span>
          <span className="text-[11px] text-gray-400">{product.unit}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-right text-sm text-gray-500 hidden lg:table-cell">{product.minimum_stock}</td>
      <td className="py-3 px-4 text-right text-sm font-medium text-gray-900 dark:text-white hidden sm:table-cell">{formatCurrency(product.stock_value)}</td>
      <td className="py-3 px-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.cls}`}>{status.label}</span></td>
    </tr>
  );
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('daily');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [invSearch, setInvSearch] = useState('');

  useEffect(() => { loadReport(); }, [activeTab, date, month, year]);

  useEffect(() => {
    const handler = () => loadReport();
    window.addEventListener('pos:data-changed', handler);
    return () => window.removeEventListener('pos:data-changed', handler);
  }, [activeTab, date, month, year]);

  const loadReport = async () => {
    setLoading(true);
    try {
      let r;
      switch (activeTab) {
        case 'daily': r = await reportsAPI.daily({ date }); setData(r.data); break;
        case 'monthly': r = await reportsAPI.monthly({ month, year }); setData(r.data); break;
        case 'top-products': r = await reportsAPI.topProducts({ limit: 15 }); setData(r.data); break;
        case 'inventory': r = await reportsAPI.inventory({}); setData(r.data); break;
      }
    } catch { toast.error('Hisobot yuklanmadi'); } finally { setLoading(false); }
  };

  const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];
    if (!invSearch) return data.products;
    const q = invSearch.toLowerCase();
    return data.products.filter(p => p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.category_name?.toLowerCase().includes(q));
  }, [data?.products, invSearch]);

  const tabs = [
    { key: 'daily', label: 'Kunlik', icon: HiOutlineCalendarDays, count: data?.summary?.total_sales },
    { key: 'monthly', label: 'Oylik', icon: HiOutlineArrowTrendingUp },
    { key: 'top-products', label: 'TOP', icon: HiOutlineCube, count: data?.top_products?.length },
    { key: 'inventory', label: 'Ombor', icon: HiOutlineDocumentChartBar, count: data?.summary?.total_products },
  ];

  const paymentData = data?.payment_breakdown?.map(p => ({
    name: p.payment_method === 'cash' ? 'Naqd' : p.payment_method === 'card' ? 'Karta' : 'Boshqa',
    value: parseFloat(p.total) || 0,
    count: p.count,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hisobotlar va tahlillar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Barcha moliyaviy ko'rsatkichlar bir joyda</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <TabButton key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} icon={tab.icon} label={tab.label} count={tab.count} />
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'daily' && (
            <div className="relative">
              <HiOutlineCalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          )}
          {activeTab === 'monthly' && (
            <>
              <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="input-field w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="input-field w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}
          {activeTab === 'inventory' && (
            <div className="relative flex-1 max-w-sm">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Mahsulot qidirish..." value={invSearch} onChange={(e) => setInvSearch(e.target.value)} className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-400">Hisobot yuklanmoqda...</p>
          </div>
        </div>
      ) : !data ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <HiOutlineChartBar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Ma'lumot topilmadi</p>
          <p className="text-sm text-gray-400 mt-1">Ushbu davr uchun hech qanday ma'lumot mavjud emas</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'daily' && data && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard icon={HiOutlineShoppingCart} label="Sotuvlar soni" value={data.summary?.total_sales || 0} sub={data.date} color="text-gray-900 dark:text-white" trend="up" />
                <SummaryCard icon={HiOutlineBanknotes} label="Jami tushum" value={formatCurrency(data.summary?.total_revenue)} sub="Barcha to'lov usullari" color="text-indigo-600 dark:text-indigo-400" trend="up" />
                <SummaryCard icon={HiOutlineReceiptPercent} label="Qaytim" value={formatCurrency(data.summary?.total_change)} sub="Mijozlarga qaytarilgan" color="text-amber-600 dark:text-amber-400" trend="down" />
                <SummaryCard icon={HiOutlineCurrencyDollar} label="Sof tushum" value={formatCurrency((parseFloat(data.summary?.total_revenue) || 0) - (parseFloat(data.summary?.total_change) || 0))} sub="Tushum - qaytim" color="text-emerald-600 dark:text-emerald-400" trend="up" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HiOutlineBanknotes className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">Sotuvlar ro'yxati</h3>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{data.date}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30">
                          <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Chek</th>
                          <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Mijoz</th>
                          <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider hidden sm:table-cell">Kassir</th>
                          <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">To'lov</th>
                          <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-right">Summa</th>
                          <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-right">Vaqt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {data.sales?.length > 0 ? data.sales.map(s => (
                          <tr key={s.id} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors">
                            <td className="py-3 px-4 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">{s.invoice_number}</td>
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">{s.customer_name || "O'tib ketgan"}</td>
                            <td className="py-3 px-4 text-gray-500 hidden sm:table-cell">{s.cashier_name}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${s.payment_method === 'cash' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : s.payment_method === 'card' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'}`}>
                                {s.payment_method === 'cash' ? 'Naqd' : s.payment_method === 'card' ? 'Karta' : 'Boshqa'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(s.total_amount)}</td>
                            <td className="py-3 px-4 text-right text-gray-400 text-xs">{new Date(s.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={6} className="py-12 text-center text-gray-400">Bugun sotuvlar yo'q</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <HiOutlineChartBar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">To'lov usullari</h3>
                  </div>
                  {paymentData.length > 0 ? (
                    <div className="space-y-4">
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={paymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                              {paymentData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        {paymentData.map((p, i) => (
                          <div key={i} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{p.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(p.value)}</span>
                              <span className="text-xs text-gray-400 ml-1">({p.count} ta)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Ma'lumot yo'q</div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'monthly' && data && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard icon={HiOutlineArrowTrendingUp} label="Oylik daromad" value={formatCurrency(data.summary?.total_revenue)} sub={`${months[month - 1]} ${year}`} color="text-indigo-600 dark:text-indigo-400" trend="up" />
                <SummaryCard icon={HiOutlineShoppingCart} label="Sotuvlar soni" value={data.summary?.total_sales || 0} sub="tranzaksiya" color="text-gray-900 dark:text-white" />
                <SummaryCard icon={HiOutlineFire} label="Sof daromad" value={formatCurrency(data.summary?.net_revenue || data.summary?.total_revenue)} sub="To'lovlar chegirilgan" color="text-emerald-600 dark:text-emerald-400" trend="up" />
                <SummaryCard icon={HiOutlineCurrencyDollar} label="O'rtacha chek" value={formatCurrency(data.summary?.total_sales ? data.summary.total_revenue / data.summary.total_sales : 0)} sub={data.summary?.total_sales ? `${data.summary.total_sales} ta tranzaksiya` : ''} color="text-violet-600 dark:text-violet-400" />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <HiOutlineArrowTrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Kunlik tushum dinamikasi</h3>
                  <span className="text-xs text-gray-400 ml-auto">{months[month - 1]} {year}</span>
                </div>
                {data?.daily_sales?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={data.daily_sales} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => {
                        try { return new Date(v).toLocaleDateString('uz', { day: 'numeric', month: 'short' }); } catch { return v; }
                      }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                      <Tooltip
                        formatter={(v) => [formatCurrency(v), 'Tushum']}
                        labelFormatter={(v) => { try { return new Date(v).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return v; }}
                        }
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="total_revenue" radius={[8, 8, 0, 0]} maxBarSize={44}>
                        {data.daily_sales.map((entry, i) => (
                          <Cell key={i} fill={entry.total_revenue > (data.daily_sales.reduce((s, d) => s + parseFloat(d.total_revenue), 0) / data.daily_sales.length) ? '#6366f1' : '#a5b4fc'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400">Bu oyda sotuvlar yo'q</div>
                )}
              </div>
            </>
          )}

          {activeTab === 'top-products' && data && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <HiOutlineCube className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Eng ko'p sotilgan mahsulotlar</h3>
                </div>
              </div>
              <div className="p-4 space-y-1">
                {data.top_products?.length > 0 ? data.top_products.slice(0, 10).map((p, i) => {
                  const maxSold = data.top_products[0]?.total_sold || 1;
                  const barPercent = Math.min(100, (p.total_sold / maxSold) * 100);
                  return (
                    <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: `linear-gradient(135deg, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[(i + 1) % CHART_COLORS.length]})` }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white ml-2 hidden sm:block">{formatCurrency(p.total_revenue)}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all" style={{ width: `${barPercent}%` }} />
                          </div>
                          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{p.total_sold} dona</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 sm:hidden">
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{formatCurrency(p.total_revenue)}</p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-12 text-gray-400">Hali hech qanday mahsulot sotilmagan</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && data && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard icon={HiOutlineCube} label="Jami mahsulotlar" value={data.summary?.total_products || 0} color="text-gray-900 dark:text-white" />
                <SummaryCard icon={HiOutlineDocumentChartBar} label="Ombor qiymati" value={formatCurrency(data.summary?.total_stock_value)} color="text-indigo-600 dark:text-indigo-400" trend="up" />
                <SummaryCard icon={HiOutlineArrowDown} label="Kam qolgan" value={data.summary?.low_stock_count || 0} color={data.summary?.low_stock_count > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'} trend={data.summary?.low_stock_count > 0 ? 'down' : 'up'} />
                <SummaryCard icon={HiOutlineArrowDown} label="Tugagan" value={data.summary?.out_of_stock_count || 0} color={data.summary?.out_of_stock_count > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600'} trend={data.summary?.out_of_stock_count > 0 ? 'down' : 'up'} />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HiOutlineDocumentChartBar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Ombor ro'yxati</h3>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{filteredProducts.length} mahsulot</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30">
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Mahsulot</th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider hidden md:table-cell">Kategoriya</th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-right">Miqdor</th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-right hidden lg:table-cell">Min</th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-right hidden sm:table-cell">Qiymat</th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Holat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {filteredProducts.map((p, i) => <InventoryRow key={p.id} product={p} index={i} />)}
                      {filteredProducts.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-gray-400">Mahsulot topilmadi</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
