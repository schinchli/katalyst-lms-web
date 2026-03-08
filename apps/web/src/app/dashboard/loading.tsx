/**
 * Dashboard route loading skeleton — shown by Next.js App Router
 * while a /dashboard/* page is streaming/fetching.
 */
export default function DashboardLoading() {
  return (
    <div className="page-content">
      {/* Header skeleton */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ height: 28, width: 220, borderRadius: 6, background: 'var(--border)', marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 16, width: 160, borderRadius: 4, background: 'var(--border)', animation: 'pulse 1.5s ease-in-out infinite 0.1s' }} />
      </div>

      {/* Stat cards skeleton */}
      <div className="dash-stats-grid" style={{ marginBottom: 28 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="dash-stat-card" style={{ opacity: 1 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--border)', animation: `pulse 1.5s ease-in-out infinite ${i * 0.05}s` }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 22, width: 70, borderRadius: 4, background: 'var(--border)', marginBottom: 6, animation: `pulse 1.5s ease-in-out infinite ${i * 0.05}s` }} />
              <div style={{ height: 13, width: 100, borderRadius: 3, background: 'var(--border)', animation: `pulse 1.5s ease-in-out infinite ${i * 0.05 + 0.1}s` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ height: 64, borderRadius: 10, background: 'var(--border)', marginBottom: 12, animation: `pulse 1.5s ease-in-out infinite ${i * 0.07}s` }} />
      ))}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
