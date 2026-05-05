import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './styles/globals.css';
import './styles/animations.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Saif Shikalgar - Full-Stack Developer',
  description:
    'Portfolio showcasing Drive-by-Wire autonomous systems and FiberOpticCalc FTTH platform',
  keywords: [
    'developer',
    'hardware engineer',
    'autonomous systems',
    'cybersecurity',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jetbrainsMono.className}>
      <body className="bg-matrix-bg text-matrix-neon">
        {children}
      </body>
    </html>
  );
}
