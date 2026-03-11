import { Metadata } from 'next';
import Image from "next/image";

import aboutBanner from "../../assets/images/about.png";
import kitchenProducts from "../../assets/images/kitchen.png";
import missionVisionBg from "../../assets/images/mission.png";
import whyChooseUs from "../../assets/images/whychoose.png";

export const metadata: Metadata = {
  title: "About Us - Mannar Craft",
  description:
    "Learn about Mannar Craft, your trusted source for authentic Kerala traditional crafts and handmade products.",
};

export default function AboutPage() {
  return (
    <div className="bg-white">

      {/* ---- HERO SECTION ---- */}
      <section className="relative w-full h-[200px] md:h-[300px] lg:h-[450px] overflow-hidden">
        <Image
          src={aboutBanner}
          alt="About Banner"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <h1 className="text-white text-5xl md:text-6xl font-bold px-8 md:px-16 drop-shadow-lg">
            About Us
          </h1>
        </div>
      </section>

      {/* ---- SECTION 2 ---- */}
      <section className="py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <ul className="space-y-6 text-lg text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 text-2xl">➤</span>
                Authentic handcrafted Kerala traditional items made by skilled local artisans.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 text-2xl">➤</span>
                Premium quality Aranmula Kannadi, uruli, nilavilakku, and more — straight from the craftsmen.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 text-2xl">➤</span>
                Custom craft orders tailored to your specific needs and preferences.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 text-2xl">➤</span>
                Carefully packed and delivered across India within 7 days.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 text-2xl">➤</span>
                Perfect for gifting, home décor, religious ceremonies, and cultural collections.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl overflow-hidden border-[4px] border-emerald-500 shadow-lg">
            <Image
              src={kitchenProducts}
              alt="Mannar Craft products"
              width={900}
              height={600}
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ---- MISSION / VISION ---- */}
      <section className="relative py-20">
        <div className="absolute inset-0">
          <Image
            src={missionVisionBg}
            alt="Mission Vision Background"
            fill
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative container mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-10 bg-white/10 backdrop-blur-md p-10 rounded-2xl">
            <div>
              <h2 className="text-3xl font-bold text-emerald-600 mb-4">Our Mission</h2>
              <p className="text-white text-lg leading-relaxed">
                At Mannar Craft, we are dedicated to preserving the rich heritage of Kerala&apos;s
                traditional craftsmanship. What began as a passion for authentic handmade art
                has grown into a mission — to connect skilled local artisans with customers
                across India, ensuring every piece carries the soul of its maker and the pride
                of Kerala&apos;s culture.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-emerald-600 mb-4">Our Vision</h2>
              <p className="text-white text-lg leading-relaxed">
                To become India&apos;s most trusted platform for authentic Kerala traditional crafts —
                celebrating artisan heritage, empowering local craftsmen, and bringing the timeless
                beauty of handcrafted products like Aranmula Kannadi, uruli, and nilavilakku into
                every home across the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- WHY CHOOSE US ---- */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="rounded-xl overflow-hidden shadow-lg border border-slate-200">
            <Image
              src={whyChooseUs}
              alt="Why Choose Us"
              width={900}
              height={700}
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">
              Why Choose Us
            </h2>
            <ul className="space-y-6 text-lg text-slate-700">
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 text-2xl">✓</span>
                <p><strong>100% Authentic Crafts:</strong> Every product is genuinely handcrafted by Kerala&apos;s traditional artisans — no mass-produced replicas.</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 text-2xl">✓</span>
                <p><strong>Custom Orders:</strong> We accept personalised craft orders tailored to your exact specifications and occasions.</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 text-2xl">✓</span>
                <p><strong>Safe & Careful Packing:</strong> Each item is packed with exceptional care to ensure it reaches you in perfect condition.</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 text-2xl">✓</span>
                <p><strong>Fast Pan-India Delivery:</strong> Orders delivered across India within 7 days with full tracking support.</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 text-2xl">✓</span>
                <p><strong>Friendly Customer Support:</strong> Our team is always ready to help — from product queries to after-delivery assistance.</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

    </div>
  );
}