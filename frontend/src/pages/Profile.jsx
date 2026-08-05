import { useState } from 'react';
import { useAuthStore } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { UZ } from '../utils/uzbek';
import { HiOutlineUser, HiOutlineShieldCheck, HiOutlineCalendarDays, HiOutlineEnvelope, HiOutlinePencil, HiOutlineLockClosed, HiOutlineCheck, HiOutlineXMark } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, login } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) { toast.error('Ism kiritish shart'); return; }
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile({ name, email });
      // Update stored user
      const storedUser = JSON.parse(localStorage.getItem('pos_user') || '{}');
      const updatedUser = { ...storedUser, ...data.user };
      localStorage.setItem('pos_user', JSON.stringify(updatedUser));
      useAuthStore.setState({ user: updatedUser });
      toast.success('Profil yangilandi');
      setEditing(false);
    } catch (err) {
      const msg = err.response?.data?.error || 'Xatolik yuz berdi';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("Yangi parol kamida 6 belgidan iborat bo'lishi kerak"); return; }
    if (newPassword !== confirmPassword) { toast.error('Parollar mos kelmadi'); return; }
    setChangingPassword(true);
    try {
      await authAPI.changePassword({ current_password: currentPassword, new_password: newPassword });
      toast.success('Parol yangilandi');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Xatolik yuz berdi';
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const cancelEdit = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{UZ.profileTitle}</h1>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 transition-all">
            <HiOutlinePencil className="w-4 h-4" /> Tahrirlash
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 transition-all disabled:opacity-50">
              <HiOutlineCheck className="w-4 h-4" /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
            <button onClick={cancelEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
              <HiOutlineXMark className="w-4 h-4" /> Bekor qilish
            </button>
          </div>
        )}
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
          {/* Name */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <HiOutlineUser className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">{UZ.name}</p>
              {editing ? (
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full text-sm font-medium bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg px-2 py-1 text-gray-900 dark:text-white outline-none focus:border-indigo-500" />
              ) : (
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <HiOutlineEnvelope className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">{UZ.email}</p>
              {editing ? (
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-sm font-medium bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg px-2 py-1 text-gray-900 dark:text-white outline-none focus:border-indigo-500" />
              ) : (
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</p>
              )}
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <HiOutlineShieldCheck className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{UZ.role}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{user?.role}</p>
            </div>
          </div>

          {/* Member since */}
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

      {/* Password Change */}
      <div className="card">
        <button
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <HiOutlineLockClosed className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Parolni o'zgartirish</span>
          </div>
          <HiOutlinePencil className={`w-4 h-4 text-gray-400 transition-transform ${showPasswordForm ? 'rotate-180' : ''}`} />
        </button>

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Joriy parol</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Yangi parol</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" required minLength={6} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Yangi parolni takrorlang</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" required />
            </div>
            <button type="submit" disabled={changingPassword} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all disabled:opacity-50">
              {changingPassword ? 'O\'zgartirilmoqda...' : 'Parolni o\'zgartirish'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
