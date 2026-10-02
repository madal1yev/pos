import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Reveal from './Reveal';

const FAQS = [
  {
    q: 'MaxPOS nima?',
    a: "MaxPOS — bu savdo, ombor, mahsulotlar, qarzdorlar va hisobotlarni boshqarish uchun zamonaviy POS (Point of Sale) tizimi.",
  },
  {
    q: 'MaxPOS kimlar uchun?',
    a: "Minimarket, kafe, restoran, kiyim do'koni, elektronika, dorixona kabi savdo nuqtalari va kichik hamda o'rta biznes uchun.",
  },
  {
    q: "MaxPOS'dan foydalanish uchun qanday qurilma kerak?",
    a: "Brauzer ishlaydigan kompyuter, planshet yoki smartfon kifoya. Chek chop etish uchun printer ixtiyoriy, barcode skanerlash uchun qurilma kamerasi yetarli.",
  },
  {
    q: "MaxPOS barcode bilan ishlaydimi?",
    a: "Ha. Mahsulotga avtomatik barcode kod yaratiladi, qurilma kamerasi yoki skaner orqali tezkor qidirish qo'llab-quvvatlanadi.",
  },
  {
    q: "Telegram orqali buyurtma qabul qiladimi?",
    a: "Hozircha MaxPOS tarkibida Telegram integratsiyasi mavjud emas. Tizim do'kon ichidagi savdo va buyurtmalarni boshqarishga yo'naltirilgan.",
  },
  {
    q: "MaxPOS'da omborni boshqarish mumkinmi?",
    a: "Ha. Kirim va chiqimlar, qoldiq nazorati hamda kam qoldiq ogohlantirishlari mavjud.",
  },
  {
    q: 'Demo olish mumkinmi?',
    a: "Ha. «Kirish» tugmasi orqali tizimga kiring va MaxPOS'ni sinab ko'ring.",
  },
  {
    q: 'Texnik yordam mavjudmi?',
    a: "Savol va muammolar uchun tizim administratori (admin akkaunti) orqali yuzlanishingiz mumkin.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="bg-gray-50 border-t border-gray-200 py-16 md:py-24 scroll-mt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            Ko'p beriladigan savollar
          </h2>
        </Reveal>

        <div className="mt-10 space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 40}>
                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-sm sm:text-base font-semibold text-gray-900">{item.q}</span>
                    <ChevronDown
                      className={`w-[18px] h-[18px] shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 -mt-1 animate-fade-in">
                      <p className="text-sm leading-relaxed text-gray-500">{item.a}</p>
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
