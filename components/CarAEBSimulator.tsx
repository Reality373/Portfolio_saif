'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlay,
  FaUndo,
  FaTachometerAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaShieldAlt,
} from 'react-icons/fa';

type SimState = 'IDLE' | 'ACCELERATING' | 'BRAKING' | 'STOPPED_SAFE' | 'CRASHED';

export default function CarAEBSimulator() {
  const [carX, setCarX] = useState(6.0); // % along track (6% = 0m start, 85% = 30m barrier)
  const [speed, setSpeed] = useState(0.0); // km/h (target peak: 30.0 km/h)
  const [distanceToBarrier, setDistanceToBarrier] = useState(30.0); // meters
  const [brakePressure, setBrakePressure] = useState(0); // PSI
  const [state, setState] = useState<SimState>('IDLE');
  const [aebEnabled, setAebEnabled] = useState(true);
  const [radarLocked, setRadarLocked] = useState(false);
  const [canLatency, setCanLatency] = useState<number | null>(null);

  // Physics simulation refs
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const physicsRef = useRef({
    carX: 6.0,
    speed: 0.0,
    state: 'IDLE' as SimState,
    aebEnabled: true,
    brakePressure: 0,
    brakeStartX: 54.0,
  });

  const TRACK_START_X = 6.0;
  const BARRIER_X = 85.0; // 85% is 30.0m from start (0m to barrier)
  const STOP_CLEARANCE_X = 68.7; // 68.7% is exactly 6.2m clearance before the barrier

  const stopSimulation = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    lastTimestampRef.current = null;
  }, []);

  const runSimulationStep = useCallback(
    (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }
      const dt = Math.min((timestamp - lastTimestampRef.current) / 1000, 0.04);
      lastTimestampRef.current = timestamp;

      const p = physicsRef.current;

      if (p.state === 'ACCELERATING') {
        // Smooth gradual acceleration from 0.0 up to 30.0 km/h
        p.speed = Math.min(30.0, p.speed + 22.0 * dt);
        p.brakePressure = 0;

        // Advance position according to speed
        p.carX += p.speed * 0.52 * dt;

        // Calculate remaining distance in meters
        const remainingFraction = Math.max(0, (BARRIER_X - p.carX) / (BARRIER_X - TRACK_START_X));
        const currentDistMeters = Math.max(0, remainingFraction * 30.0);

        // Radar perception lock at 12.0m distance (~53.4% track position)
        if (currentDistMeters <= 12.0 && p.aebEnabled) {
          p.state = 'BRAKING';
          p.brakeStartX = p.carX;
          setRadarLocked(true);
          setCanLatency(11.8);
          setState('BRAKING');
        } else if (p.carX >= BARRIER_X - 2.5 && !p.aebEnabled) {
          // Crash into barrier if AEB is disabled
          p.state = 'CRASHED';
          p.speed = 0;
          p.carX = BARRIER_X - 2.0;
          setState('CRASHED');
          setCarX(p.carX);
          setSpeed(0);
          setDistanceToBarrier(0.0);
          stopSimulation();
          return;
        }

        setCarX(p.carX);
        setSpeed(p.speed);
        setDistanceToBarrier(currentDistMeters);
        setBrakePressure(p.brakePressure);
      } else if (p.state === 'BRAKING') {
        // Build pneumatic pressure instantly up to 120 PSI
        p.brakePressure = Math.min(120, p.brakePressure + 450 * dt);

        // Calculate remaining fraction to the exact 6.2m stop line (STOP_CLEARANCE_X)
        const totalBrakingSpan = Math.max(1, STOP_CLEARANCE_X - p.brakeStartX);
        const remainingBrakingSpan = Math.max(0, STOP_CLEARANCE_X - p.carX);
        const brakingFraction = remainingBrakingSpan / totalBrakingSpan; // 1.0 -> 0.0

        if (brakingFraction <= 0.02 || p.carX >= STOP_CLEARANCE_X) {
          // Final exact halt at 6.2 meters with zero teleportation
          p.state = 'STOPPED_SAFE';
          p.speed = 0.0;
          p.carX = STOP_CLEARANCE_X;
          setState('STOPPED_SAFE');
          setCarX(STOP_CLEARANCE_X);
          setSpeed(0.0);
          setDistanceToBarrier(6.2);
          setBrakePressure(120);
          stopSimulation();
          return;
        }

        // Kinematic deceleration: velocity smoothly approaches 0.0 as distance approaches 6.2m
        const currentDecelSpeed = Math.max(0.4, 30.0 * Math.pow(brakingFraction, 0.65));
        p.speed = currentDecelSpeed;

        // Position advances smoothly without abrupt jumping
        p.carX += p.speed * 0.48 * dt;

        // Calculate exact live meters to barrier
        const remainingFraction = Math.max(0, (BARRIER_X - p.carX) / (BARRIER_X - TRACK_START_X));
        const currentDistMeters = Math.max(6.2, remainingFraction * 30.0);

        setCarX(p.carX);
        setSpeed(p.speed);
        setDistanceToBarrier(currentDistMeters);
        setBrakePressure(p.brakePressure);
      }

      if (p.state === 'ACCELERATING' || p.state === 'BRAKING') {
        animFrameRef.current = requestAnimationFrame(runSimulationStep);
      }
    },
    [stopSimulation]
  );

  const startTest = (enableAeb: boolean) => {
    stopSimulation();
    setAebEnabled(enableAeb);
    setRadarLocked(false);
    setCanLatency(null);
    setBrakePressure(0);
    setDistanceToBarrier(30.0);
    setCarX(TRACK_START_X);
    setSpeed(0.0);
    setState('ACCELERATING');

    physicsRef.current = {
      carX: TRACK_START_X,
      speed: 0.0,
      state: 'ACCELERATING',
      aebEnabled: enableAeb,
      brakePressure: 0,
      brakeStartX: 54.0,
    };

    lastTimestampRef.current = null;
    animFrameRef.current = requestAnimationFrame(runSimulationStep);
  };

  const resetTest = () => {
    stopSimulation();
    setState('IDLE');
    setCarX(TRACK_START_X);
    setSpeed(0.0);
    setDistanceToBarrier(30.0);
    setBrakePressure(0);
    setRadarLocked(false);
    setCanLatency(null);

    physicsRef.current = {
      carX: TRACK_START_X,
      speed: 0.0,
      state: 'IDLE',
      aebEnabled: true,
      brakePressure: 0,
      brakeStartX: 54.0,
    };
  };

  useEffect(() => {
    return () => {
      stopSimulation();
    };
  }, [stopSimulation]);

  return (
    <div className="bg-ink-900 border border-ink-600 rounded-md p-6 sm:p-8 shadow-xl">
      {/* Title & Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-amber uppercase tracking-wider font-semibold">
              Team Abhyuday Racing · aBAJA Autonomous BAJA 2026
            </span>
          </div>
          <h3 className="font-display font-semibold text-2xl text-paper">
            Autonomous Emergency Braking (AEB) Physics Simulation
          </h3>
          <p className="text-paper-muted text-xs font-mono mt-0.5">
            Jetson Orin radar perception + STM32 closed-loop pneumatic brake actuation (30 km/h limit).
          </p>
        </div>

        {/* Real-time Telemetry Gauges */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Speed HUD */}
          <div className="bg-ink-950 px-3 py-1.5 rounded-sm border border-ink-600 font-mono text-xs flex items-center gap-2">
            <FaTachometerAlt className="text-trace" />
            <span className="text-paper-dim">Speed:</span>
            <span className="text-paper font-semibold w-16 text-right">
              {speed.toFixed(1)} km/h
            </span>
          </div>

          {/* Distance HUD */}
          <div className="bg-ink-950 px-3 py-1.5 rounded-sm border border-ink-600 font-mono text-xs flex items-center gap-2">
            <span className="text-amber font-bold">📏</span>
            <span className="text-paper-dim">Dist:</span>
            <span className="text-paper font-semibold w-14 text-right">
              {distanceToBarrier.toFixed(1)} m
            </span>
          </div>

          {/* Pneumatic Pressure HUD */}
          <div className="bg-ink-950 px-3 py-1.5 rounded-sm border border-ink-600 font-mono text-xs flex items-center gap-2">
            <span className="text-red-400 font-bold">⚡</span>
            <span className="text-paper-dim">Brakes:</span>
            <span
              className={`font-semibold w-16 text-right ${
                brakePressure > 0 ? 'text-amber animate-pulse' : 'text-paper-dim'
              }`}
            >
              {brakePressure.toFixed(0)} PSI
            </span>
          </div>
        </div>
      </div>

      {/* 2D Interactive Track Canvas */}
      <div className="relative w-full h-52 bg-ink-950 border border-ink-600 rounded-md overflow-hidden p-4 mb-6 select-none shadow-inner flex flex-col justify-between">
        {/* Asphalt Road Markings */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-32 bg-ink-900/90 border-y border-dashed border-ink-600">
          {/* Center Track Dashed Line */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-paper-dim/20" />

          {/* 6.2m Safe Stop Benchmark Line */}
          <div
            className="absolute top-0 bottom-0 border-r-2 border-dashed border-amber/70 flex flex-col justify-between items-center z-10"
            style={{ left: `${STOP_CLEARANCE_X}%` }}
          >
            <span className="bg-amber text-ink-950 text-[8px] font-mono font-bold px-1 rounded-xs -translate-x-1/2 mt-1 shadow-sm">
              6.2m BENCHMARK
            </span>
          </div>
        </div>

        {/* Distance Markers along Track Floor */}
        <div className="absolute bottom-2 inset-x-6 flex justify-between font-mono text-[10px] text-paper-dim z-20">
          <span>0m (Start)</span>
          <span>10m</span>
          <span>20m</span>
          <span className="text-amber font-semibold">6.2m Stop Line</span>
          <span className="text-red-400 font-semibold">Barrier (30m)</span>
        </div>

        {/* Obstacle / Barrier */}
        <div
          className="absolute top-1/2 -translate-y-1/2 z-20"
          style={{ left: `${BARRIER_X}%` }}
        >
          <div
            className={`w-6 h-24 border-2 rounded-sm flex flex-col items-center justify-center shadow-lg transition-all ${
              state === 'CRASHED'
                ? 'bg-red-600/40 border-red-500 scale-95 rotate-6'
                : 'bg-amber/20 border-amber'
            }`}
          >
            <span className="font-mono text-[8px] font-bold text-amber -rotate-90 whitespace-nowrap">
              BARRIER
            </span>
          </div>
        </div>

        {/* The 2D Autonomous Race Car */}
        <div
          className="absolute top-1/2 -translate-y-1/2 z-30 transition-transform duration-75"
          style={{
            left: `${carX}%`,
            transform: `translateY(-50%) ${
              state === 'CRASHED' ? 'rotate(-6deg) scale(0.95)' : 'none'
            }`,
          }}
        >
          <div className="relative flex items-center">
            {/* Radar Perception Cone */}
            {state === 'ACCELERATING' && (
              <div
                className={`absolute left-full top-1/2 -translate-y-1/2 w-36 h-24 pointer-events-none transition-opacity ${
                  radarLocked
                    ? 'opacity-80 bg-gradient-to-r from-amber/40 via-red-500/20 to-transparent'
                    : 'opacity-35 bg-gradient-to-r from-trace/30 to-transparent'
                }`}
                style={{ clipPath: 'polygon(0 40%, 100% 0, 100% 100%, 0 60%)' }}
              />
            )}
            {state === 'BRAKING' && (
              <div
                className="absolute left-full top-1/2 -translate-y-1/2 w-32 h-24 pointer-events-none opacity-80 bg-gradient-to-r from-amber/50 via-amber/20 to-transparent animate-pulse"
                style={{ clipPath: 'polygon(0 40%, 100% 0, 100% 100%, 0 60%)' }}
              />
            )}

            {/* Skid Smoke Particles when Braking */}
            {state === 'BRAKING' && (
              <>
                <div className="absolute -left-6 top-2 w-5 h-5 rounded-full bg-paper-dim/40 blur-xs animate-ping" />
                <div className="absolute -left-8 bottom-2 w-6 h-6 rounded-full bg-paper-dim/30 blur-sm animate-ping" />
              </>
            )}

            {/* Race Car Body */}
            <div className="relative w-18 h-11 bg-trace/95 border-2 border-trace rounded-md shadow-lg flex items-center justify-center text-ink-950 font-mono font-bold text-[9px]">
              {/* Wheels */}
              <div className="absolute -top-2 left-2 w-3.5 h-2 bg-ink-950 rounded-xs border border-paper-dim" />
              <div className="absolute -top-2 right-2.5 w-3.5 h-2 bg-ink-950 rounded-xs border border-paper-dim" />
              <div className="absolute -bottom-2 left-2 w-3.5 h-2 bg-ink-950 rounded-xs border border-paper-dim" />
              <div className="absolute -bottom-2 right-2.5 w-3.5 h-2 bg-ink-950 rounded-xs border border-paper-dim" />

              {/* Glowing Brake Calipers during Deceleration */}
              {state === 'BRAKING' && (
                <>
                  <span className="absolute -bottom-1.5 right-2 w-2.5 h-2.5 rounded-full bg-amber shadow-[0_0_10px_#FF6B35] animate-ping" />
                  <span className="absolute -top-1.5 right-2 w-2.5 h-2.5 rounded-full bg-amber shadow-[0_0_10px_#FF6B35] animate-ping" />
                </>
              )}

              {/* Jetson Orin Node on Roof */}
              <div className="w-8 h-5 bg-ink-950 text-trace rounded-xs text-[7px] flex items-center justify-center font-mono border border-trace/40 shadow-inner">
                JETSON
              </div>
            </div>
          </div>
        </div>

        {/* Status Overlay Banner */}
        <div className="relative z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-mono text-xs text-paper-dim flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                state === 'ACCELERATING'
                  ? 'bg-trace animate-pulse'
                  : state === 'BRAKING'
                  ? 'bg-amber animate-pulse'
                  : state === 'STOPPED_SAFE'
                  ? 'bg-green-400'
                  : state === 'CRASHED'
                  ? 'bg-red-500'
                  : 'bg-paper-dim'
              }`}
            />
            Mode:{' '}
            <span className="text-paper font-semibold">
              {aebEnabled ? 'Autonomous AEB Closed-Loop' : 'Manual Driver (AEB Disabled)'}
            </span>
          </span>

          <AnimatePresence mode="wait">
            {state === 'STOPPED_SAFE' && (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-green-500/15 border border-green-500/60 text-green-400 font-mono text-xs px-3 py-1 rounded-sm flex items-center gap-2 shadow-md"
              >
                <FaCheckCircle className="text-sm" />
                <span>
                  SAFE STOP AT 6.2m · {canLatency}ms CAN DELAY · 0 COLLISION (NATIONAL 1ST PLACE)
                </span>
              </motion.div>
            )}

            {state === 'CRASHED' && (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-red-500/20 border border-red-500/70 text-red-400 font-mono text-xs px-3 py-1 rounded-sm flex items-center gap-2 shadow-md"
              >
                <FaExclamationTriangle className="text-sm" />
                <span>BARRIER COLLISION · AEB SYSTEM WAS OVERRIDDEN</span>
              </motion.div>
            )}

            {state === 'BRAKING' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-amber/20 border border-amber/70 text-amber font-mono text-xs px-3 py-1 rounded-sm flex items-center gap-2"
              >
                <FaShieldAlt />
                <span>EMERGENCY BRAKE ACTUATED (120 PSI PNEUMATIC)</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls & Metrics */}
      <div className="grid sm:grid-cols-3 gap-4 items-center">
        {/* Run AEB Autonomous Test Button */}
        <button
          onClick={() => startTest(true)}
          disabled={state === 'ACCELERATING' || state === 'BRAKING'}
          className="py-3 px-4 rounded-sm font-mono text-xs font-semibold bg-amber text-white dark:text-ink-950 hover:shadow-[0_0_20px_rgba(255,107,53,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <FaPlay className="text-[10px]" />
          <span>START AEB AUTONOMOUS RUN</span>
        </button>

        {/* Run Without AEB (Manual failure test) */}
        <button
          onClick={() => startTest(false)}
          disabled={state === 'ACCELERATING' || state === 'BRAKING'}
          className="py-3 px-4 rounded-sm font-mono text-xs border border-ink-600 text-paper-muted hover:border-red-500 hover:text-red-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <FaExclamationTriangle className="text-[10px]" />
          <span>TEST WITHOUT AEB (MANUAL)</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={resetTest}
          className="py-3 px-4 rounded-sm font-mono text-xs border border-ink-600 bg-ink-950/60 text-paper-dim hover:text-paper hover:border-paper-dim transition-colors flex items-center justify-center gap-2"
        >
          <FaUndo className="text-[10px]" />
          <span>RESET TRACK</span>
        </button>
      </div>

      {/* Engineering Details Footnote */}
      <div className="mt-5 pt-4 border-t border-ink-600 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-paper-dim">
        <span>Braking Response: &lt;12ms over CAN bus · 120 PSI Line Pressure · 30 km/h Entry</span>
        <span className="text-trace font-medium">
          Team Abhyuday Racing · aBAJA National 2026 Winner
        </span>
      </div>
    </div>
  );
}
