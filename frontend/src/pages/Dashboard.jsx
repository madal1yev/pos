import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { UZ, formatCurrency, formatUzbekDate } from '../utils/uzbek';
import {
  HiOutlineBanknotes, HiOutlineShoppingCart, HiOutlineCube, HiOutlineExclamationTriangle,
  HiOutlineArrowTrendingUp, HiOutlineUsers, HiOutlineClock, HiOutlineCalculator,
  HiOutlineArrowRight, HiOutlineFire, HiOutlineChartBar
} from 'react-icons/hi2';

function StatCard({ icon: Icon, label, value, subvalue, gradient, index, onClick }) {
  return (
    <div onClick={onClick} className={`card hover-lift animate-fade-in-up stagger-${index + 1} ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5 leading-tight">{value}</p>
          {subvalue && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subvalue}</p>}
        </div>
        <div className={`p-3 rounded-xl ${gradient}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, description, gradient, onClick }) {
  return (
    <button onClick={onClick} className="card hover-lift text-left group transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${gradient} group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        </div>
        <HiOutlineArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
      </div>
    </button>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadDashboard = useCallback(async (silent = false) => {
    try {
      const { data } = await dashboardAPI.get();
      setData(data);
    } catch {
      if (!silent) {
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  useEffect(() => {
    const handler = () => loadDashboard(true);
    window.addEventListener('pos:data-changed', handler);
    return () => window.removeEventListener('pos:data-changed', handler);
  }, [loadDashboard]);

  useEffect(() => {
    const interval = setInterval(() => loadDashboard(true), 60000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  const todayRevenue = parseFloat(data?.today?.sales?.revenue) || 0;
  const todayCount = parseInt(data?.today?.sales?.count) || 0;
  const monthRevenue = parseFloat(data?.month?.revenue) || 0;
  const monthCount = parseInt(data?.month?.count) || 0;
  const totalProducts = parseInt(data?.products?.total) || 0;
  const inventoryValue = parseFloat(data?.products?.total_inventory_value) || 0;
  const lowStock = parseInt(data?.products?.low_stock) || 0;
  const outOfStock = parseInt(data?.products?.out_of_stock) || 0;
  const allTimeRevenue = parseFloat(data?.allTime?.revenue) || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-3">
            <HiOutlineExclamationTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Dashboard ma'lumotlari yuklanmadi</p>
          <button onClick={() => { setLoading(true); loadDashboard(); }} className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Qayta urinish</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-down flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{UZ.dashboardTitle}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Bugun: {formatUzbekDate()}
          </p>
        </div>
        <button onClick={() => navigate('/analytics')} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all">
          <HiOutlineChartBar className="w-4 h-4" />
          Tahlillar
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          index={0}
          icon={HiOutlineBanknotes}
          label="Bugungi daromad"
          value={formatCurrency(todayRevenue)}
          subvalue={`${todayCount} ta sotuv`}
          gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
        />
        <StatCard
          index={1}
          icon={HiOutlineShoppingCart}
          label="Sotuvlar soni"
          value={todayCount}
          subvalue={todayCount > 0 ? `Bugun ${todayCount} ta` : ''}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          index={2}
          icon={HiOutlineCube}
          label="Ombor qiymati"
          value={formatCurrency(inventoryValue)}
          subvalue={`${totalProducts} mahsulot`}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
        />
        <StatCard
          index={3}
          icon={HiOutlineExclamationTriangle}
          label="Kam qolgan"
          value={lowStock}
          subvalue={`${outOfStock} ta tugagan`}
          gradient={lowStock > 0 ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gradient-to-br from-emerald-400 to-emerald-500"}
          onClick={() => navigate('/reports')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card animate-fade-in-up stagger-2 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <div className="flex items-center gap-3 mb-3">
            <HiOutlineArrowTrendingUp className="w-5 h-5 opacity-80" />
            <p className="text-sm font-medium opacity-90">Oylik daromad</p>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(monthRevenue)}</p>
          <p className="text-sm opacity-75 mt-1">{monthCount} ta sotuv</p>
        </div>

        <div className="card animate-fade-in-up stagger-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center gap-3 mb-3">
            <HiOutlineFire className="w-5 h-5 opacity-80" />
            <p className="text-sm font-medium opacity-90">Umumiy daromad</p>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(allTimeRevenue)}</p>
          <p className="text-sm opacity-75 mt-1">Barcha vaqt</p>
        </div>

        <div className="card animate-fade-in-up stagger-4 bg-gradient-to-br from-violet-500 to-purple-600 text-white">
          <div className="flex items-center gap-3 mb-3">
            <HiOutlineUsers className="w-5 h-5 opacity-80" />
            <p className="text-sm font-medium opacity-90">Jami sotuvlar</p>
          </div>
          <p className="text-3xl font-bold">{parseInt(data?.allTime?.count) || 0}</p>
          <p className="text-sm opacity-75 mt-1">Barcha vaqt</p>
        </div>
      </div>

      <div className="animate-fade-in-up stagger-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tezkor harakatlar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickAction icon={HiOutlineCalculator} label="Kassa" description="Sotuv amalga oshirish" gradient="bg-gradient-to-br from-indigo-500 to-indigo-600" onClick={() => navigate('/pos')} />
          <QuickAction icon={HiOutlineCube} label="Mahsulotlar" description="Tovarlarni boshqarish" gradient="bg-gradient-to-br from-blue-500 to-blue-600" onClick={() => navigate('/products')} />
          <QuickAction icon={HiOutlineChartBar} label="Hisobotlar" description="Barcha tahlillar" gradient="bg-gradient-to-br from-violet-500 to-purple-600" onClick={() => navigate('/reports')} />
        </div>
      </div>

      <div className="card animate-fade-in-up stagger-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">So'nggi sotuvlar</h3>
          <button onClick={() => navigate('/sales')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Barchasini ko'rish</button>
        </div>
        {data?.recentSales?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-3 font-medium">{UZ.invoice}</th>
                  <th className="pb-3 font-medium">{UZ.customer}</th>
                  <th className="pb-3 font-medium">{UZ.payment}</th>
                  <th className="pb-3 font-medium text-right">{UZ.amount}</th>
                  <th className="pb-3 font-medium text-right">{UZ.time}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {data.recentSales.slice(0, 5).map((sale) => (
                  <tr key={sale.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors cursor-pointer" onClick={() => navigate('/sales')}>
                    <td className="py-3 font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400">{sale.invoice_number}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{sale.customer_name || "O'tib ketgan"}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                        sale.payment_method === 'cash' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        sale.payment_method === 'card' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                      }`}>{sale.payment_method === 'cash' ? UZ.cash : sale.payment_method === 'card' ? UZ.card : UZ.other}</span>
                    </td>
                    <td className="py-3 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(sale.total_amount)}</td>
                    <td className="py-3 text-right text-gray-500 text-xs">{new Date(sale.created_at).toLocaleTimeString('uz-UZ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <HiOutlineClock className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-400">{UZ.noSalesToday}</p>
          </div>
        )}
      </div>
    </div>
  );
}
