import { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { UZ, formatCurrency } from '../utils/uzbek';
import { HiOutlineChartBar, HiOutlineCube, HiOutlineArrowTrendingUp } from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('daily');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => { loadReport(); }, [activeTab, date, month, year]);

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

  const tabs = [
    { key: 'daily', label: UZ.dailySales, icon: HiOutlineChartBar },
    { key: 'monthly', label: UZ.monthlySales, icon: HiOutlineArrowTrendingUp },
    { key: 'top-products', label: UZ.topSelling, icon: HiOutlineCube },
    { key: 'inventory', label: UZ.inventoryReport, icon: HiOutlineChartBar },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{UZ.reportsTitle}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{UZ.analytics}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3">
          {activeTab === 'daily' && <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white" />}
          {activeTab === 'monthly' && (
            <>
              <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="input-field w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="input-field w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'daily' && data && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card text-center"><p className="text-sm text-gray-500">{UZ.totalSalesCount}</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary?.total_sales || 0}</p></div>
                <div className="card text-center"><p className="text-sm text-gray-500">{UZ.totalRevenue}</p><p className="text-2xl font-bold text-emerald-600">{formatCurrency(data.summary?.total_revenue)}</p></div>
                <div className="card text-center"><p className="text-sm text-gray-500">{UZ.paymentMethods}</p><div className="flex justify-center gap-2 mt-1">{data.payment_breakdown?.map((p) => (<span key={p.payment_method} className="badge-info capitalize">{p.payment_method === 'cash' ? UZ.cash : p.payment_method === 'card' ? UZ.card : UZ.other}: {p.count}</span>))}</div></div>
              </div>
              <div className="card">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{UZ.salesList}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">{UZ.invoice}</th><th className="pb-2">{UZ.customer}</th><th className="pb-2">{UZ.payment}</th><th className="pb-2 text-right">{UZ.amount}</th><th className="pb-2 text-right">{UZ.time}</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">{data.sales?.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-2 font-mono text-xs">{s.invoice_number}</td>
                        <td className="py-2">{s.customer_name || "O'tib ketgan"}</td>
                        <td className="py-2 capitalize">{s.payment_method === 'cash' ? UZ.cash : s.payment_method === 'card' ? UZ.card : UZ.other}</td>
                        <td className="py-2 text-right font-semibold">{formatCurrency(s.total_amount)}</td>
                        <td className="py-2 text-right text-gray-500">{new Date(s.created_at).toLocaleTimeString('uz-UZ')}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'monthly' && data && (
            <>
              <div className="card"><p className="text-sm text-gray-500 mb-1">{UZ.monthlySummary}</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.summary?.total_revenue)}</p><p className="text-sm text-gray-500">{data.summary?.total_sales || 0} tranzaksiya</p></div>
              <div className="card">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{UZ.dailyRevenue}</h3>
                {data?.daily_sales?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.daily_sales || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip formatter={(v) => formatCurrency(v)} /><Bar dataKey="total_revenue" fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer>
                ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">{UZ.noData}</div>
                )}
              </div>
            </>
          )}

          {activeTab === 'top-products' && data && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{UZ.topSellingProducts}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">#</th><th className="pb-2">{UZ.productsTitle}</th><th className="pb-2">{UZ.brand}</th><th className="pb-2 text-right">Sotilgan</th><th className="pb-2 text-right">{UZ.amount}</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">{data.top_products?.map((p, i) => (
                    <tr key={p.id} className="hover:bg-gray-50"><td className="py-2 font-medium text-gray-500">{i + 1}</td><td className="py-2 font-medium text-gray-900 dark:text-white">{p.name}</td><td className="py-2 text-gray-500">{p.brand || '-'}</td><td className="py-2 text-right font-medium">{p.total_sold}</td><td className="py-2 text-right font-semibold">{formatCurrency(p.total_revenue)}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && data && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="card text-center"><p className="text-sm text-gray-500">{UZ.totalProductsReport}</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary?.total_products || 0}</p></div>
                <div className="card text-center"><p className="text-sm text-gray-500">{UZ.stockValue}</p><p className="text-2xl font-bold text-emerald-600">{formatCurrency(data.summary?.total_stock_value)}</p></div>
                <div className="card text-center"><p className="text-sm text-gray-500">{UZ.lowStockCount}</p><p className="text-2xl font-bold text-amber-600">{data.summary?.low_stock_count || 0}</p></div>
                <div className="card text-center"><p className="text-sm text-gray-500">{UZ.outOfStockCount}</p><p className="text-2xl font-bold text-red-600">{data.summary?.out_of_stock_count || 0}</p></div>
              </div>
              <div className="card">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{UZ.inventoryList}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">{UZ.productsTitle}</th><th className="pb-2">{UZ.category}</th><th className="pb-2 text-right">{UZ.stockQuantity}</th><th className="pb-2 text-right">{UZ.minimumStock}</th><th className="pb-2 text-right">{UZ.stockValue}</th><th className="pb-2">{UZ.status}</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">{data.products?.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50"><td className="py-2 font-medium text-gray-900 dark:text-white">{p.name}</td><td className="py-2 text-gray-500">{p.category_name || '-'}</td><td className="py-2 text-right font-medium">{p.stock_quantity} {p.unit}</td><td className="py-2 text-right text-gray-500">{p.minimum_stock}</td><td className="py-2 text-right">{formatCurrency(p.stock_value)}</td><td className="py-2">{p.stock_quantity === 0 ? <span className="badge-danger">{UZ.outOfStockStatus}</span> : p.stock_quantity <= p.minimum_stock ? <span className="badge-warning">{UZ.lowStockStatus}</span> : <span className="badge-success">{UZ.inStockStatus}</span>}</td></tr>
                    ))}</tbody>
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
