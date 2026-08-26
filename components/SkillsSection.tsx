'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaMicrochip,
  FaShieldAlt,
  FaRobot,
  FaMobileAlt,
  FaBrain,
  FaLaptopCode,
} from 'react-icons/fa';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { SKILLS, SkillCategory } from '@/lib/constants';
import ScrambleText from './ScrambleText';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Embedded Firmware & Hardware': FaMicrochip,
  'Automotive & Embedded Security': FaShieldAlt,
  'Robotics, Autonomous & Controls': FaRobot,
  'Android & Mobile Engineering': FaMobileAlt,
  'AI & Edge Intelligence': FaBrain,
  'Full-Stack, Cloud & Web3': FaLaptopCode,
};

function SkillCard({ group, index }: { group: SkillCategory; index: number }) {
  const Icon = CATEGORY_ICONS[group.category] || FaMicrochip;
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      variants={fadeInUp}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-ink-900/80 hover:bg-ink-900 border border-ink-600 hover:border-amber/60 rounded-lg p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-[0_0_25px_rgba(255,107,53,0.15)]"
    >
      {/* Interactive Cursor Spotlight Glow */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: isHovered
            ? `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,107,53,0.12), transparent 80%)`
            : 'none',
        }}
      />

      {/* Top Bar: Icon + Category + Badge */}
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-ink-800/90 border border-ink-600 flex items-center justify-center text-amber group-hover:text-trace group-hover:border-amber/50 transition-colors shadow-inner">
              <Icon size={18} />
            </div>
            <div>
              <span className="font-mono text-[10px] text-paper-dim uppercase tracking-wider block">
                Pillar 0{index + 1}
              </span>
              <h3 className="font-display font-semibold text-base sm:text-lg text-paper group-hover:text-white transition-colors">
                {group.category}
              </h3>
            </div>
          </div>

          <span className="font-mono text-[10px] px-2 py-0.5 rounded-sm bg-ink-950 border border-ink-600 text-trace font-medium whitespace-nowrap shadow-sm">
            {group.badge}
          </span>
        </div>

        {/* Subtitle context */}
        <p className="text-paper-muted text-xs sm:text-sm leading-relaxed mb-6 font-sans">
          {group.subtitle}
        </p>
      </div>

      {/* Skill Chips Matrix */}
      <div className="relative z-10 flex flex-wrap gap-2 pt-2 border-t border-ink-600/50">
        {group.skills.map((skill) => (
          <span
            key={skill}
            className="text-xs font-mono px-2.5 py-1 border border-ink-600/70 bg-ink-950/60 text-paper-muted rounded-sm hover:border-amber hover:text-paper hover:bg-ink-950 transition-all duration-150 cursor-default"
          >
            {skill}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function SkillsSection() {
  return (
    <section id="skills" className="bg-ink-950 py-24 px-6 relative border-t border-ink-600">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-14"
        >
          <p className="font-mono text-sm text-amber mb-3">01 · Stack</p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <h2 className="font-display font-semibold text-3xl sm:text-4xl text-paper">
              <ScrambleText text="Skills & Core Technologies" />
            </h2>
            <p className="font-mono text-xs sm:text-sm text-paper-muted">
              6 Core Engineering Pillars · Full-Stack to Bare-Metal
            </p>
          </div>
        </motion.div>

        {/* Perfectly Balanced 6-Card Bento Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {SKILLS.map((group, index) => (
            <SkillCard key={group.category} group={group} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
