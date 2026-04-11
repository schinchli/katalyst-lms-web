import Link from 'next/link';

export default function FpFooter() {
  return (
    <footer className="fp-footer">
      <div className="fp-footer-inner">
        <div>
          <Link href="/" className="fp-nav-brand" style={{ textDecoration: 'none' }}>
            <div className="fp-nav-logo">K</div>
            <span className="fp-nav-name">Katalyst</span>
          </Link>
          <p className="fp-footer-brand-desc">
            Master AWS &amp; cloud certifications with 400+ practice questions, daily challenges,
            and a real-time leaderboard. Free to start — Pro unlocks everything.
          </p>
        </div>
        <div>
          <div className="fp-footer-col-title">Product</div>
          <a href="/#features" className="fp-footer-link">Features</a>
          <a href="/#pricing"  className="fp-footer-link">Pricing</a>
          <a href="/#faq"      className="fp-footer-link">FAQ</a>
          <Link href="/dashboard/quizzes" className="fp-footer-link">Browse Quizzes</Link>
        </div>
        <div>
          <div className="fp-footer-col-title">Company</div>
          <Link href="/about"          className="fp-footer-link">About</Link>
          <Link href="/privacy"        className="fp-footer-link">Privacy Policy</Link>
          <Link href="/terms"          className="fp-footer-link">Terms of Service</Link>
          <Link href="/delete-account" className="fp-footer-link">Delete Account</Link>
        </div>
        <div>
          <div className="fp-footer-col-title">Support</div>
          <a href="mailto:support@katalysthq.app" className="fp-footer-link">support@katalysthq.app</a>
          <Link href="/instructions" className="fp-footer-link">Instructions</Link>
          <Link href="/login"        className="fp-footer-link">Sign in</Link>
          <Link href="/signup"       className="fp-footer-link">Create account</Link>
        </div>
      </div>
      <div className="fp-footer-bottom">
        <span className="fp-footer-copy">© {new Date().getFullYear()} Katalyst. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link href="/privacy" className="fp-footer-link" style={{ margin: 0 }}>Privacy</Link>
          <Link href="/terms"   className="fp-footer-link" style={{ margin: 0 }}>Terms</Link>
        </div>
      </div>
    </footer>
  );
}
