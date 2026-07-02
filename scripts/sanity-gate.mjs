#!/usr/bin/env node
/**
 * Katalyst LMS — Sanity Gate
 * ==========================
 * Deterministic, zero-token local verification that must PASS before any
 * change is declared "done". Born from real slip-ups:
 *
 *   1. Featured Articles linked to a dead web route (/resources/... → 404)
 *   2. Cert badge deep-link opened the UNFILTERED quiz list
 *   3. One cert badge used different (non-Credly) artwork than the others
 *   4. playwright-* test quizzes leaked into the public catalogue
 *   5. A web test suite silently failed to parse for weeks (ESM dep)
 *   6. Mobile referenced remote images that must exist in web /public
 *
 * Usage:
 *   node scripts/sanity-gate.mjs            # static checks + tsc + jest
 *   node scripts/sanity-gate.mjs --fast     # skip tsc + jest (contracts only)
 *   node scripts/sanity-gate.mjs --live     # also verify production endpoints
 *
 * Exit code 0 = ✅ GO.  Non-zero = ❌ NO-GO (fix before declaring done).
 */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT   = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const WEB    = join(ROOT, 'apps/web');
const MOBILE = join(ROOT, 'mobile');
const PROD   = 'https://lms-amber-two.vercel.app';

const FAST = process.argv.includes('--fast');
const LIVE = process.argv.includes('--live');

const results = [];
function check(name, fn) {
  process.stdout.write(`• ${name} ... `);
  try {
    const detail = fn();
    results.push({ name, ok: true });
    console.log(`PASS${detail ? ` (${detail})` : ''}`);
  } catch (err) {
    results.push({ name, ok: false, err: String(err.message ?? err).slice(0, 400) });
    console.log(`FAIL\n    ↳ ${String(err.message ?? err).slice(0, 400)}`);
  }
}
const sh = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

// ── helpers ───────────────────────────────────────────────────────────────────

function* walk(dir, exts) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) yield* walk(p, exts);
    else if (exts.some((e) => p.endsWith(e))) yield p;
  }
}

/** Available expo-router routes from mobile/app file layout → segment patterns. */
function mobileRoutePatterns() {
  const appDir = join(MOBILE, 'app');
  const patterns = [];
  for (const file of walk(appDir, ['.tsx'])) {
    const rel = relative(appDir, file).replace(/\.tsx$/, '');
    if (rel.endsWith('_layout') || rel.startsWith('+')) continue;
    const segs = rel.split('/').filter((s) => s !== 'index');
    patterns.push(segs);
    // group segments "(tabs)" are optional in hrefs — add stripped variant
    if (segs.some((s) => s.startsWith('('))) patterns.push(segs.filter((s) => !s.startsWith('(')));
  }
  return patterns;
}

function routeMatches(target, patterns) {
  const tsegs = target.split('/').filter(Boolean);
  return patterns.some((p) => {
    if (p.length !== tsegs.length) return false;
    return p.every((seg, i) => seg.startsWith('[') || seg === tsegs[i] || tsegs[i] === '*');
  });
}

/** All route string literals pushed anywhere in mobile code. */
function referencedMobileRoutes() {
  const refs = new Set();
  const dirs = ['app', 'components', 'constants', 'stores', 'utils'].map((d) => join(MOBILE, d));
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const file of walk(dir, ['.ts', '.tsx'])) {
      const src = readFileSync(file, 'utf8');
      for (const m of src.matchAll(/(?:router\.(?:push|replace|navigate)\(|pathname:\s*)(['"`])(\/[^'"`\s]*)\1/g)) {
        refs.add(m[2].replace(/\$\{[^}]*\}/g, '*'));
      }
      for (const m of src.matchAll(/router\.(?:push|replace)\(`(\/[^`]*)`/g)) {
        refs.add(m[1].replace(/\$\{[^}]*\}/g, '*'));
      }
    }
  }
  return [...refs];
}

// ── 1. Mobile route contract — no dead in-app links ──────────────────────────
check('mobile route contract (every router.push target exists)', () => {
  const patterns = mobileRoutePatterns();
  const dead = referencedMobileRoutes().filter((r) => !routeMatches(r, patterns));
  if (dead.length) throw new Error(`dead routes: ${dead.join(', ')}`);
  return `${referencedMobileRoutes().length} refs`;
});

// ── 2. Web route contract — mobile→web URLs point at real routes ─────────────
check('web route contract (mobile web-links resolve)', () => {
  const contracts = [
    // [mobile file, path regex it must reference, web route dir that must exist]
    ['services/articlesService.ts', /\/dashboard\/learn\//, 'src/app/dashboard/learn/[slug]'],
    ['services/articlesService.ts', /\/api\/articles\//, 'src/app/api/articles/[slug]'],
    ['components/QuizReviews.tsx', /\/api\/quiz-reviews\//, 'src/app/api/quiz-reviews/[id]'],
  ];
  const missing = [];
  for (const [mfile, pattern, webRoute] of contracts) {
    const src = readFileSync(join(MOBILE, mfile), 'utf8');
    if (!pattern.test(src)) missing.push(`${mfile} no longer references ${pattern}`);
    if (!existsSync(join(WEB, webRoute))) missing.push(`web route missing: ${webRoute}`);
  }
  // The known-dead route must never come back
  for (const file of walk(join(MOBILE, 'services'), ['.ts'])) {
    if (/\/resources\/\$\{/.test(readFileSync(file, 'utf8'))) missing.push(`${file} links dead /resources/ route`);
  }
  if (missing.length) throw new Error(missing.join(' | '));
  return `${contracts.length} contracts`;
});

// ── 3. Remote asset contract — every mobile remote image exists in web/public ─
check('remote asset contract (noteDiagrams + cert badges)', () => {
  const missing = [];
  const nd = readFileSync(join(MOBILE, 'constants/noteDiagrams.ts'), 'utf8');
  for (const m of nd.matchAll(/remote\('([^']+)'\)/g)) {
    if (!existsSync(join(WEB, 'public', m[1]))) missing.push(m[1]);
  }
  const badges = readFileSync(join(MOBILE, 'constants/awsCertBadges.ts'), 'utf8');
  for (const m of badges.matchAll(/badge\('([^']+)'\)/g)) {
    if (!existsSync(join(WEB, 'public/aws-certs', m[1]))) missing.push(`aws-certs/${m[1]}`);
  }
  if (missing.length) throw new Error(`missing in web /public: ${missing.join(', ')}`);
});

// ── 4. Badge art consistency — uniform official set ──────────────────────────
check('cert badge consistency (12 square PNGs, one per catalog entry)', () => {
  const dir = join(WEB, 'public/aws-certs');
  const files = readdirSync(dir).filter((f) => f.endsWith('.png'));
  const catalog = readFileSync(join(MOBILE, 'constants/awsCertBadges.ts'), 'utf8');
  const wanted = [...catalog.matchAll(/badge\('([^']+)'\)/g)].map((m) => m[1]);
  if (files.length !== wanted.length) throw new Error(`${files.length} files vs ${wanted.length} catalog entries`);
  for (const f of files) {
    const buf = readFileSync(join(dir, f));
    if (buf.subarray(1, 4).toString() !== 'PNG') throw new Error(`${f} is not a PNG`);
    const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
    if (w !== h) throw new Error(`${f} is not square (${w}x${h}) — mixed badge art?`);
  }
  return `${files.length} badges`;
});

// ── 5. Internal test content stays hidden — BOTH layers ──────────────────────
check('internal quiz filters present (web API + mobile merge)', () => {
  const webRoute = readFileSync(join(WEB, 'src/app/api/quiz-content/route.ts'), 'utf8');
  if (!/playwright-/.test(webRoute) || !/questions/.test(webRoute)) {
    throw new Error('web quiz-content route no longer filters playwright-* from quizzes AND questions');
  }
  const merge = readFileSync(join(MOBILE, 'config/managedQuizContent.ts'), 'utf8');
  if (!/isInternalQuiz|playwright-/.test(merge)) {
    throw new Error('mobile managedQuizContent merge no longer filters internal quizzes');
  }
});

// ── 6. Exam-guide grounding intact ────────────────────────────────────────────
check('exam guides present (12 certs, used by resourceCatalog)', () => {
  const guides = readFileSync(join(WEB, 'src/data/examGuides.ts'), 'utf8');
  const count = [...guides.matchAll(/code: '[A-Z]{3}-C\d{2}'/g)].length;
  if (count !== 12) throw new Error(`expected 12 exam guides, found ${count}`);
  if (!/examGuideText/.test(readFileSync(join(WEB, 'src/lib/resourceCatalog.ts'), 'utf8'))) {
    throw new Error('resourceCatalog no longer grounds embeddings in exam guides');
  }
});

// ── 7/8. Type checks ──────────────────────────────────────────────────────────
if (!FAST) {
  check('tsc — apps/web', () => { sh('npx tsc --noEmit', WEB); });
  check('tsc — mobile', () => { sh('npx tsc --noEmit', MOBILE); });

  // ── 9/10. Test suites — a suite that fails to PARSE is a failure too ───────
  const jestCheck = (cwd) => () => {
    const out = stripAnsi(sh('npx jest --silent 2>&1 || true', cwd));
    const suites = out.match(/Test Suites:[^\n]*/)?.[0] ?? '';
    const m = suites.match(/(\d+) passed, (\d+) total/);
    // A suite that fails to PARSE counts as failed — that class of breakage
    // sat undetected for weeks once. All suites must run AND pass.
    if (!m || m[1] !== m[2] || /failed/.test(suites)) {
      throw new Error(suites || 'could not parse jest output');
    }
    return out.match(/Tests:[^\n]*/)?.[0]?.trim();
  };
  check('jest — apps/web (all suites run and pass)', jestCheck(WEB));
  check('jest — mobile (all suites run and pass)', jestCheck(MOBILE));
}

// ── 11+. Live production contracts (--live) ───────────────────────────────────
if (LIVE) {
  const get = async (path) => {
    const res = await fetch(`${PROD}${path}`, { signal: AbortSignal.timeout(15000) });
    return res;
  };
  await (async () => {
    check.constructor; // noop to keep structure
  })();

  const liveChecks = [
    ['live: no playwright content in public catalogue', async () => {
      const body = await (await get('/api/quiz-content')).text();
      if (body.toLowerCase().includes('playwright')) throw new Error('playwright-* leaked in /api/quiz-content');
    }],
    ['live: articles API serves list', async () => {
      const d = await (await get('/api/articles?limit=1')).json();
      if (!d.ok) throw new Error('articles API not ok');
    }],
    ['live: quiz reviews GET ok', async () => {
      const d = await (await get('/api/quiz-reviews/clf-c02-full-exam')).json();
      if (!d.ok) throw new Error('quiz-reviews API not ok');
    }],
    ['live: cert badge served', async () => {
      const r = await get('/aws-certs/clf-c02.png');
      if (r.status !== 200) throw new Error(`badge HTTP ${r.status}`);
    }],
    ['live: sample note diagram served', async () => {
      const r = await get('/sec-eng-aws/notes/m01-data-flow-diagram.png');
      if (r.status !== 200) throw new Error(`diagram HTTP ${r.status}`);
    }],
  ];
  for (const [name, fn] of liveChecks) {
    process.stdout.write(`• ${name} ... `);
    try {
      await fn();
      results.push({ name, ok: true });
      console.log('PASS');
    } catch (err) {
      results.push({ name, ok: false, err: String(err.message ?? err) });
      console.log(`FAIL\n    ↳ ${String(err.message ?? err).slice(0, 300)}`);
    }
  }
}

// ── Verdict ───────────────────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok);
console.log('\n' + '─'.repeat(60));
if (failed.length === 0) {
  console.log(`✅ GO — ${results.length}/${results.length} sanity checks passed. Safe to declare done.`);
  process.exit(0);
} else {
  console.log(`❌ NO-GO — ${failed.length}/${results.length} checks failed:`);
  for (const f of failed) console.log(`   ✗ ${f.name}`);
  process.exit(1);
}
