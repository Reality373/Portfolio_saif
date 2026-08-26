import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './styles/globals.css';
import './styles/animations.css';
import { ThemeProvider } from '@/components/ThemeProvider';

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
    'Cybersecurity',
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
      className={`dark ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('saif-portfolio-theme');
                  var isDark = stored ? stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) : true;
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-ink-950 text-paper font-sans antialiased selection:bg-amber selection:text-ink-950">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
