/**
 * ingest-cert-guides.mjs — convert cloud-certification-exam-prep study guides
 * (MLA-C01 ML, SAP-C02 Solutions Architect Pro) into in-app learning-path
 * content: MODULE_NOTES entries + LEARNING_PATHS definitions.
 *
 * One-time/repeatable generation → writes generated TS into web + mobile so the
 * paths render natively (reading notes) with no dead screens. Re-run when the
 * source guides change.
 *
 *   node scripts/ingest-cert-guides.mjs
 */
import fs from 'fs';
import path from 'path';

const REPO = process.env.EXAMPREP_DIR
  || '/private/tmp/claude-501/-Users-schinchli/34c5a797-d9a6-4047-b8da-cf9c996d7bce/scratchpad/examprep/AWS';

const wordCount = (s) => (s.match(/\S+/g) || []).length;
const readingMin = (text) => Math.max(3, Math.min(30, Math.round(wordCount(text) / 200)));
const clean = (s) => s.replace(/`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');

/** Split a markdown blob into NoteSections (by ## / ### headings). */
function toSections(md) {
  const out = [];
  let cur = null;
  const flush = () => {
    if (!cur) return;
    const body = cur.bodyLines.join('\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 1400);
    const kp = cur.keyPoints.slice(0, 8);
    if (body || kp.length) out.push({ heading: cur.heading.slice(0, 90), body, keyPoints: kp });
    cur = null;
  };
  for (const raw of md.split('\n')) {
    const h = raw.match(/^#{2,4}\s+(.+)/);
    if (h) { flush(); cur = { heading: clean(h[1]), bodyLines: [], keyPoints: [] }; continue; }
    if (!cur) cur = { heading: 'Overview', bodyLines: [], keyPoints: [] };
    if (/^\s*```/.test(raw)) continue; // drop code-fence markers
    const b = raw.match(/^\s*[-*]\s+(.+)/);
    if (b) cur.keyPoints.push(clean(b[1]).slice(0, 180));
    else if (raw.trim() && !/^#\s/.test(raw)) cur.bodyLines.push(clean(raw));
    else if (!raw.trim()) cur.bodyLines.push('');
  }
  flush();
  return out.filter((s) => (s.body && s.body.length > 40) || s.keyPoints.length).slice(0, 8);
}

function moduleNotes(moduleId, title, subtitle, md, examTips) {
  const sections = toSections(md);
  const introPara = md.split('\n\n').find((p) => {
    const t = p.trim();
    return t && !t.startsWith('#') && !/^[-=*_\s]{3,}$/.test(t) && !/^\s*[-*]\s/.test(t)
      && !/[{}`]|"\s*:|```/.test(t) && /[a-z]/.test(t) && wordCount(t) > 8;
  });
  const intro = clean(introPara || subtitle).slice(0, 400);
  return {
    moduleId, title, subtitle,
    readingMinutes: readingMin(md),
    intro,
    sections,
    examTips: examTips.slice(0, 6),
  };
}

// ── MLA-C01 (single guide, split by ## into modules) ─────────────────────────
function buildMLA() {
  const file = path.join(REPO, 'MLS-C01-ML-Specialty', 'AWS_ML_Associate_Study_Guide.md');
  const text = fs.readFileSync(file, 'utf8');
  const blocks = text.split(/\n(?=## )/);
  const skip = /table of contents|study resources|exam experience/i;
  const tips = (blocks.find((b) => /exam experience|tips/i.test(b)) || '')
    .split('\n').filter((l) => /^\s*[-*]/.test(l)).map((l) => clean(l.replace(/^\s*[-*]\s*/, ''))).slice(0, 6);
  const notes = {}; const steps = [];
  let i = 0;
  for (const b of blocks) {
    const title = clean((b.match(/^##\s+(.+)/) || [])[1] || '');
    if (!title || skip.test(title)) continue;
    i += 1;
    const id = `mla-m${String(i).padStart(2, '0')}`;
    notes[id] = moduleNotes(id, `ML M${i}: ${title}`, `AWS Certified Machine Learning — ${title}`, b, tips.length ? tips : ['Focus on SageMaker built-in algorithms and when to use each.']);
    steps.push({ id: `${id}-notes`, type: 'notes', resourceId: id, title: `Read: ${title}` });
  }
  const pathObj = {
    id: 'mla-c01', certCode: 'MLA-C01', certName: 'AWS Machine Learning Associate',
    tagline: 'Data engineering, model training, deployment and MLOps on Amazon SageMaker — MLA-C01 study path.',
    difficulty: 'Intermediate', totalHours: 10, color: '#01A88D', steps,
  };
  return { notes, pathObj };
}

// ── SAP-C02 (folder-per-domain; concat topic .md files) ──────────────────────
function buildSAP() {
  const root = path.join(REPO, 'SAP-C02');
  const domains = fs.readdirSync(root).filter((d) => /^\d\d-/.test(d)).sort();
  const notes = {}; const steps = [];
  for (const dir of domains) {
    const dpath = path.join(root, dir);
    const mds = fs.readdirSync(dpath).filter((f) => f.endsWith('.md'));
    if (!mds.length) continue;
    const md = mds.map((f) => fs.readFileSync(path.join(dpath, f), 'utf8')).join('\n\n');
    const label = dir.replace(/^\d\d-/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const num = dir.slice(0, 2);
    const id = `sap-${num}`;
    notes[id] = moduleNotes(id, `SAP ${num}: ${label}`, `AWS Solutions Architect Professional — ${label}`, md,
      ['Think multi-account, cross-Region, and cost at scale — SAP favours the most operationally efficient design.']);
    steps.push({ id: `${id}-notes`, type: 'notes', resourceId: id, title: `Read: ${label}` });
  }
  const pathObj = {
    id: 'sap-c02', certCode: 'SAP-C02', certName: 'AWS Solutions Architect Professional',
    tagline: 'Sixteen domains — accounts, networking, migrations, disaster recovery, and cost control — for the SAP-C02 professional exam.',
    difficulty: 'Advanced', totalHours: 24, color: '#C925D1', steps,
  };
  return { notes, pathObj };
}

// ── Emit TS ──────────────────────────────────────────────────────────────────
function serialiseNotes(map) {
  const entries = Object.entries(map).map(([k, n]) => {
    const secs = n.sections.map((s) =>
      `      { heading: '${esc(s.heading)}', body: '${esc(s.body)}'` +
      (s.keyPoints.length ? `, keyPoints: [${s.keyPoints.map((p) => `'${esc(p)}'`).join(', ')}]` : '') + ` }`,
    ).join(',\n');
    const tips = n.examTips.map((t) => `'${esc(t)}'`).join(', ');
    return `  '${k}': {\n    moduleId: '${k}', title: '${esc(n.title)}', subtitle: '${esc(n.subtitle)}',\n` +
      `    readingMinutes: ${n.readingMinutes},\n    intro: '${esc(n.intro)}',\n    sections: [\n${secs}\n    ],\n    examTips: [${tips}],\n  }`;
  }).join(',\n');
  return entries;
}

function serialisePath(p) {
  const steps = p.steps.map((s) => `      { id: '${s.id}', type: '${s.type}', resourceId: '${s.resourceId}', title: '${esc(s.title)}', subtitle: '', estimatedMinutes: 12, icon: 'book-open', why: 'Core exam-guide reading.' }`).join(',\n');
  return `  {\n    id: '${p.id}', certCode: '${p.certCode}', certName: '${esc(p.certName)}',\n    tagline: '${esc(p.tagline)}',\n    difficulty: '${p.difficulty}', totalHours: ${p.totalHours}, color: '${p.color}',\n    steps: [\n${steps}\n    ],\n  }`;
}

const mla = buildMLA();
const sap = buildSAP();
const allNotes = { ...mla.notes, ...sap.notes };

const header = `/* AUTO-GENERATED by scripts/ingest-cert-guides.mjs — do not edit by hand.\n   Source: cloud-certification-exam-prep (MLA-C01, SAP-C02). Re-run to refresh. */\n`;
const notesTs = `${header}import type { ModuleNotes } from './moduleNotes';\n\nexport const INGESTED_MODULE_NOTES: Record<string, ModuleNotes> = {\n${serialiseNotes(allNotes)}\n};\n`;
const pathsTs = `${header}import type { LearningPath } from './learningPaths';\n\nexport const INGESTED_PATHS: LearningPath[] = [\n${serialisePath(mla.pathObj)},\n${serialisePath(sap.pathObj)},\n];\n`;

for (const base of ['apps/web/src/data', 'mobile/data']) {
  const dir = path.join(process.cwd(), base);
  fs.writeFileSync(path.join(dir, 'ingestedCertNotes.ts'), notesTs);
  fs.writeFileSync(path.join(dir, 'ingestedCertPaths.ts'), pathsTs);
}

console.log(`✅ Ingested: MLA (${Object.keys(mla.notes).length} modules) + SAP (${Object.keys(sap.notes).length} modules) → ${Object.keys(allNotes).length} note sets, 2 paths. Written to web + mobile.`);
