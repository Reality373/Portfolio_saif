'use client';

import { motion } from 'framer-motion';
import { FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa';

export default function Footer() {
  const links = [
    {
      icon: FaGithub,
      href: 'https://github.com/Reality373',
      label: 'GitHub',
    },
    {
      icon: FaLinkedin,
      href: 'https://linkedin.com/in/reality373',
      label: 'LinkedIn',
    },
    {
      icon: FaEnvelope,
      href: 'mailto:15974saif@gmail.com',
      label: 'Email',
    },
  ];

  return (
    <footer className="bg-matrix-bg border-t border-matrix-neon/30 py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Left side - text */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center md:text-left"
        >
          <p className="text-matrix-neon font-mono text-sm">
            <span className="text-matrix-cyan">$</span> echo "made with code &
            curiosity"
          </p>
          <p className="text-matrix-secondary text-xs mt-2">
            © 2026 Saif Shikalgar
          </p>
        </motion.div>

        {/* Right side - social links */}
        <motion.div
          className="flex gap-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.1 }}
        >
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <motion.a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-matrix-neon hover:text-matrix-cyan transition-colors"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon size={24} />
              </motion.a>
            );
          })}
        </motion.div>
      </div>
    </footer>
  );
}
