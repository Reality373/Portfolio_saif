'use client';

import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { SKILLS } from '@/lib/constants';

export default function SkillsSection() {
  return (
    <section id="skills" className="bg-ink-950 py-24 px-6 relative border-t border-ink-600">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-14"
        >
          <p className="font-mono text-sm text-amber mb-3">02 · Stack</p>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl text-paper">
            Skills &amp; technologies
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-ink-600 border border-ink-600 rounded-md overflow-hidden"
        >
          {SKILLS.map((group) => (
            <motion.div
              key={group.category}
              variants={fadeInUp}
              className="bg-ink-900 p-6 hover:bg-ink-800 transition-colors"
            >
              <h3 className="font-mono text-xs uppercase tracking-wider text-trace mb-4">
                {group.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs font-mono px-2.5 py-1 border border-ink-600 text-paper-muted rounded-sm hover:border-amber hover:text-paper transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
