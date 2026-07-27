import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../context/AuthContext';
import { useSettingsStore } from '../../context/SettingsContext';
import { UZ } from '../../utils/uzbek';
import {
  HiOutlineHome, HiOutlineCube, HiOutlineCalculator, HiOutlineClipboardDocumentList,
  HiOutlineChartBar, HiOutlineCog, HiOutlineXMark, HiOutlineCurrencyDollar,
  HiOutlineArrowRightOnRectangle, HiOutlineSquare3Stack3D
} from 'react-icons/hi2';
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';

const navItems = [
  { to: '/', icon: HiOutlineHome, label: UZ.dashboard },
  { to: '/pos', icon: HiOutlineCalculator, label: UZ.pos, accent: true },
  { to: '/products', icon: HiOutlineCube, label: UZ.products },
  { to: '/categories', icon: HiOutlineSquare3Stack3D, label: 'Kategoriyalar' },
  { to: '/sales', icon: HiOutlineClipboardDocumentList, label: UZ.sales },
  { to: '/reports', icon: HiOutlineChartBar, label: UZ.reports },
  { to: '/customers', icon: HiOutlineClipboardDocumentList, label: 'Mijozlar' },
  { to: '/suppliers', icon: HiOutlineClipboardDocumentList, label: 'Yetkazib' },
  { to: '/discounts', icon: HiOutlineCurrencyDollar, label: 'Chegirmalar' },
  { to: '/settings', icon: HiOutlineCog, label: UZ.settings },
];

export default function Sidebar({ open, onClose, dark, toggleDark }) {
  const { user, logout } = useAuthStore();
  const { settings } = useSettingsStore();
  const navigate = useNavigate();
  const logoUrl = settings?.logo_url || '';
  const storeName = settings?.store_name || "Do'kon";

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
    }`;

  const accentClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
    }`;

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-3 flex items-center gap-2.5 flex-shrink-0 border-b border-gray-100 dark:border-gray-800">
        {logoUrl ? (
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
            <img src={logoUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">S</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate">{storeName}</h1>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">POS tizimi</p>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <HiOutlineXMark className="w-4 h-4" />
        </button>
      </div>

      {/* Dark/Light Mode - yuqorida, nav dan oldin */}
      <div className="px-3 pt-2 pb-1 flex-shrink-0">
        <button onClick={toggleDark} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-700">
          {dark ? <HiOutlineSun className="w-4 h-4" /> : <HiOutlineMoon className="w-4 h-4" />}
          <span>{dark ? "☀️ Yorug' rejim" : "🌙 Qorong'u rejim"}</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-visible">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={item.accent ? accentClass : linkClass}
            end={item.to === '/'}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer - profile + logout */}
      <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800 space-y-1 flex-shrink-0">
        <NavLink to="/profile" onClick={onClose} className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-white">{user?.name?.charAt(0) || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{user?.name || 'Foydalanuvchi'}</p>
            <p className="text-[10px] text-gray-400 capitalize">{user?.role === 'admin' ? 'Admin' : 'Kassir'}</p>
          </div>
        </NavLink>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors">
          <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
          <span>{UZ.logout}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col animate-slide-in-left">
            <SidebarContent />
          </div>
        </div>
      )}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col z-40">
        <SidebarContent />
      </aside>
    </>
  );
}
