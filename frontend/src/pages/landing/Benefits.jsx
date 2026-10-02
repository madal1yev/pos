import { Check } from 'lucide-react';
import Reveal from './Reveal';

const BENEFITS = [
  { title: 'Tezroq savdo', desc: "Sotuv oynasi qisqaradi — mijoz kutmaydi, navbat tez harakatlanadi." },
  { title: 'Kamroq qo\'lda ish', desc: "Mahsulot va narxlar avtomatik hisoblanadi, qo\'lda yozish kamayadi." },
  { title: 'Ombor ustidan nazorat', desc: "Qaysi mahsulot qachon tugaganini oldindan bilasiz." },
  { title: 'Real-vaqt ma\'lumot', desc: "Savdo va qoldiq ma\'lumotlari darhol yangilanadi." },
  { title: 'Markazlashtirilgan boshqaruv', desc: "Barcha do\'kon va akkaunt ma\'lumotlari bir tizimda." },
  { title: 'Ma\'lumotga asoslangan qaror', desc: "Hisobotlar orqali qaysi mahsulot daromad keltirayotganini ko\'rasiz." },
];

export default function Benefits() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            MaxPOS bilan biznesingizni boshqarish osonroq.
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-lg">
            Kunlik operatsiyalarni soddalashtirib, vaqtingizni mijoz va savdoga ajrating.
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={i * 60}>
              <div className="h-full rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <span className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-600" />
                </span>
                <h3 className="mt-3 text-sm font-bold text-gray-900">{b.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
