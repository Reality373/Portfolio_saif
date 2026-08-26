'use client';

import { motion } from 'framer-motion';
import { Story } from '@/types';
import { FaArrowRight, FaCode, FaAward } from 'react-icons/fa';

interface StoryCardProps {
  story: Story;
  onSelect: (story: Story) => void;
}

export default function StoryCard({ story, onSelect }: StoryCardProps) {
  return (
    <motion.div
      className="group relative cursor-pointer border border-ink-600 bg-ink-900 hover:border-amber/60 transition-all duration-300 overflow-hidden rounded-md p-7 flex flex-col justify-between shadow-sm hover:shadow-md"
      onClick={() => onSelect(story)}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`);
      }}
      whileHover={{ y: -4 }}
      layout
    >
      {/* Interactive cursor-tracking spotlight glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background:
            'radial-gradient(400px circle at var(--x,50%) var(--y,0%), var(--spotlight-color), transparent 65%)',
        }}
      />

      <div className="relative z-10">
        {/* Top category & badge */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="font-mono text-xs text-trace uppercase tracking-wider px-2.5 py-0.5 rounded-sm bg-trace/10 border border-trace/20">
            {story.category}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-amber font-medium">
            <FaAward className="text-xs" /> {story.badge}
          </span>
        </div>

        {/* Title & subtitle */}
        <h3 className="font-display font-semibold text-2xl text-paper mb-2 group-hover:text-amber transition-colors">
          {story.title}
        </h3>
        <p className="font-mono text-xs text-paper-dim mb-4 line-clamp-2">
          {story.subtitle}
        </p>

        {/* Story summary */}
        <p className="text-paper-muted text-sm leading-relaxed mb-6 line-clamp-3">
          {story.summary}
        </p>

        {/* Key metrics strip if present */}
        {story.metrics && story.metrics.length > 0 && (
          <div className="grid grid-cols-3 gap-3 border-y border-ink-600/70 py-3 mb-5 bg-ink-950/40 rounded-sm px-3">
            {story.metrics.map((m) => (
              <div key={m.label} className="text-center">
                <div className="font-display font-semibold text-base sm:text-lg text-amber leading-tight">
                  {m.value}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-paper-dim mt-0.5 truncate">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tech tags */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {story.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono px-2 py-0.5 border border-ink-600 text-paper-dim rounded-sm"
            >
              {tag}
            </span>
          ))}
          {story.tags.length > 4 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 text-paper-dim">
              +{story.tags.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="relative z-10 flex items-center justify-between pt-3 border-t border-ink-600/50 text-xs font-mono text-paper-muted group-hover:text-amber transition-colors">
        <div className="flex items-center gap-2 text-[11px]">
          {story.photo && (
            <span className="text-paper-dim flex items-center gap-1" title="Includes field snapshot">
              📷
            </span>
          )}
          {story.snippet && <FaCode className="text-trace" title="Includes code snippet" />}
          <span>{story.readTime}</span>
        </div>
        <span className="inline-flex items-center gap-1 font-semibold group-hover:translate-x-1 transition-transform">
          Read Story <FaArrowRight className="text-[10px]" />
        </span>
      </div>
    </motion.div>
  );
}
