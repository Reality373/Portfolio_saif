'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGithub, FaCodeBranch, FaFire, FaExternalLinkAlt, FaTimes } from 'react-icons/fa';
import { SITE } from '@/lib/constants';
import { useGitHubData, ContributionDay } from '@/lib/github';

interface GitHubHoverPreviewProps {
  children?: React.ReactNode;
  className?: string;
  placement?: 'bottom' | 'top';
}

export default function GitHubHoverPreview({
  children,
  className = '',
  placement = 'bottom',
}: GitHubHoverPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ count: number; date: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Consume globally cached GitHub data (fetched once on page load with zero repeat calls)
  const { data, loading } = useGitHubData();

  // Detect touch / mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || window.matchMedia('(hover: none)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Format the 168 days into 24 weeks of 7 days
  const weeksGrid = useMemo(() => {
    if (!data?.contributions || data.contributions.length === 0) return [];
    const weeks: ContributionDay[][] = [];
    const list = data.contributions;

    for (let i = 0; i < list.length; i += 7) {
      weeks.push(list.slice(i, i + 7));
    }
    return weeks;
  }, [data]);

  const getCellColor = (level: number) => {
    switch (level) {
      case 4:
        return 'bg-[#39d353] shadow-[0_0_4px_#39d353]';
      case 3:
        return 'bg-[#26a641]';
      case 2:
        return 'bg-[#006d32]';
      case 1:
        return 'bg-[#0e4429]';
      default:
        return 'bg-ink-700/60 dark:bg-ink-800/80';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Mobile tap trigger: intercept click to open preview modal on mobile
  const handleTriggerClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen((prev) => !prev);
    }
  };

  // Close on outside click on mobile
  useEffect(() => {
    if (!isOpen || !isMobile) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHoveredCell(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen, isMobile]);

  // The Card Content Component (Rendered instantaneously from cache)
  const cardContent = (
    <div className="bg-ink-950/98 backdrop-blur-xl border border-ink-600 rounded-md shadow-2xl p-4 w-full max-w-[360px] sm:max-w-[390px] select-none text-left">
      {/* Header: Real Avatar & Live profile link */}
      <div className="flex items-center justify-between pb-3 border-b border-ink-600 h-11">
        <div className="flex items-center gap-2.5">
          {/* Real User Avatar from GitHub */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data?.avatarUrl || 'https://avatars.githubusercontent.com/u/86972716?v=4'}
            alt="Saif Shikalgar GitHub Avatar"
            className="w-8 h-8 rounded-full border border-ink-600 object-cover flex-shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-display font-semibold text-sm text-paper">
                {data?.username || 'Reality373'}
              </span>
              <span className="w-2 h-2 rounded-full bg-[#39d353] shadow-[0_0_6px_#39d353] animate-pulse" />
              <span className="font-mono text-[9px] text-[#39d353] font-semibold">Live API</span>
            </div>
            <span className="font-mono text-[10px] text-paper-dim leading-none mt-1 block">
              github.com/{data?.username || 'Reality373'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={SITE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-trace hover:text-amber transition-colors flex items-center gap-1 bg-trace/10 border border-trace/20 px-2 py-1 rounded-sm flex-shrink-0"
          >
            <span>Profile</span>
            <FaExternalLinkAlt size={8} />
          </a>

          {/* Close button for mobile */}
          {isMobile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="p-1.5 text-paper-muted hover:text-amber rounded bg-ink-900 border border-ink-600"
              aria-label="Close popup"
            >
              <FaTimes size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Live Stats Row */}
      <div className="grid grid-cols-3 gap-2 py-3 border-b border-ink-600 font-mono h-16">
        <div className="bg-ink-900/60 p-1.5 rounded-sm border border-ink-600/60 text-center flex flex-col justify-center">
          <div className="text-sm font-semibold text-paper leading-none mb-1">
            {data?.totalContributions ?? 531}
          </div>
          <div className="text-[9px] text-paper-dim uppercase leading-none">Total Commits</div>
        </div>

        <div className="bg-ink-900/60 p-1.5 rounded-sm border border-ink-600/60 text-center flex flex-col justify-center">
          <div className="text-sm font-semibold text-[#39d353] flex items-center justify-center gap-1 leading-none mb-1">
            <FaFire size={10} /> {data?.maxStreak ?? 14}d
          </div>
          <div className="text-[9px] text-paper-dim uppercase leading-none">Max Streak</div>
        </div>

        <div className="bg-ink-900/60 p-1.5 rounded-sm border border-ink-600/60 text-center flex flex-col justify-center">
          <div className="text-sm font-semibold text-amber flex items-center justify-center gap-1 leading-none mb-1">
            <FaCodeBranch size={10} /> {data?.publicRepos ?? 23}
          </div>
          <div className="text-[9px] text-paper-dim uppercase leading-none">Repositories</div>
        </div>
      </div>

      {/* Real Contribution Green Dots Heatmap */}
      <div className="pt-3">
        {/* Fixed-height text header */}
        <div className="h-5 flex items-center justify-between mb-2 overflow-hidden">
          <span className="font-mono text-[10px] text-paper font-medium truncate max-w-[240px] block">
            {hoveredCell
              ? `${hoveredCell.count} commits on ${formatDate(hoveredCell.date)}`
              : `${data?.totalContributions ?? 531} commits in the last year`}
          </span>
          <span className="font-mono text-[9px] text-paper-dim flex-shrink-0">Recent 24 wks</span>
        </div>

        {/* Real Heatmap Grid */}
        {loading && weeksGrid.length === 0 ? (
          <div className="h-20 flex items-center justify-center font-mono text-xs text-paper-dim">
            Streaming live commit matrix...
          </div>
        ) : (
          <div className="flex gap-[3px] overflow-hidden py-1 justify-between">
            {weeksGrid.map((week, wIndex) => (
              <div key={wIndex} className="flex flex-col gap-[3px]">
                {week.map((day, dIndex) => (
                  <div
                    key={`${wIndex}-${dIndex}`}
                    onMouseEnter={() =>
                      setHoveredCell({ count: day.count, date: day.date })
                    }
                    onClick={() =>
                      setHoveredCell({ count: day.count, date: day.date })
                    }
                    className={`w-2.5 h-2.5 rounded-[2px] transition-colors duration-100 cursor-pointer hover:ring-1 hover:ring-amber hover:brightness-125 ${getCellColor(
                      day.level
                    )}`}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Heatmap Legend */}
        <div className="h-5 flex items-center justify-between pt-2 mt-1 border-t border-ink-600/40 text-[9px] font-mono text-paper-dim">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-[2px] bg-ink-700/60" />
            <span className="w-2 h-2 rounded-[2px] bg-[#0e4429]" />
            <span className="w-2 h-2 rounded-[2px] bg-[#006d32]" />
            <span className="w-2 h-2 rounded-[2px] bg-[#26a641]" />
            <span className="w-2 h-2 rounded-[2px] bg-[#39d353]" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => {
        if (!isMobile) setIsOpen(true);
      }}
      onMouseLeave={() => {
        if (!isMobile) {
          setIsOpen(false);
          setHoveredCell(null);
        }
      }}
    >
      {/* Trigger button/element */}
      <div className={className} onClick={handleTriggerClick}>
        {children ? (
          children
        ) : (
          <a
            href={SITE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-ink-600 bg-ink-900/50 text-paper text-sm rounded-sm hover:border-trace hover:text-trace transition-colors"
          >
            <FaGithub /> GitHub
          </a>
        )}
      </div>

      {/* Floating / Modal Live Real-Time GitHub Activity Card */}
      <AnimatePresence>
        {isOpen && (
          <>
            {isMobile ? (
              /* Mobile Centered Backdrop Modal */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs pointer-events-auto"
                onClick={() => setIsOpen(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full flex justify-center"
                >
                  {cardContent}
                </motion.div>
              </motion.div>
            ) : (
              /* Desktop Floating Hover Popover */
              <motion.div
                initial={{ opacity: 0, y: placement === 'bottom' ? 8 : -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: placement === 'bottom' ? 6 : -6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className={`absolute z-50 w-[360px] sm:w-[390px] ${
                  placement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
                } left-1/2 -translate-x-1/2 pointer-events-auto select-none`}
              >
                {cardContent}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
