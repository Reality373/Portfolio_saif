'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectData } from '@/types';
import { FaTimes, FaGithub, FaExternalLinkAlt, FaGooglePlay } from 'react-icons/fa';

interface ProjectCardProps {
  project: ProjectData;
  flagship?: boolean;
}

export default function ProjectCard({ project, flagship = false }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  return (
    <>
      <motion.div
        className={`group relative cursor-pointer border border-ink-600 bg-ink-900 hover:border-amber/60 transition-all duration-300 overflow-hidden rounded-md shadow-sm hover:shadow-md ${
          flagship ? 'p-8' : 'p-6'
        }`}
        onClick={() => setIsExpanded(true)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`);
          e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`);
        }}
        whileHover={{ y: -4 }}
        layout
      >
        {/* Gradient glow on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background:
              'radial-gradient(400px circle at var(--x,50%) var(--y,0%), var(--spotlight-color), transparent 65%)',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3
              className={`font-display font-semibold text-paper group-hover:text-amber transition-colors ${
                flagship ? 'text-2xl sm:text-3xl' : 'text-xl'
              }`}
            >
              {project.title}
            </h3>
            <span className="font-mono text-[11px] text-paper-dim whitespace-nowrap pt-1">
              {project.period}
            </span>
          </div>

          <p className={`text-paper-muted font-mono ${flagship ? 'text-sm mb-6' : 'text-xs mb-4'}`}>
            {project.tagline}
          </p>

          {flagship && project.metrics && (
            <div className="flex flex-wrap gap-6 mb-6 border-y border-ink-600 py-4 bg-ink-950/30 px-3 rounded-sm">
              {project.metrics.map((metric) => (
                <div key={metric.label}>
                  <div className="font-display font-semibold text-xl text-trace">
                    {metric.value}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-wide text-paper-dim mt-0.5">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-5">
            {project.technologies.slice(0, flagship ? 6 : 4).map((tech) => (
              <span
                key={tech}
                className="text-[11px] px-2.5 py-1 border border-ink-600 text-trace font-mono rounded-sm bg-trace/5"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > (flagship ? 6 : 4) && (
              <span className="text-[11px] px-2.5 py-1 text-paper-dim font-mono">
                +{project.technologies.length - (flagship ? 6 : 4)} more
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <button className="text-amber text-sm font-mono group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-medium">
              view details →
            </button>
            {project.links.playStore && (
              <a
                href={project.links.playStore}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 border border-trace/50 text-trace rounded-sm hover:bg-trace/10 transition-colors"
              >
                <FaGooglePlay /> Get it on Google Play
              </a>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setIsExpanded(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-ink-900 border border-ink-600 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative rounded-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-5 right-5 text-paper-muted hover:text-amber transition-colors p-2 rounded-sm bg-ink-800/80 border border-ink-600 z-10"
                aria-label="Close"
              >
                <FaTimes size={16} />
              </button>

              <div className="p-8 sm:p-10 space-y-7">
                <div>
                  <p className="font-mono text-xs text-paper-dim mb-2">
                    {project.period} · {project.role}
                  </p>
                  <h2 className="font-display font-semibold text-3xl sm:text-4xl text-paper mb-2">
                    {project.title}
                  </h2>
                  <p className="text-trace font-mono text-sm">{project.tagline}</p>
                </div>

                {project.metrics && (
                  <div className="flex flex-wrap gap-8 border-y border-ink-600 py-5 bg-ink-950/40 px-4 rounded-sm">
                    {project.metrics.map((metric) => (
                      <div key={metric.label}>
                        <div className="font-display font-semibold text-2xl text-amber">
                          {metric.value}
                        </div>
                        <div className="font-mono text-[10px] uppercase tracking-wide text-paper-dim mt-0.5">
                          {metric.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  {project.description.split('\n\n').map((para, i) => (
                    <p key={i} className="text-paper-muted leading-relaxed text-sm sm:text-base">
                      {para}
                    </p>
                  ))}
                </div>

                {project.achievements.length > 0 && (
                  <div>
                    <h3 className="font-mono text-xs uppercase tracking-wide text-trace mb-3">
                      Highlights
                    </h3>
                    <ul className="space-y-2">
                      {project.achievements.map((achievement, i) => (
                        <li key={i} className="text-paper text-sm flex items-start gap-3">
                          <span className="text-amber mt-0.5">▸</span>
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 className="font-mono text-xs uppercase tracking-wide text-trace mb-3">
                    Technologies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 border border-ink-600 text-paper-muted text-xs font-mono rounded-sm bg-ink-950/40"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {(project.links.github || project.links.live || project.links.playStore) && (
                  <div className="pt-2 border-t border-ink-600 flex flex-wrap gap-6">
                    {project.links.github && (
                      <a
                        href={project.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-paper hover:text-amber font-mono text-sm transition-colors inline-flex items-center gap-2"
                      >
                        <FaGithub /> Repository
                      </a>
                    )}
                    {project.links.playStore && (
                      <a
                        href={project.links.playStore}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-trace hover:text-amber font-mono text-sm transition-colors inline-flex items-center gap-2"
                      >
                        <FaGooglePlay /> Get it on Google Play
                      </a>
                    )}
                    {project.links.live && (
                      <a
                        href={project.links.live}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-paper hover:text-amber font-mono text-sm transition-colors inline-flex items-center gap-2"
                      >
                        <FaExternalLinkAlt /> Live
                      </a>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
