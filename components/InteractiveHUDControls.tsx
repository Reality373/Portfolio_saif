'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useHUD, HUDSettings } from './HUDProvider';
import {
  FaSlidersH,
  FaTimes,
  FaShieldAlt,
  FaCarSide,
  FaBolt,
  FaKeyboard,
  FaProjectDiagram,
  FaClock,
  FaUndo,
} from 'react-icons/fa';

interface ToggleItem {
  key: keyof HUDSettings;
  title: string;
  description: string;
  icon: any;
  category: string;
}

const TOGGLE_ITEMS: ToggleItem[] = [
  {
    key: 'canSimulator',
    title: 'CAN Bus Threat Simulator',
    description: 'Live ECU packet sniffer & spoof/fuzz attack injection engine',
    icon: FaShieldAlt,
    category: 'Embedded Security',
  },
  {
    key: 'vehicleTelemetry',
    title: 'Drive-by-Wire Telemetry & AEB',
    description: 'Steer/throttle PID dials, 24S BMS heatmap & emergency braking benchmark',
    icon: FaCarSide,
    category: 'Autonomous Vehicle',
  },
  {
    key: 'scrambleEffects',
    title: 'Text Decryption / Scramble Glitch',
    description: 'React Bits inspired microsecond character descrambler on headers',
    icon: FaBolt,
    category: 'Motion & FX',
  },
  {
    key: 'commandPalette',
    title: 'Global Command Palette (⌘K)',
    description: 'Instant keyboard-driven spotlight search & diagnostic actions',
    icon: FaKeyboard,
    category: 'Productivity',
  },
  {
    key: 'particleCanvas',
    title: 'Circuit & Particle Logic Grid',
    description: 'Dynamic canvas with cursor-attracting circuit nodes in hero backdrop',
    icon: FaProjectDiagram,
    category: 'Visual Backdrop',
  },
  {
    key: 'statusBeacon',
    title: 'Status Beacon & IST Clock',
    description: 'Real-time Pune local clock, availability badge & 1-click email copy',
    icon: FaClock,
    category: 'Info Bar',
  },
];

export default function InteractiveHUDControls() {
  const {
    settings,
    toggleSetting,
    toggleAll,
    resetDefaults,
    isSettingsOpen,
    setIsSettingsOpen,
  } = useHUD();

  return (
    <>
      {/* Floating HUD settings trigger button (fixed bottom left or in header) */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-3 py-2 rounded-sm border border-ink-600 bg-ink-900/90 backdrop-blur-md text-paper-muted hover:text-amber hover:border-amber transition-all shadow-lg text-xs font-mono group"
        title="Customize Interactive Portfolio Features"
      >
        <FaSlidersH className="text-trace group-hover:text-amber transition-colors" />
        <span className="text-paper group-hover:text-amber transition-colors">Lab Controls</span>
      </button>

      {/* Settings Modal Drawer */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setIsSettingsOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-ink-900 border border-ink-600 max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-md shadow-2xl relative font-mono"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-ink-600 bg-ink-950/60">
                <div>
                  <div className="flex items-center gap-2 text-trace text-xs mb-1">
                    <FaSlidersH />
                    <span>INTERACTIVE LAB &amp; FEATURE FLAGS</span>
                  </div>
                  <h3 className="font-display font-semibold text-xl text-paper">
                    Portfolio HUD Controls
                  </h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-paper-dim hover:text-amber p-2 rounded transition-colors"
                  aria-label="Close"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              {/* Toggles list */}
              <div className="p-6 space-y-4">
                <p className="text-xs text-paper-muted leading-relaxed">
                  Toggle any of the interactive embedded simulators, telemetry HUDs, visual effects, or command bars on or off:
                </p>

                <div className="space-y-3">
                  {TOGGLE_ITEMS.map((item) => {
                    const isEnabled = settings[item.key];
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.key}
                        onClick={() => toggleSetting(item.key)}
                        className={`p-3.5 rounded-sm border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                          isEnabled
                            ? 'border-amber/50 bg-ink-950/80 shadow-sm'
                            : 'border-ink-600 bg-ink-950/30 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-sm mt-0.5 ${
                              isEnabled ? 'bg-amber/15 text-amber' : 'bg-ink-800 text-paper-dim'
                            }`}
                          >
                            <Icon size={14} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-paper font-semibold">{item.title}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-ink-800 text-paper-dim border border-ink-600">
                                {item.category}
                              </span>
                            </div>
                            <div className="text-[11px] text-paper-dim mt-0.5">{item.description}</div>
                          </div>
                        </div>

                        {/* Switch UI */}
                        <div
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                            isEnabled ? 'bg-amber' : 'bg-ink-700'
                          }`}
                        >
                          <motion.div
                            className="bg-ink-950 w-4 h-4 rounded-full shadow-md"
                            layout
                            animate={{ x: isEnabled ? 20 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-6 pt-0 border-t border-ink-600 bg-ink-950/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleAll(true)}
                    className="px-3 py-1.5 rounded-sm border border-ink-600 bg-ink-800 text-paper hover:border-amber hover:text-amber transition-colors"
                  >
                    Enable All
                  </button>
                  <button
                    onClick={() => toggleAll(false)}
                    className="px-3 py-1.5 rounded-sm border border-ink-600 bg-ink-800 text-paper-dim hover:text-paper transition-colors"
                  >
                    Disable All
                  </button>
                </div>

                <button
                  onClick={resetDefaults}
                  className="inline-flex items-center gap-1.5 text-paper-dim hover:text-trace transition-colors"
                >
                  <FaUndo className="text-[10px]" /> Reset Defaults
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
