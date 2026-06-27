#!/usr/bin/env node
/**
 * graph-query.mjs — token-lean lookups against the Understand-Anything knowledge graph.
 *
 * The graph (.understand-anything/knowledge-graph.json) holds a summarized map of the
 * whole monorepo: every file/function/table as a node, every import/call/contains/etc as
 * an edge, grouped into architectural layers with a guided tour. Querying it costs a few
 * hundred tokens; reading the equivalent source costs tens of thousands. ALWAYS reach for
 * this before Grep/Glob/Read when you need to navigate, understand structure, or trace
 * dependencies. Reads stay accurate via incremental `/understand` updates.
 *
 * Usage (run from repo root, no install needed):
 *   node scripts/graph-query.mjs stats
 *   node scripts/graph-query.mjs find <substring>        # nodes whose id/name/summary match
 *   node scripts/graph-query.mjs file <path-substring>   # a file's summary + what it contains/imports + who imports it
 *   node scripts/graph-query.mjs deps <path-substring>   # incoming + outgoing edges for a node
 *   node scripts/graph-query.mjs layer [name]            # list layers, or files in one layer
 *   node scripts/graph-query.mjs tour                    # the guided tour (best reading order)
 *   node scripts/graph-query.mjs orphans                 # nodes with no edges
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GRAPH = join(ROOT, '.understand-anything', 'knowledge-graph.json');

let g;
try {
  g = JSON.parse(readFileSync(GRAPH, 'utf8'));
} catch {
  console.error(`No knowledge graph at ${GRAPH}\nRun /understand to (re)build it.`);
  process.exit(1);
}

const nodes = g.nodes || [];
const edges = g.edges || [];
const byId = new Map(nodes.map((n) => [n.id, n]));
const lc = (s) => (s || '').toLowerCase();
const short = (n) => `[${n.type}] ${n.id}`;
const argRest = process.argv.slice(3).join(' ');

const cmd = process.argv[2];
switch (cmd) {
  case 'stats': {
    const byType = (arr, k) => arr.reduce((a, x) => ((a[x[k]] = (a[x[k]] || 0) + 1), a), {});
    console.log(`project : ${g.project?.name} — ${g.project?.description || ''}`);
    console.log(`commit  : ${(g.project?.gitCommitHash || '').slice(0, 10)}  analyzedAt ${g.project?.analyzedAt || '?'}`);
    console.log(`nodes   : ${nodes.length}`, byType(nodes, 'type'));
    console.log(`edges   : ${edges.length}`, byType(edges, 'type'));
    console.log(`layers  : ${(g.layers || []).length}  |  tour steps: ${(g.tour || []).length}`);
    break;
  }
  case 'find': {
    if (!argRest) { usage(); break; }
    const q = lc(argRest);
    const hits = nodes.filter((n) => lc(n.id).includes(q) || lc(n.name).includes(q) || lc(n.summary).includes(q));
    if (!hits.length) console.log('no matches');
    for (const n of hits.slice(0, 40)) console.log(`${short(n)}\n    ${n.summary || ''}`);
    if (hits.length > 40) console.log(`… +${hits.length - 40} more`);
    break;
  }
  case 'file': {
    if (!argRest) { usage(); break; }
    const q = lc(argRest);
    const fileTypes = new Set(['file', 'config', 'document', 'service', 'pipeline', 'table', 'schema', 'resource', 'endpoint']);
    const targets = nodes.filter((n) => fileTypes.has(n.type) && lc(n.id).includes(q));
    if (!targets.length) { console.log('no file-level node matches'); break; }
    for (const n of targets.slice(0, 10)) {
      console.log(`\n${short(n)}`);
      console.log(`  summary : ${n.summary || ''}`);
      if (n.tags?.length) console.log(`  tags    : ${n.tags.join(', ')}`);
      const out = edges.filter((e) => e.source === n.id);
      const inc = edges.filter((e) => e.target === n.id);
      const fmt = (e, dir) => `    ${e.type} ${dir} ${dir === '→' ? e.target : e.source}`;
      if (out.length) console.log('  outgoing:'), out.slice(0, 25).forEach((e) => console.log(fmt(e, '→')));
      if (inc.length) console.log('  incoming:'), inc.slice(0, 25).forEach((e) => console.log(fmt(e, '←')));
    }
    break;
  }
  case 'deps': {
    if (!argRest) { usage(); break; }
    const q = lc(argRest);
    const ns = nodes.filter((n) => lc(n.id).includes(q));
    for (const n of ns.slice(0, 10)) {
      console.log(`\n${short(n)}`);
      edges.filter((e) => e.source === n.id).forEach((e) => console.log(`  → ${e.type}: ${e.target}`));
      edges.filter((e) => e.target === n.id).forEach((e) => console.log(`  ← ${e.type}: ${e.source}`));
    }
    break;
  }
  case 'layer': {
    const layers = g.layers || [];
    if (!argRest) {
      for (const l of layers) console.log(`${l.name}  (${(l.nodeIds || []).length})  — ${l.description || ''}`);
      break;
    }
    const q = lc(argRest);
    const l = layers.find((x) => lc(x.name).includes(q) || lc(x.id).includes(q));
    if (!l) { console.log('no layer matches'); break; }
    console.log(`${l.name} — ${l.description || ''}`);
    for (const id of l.nodeIds || []) {
      const n = byId.get(id);
      console.log(`  ${id}${n?.summary ? '  — ' + n.summary : ''}`);
    }
    break;
  }
  case 'tour': {
    for (const s of g.tour || []) {
      console.log(`\n${s.order}. ${s.title}`);
      console.log(`   ${s.description || ''}`);
      (s.nodeIds || []).forEach((id) => console.log(`   · ${id}`));
    }
    break;
  }
  case 'orphans': {
    const withEdges = new Set([...edges.map((e) => e.source), ...edges.map((e) => e.target)]);
    const orphs = nodes.filter((n) => !withEdges.has(n.id));
    console.log(`${orphs.length} orphan node(s):`);
    orphs.forEach((n) => console.log(`  ${short(n)}`));
    break;
  }
  default:
    usage();
}

function usage() {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(11, 24).join('\n').replace(/^ \* ?/gm, ''));
  process.exit(cmd ? 1 : 0);
}
