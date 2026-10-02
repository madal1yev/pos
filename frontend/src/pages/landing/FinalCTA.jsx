import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Reveal from './Reveal';

export default function FinalCTA() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-3xl bg-gray-900 px-6 py-12 sm:px-12 sm:py-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Biznesingizni boshqarishni soddalashtiring.
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              MaxPOS bilan savdo, mahsulotlar, ombor va qarzdorlarni yagona tizimda boshqaring.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Kirish
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-gray-700 text-gray-200 text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Imkoniyatlar
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
