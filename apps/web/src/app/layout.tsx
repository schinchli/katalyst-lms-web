import type { Metadata, Viewport } from 'next';
import './globals.css';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Katalyst — Modern cloud learning built for builders',
  description: 'Advance faster with project-based cloud, database, and product engineering skills. Practice, ship, and track progress in one place.',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'Katalyst',
    title: 'Katalyst — Modern cloud learning built for builders',
    description: 'Advance faster with project-based cloud, database, and product engineering skills.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F8FB' },
    { media: '(prefers-color-scheme: dark)',  color: '#0B1221' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" data-platform-theme="deep-navy">
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.removeAttribute('data-theme');}var p=localStorage.getItem('katalyst-platform-theme-cache');if(p){var o=JSON.parse(p);if(o&&typeof o.presetId==='string'){document.documentElement.setAttribute('data-platform-theme',o.presetId);}}}catch(e){}`}
        </Script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* font-display=swap eliminates render-blocking; preload hint speeds up first paint */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
