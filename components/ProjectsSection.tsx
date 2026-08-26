'use client';

import { motion } from 'framer-motion';
import { FaGithub } from 'react-icons/fa';
import ProjectCard from './ProjectCard';
import { projects, OTHER_UTILITIES } from '@/lib/projects';
import { staggerContainer, fadeInUp } from '@/lib/animations';

export default function ProjectsSection() {
  const flagship = projects.filter((p) => p.tier === 'flagship');
  const secondary = projects.filter((p) => p.tier === 'secondary');
  const minor = projects.filter((p) => p.tier === 'minor');

  return (
    <section id="projects" className="bg-ink-950 py-24 px-6 relative border-t border-ink-600">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-14"
        >
          <p className="font-mono text-sm text-amber mb-3">03 · Work</p>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl text-paper mb-3">
            Selected projects
          </h2>
          <p className="text-paper-muted font-mono text-sm max-w-xl">
            Flagship builds, then the rest of an active ~13-repository track record.
          </p>
        </motion.div>

        {/* Flagship */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {flagship.map((project, idx) => (
            <motion.div
              key={project.id}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <ProjectCard project={project} flagship />
            </motion.div>
          ))}
        </div>

        {/* Secondary */}
        {secondary.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-16"
          >
            <h3 className="font-mono text-xs uppercase tracking-wide text-paper-dim mb-6">
              More builds
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {secondary.map((project) => (
                <motion.div key={project.id} variants={fadeInUp}>
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Minor + utilities */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 gap-x-12 gap-y-8 border-t border-ink-600 pt-10"
        >
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wide text-paper-dim mb-4">
              Also shipped
            </h3>
            <ul className="space-y-3">
              {minor.map((project) => (
                <li key={project.id} className="flex items-baseline justify-between gap-4">
                  <div>
                    <span className="text-paper text-sm">{project.title}</span>
                    <span className="text-paper-dim text-xs font-mono ml-2">
                      {project.tagline}
                    </span>
                  </div>
                  {project.links.github && (
                    <a
                      href={project.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-paper-muted hover:text-amber transition-colors shrink-0"
                      aria-label={`${project.title} repository`}
                    >
                      <FaGithub size={14} />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-wide text-paper-dim mb-4">
              Standalone utilities
            </h3>
            <ul className="space-y-3">
              {OTHER_UTILITIES.map((util) => (
                <li key={util.name}>
                  <span className="text-paper text-sm">{util.name}</span>
                  <p className="text-paper-dim text-xs font-mono mt-0.5 leading-relaxed">
                    {util.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
