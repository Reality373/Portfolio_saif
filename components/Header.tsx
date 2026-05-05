'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-matrix-bg border-b border-matrix-neon/30'
          : 'bg-transparent'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-matrix-neon">
          <span className="text-matrix-cyan">$</span> saif
        </Link>

        {/* Navigation Links */}
        <nav className="flex gap-8">
          <a
            href="#projects"
            className="text-matrix-neon hover:text-matrix-cyan transition-colors"
          >
            projects
          </a>
          <a
            href="#contact"
            className="text-matrix-neon hover:text-matrix-cyan transition-colors"
          >
            contact
          </a>
        </nav>
      </div>
    </motion.header>
  );
}
