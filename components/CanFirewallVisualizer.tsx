'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaCar, FaLaptopCode, FaCheck, FaTimes, FaPlay, FaUndo } from 'react-icons/fa';

export default function CanFirewallVisualizer() {
  const [packetType, setPacketType] = useState<'NORMAL' | 'SPOOF' | 'FUZZ' | null>(null);
  const [stage, setStage] = useState<'IDLE' | 'TRANSMITTING' | 'INSPECTING' | 'DECIDED'>('IDLE');
  const [result, setResult] = useState<'PASSED' | 'BLOCKED' | null>(null);
  const [engineRPM, setEngineRPM] = useState(2800);

  const sendPacket = (type: 'NORMAL' | 'SPOOF' | 'FUZZ') => {
    if (stage === 'TRANSMITTING' || stage === 'INSPECTING') return;

    setPacketType(type);
    setStage('TRANSMITTING');
    setResult(null);

    // After traveling to firewall (0.6s), inspect
    setTimeout(() => {
      setStage('INSPECTING');

      // After inspection (5.92µs simulated as 0.7s visual), decide
      setTimeout(() => {
        setStage('DECIDED');
        if (type === 'NORMAL') {
          setResult('PASSED');
          setEngineRPM(3200);
          setTimeout(() => setEngineRPM(2800), 2000);
        } else {
          setResult('BLOCKED');
        }
      }, 700);
    }, 600);
  };

  const reset = () => {
    setPacketType(null);
    setStage('IDLE');
    setResult(null);
  };

  return (
    <div className="bg-ink-900 border border-ink-600 rounded-md p-5 sm:p-8 shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-trace uppercase tracking-wider font-semibold">
              STM32F446RE Dual-Gate IPS Architecture
            </span>
          </div>
          <h3 className="font-display font-semibold text-xl sm:text-2xl text-paper">
            CAN Bus Packet Firewall Defender
          </h3>
          <p className="text-paper-muted text-xs font-mono mt-0.5">
            Click to send real-world CAN frames and watch the hardware firewall inspect or deflect attacks in 5.92 µs.
          </p>
        </div>

        {/* Engine ECU live status */}
        <div className="bg-ink-950 px-3.5 py-1.5 rounded-sm border border-ink-600 font-mono text-xs flex items-center gap-2.5 self-start md:self-auto">
          <FaCar className="text-trace text-xs sm:text-sm shrink-0" />
          <div>
            <div className="text-paper-dim text-[9px]">ENGINE ECU</div>
            <div className="text-paper font-semibold text-[11px] sm:text-xs">{engineRPM} RPM (Safe)</div>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Arena */}
      <div className="relative w-full h-44 sm:h-56 bg-ink-950 border border-ink-600 rounded-md overflow-hidden p-3 sm:p-6 mb-6 flex items-center justify-between shadow-inner">
        {/* Connecting CAN bus wires */}
        <div className="absolute inset-x-8 sm:inset-x-12 top-1/2 -translate-y-1/2 h-1 bg-ink-700 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-trace/40 to-transparent animate-pulse" />
        </div>

        {/* Node 1: Untrusted Ingress (OBD-II Port) */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-14 h-16 sm:w-20 sm:h-20 rounded-md bg-ink-900 border-2 border-ink-600 flex flex-col items-center justify-center p-1 sm:p-2 shadow-lg">
            <FaLaptopCode className="text-paper-muted text-base sm:text-xl mb-0.5 sm:mb-1" />
            <span className="font-mono text-[8px] sm:text-[9px] text-paper font-bold text-center leading-tight">
              OBD-II
            </span>
            <span className="text-[7px] sm:text-[8px] font-mono text-paper-dim">Untrusted</span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-mono text-paper-dim mt-1.5">Source</span>
        </div>

        {/* Animated Traveling Packet Ball */}
        <AnimatePresence>
          {stage !== 'IDLE' && (
            <motion.div
              className={`absolute top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-lg font-mono text-[8px] sm:text-[9px] font-bold ${
                packetType === 'NORMAL'
                  ? 'bg-trace text-ink-950 shadow-[0_0_15px_#4CC9F0]'
                  : 'bg-amber text-ink-950 shadow-[0_0_15px_#FF6B35]'
              }`}
              initial={{ left: '16%', scale: 0.8 }}
              animate={
                stage === 'TRANSMITTING'
                  ? { left: '46%', scale: 1 }
                  : stage === 'INSPECTING'
                  ? { left: '46%', scale: 1.2 }
                  : stage === 'DECIDED' && result === 'PASSED'
                  ? { left: '80%', scale: 1 }
                  : { left: '46%', y: -45, opacity: 0, scale: 0.3 }
              }
              transition={{ duration: stage === 'TRANSMITTING' ? 0.6 : 0.5, ease: 'easeInOut' }}
            >
              {packetType === 'NORMAL' ? '0x200' : '0x0C4'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Node 2: STM32 Dual-Gate Firewall Core */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`w-20 h-22 sm:w-28 sm:h-28 rounded-md border-2 flex flex-col items-center justify-center p-2 sm:p-3 shadow-xl transition-all ${
              stage === 'INSPECTING'
                ? 'border-trace bg-trace/10 shadow-[0_0_25px_rgba(76,201,240,0.3)]'
                : result === 'BLOCKED'
                ? 'border-amber bg-amber/15 shadow-[0_0_25px_rgba(255,107,53,0.4)]'
                : 'border-ink-600 bg-ink-900'
            }`}
          >
            <FaShieldAlt
              className={`text-lg sm:text-2xl mb-0.5 sm:mb-1 transition-colors ${
                stage === 'INSPECTING'
                  ? 'text-trace animate-pulse'
                  : result === 'BLOCKED'
                  ? 'text-amber'
                  : 'text-trace'
              }`}
            />
            <span className="font-mono text-[8px] sm:text-[10px] text-paper font-bold text-center leading-tight">
              FIREWALL
            </span>
            <span className="text-[7px] sm:text-[8px] font-mono text-trace">STM32F446</span>
            <span className="text-[7px] sm:text-[8px] font-mono text-paper-dim mt-0.5 hidden sm:block">5.92 µs Latency</span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-mono text-paper-dim mt-1.5">Dual Gate</span>
        </div>

        {/* Node 3: Safety-Critical Vehicle ECUs */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`w-14 h-16 sm:w-20 sm:h-20 rounded-md border-2 flex flex-col items-center justify-center p-1 sm:p-2 shadow-lg transition-all ${
              result === 'PASSED'
                ? 'border-green-500 bg-green-500/15 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                : 'border-ink-600 bg-ink-900'
            }`}
          >
            <FaCar className="text-paper-muted text-base sm:text-xl mb-0.5 sm:mb-1" />
            <span className="font-mono text-[8px] sm:text-[9px] text-paper font-bold text-center leading-tight">
              ECUs
            </span>
            <span className="text-[7px] sm:text-[8px] font-mono text-green-400">Protected</span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-mono text-paper-dim mt-1.5">Engine/Brake</span>
        </div>
      </div>

      {/* Decision Status Bar */}
      <div className="mb-6">
        <AnimatePresence mode="wait">
          {stage === 'INSPECTING' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-2.5 sm:p-3 bg-trace/10 border border-trace/40 rounded-sm font-mono text-xs text-trace flex flex-col sm:flex-row sm:items-center justify-between gap-1"
            >
              <span>Inspecting packet: Gate 1 Allowlist + Gate 2 Mahalanobis...</span>
              <span className="font-bold">5.92 µs</span>
            </motion.div>
          )}

          {result === 'PASSED' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-2.5 sm:p-3 bg-green-500/15 border border-green-500/40 rounded-sm font-mono text-xs text-green-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1 shadow-md"
            >
              <div className="flex items-center gap-2">
                <FaCheck />
                <span>PACKET DELIVERED: Verified telemetry passed to engine bus.</span>
              </div>
              <span className="font-bold">Pass: 99.4%</span>
            </motion.div>
          )}

          {result === 'BLOCKED' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-2.5 sm:p-3 bg-amber/15 border border-amber/50 rounded-sm font-mono text-xs text-amber flex flex-col sm:flex-row sm:items-center justify-between gap-1 shadow-md"
            >
              <div className="flex items-center gap-2">
                <FaTimes />
                <span>ATTACK BLOCKED: Malicious spoof deflected. Engine safe!</span>
              </div>
              <span className="font-bold">Drop: 99.9%</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Buttons */}
      <div className="grid sm:grid-cols-3 gap-3">
        {/* Send Normal Telemetry */}
        <button
          onClick={() => sendPacket('NORMAL')}
          disabled={stage === 'TRANSMITTING' || stage === 'INSPECTING'}
          className="py-2.5 sm:py-3 px-4 rounded-sm font-mono text-xs font-semibold bg-trace text-ink-950 hover:shadow-[0_0_20px_rgba(76,201,240,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <FaPlay className="text-[10px]" />
          <span>SEND NORMAL TELEMETRY</span>
        </button>

        {/* Inject Spoof Attack */}
        <button
          onClick={() => sendPacket('SPOOF')}
          disabled={stage === 'TRANSMITTING' || stage === 'INSPECTING'}
          className="py-2.5 sm:py-3 px-4 rounded-sm font-mono text-xs font-semibold bg-amber text-white dark:text-ink-950 hover:shadow-[0_0_20px_rgba(255,107,53,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <FaShieldAlt className="text-[10px]" />
          <span>INJECT SPOOF ATTACK</span>
        </button>

        {/* Reset */}
        <button
          onClick={reset}
          className="py-2.5 sm:py-3 px-4 rounded-sm font-mono text-xs border border-ink-600 bg-ink-950/60 text-paper-dim hover:text-paper hover:border-paper-dim transition-colors flex items-center justify-center gap-2"
        >
          <FaUndo className="text-[10px]" />
          <span>RESET PIPELINE</span>
        </button>
      </div>
    </div>
  );
}
