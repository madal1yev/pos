import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import POS from './pages/POS';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Categories from './pages/Categories';
import Shifts from './pages/Shifts';
import Refunds from './pages/Refunds';
import Stores from './pages/Stores';
import LoginActivity from './pages/LoginActivity';
import PWAInstall from './components/PWAInstall';
import ErrorBoundary from './components/ErrorBoundary';
import { useDarkMode } from './hooks/useDarkMode';

// Landing ochiq (public) sahifa — alohida chunk bo'lib yuklanadi,
// POS ilova bundle'ini sekmaydi.
const Landing = lazy(() => import('./pages/landing/Landing'));

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// "/" manzili:
//  - tizimga KIRILGAN  -> POS ilovasi (dashboard)
//  - tizimga kirmagan  -> marketing landing (mechmon uchun)
//  - boshqa himoyalangan yo'l -> /login
function RootShell({ dark, toggleDark }) {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();

  if (!token) {
    if (location.pathname === '/') return <Landing />;
    return <Navigate to="/login" replace />;
  }
  return (
    <ProtectedRoute>
      <Layout dark={dark} toggleDark={toggleDark} />
    </ProtectedRoute>
  );
}

function App() {
  const { dark, toggle } = useDarkMode();

  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '10px', background: '#1f2937', color: '#fff' } }} />
        <PWAInstall />
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
              <div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RootShell dark={dark} toggleDark={toggle} />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="customers" element={<Customers />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="pos" element={<POS />} />
            <Route path="sales" element={<Sales />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="categories" element={<Categories />} />
            <Route path="shifts" element={<Shifts />} />
              <Route path="refunds" element={<Refunds />} />
              <Route path="stores" element={<Stores />} />
            <Route path="login-activity" element={<LoginActivity />} />
            <Route path="profile" element={<Profile />} />
          </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
