'use client';

interface MaintenanceBannerProps {
  message: string;
}

export function MaintenanceBanner({ message }: MaintenanceBannerProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        background: 'var(--bg, #0F172A)',
        padding: 24,
      }}
    >
      <div
        className="dc-card"
        style={{
          maxWidth: 480,
          width: '100%',
          padding: 44,
          textAlign: 'center',
          display: 'grid',
          gap: 20,
        }}
      >
        <div style={{ fontSize: 52 }}>🔧</div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>
          Under Maintenance
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
          {message}
        </p>
        <a
          href="mailto:support@learnkloud.app"
          style={{
            display: 'inline-block',
            marginTop: 8,
            padding: '12px 28px',
            borderRadius: 12,
            background: 'var(--primary)',
            color: '#fff',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: 15,
          }}
        >
          Check Status
        </a>
      </div>
    </div>
  );
}
