'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SITE } from '@/lib/constants';

const ROLES = [
  'Robotics Software Engineer',
  'Automotive Cybersecurity Engineer',
  'Embedded Firmware Engineer',
  'Robotics Controls & Actuation',
  'Autonomous Systems Engineer',
  'BMS Firmware & Telematics',
  'Embedded Security Analyst',
  'Android Software Engineer',
  'Edge AI & Vision Engineer',
];

const LENS_RADIUS = 90; // 90px radius (180px diameter aperture)

export default function RoleSpyglass() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [roleIndex, setRoleIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [lensPos, setLensPos] = useState({ x: -300, y: -300 });

  const currentRole = ROLES[roleIndex];

  const updateLensCoordinates = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setLensPos({ x, y });
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(true);
    updateLensCoordinates(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Keep the active title firmly locked while moving inside the region of interest
    updateLensCoordinates(e.clientX, e.clientY);
  };

  const handleMouseLeave = () => {
    // Spyglass effect ends: switch to the next title for the next pass
    setIsHovered(false);
    setRoleIndex((prev) => (prev + 1) % ROLES.length);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      setIsHovered(true);
      updateLensCoordinates(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      setIsHovered(true);
      updateLensCoordinates(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    // Touch ends: switch to the next title for the next touch
    setIsHovered(false);
    setRoleIndex((prev) => (prev + 1) % ROLES.length);
  };

  return (
    <div className="relative inline-block w-full max-w-4xl select-none">
      {/* Interactive Name Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative cursor-crosshair py-2 inline-block w-full overflow-visible min-h-[70px] sm:min-h-[90px] flex items-center"
      >
        {/* Layer 1: Base Name 'Saif Shikalgar' (Masked OUT inside the lens circle when hovering) */}
        <h1
          className="font-display font-semibold text-4xl sm:text-6xl md:text-7xl leading-none tracking-tight text-paper transition-colors duration-200"
          style={{
            maskImage: isHovered
              ? `radial-gradient(circle ${LENS_RADIUS}px at ${lensPos.x}px ${lensPos.y}px, transparent 99%, black 100%)`
              : 'none',
            WebkitMaskImage: isHovered
              ? `radial-gradient(circle ${LENS_RADIUS}px at ${lensPos.x}px ${lensPos.y}px, transparent 99%, black 100%)`
              : 'none',
          }}
        >
          {SITE.name}
        </h1>

        {/* Layer 2: Role Title (Locked while hovering; Revealed ONLY inside the circular spyglass aperture) */}
        <div
          className="absolute inset-y-0 left-0 font-display font-semibold text-2xl sm:text-4xl md:text-5xl leading-none tracking-tight text-amber pointer-events-none transition-opacity duration-150 whitespace-nowrap flex items-center"
          style={{
            opacity: isHovered ? 1 : 0,
            clipPath: isHovered
              ? `circle(${LENS_RADIUS}px at ${lensPos.x}px ${lensPos.y}px)`
              : 'circle(0px at 0px 0px)',
            WebkitClipPath: isHovered
              ? `circle(${LENS_RADIUS}px at ${lensPos.x}px ${lensPos.y}px)`
              : 'circle(0px at 0px 0px)',
          }}
        >
          {currentRole}
        </div>

        {/* Layer 3: Physical Spyglass Lens Overlay centered directly at cursor */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, x: '-50%', y: '-50%' }}
              animate={{ scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
              exit={{ scale: 0.5, opacity: 0, x: '-50%', y: '-50%' }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="absolute pointer-events-none z-30"
              style={{
                left: `${lensPos.x}px`,
                top: `${lensPos.y}px`,
                width: `${LENS_RADIUS * 2}px`,
                height: `${LENS_RADIUS * 2}px`,
              }}
            >
              {/* Glass Lens Rim with Amber Glow */}
              <div className="w-full h-full rounded-full border-2 border-amber shadow-[0_0_25px_rgba(255,107,53,0.5),inset_0_0_20px_rgba(255,107,53,0.2)] bg-amber/5 relative flex items-center justify-center">
                {/* Crosshairs meeting exactly at cursor center */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-amber/50" />
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-amber/50" />

                {/* Inner reticle ticks */}
                <div className="w-14 h-14 rounded-full border border-dashed border-amber/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber shadow-[0_0_8px_#FF6B35]" />

                {/* Scope Tag */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-ink-950/90 border border-amber/70 text-amber text-[8px] sm:text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm whitespace-nowrap shadow-md">
                  ROLE SCOPE
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle Hint */}
      <div className="flex items-center gap-2 mt-1">
        <span className="font-mono text-[11px] sm:text-xs text-paper-dim flex items-center gap-1.5">
          <span className="text-amber">🔍</span>
          <span className="hidden sm:inline">Move spyglass over name to peer underneath · Exit region to reveal the next role</span>
          <span className="sm:hidden">Drag finger over name to inspect roles</span>
        </span>
      </div>
    </div>
  );
}
