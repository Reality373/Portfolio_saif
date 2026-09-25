'use client';

import { useEffect, useRef } from 'react';
import { useHUD } from './HUDProvider';

const INTERACTIVE = 'a, button, [role="button"], summary, label, select, .cursor-pointer';

/**
 * Oscilloscope-style cursor: faint full-screen crosshair lines, a precise dot,
 * a lagging probe ring that snaps around links/buttons, and a live X/Y readout.
 * Only mounts on fine pointers (mouse/trackpad); touch devices keep native behavior.
 */
export default function ScopeCursor() {
  const { settings } = useHUD();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const hLineRef = useRef<HTMLDivElement | null>(null);
  const vLineRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!settings.scopeCursor) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const root = rootRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const hLine = hLineRef.current;
    const vLine = vLineRef.current;
    const label = labelRef.current;
    if (!root || !dot || !ring || !hLine || !vLine || !label) return;

    document.documentElement.classList.add('scope-cursor');

    const pos = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100, w: 34, h: 34 };
    let target: DOMRect | null = null;
    let targetName = '';
    let pressed = false;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      pos.x = e.clientX;
      pos.y = e.clientY;
      root.style.opacity = '1';

      const el = (e.target as Element | null)?.closest?.(INTERACTIVE) as HTMLElement | null;
      if (el) {
        target = el.getBoundingClientRect();
        targetName = el.tagName === 'A' ? 'LINK' : 'PROBE';
      } else {
        target = null;
      }
    };
    const onLeave = () => {
      root.style.opacity = '0';
    };
    const onDown = () => {
      pressed = true;
    };
    const onUp = () => {
      pressed = false;
    };

    const tick = () => {
      // Lock the ring around the hovered control; otherwise trail the pointer
      const tx = target ? target.left + target.width / 2 : pos.x;
      const ty = target ? target.top + target.height / 2 : pos.y;
      const tw = target ? Math.min(target.width + 14, 420) : pressed ? 22 : 34;
      const th = target ? Math.min(target.height + 12, 200) : pressed ? 22 : 34;
      const ease = target ? 0.25 : 0.18;
      ringPos.x += (tx - ringPos.x) * ease;
      ringPos.y += (ty - ringPos.y) * ease;
      ringPos.w += (tw - ringPos.w) * 0.2;
      ringPos.h += (th - ringPos.h) * 0.2;

      dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`;
      ring.style.width = `${ringPos.w}px`;
      ring.style.height = `${ringPos.h}px`;
      ring.style.borderRadius = target ? '4px' : '999px';
      ring.dataset.locked = target ? 'true' : 'false';
      hLine.style.transform = `translate3d(0, ${pos.y}px, 0)`;
      vLine.style.transform = `translate3d(${pos.x}px, 0, 0)`;

      const flipX = pos.x > window.innerWidth - 150;
      const flipY = pos.y > window.innerHeight - 40;
      label.style.transform = `translate3d(${pos.x + (flipX ? -14 : 14)}px, ${
        pos.y + (flipY ? -26 : 14)
      }px, 0) translateX(${flipX ? '-100%' : '0'})`;
      label.textContent = target
        ? `▸ ${targetName}`
        : `X ${String(Math.round(pos.x)).padStart(4, '0')}  Y ${String(Math.round(pos.y)).padStart(4, '0')}`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.documentElement.addEventListener('pointerleave', onLeave);
    // Rects go stale when the page scrolls under a still mouse
    const onScroll = () => {
      target = null;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('scope-cursor');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onScroll);
    };
  }, [settings.scopeCursor]);

  if (!settings.scopeCursor) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[70] hidden [@media(pointer:fine)]:block opacity-0 transition-opacity duration-300"
    >
      <div ref={hLineRef} className="absolute left-0 top-0 w-full h-px bg-trace/10" />
      <div ref={vLineRef} className="absolute left-0 top-0 h-full w-px bg-trace/10" />
      <div
        ref={ringRef}
        className="absolute left-0 top-0 border border-amber/70 transition-[border-radius,background-color] duration-200 data-[locked=true]:bg-amber/[0.06] data-[locked=true]:border-amber"
        style={{ width: 34, height: 34 }}
      />
      <div
        ref={dotRef}
        className="absolute left-0 top-0 w-1.5 h-1.5 rounded-full bg-amber shadow-[0_0_10px_rgb(var(--color-amber)/0.9)]"
      />
      <div
        ref={labelRef}
        className="absolute left-0 top-0 font-mono text-[10px] tracking-wider text-trace/80 whitespace-pre bg-ink-950/70 px-1.5 py-0.5 rounded-sm"
      />
    </div>
  );
}
