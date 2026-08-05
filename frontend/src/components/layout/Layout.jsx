import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSettingsStore } from '../../context/SettingsContext';

export default function Layout({ dark, toggleDark }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  useEffect(() => { loadSettings(); }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        dark={dark}
        toggleDark={toggleDark}
      />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-0'}`}>
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
