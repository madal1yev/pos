import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowDownTray,
  HiOutlineXMark,
  HiOutlineShare,
  HiOutlineEllipsisHorizontal,
} from 'react-icons/hi2';

// iOS (Safari) beforeinstallprompt qo'llamaydi — qo'lda yo'riqnoma ko'rsatamiz
function isAppleDevice() {
  if (typeof navigator === 'undefined') return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator.standalone === true
  );
}

export function useInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(isStandaloneMode());

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setInstalled(true);
      toast.success("MaxPOS telefoningizga o'rnatildi!");
    };
    const onDisplayChange = (e) => {
      if (e.matches) setInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    window.matchMedia?.('(display-mode: standalone)')?.addEventListener?.('change', onDisplayChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.matchMedia?.('(display-mode: standalone)')?.removeEventListener?.('change', onDisplayChange);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        return true;
      }
    } catch {}
    return false;
  }, [deferredPrompt]);

  return { canInstall: !!deferredPrompt && !installed, installed, install };
}

function InstallHelp({ onClose }) {
  const apple = isAppleDevice();
  const steps = apple
    ? [
        { icon: HiOutlineShare, text: 'Safari ilovasida MaxPOS sahifasini oching va pastdagi Ulashish tugmasini bosing' },
        { text: '"Uy ekraniga qo\'shish" ni tanlang' },
        { text: '"Qo\'shish" ni bosing — ilova ekraningizda paydo bo\'ladi' },
      ]
    : [
        { icon: HiOutlineEllipsisHorizontal, text: 'Brauzer menyusini oching (yuqori o\'ngda ⋮)' },
        { text: '"Ilova qo\'shish" yoki "Install app" ni tanlang' },
        { text: '"O\'rnatish" yoki "Add" ni bosing' },
      ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up">
        <button
          onClick={onClose}
          aria-label="Yopish"
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <HiOutlineXMark className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
          <HiOutlineArrowDownTray className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">MaxPOS ni o'rnatish</h3>
        <p className="text-sm text-gray-500 mt-1">
          {apple
            ? "iPhone/iPad'da ilova quyidagi 3 qadam orqali o'rnatiladi:"
            : 'Telefoningizda ilovani quyidagi 3 qadam orqali o\'rnatishingiz mumkin:'}
        </p>

        <ol className="mt-5 space-y-4">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-7 h-7 shrink-0 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex items-start gap-2">
                {s.icon && <s.icon className="w-4 h-4 mt-0.5 shrink-0 text-indigo-500" />}
                {s.text}
              </span>
            </li>
          ))}
        </ol>

        <button
          onClick={onClose}
          className="mt-6 w-full h-11 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Tushunarli
        </button>
      </div>
    </div>
  );
}

export default function InstallAppButton({ className = '', variant = 'outline', sizeClass = 'h-10 px-4 rounded-lg' }) {
  const { canInstall, installed, install } = useInstall();
  const [showHelp, setShowHelp] = useState(false);

  const handleClick = async () => {
    if (canInstall) {
      const ok = await install();
      if (!ok) setShowHelp(true);
    } else {
      setShowHelp(true);
    }
  };

  if (installed) return null;

  const base = 'inline-flex items-center justify-center gap-2 text-sm font-semibold transition-colors';
  const styles =
    variant === 'solid'
      ? 'bg-white text-gray-900 hover:bg-gray-100'
      : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800';

  return (
    <>
      <button type="button" onClick={handleClick} className={`${base} ${sizeClass} ${styles} ${className}`}>
        <HiOutlineArrowDownTray className="w-4 h-4" />
        O'rnatish
      </button>
      {showHelp && <InstallHelp onClose={() => setShowHelp(false)} />}
    </>
  );
}
