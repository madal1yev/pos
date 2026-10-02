import { Store, UtensilsCrossed, Shirt, Smartphone, Pill, Briefcase } from 'lucide-react';
import Reveal from './Reveal';

const INDUSTRIES = [
  { icon: Store, title: 'Minimarket va do\'konlar', desc: "Oziq-ovqat va kundalik iste'mol mahsulotlari savdosi." },
  { icon: UtensilsCrossed, title: 'Kafe va restoranlar', desc: "Buyurtmalar, tayyorlov va hisob-kitob bir joyda." },
  { icon: Shirt, title: "Kiyim do'konlari", desc: "O'lcham va rang variantlari, mavsumiy savdolar." },
  { icon: Smartphone, title: 'Elektronika', desc: "Seriya raqam, kafolat va qimmat mahsulotlar nazorati." },
  { icon: Pill, title: 'Dorixonalar', desc: "Qoldiq muddati va dorilar hisobini yuritish." },
  { icon: Briefcase, title: 'Kichik va o\'rta biznes', desc: "Bir yoki bir nechta nuqta uchun yengil tizim." },
];

export default function Industries() {
  return (
    <section className="bg-gray-50 border-y border-gray-200 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            MaxPOS kimlar uchun?
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Turli soha uchun moslashuvchan tizim — sozlamalar orqali o'zgartirasiz.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((it, i) => (
            <Reveal key={it.title} delay={i * 60}>
              <div className="h-full flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 hover:-translate-y-0.5 transition-all">
                <span className="w-11 h-11 shrink-0 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <it.icon className="w-5 h-5 text-indigo-600" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{it.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{it.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
