import { useState } from 'react';
import { useAuthStore } from '../../context/AuthContext';
import { UZ } from '../../utils/uzbek';
import { HiOutlineBars3, HiOutlineBell, HiOutlineXMark } from 'react-icons/hi2';
import { productsAPI } from '../../services/api';
import { useEffect } from 'react';

export default function Header({ onMenuClick }) {
  const user = useAuthStore((s) => s.user);
  const [showNotif, setShowNotif] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    loadLowStock();
  }, []);

  const loadLowStock = async () => {
    try {
      const { data } = await productsAPI.getAll({ status: 'active', limit: 100 });
      const products = data?.products || [];
      const low = products.filter(p => p.stock_quantity <= p.minimum_stock && p.stock_quantity > 0);
      setLowStockItems(low);
    } catch {}
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
          >
            <HiOutlineBell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            {lowStockItems.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {showNotif && (
            <div className="absolute right-4 top-14 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{UZ.notifications}</h3>
                <button onClick={() => setShowNotif(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                  <HiOutlineXMark className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {lowStockItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">{UZ.noNotifications}</p>
                ) : (
                  lowStockItems.map((item) => (
                    <div key={item.id} className="px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">{UZ.lowStockAlert}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        <strong>{item.name}</strong> — {item.stock_quantity} {item.unit} qoldi
                      </p>
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
