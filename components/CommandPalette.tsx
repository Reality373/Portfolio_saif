'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHUD } from './HUDProvider';
import { useTheme } from './ThemeProvider';
import { STORIES } from '@/lib/stories';
import { projects } from '@/lib/projects';
import { SITE } from '@/lib/constants';
import {
  FaSearch,
  FaBookOpen,
  FaFolder,
  FaSun,
  FaMoon,
  FaDownload,
  FaEnvelope,
  FaTerminal,
  FaTimes,
  FaSlidersH,
} from 'react-icons/fa';

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Stories' | 'Projects' | 'Actions' | 'Diagnostics';
  title: string;
  subtitle?: string;
  icon: any;
  action: () => void;
}

export default function CommandPalette() {
  const { settings, toggleSettingsPanel } = useHUD();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Global keydown listener for Cmd+K / Ctrl+K
  useEffect(() => {
    if (!settings.commandPalette) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.commandPalette, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const allCommands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-skills',
      category: 'Navigation',
      title: 'Go to 01 · Stack & Skills',
      subtitle: 'Embedded, AI/ML, Full-Stack, Security',
      icon: FaTerminal,
      action: () => {
        setIsOpen(false);
        window.location.href = '#skills';
      },
    },
    {
      id: 'nav-stories',
      category: 'Navigation',
      title: 'Go to 02 · Field Notes & War Stories',
      subtitle: 'Crisis engineering, reverse-engineering, optimization',
      icon: FaBookOpen,
      action: () => {
        setIsOpen(false);
        window.location.href = '#stories';
      },
    },
    {
      id: 'nav-projects',
      category: 'Navigation',
      title: 'Go to 03 · Selected Projects',
      subtitle: 'Flagship builds & track record',
      icon: FaFolder,
      action: () => {
        setIsOpen(false);
        window.location.href = '#projects';
      },
    },
    {
      id: 'nav-contact',
      category: 'Navigation',
      title: 'Go to 04 · Contact',
      subtitle: 'Get in touch for embedded / full-stack work',
      icon: FaEnvelope,
      action: () => {
        setIsOpen(false);
        window.location.href = '#contact';
      },
    },

    // Actions
    {
      id: 'act-theme',
      category: 'Actions',
      title: `Toggle Theme (Currently: ${resolvedTheme})`,
      subtitle: 'Switch between light and dark mode',
      icon: resolvedTheme === 'dark' ? FaSun : FaMoon,
      action: () => {
        toggleTheme();
        setIsOpen(false);
      },
    },
    {
      id: 'act-hud-settings',
      category: 'Actions',
      title: 'Configure HUD Interactive Feature Flags',
      subtitle: 'Toggle CAN simulator, telemetry HUD, particles, text scramble',
      icon: FaSlidersH,
      action: () => {
        setIsOpen(false);
        toggleSettingsPanel();
      },
    },
    {
      id: 'act-copy-email',
      category: 'Actions',
      title: `Copy Email: ${SITE.email}`,
      subtitle: 'Copy email address to clipboard',
      icon: FaEnvelope,
      action: () => {
        navigator.clipboard.writeText(SITE.email);
        setIsOpen(false);
      },
    },
    {
      id: 'act-resume',
      category: 'Actions',
      title: 'Download Resume (PDF)',
      subtitle: 'Download latest resume document',
      icon: FaDownload,
      action: () => {
        window.open(SITE.resumePath, '_blank');
        setIsOpen(false);
      },
    },

    // Stories shortcuts
    ...STORIES.map((s) => ({
      id: `story-${s.id}`,
      category: 'Stories' as const,
      title: s.title,
      subtitle: `${s.category} · ${s.badge}`,
      icon: FaBookOpen,
      action: () => {
        setIsOpen(false);
        window.location.href = '#stories';
      },
    })),

    // Projects shortcuts
    ...projects.map((p) => ({
      id: `project-${p.id}`,
      category: 'Projects' as const,
      title: p.title,
      subtitle: p.tagline,
      icon: FaFolder,
      action: () => {
        setIsOpen(false);
        window.location.href = '#projects';
      },
    })),
  ];

  const filteredCommands = allCommands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  if (!settings.commandPalette) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-start justify-center pt-20 p-4"
            onClick={() => setIsOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-ink-900 border border-ink-600 max-w-xl w-full rounded-md shadow-2xl overflow-hidden font-mono"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.96, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            >
              {/* Search bar header */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-ink-600 bg-ink-950/60">
                <FaSearch className="text-paper-dim text-sm" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command, project, or story..."
                  className="w-full bg-transparent text-paper placeholder:text-paper-dim text-sm focus:outline-none"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-paper-dim hover:text-amber p-1 rounded transition-colors"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              {/* Commands List */}
              <div className="max-h-[360px] overflow-y-auto p-2 divide-y divide-ink-600/30">
                {filteredCommands.length === 0 ? (
                  <div className="p-8 text-center text-paper-dim text-xs">
                    No matching commands found for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  filteredCommands.map((cmd, idx) => {
                    const isSelected = idx === selectedIndex;
                    const Icon = cmd.icon;
                    return (
                      <div
                        key={cmd.id}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center justify-between p-3 rounded-sm cursor-pointer transition-colors text-xs ${
                          isSelected
                            ? 'bg-amber/15 text-paper border border-amber/30'
                            : 'text-paper-muted hover:bg-ink-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <Icon className={isSelected ? 'text-amber' : 'text-trace'} />
                          <div className="truncate">
                            <div className={`font-medium ${isSelected ? 'text-amber font-semibold' : 'text-paper'}`}>
                              {cmd.title}
                            </div>
                            {cmd.subtitle && (
                              <div className="text-[10px] text-paper-dim truncate">{cmd.subtitle}</div>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-paper-dim uppercase shrink-0 px-1.5 py-0.5 bg-ink-950/60 rounded border border-ink-600">
                          {cmd.category}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer hotkeys */}
              <div className="px-4 py-2 bg-ink-950 border-t border-ink-600 text-[10px] text-paper-dim flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span>Use ↑↓ to navigate</span>
                  <span>↵ to select</span>
                  <span>ESC to close</span>
                </div>
                <span className="text-trace">HUD Command Bar</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
  );
}
