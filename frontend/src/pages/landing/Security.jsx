import { ShieldCheck, KeyRound, DatabaseBackup, ClipboardCheck, Code2, Building2 } from 'lucide-react';
import Reveal from './Reveal';

const ITEMS = [
  { icon: KeyRound, title: 'Token asosidagi kirish', desc: 'Tizimga kirish JWT token orqali amalga oshiriladi, chiqishda token bekor qilinadi.' },
  { icon: ShieldCheck, title: 'Rollarga asoslangan huquqlar', desc: 'Admin, menejer, omborchi, kassir va ko\'ruvchi rollari — har kim o\'ziga tegishli bo\'limni ko\'radi.' },
  { icon: Building2, title: 'Do\'konlar ajratilgan', desc: 'Har bir do\'konning mahsulot, savdo va sozlamalari boshqa do\'konga ko\'rinmaydi.' },
  { icon: DatabaseBackup, title: 'Zaxira nusxalash', desc: 'Ma\'lumotlarni zaxira fayl sifatida saqlash va qayta tiklash imkoniyati mavjud.' },
  { icon: ClipboardCheck, title: 'Audit jurnali', desc: 'Amallar va tizimga kirish tarixi yozib boriladi.' },
  { icon: Code2, title: 'API asosidagi arxitektura', desc: 'Tizim ochiq API orqali qurilgan — boshqa tizimlar bilan integratsiya qilish oson.' },
];

export default function Security() {
  return (
    <section id="security" className="bg-gray-900 py-16 md:py-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Ma'lumotlaringiz — biznesingizning eng muhim qismi.
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            MaxPOS ma'lumotlaringizni himoya qilish va nazorat usullarini o'z ichiga oladi.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((it, i) => (
            <Reveal key={it.title} delay={i * 60}>
              <div className="h-full rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
                <span className="w-11 h-11 rounded-xl bg-gray-800 flex items-center justify-center">
                  <it.icon className="w-5 h-5 text-indigo-400" />
                </span>
                <h3 className="mt-5 text-base font-bold text-white">{it.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{it.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
