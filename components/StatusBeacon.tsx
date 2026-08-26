'use client';

import { useState, useEffect } from 'react';
import { useHUD } from './HUDProvider';
import { SITE } from '@/lib/constants';
import { FaCheck, FaCopy, FaEnvelope, FaClock, FaMapMarkerAlt, FaCodeBranch } from 'react-icons/fa';

export default function StatusBeacon() {
  const { settings } = useHUD();
  const [time, setTime] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      try {
        const options: Intl.DateTimeFormatOptions = {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        };
        setTime(new Intl.DateTimeFormat([], options).format(new Date()));
      } catch (e) {
        setTime(new Date().toLocaleTimeString());
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SITE.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  if (!settings.statusBeacon) return null;

  return (
    <div className="w-full border-b border-ink-600/70 bg-ink-900/60 backdrop-blur-sm text-xs font-mono py-2 px-4 z-40 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Availability Status */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-paper-muted">
            <span className="text-paper font-medium">Available</span> for Embedded / Full-Stack &amp; AI Roles
          </span>
        </div>

        {/* Center/Right: Location + Time + Quick Copy */}
        <div className="flex flex-wrap items-center gap-4 text-paper-dim">
          <div className="hidden sm:flex items-center gap-1.5">
            <FaMapMarkerAlt className="text-amber text-[10px]" />
            <span>Pune, India</span>
          </div>

          {time && (
            <div className="hidden md:flex items-center gap-1.5">
              <FaClock className="text-trace text-[10px]" />
              <span>IST {time}</span>
            </div>
          )}

          <div className="hidden lg:flex items-center gap-1.5">
            <FaCodeBranch className="text-trace text-[10px]" />
            <span>488+ Commits Shipped</span>
          </div>

          {/* Quick Copy Email Pill */}
          <button
            onClick={handleCopyEmail}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-ink-600 hover:border-amber bg-ink-950/60 text-paper-muted hover:text-amber transition-all shadow-sm group"
            title="Click to copy email"
          >
            {copied ? (
              <>
                <FaCheck className="text-green-500 text-[10px]" />
                <span className="text-green-500 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <FaEnvelope className="text-[10px] text-trace group-hover:text-amber transition-colors" />
                <span className="text-paper">{SITE.email}</span>
                <FaCopy className="text-[9px] opacity-60 group-hover:opacity-100" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
