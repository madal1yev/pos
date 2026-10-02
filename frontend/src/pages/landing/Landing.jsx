import Navbar from './Navbar';
import Hero from './Hero';
import Capabilities from './Capabilities';
import Features from './Features';
import ProductPreview from './ProductPreview';
import HowItWorks from './HowItWorks';
import Industries from './Industries';
import Benefits from './Benefits';
import Security from './Security';
import Pricing from './Pricing';
import FAQ from './FAQ';
import FinalCTA from './FinalCTA';
import Footer from './Footer';

// MaxPOS marketing landing — faqat tizimga KIRMAGAN mehmonlarga ko'rinadi.
// POS ilovasi / dan alohida, ochiq (public) sahifa.
export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <Navbar />
      <main>
        <Hero />
        <Capabilities />
        <Features />
        <ProductPreview />
        <HowItWorks />
        <Industries />
        <Benefits />
        <Security />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
