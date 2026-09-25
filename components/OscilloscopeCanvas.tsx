'use client';

import { useEffect, useRef } from 'react';
import { useHUD } from './HUDProvider';
import { useTheme } from './ThemeProvider';

interface Burst {
  x: number;
  born: number;
}

const DIV_X = 12;
const DIV_Y = 8;
const SWEEP_SECONDS = 1.8;

function readRGB(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value ? value.split(/\s+/).join(', ') : fallback;
}

/**
 * Hero backdrop that behaves like a real scope: a beam sweeps left→right,
 * the phosphor fades behind it, the cursor acts as a probe that injects
 * a local disturbance, and a click fires a ringing trigger burst.
 * CH2 underneath streams a random CAN-style bitstream.
 */
export default function OscilloscopeCanvas() {
  const { settings } = useHUD();
  const { resolvedTheme } = useTheme();
  const gridRef = useRef<HTMLCanvasElement | null>(null);
  const traceRef = useRef<HTMLCanvasElement | null>(null);
  const readoutRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!settings.particleCanvas) return;
    const grid = gridRef.current;
    const trace = traceRef.current;
    const host = trace?.parentElement;
    if (!grid || !trace || !host) return;
    const gctx = grid.getContext('2d');
    const ctx = trace.getContext('2d');
    if (!gctx || !ctx) return;

    const isDark = resolvedTheme === 'dark';
    const ch1 = readRGB('--color-amber', '255, 122, 48');
    const ch2 = readRGB('--color-trace', '92, 255, 170');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const drawGraticule = () => {
      gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gctx.clearRect(0, 0, width, height);
      const dx = width / DIV_X;
      const dy = height / DIV_Y;
      gctx.strokeStyle = `rgba(${ch2}, ${isDark ? 0.07 : 0.12})`;
      gctx.lineWidth = 1;
      gctx.beginPath();
      for (let i = 1; i < DIV_X; i++) {
        gctx.moveTo(Math.round(i * dx) + 0.5, 0);
        gctx.lineTo(Math.round(i * dx) + 0.5, height);
      }
      for (let j = 1; j < DIV_Y; j++) {
        gctx.moveTo(0, Math.round(j * dy) + 0.5);
        gctx.lineTo(width, Math.round(j * dy) + 0.5);
      }
      gctx.stroke();

      // Center axes with minor ticks, like a real graticule
      const cx = Math.round(width / 2) + 0.5;
      const cy = Math.round(height / 2) + 0.5;
      gctx.strokeStyle = `rgba(${ch2}, ${isDark ? 0.16 : 0.22})`;
      gctx.beginPath();
      gctx.moveTo(cx, 0);
      gctx.lineTo(cx, height);
      gctx.moveTo(0, cy);
      gctx.lineTo(width, cy);
      for (let x = 0; x < width; x += dx / 5) {
        gctx.moveTo(x, cy - 3);
        gctx.lineTo(x, cy + 3);
      }
      for (let y = 0; y < height; y += dy / 5) {
        gctx.moveTo(cx - 3, y);
        gctx.lineTo(cx + 3, y);
      }
      gctx.stroke();
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      for (const c of [grid, trace]) {
        c.width = Math.floor(width * dpr);
        c.height = Math.floor(height * dpr);
        c.style.width = `${width}px`;
        c.style.height = `${height}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawGraticule();
    };
    resize();

    // Probe (cursor) state, smoothed so the signal glides rather than jumps
    const probe = { x: width * 0.7, y: height * 0.5, active: false, strength: 0 };
    let freq = 1;
    let amp = 1;
    const bursts: Burst[] = [];

    // CH2: random CAN-ish frame bits
    const bits: number[] = Array.from({ length: 512 }, () => (Math.random() > 0.5 ? 1 : 0));

    const onMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      probe.x = e.clientX - rect.left;
      probe.y = e.clientY - rect.top;
      probe.active = probe.y >= 0 && probe.y <= rect.height;
    };
    const onLeave = () => {
      probe.active = false;
    };
    const onDown = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      bursts.push({ x: e.clientX - rect.left, born: performance.now() });
      if (bursts.length > 6) bursts.shift();
    };

    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    host.addEventListener('pointerdown', onDown);
    window.addEventListener('resize', resize);

    const ch1Y = (x: number, t: number) => {
      const mid = height * 0.46;
      const base = height * 0.11 * amp;
      const k = (Math.PI * 2 * 2.2 * freq) / width;
      let y =
        Math.sin(k * x - t * 2.4) * base +
        Math.sin(k * 3.1 * x - t * 4.1) * base * 0.22 +
        Math.sin(k * 0.5 * x + t * 0.7) * base * 0.35;

      if (probe.strength > 0.01) {
        const d = x - probe.x;
        const env = Math.exp(-(d * d) / (2 * 70 * 70));
        y += env * Math.sin(x * 0.16 - t * 14) * height * 0.07 * probe.strength;
      }

      const now = t * 1000;
      for (const b of bursts) {
        const age = (now - b.born) / 1000;
        if (age > 3) continue;
        const front = Math.abs(x - b.x) - age * 420;
        const env = Math.exp(-(front * front) / (2 * 55 * 55)) * Math.exp(-age * 1.1);
        y += env * Math.sin(x * 0.09 - age * 30) * height * 0.16;
      }
      return mid + y;
    };

    const bitWidth = 16;
    const ch2Y = (x: number, t: number) => {
      const top = height * 0.8;
      const swing = height * 0.045;
      const pos = x + t * 90;
      const idx = Math.floor(pos / bitWidth);
      const frac = (pos % bitWidth) / bitWidth;
      const cur = bits[((idx % bits.length) + bits.length) % bits.length];
      const prev = bits[(((idx - 1) % bits.length) + bits.length) % bits.length];
      // Finite slew rate on edges so it reads like a real bus, not a vector drawing
      const level = cur !== prev && frac < 0.12 ? prev + (cur - prev) * (frac / 0.12) : cur;
      return top - level * swing;
    };

    const strokeSegment = (
      fn: (x: number, t: number) => number,
      x0: number,
      x1: number,
      t: number,
      rgb: string,
      alpha: number,
    ) => {
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, fn(x0, t));
      for (let x = x0 + 2; x <= x1; x += 2) ctx.lineTo(x, fn(x, t));
      ctx.lineTo(x1, fn(x1, t));
      // Wide faint pass = phosphor bloom, thin bright pass = the beam core
      ctx.strokeStyle = `rgba(${rgb}, ${alpha * 0.18})`;
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    };

    let raf = 0;
    let visible = true;
    let lastSweep = 0;
    let lastReadout = 0;
    const start = performance.now();

    const frame = (nowMs: number) => {
      const t = (nowMs - start) / 1000;

      probe.strength += ((probe.active ? 1 : 0) - probe.strength) * 0.08;
      const targetFreq = probe.active ? 0.6 + (probe.x / Math.max(width, 1)) * 1.4 : 1;
      const targetAmp = probe.active ? 0.5 + (1 - probe.y / Math.max(height, 1)) * 1.1 : 1;
      freq += (targetFreq - freq) * 0.04;
      amp += (targetAmp - amp) * 0.04;

      // Phosphor decay: erase a little of everything each frame
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0, 0, 0, ${isDark ? 0.045 : 0.07})`;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';

      const sweep = ((t / SWEEP_SECONDS) % 1) * width;
      const segments: Array<[number, number]> =
        sweep >= lastSweep ? [[lastSweep, sweep]] : [[lastSweep, width], [0, sweep]];
      for (const [a, b] of segments) {
        if (b - a < 0.5) continue;
        strokeSegment(ch1Y, a, b, t, ch1, isDark ? 0.95 : 0.85);
        strokeSegment(ch2Y, a, b, t, ch2, isDark ? 0.75 : 0.8);
      }
      lastSweep = sweep;

      // Beam spot at the leading edge
      const spotY = ch1Y(sweep, t);
      const glow = ctx.createRadialGradient(sweep, spotY, 0, sweep, spotY, 5);
      glow.addColorStop(0, `rgba(${ch1}, 0.55)`);
      glow.addColorStop(1, `rgba(${ch1}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(sweep - 5, spotY - 5, 10, 10);

      if (readoutRef.current && nowMs - lastReadout > 120) {
        lastReadout = nowMs;
        const f = (2.2 * freq * 1000) / (SWEEP_SECONDS * 1000);
        const vpp = (amp * 2.4).toFixed(2);
        readoutRef.current.textContent =
          `CH1 ${vpp} Vpp · f ${(f * 1000).toFixed(0)} Hz · ` +
          `TRIG ${bursts.length && nowMs - bursts[bursts.length - 1].born < 1500 ? 'FIRED' : 'AUTO'}`;
      }

      if (visible) raf = requestAnimationFrame(frame);
    };

    if (reduceMotion) {
      // Draw a single still trace
      strokeSegment(ch1Y, 0, width, 0, ch1, 0.8);
      strokeSegment(ch2Y, 0, width, 0, ch2, 0.6);
    } else {
      raf = requestAnimationFrame(frame);
    }

    const io = new IntersectionObserver(([entry]) => {
      const nowVisible = entry.isIntersecting && !document.hidden;
      if (nowVisible && !visible && !reduceMotion) raf = requestAnimationFrame(frame);
      visible = nowVisible;
    });
    io.observe(host);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', resize);
    };
  }, [settings.particleCanvas, resolvedTheme]);

  if (!settings.particleCanvas) return null;

  return (
    <>
      <canvas ref={gridRef} aria-hidden className="absolute inset-0 pointer-events-none z-0" />
      <canvas
        ref={traceRef}
        aria-hidden
        className="absolute inset-0 pointer-events-none z-[1] opacity-60 sm:opacity-75"
        style={{
          maskImage: 'linear-gradient(90deg, rgba(0,0,0,0.35) 0%, black 45%, black 100%)',
          WebkitMaskImage: 'linear-gradient(90deg, rgba(0,0,0,0.35) 0%, black 45%, black 100%)',
        }}
      />
      {/* Instrument readout, top-right like a bench scope's status bar */}
      <div className="hidden lg:flex absolute top-28 right-8 z-[2] flex-col items-end gap-1 pointer-events-none font-mono text-[10px] tracking-wider uppercase">
        <div className="flex items-center gap-2 text-paper-dim">
          <span className="w-1.5 h-1.5 rounded-full bg-trace animate-pulse" />
          <span>RUN · 5 µs/div · 12×8 div</span>
        </div>
        <div ref={readoutRef} className="text-amber/80">
          CH1 2.40 Vpp · f 1222 Hz · TRIG AUTO
        </div>
        <div className="text-paper-dim/80 normal-case tracking-normal">
          move to probe · click to trigger
        </div>
      </div>
    </>
  );
}
