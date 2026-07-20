import { useState, useEffect, useMemo } from 'react';
import { reportsAPI } from '../services/api';
import { UZ, formatCurrency } from '../utils/uzbek';
import {
  HiOutlineChartBar, HiOutlineCube, HiOutlineArrowTrendingUp, HiOutlineCalendarDays,
  HiOutlineDocumentChartBar, HiOutlineArrowDownTray, HiOutlineMagnifyingGlass
} from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { emitDataChanged } from '../utils/events';
import toast from 'react-hot-toast';

const CHART_COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

function StatBox({ label, value, sub, color = 'text-gray-900 dark:text-white', icon: Icon, delay }) {
  return (
    <div className={`card hover-lift animate-fade-in-up ${delay}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {count !== undefined && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function InventoryRow({ product, index }) {
  const status =
    product.stock_quantity === 0
      ? { label: UZ.outOfStockStatus, cls: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
      : product.stock_quantity <= product.minimum_stock
      ? { label: UZ.lowStockStatus, cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
      : { label: UZ.inStockStatus, cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };

  return (
    <tr className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors duration-150">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
            {index + 1}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{product.name}</p>
            {product.brand && <p className="text-[11px] text-gray-400">{product.brand}</p>}
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {product.category_name || '—'}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        <span className={`text-sm font-bold ${product.stock_quantity <= product.minimum_stock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
          {product.stock_quantity}
        </span>
        <span className="text-xs text-gray-400 ml-1">{product.unit}</span>
      </td>
      <td className="py-3 px-4 text-right text-sm text-gray-500">{product.minimum_stock}</td>
      <td className="py-3 px-4 text-right text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(product.stock_value)}</td>
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
        case 'top-products': r = await reportsAPI.topProducts({ limit: 10 }); setData(r.data); break;
        case 'inventory': r = await reportsAPI.inventory({}); setData(r.data); break;
      }
    } catch { toast.error("Hisobot yuklanmadi"); } finally { setLoading(false); }
  };

  const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];
    if (!invSearch) return data.products;
    const q = invSearch.toLowerCase();
    return data.products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.category_name?.toLowerCase().includes(q)
    );
  }, [data?.products, invSearch]);

  const tabs = [
    { key: 'daily', label: UZ.dailySales, icon: HiOutlineCalendarDays, count: data?.summary?.total_sales },
    { key: 'monthly', label: UZ.monthlySales, icon: HiOutlineArrowTrendingUp },
    { key: 'top-products', label: UZ.topSelling, icon: HiOutlineCube, count: data?.top_products?.length },
    { key: 'inventory', label: UZ.inventoryReport, icon: HiOutlineDocumentChartBar, count: data?.summary?.total_products },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{UZ.reportsTitle}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{UZ.analytics}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 animate-fade-in-up stagger-1">
        {tabs.map((tab) => (
          <TabButton key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} icon={tab.icon} label={tab.label} count={tab.count} />
        ))}
      </div>

      <div className="card animate-fade-in-up stagger-2">
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'daily' && (
            <div className="relative">
              <HiOutlineCalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field pl-10 w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          )}
          {activeTab === 'monthly' && (
            <>
              <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="input-field w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="input-field w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
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
      ) : (
        <div className="space-y-6 animate-fade-in">

          {activeTab === 'daily' && data && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatBox label={UZ.totalSalesCount} value={data.summary?.total_sales || 0} icon={HiOutlineChartBar} delay="stagger-1" />
                <StatBox label={UZ.totalRevenue} value={formatCurrency(data.summary?.total_revenue)} color="text-indigo-600 dark:text-indigo-400" icon={HiOutlineArrowTrendingUp} delay="stagger-2" />
                <div className="card hover-lift animate-fade-in-up stagger-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{UZ.paymentMethods}</p>
                  <div className="space-y-2">
                    {data.payment_breakdown?.map((p) => (
                      <div key={p.payment_method} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${p.payment_method === 'cash' ? 'bg-emerald-500' : p.payment_method === 'card' ? 'bg-blue-500' : 'bg-violet-500'}`} />
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{p.payment_method === 'cash' ? UZ.cash : p.payment_method === 'card' ? UZ.card : UZ.other}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{p.count}</span>
                          <span className="text-xs text-gray-400 ml-1">ta</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card animate-fade-in-up stagger-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{UZ.salesList}</h3>
                  <span className="text-xs text-gray-400">{date}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                        <th className="pb-3 font-medium px-4">{UZ.invoice}</th>
                        <th className="pb-3 font-medium px-4">{UZ.customer}</th>
                        <th className="pb-3 font-medium px-4">{UZ.payment}</th>
                        <th className="pb-3 font-medium text-right px-4">{UZ.amount}</th>
                        <th className="pb-3 font-medium text-right px-4">{UZ.time}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {data.sales?.length > 0 ? data.sales.map((s) => (
                        <tr key={s.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400">{s.invoice_number}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{s.customer_name || "O'tib ketgan"}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                              s.payment_method === 'cash' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                              s.payment_method === 'card' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                            }`}>{s.payment_method === 'cash' ? UZ.cash : s.payment_method === 'card' ? UZ.card : UZ.other}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(s.total_amount)}</td>
                          <td className="py-3 px-4 text-right text-gray-500 text-xs">{new Date(s.created_at).toLocaleTimeString('uz-UZ')}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="py-12 text-center text-gray-400">{UZ.noData}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'monthly' && data && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatBox label={UZ.monthlySummary} value={formatCurrency(data.summary?.total_revenue)} color="text-indigo-600 dark:text-indigo-400" icon={HiOutlineArrowTrendingUp} delay="stagger-1" />
                <StatBox label={UZ.totalSalesCount} value={data.summary?.total_sales || 0} sub="tranzaksiya" icon={HiOutlineChartBar} delay="stagger-2" />
                <StatBox label="O'rtacha tranzaksiya" value={formatCurrency(data.summary?.total_sales ? data.summary.total_revenue / data.summary.total_sales : 0)} icon={HiOutlineCube} delay="stagger-3" />
              </div>
              <div className="card animate-fade-in-up stagger-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{UZ.dailyRevenue}</h3>
                {data?.daily_sales?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data.daily_sales} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('uz', { day: 'numeric', month: 'short' })} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="total_revenue" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {data.daily_sales.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400">{UZ.noData}</div>
                )}
              </div>
            </>
          )}

          {activeTab === 'top-products' && data && (
            <div className="card animate-fade-in-up">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{UZ.topSellingProducts}</h3>
              <div className="space-y-3">
                {data.top_products?.length > 0 ? data.top_products.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: `linear-gradient(135deg, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[(i + 1) % CHART_COLORS.length]})` }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.brand || '—'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(p.total_revenue)}</p>
                      <p className="text-xs text-gray-400">{p.total_sold} sotildi</p>
                    </div>
                    <div className="w-24 bg-gray-100 dark:bg-gray-700 rounded-full h-2 flex-shrink-0">
                      <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" style={{ width: `${Math.min(100, (p.total_sold / (data.top_products[0]?.total_sold || 1)) * 100)}%` }} />
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-400 py-8">{UZ.noData}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && data && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatBox label={UZ.totalProductsReport} value={data.summary?.total_products || 0} icon={HiOutlineCube} delay="stagger-1" />
                <StatBox label={UZ.stockValue} value={formatCurrency(data.summary?.total_stock_value)} color="text-indigo-600 dark:text-indigo-400" icon={HiOutlineDocumentChartBar} delay="stagger-2" />
                <StatBox label={UZ.lowStockCount} value={data.summary?.low_stock_count || 0} color="text-amber-600 dark:text-amber-400" icon={HiOutlineArrowTrendingUp} delay="stagger-3" />
                <StatBox label={UZ.outOfStockCount} value={data.summary?.out_of_stock_count || 0} color="text-red-600 dark:text-red-400" icon={HiOutlineArrowTrendingUp} delay="stagger-4" />
              </div>
              <div className="card animate-fade-in-up stagger-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{UZ.inventoryList}</h3>
                  <span className="text-xs text-gray-400">{filteredProducts.length} mahsulot</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                        <th className="pb-3 font-medium px-4">{UZ.productsTitle}</th>
                        <th className="pb-3 font-medium px-4">{UZ.category}</th>
                        <th className="pb-3 font-medium text-right px-4">{UZ.stockQuantity}</th>
                        <th className="pb-3 font-medium text-right px-4">{UZ.minimumStock}</th>
                        <th className="pb-3 font-medium text-right px-4">{UZ.stockValue}</th>
                        <th className="pb-3 font-medium px-4">{UZ.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p, i) => (
                        <InventoryRow key={p.id} product={p} index={i} />
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr><td colSpan={6} className="py-12 text-center text-gray-400">{UZ.noData}</td></tr>
                      )}
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
