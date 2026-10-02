import { ShoppingCart, Warehouse, Package, BarChart3 } from 'lucide-react';
import Reveal from './Reveal';

// Hero ostidagi imkoniyatlar lentasi — fake statistika JO'Q,
// faqat tizimning haqiqiy qobiliyatlari ko'rsatiladi.
const ITEMS = [
  { icon: ShoppingCart, label: 'Savdo boshqaruvi' },
  { icon: Warehouse, label: 'Ombor nazorati' },
  { icon: Package, label: 'Mahsulotlar bazasi' },
  { icon: BarChart3, label: 'Hisobot va tahlil' },
];

export default function Capabilities() {
  return (
    <section className="bg-white border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
            Biznesingizning kundalik operatsiyalarini bitta tizimga jamlang
          </p>
          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {ITEMS.map((it) => (
              <div
                key={it.label}
                className="flex items-center justify-center lg:justify-start gap-2.5 text-gray-600"
              >
                <it.icon className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-sm font-medium">{it.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
