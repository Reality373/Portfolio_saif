'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectData } from '@/types';
import { X } from 'react-icons/fa';

interface ProjectCardProps {
  project: ProjectData;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Card */}
      <motion.div
        className="border-2 border-matrix-neon p-6 cursor-pointer hover:border-matrix-cyan hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
        onClick={() => setIsExpanded(true)}
        whileHover={{
          boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)',
        }}
        layout
      >
        {/* Background glow on hover */}
        <div className="absolute inset-0 bg-matrix-neon opacity-0 group-hover:opacity-5 transition-opacity duration-300" />

        <div className="relative z-10">
          {/* Title */}
          <h3 className="text-2xl font-bold text-matrix-neon mb-2">
            {project.title}
          </h3>

          {/* Tagline */}
          <p className="text-matrix-secondary text-sm mb-4 font-mono">
            {project.tagline}
          </p>

          {/* Tech badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {project.technologies.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="text-xs px-3 py-1 border border-matrix-cyan text-matrix-cyan font-mono"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className="text-xs px-3 py-1 border border-matrix-secondary text-matrix-secondary font-mono">
                +{project.technologies.length - 4} more
              </span>
            )}
          </div>

          {/* CTA */}
          <button className="text-matrix-neon text-sm font-mono hover:text-matrix-cyan transition-colors">
            view details →
          </button>
        </div>
      </motion.div>

      {/* Expanded Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setIsExpanded(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-matrix-dark border-2 border-matrix-neon max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Close button */}
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-4 right-4 text-matrix-neon hover:text-matrix-cyan transition-colors z-10"
              >
                <X size={24} />
              </button>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Header */}
                <div>
                  <h2 className="text-4xl font-bold text-matrix-neon mb-2">
                    {project.title}
                  </h2>
                  <p className="text-matrix-secondary font-mono">
                    {project.tagline}
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  {project.description.split('\n\n').map((para, i) => (
                    <p
                      key={i}
                      className="text-matrix-neon leading-relaxed text-sm md:text-base whitespace-pre-wrap"
                    >
                      {para}
                    </p>
                  ))}
                </div>

                {/* Achievements */}
                <div>
                  <h3 className="text-xl font-bold text-matrix-cyan mb-3">
                    Key Achievements
                  </h3>
                  <ul className="space-y-2">
                    {project.achievements.map((achievement, i) => (
                      <li
                        key={i}
                        className="text-matrix-neon text-sm flex items-start"
                      >
                        <span className="text-matrix-cyan mr-3">▸</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Technologies */}
                <div>
                  <h3 className="text-xl font-bold text-matrix-cyan mb-3">
                    Technologies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 border border-matrix-neon text-matrix-neon text-xs font-mono hover:bg-matrix-neon hover:text-matrix-bg transition-colors"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Links */}
                <div className="pt-4 border-t border-matrix-neon/30 flex gap-4">
                  {project.links.github && (
                    <a
                      href={project.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-matrix-neon hover:text-matrix-cyan font-mono text-sm transition-colors"
                    >
                      → GitHub
                    </a>
                  )}
                  {project.links.live && (
                    <a
                      href={project.links.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-matrix-neon hover:text-matrix-cyan font-mono text-sm transition-colors"
                    >
                      → Live Demo
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
