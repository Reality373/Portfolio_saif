'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STORIES } from '@/lib/stories';
import { Story, StoryCategory } from '@/types';
import StoryCard from './StoryCard';
import StoryModal from './StoryModal';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { FaBookOpen, FaFilter, FaArrowLeft, FaArrowRight, FaKeyboard } from 'react-icons/fa';
import ScrambleText from './ScrambleText';

const ALL_CATEGORY = 'All Stories';

export default function StoriesSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY);
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  const categories = [
    ALL_CATEGORY,
    'AuraByte (FiberOpticCalc)',
    'Embedded & Crisis',
    'Performance & Security',
    'Architecture & KMP',
    'Defensive Engineering',
    'Solo Shipping',
    'Reverse Engineering',
    'AI & Web3',
  ];

  const isStoryInCategory = (story: Story, category: string): boolean => {
    if (category === ALL_CATEGORY) return true;
    if (story.category === category) return true;
    if (story.categories && story.categories.includes(category as StoryCategory)) return true;
    if (
      category === 'AuraByte (FiberOpticCalc)' &&
      (story.relatedProjectId === 'fiberopticcalc' ||
        story.category === 'AuraByte (FiberOpticCalc)' ||
        story.categories?.includes('AuraByte (FiberOpticCalc)'))
    ) {
      return true;
    }
    return false;
  };

  const getCategoryCount = (category: string): number => {
    if (category === ALL_CATEGORY) return STORIES.length;
    return STORIES.filter((s) => isStoryInCategory(s, category)).length;
  };

  const filteredStories =
    selectedCategory === ALL_CATEGORY
      ? STORIES
      : STORIES.filter((s) => isStoryInCategory(s, selectedCategory));

  const currentIndex = activeStory
    ? filteredStories.findIndex((s) => s.id === activeStory.id)
    : 0;

  const handlePrevStory = () => {
    if (filteredStories.length === 0) return;
    const currentIdx = activeStory
      ? filteredStories.findIndex((s) => s.id === activeStory.id)
      : 0;
    const prevIdx = (currentIdx - 1 + filteredStories.length) % filteredStories.length;
    setActiveStory(filteredStories[prevIdx]);
  };

  const handleNextStory = () => {
    if (filteredStories.length === 0) return;
    const currentIdx = activeStory
      ? filteredStories.findIndex((s) => s.id === activeStory.id)
      : -1;
    const nextIdx = (currentIdx + 1) % filteredStories.length;
    setActiveStory(filteredStories[nextIdx]);
  };

  const prevStoryTitle =
    filteredStories.length > 1 && currentIndex >= 0
      ? filteredStories[(currentIndex - 1 + filteredStories.length) % filteredStories.length]?.title
      : undefined;

  const nextStoryTitle =
    filteredStories.length > 1 && currentIndex >= 0
      ? filteredStories[(currentIndex + 1) % filteredStories.length]?.title
      : undefined;

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
            <span className="font-mono text-xs text-paper-dim">Engineering War Stories &amp; Android Hardening</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="font-display font-semibold text-3xl sm:text-4xl text-paper mb-3">
                <ScrambleText text="Experience from the trenches" />
              </h2>
              <p className="text-paper-muted font-mono text-sm max-w-2xl leading-relaxed">
                Raw technical breakthroughs, midnight hardware crisis migrations, microsecond assembly optimizations, and 15+ production field stories from FiberOpticCalc.
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

        {/* Category Filter Tabs & Navigation Controls */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-ink-600/60"
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-paper-dim mr-2">
              <FaFilter className="text-[10px]" /> Filter:
            </div>
            {categories.map((cat) => {
              const count = getCategoryCount(cat);
              const isActive = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                  }}
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
          </div>

          {/* Quick Prev / Next Arrow Controls */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-paper-dim mr-2">
              <FaKeyboard className="text-trace text-[10px]" /> <kbd className="px-1 py-0.5 bg-ink-900 border border-ink-600 rounded text-paper font-mono text-[10px]">←</kbd> <kbd className="px-1 py-0.5 bg-ink-900 border border-ink-600 rounded text-paper font-mono text-[10px]">→</kbd>
            </span>
            <button
              onClick={handlePrevStory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-ink-900 border border-ink-600 text-paper-muted hover:text-amber hover:border-amber transition-colors"
              title="Previous Story (Left Arrow)"
              aria-label="Previous story"
            >
              <FaArrowLeft className="text-[10px]" />
              <span className="hidden xs:inline">Prev Story</span>
            </button>
            <button
              onClick={handleNextStory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-ink-900 border border-ink-600 text-paper-muted hover:text-amber hover:border-amber transition-colors"
              title="Next Story (Right Arrow)"
              aria-label="Next story"
            >
              <span className="hidden xs:inline">Next Story</span>
              <FaArrowRight className="text-[10px]" />
            </button>
          </div>
        </motion.div>

        {/* Stories Grid */}
        <motion.div
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

      {/* Interactive Modal with Prev/Next Navigation and Keyboard Shortcuts */}
      <StoryModal
        story={activeStory}
        onClose={() => setActiveStory(null)}
        onPrev={handlePrevStory}
        onNext={handleNextStory}
        hasPrev={filteredStories.length > 1}
        hasNext={filteredStories.length > 1}
        currentIndex={currentIndex}
        totalStories={filteredStories.length}
        prevStoryTitle={prevStoryTitle}
        nextStoryTitle={nextStoryTitle}
      />
    </section>
  );
}
