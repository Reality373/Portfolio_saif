'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Story } from '@/types';
import {
  FaTimes,
  FaAward,
  FaCheck,
  FaCopy,
  FaCode,
  FaArrowRight,
  FaExclamationCircle,
  FaLightbulb,
  FaClock,
  FaCamera,
  FaMapMarkerAlt,
} from 'react-icons/fa';

interface StoryModalProps {
  story: Story | null;
  onClose: () => void;
}

export default function StoryModal({ story, onClose }: StoryModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (story) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [story, onClose]);

  if (!story) return null;

  const handleCopyCode = () => {
    if (story.snippet?.code) {
      navigator.clipboard.writeText(story.snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-ink-900 border border-ink-600 max-w-3xl w-full max-h-[92vh] overflow-y-auto relative rounded-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 8 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 text-paper-muted hover:text-amber transition-colors p-2 rounded-sm bg-ink-800/90 border border-ink-600 z-20"
            aria-label="Close modal"
          >
            <FaTimes size={15} />
          </button>

          <div className="p-6 sm:p-10 space-y-7">
            {/* Header & Meta */}
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 pr-8">
                <span className="font-mono text-xs text-trace uppercase tracking-wider px-2.5 py-0.5 rounded-sm bg-trace/10 border border-trace/20">
                  {story.category}
                </span>
                {story.badge && (
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs text-amber font-semibold">
                    <FaAward className="text-xs" /> {story.badge}
                  </span>
                )}
                <span className="font-mono text-xs text-paper-dim flex items-center gap-1">
                  <FaClock size={10} /> {story.readTime}
                </span>
                <span className="font-mono text-xs text-paper-dim">· {story.date}</span>
              </div>

              <h2 className="font-display font-semibold text-2xl sm:text-3xl text-paper mb-2 leading-tight">
                {story.title}
              </h2>
              <p className="text-paper-muted font-mono text-xs sm:text-sm">{story.subtitle}</p>
            </div>

            {/* Metrics highlight strip if present */}
            {story.metrics && story.metrics.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 border-y border-ink-600 py-3 bg-ink-950/40 rounded-sm px-3">
                {story.metrics.map((metric) => (
                  <div key={metric.label} className="text-center sm:text-left">
                    <div className="font-display font-semibold text-base sm:text-2xl text-amber">
                      {metric.value}
                    </div>
                    <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wide text-paper-dim mt-0.5 truncate">
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* The Honest Mistake / Rookie Assumption Box */}
            {story.theMistake && (
              <div className="p-4 sm:p-5 rounded-md border border-amber/30 bg-amber/5 space-y-1.5">
                <div className="font-mono text-xs uppercase tracking-wider text-amber font-semibold flex items-center gap-2">
                  <FaExclamationCircle className="text-amber text-xs" />
                  <span>The Rookie Assumption / Mistake</span>
                </div>
                <p className="text-paper leading-relaxed text-xs sm:text-sm font-sans">
                  {story.theMistake}
                </p>
              </div>
            )}

            {/* Narrative Flow: Freeform Sections */}
            <div className="space-y-6 text-paper-muted text-sm sm:text-base leading-relaxed font-sans">
              {story.sections.map((section, idx) => (
                <div key={idx} className="space-y-2">
                  {section.heading && (
                    <h3 className="font-display font-semibold text-base sm:text-lg text-paper">
                      {section.heading}
                    </h3>
                  )}
                  <p className="leading-relaxed text-paper-muted">{section.content}</p>
                  {section.callout && (
                    <div className="my-3 p-3 sm:p-4 bg-ink-950/70 border-l-2 border-amber rounded-r-sm text-xs sm:text-sm text-paper italic font-mono">
                      {section.callout}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Optional Photo / Field Snapshot Card */}
            {story.photo && (
              <div className="bg-ink-950 border border-ink-600 rounded-md p-4 space-y-2">
                <div className="flex items-center justify-between font-mono text-[10px] text-paper-dim pb-1.5 border-b border-ink-600/60">
                  <span className="flex items-center gap-1.5 text-trace">
                    <FaCamera size={10} /> Field Snapshot
                  </span>
                  {story.photo.location && (
                    <span className="flex items-center gap-1 text-paper-dim">
                      <FaMapMarkerAlt size={9} /> {story.photo.location}
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs text-paper-muted leading-relaxed">
                  {story.photo.caption}
                </p>
              </div>
            )}

            {/* Code Snippet if present */}
            {story.snippet && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-paper-dim flex items-center gap-2">
                    <FaCode className="text-trace" /> {story.snippet.title}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 border border-ink-600 text-paper-muted hover:text-amber hover:border-amber transition-colors rounded-sm bg-ink-800"
                  >
                    {copied ? (
                      <>
                        <FaCheck className="text-green-500 text-xs" /> Copied!
                      </>
                    ) : (
                      <>
                        <FaCopy className="text-xs" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-ink-950 p-3 sm:p-4 rounded-sm border border-ink-600 overflow-x-auto">
                  <pre className="font-mono text-xs text-paper leading-relaxed">
                    <code>{story.snippet.code}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* The Hard-Earned Lesson & Growth Box */}
            <div className="p-4 sm:p-6 rounded-md border border-trace/40 bg-trace/5 space-y-2">
              <h4 className="font-mono text-[11px] uppercase tracking-wider text-trace font-semibold flex items-center gap-2">
                <FaLightbulb size={11} /> What This Taught Me as an Engineer
              </h4>
              <p className="text-paper text-xs sm:text-sm leading-relaxed font-medium">
                {story.theLesson}
              </p>
            </div>

            {/* Tags & Related project footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-ink-600">
              <div className="flex flex-wrap gap-1.5">
                {story.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-mono px-2 py-0.5 border border-ink-600 text-paper-muted rounded-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {story.relatedProjectId && (
                <a
                  href={`#projects`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-amber hover:underline"
                >
                  View Related Project <FaArrowRight className="text-[10px]" />
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
