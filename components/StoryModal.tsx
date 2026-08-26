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
  FaCamera,
  FaBalanceScale,
  FaMapMarkerAlt,
  FaClock,
  FaLightbulb,
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
          className="bg-ink-900 border border-ink-600 max-w-4xl w-full max-h-[92vh] overflow-y-auto relative rounded-md shadow-2xl"
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

          <div className="p-5 sm:p-10 space-y-7 sm:space-y-9">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 pr-8">
                <span className="font-mono text-xs text-trace uppercase tracking-wider px-2.5 py-0.5 rounded-sm bg-trace/10 border border-trace/20">
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

            {/* Section 1: The Scene & Atmosphere */}
            {story.sceneSetting && (
              <div className="space-y-2.5 bg-ink-950/70 p-4 sm:p-6 rounded-md border border-ink-600/70">
                <h3 className="font-mono text-xs uppercase tracking-wider text-amber flex items-center gap-2 font-semibold">
                  <FaMapMarkerAlt className="text-amber text-xs" />
                  <span>01</span> Setting the Scene &amp; Atmosphere
                </h3>
                <p className="text-paper-muted leading-relaxed text-xs sm:text-base italic font-serif sm:font-sans">
                  &ldquo;{story.sceneSetting}&rdquo;
                </p>
              </div>
            )}

            {/* Section 2: The Context & Architecture */}
            <div className="space-y-2.5">
              <h3 className="font-mono text-xs uppercase tracking-wider text-trace flex items-center gap-2 font-semibold">
                <span>02</span> Architectural Context
              </h3>
              <p className="text-paper-muted leading-relaxed text-xs sm:text-base">
                {story.context}
              </p>
            </div>

            {/* Section 3: The Crisis / Engineering Bottleneck */}
            <div className="space-y-2.5 p-4 sm:p-5 rounded-sm border border-amber/30 bg-amber/5">
              <h3 className="font-mono text-xs uppercase tracking-wider text-amber flex items-center gap-2 font-semibold">
                <span>03</span> The Crisis / Engineering Bottleneck
              </h3>
              <p className="text-paper leading-relaxed text-xs sm:text-base">
                {story.crisisOrChallenge}
              </p>
            </div>

            {/* Section 4: Decisions & Trade-Offs Matrix */}
            {story.tradeoffs && story.tradeoffs.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-mono text-xs uppercase tracking-wider text-trace flex items-center gap-2 font-semibold">
                  <FaBalanceScale className="text-trace text-sm" />
                  <span>04</span> The Fork in the Road: Critical Trade-Offs
                </h3>
                <p className="text-paper-muted text-xs font-mono">
                  Evaluating options under real-world constraints before committing to implementation:
                </p>

                <div className="grid md:grid-cols-3 gap-3">
                  {story.tradeoffs.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 sm:p-4 rounded-md border flex flex-col justify-between transition-all ${
                        item.selected
                          ? 'border-amber bg-amber/10 shadow-md'
                          : 'border-ink-600 bg-ink-950/50 opacity-80'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[10px] uppercase font-bold text-paper-dim">
                            Option {String.fromCharCode(65 + idx)}
                          </span>
                          {item.selected && (
                            <span className="bg-amber text-ink-950 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-xs">
                              CHOSEN PATH
                            </span>
                          )}
                        </div>
                        <h4 className="font-display font-semibold text-sm text-paper mb-2">
                          {item.option}
                        </h4>
                        <div className="space-y-1.5 text-xs font-mono">
                          <div className="text-green-400">
                            <span className="font-bold">PRO:</span> {item.pros}
                          </div>
                          <div className="text-red-400">
                            <span className="font-bold">CON:</span> {item.cons}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 5: The Thought Process & Deep Dive Solution */}
            <div className="space-y-3">
              <h3 className="font-mono text-xs uppercase tracking-wider text-trace flex items-center gap-2 font-semibold">
                <FaLightbulb className="text-trace text-sm" />
                <span>05</span> The Engineering Thought Process &amp; Execution
              </h3>
              {story.theThoughtProcess && (
                <div className="text-paper leading-relaxed text-xs sm:text-base space-y-3 bg-ink-950/50 p-4 sm:p-5 rounded-md border border-ink-600">
                  {story.theThoughtProcess.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              )}
              <div className="text-paper-muted leading-relaxed text-xs sm:text-base space-y-3 pt-2">
                {story.engineeringSolution.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            {/* Section 6: Testing Snapshots & Field Notes Gallery */}
            {story.photos && story.photos.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-mono text-xs uppercase tracking-wider text-amber flex items-center gap-2 font-semibold">
                  <FaCamera className="text-amber text-sm" />
                  <span>06</span> Field Notes &amp; Testing Snapshots
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  {story.photos.map((photo, i) => (
                    <div
                      key={i}
                      className="bg-ink-950 border border-ink-600 rounded-md p-3.5 flex flex-col justify-between shadow-inner"
                    >
                      {/* Photo Header meta */}
                      <div className="flex items-center justify-between font-mono text-[10px] text-paper-dim mb-2 pb-1.5 border-b border-ink-600/60">
                        <span className="flex items-center gap-1">
                          <FaMapMarkerAlt className="text-trace text-[9px]" /> {photo.location}
                        </span>
                        <span className="flex items-center gap-1 text-amber">
                          <FaClock className="text-[9px]" /> {photo.timestamp}
                        </span>
                      </div>

                      {/* Photo Blueprint / Testing Card */}
                      <div className="w-full h-36 bg-ink-900 border border-dashed border-ink-600 rounded-sm flex flex-col items-center justify-center p-4 text-center my-2 group hover:border-amber/60 transition-colors">
                        <FaCamera className="text-paper-dim text-2xl mb-2 group-hover:text-amber transition-colors" />
                        <span className="font-mono text-[10px] text-paper-dim font-bold">
                          TESTING SNAPSHOT #{i + 1}
                        </span>
                        <span className="font-mono text-[9px] text-trace mt-0.5">
                          {photo.location}
                        </span>
                      </div>

                      {/* Caption */}
                      <p className="font-mono text-xs text-paper-muted leading-relaxed mt-1">
                        {photo.caption}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 7: Code Snippet if present */}
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
                        <FaCopy className="text-xs" /> Copy Code
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

            {/* Section 8: Hard-Earned Lesson & Principle */}
            <div className="p-4 sm:p-6 rounded-md border border-trace/40 bg-trace/5">
              <h4 className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-trace mb-2 font-semibold">
                Hard-Earned Engineering Principle &amp; Lesson
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
