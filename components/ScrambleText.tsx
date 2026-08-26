'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useHUD } from './HUDProvider';

interface ScrambleTextProps {
  text: string;
  className?: string;
  scrambleOnHover?: boolean;
  scrambleOnMount?: boolean;
  triggerKey?: any;
}

const GLYPHS = '!<>-_\\/[]{}—=+*^?#________010101';

export default function ScrambleText({
  text,
  className = '',
  scrambleOnHover = true,
  scrambleOnMount = true,
  triggerKey,
}: ScrambleTextProps) {
  const { settings } = useHUD();
  const [displayText, setDisplayText] = useState(text);
  const isScrambling = useRef(false);
  const frameRef = useRef<number | null>(null);

  const startScramble = useCallback(() => {
    if (!settings.scrambleEffects || isScrambling.current) return;
    isScrambling.current = true;

    let iteration = 0;
    const maxIterations = text.length;

    const update = () => {
      setDisplayText(() =>
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return text[index];
            }
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join('')
      );

      if (iteration < maxIterations) {
        iteration += 1 / 2;
        frameRef.current = requestAnimationFrame(update);
      } else {
        setDisplayText(text);
        isScrambling.current = false;
      }
    };

    frameRef.current = requestAnimationFrame(update);
  }, [text, settings.scrambleEffects]);

  useEffect(() => {
    if (scrambleOnMount && settings.scrambleEffects) {
      startScramble();
    } else {
      setDisplayText(text);
    }
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      isScrambling.current = false;
    };
  }, [text, triggerKey, scrambleOnMount, settings.scrambleEffects, startScramble]);

  if (!settings.scrambleEffects) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span
      className={`inline-block cursor-default font-inherit ${className}`}
      onMouseEnter={() => {
        if (scrambleOnHover) startScramble();
      }}
    >
      {displayText}
    </span>
  );
}
