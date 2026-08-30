'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STORIES } from '@/lib/stories';
import { Story } from '@/types';
import StoryCard from './StoryCard';
import StoryModal from './StoryModal';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import {
  FaBookOpen,
  FaFilter,
  FaArrowLeft,
  FaArrowRight,
  FaKeyboard,
  FaMicrochip,
  FaMobileAlt,
  FaBrain,
  FaShieldAlt,
  FaGlobe,
  FaChartLine,
  FaSearch,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import ScrambleText from './ScrambleText';

interface DomainCategory {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  techHighlight: string;
}

const DOMAIN_CATEGORIES: DomainCategory[] = [
  {
    id: 'All Stories',
    label: 'All Engineering Domains',
    shortLabel: 'All Domains',
    icon: FaBookOpen,
    description: '44 unvarnished technical post-mortems, hardware bring-up notes, microsecond optimizations, and solo-shipping milestones.',
    techHighlight: 'Embedded · Android/KMP · Local AI · Security · Web3 · Systems',
  },
  {
    id: 'Electronics & Embedded',
    label: 'Electronics & Embedded',
    shortLabel: 'Electronics & Embedded',
    icon: FaMicrochip,
    description: 'STM32F446RE & ESP32-S3 firmware, CAN 2.0B / TWAI networks, FreeRTOS multi-core task pinning, 40-bar hydraulic actuators, and 1.5kV isolated power nodes.',
    techHighlight: 'CAN 2.0B · FreeRTOS · STM32 HAL · Hardware Bring-up · EMI Shielding',
  },
  {
    id: 'Android & Mobile',
    label: 'Android & Mobile',
    shortLabel: 'Android & Mobile',
    icon: FaMobileAlt,
    description: 'Jetpack Compose, Kotlin Multiplatform (KMP), Room DB with SQLCipher, offline-first sync, foreground services, and sub-16ms smooth 60fps scrolling.',
    techHighlight: 'Jetpack Compose · Kotlin Multiplatform · Room · Android Vitals · Performance',
  },
  {
    id: 'AI & Computer Vision',
    label: 'AI & Computer Vision',
    shortLabel: 'AI & Vision',
    icon: FaBrain,
    description: 'Local-first ONNX runtime inference, CLIP ViT-B/32 cosine vector embeddings, YOLOv8 30fps edge tracking, and offline vector indexing on Jetson & mobile.',
    techHighlight: 'ONNX Runtime · Vector Embeddings · YOLOv8 · Edge AI · Quantization',
  },
  {
    id: 'Cybersecurity & Systems',
    label: 'Cybersecurity & Systems',
    shortLabel: 'Cybersecurity & Systems',
    icon: FaShieldAlt,
    description: 'CAN frame anomaly detection, replay attack mitigation, frame-rate timing analysis, memory safety bug fixes, and race condition elimination.',
    techHighlight: 'Intrusion Prevention · Anomaly Detection · Timing Analysis · Memory Safety',
  },
  {
    id: 'Web Dev & Web3',
    label: 'Web Dev & Web3',
    shortLabel: 'Web Dev & Web3',
    icon: FaGlobe,
    description: 'Solidity smart contracts, EVM byte-code gas optimization, real-time WebSocket state machines, and performant Next.js / TypeScript architectures.',
    techHighlight: 'Solidity · EVM Bytecode · Next.js · WebSocket Streams · State Sync',
  },
  {
    id: 'Trading & Reliability',
    label: 'Trading & State Reliability',
    shortLabel: 'Trading & State',
    icon: FaChartLine,
    description: 'Sub-millisecond execution, state recovery across network disconnects, MT5 MQL5 bridge architecture, and deterministic risk management engines.',
    techHighlight: 'MQL5 · Low-Latency Execution · State Recovery · Risk Engines',
  },
];

const INITIAL_VISIBLE_COUNT = 6;

export default function StoriesSection() {
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>('All Stories');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  // Helper to map stories to domains
  const isStoryInDomain = (story: Story, domainId: string): boolean => {
    if (domainId === 'All Stories') return true;
    if (domainId === 'Electronics & Embedded') {
      return (
        story.category === 'Electronics & Embedded' ||
        story.category === 'Electronics & Automotive' ||
        story.categories?.includes('Electronics & Embedded') ||
        story.categories?.includes('Electronics & Automotive') ||
        story.relatedProjectId === 'can-firewall' ||
        story.relatedProjectId === 'autonomous-vehicle' ||
        story.relatedProjectId === 'can-tool' ||
        story.relatedProjectId === 'data-acquisition'
      );
    }
    if (domainId === 'Android & Mobile') {
      return (
        story.category === 'Android & Mobile' ||
        story.categories?.includes('Android & Mobile') ||
        story.relatedProjectId === 'fiber-optic-calculator' ||
        story.relatedProjectId === 'flick-player' ||
        story.relatedProjectId === 'floating-translator' ||
        story.relatedProjectId === 'study-mate' ||
        story.relatedProjectId === 'photo-nest'
      );
    }
    if (domainId === 'AI & Computer Vision') {
      return (
        story.category === 'AI & Computer Vision' ||
        story.categories?.includes('AI & Computer Vision') ||
        story.relatedProjectId === 'photo-nest' ||
        story.relatedProjectId === 'cottonx' ||
        story.relatedProjectId === 'autonomous-vehicle'
      );
    }
    if (domainId === 'Cybersecurity & Systems') {
      return (
        story.category === 'Cybersecurity & Systems' ||
        story.categories?.includes('Cybersecurity & Systems') ||
        story.relatedProjectId === 'can-firewall' ||
        story.relatedProjectId === 'can-tool' ||
        story.relatedProjectId === 'autonomous-vehicle'
      );
    }
    if (domainId === 'Web Dev & Web3') {
      return (
        story.category === 'Web Dev & Web3' ||
        story.category === 'AI & Web3' ||
        story.categories?.includes('Web Dev & Web3') ||
        story.categories?.includes('AI & Web3') ||
        story.relatedProjectId === 'cottonx' ||
        story.relatedProjectId === 'chainpilot' ||
        story.relatedProjectId === 'floating-translator'
      );
    }
    if (domainId === 'Trading & Reliability' || domainId === 'Trading & State Reliability') {
      return (
        story.category === 'Trading & Reliability' ||
        story.category === 'Trading & State Reliability' ||
        story.categories?.includes('Trading & Reliability') ||
        story.categories?.includes('Trading & State Reliability') ||
        story.relatedProjectId === 'expert-advisors'
      );
    }

    return false;
  };

  const getDomainCount = (domainId: string): number => {
    if (domainId === 'All Stories') return STORIES.length;
    return STORIES.filter((s) => isStoryInDomain(s, domainId)).length;
  };

  // Filter by selected domain + search query
  const filteredStories = useMemo(() => {
    let result = STORIES;
    if (selectedDomain !== 'All Stories') {
      result = result.filter((s) => isStoryInDomain(s, selectedDomain));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.subtitle.toLowerCase().includes(q) ||
          s.summary.toLowerCase().includes(q) ||
          s.theLesson.toLowerCase().includes(q) ||
          s.theMistake?.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [selectedDomain, searchQuery]);

  // Reset visible count when switching domains or changing search query
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [selectedDomain, searchQuery]);

  const activeDomainInfo = DOMAIN_CATEGORIES.find((d) => d.id === selectedDomain) || DOMAIN_CATEGORIES[0];

  // Compact sliced list for the visible grid
  const displayedStories = filteredStories.slice(0, visibleCount);
  const hasMore = visibleCount < filteredStories.length;

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
    <section id="stories" className="bg-ink-950 py-16 sm:py-24 px-4 sm:px-6 relative border-t border-ink-600">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-8 sm:mb-12"
        >
          <div className="flex items-center gap-2 mb-3">
            <p className="font-mono text-sm text-amber">02 · Stories &amp; Field Notes</p>
            <span className="w-1.5 h-1.5 rounded-full bg-amber" />
            <span className="font-mono text-xs text-paper-dim">Forensic Engineering Logs &amp; Field Lessons</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
            <div>
              <h2 className="font-display font-semibold text-2xl sm:text-4xl text-paper mb-2 sm:mb-3">
                <ScrambleText text="Experience from the trenches" />
              </h2>
              <p className="text-paper-muted font-mono text-xs sm:text-sm max-w-2xl leading-relaxed">
                Raw technical breakthroughs, midnight hardware bring-up crisis migrations, microsecond assembly optimizations, and 44 production field stories across 6 specialized engineering domains.
              </p>
            </div>

            {/* Quick stats badge */}
            <div className="flex items-center gap-3 sm:gap-4 border border-ink-600 bg-ink-900 px-3 sm:px-4 py-2 sm:py-2.5 rounded-sm shrink-0 self-start md:self-auto">
              <FaBookOpen className="text-trace text-sm" />
              <div className="font-mono text-[11px] sm:text-xs">
                <span className="text-paper font-semibold">{STORIES.length}</span> Field Notes Published
              </div>
            </div>
          </div>
        </motion.div>

        {/* Domain Filter Tabs */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-6 space-y-3 sm:space-y-4"
        >
          {/* Domain Tabs List */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-paper-dim mr-1 sm:mr-2 shrink-0">
              <FaFilter className="text-[10px]" /> Domains:
            </div>
            {DOMAIN_CATEGORIES.map((domain) => {
              const count = getDomainCount(domain.id);
              const isActive = selectedDomain === domain.id;
              const Icon = domain.icon;

              return (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain.id)}
                  className={`font-mono text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-sm transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${
                    isActive
                      ? 'bg-amber text-ink-950 font-semibold shadow-md ring-1 ring-amber/50'
                      : 'bg-ink-900 border border-ink-600 text-paper-muted hover:border-paper-dim hover:text-paper hover:bg-ink-900/80'
                  }`}
                >
                  <Icon className={isActive ? 'text-ink-950 text-xs' : 'text-trace text-xs'} />
                  <span>{domain.shortLabel}</span>
                  <span
                    className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-ink-950/20 text-ink-950' : 'bg-ink-950 border border-ink-600/70 text-paper-dim'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar & Keyboard Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-4 border-b border-ink-600/60">
            {/* Search Input Box */}
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-dim text-xs" />
              <input
                type="text"
                placeholder="Search topics (e.g. FreeRTOS, Compose, CAN, solc, CLIP)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-ink-900 border border-ink-600 rounded-sm pl-9 pr-8 py-2 text-xs font-mono text-paper placeholder:text-paper-dim/60 focus:outline-none focus:border-amber transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-paper-dim hover:text-paper text-xs"
                  title="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Stories Count & Prev / Next Arrows */}
            <div className="flex items-center justify-between sm:justify-end gap-3 font-mono text-xs">
              <span className="text-paper-dim text-[11px]">
                Showing <strong className="text-paper">{displayedStories.length}</strong> of{' '}
                <strong className="text-paper">{filteredStories.length}</strong>
              </span>

              <div className="flex items-center gap-1.5">
                <span className="hidden lg:inline-flex items-center gap-1 text-[10px] text-paper-dim mr-1">
                  <FaKeyboard className="text-trace text-[10px]" /> <kbd className="px-1 py-0.5 bg-ink-900 border border-ink-600 rounded text-paper font-mono text-[9px]">←</kbd> <kbd className="px-1 py-0.5 bg-ink-900 border border-ink-600 rounded text-paper font-mono text-[9px]">→</kbd>
                </span>
                <button
                  onClick={handlePrevStory}
                  disabled={filteredStories.length <= 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sm bg-ink-900 border border-ink-600 text-paper-muted hover:text-amber hover:border-amber transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Previous Story (Left Arrow)"
                  aria-label="Previous story"
                >
                  <FaArrowLeft className="text-[10px]" />
                  <span className="hidden xs:inline text-[11px]">Prev</span>
                </button>
                <button
                  onClick={handleNextStory}
                  disabled={filteredStories.length <= 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sm bg-ink-900 border border-ink-600 text-paper-muted hover:text-amber hover:border-amber transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Next Story (Right Arrow)"
                  aria-label="Next story"
                >
                  <span className="hidden xs:inline text-[11px]">Next</span>
                  <FaArrowRight className="text-[10px]" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Domain Overview Banner */}
          {selectedDomain !== 'All Stories' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-ink-900/60 border border-ink-600/70 rounded-md p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
            >
              <div className="flex items-start sm:items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber shrink-0 mt-1 sm:mt-0" />
                <div>
                  <span className="text-paper font-semibold">{activeDomainInfo.label}: </span>
                  <span className="text-paper-muted">{activeDomainInfo.description}</span>
                </div>
              </div>
              <div className="shrink-0 text-trace text-[11px] bg-trace/10 border border-trace/20 px-2.5 py-1 rounded-sm">
                {activeDomainInfo.techHighlight}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Stories Grid / Empty State */}
        {filteredStories.length === 0 ? (
          <div className="text-center py-16 bg-ink-900/40 border border-dashed border-ink-600 rounded-md p-8">
            <p className="font-mono text-sm text-paper mb-2">No stories found matching &quot;{searchQuery}&quot;</p>
            <p className="font-mono text-xs text-paper-dim mb-4">Try searching for broader keywords like &quot;CAN&quot;, &quot;Memory&quot;, &quot;STM32&quot;, or &quot;Compose&quot;.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDomain('All Stories');
              }}
              className="font-mono text-xs px-4 py-2 bg-amber text-ink-950 font-semibold rounded-sm hover:shadow-md transition-all"
            >
              Reset Filters &amp; View All Stories
            </button>
          </div>
        ) : (
          <>
            {/* Compact Grid of Sliced Stories */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            >
              <AnimatePresence mode="popLayout">
                {displayedStories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onSelect={(s) => setActiveStory(s)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Expand / See More Bar */}
            {filteredStories.length > INITIAL_VISIBLE_COUNT && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-ink-600/70 pt-6"
              >
                <div className="font-mono text-xs text-paper-dim text-center sm:text-left">
                  Showing <strong className="text-paper">{displayedStories.length}</strong> of{' '}
                  <strong className="text-paper">{filteredStories.length}</strong> {selectedDomain === 'All Stories' ? 'total stories' : 'domain stories'}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {hasMore ? (
                    <>
                      <button
                        onClick={() => setVisibleCount((prev) => Math.min(prev + 6, filteredStories.length))}
                        className="font-mono text-xs px-4 py-2.5 rounded-sm bg-ink-900 border border-ink-600 text-paper hover:border-amber hover:text-amber transition-all flex items-center gap-2 shadow-xs"
                      >
                        <FaChevronDown className="text-[10px]" />
                        <span>Show More (+{Math.min(6, filteredStories.length - visibleCount)})</span>
                      </button>

                      <button
                        onClick={() => setVisibleCount(filteredStories.length)}
                        className="font-mono text-xs px-4 py-2.5 rounded-sm bg-amber text-ink-950 font-semibold hover:shadow-[0_0_15px_rgba(255,107,53,0.35)] transition-all flex items-center gap-2"
                      >
                        <FaBookOpen className="text-[10px]" />
                        <span>View All {filteredStories.length} Stories</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setVisibleCount(INITIAL_VISIBLE_COUNT)}
                      className="font-mono text-xs px-4 py-2 rounded-sm bg-ink-900 border border-ink-600 text-paper-dim hover:text-paper hover:border-paper-dim transition-all flex items-center gap-2"
                    >
                      <FaChevronUp className="text-[10px]" />
                      <span>Show Less (Collapse to {INITIAL_VISIBLE_COUNT})</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Interactive Modal with Prev/Next Navigation and Keyboard Shortcuts across ALL Stories */}
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
