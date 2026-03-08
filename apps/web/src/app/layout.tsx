import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Katalyst — Supercharge Your Career. Learn Skills Faster.',
  description: 'Supercharge your career with Katalyst. Master AWS Cloud & Generative AI certifications with interactive practice exams.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        {/* Prevent flash of light mode — apply dark before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.removeAttribute('data-theme');}})();` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
