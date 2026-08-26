'use client';

import { useState, useEffect } from 'react';
import { useHUD } from './HUDProvider';
import { FaCarSide, FaBolt, FaAward, FaSlidersH, FaBatteryThreeQuarters } from 'react-icons/fa';

export default function VehicleTelemetryHUD() {
  const { settings } = useHUD();
  const [steerAngle, setSteerAngle] = useState(14);
  const [throttlePercent, setThrottlePercent] = useState(35);
  const [isBrakingTest, setIsBrakingTest] = useState(false);
  const [testDistance, setTestDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(30.0);

  // BMS 24-cell mockup state
  const [cells, setCells] = useState<number[]>(
    Array.from({ length: 24 }, () => 4.12 + (Math.random() * 0.04 - 0.02))
  );

  useEffect(() => {
    if (!settings.vehicleTelemetry) return;
    const interval = setInterval(() => {
      setCells((prev) =>
        prev.map((v) => {
          const delta = (Math.random() - 0.5) * 0.006;
          return Number(Math.max(4.05, Math.min(4.18, v + delta)).toFixed(3));
        })
      );
    }, 1500);
    return () => clearInterval(interval);
  }, [settings.vehicleTelemetry]);

  // Run AEB braking test animation
  const runBrakingTest = () => {
    if (isBrakingTest) return;
    setIsBrakingTest(true);
    setTestDistance(0);
    setCurrentSpeed(30.0);

    let dist = 0;
    let speed = 30.0;
    const timer = setInterval(() => {
      dist += 0.45;
      speed = Math.max(0, speed - 2.8);
      setTestDistance(Number(dist.toFixed(1)));
      setCurrentSpeed(Number(speed.toFixed(1)));

      if (dist >= 6.2 || speed <= 0) {
        clearInterval(timer);
        setTestDistance(6.2);
        setCurrentSpeed(0);
        setTimeout(() => setIsBrakingTest(false), 3000);
      }
    }, 60);
  };

  if (!settings.vehicleTelemetry) return null;

  return (
    <section className="bg-ink-950 py-16 px-6 relative border-t border-ink-600">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
            <p className="font-mono text-xs text-amber uppercase tracking-wider">
              Autonomous Vehicle Telemetry Node
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-display font-semibold text-2xl sm:text-3xl text-paper">
                Drive-by-Wire &amp; Autonomous BAJA (aBAJA) Cockpit
              </h2>
              <p className="text-paper-muted font-mono text-xs sm:text-sm mt-1">
                Real-time 3-ECU control loop telemetry, steer/throttle actuation, and Autonomous Emergency Braking (AEB).
              </p>
            </div>

            <div className="flex items-center gap-2 border border-amber/40 bg-amber/10 px-3.5 py-1.5 rounded-sm font-mono text-xs text-amber">
              <FaAward className="text-sm shrink-0" />
              <span>National 1st Place: AEB &amp; Manufacturing Excellence</span>
            </div>
          </div>
        </div>

        {/* Cockpit Grid */}
        <div className="grid lg:grid-cols-3 gap-6 bg-ink-900 border border-ink-600 rounded-md p-6 sm:p-8 shadow-xl">
          {/* Box 1: Steer-by-Wire & Throttle Interactive Control */}
          <div className="space-y-6 flex flex-col justify-between">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-trace mb-4 flex items-center gap-2 font-semibold">
                <FaSlidersH /> Steer &amp; Throttle-by-Wire
              </h3>

              {/* Steer slider */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-paper-muted">Steer Angle (AS5600 Magnetic)</span>
                  <span className="text-trace font-semibold">{steerAngle}&deg;</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={steerAngle}
                  onChange={(e) => setSteerAngle(Number(e.target.value))}
                  className="w-full h-1.5 bg-ink-950 rounded-lg appearance-none cursor-pointer accent-trace"
                />
                <div className="flex justify-between text-[10px] font-mono text-paper-dim">
                  <span>-45&deg; (Full Left)</span>
                  <span>0&deg; (Center)</span>
                  <span>+45&deg; (Full Right)</span>
                </div>
              </div>

              {/* Throttle slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-paper-muted">Throttle Demand (MCP4725 DAC)</span>
                  <span className="text-amber font-semibold">
                    {throttlePercent}% ({((throttlePercent / 100) * 3.4 + 0.8).toFixed(2)}V)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={throttlePercent}
                  onChange={(e) => setThrottlePercent(Number(e.target.value))}
                  className="w-full h-1.5 bg-ink-950 rounded-lg appearance-none cursor-pointer accent-amber"
                />
                <div className="flex justify-between text-[10px] font-mono text-paper-dim">
                  <span>0.8V (Idle Failsafe)</span>
                  <span>4.2V (WOT)</span>
                </div>
              </div>
            </div>

            {/* Sub-node specs */}
            <div className="border-t border-ink-600 pt-4 text-[11px] font-mono text-paper-dim space-y-1">
              <div className="flex justify-between">
                <span>FreeRTOS Task Rate:</span>
                <span className="text-paper">100 Hz PID Loop</span>
              </div>
              <div className="flex justify-between">
                <span>Bus Interface:</span>
                <span className="text-paper">CAN 500 kbps (TWAI)</span>
              </div>
            </div>
          </div>

          {/* Box 2: AEB Autonomous Braking Interactive Benchmark */}
          <div className="space-y-6 flex flex-col justify-between border-y lg:border-y-0 lg:border-x border-ink-600 lg:px-6 py-6 lg:py-0">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-amber mb-4 flex items-center gap-2 font-semibold">
                <FaCarSide /> AEB Emergency Braking Test
              </h3>

              <p className="text-paper-muted text-xs leading-relaxed mb-5">
                Test the vehicle&apos;s dual-stage bang-bang braking actuation triggered by Jetson Orin obstacle detection:
              </p>

              {/* Live readout */}
              <div className="bg-ink-950 p-4 rounded-sm border border-ink-600 mb-5 text-center">
                <div className="grid grid-cols-2 gap-4 border-b border-ink-600 pb-3 mb-3">
                  <div>
                    <div className="font-display font-semibold text-2xl text-trace">{currentSpeed}</div>
                    <div className="font-mono text-[10px] uppercase text-paper-dim">Speed (km/h)</div>
                  </div>
                  <div>
                    <div className="font-display font-semibold text-2xl text-amber">{testDistance}m</div>
                    <div className="font-mono text-[10px] uppercase text-paper-dim">Stopping Dist</div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-paper-muted flex items-center justify-center gap-2">
                  <span>Target: 6.0m</span> ·{' '}
                  <span className={testDistance > 0 && testDistance <= 6.3 ? 'text-green-400 font-semibold' : 'text-paper-dim'}>
                    National Halt: 6.2m (1st Place)
                  </span>
                </div>
              </div>

              <button
                onClick={runBrakingTest}
                disabled={isBrakingTest}
                className={`w-full py-2.5 px-4 rounded-sm font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  isBrakingTest
                    ? 'bg-amber/20 border border-amber/40 text-amber animate-pulse'
                    : 'bg-amber text-white dark:text-ink-950 hover:shadow-[0_0_20px_rgba(255,107,53,0.35)]'
                }`}
              >
                <FaBolt />
                {isBrakingTest ? 'AEB ACTUATION ENGAGED...' : 'TEST AUTONOMOUS EMERGENCY BRAKE'}
              </button>
            </div>

            <div className="text-[11px] font-mono text-paper-dim">
              <span>Reaction delay: &lt;15ms via systemd Jetson CAN pipe</span>
            </div>
          </div>

          {/* Box 3: 24S BMS Real-Time Cell Heatmap */}
          <div className="space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-xs uppercase tracking-wider text-trace flex items-center gap-2 font-semibold">
                  <FaBatteryThreeQuarters /> 24S BMS Live Balancer
                </h3>
                <span className="text-[10px] font-mono text-paper-dim">Pack: 98.8V</span>
              </div>

              <p className="text-paper-muted text-xs leading-relaxed mb-4">
                Reverse-engineered JBD BLE telemetry streaming 24 cell voltages:
              </p>

              {/* 24-cell grid */}
              <div className="grid grid-cols-6 gap-1.5 bg-ink-950 p-3 rounded-sm border border-ink-600">
                {cells.map((volt, idx) => (
                  <div
                    key={idx}
                    className="p-1 rounded-sm border border-ink-600 bg-ink-900 text-center"
                    title={`Cell ${idx + 1}: ${volt}V`}
                  >
                    <div className="text-[9px] font-mono text-paper-dim">C{idx + 1}</div>
                    <div className="text-[10px] font-mono font-semibold text-trace">{volt}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-ink-600 pt-4 text-[11px] font-mono text-paper-dim flex justify-between">
              <span>Cell Delta: &plusmn;0.012V</span>
              <span className="text-green-400 font-medium">BMS Status: Nominal</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
