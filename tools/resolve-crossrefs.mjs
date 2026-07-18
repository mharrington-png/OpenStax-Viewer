#!/usr/bin/env node
/**
 * resolve-crossrefs.mjs — patches the `<!--xref target-id="X" document="mNNNNN"-->(see
 * original)` placeholders that build-section.mjs emits for cross-module <link> refs (most
 * commonly "Be Prepared" quiz items pointing back at an earlier section's worked example).
 * build-section.mjs renders one module at a time and has no numbering map for any OTHER
 * module, so it can't resolve these itself — this script fetches each referenced module,
 * re-derives its figure/table/example/equation/note numbering (same rules as
 * build-section.mjs's collectIds pre-pass), and rewrites the placeholder into a real
 * cross-file link, e.g. <a href="1-5.html#example3">Example 3</a>.
 *
 * Usage: node tools/resolve-crossrefs.mjs --book=intermediate-algebra-2e
 *
 * Requires a moduleMap (CNXML module id -> section slug) for the book, passed inline below —
 * add one per book as this expands beyond Intermediate Algebra 2e.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const args = process.argv.slice(2);
const bookId = (args.find(a => a.startsWith("--book=")) || "").slice(7) || "intermediate-algebra-2e";

const BOOKS = {
  "intermediate-algebra-2e": {
    repo: "osbooks-prealgebra-bundle",
    sectionsDir: "sections/intermediate-algebra-2e",
    moduleMap: {
      m81422: "1-1", m81423: "1-2", m81359: "1-3", m81425: "1-4", m81360: "1-5",
      m81362: "2-1", m81363: "2-2", m81364: "2-3", m81365: "2-4", m81366: "2-5", m81367: "2-6", m81426: "2-7",
      m81369: "3-1", m81370: "3-2", m81371: "3-3", m81372: "3-4", m81373: "3-5", m81374: "3-6",
      m81427: "4-1", m81380: "4-2", m81381: "4-3", m81428: "4-4", m81429: "4-5", m81431: "4-6", m81432: "4-7",
      m81383: "5-1", m81384: "5-2", m81385: "5-3", m81386: "5-4",
      m81437: "6-1", m81387: "6-2", m81388: "6-3", m81389: "6-4", m81390: "6-5",
      m81392: "7-1", m81439: "7-2", m81440: "7-3", m81393: "7-4", m81394: "7-5", m81441: "7-6",
      m81444: "8-1", m81445: "8-2", m81396: "8-3", m81397: "8-4", m81446: "8-5", m81398: "8-6", m81447: "8-7", m81448: "8-8",
      m81400: "9-1", m81401: "9-2", m81449: "9-3", m81402: "9-4", m81403: "9-5", m81404: "9-6", m81405: "9-7", m81406: "9-8",
    },
  },
};
const book = BOOKS[bookId];
if (!book) { console.error(`Unknown --book "${bookId}"`); process.exit(1); }

/* ---- minimal CNXML parser, copied from build-section.mjs ---- */
function parseXML(s) {
  let i = 0;
  function node(tag) { return { tag, attrs: {}, children: [] }; }
  function parseAttrs(str, n) {
    const re = /([\w:-]+)\s*=\s*"([^"]*)"/g; let m;
    while ((m = re.exec(str))) n.attrs[m[1].replace(/^\w+:/, "")] = m[2];
  }
  function walk() {
    const out = [];
    while (i < s.length) {
      if (s[i] === "<") {
        if (s.startsWith("<!--", i)) { i = s.indexOf("-->", i) + 3; continue; }
        if (s.startsWith("<?", i)) { i = s.indexOf("?>", i) + 2; continue; }
        if (s.startsWith("</", i)) { i = s.indexOf(">", i) + 1; return out; }
        const end = s.indexOf(">", i);
        const raw = s.slice(i + 1, end);
        const selfClose = raw.endsWith("/");
        const body = selfClose ? raw.slice(0, -1) : raw;
        const sp = body.search(/[\s]/);
        const tag = (sp === -1 ? body : body.slice(0, sp)).replace(/^\w+:/, "");
        const n = node(tag);
        if (sp !== -1) parseAttrs(body.slice(sp), n);
        i = end + 1;
        if (!selfClose) n.children = walk();
        out.push(n);
      } else {
        const next = s.indexOf("<", i);
        i = next === -1 ? s.length : next;
      }
    }
    return out;
  }
  return { tag: "#root", attrs: {}, children: walk() };
}
function q(n, tag) { return (n.children || []).find(c => c.tag === tag); }
function textOf(n) {
  if (!n) return "";
  let out = "";
  for (const c of n.children || []) out += c.tag === "#text" ? "" : textOf(c);
  return out;
}
// inline-ish text extraction good enough for note titles (no math expected there)
function plainText(n) {
  let out = "";
  (function walk(x) {
    for (const c of x.children || []) {
      if (c.tag === "#text") continue;
      if (c.tag === "title") continue;
      walk(c);
    }
  })(n);
  return out;
}

/* ---- numbering pre-pass, mirrors build-section.mjs's collectIds ---- */
function numberModule(root) {
  const doc = q(root, "document");
  const figIdMap = new Map(), tabIdMap = new Map(), exampleIdMap = new Map(), eqIdMap = new Map(), noteIdMap = new Map();
  (function collectIds(n, ctx = {}) {
    for (const c of n.children || []) {
      if (c.tag === "figure" && c.attrs.id) figIdMap.set(c.attrs.id, figIdMap.size + 1);
      if (c.tag === "table" && c.attrs.id) tabIdMap.set(c.attrs.id, tabIdMap.size + 1);
      if (c.tag === "example" && !ctx.inCoreq && c.attrs.id) exampleIdMap.set(c.attrs.id, exampleIdMap.size + 1);
      if (c.tag === "equation" && c.attrs.id) eqIdMap.set(c.attrs.id, eqIdMap.size + 1);
      if (c.tag === "note" && c.attrs.id) { const t = q(c, "title"); if (t) noteIdMap.set(c.attrs.id, plainText(t) || textOf(t)); }
      const childCtx = (c.tag === "section" && /coreq/.test(c.attrs.class || "")) ? { ...ctx, inCoreq: true } : ctx;
      collectIds(c, childCtx);
    }
  })(doc);
  return { figIdMap, tabIdMap, exampleIdMap, eqIdMap, noteIdMap };
}

const moduleCache = new Map(); // moduleId -> numbering maps (or null if fetch failed)
async function resolveTarget(moduleId, targetId) {
  if (!moduleCache.has(moduleId)) {
    const url = `https://raw.githubusercontent.com/openstax/${book.repo}/main/modules/${moduleId}/index.cnxml`;
    try {
      const text = await (await fetch(url)).text();
      moduleCache.set(moduleId, numberModule(parseXML(text)));
    } catch (e) {
      console.warn(`  ! failed to fetch ${moduleId}: ${e.message}`);
      moduleCache.set(moduleId, null);
    }
  }
  const maps = moduleCache.get(moduleId);
  if (!maps) return null;
  const slug = book.moduleMap[moduleId];
  if (!slug) { console.warn(`  ! module ${moduleId} not in moduleMap (out of scope?)`); return null; }
  if (maps.figIdMap.has(targetId)) return { href: `${slug}.html#fig${maps.figIdMap.get(targetId)}`, label: `Figure ${maps.figIdMap.get(targetId)}` };
  if (maps.tabIdMap.has(targetId)) return { href: `${slug}.html#tab${maps.tabIdMap.get(targetId)}`, label: `Table ${maps.tabIdMap.get(targetId)}` };
  if (maps.exampleIdMap.has(targetId)) return { href: `${slug}.html#example${maps.exampleIdMap.get(targetId)}`, label: `Example ${maps.exampleIdMap.get(targetId)}` };
  if (maps.eqIdMap.has(targetId)) return { href: `${slug}.html#eq${maps.eqIdMap.get(targetId)}`, label: `Equation ${maps.eqIdMap.get(targetId)}` };
  if (maps.noteIdMap.has(targetId)) return { href: `${slug}.html#${targetId}`, label: maps.noteIdMap.get(targetId) };
  return null;
}

const dir = book.sectionsDir;
const files = readdirSync(dir).filter(f => f.endsWith(".html"));
const xrefRe = /<!--xref target-id="([^"]*)" document="([^"]*)"-->\(see original\)/g;
let totalFixed = 0, totalUnresolved = 0;
for (const f of files) {
  const path = `${dir}/${f}`;
  let html = readFileSync(path, "utf8");
  const matches = [...html.matchAll(xrefRe)];
  if (!matches.length) continue;
  let changed = false;
  for (const m of matches) {
    const [full, tid, doc] = m;
    if (!doc) { console.warn(`${f}: xref with no document attr (target-id=${tid}) — leaving for hand-fix`); totalUnresolved++; continue; }
    const resolved = await resolveTarget(doc, tid);
    if (resolved) {
      html = html.replace(full, `<a href="${resolved.href}">${resolved.label}</a>`);
      changed = true;
      totalFixed++;
    } else {
      console.warn(`${f}: could not resolve target-id="${tid}" in ${doc} — leaving for hand-fix`);
      totalUnresolved++;
    }
  }
  if (changed) writeFileSync(path, html);
}
console.log(`\nCross-reference resolution for "${bookId}": ${totalFixed} fixed, ${totalUnresolved} left unresolved.`);
