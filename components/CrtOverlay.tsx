'use client';

import { useHUD } from './HUDProvider';

/** Page-wide film grain + faint phosphor scanlines (styles in globals.css). */
export default function CrtOverlay() {
  const { settings } = useHUD();
  if (!settings.crtOverlay) return null;
  return <div aria-hidden className="crt-overlay" />;
}
