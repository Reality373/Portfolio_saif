'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaDownload,
  FaChevronDown,
  FaFilePdf,
  FaShieldAlt,
  FaMicrochip,
  FaRobot,
  FaMobileAlt,
  FaLaptopCode,
  FaLock,
} from 'react-icons/fa';

export const TAILORED_RESUMES = [
  {
    title: 'Core / Master Resume',
    subtitle: 'Comprehensive Engineering Overview',
    href: '/resumes/Saif_Shikalgar_Resume.pdf',
    icon: FaFilePdf,
    badge: 'Master',
  },
  {
    title: 'Automotive Cybersecurity',
    subtitle: 'CAN Bus IDS/IPS, ISO 21434, TARA',
    href: '/resumes/Saif_Shikalgar_Automotive_Cybersecurity.pdf',
    icon: FaShieldAlt,
    badge: 'Hardware Security',
  },
  {
    title: 'Embedded Systems & Firmware',
    subtitle: 'STM32, FreeRTOS, Bare-Metal, Drivers',
    href: '/resumes/Saif_Shikalgar_Embedded_Systems.pdf',
    icon: FaMicrochip,
    badge: 'Real-Time',
  },
  {
    title: 'Robotics & Controls',
    subtitle: 'AEB, Closed-Loop PID, AS5600, Actuation',
    href: '/resumes/Saif_Shikalgar_Robotics.pdf',
    icon: FaRobot,
    badge: 'Autonomous',
  },
  {
    title: 'Android & Mobile',
    subtitle: 'Kotlin, Jetpack Compose, MVVM, Store Apps',
    href: '/resumes/Saif_Shikalgar_Android.pdf',
    icon: FaMobileAlt,
    badge: 'Google Play',
  },
  {
    title: 'Web Dev & Full-Stack',
    subtitle: 'Next.js 14, React, FastAPI, Node, Docker',
    href: '/resumes/Saif_Shikalgar_Web_Dev.pdf',
    icon: FaLaptopCode,
    badge: 'Full-Stack',
  },
  {
    title: 'General Cybersecurity',
    subtitle: 'Penetration Testing, Exploit-DB, Auditing',
    href: '/resumes/Saif_Shikalgar_Cybersecurity.pdf',
    icon: FaLock,
    badge: 'Infosec',
  },
];

export default function ResumeDropdown({
  className = '',
  mobile = false,
}: {
  className?: string;
  mobile?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (mobile) {
    return (
      <div className="w-full">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-center font-mono text-sm py-2.5 px-4 border border-amber/60 bg-amber text-white dark:text-ink-950 font-semibold rounded-sm flex items-center justify-center gap-2 shadow-md"
        >
          <FaDownload size={13} />
          <span>Download Resume (Select Domain)</span>
          <FaChevronDown
            size={11}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="mt-2 flex flex-col gap-1.5 bg-ink-900/90 border border-ink-600 rounded-sm p-2">
            {TAILORED_RESUMES.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.title}
                  href={item.href}
                  download
                  className="flex items-center justify-between p-2 rounded-xs bg-ink-950/60 hover:bg-ink-800 border border-ink-600/40 text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="text-amber text-xs" />
                    <div>
                      <div className="font-display font-semibold text-xs text-paper leading-tight">
                        {item.title}
                      </div>
                      <div className="font-mono text-[9px] text-paper-dim">{item.subtitle}</div>
                    </div>
                  </div>
                  <span className="font-mono text-[9px] text-trace bg-ink-900 px-1.5 py-0.5 rounded-xs border border-ink-600">
                    PDF
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="text-sm font-mono px-3.5 py-1.5 border border-ink-600 text-paper hover:border-amber hover:text-amber transition-colors rounded-sm bg-ink-900/40 flex items-center gap-1.5"
      >
        <span>Resume</span>
        <FaChevronDown
          size={9}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onMouseLeave={() => setIsOpen(false)}
            className="absolute right-0 top-full mt-2 w-80 bg-ink-950/98 backdrop-blur-xl border border-ink-600 rounded-md shadow-2xl p-2.5 z-50 select-none"
          >
            <div className="px-2 py-1.5 border-b border-ink-600 mb-1 flex items-center justify-between">
              <span className="font-mono text-[10px] text-paper-dim uppercase tracking-wider font-semibold">
                Tailored Domain Resumes
              </span>
              <span className="font-mono text-[9px] text-amber">LaTeX Compiled</span>
            </div>

            <div className="flex flex-col gap-1 max-h-96 overflow-y-auto pr-0.5">
              {TAILORED_RESUMES.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.title}
                    href={item.href}
                    download
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between p-2 rounded-sm border transition-all ${
                      idx === 0
                        ? 'bg-amber/10 border-amber/50 hover:bg-amber/20'
                        : 'bg-ink-900/50 border-ink-600/50 hover:bg-ink-800 hover:border-trace/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-sm flex items-center justify-center ${
                          idx === 0
                            ? 'bg-amber text-ink-950'
                            : 'bg-ink-800 text-trace border border-ink-600'
                        }`}
                      >
                        <Icon size={13} />
                      </div>
                      <div>
                        <div className="font-display font-semibold text-xs text-paper leading-tight flex items-center gap-1.5">
                          <span>{item.title}</span>
                          {idx === 0 && (
                            <span className="text-[8px] font-mono bg-amber/20 text-amber px-1 rounded-xs">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[9px] text-paper-dim leading-tight mt-0.5">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="text-paper-muted hover:text-amber p-1">
                      <FaDownload size={11} />
                    </div>
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
