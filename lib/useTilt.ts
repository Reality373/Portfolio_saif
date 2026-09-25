'use client';

import { useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Subtle 3D tilt toward the pointer. Spread `handlers` onto a motion element
 * and merge `style` into its style prop.
 */
export function useTilt(maxDeg = 6) {
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 180, damping: 18, mass: 0.5 };
  const rotateX = useSpring(useTransform(py, [0, 1], [maxDeg, -maxDeg]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-maxDeg, maxDeg]), spring);

  const handlers = {
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'mouse') return;
      const rect = e.currentTarget.getBoundingClientRect();
      px.set((e.clientX - rect.left) / rect.width);
      py.set((e.clientY - rect.top) / rect.height);
    },
    onPointerLeave: () => {
      px.set(0.5);
      py.set(0.5);
    },
  };

  return { handlers, style: { rotateX, rotateY, transformPerspective: 900 } };
}
