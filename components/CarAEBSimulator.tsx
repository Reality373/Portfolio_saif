'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaUndo, FaTachometerAlt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

export default function CarAEBSimulator() {
  const [carX, setCarX] = useState(10); // percentage along track (0% to 100%)
  const [speed, setSpeed] = useState(0); // km/h
  const [state, setState] = useState<'IDLE' | 'ACCELERATING' | 'BRAKING' | 'STOPPED_SAFE' | 'CRASHED'>('IDLE');
  const [aebEnabled, setAebEnabled] = useState(true);
  const [reactionTime, setReactionTime] = useState<number | null>(null);

  const obstacleX = 82; // percentage along track
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Car simulation loop
  useEffect(() => {
    if (state === 'IDLE' || state === 'STOPPED_SAFE' || state === 'CRASHED') {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      setCarX((prevX) => {
        let newX = prevX;
        const distToObstacle = obstacleX - prevX;

        if (state === 'ACCELERATING') {
          // Accelerate to 48 km/h
          setSpeed((prevSpeed) => Math.min(48, prevSpeed + 35 * dt));
          newX += (speed * 0.85) * dt;

          // Trigger AEB detection when within radar range (32% distance)
          if (distToObstacle <= 32 && aebEnabled) {
            setState('BRAKING');
            setReactionTime(12); // 12ms CAN delay
          } else if (distToObstacle <= 4 && !aebEnabled) {
            setState('CRASHED');
            setSpeed(0);
            return obstacleX - 2;
          }
        } else if (state === 'BRAKING') {
          // Rapid emergency braking
          setSpeed((prevSpeed) => {
            const nextSpeed = Math.max(0, prevSpeed - 75 * dt);
            if (nextSpeed === 0) {
              setState('STOPPED_SAFE');
            }
            return nextSpeed;
          });
          newX += (speed * 0.45) * dt;

          // Check if stopped or collision
          if (distToObstacle <= 8 && speed <= 5) {
            setState('STOPPED_SAFE');
            setSpeed(0);
            return obstacleX - 8;
          }
        }

        return Math.min(newX, obstacleX - 2);
      });

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [state, speed, aebEnabled]);

  const startTest = (enableAeb: boolean) => {
    setAebEnabled(enableAeb);
    setCarX(8);
    setSpeed(12);
    setReactionTime(null);
    lastTimeRef.current = 0;
    setState('ACCELERATING');
  };

  const resetTest = () => {
    setState('IDLE');
    setCarX(10);
    setSpeed(0);
    setReactionTime(null);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  };

  return (
    <div className="bg-ink-900 border border-ink-600 rounded-md p-6 sm:p-8 shadow-xl">
      {/* Title & context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-amber uppercase tracking-wider font-semibold">
              Team Abhyuday Racing · aBAJA Autonomous BAJA
            </span>
          </div>
          <h3 className="font-display font-semibold text-2xl text-paper">
            Autonomous Emergency Braking (AEB) Simulation
          </h3>
          <p className="text-paper-muted text-xs font-mono mt-0.5">
            Jetson Orin radar perception + STM32/ESP32 drive-by-wire dual-stage pneumatic braking.
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-3">
          <div className="bg-ink-950 px-3.5 py-1.5 rounded-sm border border-ink-600 font-mono text-xs flex items-center gap-2">
            <FaTachometerAlt className="text-trace" />
            <span className="text-paper-dim">Speed:</span>
            <span className="text-paper font-semibold w-14">{speed.toFixed(1)} km/h</span>
          </div>
        </div>
      </div>

      {/* 2D Interactive Track Canvas */}
      <div className="relative w-full h-48 bg-ink-950 border border-ink-600 rounded-md overflow-hidden p-4 mb-6 select-none shadow-inner flex flex-col justify-between">
        {/* Asphalt road markings */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-28 bg-ink-900/90 border-y border-dashed border-ink-600">
          {/* Center line */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-paper-dim/20" />
        </div>

        {/* Distance markers along the track */}
        <div className="absolute bottom-2 inset-x-6 flex justify-between font-mono text-[10px] text-paper-dim">
          <span>0m (Start)</span>
          <span>10m</span>
          <span>20m</span>
          <span className="text-amber font-semibold">6.2m Safe Zone</span>
          <span className="text-red-400 font-semibold">Barrier (30m)</span>
        </div>

        {/* Obstacle Barrier */}
        <div
          className="absolute top-1/2 -translate-y-1/2 z-20 transition-transform"
          style={{ left: `${obstacleX}%` }}
        >
          <div className="w-6 h-20 bg-stripes-amber border-2 border-amber rounded-sm flex flex-col items-center justify-center shadow-lg bg-amber/20">
            <span className="font-mono text-[8px] font-bold text-amber -rotate-90 whitespace-nowrap">
              OBSTACLE
            </span>
          </div>
        </div>

        {/* The 2D Autonomous Race Car */}
        <div
          className="absolute top-1/2 -translate-y-1/2 z-30 transition-all duration-75"
          style={{ left: `${carX}%` }}
        >
          <div className="relative flex items-center">
            {/* Radar Sensor Cones when active */}
            {state === 'ACCELERATING' && (
              <div
                className="absolute left-full top-1/2 -translate-y-1/2 w-32 h-20 pointer-events-none opacity-40 bg-gradient-to-r from-trace/30 to-transparent"
                style={{ clipPath: 'polygon(0 40%, 100% 0, 100% 100%, 0 60%)' }}
              />
            )}
            {state === 'BRAKING' && (
              <div
                className="absolute left-full top-1/2 -translate-y-1/2 w-28 h-20 pointer-events-none opacity-70 bg-gradient-to-r from-amber/40 to-transparent"
                style={{ clipPath: 'polygon(0 40%, 100% 0, 100% 100%, 0 60%)' }}
              />
            )}

            {/* Skid smoke when braking */}
            {state === 'BRAKING' && (
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-paper-dim/40 blur-sm animate-ping" />
            )}

            {/* Car Body SVG */}
            <div className="relative w-16 h-10 bg-trace/90 border border-trace rounded-md shadow-md flex items-center justify-center text-ink-950 font-mono font-bold text-[9px]">
              {/* Wheels */}
              <div className="absolute -top-1.5 left-2 w-3 h-1.5 bg-ink-950 rounded-sm border border-paper-dim" />
              <div className="absolute -top-1.5 right-2 w-3 h-1.5 bg-ink-950 rounded-sm border border-paper-dim" />
              <div className="absolute -bottom-1.5 left-2 w-3 h-1.5 bg-ink-950 rounded-sm border border-paper-dim" />
              <div className="absolute -bottom-1.5 right-2 w-3 h-1.5 bg-ink-950 rounded-sm border border-paper-dim" />

              {/* Brake calipers glow */}
              {state === 'BRAKING' && (
                <>
                  <span className="absolute -bottom-1 right-2 w-2 h-2 rounded-full bg-amber shadow-[0_0_8px_#FF6B35] animate-ping" />
                  <span className="absolute -top-1 right-2 w-2 h-2 rounded-full bg-amber shadow-[0_0_8px_#FF6B35] animate-ping" />
                </>
              )}

              {/* Jetson Orin Node on roof */}
              <div className="w-7 h-5 bg-ink-950 text-trace rounded-sm text-[7px] flex items-center justify-center font-mono">
                JETSON
              </div>
            </div>
          </div>
        </div>

        {/* Status Overlay Banner */}
        <div className="relative z-30 flex justify-between items-center">
          <span className="font-mono text-xs text-paper-dim">
            Mode: <span className="text-paper font-semibold">{aebEnabled ? 'Autonomous AEB' : 'Manual Driver (No AEB)'}</span>
          </span>

          <AnimatePresence mode="wait">
            {state === 'STOPPED_SAFE' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-green-500/15 border border-green-500/50 text-green-400 font-mono text-xs px-3 py-1 rounded-sm flex items-center gap-1.5 shadow-md"
              >
                <FaCheckCircle className="text-sm" />
                <span>HALTED SAFELY AT 6.2m · {reactionTime}ms CAN DELAY · NATIONAL 1ST PLACE</span>
              </motion.div>
            )}

            {state === 'CRASHED' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-red-500/20 border border-red-500/60 text-red-400 font-mono text-xs px-3 py-1 rounded-sm flex items-center gap-1.5 shadow-md"
              >
                <FaExclamationTriangle className="text-sm" />
                <span>COLLISION · AEB WAS DISABLED</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls & Metrics */}
      <div className="grid sm:grid-cols-3 gap-4 items-center">
        {/* Run AEB Test Button */}
        <button
          onClick={() => startTest(true)}
          disabled={state === 'ACCELERATING' || state === 'BRAKING'}
          className="py-3 px-4 rounded-sm font-mono text-xs font-semibold bg-amber text-white dark:text-ink-950 hover:shadow-[0_0_20px_rgba(255,107,53,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <FaPlay className="text-[10px]" />
          <span>START AEB AUTONOMOUS RUN</span>
        </button>

        {/* Run Without AEB (Manual fail test) */}
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

      {/* Engineering Takeaway footnote */}
      <div className="mt-5 pt-4 border-t border-ink-600 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-paper-dim">
        <span>Braking Response: &lt;15ms over CAN bus</span>
        <span className="text-trace">Team Abhyuday Racing · aBAJA National 2026</span>
      </div>
    </div>
  );
}
