'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

const NODES = [
  { id: 'top', label: 'Boot', addr: '0x00' },
  { id: 'skills', label: 'Stack', addr: '0x01' },
  { id: 'stories', label: 'Stories', addr: '0x02' },
  { id: 'demos', label: 'Demos', addr: '0x03' },
  { id: 'projects', label: 'Projects', addr: '0x04' },
  { id: 'contact', label: 'Contact', addr: '0x05' },
];

/**
 * Scroll progress drawn as a PCB trace on the right edge: copper fills as you
 * scroll, each section is a via that lights up when active and is clickable.
 */
export default function SignalBus() {
  const { scrollYProgress } = useScroll();
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });
  const [active, setActive] = useState('top');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    for (const node of NODES) {
      const el = document.getElementById(node.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const activeIndex = NODES.findIndex((n) => n.id === active);

  return (
    <nav
      aria-label="Section progress"
      className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-end"
    >
      <div className="relative flex flex-col gap-9 py-1">
        {/* Bare copper track + lit signal */}
        <div className="absolute right-[5px] top-2 bottom-2 w-px bg-ink-600" />
        <motion.div
          className="absolute right-[5px] top-2 bottom-2 w-px bg-amber origin-top shadow-[0_0_8px_rgb(var(--color-amber)/0.8)]"
          style={{ scaleY: fill }}
        />

        {NODES.map((node, i) => {
          const isActive = i === activeIndex;
          const passed = i < activeIndex;
          return (
            <a
              key={node.id}
              href={`#${node.id}`}
              className="group relative flex items-center gap-3 justify-end"
              aria-current={isActive ? 'true' : undefined}
            >
              <span
                className={`font-mono text-[10px] tracking-wider uppercase transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? 'opacity-100 text-amber translate-x-0'
                    : 'opacity-0 group-hover:opacity-100 text-paper-muted translate-x-1 group-hover:translate-x-0'
                }`}
              >
                <span className="text-paper-dim mr-1.5">{node.addr}</span>
                {node.label}
              </span>
              <span
                className={`relative w-[11px] h-[11px] rounded-full border transition-all duration-300 ${
                  isActive
                    ? 'border-amber bg-amber shadow-[0_0_12px_rgb(var(--color-amber)/0.9)] scale-110'
                    : passed
                      ? 'border-amber bg-ink-950'
                      : 'border-ink-500 bg-ink-950 group-hover:border-trace'
                }`}
              >
                <span className="absolute inset-[3px] rounded-full bg-ink-950/80" />
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
