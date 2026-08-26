'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGithub, FaCodeBranch, FaFire, FaExternalLinkAlt } from 'react-icons/fa';
import { SITE } from '@/lib/constants';

interface GitHubHoverPreviewProps {
  children?: React.ReactNode;
  className?: string;
  placement?: 'bottom' | 'top';
}

// Generate realistic 20-week contribution grid (20 columns x 7 days)
function generateContributionGrid() {
  const weeks = 22;
  const days = 7;
  const grid: { count: number; level: number }[][] = [];

  // Seeded pattern to keep it deterministic across renders
  let seed = 42;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let w = 0; w < weeks; w++) {
    const week: { count: number; level: number }[] = [];
    for (let d = 0; d < days; d++) {
      const rand = pseudoRandom();
      let level = 0;
      let count = 0;

      // Realistic developer pattern with busy sprints and streaks
      if (rand > 0.82) {
        level = 4;
        count = Math.floor(rand * 8) + 6;
      } else if (rand > 0.62) {
        level = 3;
        count = Math.floor(rand * 5) + 3;
      } else if (rand > 0.38) {
        level = 2;
        count = Math.floor(rand * 3) + 2;
      } else if (rand > 0.18) {
        level = 1;
        count = 1;
      }

      week.push({ count, level });
    }
    grid.push(week);
  }
  return grid;
}

export default function GitHubHoverPreview({
  children,
  className = '',
  placement = 'bottom',
}: GitHubHoverPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ count: number; week: number; day: number } | null>(null);

  const grid = useMemo(() => generateContributionGrid(), []);

  const getCellColor = (level: number) => {
    switch (level) {
      case 4:
        return 'bg-[#39d353] dark:bg-[#39d353] shadow-[0_0_6px_#39d353]';
      case 3:
        return 'bg-[#26a641] dark:bg-[#26a641]';
      case 2:
        return 'bg-[#006d32] dark:bg-[#006d32]';
      case 1:
        return 'bg-[#0e4429] dark:bg-[#0e4429]';
      default:
        return 'bg-ink-700/60 dark:bg-ink-800/80';
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        setIsOpen(false);
        setHoveredCell(null);
      }}
    >
      {/* Trigger button/element */}
      <div className={className}>
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

      {/* Floating GitHub Stats & Contribution Green Dots Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: placement === 'bottom' ? 8 : -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === 'bottom' ? 6 : -6, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`absolute z-50 w-[340px] sm:w-[380px] p-4 bg-ink-950/98 backdrop-blur-xl border border-ink-600 rounded-md shadow-2xl ${
              placement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
            } left-1/2 -translate-x-1/2 pointer-events-auto`}
          >
            {/* Header: GitHub user info & live stats */}
            <div className="flex items-center justify-between pb-3 border-b border-ink-600">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-ink-800 border border-ink-600 flex items-center justify-center text-paper">
                  <FaGithub size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-semibold text-sm text-paper">SaifShikalgar</span>
                    <span className="w-2 h-2 rounded-full bg-[#39d353] shadow-[0_0_6px_#39d353] animate-pulse" />
                  </div>
                  <span className="font-mono text-[10px] text-paper-dim">github.com/SaifShikalgar</span>
                </div>
              </div>

              <a
                href={SITE.github}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] text-trace hover:text-amber transition-colors flex items-center gap-1"
              >
                <span>Profile</span>
                <FaExternalLinkAlt size={8} />
              </a>
            </div>

            {/* Quick Stats Highlights */}
            <div className="grid grid-cols-3 gap-2 py-3 border-b border-ink-600 font-mono">
              <div className="bg-ink-900/60 p-2 rounded-sm border border-ink-600/60 text-center">
                <div className="text-sm font-semibold text-paper">488+</div>
                <div className="text-[9px] text-paper-dim uppercase">Commits</div>
              </div>

              <div className="bg-ink-900/60 p-2 rounded-sm border border-ink-600/60 text-center">
                <div className="text-sm font-semibold text-[#39d353] flex items-center justify-center gap-1">
                  <FaFire size={11} /> 18d
                </div>
                <div className="text-[9px] text-paper-dim uppercase">Max Streak</div>
              </div>

              <div className="bg-ink-900/60 p-2 rounded-sm border border-ink-600/60 text-center">
                <div className="text-sm font-semibold text-amber flex items-center justify-center gap-1">
                  <FaCodeBranch size={10} /> 13+
                </div>
                <div className="text-[9px] text-paper-dim uppercase">Repositories</div>
              </div>
            </div>

            {/* Contribution Green Dots Heatmap */}
            <div className="pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-paper font-medium">
                  {hoveredCell
                    ? `${hoveredCell.count} commits on this day`
                    : '488 contributions in the last year'}
                </span>
                <span className="font-mono text-[9px] text-[#39d353] font-semibold">Active</span>
              </div>

              {/* Heatmap Matrix */}
              <div className="flex gap-[3px] overflow-x-auto py-1 justify-between">
                {grid.map((week, wIndex) => (
                  <div key={wIndex} className="flex flex-col gap-[3px]">
                    {week.map((day, dIndex) => (
                      <div
                        key={dIndex}
                        onMouseEnter={() => setHoveredCell({ count: day.count, week: wIndex, day: dIndex })}
                        className={`w-2.5 h-2.5 rounded-[2px] transition-all duration-150 cursor-pointer hover:scale-125 ${getCellColor(
                          day.level
                        )}`}
                        title={`${day.count} commits`}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-ink-600/40 text-[9px] font-mono text-paper-dim">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
