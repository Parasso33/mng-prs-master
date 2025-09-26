import React from 'react';
import { FaDiscord, FaFacebook, FaInstagram , FaTelegram} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const Footer: React.FC = () => {
  return (
    <footer className="bg-card border-t mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Right: Copyright */}
          <div className="text-muted-foreground text-sm order-2 md:order-1 md:text-left ">
            جميع الحقوق محفوظة لموقع <span className="text-primary font-semibold">MangaParasso</span>
          </div>

          {/* Center: Social Icons */}
          <div className="flex gap-7 justify-center order-1 md:order-2 ">
            {/* Facebook */}
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1877f2] transition transform hover:scale-110 hover:shadow-lg"
            >
              <FaFacebook size={18} className="text-white" />
            </a>

            {/* X */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              aria-label="X"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-black transition transform hover:scale-110 hover:shadow-lg"
            >
              <FaXTwitter size={18} className="text-white" />
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 transition transform hover:scale-110 hover:shadow-lg"
            >
              <FaInstagram size={18} className="text-white" />
            </a>

            {/* Discord */}
            <a
              href="https://discord.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Discord"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[#5865f2] transition transform hover:scale-110 hover:shadow-lg"
            >
              <FaDiscord size={18} className="text-white" />
            </a>
            {/* Telegram */}
            <a
              href="https://telegram.org"
              target="_blank"
              rel="noreferrer"
              aria-label="Telegram"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[#0088cc] transition transform hover:scale-110 hover:shadow-lg"
            >
              <FaTelegram size={18} className="text-white" />
            </a>
          </div>

          {/* Left: Links */}
          <div className="flex flex-wrap gap-2 text-muted-foreground text-sm order-3 md:order-3 md:text-right ">
            <a href="/" className="hover:text-primary transition-colors">MangaParasso</a>
            <span>|</span>
            <a href="/contact" className="hover:text-primary transition-colors">Contact Us</a>
            <span>|</span>
            <a href="/contact" className="hover:text-primary transition-colors">DMCA</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
