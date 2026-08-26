'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGithub, FaCodeBranch, FaFire, FaExternalLinkAlt } from 'react-icons/fa';
import { SITE } from '@/lib/constants';

interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

interface GitHubData {
  username: string;
  name: string;
  avatarUrl: string;
  publicRepos: number;
  followers: number;
  totalContributions: number;
  maxStreak: number;
  contributions: ContributionDay[];
}

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
  const [data, setData] = useState<GitHubData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch real-time live GitHub data
  useEffect(() => {
    let isMounted = true;

    async function fetchLiveGitHub() {
      try {
        setLoading(true);
        // Try internal Next.js API first
        const res = await fetch('/api/github');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.contributions && json.contributions.length > 0) {
            setData(json);
            setLoading(false);
            return;
          }
        }

        // Direct public fallback
        const contribRes = await fetch(
          `https://github-contributions-api.jogruber.de/v4/Reality373?y=last`
        );
        if (contribRes.ok) {
          const contribJson = await contribRes.json();
          const list: ContributionDay[] = contribJson.contributions || [];
          const total =
            contribJson.total?.lastYear ||
            list.reduce((acc, c) => acc + (c.count || 0), 0);

          if (isMounted) {
            setData({
              username: 'Reality373',
              name: 'Saif Shikalgar',
              avatarUrl: 'https://avatars.githubusercontent.com/u/86972716?v=4',
              publicRepos: 22,
              followers: 7,
              totalContributions: total || 520,
              maxStreak: 14,
              contributions: list.slice(-168),
            });
          }
        }
      } catch (err) {
        console.error('Error fetching live GitHub contributions:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLiveGitHub();
    return () => {
      isMounted = false;
    };
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

      {/* Floating Live Real-Time GitHub Activity Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: placement === 'bottom' ? 8 : -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === 'bottom' ? 6 : -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-50 w-[350px] sm:w-[380px] p-4 bg-ink-950/98 backdrop-blur-xl border border-ink-600 rounded-md shadow-2xl ${
              placement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
            } left-1/2 -translate-x-1/2 pointer-events-auto select-none`}
            style={{ minHeight: '260px' }}
          >
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

              <a
                href={SITE.github}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] text-trace hover:text-amber transition-colors flex items-center gap-1 flex-shrink-0"
              >
                <span>Profile</span>
                <FaExternalLinkAlt size={8} />
              </a>
            </div>

            {/* Live Stats Row (Fixed Height) */}
            <div className="grid grid-cols-3 gap-2 py-3 border-b border-ink-600 font-mono h-16">
              <div className="bg-ink-900/60 p-1.5 rounded-sm border border-ink-600/60 text-center flex flex-col justify-center">
                <div className="text-sm font-semibold text-paper leading-none mb-1">
                  {data?.totalContributions ?? 520}
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
                  <FaCodeBranch size={10} /> {data?.publicRepos ?? 22}
                </div>
                <div className="text-[9px] text-paper-dim uppercase leading-none">Repositories</div>
              </div>
            </div>

            {/* Real Contribution Green Dots Heatmap */}
            <div className="pt-3">
              {/* Fixed-height text header so hovered cell strings never cause card height jitter */}
              <div className="h-5 flex items-center justify-between mb-2 overflow-hidden">
                <span className="font-mono text-[10px] text-paper font-medium truncate max-w-[240px] block">
                  {hoveredCell
                    ? `${hoveredCell.count} commits on ${formatDate(hoveredCell.date)}`
                    : `${data?.totalContributions ?? 520} contributions in the last year`}
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
                          className={`w-2.5 h-2.5 rounded-[2px] transition-colors duration-100 cursor-pointer hover:ring-1 hover:ring-amber hover:brightness-125 ${getCellColor(
                            day.level
                          )}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Heatmap Legend (Fixed Height) */}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
