'use client';

import { motion } from 'framer-motion';
import { FaGithub, FaGooglePlay } from 'react-icons/fa';
import ProjectCard from './ProjectCard';
import ProjectShowcase from './ProjectShowcase';
import { projects, OTHER_UTILITIES } from '@/lib/projects';
import { staggerContainer, fadeInUp } from '@/lib/animations';

export default function ProjectsSection() {
  const allFlagship = projects.filter((p) => p.tier === 'flagship');
  const showcased = allFlagship.find((p) => p.gallery && p.gallery.length > 0);
  const flagship = allFlagship.filter((p) => p.id !== showcased?.id);
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
          <p className="font-mono text-sm text-amber mb-3">03 · Selected Work</p>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl text-paper mb-3">
            Selected projects
          </h2>
          <p className="text-paper-muted font-mono text-sm max-w-xl">
            Flagship builds, then the rest of an active ~13-repository track record.
          </p>
        </motion.div>

        {/* Showcase hero (app with visual gallery) */}
        {showcased && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-8 border border-ink-600 bg-ink-900 rounded-md overflow-hidden grid md:grid-cols-[280px_1fr] gap-8 p-8"
          >
            <ProjectShowcase items={showcased.gallery!} />

            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="font-display font-semibold text-2xl sm:text-3xl text-paper">
                  {showcased.title}
                </h3>
                <span className="font-mono text-[11px] text-paper-dim whitespace-nowrap pt-1">
                  {showcased.period}
                </span>
              </div>
              <p className="text-paper-muted font-mono text-sm mb-6">{showcased.tagline}</p>

              {showcased.metrics && (
                <div className="flex flex-wrap gap-6 mb-6 border-y border-ink-600 py-4">
                  {showcased.metrics.map((metric) => (
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

              <p className="text-paper-muted text-sm leading-relaxed mb-6">
                {showcased.description.split('\n\n')[0]}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                {showcased.links.playStore && (
                  <a
                    href={showcased.links.playStore}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-trace text-white dark:text-ink-950 font-semibold text-sm rounded-sm hover:shadow-[0_0_24px_rgba(76,201,240,0.35)] transition-shadow"
                  >
                    <FaGooglePlay /> Get it on Google Play
                  </a>
                )}
                {showcased.links.github && (
                  <a
                    href={showcased.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-ink-600 text-paper text-sm rounded-sm hover:border-amber hover:text-amber transition-colors"
                  >
                    <FaGithub /> Repository
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}

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
