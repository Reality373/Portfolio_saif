import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './styles/globals.css';
import './styles/animations.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

const SITE_URL = 'https://saifx.space';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Saif Shikalgar — Software & Embedded Systems Engineer',
  description:
    'Portfolio of Saif Shikalgar: automotive CAN intrusion-prevention firmware, a published Android app (FiberOpticCalc), local-first AI image search, and drive-by-wire vehicle systems.',
  keywords: [
    'Saif Shikalgar',
    'embedded systems engineer',
    'full-stack developer',
    'AI engineer',
    'CAN bus',
    'STM32',
    'ESP32',
    'Android developer',
  ],
  openGraph: {
    title: 'Saif Shikalgar — Software & Embedded Systems Engineer',
    description:
      'Automotive CAN intrusion-prevention firmware, a published Android app, local-first AI image search, and drive-by-wire vehicle systems.',
    url: SITE_URL,
    siteName: 'Saif Shikalgar',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Saif Shikalgar — Software & Embedded Systems Engineer',
    description:
      'Automotive CAN intrusion-prevention firmware, a published Android app, local-first AI image search, and drive-by-wire vehicle systems.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-ink-950 text-paper font-sans">{children}</body>
    </html>
  );
}
