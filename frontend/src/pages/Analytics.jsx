import { useState, useEffect, useRef } from 'react';
import { reportsAPI, dashboardAPI } from '../services/api';
import { UZ, formatCurrency } from '../utils/uzbek';
import {
  HiOutlineChartBar, HiOutlineCube, HiOutlineArrowTrendingUp, HiOutlineCalendarDays,
  HiOutlineDocumentChartBar, HiOutlineBanknotes, HiOutlineShoppingCart, HiOutlineExclamationTriangle
} from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import toast from 'react-hot-toast';

const CHART_COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3" />
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
        <div className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="card animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4" />
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-700/50">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        </div>
      ))}
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="card animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-36 mb-4" />
      <div className="h-64 bg-gray-100 dark:bg-gray-700/50 rounded-xl" />
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
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>{count}</span>
      )}
    </button>
  );
}

function StatBox({ label, value, color = 'text-gray-900 dark:text-white', icon: Icon }) {
  return (
    <div className="card hover-lift">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1.5 ${color}`}>{value}</p>
        </div>
        {Icon && <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50"><Icon className="w-5 h-5 text-gray-400" /></div>}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const cacheRef = useRef({});

  useEffect(() => { loadData(); }, [activeTab, date, month, year]);

  useEffect(() => {
    const handler = () => { cacheRef.current = {}; loadData(); };
    window.addEventListener('pos:data-changed', handler);
    return () => window.removeEventListener('pos:data-changed', handler);
  }, [activeTab, date, month, year]);

  const loadData = async () => {
    const key = `${activeTab}-${date}-${month}-${year}`;
    if (cacheRef.current[key]) {
      if (activeTab === 'overview') setDashboardData(cacheRef.current[key]);
      else setData(cacheRef.current[key]);
      setLoading(false);
      return;
    }

    if (Object.keys(cacheRef.current).length > 0) setTabLoading(true);
    else setLoading(true);

    try {
      if (activeTab === 'overview') {
        const { data: d } = await dashboardAPI.get();
        setDashboardData(d);
        cacheRef.current[key] = d;
      } else {
        let r;
        switch (activeTab) {
          case 'daily': r = await reportsAPI.daily({ date }); break;
          case 'monthly': r = await reportsAPI.monthly({ month, year }); break;
          case 'top-products': r = await reportsAPI.topProducts({ limit: 15 }); break;
          case 'inventory': r = await reportsAPI.inventory({}); break;
        }
        setData(r.data);
        cacheRef.current[key] = r.data;
      }
    } catch { toast.error("Ma'lumotlar yuklanmadi"); } finally { setLoading(false); setTabLoading(false); }
  };

  const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

  const tabs = [
    { key: 'overview', label: 'Umumiy', icon: HiOutlineChartBar },
    { key: 'daily', label: 'Kunlik', icon: HiOutlineCalendarDays },
    { key: 'monthly', label: 'Oylik', icon: HiOutlineArrowTrendingUp },
    { key: 'top-products', label: 'Top mahsulotlar', icon: HiOutlineCube, count: data?.top_products?.length },
    { key: 'inventory', label: 'Ombor', icon: HiOutlineDocumentChartBar, count: data?.summary?.total_products },
  ];

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-down">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tahlillar va Hisobotlar</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Barcha biznes tahlillari bir joyda</p>
      </div>

      <div className="flex flex-wrap gap-2 animate-fade-in-up">
        {tabs.map((tab) => (
          <TabButton key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} icon={tab.icon} label={tab.label} count={tab.count} />
        ))}
      </div>

      {activeTab !== 'overview' && (
        <div className="card animate-fade-in">
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
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart />
            <SkeletonChart />
          </div>
          <SkeletonTable />
        </div>
      ) : (
        <div className={`space-y-6 transition-opacity duration-300 ${tabLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>

          {activeTab === 'overview' && dashboardData && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatBox label="Bugun sotilgan" value={dashboardData.today?.sales?.count || 0} icon={HiOutlineShoppingCart} />
                <StatBox label="Bugungi daromad" value={formatCurrency(dashboardData.today?.sales?.revenue)} color="text-indigo-600 dark:text-indigo-400" icon={HiOutlineBanknotes} />
                <StatBox label="Ombor qiymati" value={formatCurrency(dashboardData.products?.total_inventory_value)} color="text-violet-600 dark:text-violet-400" icon={HiOutlineDocumentChartBar} />
                <StatBox label="Kam qolgan" value={dashboardData.products?.low_stock || 0} color={dashboardData.products?.low_stock > 0 ? 'text-amber-600' : 'text-emerald-600'} icon={HiOutlineExclamationTriangle} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Haftalik sotuvlar</h3>
                  {dashboardData.salesChart?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={dashboardData.salesChart} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('uz', { weekday: 'short' })} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={36}>
                          {dashboardData.salesChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-64 text-gray-400 text-sm">{UZ.noData}</div>}
                </div>

                <div className="card">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">To'lov usullari</h3>
                  <div className="space-y-3">
                    {[
                      { method: 'cash', label: UZ.cash, color: 'bg-emerald-500', icon: '💵' },
                      { method: 'card', label: UZ.card, color: 'bg-blue-500', icon: '💳' },
                      { method: 'other', label: UZ.other, color: 'bg-violet-500', icon: '📱' },
                    ].map(({ method, label, color, icon }) => {
                      const sales = dashboardData.recentSales?.filter(s => s.payment_method === method) || [];
                      const total = sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
                      return (
                        <div key={method} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                          <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-lg`}>{icon}</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                            <p className="text-xs text-gray-500">{sales.length} ta sotuv</p>
                          </div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(total)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {dashboardData.recentSales?.length > 0 && (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">So'nggi sotuvlar</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                          <th className="pb-3 font-medium px-3">Chek</th>
                          <th className="pb-3 font-medium px-3">Mijoz</th>
                          <th className="pb-3 font-medium px-3">Kassir</th>
                          <th className="pb-3 font-medium px-3">To'lov</th>
                          <th className="pb-3 font-medium text-right px-3">Summa</th>
                          <th className="pb-3 font-medium text-right px-3">Vaqt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {dashboardData.recentSales.map((s) => (
                          <tr key={s.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors">
                            <td className="py-3 px-3 font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400">{s.invoice_number}</td>
                            <td className="py-3 px-3 text-gray-600 dark:text-gray-400">{s.customer_name || "O'tib ketgan"}</td>
                            <td className="py-3 px-3 text-gray-500">{s.cashier_name}</td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                                s.payment_method === 'cash' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                s.payment_method === 'card' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                              }`}>{s.payment_method === 'cash' ? UZ.cash : s.payment_method === 'card' ? UZ.card : UZ.other}</span>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(s.total_amount)}</td>
                            <td className="py-3 px-3 text-right text-gray-500 text-xs">{new Date(s.created_at).toLocaleTimeString('uz-UZ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'daily' && data && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatBox label={UZ.totalSalesCount} value={data.summary?.total_sales || 0} icon={HiOutlineChartBar} />
                <StatBox label={UZ.totalRevenue} value={formatCurrency(data.summary?.total_revenue)} color="text-indigo-600 dark:text-indigo-400" icon={HiOutlineArrowTrendingUp} />
                <div className="card">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{UZ.paymentMethods}</p>
                  <div className="space-y-2">
                    {data.payment_breakdown?.map((p) => (
                      <div key={p.payment_method} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${p.payment_method === 'cash' ? 'bg-emerald-500' : p.payment_method === 'card' ? 'bg-blue-500' : 'bg-violet-500'}`} />
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{p.payment_method === 'cash' ? UZ.cash : p.payment_method === 'card' ? UZ.card : UZ.other}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{p.count} ta</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{UZ.salesList}</h3>
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
                          <td className="py-3 px-4"><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${s.payment_method === 'cash' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : s.payment_method === 'card' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'}`}>{s.payment_method === 'cash' ? UZ.cash : s.payment_method === 'card' ? UZ.card : UZ.other}</span></td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(s.total_amount)}</td>
                          <td className="py-3 px-4 text-right text-gray-500 text-xs">{new Date(s.created_at).toLocaleTimeString('uz-UZ')}</td>
                        </tr>
                      )) : <tr><td colSpan={5} className="py-12 text-center text-gray-400">{UZ.noData}</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'monthly' && data && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatBox label={UZ.monthlySummary} value={formatCurrency(data.summary?.total_revenue)} color="text-indigo-600 dark:text-indigo-400" icon={HiOutlineArrowTrendingUp} />
                <StatBox label={UZ.totalSalesCount} value={data.summary?.total_sales || 0} sub="tranzaksiya" icon={HiOutlineChartBar} />
                <StatBox label="O'rtacha" value={formatCurrency(data.summary?.total_sales ? data.summary.total_revenue / data.summary.total_sales : 0)} icon={HiOutlineCube} />
              </div>
              <div className="card">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{UZ.dailyRevenue}</h3>
                {data?.daily_sales?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data.daily_sales} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('uz', { day: 'numeric', month: 'short' })} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="total_revenue" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {data.daily_sales.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-64 text-gray-400">{UZ.noData}</div>}
              </div>
            </>
          )}

          {activeTab === 'top-products' && data && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{UZ.topSellingProducts}</h3>
              <div className="space-y-3">
                {data.top_products?.length > 0 ? data.top_products.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: `linear-gradient(135deg, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[(i + 1) % CHART_COLORS.length]})` }}>{i + 1}</div>
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
                )) : <p className="text-center text-gray-400 py-8">{UZ.noData}</p>}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && data && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatBox label={UZ.totalProductsReport} value={data.summary?.total_products || 0} icon={HiOutlineCube} />
                <StatBox label={UZ.stockValue} value={formatCurrency(data.summary?.total_stock_value)} color="text-indigo-600 dark:text-indigo-400" icon={HiOutlineDocumentChartBar} />
                <StatBox label={UZ.lowStockCount} value={data.summary?.low_stock_count || 0} color="text-amber-600 dark:text-amber-400" icon={HiOutlineExclamationTriangle} />
                <StatBox label={UZ.outOfStockCount} value={data.summary?.out_of_stock_count || 0} color="text-red-600 dark:text-red-400" icon={HiOutlineExclamationTriangle} />
              </div>
              <div className="card">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{UZ.inventoryList}</h3>
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
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {data.products?.map((p, i) => (
                        <tr key={p.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">{i + 1}</div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</p>
                                {p.brand && <p className="text-[11px] text-gray-400">{p.brand}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4"><span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{p.category_name || '—'}</span></td>
                          <td className="py-3 px-4 text-right"><span className={`text-sm font-bold ${p.stock_quantity <= p.minimum_stock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{p.stock_quantity}</span><span className="text-xs text-gray-400 ml-1">{p.unit}</span></td>
                          <td className="py-3 px-4 text-right text-sm text-gray-500">{p.minimum_stock}</td>
                          <td className="py-3 px-4 text-right text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(p.stock_value)}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              p.stock_quantity === 0 ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              p.stock_quantity <= p.minimum_stock ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}>{p.stock_quantity === 0 ? UZ.outOfStockStatus : p.stock_quantity <= p.minimum_stock ? UZ.lowStockStatus : UZ.inStockStatus}</span>
                          </td>
                        </tr>
                      ))}
                      {(!data.products || data.products.length === 0) && <tr><td colSpan={6} className="py-12 text-center text-gray-400">{UZ.noData}</td></tr>}
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
