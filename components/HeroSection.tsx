'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, animate, useInView } from 'framer-motion';
import { FaArrowRight, FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa';
import { SITE, STATS } from '@/lib/constants';
import OscilloscopeCanvas from './OscilloscopeCanvas';
import Magnetic from './Magnetic';
import ScrambleText from './ScrambleText';
import RoleSpyglass from './RoleSpyglass';
import GitHubHoverPreview from './GitHubHoverPreview';

const MARQUEE_ITEMS = [
  'STM32',
  'ESP32 / FreeRTOS',
  'CAN Bus',
  'React / Next.js',
  'PyTorch',
  'Kotlin / Android',
  'Docker',
  'Solidity',
  'FastAPI',
  'Firebase',
];

function RotatingTagline() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SITE.taglines.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="relative inline-block h-[1.3em] overflow-hidden align-bottom min-w-[220px] sm:min-w-[360px] text-left">
      <AnimatePresence mode="wait">
        <motion.span
          key={SITE.taglines[index]}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="absolute left-0 top-0 text-trace"
        >
          {SITE.taglines[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true });
  const target = parseFloat(value);
  const decimals = value.includes('.') ? value.split('.')[1].length : 0;

  useEffect(() => {
    if (!inView || !ref.current || Number.isNaN(target)) return;
    const node = ref.current;
    const controls = animate(0, target, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = v.toFixed(decimals);
      },
    });
    return () => controls.stop();
  }, [inView, target, decimals]);

  return <span ref={ref}>{value}</span>;
}

export default function HeroSection() {
  return (
    <section
      id="top"
      className="min-h-screen bg-ink-950 flex flex-col justify-center relative overflow-hidden pt-28 pb-16"
    >
      {/* Live oscilloscope: graticule, sweeping phosphor trace, cursor probe, click trigger */}
      <OscilloscopeCanvas />

      {/* CRT glass: soft vignette so the trace glows toward the center */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 55% 45%, transparent 40%, rgb(var(--color-ink-950) / 0.85) 100%)',
        }}
      />
      <div className="absolute top-1/3 left-[60%] -translate-x-1/2 w-[320px] sm:w-[520px] h-[320px] sm:h-[520px] rounded-full bg-trace/[0.06] blur-[100px] sm:blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 w-full">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-mono text-xs sm:text-sm text-amber mb-4 tracking-wide flex items-center gap-2"
        >
          <span className="text-paper-muted">$</span>
          <ScrambleText text="whoami --verbose" />
        </motion.p>

        {/* Name with Interactive Role Scanner Spyglass */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          <RoleSpyglass />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-mono text-lg sm:text-2xl text-paper mb-6 sm:mb-8"
        >
          Building in <RotatingTagline />
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-paper-muted text-sm sm:text-lg max-w-2xl leading-relaxed mb-8 sm:mb-10"
        >
          {SITE.pitch}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center gap-3 sm:gap-4 mb-12 sm:mb-16"
        >
          <Magnetic>
            <motion.a
              href="#projects"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-amber text-white dark:text-ink-950 font-semibold text-sm rounded-sm hover:shadow-[0_0_30px_rgb(var(--color-amber)/0.35)] transition-shadow"
            >
              View Projects
              <FaArrowRight className="text-xs sm:text-sm transition-transform group-hover:translate-x-1" />
            </motion.a>
          </Magnetic>
          <Magnetic>
            <motion.a
              href="#stories"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 border border-ink-600 bg-ink-900/50 text-paper text-sm rounded-sm hover:border-amber hover:text-amber transition-colors"
            >
              Field Notes
            </motion.a>
          </Magnetic>

          {/* GitHub button with Interactive Green Dots Preview */}
          <GitHubHoverPreview placement="top">
            <motion.a
              href={SITE.github}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-4 py-2.5 sm:py-3 border border-ink-600 bg-ink-900/50 text-paper text-sm rounded-sm hover:border-trace hover:text-trace transition-colors"
              title="GitHub Profile & Activity Preview"
            >
              <FaGithub /> GitHub
            </motion.a>
          </GitHubHoverPreview>

          <motion.a
            href={SITE.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 sm:py-3 border border-ink-600 bg-ink-900/50 text-paper text-sm rounded-sm hover:border-trace hover:text-trace transition-colors"
            title="LinkedIn"
          >
            <FaLinkedin /> LinkedIn
          </motion.a>
          <motion.a
            href={`mailto:${SITE.email}`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 sm:py-3 border border-ink-600 bg-ink-900/50 text-paper text-sm rounded-sm hover:border-amber hover:text-amber transition-colors"
            title="Email Saif"
          >
            <FaEnvelope /> Email
          </motion.a>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 border-t border-ink-600 pt-6 sm:pt-8"
        >
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="font-display font-semibold text-2xl sm:text-4xl text-paper">
                <CountUp value={stat.value} />
                <span className="text-amber">{stat.suffix}</span>
              </div>
              <div className="font-mono text-[10px] sm:text-xs text-paper-muted mt-1 uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Tech marquee */}
      <div className="relative z-10 mt-12 sm:mt-16 overflow-hidden border-t border-ink-600 py-4 sm:py-5">
        <div className="flex w-max marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="font-mono text-xs sm:text-sm text-paper-dim mx-4 sm:mx-6 flex items-center gap-4 sm:gap-6 whitespace-nowrap"
            >
              {item}
              <span className="text-trace/40">/</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
