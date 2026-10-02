import Reveal from './Reveal';

const STEPS = [
  {
    n: '01', title: "Hisob yarating",
    desc: "MaxPOS'ga kirish uchun akkaunt ID oling va tizimga kiring.",
  },
  {
    n: '02', title: 'Mahsulotlarni kiriting',
    desc: "Mahsulot, kategoriya va narxlarni qo'shing — barcode avtomatik yaratiladi.",
  },
  {
    n: '03', title: "Savdoni boshlang",
    desc: "Sotuv oynasida mahsulotni skanerlang yoki tanlang, to'lovni qabul qiling.",
  },
  {
    n: '04', title: 'Biznesingizni boshqaring',
    desc: "Hisobotlar, ombor va qarzdorlar orqali biznesingizni kuzating.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="bg-white py-16 md:py-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            Boshlash juda oson
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Birinchi savdonigacha — to'rt qadam.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <div className="relative h-full pt-6 border-t-2 border-gray-200">
                <span className="absolute -top-3.5 left-0 bg-white pr-3 text-xs font-extrabold tracking-widest text-indigo-600">
                  {s.n}
                </span>
                <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
