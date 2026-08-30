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
  FaCalculator,
} from 'react-icons/fa';

type SimState = 'IDLE' | 'ACCELERATING' | 'BRAKING' | 'STOPPED_SAFE' | 'CRASHED';

export default function CarAEBSimulator() {
  const [carX, setCarX] = useState(6.0); // % along track (6% = 0m start)
  const [speed, setSpeed] = useState(0.0); // km/h (entry target: 30.0 km/h)
  const [distanceToBarrier, setDistanceToBarrier] = useState(30.0); // meters
  const [hydraulicPressure, setHydraulicPressure] = useState(0.0); // bar (Target: 40 bar)
  const [actuatorStroke, setActuatorStroke] = useState(0); // % (0-100% stroke)
  const [state, setState] = useState<SimState>('IDLE');
  const [aebEnabled, setAebEnabled] = useState(true);
  const [radarLocked, setRadarLocked] = useState(false);

  // Physics simulation refs
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Physical Dimensions & Coordinate Scale:
  const CAR_WIDTH = 7.5; // % width of race car sprite
  const TRACK_START_X = 6.0; // 0.0m Start position (Rear of car at 6.0%, Front bumper at 13.5%)
  const BARRIER_X = 85.0; // Static Obstacle position (representing 30.0m approach track)
  
  // Total travel span of front bumper from 0m start (13.5%) to Barrier face (85.0%) = 71.5% for 30.0 meters
  const METERS_TO_PERCENT = 71.5 / 30.0; // 2.3833% per meter
  const LINE_6M_X = 85.0 - 6.0 * METERS_TO_PERCENT; // 70.70% (Exact 6.0m limit line from barrier)
  const STOP_BUMPER_X = 85.0 - 6.2 * METERS_TO_PERCENT; // 70.22% (Front bumper halts at 6.2m clearance = 0.2m behind 6m line)
  const STOP_CAR_X = STOP_BUMPER_X - CAR_WIDTH; // 62.72% (Where carX rear anchor halts)

  const physicsRef = useRef({
    carX: TRACK_START_X,
    speed: 0.0,
    state: 'IDLE' as SimState,
    aebEnabled: true,
    hydraulicPressure: 0.0,
    actuatorStroke: 0,
    brakeStartX: 45.0,
    initialBrakeSpeed: 30.0,
  });

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
        // Smooth gradual acceleration up to 30.0 km/h entry speed
        p.speed = Math.min(30.0, p.speed + 24.0 * dt);
        p.hydraulicPressure = 0.0;
        p.actuatorStroke = 0;

        // Advance position frame-by-frame
        p.carX += p.speed * 0.48 * dt;

        // Calculate remaining distance from front bumper to barrier
        const currentFrontBumper = p.carX + CAR_WIDTH;
        const remainingFraction = Math.max(0, (BARRIER_X - currentFrontBumper) / 71.5);
        const currentDistMeters = Math.max(0, remainingFraction * 30.0);

        // Radar perception lock at 12.0m distance (~56.4% front bumper position)
        if (currentDistMeters <= 12.0 && p.aebEnabled) {
          p.state = 'BRAKING';
          p.brakeStartX = p.carX;
          p.initialBrakeSpeed = p.speed;
          setRadarLocked(true);
          setState('BRAKING');
        } else if (currentFrontBumper >= BARRIER_X && !p.aebEnabled) {
          // Crash directly at barrier face if AEB is disabled
          p.state = 'CRASHED';
          p.speed = 0;
          p.carX = BARRIER_X - CAR_WIDTH;
          setState('CRASHED');
          setCarX(p.carX);
          setSpeed(0);
          setDistanceToBarrier(0.0);
          setHydraulicPressure(0.0);
          setActuatorStroke(0);
          stopSimulation();
          return;
        }

        setCarX(p.carX);
        setSpeed(p.speed);
        setDistanceToBarrier(currentDistMeters);
        setHydraulicPressure(p.hydraulicPressure);
        setActuatorStroke(p.actuatorStroke);
      } else if (p.state === 'BRAKING') {
        // Pure smooth kinematic deceleration to exactly STOP_CAR_X (0 teleportation)
        const totalBrakingDist = Math.max(0.1, STOP_CAR_X - p.brakeStartX);
        const remainingDist = Math.max(0, STOP_CAR_X - p.carX);
        const brakingProgress = Math.min(1, Math.max(0, 1 - remainingDist / totalBrakingDist)); // 0.0 -> 1.0

        // Rapid hydraulic pressure build on TMC (0 -> 40 bar in first 35% of braking stroke)
        p.hydraulicPressure = Math.min(40.0, 40.0 * Math.min(1, brakingProgress * 2.8));
        p.actuatorStroke = Math.min(100, Math.round((p.hydraulicPressure / 40.0) * 100));

        // Kinematic deceleration: velocity smoothly approaches 0.0 as position approaches STOP_CAR_X
        p.speed = Math.max(0, p.initialBrakeSpeed * Math.sqrt(Math.max(0, 1 - brakingProgress)));

        // Advance position smoothly without overshooting
        const step = p.speed * 0.48 * dt;
        p.carX = Math.min(STOP_CAR_X, p.carX + step);

        // Check if vehicle has smoothly rolled to complete rest
        if (p.carX >= STOP_CAR_X - 0.06 || brakingProgress >= 0.99) {
          p.state = 'STOPPED_SAFE';
          p.speed = 0.0;
          p.carX = STOP_CAR_X;
          p.hydraulicPressure = 40.0;
          p.actuatorStroke = 100;
          setState('STOPPED_SAFE');
          setCarX(STOP_CAR_X);
          setSpeed(0.0);
          setDistanceToBarrier(6.2);
          setHydraulicPressure(40.0);
          setActuatorStroke(100);
          stopSimulation();
          return;
        }

        // Calculate exact live meters to barrier
        const currentFrontBumper = p.carX + CAR_WIDTH;
        const remainingFraction = Math.max(0, (BARRIER_X - currentFrontBumper) / 71.5);
        const currentDistMeters = Math.max(6.2, remainingFraction * 30.0);

        setCarX(p.carX);
        setSpeed(p.speed);
        setDistanceToBarrier(currentDistMeters);
        setHydraulicPressure(p.hydraulicPressure);
        setActuatorStroke(p.actuatorStroke);
      }

      if (p.state === 'ACCELERATING' || p.state === 'BRAKING') {
        animFrameRef.current = requestAnimationFrame(runSimulationStep);
      }
    },
    [stopSimulation, CAR_WIDTH, BARRIER_X, STOP_CAR_X]
  );

  const startTest = (enableAeb: boolean) => {
    stopSimulation();
    setAebEnabled(enableAeb);
    setRadarLocked(false);
    setHydraulicPressure(0.0);
    setActuatorStroke(0);
    setDistanceToBarrier(30.0);
    setCarX(TRACK_START_X);
    setSpeed(0.0);
    setState('ACCELERATING');

    physicsRef.current = {
      carX: TRACK_START_X,
      speed: 0.0,
      state: 'ACCELERATING',
      aebEnabled: enableAeb,
      hydraulicPressure: 0.0,
      actuatorStroke: 0,
      brakeStartX: 45.0,
      initialBrakeSpeed: 30.0,
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
    setHydraulicPressure(0.0);
    setActuatorStroke(0);
    setRadarLocked(false);

    physicsRef.current = {
      carX: TRACK_START_X,
      speed: 0.0,
      state: 'IDLE',
      aebEnabled: true,
      hydraulicPressure: 0.0,
      actuatorStroke: 0,
      brakeStartX: 45.0,
      initialBrakeSpeed: 30.0,
    };
  };

  useEffect(() => {
    return () => {
      stopSimulation();
    };
  }, [stopSimulation]);

  // Derived kinematic values for live telemetry HUD
  const speedMps = speed * 0.2778; // m/s
  const availableBrakingDist = Math.max(0.1, distanceToBarrier - 6.2); // meters to 6.2m stop line
  const ttc = speedMps > 0.1 ? (distanceToBarrier / speedMps).toFixed(2) : '∞';
  const reqDecel =
    speedMps > 0.1 && availableBrakingDist > 0.1
      ? ((speedMps * speedMps) / (2 * availableBrakingDist)).toFixed(2)
      : '0.00';

  // Real-time track motion progress (0.0 at start line -> 1.0 at 6.2m safe halt)
  const trackProgress = Math.max(0, Math.min(1, (carX - TRACK_START_X) / (STOP_CAR_X - TRACK_START_X)));
  // Car center coordinate along track
  const carCenterX = carX + CAR_WIDTH / 2;
  // Smooth dynamic card alignment (no clamping stalls at start, no snapping at stop)
  const cardTranslateX = -50 + (1 - trackProgress) * 22 - trackProgress * 12;
  const pointerLeftPercent = 50 - ((1 - trackProgress) * 22 - trackProgress * 12) * 1.5;

  return (
    <div className="bg-ink-900 border border-ink-600 rounded-md p-3.5 sm:p-6 md:p-8 shadow-xl">
      {/* Title & Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] sm:text-xs text-amber uppercase tracking-wider font-semibold">
              Team Abhyuday Racing · aBAJA Autonomous BAJA 2026
            </span>
          </div>
          <h3 className="font-display font-semibold text-xl sm:text-2xl text-paper">
            Autonomous Emergency Braking (AEB) Physics Simulation
          </h3>
          <p className="text-paper-muted text-[11px] sm:text-xs font-mono mt-0.5">
            Jetson Orin radar perception + STM32 Tandem Master Cylinder (TMC) Linear Actuator (40 Bar Hydraulic).
          </p>
        </div>

        {/* Real-time Telemetry Gauges */}
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-3">
          {/* Speed HUD */}
          <div className="bg-ink-950 px-2 sm:px-3 py-1.5 rounded-sm border border-ink-600 font-mono text-[11px] sm:text-xs flex flex-col xs:flex-row items-center justify-center gap-0.5 xs:gap-2">
            <span className="flex items-center gap-1 text-trace">
              <FaTachometerAlt />
              <span className="text-paper-dim text-[9px] xs:text-xs">Speed:</span>
            </span>
            <span className="text-paper font-semibold">
              {speed.toFixed(1)} km/h
            </span>
          </div>

          {/* Distance HUD */}
          <div className="bg-ink-950 px-2 sm:px-3 py-1.5 rounded-sm border border-ink-600 font-mono text-[11px] sm:text-xs flex flex-col xs:flex-row items-center justify-center gap-0.5 xs:gap-2">
            <span className="flex items-center gap-1 text-amber">
              <span>📏</span>
              <span className="text-paper-dim text-[9px] xs:text-xs">Dist:</span>
            </span>
            <span className="text-paper font-semibold">
              {distanceToBarrier.toFixed(1)} m
            </span>
          </div>

          {/* Hydraulic Pressure HUD */}
          <div className="bg-ink-950 px-2 sm:px-3 py-1.5 rounded-sm border border-ink-600 font-mono text-[11px] sm:text-xs flex flex-col xs:flex-row items-center justify-center gap-0.5 xs:gap-2">
            <span className="flex items-center gap-1 text-red-400">
              <span>⚡</span>
              <span className="text-paper-dim text-[9px] xs:text-xs">Press:</span>
            </span>
            <span
              className={`font-semibold ${
                hydraulicPressure > 0 ? 'text-amber animate-pulse' : 'text-paper-dim'
              }`}
            >
              {hydraulicPressure.toFixed(1)} bar
            </span>
          </div>
        </div>
      </div>

      {/* 2D Interactive Track Canvas */}
      <div className="relative w-full h-[380px] xs:h-[360px] sm:h-92 md:h-88 bg-ink-950 border border-ink-600 rounded-md overflow-hidden p-3 sm:p-4 mb-4 sm:mb-6 select-none shadow-inner flex flex-col justify-between">
        {/* Upper Track Header: Mode Indicator & Global Alert */}
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
            <span className="text-paper font-semibold text-xs">
              {aebEnabled ? 'Autonomous AEB (Closed-Loop TMC Actuation)' : 'Manual Driver (AEB Overridden)'}
            </span>
          </span>

          <AnimatePresence mode="wait">
            {state === 'STOPPED_SAFE' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-green-500/15 border border-green-500/60 text-green-400 font-mono text-[11px] px-2.5 py-1 rounded-sm flex items-center gap-1.5 shadow-md self-start sm:self-auto"
              >
                <FaCheckCircle className="text-xs" />
                <span>SAFE STOP AT 6.2m · 0.2m BEHIND 6.0m LINE · 40 BAR LOCK</span>
              </motion.div>
            )}

            {state === 'CRASHED' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-red-500/20 border border-red-500/70 text-red-400 font-mono text-[11px] px-2.5 py-1 rounded-sm flex items-center gap-1.5 shadow-md self-start sm:self-auto"
              >
                <FaExclamationTriangle className="text-xs" />
                <span>BARRIER COLLISION · MANUAL OVERRIDE (AEB INACTIVE)</span>
              </motion.div>
            )}

            {state === 'BRAKING' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-amber/20 border border-amber/70 text-amber font-mono text-[11px] px-2.5 py-1 rounded-sm flex items-center gap-1.5 self-start sm:self-auto"
              >
                <FaShieldAlt className="text-xs" />
                <span>TMC LINEAR ACTUATOR EXTENDING (40 BAR HYDRAULIC)</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Stats Card Moving in 1-to-1 Lockstep with Vehicle (Zero CSS transition lag) */}
        <div
          className="absolute top-11 sm:top-12 z-30 pointer-events-none"
          style={{
            left: `${carCenterX}%`,
            transform: `translateX(${cardTranslateX}%)`,
          }}
        >
          <div className="relative bg-ink-900/95 border border-trace/70 rounded-md p-2 sm:p-2.5 shadow-2xl backdrop-blur-md w-52 sm:w-60 text-left">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink-600/60 pb-1 mb-1 font-mono text-[9px] sm:text-[10px]">
              <span className="text-trace font-bold flex items-center gap-1">
                <FaCalculator size={9} /> AEB KINEMATICS
              </span>
              <span
                className={`font-semibold px-1.5 py-0.2 rounded-xs text-[8px] sm:text-[9px] ${
                  state === 'BRAKING'
                    ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/40'
                    : state === 'STOPPED_SAFE'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                    : state === 'CRASHED'
                    ? 'bg-red-600 text-white'
                    : 'bg-trace/20 text-trace border border-trace/30'
                }`}
              >
                {state === 'BRAKING'
                  ? 'ACTUATION 40 BAR'
                  : state === 'STOPPED_SAFE'
                  ? 'HALT AT 6.2m'
                  : state === 'CRASHED'
                  ? 'CRASHED'
                  : 'RADAR SCANNING'}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[8px] sm:text-[9px]">
              <div>
                <span className="text-paper-dim">v_rel: </span>
                <span className="text-paper font-semibold">{speed.toFixed(1)} km/h</span>
              </div>
              <div>
                <span className="text-paper-dim">TTC: </span>
                <span className={state === 'BRAKING' ? 'text-red-400 font-bold' : 'text-amber'}>
                  {ttc}s
                </span>
              </div>
              <div>
                <span className="text-paper-dim">Req a: </span>
                <span className="text-paper font-semibold">{reqDecel} m/s²</span>
              </div>
              <div>
                <span className="text-paper-dim">TMC Stroke: </span>
                <span className="text-amber font-semibold">{actuatorStroke}%</span>
              </div>
            </div>

            <div className="mt-1 pt-1 border-t border-ink-600/60 flex items-center justify-between text-[8px] sm:text-[9px] font-mono">
              <span className="text-paper-dim">Parallel TMC Actuator:</span>
              <span className="text-red-400 font-bold">{hydraulicPressure.toFixed(1)} / 40 BAR</span>
            </div>

            {/* Dynamic pointer tail tracking vehicle center */}
            <div
              className="absolute -bottom-1.5 w-3 h-3 bg-ink-900 border-r border-b border-trace/70 rotate-45"
              style={{
                left: `${Math.max(12, Math.min(88, pointerLeftPercent))}%`,
                transform: 'translateX(-50%) rotate(45deg)',
              }}
            />
          </div>
        </div>

        {/* 6.0m Safety Zone Dimension Measurement Bracket above Road */}
        <div
          className="absolute bottom-36 sm:bottom-40 z-20 pointer-events-none flex flex-col items-center"
          style={{
            left: `${LINE_6M_X}%`,
            width: `${BARRIER_X - LINE_6M_X}%`,
          }}
        >
          <div className="w-full flex items-center justify-between">
            <div className="w-1.5 h-3 border-l-2 border-amber" />
            <div className="flex-1 border-t-2 border-dashed border-amber/70 relative flex items-center justify-center">
              <span className="bg-ink-950 px-2 font-mono text-[9px] sm:text-[10px] text-amber font-bold whitespace-nowrap shadow-sm border border-amber/40 rounded-xs">
                ← 6.0m Safety Zone →
              </span>
            </div>
            <div className="w-1.5 h-3 border-r-2 border-amber" />
          </div>
        </div>

        {/* Asphalt Road Markings */}
        <div className="absolute inset-x-0 bottom-6 h-28 sm:h-32 bg-ink-900/95 border-y border-dashed border-ink-600">
          {/* Center Track Dashed Lane Line */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-paper-dim/20" />

          {/* Faint 6.0m Benchmark Limit Line from Barrier */}
          <div
            className="absolute top-0 bottom-0 border-r-2 border-dashed border-paper-dim/40 flex flex-col justify-start items-center z-10 pointer-events-none"
            style={{ left: `${LINE_6M_X}%` }}
          >
            <span className="bg-ink-900/90 text-paper-dim border border-ink-600 font-mono text-[7px] sm:text-[8px] px-1 py-0.2 rounded-xs -translate-x-1/2 mt-1 shadow-xs whitespace-nowrap">
              6.0m LIMIT LINE
            </span>
          </div>
        </div>

        {/* Front Bumper Clearance Callout when Stopped Safely at 6.2m */}
        {state === 'STOPPED_SAFE' && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-2 z-25 pointer-events-none"
            style={{ left: `${STOP_BUMPER_X}%` }}
          >
            <div className="flex flex-col items-center -translate-x-1/2">
              <div className="w-0.5 h-3 bg-green-400 animate-pulse" />
              <span className="bg-green-500 text-ink-950 font-mono font-bold text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
                Front Bumper: 6.2m (+0.2m Behind 6m Line)
              </span>
            </div>
          </motion.div>
        )}

        {/* Distance Markers along Track Floor */}
        <div className="absolute bottom-1 inset-x-0 pointer-events-none z-20 font-mono text-[8px] sm:text-[9px] text-paper-dim">
          {/* 0m Start */}
          <span
            className="absolute -translate-x-1/2"
            style={{ left: `${TRACK_START_X}%` }}
          >
            0m (Start)
          </span>

          {/* 10m Marker */}
          <span
            className="absolute -translate-x-1/2 hidden xs:inline"
            style={{ left: '30.0%' }}
          >
            10m
          </span>

          {/* 20m Marker */}
          <span
            className="absolute -translate-x-1/2 hidden xs:inline"
            style={{ left: '54.0%' }}
          >
            20m
          </span>

          {/* 6.0m Limit Marker */}
          <span
            className="absolute -translate-x-1/2 text-paper-dim"
            style={{ left: `${LINE_6M_X}%` }}
          >
            6.0m Line
          </span>

          {/* Barrier Marker */}
          <span
            className="absolute -translate-x-1/2 text-red-400 font-semibold"
            style={{ left: `${BARRIER_X}%` }}
          >
            Barrier
          </span>
        </div>

        {/* Static Obstacle / Barrier */}
        <div
          className="absolute bottom-6 z-20 flex flex-col items-center"
          style={{ left: `${BARRIER_X}%` }}
        >
          {/* Barrier Vertical Stanchion Body */}
          <div
            className={`w-8 sm:w-9 h-28 rounded-sm border-2 shadow-2xl transition-all flex flex-col items-center justify-between py-2 ${
              state === 'CRASHED'
                ? 'bg-red-600/70 border-red-400 scale-95 rotate-3 shadow-[0_0_25px_rgba(239,68,68,0.7)]'
                : 'bg-amber/25 border-amber shadow-[0_0_15px_rgba(255,107,53,0.3)]'
            }`}
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(255,107,53,0.35) 0, rgba(255,107,53,0.35) 8px, transparent 8px, transparent 16px)',
            }}
          >
            {/* Top Warning Strobe Beacon */}
            <span
              className={`w-3.5 h-3.5 rounded-full border shadow-sm ${
                state === 'CRASHED'
                  ? 'bg-red-500 border-red-200 animate-ping shadow-[0_0_12px_#EF4444]'
                  : 'bg-amber border-amber-200 animate-pulse shadow-[0_0_8px_#FF6B35]'
              }`}
            />

            {/* Clean Vertical Obstacle Label (No '30m' text) */}
            <span className="font-mono text-[8px] font-extrabold text-paper -rotate-90 whitespace-nowrap tracking-wider drop-shadow-md">
              {state === 'CRASHED' ? 'IMPACT' : 'BARRIER'}
            </span>

            {/* Steel Reinforcement Bolt Plate */}
            <div className="w-6 h-1.5 bg-ink-950 border border-paper-dim/60 rounded-xs" />
          </div>

          {/* Heavy Steel Footing Plate Anchored to Asphalt */}
          <div className="w-12 sm:w-14 h-2 bg-ink-950 border-t-2 border-amber -mt-0.5 rounded-b-xs shadow-lg flex items-center justify-around px-1">
            <span className="w-1 h-1 rounded-full bg-paper-dim" />
            <span className="w-1 h-1 rounded-full bg-paper-dim" />
          </div>
        </div>

        {/* Collision Impact Sparks and Shockwave when AEB is disabled */}
        {state === 'CRASHED' && (
          <div
            className="absolute bottom-14 z-30 pointer-events-none"
            style={{ left: `${BARRIER_X - 4}%` }}
          >
            <div className="w-8 h-8 rounded-full bg-red-500/40 blur-sm animate-ping" />
            <div className="absolute -top-2 left-0 text-amber text-xs animate-bounce font-mono font-bold">
              💥
            </div>
          </div>
        )}

        {/* The 2D Autonomous Race Car (Direct 60fps physics rendering with zero transition lag) */}
        <div
          className="absolute bottom-12 z-30"
          style={{
            left: `${carX}%`,
            width: `${CAR_WIDTH}%`,
            transform: `${
              state === 'CRASHED' ? 'rotate(-6deg) scale(0.95)' : 'none'
            }`,
          }}
        >
          {/* Compact Roof Speed & Status Pill */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap pointer-events-none z-40">
            <span
              className={`font-mono text-[8px] font-bold px-1.5 py-0.5 rounded shadow-md border ${
                state === 'BRAKING'
                  ? 'bg-red-500/90 text-white border-red-400 animate-pulse'
                  : state === 'STOPPED_SAFE'
                  ? 'bg-green-500/90 text-white border-green-400'
                  : state === 'CRASHED'
                  ? 'bg-red-700 text-white border-red-500'
                  : radarLocked
                  ? 'bg-amber/90 text-ink-950 border-amber'
                  : 'bg-ink-900/90 text-trace border-trace/60'
              }`}
            >
              {speed > 0.5 ? `${speed.toFixed(0)} km/h` : state === 'STOPPED_SAFE' ? 'HALT (6.2m)' : '0 km/h'}
            </span>
          </div>

          <div className="relative flex items-center">
            {/* Radar Perception Cone */}
            {state === 'ACCELERATING' && (
              <div
                className={`absolute left-full top-1/2 -translate-y-1/2 w-32 sm:w-36 h-20 sm:h-24 pointer-events-none transition-opacity ${
                  radarLocked
                    ? 'opacity-80 bg-gradient-to-r from-amber/40 via-red-500/20 to-transparent'
                    : 'opacity-35 bg-gradient-to-r from-trace/30 to-transparent'
                }`}
                style={{ clipPath: 'polygon(0 40%, 100% 0, 100% 100%, 0 60%)' }}
              />
            )}
            {state === 'BRAKING' && (
              <div
                className="absolute left-full top-1/2 -translate-y-1/2 w-28 sm:w-32 h-20 sm:h-24 pointer-events-none opacity-80 bg-gradient-to-r from-amber/50 via-amber/20 to-transparent animate-pulse"
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
            <div className="relative w-16 h-10 bg-trace/95 border-2 border-trace rounded-md shadow-lg flex items-center justify-center text-ink-950 font-mono font-bold text-[9px]">
              {/* Wheels */}
              <div className="absolute -top-2 left-2 w-3.5 h-2 bg-ink-950 rounded-xs border border-paper-dim" />
              <div className="absolute -top-2 right-2.5 w-3.5 h-2 bg-ink-950 rounded-xs border border-paper-dim" />
              <div className="absolute -bottom-2 left-2 w-3.5 h-2 bg-ink-950 rounded-xs border border-paper-dim" />
              <div className="absolute -bottom-2 right-2.5 w-3.5 h-2 bg-ink-950 rounded-xs border border-paper-dim" />

              {/* Glowing Hydraulic Calipers during Deceleration */}
              {state === 'BRAKING' && (
                <>
                  <span className="absolute -bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber shadow-[0_0_10px_#FF6B35] animate-ping" />
                  <span className="absolute -top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber shadow-[0_0_10px_#FF6B35] animate-ping" />
                </>
              )}

              {/* Jetson Orin Node on Roof */}
              <div className="w-8 h-4.5 bg-ink-950 text-trace rounded-xs text-[7px] flex items-center justify-center font-mono border border-trace/40 shadow-inner">
                JETSON
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 items-center">
        {/* Run AEB Autonomous Test Button */}
        <button
          onClick={() => startTest(true)}
          disabled={state === 'ACCELERATING' || state === 'BRAKING'}
          className="py-2.5 sm:py-3 px-3 sm:px-4 rounded-sm font-mono text-xs font-semibold bg-amber text-white dark:text-ink-950 hover:shadow-[0_0_20px_rgba(255,107,53,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <FaPlay className="text-[10px]" />
          <span>START AEB AUTONOMOUS RUN</span>
        </button>

        {/* Run Without AEB (Manual failure test) */}
        <button
          onClick={() => startTest(false)}
          disabled={state === 'ACCELERATING' || state === 'BRAKING'}
          className="py-2.5 sm:py-3 px-3 sm:px-4 rounded-sm font-mono text-xs border border-ink-600 text-paper-muted hover:border-red-500 hover:text-red-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <FaExclamationTriangle className="text-[10px]" />
          <span>TEST WITHOUT AEB (MANUAL)</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={resetTest}
          className="py-2.5 sm:py-3 px-3 sm:px-4 rounded-sm font-mono text-xs border border-ink-600 bg-ink-950/60 text-paper-dim hover:text-paper hover:border-paper-dim transition-colors flex items-center justify-center gap-2"
        >
          <FaUndo className="text-[10px]" />
          <span>RESET TRACK</span>
        </button>
      </div>

      {/* Engineering Details Footnote */}
      <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-ink-600 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 text-[10px] sm:text-[11px] font-mono text-paper-dim">
        <span>Parallel Linear Actuator on TMC · 40 Bar Hydraulic · 30 km/h Entry</span>
        <span className="text-trace font-medium">
          Team Abhyuday Racing · aBAJA National 2026 Winner
        </span>
      </div>
    </div>
  );
}
