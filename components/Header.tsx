'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SITE } from '@/lib/constants';
import ThemeToggle from './ThemeToggle';
import GitHubHoverPreview from './GitHubHoverPreview';
import ResumeDropdown from './ResumeDropdown';
import { FaBars, FaTimes, FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa';

const NAV_LINKS = [
  { href: '#skills', label: 'Skills', index: '01' },
  { href: '#stories', label: 'Stories', index: '02' },
  { href: '#demos', label: 'Demos', index: '03' },
  { href: '#projects', label: 'Projects', index: '04' },
  { href: '#contact', label: 'Contact', index: '05' },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || mobileMenuOpen
          ? 'bg-ink-950/95 backdrop-blur-lg border-b border-ink-600 shadow-md py-3'
          : 'bg-ink-950/80 backdrop-blur-md border-b border-ink-600/50 shadow-xs py-4'
      }`}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="font-display font-semibold text-lg tracking-tight text-paper hover:text-amber transition-colors flex items-center gap-1.5 z-20"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span>saifx</span>
          <span className="text-amber">.</span>
          <span>space</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-mono text-paper-muted hover:text-trace transition-colors"
            >
              {link.label}
            </a>
          ))}

          {/* Social icons with GitHub live hover preview */}
          <div className="flex items-center gap-3 pl-2 border-l border-ink-600">
            <GitHubHoverPreview placement="bottom">
              <a
                href={SITE.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Profile & Activity"
                title="GitHub Profile & Live Stats"
                className="text-paper-muted hover:text-amber transition-colors p-1 flex items-center"
              >
                <FaGithub size={15} />
              </a>
            </GitHubHoverPreview>

            <a
              href={SITE.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              title="LinkedIn"
              className="text-paper-muted hover:text-trace transition-colors p-1 flex items-center"
            >
              <FaLinkedin size={15} />
            </a>
            <a
              href={`mailto:${SITE.email}`}
              aria-label="Email"
              title="Email Saif"
              className="text-paper-muted hover:text-amber transition-colors p-1 flex items-center"
            >
              <FaEnvelope size={14} />
            </a>
          </div>

          {/* Tailored Resumes Dropdown */}
          <ResumeDropdown />

          <ThemeToggle />
        </nav>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-2.5 z-20">
          <a
            href={SITE.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-paper-muted hover:text-amber p-1.5"
          >
            <FaGithub size={16} />
          </a>
          <a
            href={SITE.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-paper-muted hover:text-trace p-1.5"
          >
            <FaLinkedin size={16} />
          </a>
          <a
            href={`mailto:${SITE.email}`}
            aria-label="Email"
            className="text-paper-muted hover:text-amber p-1.5"
          >
            <FaEnvelope size={15} />
          </a>

          <ThemeToggle />

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-sm border border-ink-600 bg-ink-900/80 text-paper hover:text-amber transition-colors ml-1"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <FaTimes size={14} /> : <FaBars size={14} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden border-b border-ink-600 bg-ink-950/98 backdrop-blur-xl overflow-hidden px-6 pb-6 pt-2"
          >
            <div className="flex flex-col space-y-3 pt-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-mono text-sm py-2.5 px-3 rounded-sm border border-ink-600/40 bg-ink-900/50 text-paper hover:text-amber hover:border-amber/50 flex items-center justify-between transition-colors"
                >
                  <span>{link.label}</span>
                  <span className="text-[11px] text-paper-dim">{link.index}</span>
                </a>
              ))}

              <div className="pt-2 flex flex-col gap-3">
                {/* Mobile Tailored Resume Selector */}
                <ResumeDropdown mobile />

                <div className="flex justify-center gap-6 pt-3 border-t border-ink-600/40">
                  <a
                    href={SITE.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="text-paper-muted hover:text-amber transition-colors p-2 flex items-center gap-1.5 font-mono text-xs"
                  >
                    <FaGithub size={16} /> GitHub
                  </a>
                  <a
                    href={SITE.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="text-paper-muted hover:text-trace transition-colors p-2 flex items-center gap-1.5 font-mono text-xs"
                  >
                    <FaLinkedin size={16} /> LinkedIn
                  </a>
                  <a
                    href={`mailto:${SITE.email}`}
                    aria-label="Email"
                    className="text-paper-muted hover:text-amber transition-colors p-2 flex items-center gap-1.5 font-mono text-xs"
                  >
                    <FaEnvelope size={16} /> Email
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
