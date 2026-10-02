import { Link } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, ReceiptText, BarChart3, Users,
  ArrowRight, ScanLine,
} from 'lucide-react';
import Reveal from './Reveal';
import MockFrame from './MockFrame';

const MENU = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: ShoppingCart, label: 'Sotuv' },
  { icon: Package, label: 'Mahsulotlar' },
  { icon: ReceiptText, label: 'Savdolar' },
  { icon: BarChart3, label: 'Hisobotlar' },
  { icon: Users, label: 'Qarzdorlar' },
];

const BARS = [
  { d: 'Du', h: 42 }, { d: 'Se', h: 64 }, { d: 'Ch', h: 48 },
  { d: 'Pa', h: 78 }, { d: 'Ju', h: 58 }, { d: 'Sh', h: 92 }, { d: 'Ya', h: 70 },
];

const SALES = [
  { id: 'INV-1048', item: 'Coca-Cola 1L ×2', sum: '18 000' },
  { id: 'INV-1047', item: 'Non ×3', sum: '12 000' },
  { id: 'INV-1046', item: 'Sut 1L ×4', sum: '36 000' },
];

function DashboardMock() {
  return (
    <MockFrame>
      <div className="grid grid-cols-[52px_1fr] sm:grid-cols-[136px_1fr]">
        <aside className="border-r border-gray-100 bg-gray-50/70 p-2 sm:p-2.5 space-y-1">
          <div className="hidden sm:flex items-center gap-2 px-2 h-8 mb-2">
            <span className="w-5 h-5 rounded bg-indigo-600" />
            <span className="text-[11px] font-bold tracking-tight text-gray-900">MAXPOS</span>
          </div>
          <div className="sm:hidden w-6 h-6 rounded bg-indigo-600 mx-auto mb-2" />
          {MENU.map((m) => (
            <div
              key={m.label}
              className={`flex items-center gap-2 h-7 px-2 rounded-md text-[10px] sm:text-[11px] font-medium ${
                m.active ? 'bg-indigo-600 text-white' : 'text-gray-500'
              }`}
            >
              <m.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline truncate">{m.label}</span>
            </div>
          ))}
        </aside>

        <div className="p-3 sm:p-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Dashboard</h4>
            <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
              Bugun
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { l: 'Bugungi savdo', v: '12 450 000', u: "so'm" },
              { l: 'Savdolar', v: '38', u: 'ta' },
              { l: 'Qarzdorlar', v: '5', u: 'ta' },
            ].map((s) => (
              <div key={s.l} className="rounded-lg border border-gray-200 bg-white px-2.5 py-2">
                <p className="text-[9px] text-gray-400 font-medium truncate">{s.l}</p>
                <p className="text-[11px] sm:text-xs font-bold text-gray-900 truncate">
                  {s.v} <span className="font-medium text-gray-400">{s.u}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-2.5">
            <div className="flex items-end justify-between gap-1.5 h-16 sm:h-20">
              {BARS.map((b, i) => (
                <div key={b.d} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-sm ${i === 5 ? 'bg-indigo-600' : 'bg-indigo-200'}`}
                    style={{ height: `${b.h}%` }}
                  />
                  <span className="text-[8px] text-gray-400">{b.d}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            {SALES.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-2.5 py-1.5 gap-2">
                <span className="text-[9px] sm:text-[10px] font-mono text-gray-400 shrink-0">{s.id}</span>
                <span className="text-[9px] sm:text-[10px] text-gray-600 truncate">{s.item}</span>
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-900 shrink-0">{s.sum}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockFrame>
  );
}

export default function Hero() {
  return (
    <section id="top" className="relative bg-white pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 h-7 px-3 rounded-full border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
                <ScanLine className="w-3.5 h-3.5 text-indigo-600" />
                Zamonaviy POS platforma
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-6 text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.08]">
                Biznesingizni boshqarishning yangi avlodi.
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-5 text-lg sm:text-xl text-gray-500 leading-relaxed max-w-xl">
                MaxPOS — savdo, ombor, mahsulotlar, qarzdorlar va hisobotlarni yagona tizimda
                boshqarish uchun zamonaviy POS platforma.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  Kirish
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center h-12 px-7 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Imkoniyatlar ko'rish
                </a>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <p className="mt-5 text-sm text-gray-400">
                Akkaunt ID bilan kirish · O'zbek, Rus va Ingliz tillari · Kompyuter, planshet va telefonda
              </p>
            </Reveal>
          </div>

          <Reveal delay={160} className="min-w-0">
            <DashboardMock />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
