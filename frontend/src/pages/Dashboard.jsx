import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { UZ, formatCurrency } from '../utils/uzbek';
import {
  HiOutlineCurrencyDollar, HiOutlineShoppingCart, HiOutlineCube, HiOutlineExclamationTriangle,
  HiOutlineArrowTrendingUp
} from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

function StatCard({ icon: Icon, label, value, subvalue, gradient }) {
  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subvalue && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subvalue}</p>}
        </div>
        <div className={`p-3 rounded-xl ${gradient}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await dashboardAPI.get();
      setData(data);
    } catch {
      toast.error("Dashboard yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{UZ.dashboardTitle}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{UZ.dashboardSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={HiOutlineCurrencyDollar} label={UZ.todayRevenue} value={formatCurrency(data?.today?.sales?.revenue)} subvalue={`${data?.today?.sales?.count || 0} ${UZ.transactions}`} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" />
        <StatCard icon={HiOutlineArrowTrendingUp} label={UZ.monthlyRevenue} value={formatCurrency(data?.month?.revenue)} subvalue={`${data?.month?.count || 0} ${UZ.transactions}`} gradient="bg-gradient-to-br from-blue-500 to-blue-600" />
        <StatCard icon={HiOutlineCube} label={UZ.totalProducts} value={data?.products?.total || 0} subvalue={`${formatCurrency(data?.products?.total_inventory_value)} ${UZ.inventoryValue}`} gradient="bg-gradient-to-br from-violet-500 to-violet-600" />
        <StatCard icon={HiOutlineExclamationTriangle} label={UZ.lowStock} value={data?.products?.low_stock || 0} subvalue={`${data?.products?.out_of_stock || 0} ${UZ.outOfStock}`} gradient="bg-gradient-to-br from-amber-500 to-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{UZ.weeklySales}</h3>
          {data?.salesChart?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.salesChart}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => new Date(v).toLocaleDateString('uz', { weekday: 'short' })} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">{UZ.noData}</div>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{UZ.topProducts}</h3>
          {data?.topProducts?.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.sold} sotildi</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">{UZ.noSalesToday}</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{UZ.recentSales}</h3>
        {data?.recentSales?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-3 font-medium">{UZ.invoice}</th>
                  <th className="pb-3 font-medium">{UZ.customer}</th>
                  <th className="pb-3 font-medium">{UZ.cashier}</th>
                  <th className="pb-3 font-medium">{UZ.payment}</th>
                  <th className="pb-3 font-medium text-right">{UZ.amount}</th>
                  <th className="pb-3 font-medium text-right">{UZ.time}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {data.recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 font-medium text-gray-900 dark:text-white">{sale.invoice_number}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{sale.customer_name || "O'tib ketgan"}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{sale.cashier_name}</td>
                    <td className="py-3"><span className="badge-info capitalize">{sale.payment_method === 'cash' ? UZ.cash : sale.payment_method === 'card' ? UZ.card : UZ.other}</span></td>
                    <td className="py-3 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(sale.total_amount)}</td>
                    <td className="py-3 text-right text-gray-500">{new Date(sale.created_at).toLocaleTimeString('uz-UZ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">{UZ.noSalesToday}</p>
        )}
      </div>
    </div>
  );
}
