import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/AuthContext';
import { useSettingsStore } from '../context/SettingsContext';
import { t } from '../utils/uzbek';
import { getErrorMessage } from '../utils/errors';
import {
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineLockClosed,
  HiOutlineIdentification,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import loginShowcase from '../assets/login-showcase.jpg';

export default function Login() {
  const [accountId, setAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const { login, loading, error, clearError, isAuthenticated } = useAuthStore();
  const { settings, loadSettings } = useSettingsStore();
  const navigate = useNavigate();

  // 3 marta xato → 30 soniya blok (backend bilan parallel, sahifa himoyasi uchun)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);
  const [lockdownLeft, setLockdownLeft] = useState(0);
  const isLocked = lockdownLeft > 0;

  useEffect(() => {
    if (!lockoutUntil) return;
    const tick = () => {
      const left = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setLockdownLeft(left > 0 ? left : 0);
      if (left <= 0) {
        setLockoutUntil(0);
        setFailedAttempts(0);
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [lockoutUntil]);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (isAuthenticated()) navigate('/', { replace: true });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) {
      toast.error(`Iltimos, ${lockdownLeft} soniya kuting!`);
      return;
    }
    clearError();
    try {
      await login(accountId, password, remember);
      setFailedAttempts(0);
      setLockoutUntil(0);
      toast.success(t('welcomeBack'));
      navigate('/', { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const retryAfter = err.response?.data?.retry_after;
      if (status === 429) {
        // Backend 30 soniyaga blokladi (3-xato)
        const secs = Number(retryAfter) || 30;
        setLockoutUntil(Date.now() + secs * 1000);
        toast.error(`3 marta xato kiritildi! ${secs} soniya kuting.`);
      } else {
        const next = failedAttempts + 1;
        setFailedAttempts(next);
        if (next >= 3) {
          setLockoutUntil(Date.now() + 30 * 1000);
          toast.error('3 marta xato kiritildi! 30 soniya kuting.');
        } else {
          toast.error(`${getErrorMessage(err)} (${3 - next} ta urinish qoldi)`);
        }
      }
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
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Akkaunt ID</label>
                <div className="relative">
                  <HiOutlineIdentification className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                  <input
                    type="text"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    disabled={isLocked}
                    className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono tracking-wider disabled:opacity-50"
                    placeholder="M-123456"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Akkaunt ID ni sotuvchidan oling (masalan: M-123456)</p>
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
                disabled={loading || isLocked}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
              >
                {isLocked ? (
                  <span className="flex items-center justify-center gap-2">
                    🔒 {lockdownLeft} soniya kuting...
                  </span>
                ) : loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    {t('signingIn')}
                  </span>
                ) : t('signIn')}
              </button>
            </form>

            {isLocked && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30">
                <p className="text-sm text-amber-700 dark:text-amber-400 text-center font-medium">
                  ⚠️ 3 marta xato ID kiritildi! {lockdownLeft} soniyadan keyin qayta urinib ko'ring.
                </p>
              </div>
            )}

            {!isLocked && failedAttempts > 0 && failedAttempts < 3 && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30">
                <p className="text-sm text-amber-700 dark:text-amber-400 text-center">
                  ⚠️ Noto'g'ri Akkaunt ID yoki parol! {3 - failedAttempts} ta urinish qoldi.
                </p>
              </div>
            )}

            {error && !isLocked && (
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
