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
    <html lang="en" data-theme="dark">
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.removeAttribute('data-theme');}var p=localStorage.getItem('katalyst-platform-theme-cache');if(p){var o=JSON.parse(p);if(o&&o.presetId&&typeof o.presetId==='string'&&o.presetId!==null){document.documentElement.setAttribute('data-platform-theme',o.presetId);}else{document.documentElement.removeAttribute('data-platform-theme');}}var e=localStorage.getItem('katalyst-platform-experience-cache');if(e){var c=JSON.parse(e);if(c&&c.theme&&(c.theme.platformPreset===null||!c.theme.platformPreset)){document.documentElement.removeAttribute('data-platform-theme');}}}catch(ex){}`}
        </Script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Public Sans — matches Vuexy design system; font-display=swap eliminates render-blocking */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
