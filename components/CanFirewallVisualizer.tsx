'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaShieldAlt,
  FaCar,
  FaLaptopCode,
  FaCheck,
  FaTimes,
  FaPlay,
  FaUndo,
  FaBug,
  FaSkull,
  FaExclamationTriangle,
  FaMicrochip,
  FaBolt,
  FaSitemap,
  FaProjectDiagram,
  FaLayerGroup,
} from 'react-icons/fa';

export type AttackScenario =
  | 'NORMAL_TELEMETRY'
  | 'SPOOF_RPM'
  | 'FUZZ_ATTACK'
  | 'DOS_FLOOD'
  | 'DIRECTION_VIOLATION';

interface ScenarioConfig {
  id: AttackScenario;
  title: string;
  badge: string;
  frameId: string;
  payload: string;
  sourceNode: string;
  sourceType: 'TRUSTED' | 'COMPROMISED';
  sourceDesc: string;
  gate1: {
    passed: boolean;
    reason: string;
    idMatch: boolean;
    directionMatch: boolean;
    dlcMatch: boolean;
    rateLimitMatch: boolean;
  };
  gate2: {
    evaluated: boolean;
    passed: boolean;
    distance: number;
    threshold: number;
    reason: string;
  };
  treeStopNode: 'DIRECTION_FAIL' | 'ID_FAIL' | 'JITTER_FAIL' | 'GATE2_FAIL' | 'FORWARD_PASS';
  latency: string;
  finalDecision: 'PASSED' | 'BLOCKED';
  actionSummary: string;
}

const SCENARIOS: Record<AttackScenario, ScenarioConfig> = {
  NORMAL_TELEMETRY: {
    id: 'NORMAL_TELEMETRY',
    title: 'Valid Wheel Speed Telemetry',
    badge: 'Legitimate Frame',
    frameId: '0x200',
    payload: '3F 01 40 01 00 00 00 00',
    sourceNode: 'Sensor Hub ECU',
    sourceType: 'TRUSTED',
    sourceDesc: 'Internal Authenticated Powertrain Bus',
    gate1: {
      passed: true,
      reason: 'ID in whitelist, correct internal ingress interface, DLC=8 valid.',
      idMatch: true,
      directionMatch: true,
      dlcMatch: true,
      rateLimitMatch: true,
    },
    gate2: {
      evaluated: true,
      passed: true,
      distance: 1.14,
      threshold: 4.2,
      reason: 'Mahalanobis distance DM=1.14 ≤ 4.2. Statistical distribution nominal.',
    },
    treeStopNode: 'FORWARD_PASS',
    latency: '0.82 µs',
    finalDecision: 'PASSED',
    actionSummary: 'Forwarded to Engine/Brake ECUs without jitter.',
  },
  SPOOF_RPM: {
    id: 'SPOOF_RPM',
    title: 'RPM Spoofing (Gate 2 Anomaly)',
    badge: 'Crafted Anomaly',
    frameId: '0x0C4',
    payload: 'FF FF 21 00 00 00 00 00',
    sourceNode: 'Compromised OBD-II Port',
    sourceType: 'COMPROMISED',
    sourceDesc: 'Rogue Dongle Mimicking Engine Broadcast',
    gate1: {
      passed: true,
      reason: 'ID 0x0C4 is allowed, DLC=8 matches.',
      idMatch: true,
      directionMatch: true,
      dlcMatch: true,
      rateLimitMatch: true,
    },
    gate2: {
      evaluated: true,
      passed: false,
      distance: 14.82,
      threshold: 4.2,
      reason: 'DM=14.82 > 4.2! Covariance matrix variance anomaly detected in payload distribution.',
    },
    treeStopNode: 'GATE2_FAIL',
    latency: '5.92 µs',
    finalDecision: 'BLOCKED',
    actionSummary: 'Gate 2 Intercepted: Injected RPM spike deflected. Engine bus safe!',
  },
  FUZZ_ATTACK: {
    id: 'FUZZ_ATTACK',
    title: 'Diagnostic Fuzzing (Gate 1 Block)',
    badge: 'Malformed ID',
    frameId: '0x7DF',
    payload: 'AA BB CC DD EE',
    sourceNode: 'Rogue Diagnostic Fuzzer',
    sourceType: 'COMPROMISED',
    sourceDesc: 'External Attack Hardware Sweeping IDs',
    gate1: {
      passed: false,
      reason: 'ID 0x7DF not on powertrain whitelist; DLC=5 mismatch (expected 8).',
      idMatch: false,
      directionMatch: true,
      dlcMatch: false,
      rateLimitMatch: true,
    },
    gate2: {
      evaluated: false,
      passed: false,
      distance: 0,
      threshold: 4.2,
      reason: 'Skipped (Fast drop at Gate 1 static policy).',
    },
    treeStopNode: 'ID_FAIL',
    latency: '0.45 µs',
    finalDecision: 'BLOCKED',
    actionSummary: 'Gate 1 Fast Drop: Unauthorized diagnostic frame discarded in 0.45µs.',
  },
  DOS_FLOOD: {
    id: 'DOS_FLOOD',
    title: 'High-Rate DoS Bus Flooding',
    badge: 'Jitter/Flood Attack',
    frameId: '0x000',
    payload: '00 00 00 00 00 00 00 00',
    sourceNode: 'Compromised Node (DoS)',
    sourceType: 'COMPROMISED',
    sourceDesc: 'Bus Arbitration Contention Generator',
    gate1: {
      passed: false,
      reason: 'Timer window violated: Frame interval Δt=42µs < Min 500µs limit.',
      idMatch: true,
      directionMatch: true,
      dlcMatch: true,
      rateLimitMatch: false,
    },
    gate2: {
      evaluated: false,
      passed: false,
      distance: 0,
      threshold: 4.2,
      reason: 'Skipped (Rate limiter triggered at Gate 1).',
    },
    treeStopNode: 'JITTER_FAIL',
    latency: '0.38 µs',
    finalDecision: 'BLOCKED',
    actionSummary: 'Gate 1 Rate Limiter: DoS burst dropped, preserving bus bandwidth.',
  },
  DIRECTION_VIOLATION: {
    id: 'DIRECTION_VIOLATION',
    title: 'Steer Hijack over Infotainment',
    badge: 'Direction Violation',
    frameId: '0x180',
    payload: '02 FC 00 14 00 00 00 00',
    sourceNode: 'Compromised Gateway',
    sourceType: 'COMPROMISED',
    sourceDesc: 'Infotainment Bridge Ingress Injected',
    gate1: {
      passed: false,
      reason: 'Directional Policy Violation: 0x180 (Steering) only permitted from DBW Controller.',
      idMatch: true,
      directionMatch: false,
      dlcMatch: true,
      rateLimitMatch: true,
    },
    gate2: {
      evaluated: false,
      passed: false,
      distance: 0,
      threshold: 4.2,
      reason: 'Skipped (Blocked at Gate 1 directional barrier).',
    },
    treeStopNode: 'DIRECTION_FAIL',
    latency: '0.52 µs',
    finalDecision: 'BLOCKED',
    actionSummary: 'Gate 1 Direction Filter: Prevented rogue steering override command.',
  },
};

export default function CanFirewallVisualizer() {
  const [selectedScenario, setSelectedScenario] = useState<AttackScenario>('NORMAL_TELEMETRY');
  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'DECISION_TREE'>('PIPELINE');
  const [stage, setStage] = useState<'IDLE' | 'TRANSMITTING' | 'GATE1' | 'GATE2' | 'DECIDED'>('IDLE');
  const [engineRPM, setEngineRPM] = useState(2800);
  const [stats, setStats] = useState({ passed: 142, blocked: 28 });
  const [runId, setRunId] = useState(0);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  const active = SCENARIOS[selectedScenario];

  const clearAllTimeouts = () => {
    timeoutRefs.current.forEach((t) => clearTimeout(t));
    timeoutRefs.current = [];
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  const triggerRun = (scenarioKey: AttackScenario) => {
    clearAllTimeouts();
    setSelectedScenario(scenarioKey);
    const config = SCENARIOS[scenarioKey];
    setRunId((prev) => prev + 1);
    setStage('TRANSMITTING');

    // Step 1: Transmit along CAN wire from Node 1 (12%) to Firewall Node 2 (50%) in 0.7s
    const t1 = setTimeout(() => {
      setStage('GATE1');

      // Step 2: Gate 1 Inspection (0.6s)
      const t2 = setTimeout(() => {
        if (!config.gate1.passed) {
          // Blocked at Gate 1
          setStage('DECIDED');
          setStats((prev) => ({ ...prev, blocked: prev.blocked + 1 }));
        } else {
          // Passed Gate 1, proceed to Gate 2
          setStage('GATE2');

          // Step 3: Gate 2 Mahalanobis Anomaly Inspection (0.7s)
          const t3 = setTimeout(() => {
            setStage('DECIDED');
            if (config.finalDecision === 'PASSED') {
              setEngineRPM(3200);
              setStats((prev) => ({ ...prev, passed: prev.passed + 1 }));
              const t4 = setTimeout(() => setEngineRPM(2800), 2500);
              timeoutRefs.current.push(t4);
            } else {
              setStats((prev) => ({ ...prev, blocked: prev.blocked + 1 }));
            }
          }, 700);
          timeoutRefs.current.push(t3);
        }
      }, 600);
      timeoutRefs.current.push(t2);
    }, 700);
    timeoutRefs.current.push(t1);
  };

  const resetPipeline = () => {
    clearAllTimeouts();
    setStage('IDLE');
    setEngineRPM(2800);
  };

  return (
    <div className="bg-ink-900 border border-ink-600 rounded-md p-5 sm:p-8 shadow-xl">
      {/* Header & Specs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-trace uppercase tracking-wider font-semibold">
              STM32F446RE · Dual-Gate Real-Time IPS
            </span>
            <span className="bg-trace/15 text-trace border border-trace/30 text-[9px] font-mono px-1.5 py-0.5 rounded-xs">
              5.92 µs Latency
            </span>
          </div>
          <h3 className="font-display font-semibold text-xl sm:text-2xl text-paper">
            CAN Bus Hardware Firewall &amp; Decision Tree Engine
          </h3>
          <p className="text-paper-muted text-xs font-mono mt-0.5">
            Simulate live automotive attacks and observe multi-stage Gate 1 &amp; Gate 2 hardware inspection paths.
          </p>
        </div>

        {/* View Switcher & Live Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-ink-950 p-1 rounded-sm border border-ink-600 flex items-center gap-1 font-mono text-xs">
            <button
              onClick={() => setActiveTab('PIPELINE')}
              className={`px-3 py-1 rounded-xs transition-colors flex items-center gap-1.5 ${
                activeTab === 'PIPELINE'
                  ? 'bg-trace text-ink-950 font-semibold'
                  : 'text-paper-muted hover:text-paper'
              }`}
            >
              <FaLayerGroup size={11} />
              <span>Live Pipeline</span>
            </button>
            <button
              onClick={() => setActiveTab('DECISION_TREE')}
              className={`px-3 py-1 rounded-xs transition-colors flex items-center gap-1.5 ${
                activeTab === 'DECISION_TREE'
                  ? 'bg-amber text-white dark:text-ink-950 font-semibold'
                  : 'text-paper-muted hover:text-paper'
              }`}
            >
              <FaProjectDiagram size={11} />
              <span>Decision Tree</span>
            </button>
          </div>

          <div className="bg-ink-950 px-3 py-1.5 rounded-sm border border-ink-600 font-mono text-xs flex items-center gap-2.5">
            <FaCar className="text-trace text-sm" />
            <div>
              <div className="text-paper-dim text-[9px]">ENGINE ECU</div>
              <div className="text-paper font-semibold text-xs">{engineRPM} RPM</div>
            </div>
          </div>

          <div className="bg-ink-950 px-3 py-1.5 rounded-sm border border-ink-600 font-mono text-xs flex items-center gap-2.5">
            <FaShieldAlt className="text-amber text-sm" />
            <div>
              <div className="text-paper-dim text-[9px]">DEFLECTED</div>
              <div className="text-amber font-semibold text-xs">{stats.blocked} Attacks</div>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: Live Hardware Pipeline Arena */}
      {activeTab === 'PIPELINE' && (
        <div className="space-y-6">
          <div className="relative w-full h-48 sm:h-56 bg-ink-950 border border-ink-600 rounded-md overflow-hidden p-3 sm:p-6 flex items-center justify-between shadow-inner select-none">
            {/* Connecting CAN Differential Bus Lines */}
            <div className="absolute inset-x-10 sm:inset-x-16 top-1/2 -translate-y-1/2 h-1 bg-ink-700 z-0">
              <div
                className={`absolute inset-0 transition-opacity duration-300 ${
                  stage === 'TRANSMITTING' || stage === 'GATE1' || stage === 'GATE2'
                    ? 'opacity-100 bg-gradient-to-r from-trace via-amber to-trace animate-pulse'
                    : 'opacity-30 bg-ink-600'
                }`}
              />
            </div>

            {/* Node 1: Dynamic Source Transmitter */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-16 h-20 sm:w-24 sm:h-24 rounded-md border-2 flex flex-col items-center justify-center p-2 shadow-lg transition-all ${
                  active.sourceType === 'COMPROMISED'
                    ? 'border-red-500 bg-red-950/40 shadow-[0_0_20px_rgba(239,68,68,0.35)]'
                    : 'border-trace bg-trace/10 shadow-[0_0_20px_rgba(76,201,240,0.25)]'
                }`}
              >
                {active.sourceType === 'COMPROMISED' ? (
                  <FaSkull className="text-red-400 text-lg sm:text-2xl mb-1 animate-pulse" />
                ) : (
                  <FaLaptopCode className="text-trace text-lg sm:text-2xl mb-1" />
                )}
                <span className="font-mono text-[8px] sm:text-[10px] text-paper font-bold text-center leading-tight">
                  {active.sourceNode}
                </span>
                <span
                  className={`text-[7px] sm:text-[8px] font-mono mt-0.5 font-semibold ${
                    active.sourceType === 'COMPROMISED' ? 'text-red-400' : 'text-green-400'
                  }`}
                >
                  {active.sourceType === 'COMPROMISED' ? 'ROGUE INJECTION' : 'TRUSTED SENSOR'}
                </span>
              </div>
              <span className="text-[9px] font-mono text-paper-dim mt-1.5">Origin Node</span>
            </div>

            {/* Animated Traveling CAN Frame starting cleanly at Origin Node 1 (12%) */}
            <AnimatePresence mode="wait">
              {stage !== 'IDLE' && (
                <motion.div
                  key={`packet-${selectedScenario}-${runId}`}
                  className={`absolute top-1/2 -translate-y-1/2 z-20 px-2.5 py-1 rounded-sm flex items-center gap-1.5 shadow-xl font-mono text-[9px] sm:text-[10px] font-bold border ${
                    active.sourceType === 'COMPROMISED'
                      ? 'bg-red-500 text-white border-red-300 shadow-[0_0_20px_rgba(239,68,68,0.6)]'
                      : 'bg-trace text-ink-950 border-white shadow-[0_0_20px_rgba(76,201,240,0.6)]'
                  }`}
                  initial={{ left: '12%', scale: 0.65, opacity: 0 }}
                  animate={
                    stage === 'TRANSMITTING'
                      ? { left: '50%', scale: 1, opacity: 1 }
                      : stage === 'GATE1' || stage === 'GATE2'
                      ? { left: '50%', scale: 1.15, opacity: 1 }
                      : stage === 'DECIDED' && active.finalDecision === 'PASSED'
                      ? { left: '88%', scale: 1, opacity: 1 }
                      : { left: '50%', y: -45, opacity: 0, scale: 0.3 }
                  }
                  transition={{
                    duration: stage === 'TRANSMITTING' ? 0.7 : stage === 'DECIDED' ? 0.6 : 0.4,
                    ease: 'easeInOut',
                  }}
                  style={{ transform: 'translate(-50%, -50%)' }}
                >
                  <FaBolt className="text-[8px]" />
                  <span>{active.frameId}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Node 2: STM32 Dual-Gate Firewall Core */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-24 h-24 sm:w-32 sm:h-32 rounded-md border-2 flex flex-col items-center justify-center p-2.5 sm:p-3 shadow-2xl transition-all ${
                  stage === 'GATE1'
                    ? 'border-trace bg-trace/15 shadow-[0_0_30px_rgba(76,201,240,0.4)]'
                    : stage === 'GATE2'
                    ? 'border-amber bg-amber/15 shadow-[0_0_30px_rgba(255,107,53,0.45)]'
                    : stage === 'DECIDED' && active.finalDecision === 'BLOCKED'
                    ? 'border-red-500 bg-red-950/40 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                    : stage === 'DECIDED' && active.finalDecision === 'PASSED'
                    ? 'border-green-500 bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.3)]'
                    : 'border-ink-600 bg-ink-900'
                }`}
              >
                <FaShieldAlt
                  className={`text-xl sm:text-3xl mb-1 transition-colors ${
                    stage === 'GATE1'
                      ? 'text-trace animate-pulse'
                      : stage === 'GATE2'
                      ? 'text-amber animate-pulse'
                      : stage === 'DECIDED' && active.finalDecision === 'BLOCKED'
                      ? 'text-red-400'
                      : stage === 'DECIDED' && active.finalDecision === 'PASSED'
                      ? 'text-green-400'
                      : 'text-trace'
                  }`}
                />
                <span className="font-mono text-[9px] sm:text-[11px] text-paper font-bold text-center leading-tight">
                  FIREWALL CORE
                </span>
                <span className="text-[8px] font-mono text-trace">STM32F446RE</span>
                <span className="text-[7px] font-mono text-paper-dim mt-0.5">Dual Gate IPS</span>
              </div>
              <span className="text-[9px] font-mono text-paper-dim mt-1.5">Hardware Arbiter</span>
            </div>

            {/* Node 3: Safety-Critical Vehicle ECUs */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-16 h-20 sm:w-24 sm:h-24 rounded-md border-2 flex flex-col items-center justify-center p-2 shadow-lg transition-all ${
                  stage === 'DECIDED' && active.finalDecision === 'PASSED'
                    ? 'border-green-500 bg-green-500/20 shadow-[0_0_25px_rgba(34,197,94,0.4)]'
                    : 'border-ink-600 bg-ink-900'
                }`}
              >
                <FaCar className="text-paper-muted text-lg sm:text-2xl mb-1" />
                <span className="font-mono text-[8px] sm:text-[10px] text-paper font-bold text-center leading-tight">
                  ENGINE / BRAKE
                </span>
                <span
                  className={`text-[7px] sm:text-[8px] font-mono mt-0.5 font-semibold ${
                    stage === 'DECIDED' && active.finalDecision === 'PASSED'
                      ? 'text-green-400'
                      : 'text-paper-dim'
                  }`}
                >
                  PROTECTED BUS
                </span>
              </div>
              <span className="text-[9px] font-mono text-paper-dim mt-1.5">Actuators</span>
            </div>
          </div>

          {/* Real-Time Dual-Gate Decision Breakdown Panel */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Gate 1: Static Policy Engine */}
            <div
              className={`p-4 rounded-md border transition-all ${
                stage === 'GATE1'
                  ? 'border-trace bg-trace/10'
                  : stage === 'DECIDED' && !active.gate1.passed
                  ? 'border-red-500/80 bg-red-950/20'
                  : 'border-ink-600 bg-ink-950/60'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-ink-600/70 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-trace" />
                  <span className="font-mono text-xs font-semibold text-paper">
                    Gate 1: Static Policy &amp; Rate Engine
                  </span>
                </div>
                <span className="font-mono text-[10px] text-trace">0.82 µs Exec</span>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-paper-muted">1. Directional Ingress:</span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      stage === 'IDLE' || stage === 'TRANSMITTING'
                        ? 'text-paper-dim'
                        : active.gate1.directionMatch
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {stage === 'IDLE' || stage === 'TRANSMITTING' ? (
                      '...'
                    ) : active.gate1.directionMatch ? (
                      <>
                        <FaCheck size={10} /> VALID INTERFACE
                      </>
                    ) : (
                      <>
                        <FaTimes size={10} /> PORT VIOLATION
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-paper-muted">2. ID Whitelist Match:</span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      stage === 'IDLE' || stage === 'TRANSMITTING'
                        ? 'text-paper-dim'
                        : active.gate1.idMatch
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {stage === 'IDLE' || stage === 'TRANSMITTING' ? (
                      '...'
                    ) : active.gate1.idMatch ? (
                      <>
                        <FaCheck size={10} /> MATCH ({active.frameId})
                      </>
                    ) : (
                      <>
                        <FaTimes size={10} /> UNKNOWN ID
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-paper-muted">3. DLC Payload Length:</span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      stage === 'IDLE' || stage === 'TRANSMITTING'
                        ? 'text-paper-dim'
                        : active.gate1.dlcMatch
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {stage === 'IDLE' || stage === 'TRANSMITTING' ? (
                      '...'
                    ) : active.gate1.dlcMatch ? (
                      <>
                        <FaCheck size={10} /> DLC=8 BYTES
                      </>
                    ) : (
                      <>
                        <FaTimes size={10} /> MALFORMED DLC
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-paper-muted">4. Jitter / Rate Limiter:</span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      stage === 'IDLE' || stage === 'TRANSMITTING'
                        ? 'text-paper-dim'
                        : active.gate1.rateLimitMatch
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {stage === 'IDLE' || stage === 'TRANSMITTING' ? (
                      '...'
                    ) : active.gate1.rateLimitMatch ? (
                      <>
                        <FaCheck size={10} /> Δt &gt; 500µs (OK)
                      </>
                    ) : (
                      <>
                        <FaTimes size={10} /> FLOOD / DoS BURST
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Gate 2: Mahalanobis Anomaly Engine */}
            <div
              className={`p-4 rounded-md border transition-all ${
                stage === 'GATE2'
                  ? 'border-amber bg-amber/10'
                  : stage === 'DECIDED' && active.gate1.passed && !active.gate2.passed
                  ? 'border-red-500/80 bg-red-950/20'
                  : 'border-ink-600 bg-ink-950/60'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-ink-600/70 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber" />
                  <span className="font-mono text-xs font-semibold text-paper">
                    Gate 2: Mahalanobis Distance Engine
                  </span>
                </div>
                <span className="font-mono text-[10px] text-amber">5.92 µs SIMD</span>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-paper-muted">Evaluation Status:</span>
                  <span className="font-semibold text-paper">
                    {stage === 'IDLE' || stage === 'TRANSMITTING' || stage === 'GATE1'
                      ? 'Waiting Gate 1'
                      : active.gate2.evaluated
                      ? 'Active SIMD Math'
                      : 'Fast-Skipped (Gate 1 Dropped)'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-paper-muted">Anomaly Distance (DM):</span>
                  <span
                    className={`font-semibold ${
                      stage === 'DECIDED'
                        ? active.gate2.passed
                          ? 'text-green-400'
                          : 'text-red-400'
                        : 'text-paper-dim'
                    }`}
                  >
                    {stage === 'DECIDED' && active.gate2.evaluated
                      ? `DM = ${active.gate2.distance.toFixed(2)}`
                      : 'DM = ...'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-paper-muted">Safety Threshold (τ):</span>
                  <span className="font-semibold text-amber">τ = 4.20 (99% Confidence)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-paper-muted">Covariance Classification:</span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      stage === 'DECIDED'
                        ? active.gate2.passed
                          ? 'text-green-400'
                          : 'text-red-400'
                        : 'text-paper-dim'
                    }`}
                  >
                    {stage === 'DECIDED' && active.gate2.evaluated ? (
                      active.gate2.passed ? (
                        <>
                          <FaCheck size={10} /> STATISTICAL INLIER
                        </>
                      ) : (
                        <>
                          <FaTimes size={10} /> OUTLIER ANOMALY
                        </>
                      )
                    ) : (
                      '...'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Interactive Decision Tree & Architecture Diagram */}
      {activeTab === 'DECISION_TREE' && (
        <div className="bg-ink-950 border border-ink-600 rounded-md p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between pb-3 border-b border-ink-600/70 mb-5">
            <div className="flex items-center gap-2">
              <FaSitemap className="text-amber" />
              <span className="font-mono text-xs font-semibold text-paper uppercase tracking-wider">
                Hierarchical Dual-Gate Arbitration Flowchart
              </span>
            </div>
            <span className="font-mono text-[10px] text-trace">
              Live Path: <span className="font-semibold text-paper">{active.title}</span>
            </span>
          </div>

          {/* Hierarchical Decision Flow Chart */}
          <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto font-mono text-xs">
            {/* Step 0: Ingress CAN Frame Arrival */}
            <div className="w-full bg-ink-900 border border-trace/60 rounded-md p-3 text-center shadow-md">
              <div className="text-[10px] text-trace font-semibold">STEP 0 · INGRESS ARRIVAL</div>
              <div className="font-bold text-paper text-sm mt-0.5">
                CAN Frame [{active.frameId}] Payload ({active.payload})
              </div>
              <div className="text-[10px] text-paper-dim mt-0.5">
                Source: {active.sourceNode} · {active.sourceDesc}
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="w-0.5 h-4 bg-ink-600" />

            {/* Step 1: Directional Policy */}
            <div className="w-full grid sm:grid-cols-3 gap-3 items-center">
              <div
                className={`sm:col-span-2 p-3 rounded-md border transition-all ${
                  active.treeStopNode === 'DIRECTION_FAIL'
                    ? 'border-red-500 bg-red-950/30'
                    : 'border-ink-600 bg-ink-900/80'
                }`}
              >
                <div className="text-[10px] text-paper-dim">GATE 1.1 · DIRECTIONAL ENFORCEMENT</div>
                <div className="font-semibold text-paper">Is ingress interface authorized for ID {active.frameId}?</div>
              </div>
              <div
                className={`p-2.5 rounded-sm border text-center font-bold text-[11px] ${
                  active.treeStopNode === 'DIRECTION_FAIL'
                    ? 'border-red-500 bg-red-500/20 text-red-400'
                    : 'border-ink-600 text-paper-dim bg-ink-950'
                }`}
              >
                {active.treeStopNode === 'DIRECTION_FAIL' ? '❌ DROP: Port Violation (0.52µs)' : 'Pass ➔'}
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="w-0.5 h-4 bg-ink-600" />

            {/* Step 2: ID Whitelist & DLC Check */}
            <div className="w-full grid sm:grid-cols-3 gap-3 items-center">
              <div
                className={`sm:col-span-2 p-3 rounded-md border transition-all ${
                  active.treeStopNode === 'ID_FAIL'
                    ? 'border-red-500 bg-red-950/30'
                    : 'border-ink-600 bg-ink-900/80'
                }`}
              >
                <div className="text-[10px] text-paper-dim">GATE 1.2 · WHITELIST &amp; DLC SYNTAX</div>
                <div className="font-semibold text-paper">Is ID in Flash Hash Table &amp; DLC = 8 Bytes?</div>
              </div>
              <div
                className={`p-2.5 rounded-sm border text-center font-bold text-[11px] ${
                  active.treeStopNode === 'ID_FAIL'
                    ? 'border-red-500 bg-red-500/20 text-red-400'
                    : 'border-ink-600 text-paper-dim bg-ink-950'
                }`}
              >
                {active.treeStopNode === 'ID_FAIL' ? '❌ DROP: Unknown/Fuzz (0.45µs)' : 'Pass ➔'}
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="w-0.5 h-4 bg-ink-600" />

            {/* Step 3: Rate Limiter / Jitter */}
            <div className="w-full grid sm:grid-cols-3 gap-3 items-center">
              <div
                className={`sm:col-span-2 p-3 rounded-md border transition-all ${
                  active.treeStopNode === 'JITTER_FAIL'
                    ? 'border-red-500 bg-red-950/30'
                    : 'border-ink-600 bg-ink-900/80'
                }`}
              >
                <div className="text-[10px] text-paper-dim">GATE 1.3 · HARDWARE TIMER RATE LIMITER</div>
                <div className="font-semibold text-paper">Inter-frame arrival Δt ≥ 500µs (No DoS Burst)?</div>
              </div>
              <div
                className={`p-2.5 rounded-sm border text-center font-bold text-[11px] ${
                  active.treeStopNode === 'JITTER_FAIL'
                    ? 'border-red-500 bg-red-500/20 text-red-400'
                    : 'border-ink-600 text-paper-dim bg-ink-950'
                }`}
              >
                {active.treeStopNode === 'JITTER_FAIL' ? '❌ DROP: DoS Flood (0.38µs)' : 'Pass ➔'}
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="w-0.5 h-4 bg-ink-600" />

            {/* Step 4: Gate 2 Mahalanobis Anomaly Engine */}
            <div className="w-full grid sm:grid-cols-3 gap-3 items-center">
              <div
                className={`sm:col-span-2 p-3 rounded-md border transition-all ${
                  active.treeStopNode === 'GATE2_FAIL'
                    ? 'border-red-500 bg-red-950/30'
                    : active.treeStopNode === 'FORWARD_PASS'
                    ? 'border-green-500/60 bg-green-950/20'
                    : 'border-ink-600 bg-ink-900/80'
                }`}
              >
                <div className="text-[10px] text-amber font-semibold">GATE 2 · MAHALANOBIS DISTANCE (CMSIS-DSP)</div>
                <div className="font-semibold text-paper">
                  Calculate DM = √((x-μ)ᵀ Σ⁻¹ (x-μ)) ≤ τ=4.20?
                </div>
                <div className="text-[10px] text-paper-dim mt-0.5">
                  Evaluates 2D covariance: Payload variance + inter-arrival frequency jitter
                </div>
              </div>
              <div
                className={`p-2.5 rounded-sm border text-center font-bold text-[11px] ${
                  active.treeStopNode === 'GATE2_FAIL'
                    ? 'border-red-500 bg-red-500/20 text-red-400'
                    : active.treeStopNode === 'FORWARD_PASS'
                    ? 'border-green-500/50 bg-green-500/20 text-green-400'
                    : 'border-ink-600 text-paper-dim bg-ink-950'
                }`}
              >
                {active.treeStopNode === 'GATE2_FAIL' ? (
                  '❌ DROP: DM=14.82 (5.92µs)'
                ) : active.treeStopNode === 'FORWARD_PASS' ? (
                  'DM=1.14 ≤ 4.20 (Pass)'
                ) : (
                  'Skipped'
                )}
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="w-0.5 h-4 bg-ink-600" />

            {/* Step 5: Final Forwarding Destination */}
            <div
              className={`w-full p-3 rounded-md border text-center transition-all ${
                active.treeStopNode === 'FORWARD_PASS'
                  ? 'border-green-500 bg-green-950/30 shadow-[0_0_20px_rgba(34,197,94,0.25)]'
                  : 'border-ink-600 bg-ink-900/40 opacity-50'
              }`}
            >
              <div className="text-[10px] text-green-400 font-semibold">FINAL ARBITRATION RESULT</div>
              <div className="font-bold text-paper text-sm mt-0.5">
                {active.treeStopNode === 'FORWARD_PASS'
                  ? '✅ TRANSMITTED TO VEHICLE ENGINE & BRAKE ECUs (0.82 µs)'
                  : '⛔ DEFLECTED BY FIREWALL — ECUs NEVER COMPROMISED'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decision Summary Banner */}
      <div className="mb-6">
        <AnimatePresence mode="wait">
          {stage === 'DECIDED' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-3 sm:p-4 rounded-sm font-mono text-xs border shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                active.finalDecision === 'PASSED'
                  ? 'bg-green-500/15 border-green-500/60 text-green-400'
                  : 'bg-red-500/20 border-red-500/70 text-red-300'
              }`}
            >
              <div className="flex items-start sm:items-center gap-2.5">
                {active.finalDecision === 'PASSED' ? (
                  <FaCheck className="text-sm shrink-0 text-green-400 mt-0.5 sm:mt-0" />
                ) : (
                  <FaShieldAlt className="text-base shrink-0 text-red-400 mt-0.5 sm:mt-0" />
                )}
                <div>
                  <span className="font-bold uppercase tracking-wider block sm:inline mr-2">
                    {active.finalDecision === 'PASSED'
                      ? 'PACKET FORWARDED (0.82 µs)'
                      : `ATTACK DEFLECTED (${active.latency})`}
                  </span>
                  <span>{active.actionSummary}</span>
                </div>
              </div>

              <div className="font-bold whitespace-nowrap bg-ink-950/80 px-2.5 py-1 rounded-xs border border-ink-600 self-start sm:self-auto">
                {active.finalDecision === 'PASSED' ? 'Gate 1 & 2 Clear' : active.gate1.passed ? 'Gate 2 Drop' : 'Gate 1 Drop'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scenario Attack Launchers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-paper-dim uppercase tracking-wider font-semibold">
            Select Test Scenario to Inject:
          </span>
          <button
            onClick={resetPipeline}
            className="font-mono text-[11px] text-paper-muted hover:text-paper flex items-center gap-1.5 transition-colors"
          >
            <FaUndo size={10} /> Reset
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {/* Scenario 1: Normal Telemetry */}
          <button
            onClick={() => triggerRun('NORMAL_TELEMETRY')}
            disabled={stage !== 'IDLE' && stage !== 'DECIDED'}
            className={`p-3 rounded-sm border text-left transition-all font-mono disabled:opacity-50 ${
              selectedScenario === 'NORMAL_TELEMETRY'
                ? 'bg-trace/15 border-trace text-paper shadow-md'
                : 'bg-ink-950 border-ink-600/70 text-paper-dim hover:border-trace/60 hover:text-paper'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs text-trace flex items-center gap-1.5">
                <FaPlay size={9} /> Valid Telemetry
              </span>
              <span className="text-[9px] bg-trace/20 text-trace px-1 py-0.5 rounded-xs">
                Pass Both
              </span>
            </div>
            <div className="text-[10px] text-paper-muted leading-tight">
              0x200 Wheel Speed from authenticated internal sensor hub.
            </div>
          </button>

          {/* Scenario 2: RPM Spoofing */}
          <button
            onClick={() => triggerRun('SPOOF_RPM')}
            disabled={stage !== 'IDLE' && stage !== 'DECIDED'}
            className={`p-3 rounded-sm border text-left transition-all font-mono disabled:opacity-50 ${
              selectedScenario === 'SPOOF_RPM'
                ? 'bg-amber/20 border-amber text-paper shadow-md'
                : 'bg-ink-950 border-ink-600/70 text-paper-dim hover:border-amber/60 hover:text-paper'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs text-amber flex items-center gap-1.5">
                <FaSkull size={10} /> RPM Spoofing
              </span>
              <span className="text-[9px] bg-amber/20 text-amber px-1 py-0.5 rounded-xs">
                Gate 2 Anomaly
              </span>
            </div>
            <div className="text-[10px] text-paper-muted leading-tight">
              0x0C4 Valid ID spoofed, but flagged by Mahalanobis DM=14.82.
            </div>
          </button>

          {/* Scenario 3: Fuzzing Attack */}
          <button
            onClick={() => triggerRun('FUZZ_ATTACK')}
            disabled={stage !== 'IDLE' && stage !== 'DECIDED'}
            className={`p-3 rounded-sm border text-left transition-all font-mono disabled:opacity-50 ${
              selectedScenario === 'FUZZ_ATTACK'
                ? 'bg-red-500/20 border-red-500 text-paper shadow-md'
                : 'bg-ink-950 border-ink-600/70 text-paper-dim hover:border-red-500/60 hover:text-paper'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs text-red-400 flex items-center gap-1.5">
                <FaBug size={10} /> Diagnostic Fuzz
              </span>
              <span className="text-[9px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded-xs">
                Gate 1 Drop
              </span>
            </div>
            <div className="text-[10px] text-paper-muted leading-tight">
              0x7DF Diagnostic ID not allowed on powertrain bus; DLC=5 mismatch.
            </div>
          </button>

          {/* Scenario 4: DoS Flooding */}
          <button
            onClick={() => triggerRun('DOS_FLOOD')}
            disabled={stage !== 'IDLE' && stage !== 'DECIDED'}
            className={`p-3 rounded-sm border text-left transition-all font-mono disabled:opacity-50 ${
              selectedScenario === 'DOS_FLOOD'
                ? 'bg-purple-500/20 border-purple-500 text-paper shadow-md'
                : 'bg-ink-950 border-ink-600/70 text-paper-dim hover:border-purple-500/60 hover:text-paper'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs text-purple-400 flex items-center gap-1.5">
                <FaExclamationTriangle size={10} /> DoS Flood
              </span>
              <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1 py-0.5 rounded-xs">
                Rate Limiter
              </span>
            </div>
            <div className="text-[10px] text-paper-muted leading-tight">
              0x000 High-priority flood violating inter-arrival Δt &lt; 500µs.
            </div>
          </button>

          {/* Scenario 5: Direction Violation */}
          <button
            onClick={() => triggerRun('DIRECTION_VIOLATION')}
            disabled={stage !== 'IDLE' && stage !== 'DECIDED'}
            className={`p-3 rounded-sm border text-left transition-all font-mono disabled:opacity-50 sm:col-span-2 lg:col-span-2 ${
              selectedScenario === 'DIRECTION_VIOLATION'
                ? 'bg-amber/20 border-amber text-paper shadow-md'
                : 'bg-ink-950 border-ink-600/70 text-paper-dim hover:border-amber/60 hover:text-paper'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs text-amber flex items-center gap-1.5">
                <FaMicrochip size={10} /> Steer Hijack via Infotainment
              </span>
              <span className="text-[9px] bg-amber/20 text-amber px-1 py-0.5 rounded-xs">
                Direction Barrier
              </span>
            </div>
            <div className="text-[10px] text-paper-muted leading-tight">
              0x180 Steering actuation injected from infotainment gateway instead of DBW ECU.
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
