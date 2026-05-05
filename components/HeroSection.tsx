'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import { FaChevronDown } from 'react-icons/fa';

export default function HeroSection() {
  const [displayedText, setDisplayedText] = useState('');
  const fullText = '$ whoami';
  const [cursorVisible, setCursorVisible] = useState(true);

  // Typing effect
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayedText(fullText.slice(0, index));
        index++;
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  // Blinking cursor
  useEffect(() => {
    const timer = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="min-h-screen bg-matrix-bg flex flex-col justify-center items-center relative overflow-hidden pt-20">
      {/* Animated background: subtle code rain */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-matrix-neon text-sm font-mono"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-20px',
            }}
            animate={{
              y: typeof window !== 'undefined' ? window.innerHeight + 40 : 1000,
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              ease: 'linear',
              repeat: Infinity,
            }}
          >
            {Math.random() > 0.5 ? '1' : '0'}
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 text-center max-w-4xl px-4"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        {/* Typing prompt */}
        <h1 className="text-5xl md:text-7xl font-bold font-mono mb-8">
          <span className="text-matrix-cyan">$</span>{' '}
          <span className="text-matrix-neon">{displayedText}</span>
          {cursorVisible && <span className="text-matrix-neon">_</span>}
        </h1>

        {/* Description that appears after typing */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: displayedText === fullText ? 1 : 0 }}
          transition={{ delay: 3, duration: 0.6 }}
          className="space-y-4"
        >
          <p className="text-lg md:text-xl text-matrix-neon opacity-80">
            Full-Stack Developer | Hardware Engineer | Security Enthusiast
          </p>
          <p className="text-matrix-secondary font-mono text-sm md:text-base">
            Building autonomous systems, AI platforms, and professional mobile
            apps
          </p>

          {/* CTA Button */}
          <motion.a
            href="#projects"
            className="inline-block mt-8 px-8 py-3 border-2 border-matrix-neon text-matrix-neon font-mono hover:bg-matrix-neon hover:text-matrix-bg transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            enter the portfolio →
          </motion.a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <FaChevronDown className="text-matrix-neon text-2xl" />
      </motion.div>
    </section>
  );
}
