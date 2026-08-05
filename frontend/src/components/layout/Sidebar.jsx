import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Receipt,
  BarChart3,
  Users,
  Truck,
  BadgePercent,
  Settings,
  LogOut,
  Sun,
  Moon,
  Store,
} from 'lucide-react';
import { useAuthStore } from '../../context/AuthContext';
import { useSettingsStore } from '../../context/SettingsContext';
import { t } from '../../utils/uzbek';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'dashboardNav', exact: true, group: 'main' },
  { to: '/pos', icon: ShoppingCart, label: 'posNav', accent: true, group: 'main' },
  { to: '/products', icon: Package, label: 'productsNav', group: 'products' },
  { to: '/categories', icon: FolderTree, label: 'categoriesNav', group: 'products' },
  { to: '/sales', icon: Receipt, label: 'salesNav', group: 'trade' },
  { to: '/reports', icon: BarChart3, label: 'reportsNav', group: 'trade' },
  { to: '/customers', icon: Users, label: 'debtorsNav', group: 'trade' },
  { to: '/suppliers', icon: Truck, label: 'suppliersNav', group: 'management' },
  { to: '/discounts', icon: BadgePercent, label: 'discountsNav', group: 'management' },
  { to: '/settings', icon: Settings, label: 'settingsNav', group: 'management' },
];

const GROUPS = [
  { key: 'main', title: t('main') },
  { key: 'products', title: t('productsGroup') },
  { key: 'trade', title: t('trade') },
  { key: 'management', title: t('management') },
];

const NavItem = memo(function NavItem({ item, onClose }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.exact}
      onClick={() => { if (window.innerWidth < 1024) onClose?.(); }}
      className="block outline-none"
    >
      {({ isActive }) => {
        const isAccent = item.accent && isActive;
        return (
          <div
            className={`
              group relative flex items-center gap-3 h-10 px-3.5 rounded-lg cursor-pointer
              select-none transition-colors duration-150
              ${isAccent
                ? 'bg-indigo-600 text-white shadow-sm'
                : isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
          >
            {isActive && !isAccent && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-500 rounded-r-full" />
            )}
            <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'scale-105' : ''}`} />
            <span className={`text-sm truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>
              {t(item.label)}
            </span>
          </div>
        );
      }}
    </NavLink>
  );
});

function ThemeToggle({ dark, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-200 flex-shrink-0 ${dark ? 'bg-indigo-600' : 'bg-gray-300'}`}
    >
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${dark ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}
      >
        {dark ? <Moon className="w-3 h-3 text-indigo-600" /> : <Sun className="w-3 h-3 text-amber-500" />}
      </span>
    </button>
  );
}

export default function Sidebar({ open, onClose, dark, toggleDark }) {
  const { user, logout } = useAuthStore();
  const { settings } = useSettingsStore();
  const logoUrl = settings?.logo_url || '';
  const storeName = settings?.store_name || "Oziq-ovqat Do'koni";

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0 border-b border-gray-100 dark:border-gray-800">
        {logoUrl ? (
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
            <img src={logoUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-bold text-gray-900 dark:text-white truncate leading-tight">{storeName}</h1>
          <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500">{t('posSystem')}</p>
        </div>
      </div>

      {/* Navigation - skrolsiz */}
      <nav className="flex-1 px-2.5 py-2.5 space-y-3 overflow-hidden">
        {GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((i) => i.group === group.key);
          if (!items.length) return null;
          return (
            <div key={group.key}>
              <div className="px-2 pb-0.5">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider uppercase select-none">
                  {group.title}
                </span>
              </div>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavItem key={item.to} item={item} onClose={onClose} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 px-2.5 py-2.5 space-y-2">
        {/* User */}
        <NavLink
          to="/profile"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{user?.name || t('user')}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">{user?.role === 'admin' ? t('admin') : t('cashier_role')}</p>
          </div>
        </NavLink>

        {/* Theme + Logout */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <ThemeToggle dark={dark} onClick={toggleDark} />
            <span className="text-[11px] text-gray-400">{dark ? t('night') : t('day')}</span>
          </div>
          <button
            onClick={async () => { await logout(); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            {t('logout')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop - CSS bilan boshqariladi, animation yo'q */}
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col w-[260px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-200 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {content}
      </aside>

      {/* Mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={onClose} />
          <aside className="fixed inset-y-0 left-0 w-[280px] z-50 flex flex-col bg-white dark:bg-gray-900 shadow-2xl transition-transform duration-200 ease-out translate-x-0">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
