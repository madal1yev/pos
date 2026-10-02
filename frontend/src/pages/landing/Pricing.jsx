import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import Reveal from './Reveal';

const INCLUDED = [
  'Sotuv va chek chop etish',
  'Mahsulot va kategoriyalar',
  'Ombor va qoldiq nazorati',
  'Qarzdorlar bazasi',
  'Kunlik va oylik hisobotlar',
  'Smenalar va Z-hisobot',
  'Bir nechta foydalanuvchi rollari',
  "O'zbek, rus va ingliz tillari",
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-white py-16 md:py-24 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            Biznesingiz uchun mos yechim.
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Barcha asosiy funksiyalar bitta tizimda. MaxPOS'ni bepul sinab ko'ring —
            narxlar biznesingiz hajmiga qarab belgilanadi.
          </p>
        </Reveal>

        <Reveal delay={120} className="mt-10">
          <div className="rounded-3xl border border-gray-200 bg-gray-50 overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 sm:p-10">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-sm font-extrabold text-white">
                    M
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900">MaxPOS</h3>
                    <p className="text-xs font-semibold text-emerald-600">Bepul demo mavjud</p>
                  </div>
                </div>

                <ul className="mt-7 space-y-3">
                  {INCLUDED.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-8 sm:p-10 bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col justify-center">
                <p className="text-sm font-semibold text-gray-500">Boshlash</p>
                <p className="mt-2 text-2xl font-extrabold text-gray-900">
                  Tizimni hozir sinab ko'ring
                </p>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">
                  Akkaunt ID orqali kiring va MaxPOS'ning to'liq imkoniyatlarini o'zingiz ko'ring.
                  Tariflar bo'yicha narxlar demo orqali taqdim etiladi.
                </p>
                <Link
                  to="/login"
                  className="mt-6 inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  Kirish
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
