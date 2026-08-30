'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Story } from '@/types';
import {
  FaTimes,
  FaAward,
  FaCheck,
  FaCopy,
  FaCode,
  FaArrowRight,
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationCircle,
  FaLightbulb,
  FaClock,
  FaCamera,
  FaMapMarkerAlt,
  FaKeyboard,
} from 'react-icons/fa';

interface StoryModalProps {
  story: Story | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalStories?: number;
  prevStoryTitle?: string;
  nextStoryTitle?: string;
}

export default function StoryModal({
  story,
  onClose,
  onPrev,
  onNext,
  hasPrev = true,
  hasNext = true,
  currentIndex,
  totalStories,
  prevStoryTitle,
  nextStoryTitle,
}: StoryModalProps) {
  const [copied, setCopied] = useState(false);
  const isStoryOpen = Boolean(story);
  const storyId = story?.id;
  const modalContentRef = useRef<HTMLDivElement | null>(null);

  // Lock background scroll only when modal opens, and restore exact scroll position when it closes
  useEffect(() => {
    if (!isStoryOpen) return;

    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar removal to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow || '';
      document.body.style.paddingRight = originalPaddingRight || '';
      // Ensure the background page remains at the exact scroll position
      window.scrollTo(0, scrollY);
    };
  }, [isStoryOpen]);

  // Keyboard navigation: Escape to close, Left Arrow for Prev, Right Arrow for Next
  useEffect(() => {
    if (!isStoryOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        if (onPrev && hasPrev) {
          e.preventDefault();
          onPrev();
        }
      } else if (e.key === 'ArrowRight') {
        if (onNext && hasNext) {
          e.preventDefault();
          onNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStoryOpen, storyId, onClose, onPrev, onNext, hasPrev, hasNext]);

  // Reset modal scroll position to top whenever story changes
  useEffect(() => {
    if (modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [storyId]);

  if (!story) return null;

  const handleCopyCode = () => {
    if (story.snippet?.code) {
      navigator.clipboard.writeText(story.snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const storyNumber = currentIndex !== undefined ? currentIndex + 1 : undefined;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Floating Side Arrow Left (Desktop) */}
        {onPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            disabled={!hasPrev}
            className="hidden md:flex fixed left-4 lg:left-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-ink-900/90 border border-ink-600 text-paper-muted hover:text-amber hover:border-amber hover:bg-ink-800 transition-all duration-200 shadow-xl disabled:opacity-30 disabled:cursor-not-allowed group items-center justify-center"
            title="Previous Story (Left Arrow key)"
            aria-label="Previous story"
          >
            <FaChevronLeft className="text-sm group-hover:-translate-x-0.5 transition-transform" />
            <span className="sr-only">Previous Story</span>
          </button>
        )}

        {/* Floating Side Arrow Right (Desktop) */}
        {onNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            disabled={!hasNext}
            className="hidden md:flex fixed right-4 lg:right-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-ink-900/90 border border-ink-600 text-paper-muted hover:text-amber hover:border-amber hover:bg-ink-800 transition-all duration-200 shadow-xl disabled:opacity-30 disabled:cursor-not-allowed group items-center justify-center"
            title="Next Story (Right Arrow key)"
            aria-label="Next story"
          >
            <FaChevronRight className="text-sm group-hover:translate-x-0.5 transition-transform" />
            <span className="sr-only">Next Story</span>
          </button>
        )}

        <motion.div
          ref={modalContentRef}
          className="bg-ink-900 border border-ink-600 max-w-3xl w-full max-h-[92vh] overflow-y-auto relative rounded-md shadow-2xl scroll-smooth"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 8 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        >
          {/* Top Sticky Navigation Bar */}
          <div className="sticky top-0 bg-ink-900/95 backdrop-blur-sm border-b border-ink-600/80 px-3 sm:px-8 py-2.5 sm:py-3 z-30 flex items-center justify-between gap-2 sm:gap-3">
            {/* Story index & Keyboard hint */}
            <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[11px] sm:text-xs text-paper-dim">
              {storyNumber !== undefined && totalStories !== undefined && (
                <span className="bg-ink-950 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-sm border border-ink-600 text-paper font-semibold text-[10px] sm:text-xs">
                  Story {String(storyNumber).padStart(2, '0')} / {String(totalStories).padStart(2, '0')}
                </span>
              )}
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-paper-dim px-2 py-0.5 rounded bg-ink-800/60 border border-ink-600/40">
                <FaKeyboard className="text-trace text-[10px]" /> <kbd className="font-mono">←</kbd> / <kbd className="font-mono">→</kbd> keys
              </span>
            </div>

            {/* Prev / Next & Close Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              {onPrev && (
                <button
                  onClick={onPrev}
                  disabled={!hasPrev}
                  className="inline-flex items-center gap-1 font-mono text-[11px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-sm bg-ink-800 border border-ink-600 text-paper-muted hover:text-amber hover:border-amber transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Previous Story (Left Arrow)"
                  aria-label="Previous story"
                >
                  <FaArrowLeft className="text-[9px] sm:text-[10px]" />
                  <span className="hidden xs:inline">Prev</span>
                </button>
              )}

              {onNext && (
                <button
                  onClick={onNext}
                  disabled={!hasNext}
                  className="inline-flex items-center gap-1 font-mono text-[11px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-sm bg-ink-800 border border-ink-600 text-paper-muted hover:text-amber hover:border-amber transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Next Story (Right Arrow)"
                  aria-label="Next story"
                >
                  <span className="hidden xs:inline">Next</span>
                  <FaArrowRight className="text-[9px] sm:text-[10px]" />
                </button>
              )}

              <button
                onClick={onClose}
                className="text-paper-muted hover:text-amber transition-colors p-1 sm:p-2 rounded-sm bg-ink-800 border border-ink-600 ml-0.5 sm:ml-1"
                title="Close (Escape key)"
                aria-label="Close modal"
              >
                <FaTimes size={12} />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-8 md:p-10 space-y-5 sm:space-y-7">
            {/* Header & Meta */}
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mb-2.5 sm:mb-3">
                <span className="font-mono text-[10px] sm:text-xs text-trace uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-sm bg-trace/10 border border-trace/20">
                  {story.category}
                </span>
                {story.badge && (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] sm:text-xs text-amber font-semibold">
                    <FaAward className="text-xs" /> {story.badge}
                  </span>
                )}
                <span className="font-mono text-[10px] sm:text-xs text-paper-dim flex items-center gap-1">
                  <FaClock size={9} /> {story.readTime}
                </span>
                <span className="font-mono text-[10px] sm:text-xs text-paper-dim">· {story.date}</span>
              </div>

              <h2 className="font-display font-semibold text-xl sm:text-3xl text-paper mb-1.5 sm:mb-2 leading-tight">
                {story.title}
              </h2>
              <p className="text-paper-muted font-mono text-xs sm:text-sm">{story.subtitle}</p>
            </div>

            {/* Metrics highlight strip if present */}
            {story.metrics && story.metrics.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5 sm:gap-4 border-y border-ink-600 py-2 sm:py-3 bg-ink-950/40 rounded-sm px-2 sm:px-4">
                {story.metrics.map((metric) => (
                  <div key={metric.label} className="text-center sm:text-left">
                    <div className="font-display font-semibold text-sm sm:text-xl md:text-2xl text-amber">
                      {metric.value}
                    </div>
                    <div className="font-mono text-[8px] sm:text-[10px] uppercase tracking-wide text-paper-dim mt-0.5 truncate">
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

            {/* Bottom Story-to-Story Navigation Footer */}
            {(onPrev || onNext) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-ink-600/70">
                {onPrev ? (
                  <button
                    onClick={onPrev}
                    disabled={!hasPrev}
                    className="text-left p-3.5 rounded-sm bg-ink-950 border border-ink-600 hover:border-amber/60 transition-all duration-200 group flex flex-col justify-between disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-paper-dim group-hover:text-amber mb-1 uppercase tracking-wider">
                      <FaArrowLeft className="text-[9px] group-hover:-translate-x-0.5 transition-transform" /> Previous Story
                    </div>
                    {prevStoryTitle && (
                      <div className="font-display font-semibold text-xs sm:text-sm text-paper group-hover:text-amber line-clamp-1">
                        {prevStoryTitle}
                      </div>
                    )}
                  </button>
                ) : (
                  <div />
                )}

                {onNext && (
                  <button
                    onClick={onNext}
                    disabled={!hasNext}
                    className="text-right p-3.5 rounded-sm bg-ink-950 border border-ink-600 hover:border-amber/60 transition-all duration-200 group flex flex-col justify-between items-end disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-paper-dim group-hover:text-amber mb-1 uppercase tracking-wider">
                      Next Story <FaArrowRight className="text-[9px] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    {nextStoryTitle && (
                      <div className="font-display font-semibold text-xs sm:text-sm text-paper group-hover:text-amber line-clamp-1">
                        {nextStoryTitle}
                      </div>
                    )}
                  </button>
                )}
              </div>
            )}

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
