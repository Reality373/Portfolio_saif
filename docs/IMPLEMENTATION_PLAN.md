# Matrix Terminal Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Matrix-themed, fully interactive portfolio website showcasing Drive-by-Wire and FiberOpticCalc projects with smooth animations and expandable project cards.

**Architecture:** Next.js single-page app with component-based architecture. Global Matrix styling (colors, fonts, animations) in Tailwind + custom CSS. Modular components for Hero, Projects section, and individual project cards. Framer Motion handles all animations. Data-driven project cards for easy content updates.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, Framer Motion, React Icons, JetBrains Mono font

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout, global styles
│   └── page.tsx            # Main portfolio page
├── components/
│   ├── Header.tsx          # Navigation header
│   ├── HeroSection.tsx     # Hero/landing with typing effect
│   ├── ProjectsSection.tsx # Projects grid container
│   ├── ProjectCard.tsx     # Individual project card (expandable)
│   └── Footer.tsx          # Footer with links
├── lib/
│   ├── constants.ts        # Colors, fonts, animations config
│   ├── projects.ts         # Project data (Drive-by-Wire, FiberOpticCalc)
│   └── animations.ts       # Reusable animation variants
├── styles/
│   ├── globals.css         # Global Matrix styling, fonts
│   └── animations.css      # Custom keyframe animations
├── types/
│   └── index.ts            # TypeScript interfaces
└── public/
    ├── images/             # Project images/screenshots
    └── icons/              # Custom icons (optional)
```

---

## Tasks

### Task 1: Project Setup & Dependencies

**Files:**
- Create: `package.json` (via `create-next-app`)
- Create: `.env.local`
- Modify: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`

- [ ] **Step 1: Initialize Next.js project**
```bash
cd d:\Codes\Portfolio_saif
npx create-next-app@latest . --typescript --tailwind --app
```

- [ ] **Step 2: Install additional dependencies**
```bash
npm install framer-motion react-icons jetbrains-mono
```

- [ ] **Step 3: Verify setup**
```bash
npm run dev
# Check that localhost:3000 loads without errors
```

- [ ] **Step 4: Commit**
```bash
git add .
git commit -m "init: Next.js project setup with dependencies"
```

---

### Task 2: Global Styling & Matrix Theme

**Files:**
- Create: `src/lib/constants.ts`
- Modify: `src/styles/globals.css`
- Create: `src/styles/animations.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Create constants file with Matrix colors & config**
```typescript
// src/lib/constants.ts
export const MATRIX_COLORS = {
  neon: '#00ff00',      // Bright lime green
  background: '#000000', // Pitch black
  darkGray: '#0a0e27',  // Slightly lighter black for cards
  textPrimary: '#00ff00',
  textSecondary: '#00cc00', // Slightly darker green
  accentCyan: '#00ffff', // Optional cyan for accents
};

export const FONTS = {
  mono: 'JetBrains Mono, monospace',
};

export const ANIMATION_DURATION = {
  fast: 0.2,
  standard: 0.4,
  slow: 0.6,
};
```

- [ ] **Step 2: Update globals.css with Matrix theme**
```css
/* src/styles/globals.css */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  background-color: #000000;
  color: #00ff00;
  font-family: 'JetBrains Mono', monospace;
  line-height: 1.6;
  overflow-x: hidden;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #000000;
}

::-webkit-scrollbar-thumb {
  background: #00ff00;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #00cc00;
}

/* Selection styling */
::selection {
  background-color: #00ff00;
  color: #000000;
}

/* Smooth scroll */
html {
  scroll-behavior: smooth;
}
```

- [ ] **Step 3: Create animations.css with keyframes**
```css
/* src/styles/animations.css */
@keyframes typing {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

@keyframes blink-cursor {
  0%, 49% {
    border-right-color: #00ff00;
  }
  50%, 100% {
    border-right-color: transparent;
  }
}

@keyframes glowPulse {
  0%, 100% {
    text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00;
  }
  50% {
    text-shadow: 0 0 20px #00ff00, 0 0 40px #00ff00;
  }
}

@keyframes matrixRain {
  0% {
    transform: translateY(-100%);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
}

.typing {
  animation: typing 3s steps(40, end), blink-cursor 0.75s step-end infinite;
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid #00ff00;
}

.glow-text {
  animation: glowPulse 2s ease-in-out infinite;
}
```

- [ ] **Step 4: Update tailwind.config.ts with Matrix theme**
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        matrix: {
          neon: '#00ff00',
          bg: '#000000',
          dark: '#0a0e27',
          secondary: '#00cc00',
          cyan: '#00ffff',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 5: Commit**
```bash
git add .
git commit -m "style: add Matrix theme colors, fonts, and animations"
```

---

### Task 3: Create TypeScript Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Define project and component types**
```typescript
// src/types/index.ts
export interface ProjectData {
  id: string;
  title: string;
  tagline: string;
  description: string;
  technologies: string[];
  achievements: string[];
  image?: string;
  image_alt?: string;
  links: {
    github?: string;
    live?: string;
    article?: string;
  };
  featured: boolean;
}

export interface AnimationVariant {
  hidden: any;
  visible: any;
}
```

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "types: add project and animation interfaces"
```

---

### Task 4: Create Projects Data

**Files:**
- Create: `src/lib/projects.ts`

- [ ] **Step 1: Add project data for featured projects**
```typescript
// src/lib/projects.ts
import { ProjectData } from '@/types';

export const projects: ProjectData[] = [
  {
    id: 'dbw',
    title: 'Drive-by-Wire',
    tagline: 'Autonomous Vehicle Control System',
    description: `Led design and implementation of a distributed 3-ECU fault-tolerant system for autonomous vehicle control. 
    
Executed crisis engineering to migrate from STM32 to ESP32 in 8 hours after critical failure. Optimized real-time sensor-actuator feedback loops on NVIDIA Jetson Nano. Engineered high-reliability CAN bus logic with hardware heartbeats and message prioritization.

Results: 1st Place in Adaptive Cruise Control, 3rd Place in AEB at Team Abhyuday Racing competition.`,
    technologies: [
      'C++',
      'ESP32',
      'STM32',
      'CAN Bus',
      'NVIDIA Jetson Nano',
      'Linux',
      'Real-time Systems',
    ],
    achievements: [
      '1st Place in Adaptive Cruise Control',
      '3rd Place in Autonomous Emergency Braking',
      'Distributed 3-ECU architecture',
      '8-hour crisis hardware migration',
      'Real-time sensor-actuator optimization',
    ],
    image: '/images/dbw.jpg',
    image_alt: 'Drive-by-Wire System Architecture',
    links: {
      github: 'https://github.com/Reality373', // Update with actual
    },
    featured: true,
  },
  {
    id: 'fiber',
    title: 'FiberOpticCalc',
    tagline: 'Professional FTTH Optical Power Budget Platform',
    description: `Developed and launched a professional FTTH (Fiber-to-the-Home) platform from concept to production. 
    
Scaled to 1.36K+ installs and 670+ active users with verified recurring yearly revenue. Designed full-stack architecture using MVVM and Jetpack Compose featuring a recursive engine for complex optical power budget calculations and path-loss modeling.

Implemented Atomic Persistence to prevent data corruption and a Schema-Aware Cloud Backup system via Google Drive REST API. Built a Multi-Engine Map system with OSM/Google Maps integration and a traversal-based OTDR Fault Locator algorithm to identify precise fiber break points.`,
    technologies: [
      'Kotlin',
      'Jetpack Compose',
      'MVVM',
      'Google Drive REST API',
      'OSM / Google Maps',
      'Android SDK',
      'Firebase',
    ],
    achievements: [
      '1.36K+ app installs',
      '670+ active users',
      'Verified recurring yearly revenue',
      'Recursive optical power budget calculations',
      'Multi-engine geospatial mapping',
      'Cloud backup system with schema migration',
    ],
    image: '/images/fiber.jpg',
    image_alt: 'FiberOpticCalc App Interface',
    links: {
      github: 'https://github.com/Reality373', // Update with actual
    },
    featured: true,
  },
];
```

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "data: add featured projects (DBW, FiberOpticCalc)"
```

---

### Task 5: Create Reusable Animation Variants

**Files:**
- Create: `src/lib/animations.ts`

- [ ] **Step 1: Define Framer Motion animation patterns**
```typescript
// src/lib/animations.ts
import { AnimationVariant } from '@/types';

export const fadeInUp: AnimationVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

export const scaleIn: AnimationVariant = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export const slideInFromLeft: AnimationVariant = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export const glowHover = {
  whileHover: {
    textShadow: '0 0 20px #00ff00, 0 0 40px #00ff00',
    transition: { duration: 0.3 },
  },
};
```

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "lib: add reusable Framer Motion animation variants"
```

---

### Task 6: Create Header Component

**Files:**
- Create: `src/components/Header.tsx`

- [ ] **Step 1: Build sticky navigation header**
```typescript
// src/components/Header.tsx
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
```

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "feat: create Header component with sticky nav"
```

---

### Task 7: Create Hero Section Component

**Files:**
- Create: `src/components/HeroSection.tsx`

- [ ] **Step 1: Build hero with typing effect and terminal prompt**
```typescript
// src/components/HeroSection.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import { ChevronDown } from 'react-icons/fa';

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
              y: window.innerHeight + 40,
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
        <ChevronDown className="text-matrix-neon text-2xl" />
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "feat: create Hero section with typing effect"
```

---

### Task 8: Create Project Card Component (Expandable)

**Files:**
- Create: `src/components/ProjectCard.tsx`

- [ ] **Step 1: Build interactive expandable project card**
```typescript
// src/components/ProjectCard.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectData } from '@/types';
import { X } from 'react-icons/fa';

interface ProjectCardProps {
  project: ProjectData;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Card */}
      <motion.div
        className="border-2 border-matrix-neon p-6 cursor-pointer hover:border-matrix-cyan hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
        onClick={() => setIsExpanded(true)}
        whileHover={{
          boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)',
        }}
        layout
      >
        {/* Background glow on hover */}
        <div className="absolute inset-0 bg-matrix-neon opacity-0 group-hover:opacity-5 transition-opacity duration-300" />

        <div className="relative z-10">
          {/* Title */}
          <h3 className="text-2xl font-bold text-matrix-neon mb-2">
            {project.title}
          </h3>

          {/* Tagline */}
          <p className="text-matrix-secondary text-sm mb-4 font-mono">
            {project.tagline}
          </p>

          {/* Tech badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {project.technologies.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="text-xs px-3 py-1 border border-matrix-cyan text-matrix-cyan font-mono"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className="text-xs px-3 py-1 border border-matrix-secondary text-matrix-secondary font-mono">
                +{project.technologies.length - 4} more
              </span>
            )}
          </div>

          {/* CTA */}
          <button className="text-matrix-neon text-sm font-mono hover:text-matrix-cyan transition-colors">
            view details →
          </button>
        </div>
      </motion.div>

      {/* Expanded Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setIsExpanded(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-matrix-dark border-2 border-matrix-neon max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Close button */}
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-4 right-4 text-matrix-neon hover:text-matrix-cyan transition-colors z-10"
              >
                <X size={24} />
              </button>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Header */}
                <div>
                  <h2 className="text-4xl font-bold text-matrix-neon mb-2">
                    {project.title}
                  </h2>
                  <p className="text-matrix-secondary font-mono">
                    {project.tagline}
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  {project.description.split('\n\n').map((para, i) => (
                    <p
                      key={i}
                      className="text-matrix-neon leading-relaxed text-sm md:text-base whitespace-pre-wrap"
                    >
                      {para}
                    </p>
                  ))}
                </div>

                {/* Achievements */}
                <div>
                  <h3 className="text-xl font-bold text-matrix-cyan mb-3">
                    Key Achievements
                  </h3>
                  <ul className="space-y-2">
                    {project.achievements.map((achievement, i) => (
                      <li
                        key={i}
                        className="text-matrix-neon text-sm flex items-start"
                      >
                        <span className="text-matrix-cyan mr-3">▸</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Technologies */}
                <div>
                  <h3 className="text-xl font-bold text-matrix-cyan mb-3">
                    Technologies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 border border-matrix-neon text-matrix-neon text-xs font-mono hover:bg-matrix-neon hover:text-matrix-bg transition-colors"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Links */}
                <div className="pt-4 border-t border-matrix-neon/30 flex gap-4">
                  {project.links.github && (
                    <a
                      href={project.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-matrix-neon hover:text-matrix-cyan font-mono text-sm transition-colors"
                    >
                      → GitHub
                    </a>
                  )}
                  {project.links.live && (
                    <a
                      href={project.links.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-matrix-neon hover:text-matrix-cyan font-mono text-sm transition-colors"
                    >
                      → Live Demo
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "feat: create expandable ProjectCard component"
```

---

### Task 9: Create Projects Section Container

**Files:**
- Create: `src/components/ProjectsSection.tsx`

- [ ] **Step 1: Build projects grid with stagger animations**
```typescript
// src/components/ProjectsSection.tsx
'use client';

import { motion } from 'framer-motion';
import ProjectCard from './ProjectCard';
import { projects } from '@/lib/projects';
import { staggerContainer, fadeInUp } from '@/lib/animations';

export default function ProjectsSection() {
  // Separate featured and other projects
  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);

  return (
    <section
      id="projects"
      className="min-h-screen bg-matrix-bg py-20 px-4 relative"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section title */}
        <motion.div
          className="mb-16"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-matrix-neon mb-4">
            <span className="text-matrix-cyan">&lt;</span> Projects{' '}
            <span className="text-matrix-cyan">/&gt;</span>
          </h2>
          <div className="h-1 w-20 bg-matrix-neon" />
          <p className="text-matrix-secondary mt-4 font-mono">
            Featured work & technical achievements
          </p>
        </motion.div>

        {/* Featured projects (larger grid) */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {featured.map((project, idx) => (
            <motion.div
              key={project.id}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>

        {/* Other projects section (if any) */}
        {others.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-matrix-neon mb-8">
              Other Projects
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {others.map((project) => (
                <motion.div key={project.id} variants={fadeInUp}>
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "feat: create ProjectsSection with grid layout"
```

---

### Task 10: Create Footer Component

**Files:**
- Create: `src/components/Footer.tsx`

- [ ] **Step 1: Build minimal Matrix-style footer**
```typescript
// src/components/Footer.tsx
'use client';

import { motion } from 'framer-motion';
import { Github, Linkedin, Mail } from 'react-icons/fa';

export default function Footer() {
  const links = [
    {
      icon: Github,
      href: 'https://github.com/Reality373',
      label: 'GitHub',
    },
    {
      icon: Linkedin,
      href: 'https://linkedin.com/in/reality373',
      label: 'LinkedIn',
    },
    {
      icon: Mail,
      href: 'mailto:15974saif@gmail.com',
      label: 'Email',
    },
  ];

  return (
    <footer className="bg-matrix-bg border-t border-matrix-neon/30 py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Left side - text */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center md:text-left"
        >
          <p className="text-matrix-neon font-mono text-sm">
            <span className="text-matrix-cyan">$</span> echo "made with code &
            curiosity"
          </p>
          <p className="text-matrix-secondary text-xs mt-2">
            © 2026 Saif Shikalgar
          </p>
        </motion.div>

        {/* Right side - social links */}
        <motion.div
          className="flex gap-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.1 }}
        >
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <motion.a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-matrix-neon hover:text-matrix-cyan transition-colors"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon size={24} />
              </motion.a>
            );
          })}
        </motion.div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "feat: create Footer with social links"
```

---

### Task 11: Update Root Layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Set up root layout with global styles**
```typescript
// src/app/layout.tsx
import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Saif Shikalgar - Full-Stack Developer',
  description:
    'Portfolio showcasing Drive-by-Wire autonomous systems and FiberOpticCalc FTTH platform',
  keywords: [
    'developer',
    'hardware engineer',
    'autonomous systems',
    'cybersecurity',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jetbrainsMono.className}>
      <body className="bg-matrix-bg text-matrix-neon">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "config: update root layout with typography and metadata"
```

---

### Task 12: Update Main Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Compose all sections into main page**
```typescript
// src/app/page.tsx
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ProjectsSection from '@/components/ProjectsSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="bg-matrix-bg">
      <Header />
      <HeroSection />
      <ProjectsSection />
      <Footer />
    </main>
  );
}
```

- [ ] **Step 2: Test the full site locally**
```bash
npm run dev
# Visit http://localhost:3000
# Test: hero typing effect, scroll, project cards, expand/collapse
```

- [ ] **Step 3: Commit**
```bash
git add .
git commit -m "feat: compose all sections into main page"
```

---

### Task 13: Add Project Images & Assets

**Files:**
- Create: `public/images/` directory
- Place project screenshots here

- [ ] **Step 1: Create images directory**
```bash
mkdir -p public/images
```

- [ ] **Step 2: Add placeholder images for now**
```bash
# Instructions: Place DBW and FiberOpticCalc screenshots here
# Filenames: dbw.jpg, fiber.jpg
# Can update later with real screenshots
```

- [ ] **Step 3: Commit**
```bash
git add .
git commit -m "assets: add image directory placeholder"
```

---

### Task 14: Test & Polish

**Files:**
- Test all components interactively

- [ ] **Step 1: Test on desktop**
```bash
npm run dev
# Verify:
# - Hero typing effect works
# - Scroll animations trigger
# - Project cards expand/close
# - No console errors
# - Colors match Matrix theme
```

- [ ] **Step 2: Test on mobile**
```bash
# Open DevTools → device emulation
# Test: responsive layout, touch interactions
```

- [ ] **Step 3: Test animations performance**
```bash
# Check DevTools Performance tab
# Ensure no janky scrolling or animations
```

- [ ] **Step 4: Commit final polish**
```bash
git add .
git commit -m "test: verify all animations and responsive behavior"
```

---

### Task 15: Build & Deploy to Vercel

**Files:**
- Verify build output
- Deploy configuration

- [ ] **Step 1: Build locally**
```bash
npm run build
# Should complete without errors
```

- [ ] **Step 2: Install Vercel CLI**
```bash
npm install -g vercel
```

- [ ] **Step 3: Deploy to Vercel**
```bash
vercel
# Follow prompts, select project settings
```

- [ ] **Step 4: Verify deployment**
```bash
# Visit your Vercel URL
# Test all functionality
```

- [ ] **Step 5: Final commit**
```bash
git add .
git commit -m "deploy: initial Vercel deployment"
```

---

## Success Checklist

- ✅ Hero section with typing effect and animations
- ✅ Project cards with expandable modals
- ✅ Matrix/Terminal aesthetic (lime green, black, monospace)
- ✅ Responsive on mobile, tablet, desktop
- ✅ All animations smooth (no jank)
- ✅ Links to GitHub, LinkedIn, email functional
- ✅ Deployed and live on Vercel
- ✅ Future-proof for adding more projects

---

## Next Steps (Post-MVP)

- [ ] Add blog/articles section
- [ ] Create skills/tech stack breakdown
- [ ] Add experience timeline
- [ ] Build contact form with email notification
- [ ] Add more projects as you create them
- [ ] Implement dark/light theme toggle
- [ ] Add resume PDF download
- [ ] Setup analytics (Vercel Analytics)
