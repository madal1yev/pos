import { useAuthStore } from '../context/AuthContext';
import { UZ } from '../utils/uzbek';
import { HiOutlineUser, HiOutlineShieldCheck, HiOutlineCalendarDays, HiOutlineEnvelope } from 'react-icons/hi2';

export default function Profile() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{UZ.profileTitle}</h1>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="text-2xl font-bold text-white">{user?.name?.charAt(0) || 'U'}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {user?.role === 'admin' ? UZ.admin : UZ.cashier_role}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <HiOutlineUser className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{UZ.name}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <HiOutlineEnvelope className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{UZ.email}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <HiOutlineShieldCheck className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{UZ.role}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{user?.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <HiOutlineCalendarDays className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{UZ.memberSince}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date().toLocaleDateString('uz-UZ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
