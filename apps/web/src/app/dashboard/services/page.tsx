'use client';

/**
 * AWS Services explorer — every service in the catalog on one page, grouped by
 * category (Compute, Disk, Storage, Database, Networking, Data, AI/ML, …) with
 * filters by certification track and category, plus relevance-based
 * recommendations ("Core / Important / Good to know" per selected track).
 */
import { useEffect, useMemo, useState } from 'react';
import {
  AWS_SERVICES, CERT_TRACKS, SERVICE_CATEGORIES, RELEVANCE_LABEL,
  recommendedForTrack,
  type AwsService, type CertTrackId, type ServiceCategoryId,
} from '@/data/awsServices';

const TRACK_STORAGE_KEY = 'services-cert-track';

const REL_BADGE: Record<number, string> = {
  3: 'vx-badge-success',
  2: 'vx-badge-warning',
  1: 'vx-badge-info',
};

const chipStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px',
  borderRadius: 20,
  border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
  background: active ? 'var(--primary-light)' : 'var(--card-bg, transparent)',
  color: active ? 'var(--primary)' : 'var(--text-secondary)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

function ServiceRow({ service, track }: { service: AwsService; track: CertTrackId | 'all' }) {
  const rel = track !== 'all' ? service.tracks?.[track] : undefined;
  const cat = SERVICE_CATEGORIES.find((c) => c.id === service.category);
  return (
    <div className="vx-list-item" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
      <div className="vx-avatar vx-avatar-sm vx-avatar-primary">{cat?.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="vx-list-title" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {service.name}
          {rel && <span className={`vx-badge ${REL_BADGE[rel]}`}>{RELEVANCE_LABEL[rel]}</span>}
          {service.deprecated && <span className="vx-badge vx-badge-error">Deprecated / EOL</span>}
        </div>
        <div className="vx-list-sub">{service.description}</div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [search, setSearch] = useState('');
  const [track, setTrack] = useState<CertTrackId | 'all'>('all');
  const [category, setCategory] = useState<ServiceCategoryId | 'all'>('all');
  const [relevantOnly, setRelevantOnly] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(TRACK_STORAGE_KEY);
    if (saved && CERT_TRACKS.some((t) => t.id === saved)) setTrack(saved as CertTrackId);
  }, []);
  useEffect(() => {
    if (track === 'all') localStorage.removeItem(TRACK_STORAGE_KEY);
    else localStorage.setItem(TRACK_STORAGE_KEY, track);
  }, [track]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return AWS_SERVICES.filter((s) => {
      if (category !== 'all' && s.category !== category) return false;
      if (track !== 'all' && relevantOnly && !s.tracks?.[track]) return false;
      if (q && !`${s.name} ${s.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, track, category, relevantOnly]);

  // Group into category sections, ordered by SERVICE_CATEGORIES; within a
  // section sort by relevance (when a track is active) then name.
  const sections = useMemo(() => {
    return SERVICE_CATEGORIES
      .map((cat) => ({
        cat,
        services: filtered
          .filter((s) => s.category === cat.id)
          .sort((a, b) => {
            if (track !== 'all') {
              const d = (b.tracks?.[track] ?? 0) - (a.tracks?.[track] ?? 0);
              if (d) return d;
            }
            return a.name.localeCompare(b.name);
          }),
      }))
      .filter((s) => s.services.length > 0);
  }, [filtered, track]);

  const recommended = useMemo(
    () => (track === 'all' ? [] : recommendedForTrack(track, 12)),
    [track],
  );
  const trackLabel = CERT_TRACKS.find((t) => t.id === track)?.short;

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
        <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text)', fontSize: 22 }}>AWS Services</h4>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {filtered.length} of {AWS_SERVICES.length} services
        </span>
      </div>
      <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--text-secondary)' }}>
        The full AWS catalog classified by category. Pick your certification track to see what matters for your exam.
      </p>

      {/* Search + track */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 260px', maxWidth: 420, height: 40, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', padding: '0 14px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)', flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services (e.g. Bedrock, EBS, Transit Gateway)"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: 'var(--text)', width: '100%', fontFamily: 'inherit' }}
          />
        </div>
        <select
          value={track} onChange={(e) => setTrack(e.target.value as CertTrackId | 'all')}
          style={{ height: 40, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', padding: '0 14px', font: 'inherit', fontSize: 14, cursor: 'pointer' }}
        >
          <option value="all">All certification tracks</option>
          {CERT_TRACKS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        {track !== 'all' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
            <input type="checkbox" checked={relevantOnly} onChange={(e) => setRelevantOnly(e.target.checked)} />
            Exam-relevant only
          </label>
        )}
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <button style={chipStyle(category === 'all')} onClick={() => setCategory('all')}>All categories</button>
        {SERVICE_CATEGORIES.map((c) => (
          <button key={c.id} style={chipStyle(category === c.id)} onClick={() => setCategory(c.id)}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Recommended for selected track */}
      {track !== 'all' && category === 'all' && !search && recommended.length > 0 && (
        <div className="vx-card" style={{ marginBottom: 20 }}>
          <div className="vx-card-header">
            <h5 className="vx-card-title">⭐ Recommended for {trackLabel}</h5>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>core services to master first</span>
          </div>
          <div className="vx-card-body" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {recommended.map((s) => (
              <span key={s.id} className="vx-badge vx-badge-primary" title={s.description} style={{ padding: '7px 12px', fontSize: 13 }}>
                {SERVICE_CATEGORIES.find((c) => c.id === s.category)?.icon} {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category sections */}
      {sections.length === 0 && (
        <div className="vx-card"><div className="vx-card-body" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          No services match — try clearing the search or switching off “Exam-relevant only”.
        </div></div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {sections.map(({ cat, services }) => (
          <div key={cat.id} className="vx-card">
            <div className="vx-card-header">
              <h5 className="vx-card-title">{cat.icon} {cat.label}</h5>
              <span className="vx-badge vx-badge-secondary">{services.length}</span>
            </div>
            <div className="vx-list">
              {services.map((s) => <ServiceRow key={s.id} service={s} track={track} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
