import { useRef, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown,
  Store,
} from 'lucide-react';
import { useAuthStore } from '../../context/AuthContext';
import { useSettingsStore } from '../../context/SettingsContext';
import { t } from '../../utils/uzbek';

// ─── Navigation Groups ─────────────────────────────────────────
const getNavGroups = () => [
  {
    title: t('main'),
    items: [
      { to: '/', icon: LayoutDashboard, label: t('dashboardNav'), exact: true },
      { to: '/pos', icon: ShoppingCart, label: t('posNav'), accent: true },
    ],
  },
  {
    title: t('productsGroup'),
    items: [
      { to: '/products', icon: Package, label: t('productsNav') },
      { to: '/categories', icon: FolderTree, label: t('categoriesNav') },
    ],
  },
  {
    title: t('trade'),
    items: [
      { to: '/sales', icon: Receipt, label: t('salesNav') },
      { to: '/reports', icon: BarChart3, label: t('reportsNav') },
      { to: '/customers', icon: Users, label: t('debtorsNav') },
    ],
  },
  {
    title: t('management'),
    items: [
      { to: '/suppliers', icon: Truck, label: t('suppliersNav') },
      { to: '/discounts', icon: BadgePercent, label: t('discountsNav') },
      { to: '/settings', icon: Settings, label: t('settingsNav') },
    ],
  },
];

// ─── Stagger animation variants ────────────────────────────────
const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.02 + i * 0.035, type: 'spring', stiffness: 280, damping: 22 },
  }),
};

const groupVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

// ─── NavItem ───────────────────────────────────────────────────
function NavItem({ item, index, onClose }) {
  const Icon = item.icon;
  return (
    <motion.div
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
    >
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
                group relative flex items-center gap-3 h-11 px-3.5 rounded-xl cursor-pointer
                select-none transition-all duration-200
                ${isAccent
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40'
                    : 'border border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              {/* Active left indicator */}
              {isActive && !isAccent && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-5 bg-indigo-500 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* Icon */}
              <div
                className={`
                  relative flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0
                  transition-all duration-200
                  ${isAccent
                    ? 'text-white'
                    : isActive
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-800/20'
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/10'
                  }
                `}
              >
                <Icon
                  className={`
                    w-[18px] h-[18px] transition-all duration-200
                    ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-3'}
                  `}
                />
              </div>

              {/* Label */}
              <span
                className={`
                  text-sm font-medium transition-all duration-200
                  ${isAccent
                    ? 'text-white font-semibold'
                    : isActive
                      ? 'text-indigo-700 dark:text-indigo-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                  }
                `}
              >
                {item.label}
              </span>
            </div>
          );
        }}
      </NavLink>
    </motion.div>
  );
}

// ─── iOS-style Theme Toggle ────────────────────────────────────
function ThemeToggle({ dark, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative inline-flex h-[26px] w-[46px] items-center rounded-full
        transition-colors duration-300 flex-shrink-0
        ${dark ? 'bg-indigo-600' : 'bg-gray-300'}
      `}
    >
      <span
        className={`
          inline-flex items-center justify-center w-[22px] h-[22px] rounded-full
          bg-white shadow-sm transition-all duration-300
          ${dark ? 'translate-x-[22px]' : 'translate-x-[2px]'}
        `}
      >
        {dark ? (
          <Moon className="w-3 h-3 text-indigo-600" />
        ) : (
          <Sun className="w-3 h-3 text-amber-500" />
        )}
      </span>
    </button>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────
export default function Sidebar({ open, onClose, dark, toggleDark }) {
  const { user, logout } = useAuthStore();
  const { settings } = useSettingsStore();
  const navigate = useNavigate();
  const logoUrl = settings?.logo_url || '';
  const storeName = settings?.store_name || "Oziq-ovqat Do'koni";
  const navRef = useRef(null);
  const navGroups = getNavGroups();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ─── Content ──────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0 border-b border-gray-100 dark:border-gray-800">
        <div className="relative flex-shrink-0">
          {logoUrl ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <img src={logoUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Store className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-bold text-gray-900 dark:text-white truncate leading-tight">
            {storeName}
          </h1>
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 tracking-wide">
            POS System
          </p>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────── */}
      <nav ref={navRef} className="flex-1 px-2 py-3 space-y-3 overflow-y-auto hide-scrollbar">
        {navGroups.map((group, gi) => (
          <motion.div
            key={group.title}
            variants={groupVariants}
            initial="hidden"
            animate="visible"
            className="space-y-0.5"
          >
            {/* Group title */}
            <div className="px-2.5 pb-1">
              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-[0.08em] uppercase select-none">
                {group.title}
              </span>
            </div>

            {/* Items */}
            {group.items.map((item, ii) => (
              <NavItem
                key={item.to}
                item={item}
                index={gi * 4 + ii}
                onClose={onClose}
              />
            ))}
          </motion.div>
        ))}
      </nav>

      {/* ── Bottom ───────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 px-3 py-3 space-y-2">
        {/* User Profile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <NavLink
            to="/profile"
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 bg-gradient-to-r from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10 border border-indigo-100 dark:border-indigo-800/30 hover:border-indigo-200 dark:hover:border-indigo-700/40 hover:-translate-y-0.5"
          >
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-sm">
                <span className="text-sm font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.name || 'Foydalanuvchi'}
              </p>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 capitalize">
                {user?.role === 'admin' ? 'Administrator' : 'Kassir'}
              </p>
            </div>

            <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200 flex-shrink-0" />
          </NavLink>
        </motion.div>

        {/* Dark mode + Logout */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <ThemeToggle dark={dark} onClick={toggleDark} />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {dark ? t('night') : t('day')}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
            title={t('logout')}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Desktop ─────────────────────────────────────────────
  const desktop = (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col overflow-hidden w-[280px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl rounded-r-[20px]"
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        >
          <SidebarContent />
        </motion.aside>
      )}
    </AnimatePresence>
  );

  // ─── Mobile overlay ──────────────────────────────────────
  const mobile = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 left-0 w-[280px] z-50 flex flex-col overflow-hidden bg-white dark:bg-gray-900 shadow-2xl"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <SidebarContent />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {desktop}
      {mobile}
    </>
  );
}
