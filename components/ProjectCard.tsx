'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectData } from '@/types';
import { FaTimes, FaGithub, FaExternalLinkAlt } from 'react-icons/fa';

interface ProjectCardProps {
  project: ProjectData;
  flagship?: boolean;
}

export default function ProjectCard({ project, flagship = false }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <motion.div
        className={`group relative cursor-pointer border border-ink-600 bg-ink-900 hover:border-amber/60 transition-colors duration-300 overflow-hidden rounded-md ${
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
              'radial-gradient(400px circle at var(--x,50%) var(--y,0%), rgba(255,107,53,0.08), transparent 60%)',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3
              className={`font-display font-semibold text-paper ${
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
            <div className="flex flex-wrap gap-6 mb-6 border-y border-ink-600 py-4">
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
                className="text-[11px] px-2.5 py-1 border border-ink-600 text-trace font-mono rounded-sm"
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

          <button className="text-amber text-sm font-mono hover:translate-x-1 transition-transform inline-block">
            view details →
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsExpanded(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-ink-900 border border-ink-600 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative rounded-md"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-5 right-5 text-paper-muted hover:text-amber transition-colors z-10"
                aria-label="Close"
              >
                <FaTimes size={20} />
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
                  <div className="flex flex-wrap gap-8 border-y border-ink-600 py-5">
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
                        className="px-2.5 py-1 border border-ink-600 text-paper-muted text-xs font-mono rounded-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {(project.links.github || project.links.live) && (
                  <div className="pt-2 border-t border-ink-600 flex gap-6">
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
