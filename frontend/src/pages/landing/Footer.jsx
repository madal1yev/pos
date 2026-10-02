import { Store, Phone, Send, Mail } from 'lucide-react';

const NAV = [
  { href: '#top', label: 'Bosh sahifa' },
  { href: '#features', label: 'Imkoniyatlar' },
  { href: '#how', label: 'Qanday ishlaydi' },
  { href: '#pricing', label: 'Narxlar' },
  { href: '#faq', label: 'FAQ' },
];

const PRODUCT = [
  { href: '#showcase', label: 'Interfeys' },
  { href: '#security', label: 'Xavfsizlik' },
];

const CONTACTS = [
  { href: 'tel:+998900633112', label: '+998 90 063 31 12', Icon: Phone },
  { href: 'https://t.me/madal1yev_a', label: '@madal1yev_a', Icon: Send, external: true },
  { href: 'mailto:madaliyev.dev@gmail.com', label: 'madaliyev.dev@gmail.com', Icon: Mail, break: true },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Store className="text-white" style={{ width: 18, height: 18 }} />
              </span>
              <span className="text-lg font-extrabold tracking-tight text-gray-900">MAXPOS</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-500 max-w-sm">
              Biznes boshqaruvini soddalashtiruvchi zamonaviy POS platforma: savdo, ombor,
              mahsulotlar va hisobotlar — bitta tizimda.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Sahifalar</h4>
            <ul className="mt-4 space-y-2.5">
              {NAV.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Mahsulot</h4>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#top" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Kirish
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Bog'lanish</h4>
            <ul className="mt-4 space-y-3">
              {CONTACTS.map((c) => (
                <li key={c.href}>
                  <a
                    href={c.href}
                    {...(c.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                    className="group flex items-start gap-2.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                  >
                    <span className="mt-0.5 w-7 h-7 shrink-0 rounded-lg bg-white border border-gray-200 flex items-center justify-center group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors">
                      <c.Icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    </span>
                    <span className={`${c.break ? 'break-all' : ''} leading-7`}>{c.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">© 2026 MaxPOS. Barcha huquqlar himoyalangan.</p>
          <p className="text-xs text-gray-400">Zamonaviy POS tizimi</p>
        </div>
      </div>
    </footer>
  );
}
