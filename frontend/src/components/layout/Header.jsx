import { useState, useEffect } from 'react';
import { useAuthStore } from '../../context/AuthContext';
import { UZ } from '../../utils/uzbek';
import { HiOutlineBars3, HiOutlineBell, HiOutlineXMark } from 'react-icons/hi2';
import { productsAPI } from '../../services/api';

export default function Header({ onMenuClick }) {
  const user = useAuthStore((s) => s.user);
  const [showNotif, setShowNotif] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pos_dismissed_notifs') || '[]'); } catch { return []; }
  });

  useEffect(() => { loadLowStock(); }, []);

  const loadLowStock = async () => {
    try {
      const { data } = await productsAPI.getAll({ status: 'active', limit: 100 });
      const products = data?.products || [];
      const low = products.filter(p => p.stock_quantity <= p.minimum_stock && p.stock_quantity > 0);
      setLowStockItems(low);
    } catch {}
  };

  const visibleItems = lowStockItems.filter(item => !dismissed.includes(item.id));

  const dismissItem = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem('pos_dismissed_notifs', JSON.stringify(next));
  };

  const clearAll = () => {
    const allIds = lowStockItems.map(i => i.id);
    const next = [...new Set([...dismissed, ...allIds])];
    setDismissed(next);
    localStorage.setItem('pos_dismissed_notifs', JSON.stringify(next));
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <HiOutlineBars3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
          >
            <HiOutlineBell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            {visibleItems.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fade-in-down">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {UZ.notifications}
                  {visibleItems.length > 0 && <span className="ml-1.5 text-xs font-normal text-gray-400">({visibleItems.length})</span>}
                </h3>
                <div className="flex items-center gap-1">
                  {visibleItems.length > 0 && (
                    <button onClick={clearAll} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      Barchasini yashirish
                    </button>
                  )}
                  <button onClick={() => setShowNotif(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <HiOutlineXMark className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {visibleItems.length === 0 ? (
                  <div className="py-8 text-center">
                    <HiOutlineBell className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-400">{UZ.noNotifications}</p>
                  </div>
                ) : (
                  visibleItems.map((item) => (
                    <div key={item.id} className="px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 group flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">{UZ.lowStockAlert}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <strong>{item.name}</strong> — {item.stock_quantity} {item.unit} qoldi
                        </p>
                      </div>
                      <button
                        onClick={() => dismissItem(item.id)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:text-gray-300 dark:hover:bg-gray-600 transition-colors flex-shrink-0 mt-0.5"
                        title="Yashirish"
                      >
                        <HiOutlineXMark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
