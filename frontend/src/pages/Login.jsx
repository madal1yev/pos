import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/AuthContext';
import { useSettingsStore } from '../context/SettingsContext';
import { authAPI } from '../services/api';
import { t } from '../utils/uzbek';
import { getErrorMessage } from '../utils/errors';
import {
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineUserPlus,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import loginShowcase from '../assets/login-showcase.jpg';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [registering, setRegistering] = useState(false);
  const { login, loading, error, clearError, isAuthenticated } = useAuthStore();
  const { settings, loadSettings } = useSettingsStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (isAuthenticated()) navigate('/', { replace: true });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password, remember);
      toast.success(t('welcomeBack'));
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearError();
    setRegistering(true);
    try {
      await authAPI.register({ name, email, password, store_name: storeName });
      await login(email, password, remember);
      toast.success('Akkaunt yaratildi');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900">
      {/* Left - showcase image, hidden below lg */}
      <div className="hidden lg:block lg:w-[46%] relative overflow-hidden bg-indigo-950">
        <img
          src={loginShowcase}
          alt=""
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/85 via-indigo-950/15 to-indigo-900/40" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/25 via-transparent to-transparent" />

        <div className="absolute top-8 left-8 flex items-center gap-2.5">
     
          <span className="text-white font-semibold text-sm tracking-tight">{settings?.store_name || "Oziq-ovqat Do'koni"}</span>
        </div>

        <div className="absolute bottom-8 left-8 right-8 flex items-center gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
          <div className="w-11 h-11 rounded-xl bg-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-900/40">
            <HiOutlineShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{t('secureSystem')}</p>
            <p className="text-indigo-100/80 text-xs truncate">{t('secureSystemDesc')}</p>
          </div>
        </div>
      </div>

      {/* Right - auth form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
         <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{settings?.store_name || "Oziq-ovqat Do'koni"}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">{t('loginSubtitle')}</p>

          <div className="animate-fade-in-up">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
              <button onClick={() => { setMode('login'); clearError(); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                {t('signIn')}
              </button>
              <button onClick={() => { setMode('register'); clearError(); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'register' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                {t('signUp')}
              </button>
            </div>

            {mode === 'login' ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('email')}</label>
                  <div className="relative">
                    <HiOutlineEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="admin@pos.uz"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('password')}</label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-10 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">{t('rememberMe')}</span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      {t('signingIn')}
                    </span>
                  ) : t('signIn')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('fullName')}</label>
                  <div className="relative">
                    <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Ism Familiya"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('storeName')}</label>
                  <div className="relative">
                    <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder={t('storeName')}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('email')}</label>
                  <div className="relative">
                    <HiOutlineEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="admin@pos.uz"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('password')}</label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-10 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Kamida 6 ta belgi"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={registering}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 shadow-lg shadow-indigo-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <HiOutlineUserPlus className="w-4 h-4" />
                  {registering ? t('creating') : t('signUp')}
                </button>
              </form>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30">
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{String(error)}</p>
              </div>
            )}

            
          </div>
        </div>
      </div>
    </div>
  );
}
