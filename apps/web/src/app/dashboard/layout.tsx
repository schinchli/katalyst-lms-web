'use client';
import Link from 'next/link';
import Script from 'next/script';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { quizzes } from '@/data/quizzes';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/lib/supabase';
import { migrateFromLocalStorage } from '@/lib/db';
import {
  applyPlatformThemePreset,
  DEFAULT_PLATFORM_THEME,
  normalizePlatformTheme,
} from '@/lib/platformTheme';
import { fetchUserTheme } from '@/lib/userTheme';
import {
  applyThemePrefs,
  applyFontSize,
  normalizeThemePrefs,
  DEFAULT_THEME_PREFS,
} from '@/lib/themePacks';
import { PlatformExperienceProvider } from '@/components/PlatformExperienceProvider';
import { ManagedQuizContentProvider, useManagedQuizContentVersion } from '@/components/ManagedQuizContentProvider';
import ErrorBoundary from '@/components/ErrorBoundary';

const NAV = [
  { href: '/dashboard',             label: 'Home',        icon: HomeIcon },
  { href: '/dashboard/quizzes',     label: 'Courses',     icon: BookIcon },
  { href: '/dashboard/learn',       label: 'Learn',       icon: PlayNavIcon },
  { href: '/dashboard/progress',    label: 'Progress',    icon: TrendIcon },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: TrophyIcon },
  { href: '/dashboard/bookmarks',   label: 'Bookmarks',   icon: BookmarkNavIcon },
  { href: '/dashboard/profile',     label: 'Profile',     icon: UserIcon },
];

const ADMIN_NAV  = { href: '/dashboard/admin',    label: 'Admin',    icon: AdminIcon };
const SETTINGS_NAV = { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon };

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function BookIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function TrendIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
function BookmarkNavIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function PlayNavIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill={active ? 'currentColor' : 'none'} />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function TrophyIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  );
}
function AdminIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function CoinsNavIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v2m0 8v2M9 9h4a2 2 0 0 1 0 4H9" />
    </svg>
  );
}
function StoreNavIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function ContestIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}
function BattleIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" />
      <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
      <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z" />
      <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z" />
      <path d="M14 14.5V13h-4v1.5" />
      <path d="M10 9.5V11h4V9.5" />
      <path d="M12 13v-2" />
    </svg>
  );
}
function SelfChallengeIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

const DIFF_COLOR: Record<string, string> = { beginner: 'var(--success)', intermediate: 'var(--warning)', advanced: 'var(--error)' };
const CERT_COLOR: Record<string, string> = { foundational: 'var(--success)', associate: 'var(--info)', professional: 'var(--warning)', specialty: '#7367F0' };

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  useManagedQuizContentVersion();
  const pathname = usePathname();
  const router   = useRouter();
  const [dark,        setDark]        = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isAdmin,     setIsAdmin]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { isPro } = useSubscription();

  // Auth guard + admin check — runs on every session
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        // No valid session — redirect to login (OWASP A01 fix)
        router.replace('/login');
        return;
      }
      const u = session.user;

      // Server-side admin check — never trust localStorage (OWASP A01 fix)
      fetch('/api/admin/check', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((r) => r.json())
        .then((d: { isAdmin?: boolean }) => { if (d.isAdmin) setIsAdmin(true); })
        .catch(() => { /* non-blocking */ });

      // One-time migration: localStorage → Supabase (no-op if already migrated)
      migrateFromLocalStorage(u.id).catch(() => { /* best-effort */ });

      // Load user theme pref to sync web/mobile
      fetchUserTheme(u.id)
        .then((prefs) => {
          try {
            localStorage.setItem('katalyst-theme', JSON.stringify(prefs));
            applyFontSize(prefs.fontSize);          // always apply font size
            if (!prefs.usePlatform) applyThemePrefs(prefs);
          } catch { /* ignore */ }
        })
        .catch(() => { /* ignore */ });

      const quizResults = (() => {
        try { return JSON.parse(localStorage.getItem('quiz-results') || '[]'); } catch { return []; }
      })();
      fetch('/api/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseId:  u.id,
          email:       u.email ?? '',
          name:        (u.user_metadata?.name as string | undefined) ?? u.email?.split('@')[0] ?? '',
          accessToken: session.access_token,
          createdAt:   u.created_at,
          quizResults,
        }),
      }).catch(() => { /* non-blocking */ });
    });
  }, []);

  // Real-time session monitoring — redirects to /login when session expires
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (event === 'SIGNED_OUT') router.replace('/login');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  // Dark mode
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isDark = saved === null ? true : saved === 'dark'; // default: dark
    if (isDark) { document.documentElement.setAttribute('data-theme', 'dark'); setDark(true); }
    else { document.documentElement.setAttribute('data-theme', ''); setDark(false); }

    // Apply cached platform theme immediately (server source is fetched below)
    try {
      const raw = localStorage.getItem('katalyst-platform-theme-cache');
      const cached = raw ? normalizePlatformTheme(JSON.parse(raw)) : DEFAULT_PLATFORM_THEME;
      applyPlatformThemePreset(cached.presetId);
    } catch {
      applyPlatformThemePreset(DEFAULT_PLATFORM_THEME.presetId);
    }

    // Apply font size from cache immediately (prevents FOUC on reload)
    // Always applied regardless of usePlatform — font size is a universal preference
    try {
      const raw = localStorage.getItem('katalyst-theme');
      const prefs = raw ? normalizeThemePrefs(JSON.parse(raw)) : DEFAULT_THEME_PREFS;
      applyFontSize(prefs.fontSize);
      if (!prefs.usePlatform) applyThemePrefs(prefs);
    } catch { /* best-effort */ }
  }, []);

  // Fetch platform theme from server so all clients stay consistent.
  useEffect(() => {
    let active = true;
    fetch('/api/theme')
      .then((r) => r.json())
      .then((d: { ok?: boolean; theme?: unknown }) => {
        if (!active || !d?.ok) return;
        const theme = normalizePlatformTheme(d.theme);
        applyPlatformThemePreset(theme.presetId);
        try {
          const raw = localStorage.getItem('katalyst-theme');
          const prefs = raw ? normalizeThemePrefs(JSON.parse(raw)) : DEFAULT_THEME_PREFS;
          applyFontSize(prefs.fontSize);
          if (!prefs.usePlatform) applyThemePrefs(prefs);
        } catch { /* best-effort */ }
      })
      .catch(() => { /* best-effort */ });

    return () => { active = false; };
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '');
    localStorage.setItem('theme', next ? 'dark' : 'light');
    try {
      const raw = localStorage.getItem('katalyst-theme');
      const prefs = raw ? normalizeThemePrefs(JSON.parse(raw)) : DEFAULT_THEME_PREFS;
      if (!prefs.usePlatform) applyThemePrefs(prefs);
    } catch { /* best-effort */ }
  };

  // Search
  const searchResults = searchQuery.length >= 2
    ? quizzes.filter((q) =>
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.examCode ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const goToQuiz = (id: string) => {
    setSearchQuery(''); setShowResults(false);
    router.push(`/dashboard/quiz/${id}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  return (
    <PlatformExperienceProvider>
      {/* Razorpay checkout — loaded lazily once for all dashboard pages */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="page-wrapper">

      {/* Sidebar — LEFT side (Vuexy vertical menu pattern, first in DOM) */}
      <aside className={`sidebar${sidebarOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">K</div>
            <div>
              <div className="sidebar-brand-name">Katalyst</div>
              <div className="sidebar-brand-sub">Supercharge Your Career</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div ref={searchRef} style={{ padding: '12px 16px 8px', position: 'relative', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
            <SearchIcon />
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
              placeholder="Search courses…"
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--text)', width: '100%', fontFamily: 'inherit' }}
            />
          </div>

          {/* Search results dropdown */}
          {showResults && searchResults.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 16, right: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow)', zIndex: 100, overflow: 'hidden' }}>
              {searchResults.map((q) => {
                const accent = q.certLevel ? CERT_COLOR[q.certLevel] : (DIFF_COLOR[q.difficulty] ?? '#7367F0');
                const label  = q.examCode ?? (q.category.charAt(0).toUpperCase() + q.category.slice(1).replace('-', ' '));
                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuiz(q.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--border)', fontFamily: 'inherit' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>📖</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</div>
                      <div style={{ fontSize: 11, color: accent, fontWeight: 600, marginTop: 1 }}>{label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {showResults && searchQuery.length >= 2 && searchResults.length === 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 16, right: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow)', zIndex: 100, padding: '16px', textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
              No courses found for "{searchQuery}"
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="nav-section-header">Main Menu</div>
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon   = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`nav-item${active ? ' active' : ''}`}>
                <Icon active={active} />
                {item.label}
              </Link>
            );
          })}
          {isAdmin && (() => {
            const activeAdmin    = pathname === ADMIN_NAV.href;
            const activeSettings = pathname === SETTINGS_NAV.href;
            return (
              <>
                <div className="nav-section-header" style={{ marginTop: 8 }}>Admin</div>
                <Link href={ADMIN_NAV.href} className={`nav-item${activeAdmin ? ' active' : ''}`}>
                  <AdminIcon active={activeAdmin} />
                  {ADMIN_NAV.label}
                </Link>
                <Link href={SETTINGS_NAV.href} className={`nav-item${activeSettings ? ' active' : ''}`}>
                  <SettingsIcon active={activeSettings} />
                  {SETTINGS_NAV.label}
                </Link>
              </>
            );
          })()}
        </nav>

        {/* Footer: tier badge + dark mode + logout */}
        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link
              href="/dashboard/profile"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textDecoration: 'none',
                background: isPro ? '#FF9F4318' : 'var(--bg)',
                color:      isPro ? 'var(--warning)'  : 'var(--text-secondary)',
                border:     isPro ? '1px solid #FF9F4340' : '1px solid var(--border)',
              }}
            >
              {isPro ? '⭐ Pro' : 'Free Plan'}
            </Link>
            <button
              type="button"
              onClick={toggleDark}
              title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <div style={{ position: 'relative', display: 'inline-flex' }} className="logout-wrap">
              <button
                type="button"
                aria-label="Sign out"
                onClick={handleLogout}
                style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#FF4C5114'; e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.borderColor = '#FF4C5140'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <LogoutIcon />
              </button>
              <span style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 5, whiteSpace: 'nowrap', pointerEvents: 'none', opacity: 0, transition: 'opacity 0.15s' }} className="logout-tip">
                Logout
              </span>
            </div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Katalyst v1.0</span>
        </div>
      </aside>

      {/* Main content — RIGHT of sidebar */}
      <main className="main-content">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      {/* Mobile sidebar overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile hamburger FAB */}
      <button
        className="mobile-nav-btn"
        onClick={() => setSidebarOpen((o) => !o)}
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {sidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
      </button>

      </div>
    </PlatformExperienceProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ManagedQuizContentProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </ManagedQuizContentProvider>
  );
}
