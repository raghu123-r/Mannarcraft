// Footer redesign: polished 4-column layout, newsletter, and bottom row — safe responsive changes only
"use client";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
} from "react-icons/fa";
import Link from "next/link";

export default function Footer() {
  return (
    <>

      {/* Main Footer Section */}
      <footer className="w-full bg-[#0f1720] text-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
            {/* Column 1 - Brand & Social */}
            <div className="text-left">
              <h2 className="text-sm font-semibold tracking-wider text-gray-200 uppercase mb-3">
               MANNARCRAFT
              </h2>
              <span className="w-8 h-0.5 bg-emerald-400 block mb-4"></span>
              <p className="text-sm text-gray-300 mb-4">
                Your trusted partner for premium mannarcraft solutions.
              </p>
              <div className="flex gap-3 mt-2">
                <a
                  href="https://www.facebook.com/people/Kitchen-kettels/61571967747034/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Kitchen Kettles Facebook"
                  className="p-2 bg-white border border-gray-200 rounded-full hover:bg-emerald-600 hover:text-white transition"
                >
                  <FaFacebookF className="text-base text-[#1a1a1a] hover:text-[#3EB489] transition-colors duration-200" />
                </a>
                <a
                  href="https://www.instagram.com/Mannarcraft/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Mannarcraft Instagram"
                  className="p-2 bg-white border border-gray-200 rounded-full hover:bg-emerald-600 hover:text-white transition"
                >
                  <FaInstagram className="text-base text-[#1a1a1a] hover:text-[#3EB489] transition-colors duration-200" />
                </a>
              </div>
            </div>

            {/* Column 2 - Quick Links */}
            <div className="text-left">
              <h2 className="text-sm font-semibold tracking-wider text-gray-200 uppercase mb-3">
                Quick Links
              </h2>
              <span className="w-8 h-0.5 bg-emerald-400 block mb-4"></span>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>
                  <Link href="/" className="hover:text-emerald-400 transition">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="hover:text-emerald-400 transition">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/brands" className="hover:text-emerald-400 transition">
                    Brands
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-emerald-400 transition">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="hover:text-emerald-400 transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-and-conditions" className="hover:text-emerald-400 transition">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/shipping-policy" className="hover:text-emerald-400 transition">
                    Shipping Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3 - Address */}
            <div className="text-left">
              <h2 className="text-sm font-semibold tracking-wider text-gray-200 uppercase mb-3">
                Office Address
              </h2>
              <span className="w-8 h-0.5 bg-emerald-400 block mb-4"></span>
              <p className="text-sm text-gray-300 mb-2">
                Ground Floor & First Floor, No. 305, Shop No. 9,<br />
                Varthur Main Road, Opp. Shani Mahatma Temple,<br />
                Gunjur, Bengaluru – 560087
              </p>
            </div>

            {/* Column 4 - Connect & Newsletter */}
            <div className="text-left">
              <h2 className="text-sm font-semibold tracking-wider text-gray-200 uppercase mb-3">
                Connect 
              </h2>
              <span className="w-8 h-0.5 bg-emerald-400 block mb-4"></span>
              <div className="text-sm text-gray-300 space-y-2 mb-4">
                <p className="flex items-center gap-2">
                  <FaPhoneAlt className="text-emerald-400" />
                  <a
                    href="tel:+918989889880"
                    className="hover:text-emerald-400 transition break-all"
                  >
                    +91 8989889880
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <FaEnvelope className="text-emerald-400" />
                  <a
                    href="mailto:salesMannarcraft@gmail.com"
                    className="hover:text-emerald-400 transition break-all"
                  >
                    salesmannarcraft@gmail.com
                  </a>
                </p>
              </div>
              {/* Newsletter form removed as requested */}
              <div className="flex gap-2 mt-4 flex-wrap">
                {/* Trusted badges: use existing images if available, else placeholder chips */}
                <span className="px-3 py-1 rounded-full border border-emerald-400 text-xs text-emerald-400 bg-gray-900">
                  Trusted Seller
                </span>
                <span className="px-3 py-1 rounded-full border border-emerald-400 text-xs text-emerald-400 bg-gray-900">
                  Secure Payments
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-xs text-gray-400 flex flex-col sm:flex-row justify-between items-center gap-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3">
            <Link href="/privacy-policy" className="hover:text-emerald-400 transition">
              Privacy Policy
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-emerald-400 transition">
              Terms & Conditions
            </Link>
          </div>
          <div>
            © {new Date().getFullYear()}{" "}
            <span className="font-medium text-gray-200">Kitchen Kettles</span>
          </div>
          <div>
            Designed & Developed by{" "}
            <span className="text-emerald-400 font-medium hover:underline">
              IT Alliance
            </span>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp and Call Buttons */}
      <div className="fixed right-4 bottom-20 z-50 flex flex-col gap-3 sm:right-6">
        {/* WhatsApp */}
        <a
          href="https://wa.me/918989889880"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-110"
          aria-label="Chat on WhatsApp"
        >
          <FaWhatsapp className="text-xl sm:text-2xl" />
        </a>

        {/* Call */}
        <a
          href="tel:+918989889880"
          className="w-12 h-12 bg-sky-500 hover:bg-sky-600 text-white rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-110"
          aria-label="Call Now"
        >
          <FaPhoneAlt className="text-xl sm:text-2xl" />
        </a>
      </div>
    </>
  );
}
