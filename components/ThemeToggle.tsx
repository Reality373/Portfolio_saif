'use client';

import { useTheme } from './ThemeProvider';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className={`w-9 h-9 flex items-center justify-center rounded-sm border border-ink-600 bg-ink-900/60 text-paper-muted ${className}`}
      >
        <span className="w-4 h-4" />
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative w-9 h-9 flex items-center justify-center rounded-sm border border-ink-600 bg-ink-900/80 hover:border-amber hover:text-amber text-paper transition-colors duration-200 shadow-sm focus:outline-none focus:ring-1 focus:ring-amber/50 ${className}`}
    >
      <motion.div
        key={isDark ? 'dark' : 'light'}
        initial={{ rotate: -90, scale: 0, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 20 }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          <FaSun className="text-amber text-sm drop-shadow-[0_0_8px_rgba(255,107,53,0.5)]" />
        ) : (
          <FaMoon className="text-trace text-sm drop-shadow-[0_0_8px_rgba(2,132,199,0.4)]" />
        )}
      </motion.div>
    </motion.button>
  );
}
