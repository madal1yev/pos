import { ShoppingCart, Warehouse, Package, Users, BarChart3, QrCode, Clock, Languages } from 'lucide-react';
import Reveal from './Reveal';

const FEATURES = [
  {
    icon: ShoppingCart, title: 'Savdo boshqaruvi',
    desc: "Tez checkout, qoldirilgan savdolar, qaytarish va chekni chop etish.",
  },
  {
    icon: Warehouse, title: 'Ombor boshqaruvi',
    desc: "Kirim va chiqim, qoldiq nazorati, kam qoldiq haqida ogohlantirish.",
  },
  {
    icon: Package, title: 'Mahsulotlar',
    desc: "Kategoriyalar, narxlar, o'lchov birliklari va mahsulot holatlari.",
  },
  {
    icon: Users, title: 'Qarzdorlar',
    desc: "Mijozlar qarzi, qisman to'lovlar va qarz holatini kuzatish.",
  },
  {
    icon: BarChart3, title: 'Hisobotlar',
    desc: "Kunlik va oylik hisobot, top mahsulotlar, foyda va zarar tahlili.",
  },
  {
    icon: QrCode, title: 'Barcode / QR',
    desc: "Kameradan skanerlash, tezkor qidiruv va avtomatik kod yaratish.",
  },
  {
    icon: Clock, title: 'Smenalar',
    desc: "Smena ochish va yopish, Z-hisobot, kassir bo'yicha nazorat.",
  },
  {
    icon: Languages, title: "Ko'p tilli interfeys",
    desc: "O'zbek, rus va ingliz tillari — bitta tizimda almashish.",
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-white py-16 md:py-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            Biznesingizga kerak bo'lgan barcha vositalar — bitta tizimda.
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Savdo, ombor, mijozlar va hisobotlar uchun alohida dastur kerak emas — hammasi MaxPOS'da.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <div className="h-full rounded-2xl border border-gray-200 bg-white p-6 hover:border-gray-300 hover:-translate-y-0.5 transition-all">
                <span className="w-11 h-11 rounded-xl bg-gray-900 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-white" />
                </span>
                <h3 className="mt-5 text-base font-bold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
