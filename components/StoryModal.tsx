'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Story } from '@/types';
import { FaTimes, FaAward, FaCheck, FaCopy, FaCode, FaArrowRight } from 'react-icons/fa';

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
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-ink-900 border border-ink-600 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative rounded-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 text-paper-muted hover:text-amber transition-colors p-2 rounded-sm bg-ink-800/90 border border-ink-600 z-20"
            aria-label="Close modal"
          >
            <FaTimes size={15} />
          </button>

          <div className="p-5 sm:p-10 space-y-6 sm:space-y-8">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 pr-8">
                <span className="font-mono text-xs text-trace uppercase tracking-wider px-2 py-0.5 rounded-sm bg-trace/10 border border-trace/20">
                  {story.category}
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-amber font-semibold">
                  <FaAward className="text-xs sm:text-sm" /> {story.badge}
                </span>
                <span className="font-mono text-xs text-paper-dim">· {story.date}</span>
              </div>

              <h2 className="font-display font-semibold text-2xl sm:text-4xl text-paper mb-2 leading-tight">
                {story.title}
              </h2>
              <p className="text-trace font-mono text-xs sm:text-base">{story.subtitle}</p>
            </div>

            {/* Metrics highlight strip */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 border-y border-ink-600 py-3 sm:py-4 bg-ink-950/40 rounded-sm px-2.5 sm:px-4">
              {story.metrics.map((metric) => (
                <div key={metric.label} className="text-center sm:text-left">
                  <div className="font-display font-semibold text-lg sm:text-3xl text-amber">
                    {metric.value}
                  </div>
                  <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wide text-paper-dim mt-0.5 truncate">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Context */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="font-mono text-xs uppercase tracking-wider text-trace flex items-center gap-2 font-semibold">
                <span>01</span> The Context &amp; Architecture
              </h3>
              <p className="text-paper-muted leading-relaxed text-xs sm:text-base">
                {story.context}
              </p>
            </div>

            {/* The Crisis / Challenge */}
            <div className="space-y-2 sm:space-y-3 p-4 sm:p-5 rounded-sm border border-amber/30 bg-amber/5">
              <h3 className="font-mono text-xs uppercase tracking-wider text-amber flex items-center gap-2 font-semibold">
                <span>02</span> The Crisis / Engineering Bottleneck
              </h3>
              <p className="text-paper leading-relaxed text-xs sm:text-base">
                {story.crisisOrChallenge}
              </p>
            </div>

            {/* The Solution */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="font-mono text-xs uppercase tracking-wider text-trace flex items-center gap-2 font-semibold">
                <span>03</span> The Deep-Dive Solution &amp; Execution
              </h3>
              <div className="text-paper-muted leading-relaxed text-xs sm:text-base space-y-3">
                {story.engineeringSolution.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            {/* Code Snippet if present */}
            {story.snippet && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-paper-dim flex items-center gap-2">
                    <FaCode className="text-trace" /> {story.snippet.title}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 font-mono text-xs px-2 py-0.5 border border-ink-600 text-paper-muted hover:text-amber hover:border-amber transition-colors rounded-sm bg-ink-800"
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

            {/* Key Takeaway box */}
            <div className="p-4 sm:p-5 rounded-sm border border-trace/30 bg-trace/5">
              <h4 className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-trace mb-1.5 font-semibold">
                Core Engineering Principle
              </h4>
              <blockquote className="text-paper text-xs sm:text-base font-medium italic leading-relaxed">
                &ldquo;{story.takeaway}&rdquo;
              </blockquote>
            </div>

            {/* Tags & Related project */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-ink-600">
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {story.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] sm:text-xs font-mono px-2 py-0.5 sm:px-2.5 sm:py-1 border border-ink-600 text-paper-muted rounded-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {story.relatedProjectId && (
                <a
                  href={`#projects`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-mono text-amber hover:underline"
                >
                  View Related Project <FaArrowRight className="text-[10px] sm:text-xs" />
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
