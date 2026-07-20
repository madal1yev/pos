import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../context/AuthContext';
import { UZ } from '../../utils/uzbek';
import {
  HiOutlineHome, HiOutlineCube, HiOutlineCalculator, HiOutlineClipboardDocumentList,
  HiOutlineChartBar, HiOutlineCog, HiOutlineXMark, HiOutlineCurrencyDollar,
  HiOutlineUser, HiOutlineArrowRightOnRectangle, HiOutlineDocumentArrowUp
} from 'react-icons/hi2';
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';

const navItems = [
  { to: '/', icon: HiOutlineHome, label: UZ.dashboard },
  { to: '/pos', icon: HiOutlineCalculator, label: UZ.pos, accent: true },
  { to: '/products', icon: HiOutlineCube, label: UZ.products },
  { to: '/sales', icon: HiOutlineClipboardDocumentList, label: UZ.sales },
  { to: '/reports', icon: HiOutlineChartBar, label: UZ.reports },
  { to: '/settings', icon: HiOutlineCog, label: UZ.settings },
];

export default function Sidebar({ open, onClose, dark, toggleDark }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
    }`;

  const accentClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
    }`;

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 py-5 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white text-lg">&#127829;</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Oziq-ovqat</h1>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Do'kon POS tizimi</p>
        </div>
        <button onClick={onClose} className="lg:hidden ml-auto p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <HiOutlineXMark className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto min-h-0">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={item.accent ? accentClass : linkClass}
            end={item.to === '/'}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2 flex-shrink-0">
        <button onClick={toggleDark} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors">
          {dark ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
          {dark ? "Yorug' rejim" : "Qorong'u rejim"}
        </button>

        <NavLink to="/profile" onClick={onClose} className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}>
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
            <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
              {user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate capitalize">{user?.role === 'admin' ? UZ.admin : UZ.cashier_role}</p>
          </div>
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
          {UZ.logout}
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
