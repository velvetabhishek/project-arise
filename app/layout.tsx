// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Rajdhani, Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Project Arise — Level Up In Real Life',
  description:
    'A personal fitness transformation system inspired by Solo Leveling. Track workouts, gain stats, level up your physique.',
  keywords: ['fitness', 'transformation', 'workout', 'solo leveling', 'gamification'],
};

export const viewport: Viewport = {
  themeColor: '#050508',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${rajdhani.variable} ${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body className="arise-page arise-grid-bg">
        {children}
      </body>
    </html>
  );
}
