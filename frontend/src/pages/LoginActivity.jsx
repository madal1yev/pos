import { useState, useEffect, useRef } from 'react';
import { loginAuditAPI } from '../services/api';
import { HiOutlineMagnifyingGlass, HiOutlineShieldCheck, HiOutlineExclamationTriangle, HiOutlineClock, HiOutlineDevicePhoneMobile, HiOutlineComputerDesktop, HiOutlineArrowPath } from 'react-icons/hi2';
import toast from 'react-hot-toast';

function parseUserAgent(ua) {
  if (!ua || ua === 'unknown') return { browser: 'Noma\'lum', os: '', device: 'Noma\'lum' };
  let browser = 'Boshqa';
  let os = 'Boshqa';
  let device = 'Desktop';

  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) device = 'Mobil';
  else if (ua.includes('iPad') || ua.includes('Tablet')) device = 'Planshet';

  return { browser, os, device };
}

function DeviceIcon({ ua }) {
  const { device } = parseUserAgent(ua);
  if (device === 'Mobil' || device === 'Planshet') {
    return <HiOutlineDevicePhoneMobile className="w-4 h-4" />;
  }
  return <HiOutlineComputerDesktop className="w-4 h-4" />;
}

export default function LoginActivity() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => { loadLogs(); }, []);
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => { loadLogs(1); }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search, statusFilter, dateFrom, dateTo]);

  const loadLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const { data } = await loginAuditAPI.getAll(params);
      setLogs(data?.logs || []);
      setPagination(data?.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch {
      toast.error('Login tarixi yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLogs(pagination.page);
    setRefreshing(false);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(String(dateStr).replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const successCount = logs.filter(l => l.status === 'success').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Login Faoliyati</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pagination.total} ta kirish jarayoni</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2 border border-gray-200 dark:border-gray-700 disabled:opacity-50">
          <HiOutlineArrowPath className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Yangilash
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <HiOutlineShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{pagination.total}</p>
            <p className="text-[11px] text-gray-400">Jami kirish</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <HiOutlineShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{successCount}</p>
            <p className="text-[11px] text-gray-400">Muvaffaqiyatli</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <HiOutlineExclamationTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{failedCount}</p>
            <p className="text-[11px] text-gray-400">Muvaffaqiyatsiz</p>
          </div>
        </div>
      </div>

      <div className="card animate-fade-in-up">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Email yoki ism bo'yicha qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-auto sm:w-44 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">Barcha holatlar</option>
            <option value="success">Muvaffaqiyatli</option>
            <option value="failed">Muvaffaqiyatsiz</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white" title="Dan" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white" title="Gacha" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <HiOutlineClock className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-gray-400">Hech qanday login jarayoni topilmadi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const { browser, os, device } = parseUserAgent(log.user_agent);
              const isSuccess = log.status === 'success';
              return (
                <div key={log.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${isSuccess ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isSuccess ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                    <DeviceIcon ua={log.user_agent} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{log.user_name || log.email}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${isSuccess ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {isSuccess ? 'Muvaffaqiyatli' : 'Muvaffaqiyatsiz'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-gray-400">{log.email}</span>
                      <span className="text-[11px] text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-[11px] text-gray-400">{browser} / {os}</span>
                      <span className="text-[11px] text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-[11px] text-gray-400">{device}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <HiOutlineClock className="w-3 h-3" />
                      {formatTime(log.created_at)}
                    </div>
                    {log.ip_address && log.ip_address !== 'unknown' && (
                      <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">{log.ip_address}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={() => loadLogs(pagination.page - 1)} disabled={pagination.page <= 1} className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Oldingi</button>
            <span className="text-sm text-gray-500 dark:text-gray-400">{pagination.page} / {pagination.totalPages}</span>
            <button onClick={() => loadLogs(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Keyingi</button>
          </div>
        )}
      </div>
    </div>
  );
}
