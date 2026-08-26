'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHUD } from './HUDProvider';
import {
  FaShieldAlt,
  FaPlay,
  FaPause,
  FaRadiation,
  FaBug,
  FaCheckCircle,
  FaTerminal,
  FaInfoCircle,
} from 'react-icons/fa';

interface CanFrame {
  id: string;
  name: string;
  source: string;
  data: string;
  latency: string;
  status: 'PASS' | 'BLOCKED';
  reason?: string;
  timestamp: string;
}

const BENIGN_FRAMES = [
  { id: '0x0C4', name: 'ECU_ENGINE_RPM', source: 'Internal Bus', data: '18 4A 00 00 E2 09 00 00', val: '2,840 RPM' },
  { id: '0x180', name: 'STEER_ANGLE_PID', source: 'DBW Steer ECU', data: '02 FC 00 14 00 00 00 00', val: '+12.4 deg' },
  { id: '0x200', name: 'WHEEL_SPEED_FL', source: 'Sensor Hub', data: '3F 01 40 01 00 00 00 00', val: '64.2 km/h' },
  { id: '0x300', name: 'BRAKE_PRESSURE', source: 'Brake ECU', data: '00 00 00 00 00 00 00 00', val: '0.0 bar' },
  { id: '0x450', name: 'THROTTLE_DAC', source: 'DBW Throttle', data: '1A 05 00 00 00 00 00 00', val: '1.42 V' },
];

export default function CanSimulator() {
  const { settings } = useHUD();
  const [isRunning, setIsRunning] = useState(true);
  const [mode, setMode] = useState<'NORMAL' | 'SPOOF' | 'FUZZ' | 'DOS'>('NORMAL');
  const [frames, setFrames] = useState<CanFrame[]>([]);
  const [stats, setStats] = useState({
    totalFrames: 142,
    blockedAttacks: 18,
    avgLatency: '5.92 µs',
    blockRate: '99.9%',
  });
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);

  // Generate packet stream
  useEffect(() => {
    if (!settings.canSimulator || !isRunning) return;

    const interval = setInterval(() => {
      const timeStr = new Date().toISOString().substring(11, 23);

      if (mode === 'NORMAL') {
        const sample = BENIGN_FRAMES[Math.floor(Math.random() * BENIGN_FRAMES.length)];
        const newFrame: CanFrame = {
          id: sample.id,
          name: sample.name,
          source: sample.source,
          data: sample.data,
          latency: '0.82 µs',
          status: 'PASS',
          reason: 'Gate 1: Allowed ID & Direction Verified',
          timestamp: timeStr,
        };
        setFrames((prev) => [newFrame, ...prev.slice(0, 19)]);
        setStats((prev) => ({ ...prev, totalFrames: prev.totalFrames + 1 }));
      } else if (mode === 'SPOOF') {
        const isMalicious = Math.random() > 0.3;
        if (isMalicious) {
          const newFrame: CanFrame = {
            id: '0x0C4',
            name: 'SPOOF_RPM_ATTACK',
            source: 'Untrusted OBD-II Port',
            data: 'FF FF 21 00 00 00 00 00',
            latency: '5.92 µs',
            status: 'BLOCKED',
            reason: 'Gate 2: Mahalanobis Anomaly D_M=14.82 > 4.2',
            timestamp: timeStr,
          };
          setFrames((prev) => [newFrame, ...prev.slice(0, 19)]);
          setActiveAlert('Gate 2 Anomaly Detector: Injected RPM Spoofing Frame Intercepted & Dropped (5.92µs)');
          setStats((prev) => ({
            ...prev,
            totalFrames: prev.totalFrames + 1,
            blockedAttacks: prev.blockedAttacks + 1,
          }));
        } else {
          const sample = BENIGN_FRAMES[0];
          const newFrame: CanFrame = {
            id: sample.id,
            name: sample.name,
            source: sample.source,
            data: sample.data,
            latency: '0.82 µs',
            status: 'PASS',
            reason: 'Gate 1: Verified Internal Bus',
            timestamp: timeStr,
          };
          setFrames((prev) => [newFrame, ...prev.slice(0, 19)]);
          setStats((prev) => ({ ...prev, totalFrames: prev.totalFrames + 1 }));
        }
      } else if (mode === 'FUZZ') {
        const isFuzz = Math.random() > 0.2;
        if (isFuzz) {
          const randId = '0x' + Math.floor(Math.random() * 0x7ff).toString(16).toUpperCase().padStart(3, '0');
          const newFrame: CanFrame = {
            id: randId,
            name: 'FUZZ_CORRUPTED_PAYLOAD',
            source: 'Injected Packet Stream',
            data: Array.from({ length: 8 }, () => Math.floor(Math.random() * 255).toString(16).padStart(2, '0')).join(' ').toUpperCase(),
            latency: '2.14 µs',
            status: 'BLOCKED',
            reason: 'Gate 1: Unregistered ID / Jitter Threshold Violation',
            timestamp: timeStr,
          };
          setFrames((prev) => [newFrame, ...prev.slice(0, 19)]);
          setActiveAlert('Gate 1 Statistical Engine: 88.5% Fuzzing Payload Filtered Under Burst Load');
          setStats((prev) => ({
            ...prev,
            totalFrames: prev.totalFrames + 1,
            blockedAttacks: prev.blockedAttacks + 1,
          }));
        } else {
          const sample = BENIGN_FRAMES[2];
          const newFrame: CanFrame = {
            id: sample.id,
            name: sample.name,
            source: sample.source,
            data: sample.data,
            latency: '0.82 µs',
            status: 'PASS',
            reason: 'Gate 1: Verified Whitelist',
            timestamp: timeStr,
          };
          setFrames((prev) => [newFrame, ...prev.slice(0, 19)]);
          setStats((prev) => ({ ...prev, totalFrames: prev.totalFrames + 1 }));
        }
      }
    }, mode === 'NORMAL' ? 1200 : 700);

    return () => clearInterval(interval);
  }, [settings.canSimulator, isRunning, mode]);

  if (!settings.canSimulator) return null;

  return (
    <section className="bg-ink-950 py-16 px-6 relative border-t border-ink-600">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-trace animate-pulse" />
              <p className="font-mono text-xs text-trace uppercase tracking-wider">
                Interactive Embedded Security Lab
              </p>
            </div>
            <h2 className="font-display font-semibold text-2xl sm:text-3xl text-paper">
              CAN Bus Inline Intrusion Prevention Simulator
            </h2>
            <p className="text-paper-muted font-mono text-xs sm:text-sm mt-1">
              Live simulation of Gate 1 (Statistical Allowlist) and Gate 2 (Mahalanobis Anomaly Engine on STM32F446RE).
            </p>
          </div>

          {/* Quick status pill */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`font-mono text-xs px-3.5 py-1.5 rounded-sm border flex items-center gap-2 transition-colors ${
                isRunning
                  ? 'border-trace/60 text-trace bg-trace/10 hover:bg-trace/20'
                  : 'border-ink-600 text-paper-dim bg-ink-900 hover:text-paper'
              }`}
            >
              {isRunning ? <FaPause className="text-[10px]" /> : <FaPlay className="text-[10px]" />}
              {isRunning ? 'Stream Active (500 kbps)' : 'Paused'}
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-12 gap-6 bg-ink-900 border border-ink-600 rounded-md p-6 sm:p-8 shadow-xl">
          {/* Left Column: Attack Injection Controls & Metrics */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-amber mb-3 flex items-center gap-2 font-semibold">
                <FaRadiation /> Threat Injection Scenarios
              </h3>
              <p className="text-paper-muted text-xs leading-relaxed mb-4">
                Trigger simulated automotive attack vectors to test real-time interception on the virtual CAN network:
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    setMode('NORMAL');
                    setActiveAlert(null);
                  }}
                  className={`w-full text-left p-3 rounded-sm border transition-all flex items-center justify-between font-mono text-xs ${
                    mode === 'NORMAL'
                      ? 'border-trace bg-trace/10 text-trace font-semibold shadow-sm'
                      : 'border-ink-600 bg-ink-950/60 text-paper-muted hover:border-paper-dim hover:text-paper'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FaCheckCircle className={mode === 'NORMAL' ? 'text-trace' : 'text-paper-dim'} />
                    <div>
                      <div className="text-paper">Normal ECU Telemetry</div>
                      <div className="text-[10px] text-paper-dim">Clean vehicle engine, steer &amp; speed packets</div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase">Normal</span>
                </button>

                <button
                  onClick={() => setMode('SPOOF')}
                  className={`w-full text-left p-3 rounded-sm border transition-all flex items-center justify-between font-mono text-xs ${
                    mode === 'SPOOF'
                      ? 'border-amber bg-amber/10 text-amber font-semibold shadow-sm'
                      : 'border-ink-600 bg-ink-950/60 text-paper-muted hover:border-amber/50 hover:text-paper'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FaRadiation className={mode === 'SPOOF' ? 'text-amber' : 'text-paper-dim'} />
                    <div>
                      <div className="text-paper">Inject RPM Spoof Attack</div>
                      <div className="text-[10px] text-paper-dim">Fakes 8500 RPM on ID 0x0C4 from untrusted port</div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase text-amber">Spoof</span>
                </button>

                <button
                  onClick={() => setMode('FUZZ')}
                  className={`w-full text-left p-3 rounded-sm border transition-all flex items-center justify-between font-mono text-xs ${
                    mode === 'FUZZ'
                      ? 'border-amber bg-amber/10 text-amber font-semibold shadow-sm'
                      : 'border-ink-600 bg-ink-950/60 text-paper-muted hover:border-amber/50 hover:text-paper'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FaBug className={mode === 'FUZZ' ? 'text-amber' : 'text-paper-dim'} />
                    <div>
                      <div className="text-paper">Inject Bus Fuzzing Flood</div>
                      <div className="text-[10px] text-paper-dim">Randomized arbitration IDs &amp; corrupted payload</div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase text-amber">Fuzz</span>
                </button>
              </div>
            </div>

            {/* Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-ink-600">
              <div className="bg-ink-950/60 p-2.5 rounded-sm border border-ink-600 text-center">
                <div className="font-display font-semibold text-lg text-trace">5.92 µs</div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-paper-dim">Latency</div>
              </div>
              <div className="bg-ink-950/60 p-2.5 rounded-sm border border-ink-600 text-center">
                <div className="font-display font-semibold text-lg text-amber">99.9%</div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-paper-dim">Spoof Block</div>
              </div>
              <div className="bg-ink-950/60 p-2.5 rounded-sm border border-ink-600 text-center">
                <div className="font-display font-semibold text-lg text-paper">3%</div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-paper-dim">RT Budget</div>
              </div>
              <div className="bg-ink-950/60 p-2.5 rounded-sm border border-ink-600 text-center">
                <div className="font-display font-semibold text-lg text-green-400">{stats.blockedAttacks}</div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-paper-dim">Blocked</div>
              </div>
            </div>
          </div>

          {/* Right Column: Live CAN Packet Sniffer Terminal */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-mono text-paper-dim">
                  <FaTerminal className="text-trace" />
                  <span>CAN_BUS_TRANSCEIVER_LOG (STM32F446RE)</span>
                </div>
                <span className="text-[10px] font-mono text-paper-dim">500 kbps · TWAI</span>
              </div>

              {/* Alert banner */}
              <AnimatePresence>
                {activeAlert && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-3 p-2.5 bg-amber/10 border border-amber/40 rounded-sm font-mono text-xs text-amber flex items-center gap-2"
                  >
                    <FaShieldAlt className="shrink-0 text-sm" />
                    <span>{activeAlert}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Terminal Viewport */}
              <div
                ref={feedRef}
                className="bg-ink-950 border border-ink-600 rounded-sm p-3.5 h-[310px] overflow-y-auto font-mono text-xs space-y-2 shadow-inner"
              >
                {frames.length === 0 ? (
                  <div className="text-paper-dim text-center py-16">Initializing CAN transceiver interface...</div>
                ) : (
                  frames.map((frame, index) => (
                    <motion.div
                      key={`${frame.timestamp}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`p-2 rounded-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] ${
                        frame.status === 'PASS'
                          ? 'border-ink-600/60 bg-ink-900/40 text-paper-muted'
                          : 'border-amber/50 bg-amber/10 text-amber'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold px-1.5 py-0.2 rounded-sm text-[10px] ${
                            frame.status === 'PASS'
                              ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                              : 'bg-amber/20 text-amber border border-amber/40 font-bold'
                          }`}
                        >
                          {frame.status}
                        </span>
                        <span className="text-paper font-semibold">{frame.id}</span>
                        <span className="text-paper-dim hidden md:inline">({frame.name})</span>
                      </div>

                      <div className="text-paper-dim text-[10px] font-mono tracking-tight truncate max-w-[200px]">
                        [{frame.data}]
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-trace font-medium text-[10px]">{frame.latency}</span>
                        <span className="text-paper-dim text-[9px]">{frame.timestamp}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom footnote */}
            <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-paper-dim">
              <span className="flex items-center gap-1.5">
                <FaInfoCircle className="text-trace" /> Verified on custom STM32 carrier + Kvaser USBcan Light
              </span>
              <span>1,065 CPU cycles / frame</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
