'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SITE } from '@/lib/constants';

const NAV_LINKS = [
  { href: '#skills', label: 'Skills' },
  { href: '#projects', label: 'Projects' },
  { href: '#contact', label: 'Contact' },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        isScrolled
          ? 'bg-ink-950/85 backdrop-blur-md border-b border-ink-600'
          : 'bg-transparent border-b border-transparent'
      }`}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="font-display font-semibold text-lg tracking-tight text-paper hover:text-amber transition-colors"
        >
          saif<span className="text-amber">.</span>dev
        </Link>

        <nav className="hidden sm:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-mono text-paper-muted hover:text-trace transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href={SITE.resumePath}
            download
            className="text-sm font-mono px-4 py-1.5 border border-ink-600 text-paper hover:border-amber hover:text-amber transition-colors rounded-sm"
          >
            Resume
          </a>
        </nav>

        <a
          href={SITE.resumePath}
          download
          className="sm:hidden text-xs font-mono px-3 py-1.5 border border-ink-600 text-paper rounded-sm"
        >
          Resume
        </a>
      </div>
    </motion.header>
  );
}
