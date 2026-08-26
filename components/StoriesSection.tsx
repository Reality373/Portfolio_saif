'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STORIES } from '@/lib/stories';
import { Story } from '@/types';
import StoryCard from './StoryCard';
import StoryModal from './StoryModal';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { FaBookOpen, FaFilter } from 'react-icons/fa';
import ScrambleText from './ScrambleText';

const ALL_CATEGORY = 'All Stories';

export default function StoriesSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY);
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  const categories = [
    ALL_CATEGORY,
    'Embedded & Crisis',
    'Performance & Security',
    'Solo Shipping',
    'Reverse Engineering',
    'AI & Web3',
  ];

  const filteredStories =
    selectedCategory === ALL_CATEGORY
      ? STORIES
      : STORIES.filter((s) => s.category === selectedCategory);

  return (
    <section id="stories" className="bg-ink-950 py-24 px-6 relative border-t border-ink-600">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-3">
            <p className="font-mono text-sm text-amber">02 · Stories &amp; Field Notes</p>
            <span className="w-1.5 h-1.5 rounded-full bg-amber" />
            <span className="font-mono text-xs text-paper-dim">Engineering War Stories</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="font-display font-semibold text-3xl sm:text-4xl text-paper mb-3">
                <ScrambleText text="Experience from the trenches" />
              </h2>
              <p className="text-paper-muted font-mono text-sm max-w-2xl leading-relaxed">
                Raw technical breakthroughs, midnight hardware crisis migrations, microsecond assembly optimizations, and solo shipping milestones.
              </p>
            </div>

            {/* Quick stats badge */}
            <div className="flex items-center gap-4 border border-ink-600 bg-ink-900 px-4 py-2.5 rounded-sm shrink-0">
              <FaBookOpen className="text-trace text-sm" />
              <div className="font-mono text-xs">
                <span className="text-paper font-semibold">{STORIES.length}</span> Field Notes Published
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Filter Tabs */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap items-center gap-2 mb-10 pb-4 border-b border-ink-600/60"
        >
          <div className="flex items-center gap-1.5 text-xs font-mono text-paper-dim mr-2">
            <FaFilter className="text-[10px]" /> Filter:
          </div>
          {categories.map((cat) => {
            const count =
              cat === ALL_CATEGORY
                ? STORIES.length
                : STORIES.filter((s) => s.category === cat).length;
            const isActive = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`font-mono text-xs px-3 py-1.5 rounded-sm transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber text-ink-950 font-semibold shadow-sm'
                    : 'bg-ink-900 border border-ink-600 text-paper-muted hover:border-paper-dim hover:text-paper'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-ink-950/20 text-ink-950' : 'bg-ink-800 text-paper-dim'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* Stories Grid */}
        <motion.div
          layout
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onSelect={(s) => setActiveStory(s)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Interactive Modal */}
      <StoryModal story={activeStory} onClose={() => setActiveStory(null)} />
    </section>
  );
}
