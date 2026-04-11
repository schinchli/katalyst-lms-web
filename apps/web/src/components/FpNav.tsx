'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FpNav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fp-nav">
      <Link href="/" className="fp-nav-brand">
        <div className="fp-nav-logo">K</div>
        <span className="fp-nav-name">Katalyst</span>
      </Link>

      <div className={`fp-nav-links${open ? ' open' : ''}`}>
        <a href="/#features" className="fp-nav-link" onClick={() => setOpen(false)}>Features</a>
        <a href="/#pricing"  className="fp-nav-link" onClick={() => setOpen(false)}>Pricing</a>
        <a href="/#faq"      className="fp-nav-link" onClick={() => setOpen(false)}>FAQ</a>
        <Link href="/about"  className="fp-nav-link" onClick={() => setOpen(false)}>About</Link>
      </div>

      <div className="fp-nav-actions">
        <Link href="/login"  className="fp-btn-ghost">Sign in</Link>
        <Link href="/signup" className="fp-btn-primary">Get started free</Link>
        <button className="fp-hamburger" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {open
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </div>
    </nav>
  );
}
