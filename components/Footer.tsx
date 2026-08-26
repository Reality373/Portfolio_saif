'use client';

import { motion } from 'framer-motion';
import { FaGithub, FaLinkedin, FaEnvelope, FaUpRightFromSquare } from 'react-icons/fa6';
import { SITE } from '@/lib/constants';

const links = [
  { icon: FaGithub, href: SITE.github, label: 'GitHub' },
  { icon: FaLinkedin, href: SITE.linkedin, label: 'LinkedIn' },
  { icon: FaEnvelope, href: `mailto:${SITE.email}`, label: 'Email' },
];

export default function Footer() {
  return (
    <footer id="contact" className="bg-ink-950 border-t border-ink-600 py-20 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <p className="font-mono text-sm text-amber mb-3">04 · Contact</p>
          <h2 className="font-display font-semibold text-3xl sm:text-5xl text-paper mb-6 max-w-2xl leading-tight">
            Building something that needs embedded, AI, or full-stack work?
          </h2>
          <motion.a
            href={`mailto:${SITE.email}`}
            whileHover={{ x: 6 }}
            className="inline-flex items-center gap-3 text-xl sm:text-2xl font-display text-trace hover:text-amber transition-colors"
          >
            {SITE.email}
            <FaUpRightFromSquare className="text-lg" />
          </motion.a>
        </motion.div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-t border-ink-600 pt-8">
          <p className="text-paper-dim text-xs font-mono">
            © 2026 {SITE.name} · Built with Next.js &amp; Tailwind CSS
          </p>
          <div className="flex gap-6">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <motion.a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="text-paper-muted hover:text-amber transition-colors"
                  whileHover={{ y: -2 }}
                >
                  <Icon size={18} />
                </motion.a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
