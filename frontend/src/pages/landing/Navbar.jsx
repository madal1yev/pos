import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineBars3, HiOutlineXMark } from 'react-icons/hi2';
import { Store } from 'lucide-react';

const LINKS = [
  { href: '#top', label: 'Bosh sahifa' },
  { href: '#features', label: 'Imkoniyatlar' },
  { href: '#how', label: 'Qanday ishlaydi' },
  { href: '#pricing', label: 'Narxlar' },
  { href: '#faq', label: 'FAQ' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => setOpen(false);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${
        scrolled || open
          ? 'bg-white/95 backdrop-blur border-b border-gray-200'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="#top" onClick={close} className="flex items-center gap-2.5 shrink-0">
          <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Store className="w-[18px] h-[18px] text-white" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-gray-900">MAXPOS</span>
        </a>

        <div className="hidden lg:flex items-center gap-1">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center justify-center h-10 px-5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Kirish
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Menyuni yopish' : 'Menyuni ochish'}
            aria-expanded={open}
            className="lg:hidden w-10 h-10 -mr-1 inline-flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
          >
            {open ? <HiOutlineXMark className="w-5 h-5" /> : <HiOutlineBars3 className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="lg:hidden border-t border-gray-200 bg-white animate-fade-in-down">
          <div className="px-4 sm:px-6 py-3 space-y-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={close}
                className="block px-3 py-2.5 rounded-lg text-[15px] font-medium text-gray-700 hover:bg-gray-100"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={close}
              className="mt-2 flex items-center justify-center h-11 rounded-lg bg-gray-900 text-white text-sm font-semibold"
            >
              Kirish
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
