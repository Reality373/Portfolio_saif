'use client';

import { motion } from 'framer-motion';
import ProjectCard from './ProjectCard';
import { projects } from '@/lib/projects';
import { staggerContainer, fadeInUp } from '@/lib/animations';

export default function ProjectsSection() {
  // Separate featured and other projects
  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);

  return (
    <section
      id="projects"
      className="min-h-screen bg-matrix-bg py-20 px-4 relative"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section title */}
        <motion.div
          className="mb-16"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-matrix-neon mb-4">
            <span className="text-matrix-cyan">&lt;</span> Projects{' '}
            <span className="text-matrix-cyan">/&gt;</span>
          </h2>
          <div className="h-1 w-20 bg-matrix-neon" />
          <p className="text-matrix-secondary mt-4 font-mono">
            Featured work & technical achievements
          </p>
        </motion.div>

        {/* Featured projects (larger grid) */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {featured.map((project, idx) => (
            <motion.div
              key={project.id}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>

        {/* Other projects section (if any) */}
        {others.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-matrix-neon mb-8">
              Other Projects
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {others.map((project) => (
                <motion.div key={project.id} variants={fadeInUp}>
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
