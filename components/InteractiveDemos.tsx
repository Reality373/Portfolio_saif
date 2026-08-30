'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CarAEBSimulator from './CarAEBSimulator';
import CanFirewallVisualizer from './CanFirewallVisualizer';
import ScrambleText from './ScrambleText';
import { FaCarSide, FaShieldAlt, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function InteractiveDemos() {
  const [activeTab, setActiveTab] = useState<'AEB' | 'FIREWALL'>('AEB');
  const [isVisible, setIsVisible] = useState(true);

  return (
    <section id="demos" className="bg-ink-950 py-24 px-6 relative border-t border-ink-600 select-none">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="font-mono text-sm text-amber">03 · Interactive Demos</p>
              <span className="w-1.5 h-1.5 rounded-full bg-amber" />
              <span className="font-mono text-xs text-paper-dim">Hands-On Engineering Visualizers</span>
            </div>

            <h2 className="font-display font-semibold text-3xl sm:text-4xl text-paper mb-3">
              <ScrambleText text="Test the systems live" />
            </h2>
            <p className="text-paper-muted font-mono text-sm max-w-2xl leading-relaxed">
              Interactive 2D visualizers illustrating real-world autonomous emergency braking and embedded automotive intrusion defense.
            </p>
          </div>

          {/* Toggle on/off flag */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setIsVisible(!isVisible)}
              className="font-mono text-xs px-3.5 py-1.5 rounded-sm border border-ink-600 bg-ink-900 text-paper-muted hover:text-paper hover:border-amber transition-colors flex items-center gap-2 cursor-pointer"
              title="Toggle interactive demo visibility"
            >
              {isVisible ? <FaEye className="text-trace" /> : <FaEyeSlash className="text-paper-dim" />}
              <span>{isVisible ? 'Demos Enabled' : 'Demos Hidden'}</span>
            </button>
          </div>
        </div>

        {isVisible ? (
          <>
            {/* Tab Selection Navigation */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-ink-600/70 pb-4">
              <button
                type="button"
                onClick={() => setActiveTab('AEB')}
                className={`font-mono text-xs px-4 py-2 rounded-sm transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'AEB'
                    ? 'bg-amber text-white dark:text-ink-950 font-semibold shadow-md'
                    : 'bg-ink-900 border border-ink-600 text-paper-muted hover:text-paper hover:border-paper-dim'
                }`}
              >
                <FaCarSide />
                <span>Autonomous Braking (AEB) Simulation</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('FIREWALL')}
                className={`font-mono text-xs px-4 py-2 rounded-sm transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'FIREWALL'
                    ? 'bg-trace text-ink-950 font-semibold shadow-md'
                    : 'bg-ink-900 border border-ink-600 text-paper-muted hover:text-paper hover:border-paper-dim'
                }`}
              >
                <FaShieldAlt />
                <span>CAN Bus Firewall Defender</span>
              </button>
            </div>

            {/* Active Demo Canvas */}
            <AnimatePresence mode="wait">
              {activeTab === 'AEB' && (
                <motion.div
                  key="aeb-demo"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <CarAEBSimulator />
                </motion.div>
              )}

              {activeTab === 'FIREWALL' && (
                <motion.div
                  key="firewall-demo"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <CanFirewallVisualizer />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="p-8 border border-dashed border-ink-600 rounded-md text-center font-mono text-xs text-paper-dim">
            Interactive visual demos are paused. Click &ldquo;Demos Hidden&rdquo; above to re-enable them anytime.
          </div>
        )}
      </div>
    </section>
  );
}
