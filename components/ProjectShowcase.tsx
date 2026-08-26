'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GalleryItem, GalleryVariant } from '@/types';

function CalcScreenArt() {
  const rows = [
    { name: 'OLT — Tx Power', value: '+3.0 dB' },
    { name: 'Splitter 1:32', value: '-17.5 dB' },
    { name: 'Fiber run · 4.2km', value: '-1.7 dB' },
    { name: 'Splice ×2', value: '-0.4 dB' },
  ];
  return (
    <div className="w-full h-full flex flex-col bg-ink-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] text-paper-dim">POWER BUDGET</span>
        <span className="w-2 h-2 rounded-full bg-trace animate-pulse" />
      </div>
      <div className="text-center py-3 mb-3 border-y border-ink-600">
        <div className="font-display font-semibold text-3xl text-amber">-24.6</div>
        <div className="font-mono text-[10px] text-paper-dim mt-0.5">dB · within budget</div>
      </div>
      <div className="space-y-2 flex-1">
        {rows.map((r) => (
          <div key={r.name} className="flex justify-between items-center">
            <span className="font-mono text-[10px] text-paper-muted">{r.name}</span>
            <span className="font-mono text-[10px] text-trace font-medium">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 h-8 rounded-sm bg-amber flex items-center justify-center shadow-sm">
        <span className="font-mono text-[10px] text-white font-semibold tracking-wider">
          RUN OTDR TRACE
        </span>
      </div>
    </div>
  );
}

function MapScreenArt() {
  return (
    <div className="w-full h-full relative bg-ink-900 overflow-hidden">
      <div className="absolute inset-0 opacity-40 bg-grid-pattern bg-grid" />
      <svg viewBox="0 0 200 260" className="absolute inset-0 w-full h-full">
        <path
          d="M20,230 C60,190 40,140 90,120 S150,80 180,30"
          fill="none"
          stroke="rgb(var(--color-amber))"
          strokeWidth="3"
          strokeDasharray="1 10"
          strokeLinecap="round"
        />
        <circle cx="20" cy="230" r="5" fill="rgb(var(--color-trace))" />
        <circle cx="90" cy="120" r="5" fill="rgb(var(--color-trace))" />
        <circle cx="150" cy="80" r="5" fill="rgb(var(--color-trace))" />
        <circle cx="180" cy="30" r="6" fill="rgb(var(--color-amber))" />
      </svg>
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
        <span className="font-mono text-[10px] text-paper-dim bg-ink-950/80 px-2 py-1 rounded-sm border border-ink-600">
          NETWORK DESIGNER
        </span>
      </div>
      <div className="absolute bottom-3 left-3 right-3 bg-ink-950/90 rounded-sm p-2 flex justify-between border border-ink-600 shadow-sm">
        <span className="font-mono text-[10px] text-paper-muted">4 nodes · 6.1km</span>
        <span className="font-mono text-[10px] text-trace font-medium">live route</span>
      </div>
    </div>
  );
}

function ArchitectureArt() {
  const box = 'stroke-ink-600 fill-ink-800';
  return (
    <div className="w-full h-full bg-ink-900 p-4">
      <span className="font-mono text-[10px] text-paper-dim block mb-2">SYSTEM ARCHITECTURE</span>
      <svg viewBox="0 0 260 220" className="w-full h-[calc(100%-16px)]">
        <rect x="90" y="8" width="80" height="30" rx="4" className={box} strokeWidth="1.5" />
        <text x="130" y="27" textAnchor="middle" className="fill-paper font-semibold" fontSize="9" fontFamily="monospace">
          Android App
        </text>

        <rect x="10" y="90" width="76" height="30" rx="4" className={box} strokeWidth="1.5" />
        <text x="48" y="109" textAnchor="middle" className="fill-trace" fontSize="8" fontFamily="monospace">
          Firebase Auth
        </text>

        <rect x="92" y="90" width="76" height="30" rx="4" className={box} strokeWidth="1.5" />
        <text x="130" y="109" textAnchor="middle" className="fill-trace" fontSize="8" fontFamily="monospace">
          Firestore
        </text>

        <rect x="174" y="90" width="76" height="30" rx="4" className={box} strokeWidth="1.5" />
        <text x="212" y="109" textAnchor="middle" className="fill-trace" fontSize="8" fontFamily="monospace">
          Cloud Functions
        </text>

        <rect x="10" y="170" width="115" height="30" rx="4" className={box} strokeWidth="1.5" />
        <text x="67" y="189" textAnchor="middle" className="fill-amber font-medium" fontSize="8" fontFamily="monospace">
          OSM / Maps SDK
        </text>

        <rect x="135" y="170" width="115" height="30" rx="4" className={box} strokeWidth="1.5" />
        <text x="192" y="189" textAnchor="middle" className="fill-amber font-medium" fontSize="8" fontFamily="monospace">
          Play Billing
        </text>

        <g className="stroke-ink-500" strokeWidth="1.5" fill="none">
          <path d="M110,38 L48,90" />
          <path d="M130,38 L130,90" />
          <path d="M150,38 L212,90" />
          <path d="M48,120 L67,170" />
          <path d="M212,120 L192,170" />
        </g>
      </svg>
    </div>
  );
}

const ART: Record<GalleryVariant, () => JSX.Element> = {
  'calc-screen': CalcScreenArt,
  'map-screen': MapScreenArt,
  architecture: ArchitectureArt,
};

interface ProjectShowcaseProps {
  items: GalleryItem[];
}

const HOME = [
  { x: 0, y: 0, rotate: 0, scale: 1 },
  { x: -26, y: 14, rotate: -7, scale: 0.88 },
  { x: 26, y: 14, rotate: 7, scale: 0.88 },
];
const FRONT = { x: 0, y: 0, rotate: 0, scale: 1 };

export default function ProjectShowcase({ items }: ProjectShowcaseProps) {
  const [active, setActive] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    if (fraction < 0.33) setActive(1);
    else if (fraction > 0.67) setActive(2);
    else setActive(0);
  };

  const handleTap = () => {
    setActive((prev) => (prev + 1) % items.length);
  };

  return (
    <div
      className="relative w-full max-w-[280px] mx-auto aspect-[3/4] overflow-hidden rounded-xl border border-ink-600 shadow-xl cursor-pointer select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setActive(0)}
      onClick={handleTap}
      title="Hover or Tap to cycle preview"
    >
      {items.map((item, index) => {
        const isActive = active === index;
        const style = isActive ? { ...FRONT, zIndex: 30 } : { ...HOME[index], zIndex: 10 + index };
        const Art = ART[item.variant];
        return (
          <motion.div
            key={item.label}
            className="absolute inset-0 overflow-hidden bg-ink-800"
            animate={style}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            {item.imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageSrc}
                alt={item.label}
                className="w-full h-full object-cover"
              />
            ) : (
              <Art />
            )}
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-ink-950 to-transparent flex items-center justify-between">
              <span className="font-mono text-[10px] text-paper-muted">{item.label}</span>
              <span className="font-mono text-[8px] text-paper-dim sm:hidden">tap to flip</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
