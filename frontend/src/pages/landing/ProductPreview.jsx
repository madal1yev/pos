import { useState } from 'react';
import { ShoppingCart, Package, Warehouse, BarChart3, LayoutDashboard, Plus, Search, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import Reveal from './Reveal';
import MockFrame from './MockFrame';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'pos', label: 'Sotuv', icon: ShoppingCart },
  { key: 'products', label: 'Mahsulotlar', icon: Package },
  { key: 'stock', label: 'Ombor', icon: Warehouse },
  { key: 'reports', label: 'Hisobotlar', icon: BarChart3 },
];

const PRODUCTS = [
  { n: 'Coca-Cola 1L', p: '9 000' }, { n: 'Non', p: '4 000' },
  { n: 'Sut 1L', p: '9 500' }, { n: 'Guruch 1kg', p: '18 000' },
  { n: 'Yog\' 1L', p: '28 000' }, { n: 'Choy 100g', p: '12 000' },
];

const ROWS = [
  { n: 'Coca-Cola 1L', c: 'PRD-0042', p: "9 000", s: '124' },
  { n: 'Non', c: 'PRD-0043', p: "4 000", s: '86' },
  { n: 'Sut 1L', c: 'PRD-0044', p: "9 500", s: '42' },
  { n: 'Guruch 1kg', c: 'PRD-0045', p: "18 000", s: '15' },
];

function DashboardView() {
  const bars = [45, 62, 52, 80, 60, 95, 72];
  return (
    <div className="p-3 sm:p-4 space-y-3 h-full overflow-hidden">
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: 'Bugungi savdo', v: '12 450 000' },
          { l: 'Foyda', v: '3 120 000' },
          { l: 'Savdolar', v: '38' },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-gray-200 px-3 py-2.5">
            <p className="text-[10px] text-gray-400 font-medium">{s.l}</p>
            <p className="text-sm font-bold text-gray-900 truncate">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-[10px] font-semibold text-gray-500 mb-2">Haftalik savdo</p>
        <div className="flex items-end gap-2 h-24 sm:h-28">
          {bars.map((h, i) => (
            <div key={i} className={`flex-1 rounded-t ${i === 5 ? 'bg-indigo-600' : 'bg-indigo-200'}`} style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
        {['INV-1048', 'INV-1047', 'INV-1046'].map((id) => (
          <div key={id} className="flex items-center justify-between px-3 py-2">
            <span className="text-[10px] font-mono text-gray-400">{id}</span>
            <span className="text-[10px] text-gray-500">Sotuv</span>
            <span className="text-[10px] font-bold text-gray-900">18 000</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PosView() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] h-full">
      <div className="p-3 space-y-2 min-w-0 overflow-hidden">
        <div className="flex items-center h-8 px-2.5 rounded-lg border border-gray-200 text-[10px] text-gray-400 gap-1.5">
          <Search className="w-3 h-3" /> Mahsulot qidirish yoki barkod skanerlang...
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRODUCTS.map((p) => (
            <div key={p.n} className="rounded-lg border border-gray-200 px-2.5 py-2 hover:border-indigo-300 transition-colors">
              <p className="text-[10px] font-semibold text-gray-800 truncate">{p.n}</p>
              <p className="text-[10px] font-bold text-indigo-600">{p.p} so'm</p>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden sm:flex flex-col border-l border-gray-200 bg-gray-50/60 p-3 gap-2">
        <p className="text-[10px] font-bold text-gray-700">Savat</p>
        <div className="space-y-1.5">
          {[{ n: 'Coca-Cola ×2', s: '18 000' }, { n: 'Non ×3', s: '12 000' }].map((it) => (
            <div key={it.n} className="flex justify-between text-[10px] bg-white border border-gray-200 rounded-md px-2 py-1.5">
              <span className="text-gray-700 truncate">{it.n}</span>
              <span className="font-bold text-gray-900">{it.s}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto space-y-2">
          <div className="flex justify-between text-[11px] font-bold text-gray-900">
            <span>Jami</span><span>30 000</span>
          </div>
          <div className="h-8 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold flex items-center justify-center">
            To'lov
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsView() {
  return (
    <div className="p-3 sm:p-4 h-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center h-7 px-2.5 rounded-lg border border-gray-200 text-[10px] text-gray-400 gap-1.5 flex-1 max-w-[220px]">
          <Search className="w-3 h-3" /> Qidirish
        </div>
        <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-indigo-600 text-white text-[10px] font-semibold">
          <Plus className="w-3 h-3" /> Qo'shish
        </span>
      </div>
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[1fr_70px_70px_50px] gap-2 px-3 py-2 bg-gray-50 text-[9px] font-semibold text-gray-500 uppercase tracking-wide">
          <span>Nomi</span><span>Kod</span><span className="text-right">Narx</span><span className="text-right">Qoldiq</span>
        </div>
        {ROWS.map((r) => (
          <div key={r.c} className="grid grid-cols-[1fr_70px_70px_50px] gap-2 px-3 py-2 border-t border-gray-100 text-[10px]">
            <span className="text-gray-800 font-medium truncate">{r.n}</span>
            <span className="font-mono text-gray-400">{r.c}</span>
            <span className="text-right text-gray-900 font-semibold">{r.p}</span>
            <span className={`text-right font-bold ${parseInt(r.s, 10) <= 20 ? 'text-amber-600' : 'text-gray-900'}`}>{r.s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StockView() {
  const moves = [
    { t: 'Kirim', d: 'Guruch 20kg', i: ArrowDownToLine, c: 'text-emerald-600 bg-emerald-50' },
    { t: 'Chiqim', d: 'Sotuvda sarflandi', i: ArrowUpFromLine, c: 'text-red-600 bg-red-50' },
    { t: 'Kirim', d: 'Sut 24 dona', i: ArrowDownToLine, c: 'text-emerald-600 bg-emerald-50' },
    { t: 'Chiqim', d: 'Yaroqsiz', i: ArrowUpFromLine, c: 'text-red-600 bg-red-50' },
  ];
  return (
    <div className="p-3 sm:p-4 space-y-3 h-full overflow-hidden">
      <div className="grid grid-cols-3 gap-2">
        {[{ l: 'Kirim', v: '142' }, { l: 'Chiqim', v: '96' }, { l: 'Kam qoldiq', v: '7' }].map((s) => (
          <div key={s.l} className="rounded-lg border border-gray-200 px-3 py-2.5 text-center">
            <p className="text-[10px] text-gray-400 font-medium">{s.l}</p>
            <p className="text-sm font-bold text-gray-900">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
        {moves.map((m, i) => (
          <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
            <span className={`w-6 h-6 rounded-md flex items-center justify-center ${m.c}`}>
              <m.i className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-gray-800 truncate">{m.d}</p>
              <p className="text-[9px] text-gray-400">{m.t}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsView() {
  return (
    <div className="p-3 sm:p-4 space-y-3 h-full overflow-hidden">
      <div className="grid grid-cols-3 gap-2">
        {[{ l: 'Oylik savdo', v: '284 mln' }, { l: 'Foyda', v: '71 mln' }, { l: 'O\'rtacha chek', v: '328 000' }].map((s) => (
          <div key={s.l} className="rounded-lg border border-gray-200 px-3 py-2.5">
            <p className="text-[10px] text-gray-400 font-medium truncate">{s.l}</p>
            <p className="text-[11px] sm:text-sm font-bold text-gray-900 truncate">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-[10px] font-semibold text-gray-500 mb-3">Oylik dinamika</p>
        <div className="flex items-end gap-1.5 sm:gap-2 h-24 sm:h-32">
          {[35, 48, 42, 66, 58, 74, 70, 88, 82, 96, 90, 100].map((h, i) => (
            <div key={i} className={`flex-1 rounded-t ${i === 11 ? 'bg-indigo-600' : 'bg-indigo-200'}`} style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {['Kunlik hisobot', 'Oylik hisobot', 'Top mahsulotlar', 'Foyda va zarar'].map((c) => (
          <span key={c} className="px-2 py-1 rounded-md bg-gray-100 text-[9px] font-medium text-gray-600">{c}</span>
        ))}
      </div>
    </div>
  );
}

const VIEWS = {
  dashboard: DashboardView,
  pos: PosView,
  products: ProductsView,
  stock: StockView,
  reports: ReportsView,
};

export default function ProductPreview() {
  const [active, setActive] = useState('dashboard');
  const View = VIEWS[active];

  return (
    <section id="showcase" className="bg-gray-50 border-y border-gray-200 py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            MaxPOS qanday ishlashini ko'ring
          </h2>
          <p className="mt-4 text-gray-500 text-lg">
            Savdodan hisobotgacha — barcha jarayonlar bitta interfeysda.
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-8">
          <div className="flex flex-wrap justify-center gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActive(tab.key)}
                className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium transition-colors ${
                  active === tab.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={160} className="mt-8">
          <MockFrame url="pos.maxpos.uz/dashboard">
            <div className="h-[330px] sm:h-[380px] bg-white animate-fade-in" key={active}>
              <View />
            </div>
          </MockFrame>
        </Reveal>
      </div>
    </section>
  );
}
