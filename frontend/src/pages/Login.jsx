import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/AuthContext';
import { UZ } from '../utils/uzbek';
import { getErrorMessage } from '../utils/errors';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const { login, loading, error, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) navigate('/', { replace: true });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password, remember);
      toast.success(UZ.welcomeBack);
      navigate('/');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl shadow-lg shadow-emerald-500/30 mb-4">
            <span className="text-3xl">&#127829;</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{UZ.welcomeBack}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{UZ.loginSubtitle}</p>
        </div>

        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{UZ.email}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="admin@pos.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{UZ.password}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">{UZ.rememberMe}</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  {UZ.signingIn}
                </span>
              ) : UZ.signIn}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">{String(error)}</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-6">
          {UZ.demoCredentials}
        </p>
      </div>
    </div>
  );
}
