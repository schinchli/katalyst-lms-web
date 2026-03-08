'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import Link from 'next/link';

interface VideoItem {
  id: string;
  youtubeId: string;
  title: string;
  author: string;
  duration: string;
  views: string;
  tag: string;
  tagColor: string;
  description: string;
  chapters?: { time: string; label: string }[];
}

const PLAYLIST: VideoItem[] = [
  {
    id: 'bedrock-intro',
    youtubeId: 'BY4YlxhSKr8',
    title: "A Beginner's Guide to Amazon Bedrock",
    author: 'AWS Official',
    duration: '22:14',
    views: '84k',
    tag: 'Bedrock',
    tagColor: '#7367F0',
    description:
      "A comprehensive beginner's guide to Amazon Bedrock — the fully managed service for building generative AI applications. Covers Amazon Bedrock Knowledge Bases, Guardrails, and Security best practices for enterprise deployments.",
    chapters: [
      { time: '0:00',  label: 'Introduction to Amazon Bedrock' },
      { time: '3:45',  label: 'Foundation Models Overview' },
      { time: '7:20',  label: 'Amazon Bedrock Knowledge Bases' },
      { time: '12:10', label: 'Guardrails for Amazon Bedrock' },
      { time: '17:30', label: 'Security & IAM Best Practices' },
      { time: '20:45', label: 'Next Steps & Resources' },
    ],
  },
  {
    id: 'rag-bedrock',
    youtubeId: 'N0tlOXZwrSs',
    title: 'Building RAG Applications with Amazon Bedrock',
    author: 'AWS Developers',
    duration: '18:32',
    views: '52k',
    tag: 'RAG',
    tagColor: '#00BAD1',
    description:
      'Learn how to build Retrieval-Augmented Generation (RAG) pipelines using Amazon Bedrock Knowledge Bases, OpenSearch Serverless, and Claude foundation models.',
    chapters: [
      { time: '0:00',  label: 'What is RAG?' },
      { time: '4:10',  label: 'Knowledge Bases Setup' },
      { time: '9:00',  label: 'Vector Embeddings & Search' },
      { time: '13:45', label: 'Query & Response Flow' },
      { time: '16:30', label: 'Production Best Practices' },
    ],
  },
  {
    id: 'bedrock-agents',
    youtubeId: 'iMxfwZWl3EY',
    title: 'Amazon Bedrock Agents — Build AI Agents',
    author: 'AWS Official',
    duration: '15:48',
    views: '39k',
    tag: 'Agents',
    tagColor: '#FF9F43',
    description:
      'Deep dive into Amazon Bedrock Agents — how to create, configure, and deploy autonomous AI agents that can execute multi-step tasks using tools and knowledge bases.',
    chapters: [
      { time: '0:00',  label: 'Agents Architecture Overview' },
      { time: '3:20',  label: 'Creating Your First Agent' },
      { time: '8:15',  label: 'Action Groups & Lambda' },
      { time: '12:00', label: 'Testing & Monitoring' },
    ],
  },
  {
    id: 'prompt-engineering',
    youtubeId: 'dOxUroR57xs',
    title: 'Prompt Engineering for AWS GenAI',
    author: 'AWS re:Invent',
    duration: '28:05',
    views: '121k',
    tag: 'Prompting',
    tagColor: '#28C76F',
    description:
      'Master prompt engineering techniques for Claude and other foundation models on Amazon Bedrock. Covers chain-of-thought, few-shot prompting, and advanced prompt patterns.',
    chapters: [
      { time: '0:00',  label: 'Prompt Engineering Basics' },
      { time: '5:30',  label: 'Chain-of-Thought Prompting' },
      { time: '12:00', label: 'Few-Shot & Zero-Shot' },
      { time: '18:40', label: 'Advanced Techniques' },
      { time: '24:10', label: 'Real-world Examples' },
    ],
  },
  {
    id: 'guardrails-security',
    youtubeId: 'fqpSMDX2Xho',
    title: 'Guardrails & Security in Amazon Bedrock',
    author: 'AWS Security',
    duration: '20:17',
    views: '28k',
    tag: 'Security',
    tagColor: '#FF4C51',
    description:
      'Learn how to implement Guardrails in Amazon Bedrock to prevent harmful content, filter PII, and enforce content policies. Covers IAM roles, VPC endpoints, and compliance controls.',
    chapters: [
      { time: '0:00',  label: 'Why Guardrails Matter' },
      { time: '4:30',  label: 'Content Filtering' },
      { time: '9:15',  label: 'PII Detection & Redaction' },
      { time: '14:00', label: 'Topic Denial Policies' },
      { time: '17:45', label: 'Monitoring & Audit Logs' },
    ],
  },
];

// ── SVG Icons ────────────────────────────────────────────────────────────────
function PlayFill() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
}
function PlayCircle({ size = 40, color = '#7367F0' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill={color} stroke="none" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
function ExternalLink() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
function BookmarkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function LearnPage() {
  const [activeId,   setActiveId]   = useState('bedrock-intro');
  const [showChapters, setShowChapters] = useState(true);

  const active = PLAYLIST.find((v) => v.id === activeId) ?? PLAYLIST[0];

  return (
    <div className="page-content" style={{ maxWidth: 1200 }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Video Library</h1>
        <p className="page-subtitle">AWS Generative AI — Learn from official guides and tutorials</p>
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

        {/* ── Left: Player + Info ── */}
        <div>
          {/* Video Player */}
          <div style={{ background: '#1A1A2E', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', marginBottom: 20 }}>
            {/* YouTube iframe — 16:9 */}
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#0D0D1A' }}>
              <iframe
                key={active.youtubeId}
                src={`https://www.youtube.com/embed/${active.youtubeId}?rel=0&modestbranding=1&autoplay=0&cc_load_policy=1`}
                title={active.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>

            {/* Player info bar */}
            <div style={{ padding: '14px 20px', background: '#1A1A2E', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ padding: '3px 10px', borderRadius: 6, background: active.tagColor + '30', color: active.tagColor, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{active.tag}</span>
                <span style={{ fontSize: 12, color: '#888', marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4 }}><ClockIcon />{active.duration}</span>
                <span style={{ fontSize: 12, color: '#888', marginLeft: 6, display: 'flex', alignItems: 'center', gap: 4 }}><EyeIcon />{active.views} views</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={`https://www.youtube.com/watch?v=${active.youtubeId}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, background: '#FF000022', color: '#FF6060', fontSize: 12, fontWeight: 600, border: '1px solid #FF000033' }}>
                  <ExternalLink /> YouTube
                </a>
              </div>
            </div>
          </div>

          {/* Video title & actions */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{active.title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary-text)' }}>{active.author}</span>
                  <span>·</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ClockIcon />{active.duration}</span>
                  <span>·</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><EyeIcon />{active.views} views</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <BookmarkIcon /> Save
                </button>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <ShareIcon /> Share
                </button>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{active.description}</p>
          </div>

          {/* Chapters */}
          {active.chapters && active.chapters.length > 0 && (
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              <button
                onClick={() => setShowChapters((v) => !v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                  <ListIcon /> Chapters ({active.chapters.length})
                </div>
                <span style={{ color: 'var(--text-secondary)', transform: showChapters ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                  <ChevronRight />
                </span>
              </button>

              {showChapters && (
                <div style={{ borderTop: '1px solid var(--border)' }}>
                  {active.chapters.map((ch, i) => (
                    <div
                      key={i}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 24px', borderBottom: i < active.chapters!.length - 1 ? '1px solid var(--border)' : 'none' }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: active.tagColor + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: active.tagColor }}>{String(i + 1).padStart(2, '0')}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{ch.label}</div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: active.tagColor, background: active.tagColor + '12', padding: '3px 8px', borderRadius: 6 }}>{ch.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quiz CTA */}
          <div style={{ marginTop: 20, background: 'var(--primary-light)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>📝</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>Ready to test your knowledge?</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Take the {active.tag} practice quiz to reinforce what you've learned.</div>
            </div>
            <Link
              href="/dashboard/quizzes"
              style={{ padding: '10px 20px', borderRadius: 'var(--radius)', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <PlayFill /> Practice Quiz
            </Link>
          </div>
        </div>

        {/* ── Right: Playlist ── */}
        <div>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', position: 'sticky', top: 20 }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Up Next</div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{PLAYLIST.length} videos</span>
            </div>

            {/* Playlist items */}
            <div>
              {PLAYLIST.map((video, idx) => {
                const isActive = video.id === activeId;
                return (
                  <button
                    key={video.id}
                    onClick={() => setActiveId(video.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%',
                      padding: '14px 20px', background: isActive ? active.tagColor + '0F' : 'transparent',
                      border: 'none', borderBottom: idx < PLAYLIST.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                      borderLeft: isActive ? `3px solid ${video.tagColor}` : '3px solid transparent',
                    }}
                  >
                    {/* Real YouTube thumbnail with gradient fallback */}
                    <div style={{ width: 80, height: 52, borderRadius: 6, background: video.tagColor + '18', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                      <img
                        src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                        alt={video.title}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
                      />
                      {isActive && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PlayCircle size={26} color="#fff" />
                        </div>
                      )}
                      {/* Duration badge */}
                      <div style={{ position: 'absolute', bottom: 3, right: 4, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3, zIndex: 1 }}>{video.duration}</div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ padding: '2px 7px', borderRadius: 4, background: video.tagColor + '18', color: video.tagColor, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3, flexShrink: 0 }}>{video.tag}</span>
                        {isActive && <span style={{ fontSize: 10, fontWeight: 700, color: video.tagColor }}>● Now Playing</span>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--text)' : 'var(--text)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{video.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{video.author}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Videos sourced from official AWS channels
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
