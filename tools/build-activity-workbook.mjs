#!/usr/bin/env node
// Extracts every Preview Activity (<exploration>) and Activity (<activity>) from the ACTUAL
// source of the live activecalculus.org/multi/ site and renders them into a single
// print-ready HTML file: one activity per page, followed by a blank workspace page, numbered
// to match the live site exactly (e.g. "Preview Activity 9.8.1"), matching the layout the
// authors describe for their own (not-yet-published) print workbook.
//
// Two source repos are needed, because the live site itself is built from two repos:
//   --ac3     StevenSchlicker/AC3PreTeXt 's `src/` dir — chapters 9-11 (merge.mbx already
//             has them pre-merged with no further <xi:include>s to resolve).
//   --vector  active-calculus-vector 's `source/` dir — chapter 12 (Vector Calculus). This
//             repo is further along than what's live (it's the 2nd-edition work in
//             progress), so one section not yet on the live site is dropped automatically
//             (see LIVE_ONLY_CHAPTER12_EXCLUDE below) to keep numbering/content aligned
//             with what's actually published today.
//
// This exists because pretext's own PDF build for this content requires SageMath (for a
// handful of plotted figures) and a fully-hosted deployment (for QR codes linking to
// interactives) — neither of which matters for a page a student prints and writes on, so
// this script bypasses that pipeline entirely and reads the XML directly.
//
// Usage: node tools/build-activity-workbook.mjs --ac3 "C:\path\to\AC3PreTeXt\src" --vector "C:\path\to\active-calculus-vector\source" [--out activity-workbook.html] [--no-fetch-images]
//
// IMPORTANT — license: the live site's colophon currently shows CC BY-NC-SA 4.0, credited
// to Steven Schlicker, Mitchel T. Keller, and Nicholas Long. The active-calculus-vector
// repo's own docinfo declares CC BY-SA (no NC) for its still-unpublished 2nd edition — since
// this script now sources chapters 9-11 from the actual live-site repo (AC3PreTeXt), BY-NC-SA
// is the correct label for THIS output. Confirm with the authors (schlicks@gvsu.edu,
// mitch.keller@wisc.edu, longne@sfasu.edu) before distributing beyond individual classroom use.

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, arr) => {
    if (arg.startsWith("--")) pairs.push([arg.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : "true"]);
    return pairs;
  }, [])
);

if (!args.ac3 || !args.vector) {
  console.error('Usage: node tools/build-activity-workbook.mjs --ac3 "C:\\path\\to\\AC3PreTeXt\\src" --vector "C:\\path\\to\\active-calculus-vector\\source" [--out activity-workbook.html] [--no-fetch-images]');
  process.exit(1);
}

const AC3_DIR = args.ac3;
const VECTOR_DIR = args.vector;
const OUT_FILE = args.out || "activity-workbook.html";
// <image source="images/foo"> is relative to the directory that CONTAINS "images/", not
// the images folder itself — AC3_DIR (its "src") has that layout directly; for the vector
// repo, assets/ (a sibling of source/, per docinfo's <directories external="../assets"/>)
// is the equivalent directory.
const AC3_IMAGES_DIR = AC3_DIR;
const VECTOR_ASSETS_DIR = join(dirname(VECTOR_DIR), "assets");

// Both repos define custom LaTeX macros (\va, \vF, etc.) in their docinfo's <macros> block
// for KaTeX to expand — without these, KaTeX just prints "\va" as literal text instead of
// rendering it. The two repos style vectors differently (AC3: bold \mathbf; vector repo:
// arrow \vec) so each chapter group gets its own macro set rather than merging them.
function parseLatexMacros(macrosText) {
  const macros = {};
  const newcommandRe = /\\newcommand\*?\{\\(\w+)\}(?:\[\d+\])?\{((?:[^{}]|\{[^{}]*\})*)\}/g;
  let m;
  while ((m = newcommandRe.exec(macrosText))) macros[`\\${m[1]}`] = m[2];
  const opRe = /\\DeclareMathOperator\{\\(\w+)\}\{([^}]*)\}/g;
  while ((m = opRe.exec(macrosText))) macros[`\\${m[1]}`] = `\\operatorname{${m[2]}}`;
  return macros;
}
function loadMacros(path) {
  const text = readFileSync(path, "utf8");
  const match = text.match(/<macros>([\s\S]*?)<\/macros>/);
  return match ? parseLatexMacros(match[1]) : {};
}
// \amp and \mbox are PreTeXt-wide conventions (not book-specific like \va/\vF above) —
// \amp is used as the alignment separator inside <md>/<mdn> (LaTeX's "&" is reserved
// syntax, so PreTeXt authors write \amp instead); \mbox is plain LaTeX text-in-math.
// A single undefined \amp inside \begin{aligned}...\end{aligned} fails the WHOLE block,
// which is why \sin/\cos etc. sitting in the same aligned block were showing up as raw
// unrendered source too — it's collateral damage from the one bad command, not a separate
// bug with those commands themselves.
const PRETEXT_STANDARD_MACROS = { "\\amp": "&", "\\mbox": "\\text" };
const AC3_MACROS = { ...PRETEXT_STANDARD_MACROS, ...loadMacros(join(AC3_DIR, "merge.mbx")) };
const VECTOR_MACROS = { ...PRETEXT_STANDARD_MACROS, ...loadMacros(join(VECTOR_DIR, "main.ptx")) };
// Figures plotted at build time (sageplot/asymptote) aren't checked in as static files —
// the live site renders those same figures (by @label) to plain static SVGs at a public
// URL, so pulling those is equivalent to what pretext's own asset-generation step would
// produce, without needing SageMath installed locally. A miss just falls back to the
// honest "omitted" placeholder.
const FETCH_IMAGES = args["fetch-images"] !== "false" && args["no-fetch-images"] === undefined;
const LIVE_IMAGE_BASE = "https://activecalculus.org/multi/external/images/";
// Chapter 12 in active-calculus-vector is ahead of what's live — this section doesn't exist
// on the live site yet, so it's excluded to keep numbering aligned with activecalculus.org.
const LIVE_ONLY_CHAPTER12_EXCLUDE_TITLE = "Parameterizations of Surfaces and Surface Area";

/* ------------------------------------------------------------------ */
/* Minimal dependency-free XML parser (same shape as tools/build-section.mjs's parseXML). */
/* Works for both .ptx (PreTeXt) and .mbx (MathBook XML, PreTeXt's predecessor name) —      */
/* same element vocabulary, just an older file extension.                                    */
/* ------------------------------------------------------------------ */
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
        const sp = body.search(/\s/);
        const tag = (sp === -1 ? body : body.slice(0, sp)).replace(/^\w+:/, "");
        const n = node(tag);
        if (sp !== -1) parseAttrs(body.slice(sp), n);
        i = end + 1;
        if (!selfClose) n.children = walk();
        out.push(n);
      } else {
        const nxt = s.indexOf("<", i);
        const text = s.slice(i, nxt === -1 ? s.length : nxt);
        if (text) out.push({ tag: "#text", text: text
          .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
          .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
          .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)) });
        i = nxt === -1 ? s.length : nxt;
      }
    }
    return out;
  }
  return { tag: "#root", attrs: {}, children: walk() };
}

/* ------------------------------------------------------------------ */
/* Resolve <xi:include href="..."/> nodes recursively, in place        */
/* ------------------------------------------------------------------ */
function expandIncludes(nodes, baseDir, stack = []) {
  const out = [];
  for (const n of nodes) {
    if (n.tag === "include" && n.attrs.href) {
      const path = join(baseDir, n.attrs.href).replace(/\\/g, "/");
      // parse="text" includes (and anything not .ptx/.xml/.mbx) are raw asset payloads for
      // interactive-figure tooling (GeoGebra/CalcPlot3D config, JS snippets), not markup —
      // attempting to XML-parse them can misread stray "<"/">" as runaway nesting. Irrelevant
      // to activity text extraction either way, so skip them entirely.
      if (n.attrs.parse === "text" || !/\.(ptx|xml|mbx)$/i.test(path)) continue;
      if (stack.includes(path) || stack.length > 25) {
        console.error(`Circular/too-deep include chain: ${stack.join(" -> ")} -> ${path}`);
        process.exit(1);
      }
      const text = readFileSync(path, "utf8");
      const tree = parseXML(text);
      out.push(...expandIncludes(tree.children, dirname(path), [...stack, path]));
    } else {
      if (n.children) n.children = expandIncludes(n.children, baseDir, stack);
      out.push(n);
    }
  }
  return out;
}

// Loads a file and returns the <chapter> elements found in it (a chapter file has exactly
// one; a pre-merged file like merge.mbx has several, nested inside a <mathbook>/<book>
// wrapper rather than sitting at the top level — so this searches recursively, not just
// tree.children directly).
function findAllTag(node, tag, out = []) {
  if (node.tag === tag) out.push(node);
  for (const c of node.children || []) findAllTag(c, tag, out);
  return out;
}
function loadChapters(path, baseDir) {
  const text = readFileSync(path, "utf8");
  const tree = parseXML(text);
  const expanded = { tag: "#root", children: expandIncludes(tree.children, baseDir) };
  return findAllTag(expanded, "chapter");
}

/* ------------------------------------------------------------------ */
/* Inline / block content -> HTML (math left as raw LaTeX source;      */
/* KaTeX auto-render in the browser handles \( \) / \[ \] delimiters)  */
/* ------------------------------------------------------------------ */
const esc = s => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const qd = (n, tag) => (n.children || []).find(c => c.tag === tag);
const qda = (n, tag) => (n.children || []).filter(c => c.tag === tag);

function inline(n) {
  if (!n) return "";
  if (n.tag === "#text") return esc(n.text);
  const kids = () => (n.children || []).map(inline).join("");
  switch (n.tag) {
    case "m": return `\\(${esc(textOf(n))}\\)`;
    case "me": case "men": case "md": case "mdn": return displayMath(n);
    case "term": case "em": case "alert": return `<em>${kids()}</em>`;
    case "q": return `&ldquo;${kids()}&rdquo;`;
    // "text" attr on a real xref is a PreTeXt keyword (local/global/title/...) controlling
    // HOW to render the target's own number, not literal replacement text — printing it
    // verbatim would leak words like "local" into the page. And a bare child like
    // <xref ref="F-9-1-x">Figure</xref> is itself just a placeholder PreTeXt would normally
    // replace with the real "Figure 9.1.16" during its own build — printing it verbatim
    // leaves the word "Figure" with no number at all, which is the bug reported here.
    // For figure/table targets we DO have real numbering (see figureLabels above), so use
    // that instead of either the keyword or the literal placeholder text.
    //
    // Separately: many activities reference a <figure>/<table> that's defined in the
    // surrounding section prose, not nested inside the activity itself (e.g. "fill in
    // Table 9.1.1" where the actual <table> sits in a paragraph before the activity) — those
    // would otherwise never appear on the activity's own page at all. If the xref's target
    // ISN'T already part of the activity being rendered, transclude it right here too (see
    // currentInternalNodes/currentTranscluded below), alongside its now-numbered label.
    case "xref": {
      const target = n.attrs.ref && idIndex.get(n.attrs.ref);
      if (target && (target.tag === "figure" || target.tag === "table")) {
        const label = figureLabels.get(target) || kids();
        if (!currentInternalNodes.has(target) && !currentTranscluded.has(n.attrs.ref)) {
          currentTranscluded.add(n.attrs.ref);
          return `${label}${block(target)}`;
        }
        return label;
      }
      return kids();
    }
    case "url": return `<a href="${esc(n.attrs.href || "")}">${kids() || esc(n.attrs.href || "")}</a>`;
    case "var": return `<span class="blank">_______</span>`;
    case "todo": case "caption": case "description": case "shortdescription": case "title": return "";
    // Older markup (AC3PreTeXt) sometimes nests a block-level list/table/figure directly
    // inside a <p> — invalid HTML5, but browsers auto-close the <p> before flow content
    // like these anyway, so just delegate to block() and let that happen naturally.
    case "ol": case "ul": case "table": case "tabular": case "figure": case "image": case "interactive": case "sage":
      return block(n);
    default: return kids();
  }
}
function textOf(n) {
  if (n.tag === "#text") return n.text;
  return (n.children || []).map(textOf).join("");
}
// <me>/<men> are single-line display math; <md>/<mdn> normally wrap <mrow> rows for an
// aligned multi-line display, but some activities use a bare <md> with no <mrow> as a
// plain single-equation display — handle both shapes for either tag.
function displayMath(n) {
  const rows = qda(n, "mrow").map(r => textOf(r));
  const body = rows.length ? rows.join(" \\\\\n") : textOf(n);
  return rows.length ? `\\[\\begin{aligned}${esc(body)}\\end{aligned}\\]` : `\\[${esc(body)}\\]`;
}

/* ------------------------------------------------------------------ */
/* Image resolution: local checked-in assets first, then a best-effort  */
/* fetch of the live site's already-rendered SVG by label               */
/* (same figure, same source content — avoids needing SageMath at all). */
/* ------------------------------------------------------------------ */
const imageCache = new Map(); // <image> node -> inlined SVG/img HTML string (absent if unresolved)
let svgUniqueCounter = 0;
// Inlining many SVGs into one document risks id collisions (clipPath/gradient ids are
// often generic like "id1") — each fetched/loaded SVG gets its internal ids and their
// url(#id)/href="#id" references rewritten to a unique prefix before inlining.
function uniquifySvgIds(svg) {
  const prefix = `svg${svgUniqueCounter++}-`;
  const ids = new Set();
  svg.replace(/\bid="([^"]+)"/g, (_, id) => { ids.add(id); return ""; });
  let out = svg;
  for (const id of ids) {
    out = out.replaceAll(`id="${id}"`, `id="${prefix}${id}"`)
      .replaceAll(`url(#${id})`, `url(#${prefix}${id})`)
      .replaceAll(`href="#${id}"`, `href="#${prefix}${id}"`)
      .replaceAll(`xlink:href="#${id}"`, `xlink:href="#${prefix}${id}"`);
  }
  return out.replace(/<\?xml[^>]*\?>/, "").trim();
}
function findPlotLabel(img) {
  for (const tag of ["sageplot", "asymptote", "latex-image", "interactive"]) {
    const c = qd(img, tag);
    // The live site serves these by @label with a leading "img-" stripped (verified against
    // activecalculus.org/multi/external/images/ directly — "img-fig_9_1_..." 404s, the same
    // name minus "img-" is a 200). Most labels in source carry that prefix; a few don't.
    if (c && c.attrs.label) return c.attrs.label.replace(/^img[-_]/, "");
  }
  return null;
}
function loadLocalImage(assetsDir, source) {
  for (const ext of [".svg", ".png", ".jpg", ".jpeg"]) {
    const path = join(assetsDir, source + ext);
    if (existsSync(path)) {
      if (ext === ".svg") return uniquifySvgIds(readFileSync(path, "utf8"));
      const mime = ext === ".png" ? "image/png" : "image/jpeg";
      const b64 = readFileSync(path).toString("base64");
      return `<img src="data:${mime};base64,${b64}" alt="">`;
    }
  }
  return null;
}
async function fetchLiveSvg(label) {
  try {
    const res = await fetch(LIVE_IMAGE_BASE + label + ".svg");
    if (!res.ok) return null;
    return uniquifySvgIds(await res.text());
  } catch {
    return null;
  }
}
async function pMap(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}
function findImageNodes(node, out = []) {
  if (node.tag === "image") out.push(node);
  for (const c of node.children || []) findImageNodes(c, out);
  return out;
}
// chapterEntries: [{ node: chapterNode, assetsDir }]. Scoped to whole CHAPTERS, not just
// activity subtrees — an activity can transclude a figure/table defined elsewhere in the
// section via <xref> (see inline()'s "xref" case), so its images need resolving too, and
// walking the full chapter is simplest way to not miss any of those.
async function resolveImages(chapterEntries) {
  let localHits = 0, liveHits = 0, misses = 0;
  const toFetch = [];
  for (const { node, assetsDir } of chapterEntries) {
    for (const img of findImageNodes(node)) {
      if (img.attrs.source) {
        const svg = loadLocalImage(assetsDir, img.attrs.source);
        if (svg) { imageCache.set(img, svg); localHits++; continue; }
      }
      const label = findPlotLabel(img);
      if (label && FETCH_IMAGES) toFetch.push({ img, label });
      else misses++;
    }
  }
  await pMap(toFetch, 6, async ({ img, label }) => {
    const svg = await fetchLiveSvg(label);
    if (svg) { imageCache.set(img, svg); liveHits++; } else misses++;
  });
  console.log(`Images: ${localHits} from local assets, ${liveHits} fetched from the live edition, ${misses} unresolved.`);
}

// Renders a mixed list of children (some content — <li>, a <task>'s bare fallback, an
// <introduction>/<statement> — has bare text/<m>/<term>/etc. siblings with no <p> wrapper
// at all) into HTML. Mapping each child through block() individually (the old approach)
// fragmented these: block() has no "m"/"term"/"xref" case, so each one fell through its
// default case and got its own stray <p> per child instead of flowing together as one
// sentence (the exact bug that hit figure descriptions, and separately bare <m> in <li>).
// This groups contiguous runs of inline content into one <p> and renders real block
// elements (<p>, lists, figures, tables, ...) through block() as before.
const INLINE_TAGS = new Set(["#text", "m", "me", "men", "md", "mdn", "term", "em", "alert", "q", "xref", "url", "var"]);
function renderMixedChildren(children) {
  let html = "", buf = [];
  const flush = () => {
    if (!buf.length) return;
    const rendered = buf.map(inline).join("");
    // Skip: a run of only whitespace text nodes between block elements (very common —
    // pretty-printed XML indentation) would otherwise become a visible empty paragraph.
    if (rendered.replace(/&\w+;|\s/g, "")) html += `<p>${rendered}</p>`;
    buf = [];
  };
  for (const c of children || []) {
    if (INLINE_TAGS.has(c.tag)) buf.push(c);
    else { flush(); html += block(c); }
  }
  flush();
  return html;
}

function block(n) {
  if (!n) return "";
  switch (n.tag) {
    // A <p> that's entirely a now-empty xref (dangling reference to something we can't
    // resolve) would otherwise still emit a visible blank paragraph.
    case "p": {
      const rendered = inline(n);
      return rendered.replace(/&\w+;|\s/g, "") ? `<p>${rendered}</p>` : "";
    }
    case "me": case "men": case "md": case "mdn": return displayMath(n);
    case "ul": case "ol": {
      const tag = n.tag === "ul" ? "ul" : "ol";
      const items = qda(n, "li").map(li => `<li>${renderMixedChildren(li.children)}</li>`).join("");
      return `<${tag}>${items}</${tag}>`;
    }
    case "li": return `<li>${renderMixedChildren(n.children)}</li>`;
    // figure/image: use the pre-fetched SVG(s) if found (see resolveImages above), and do
    // NOT recurse into captions/descriptions either way — those hold accessibility alt text
    // and figure numbers that don't belong in the printed workbook body. A <figure> can wrap
    // a <sidebyside> with MULTIPLE images nested a level deeper (side-by-side comparisons),
    // not just one direct child — findImageNodes searches the whole subtree, not just qd()'s
    // direct children, so both single- and multi-image figures resolve correctly.
    case "figure": {
      const svgs = findImageNodes(n).map(img => imageCache.get(img)).filter(Boolean);
      const multi = svgs.length > 1 ? " multi" : "";
      return svgs.length ? `<div class="figure${multi}">${svgs.map(s => `<span class="figure-item">${s}</span>`).join("")}</div>`
        : `<p class="figure-note">[Figure omitted from print workbook — not available locally or from the live edition.]</p>`;
    }
    case "image": {
      // Wrapped in the same .figure-item markup as multi-image figures so a single bare
      // <image> gets the same sizing rule — no separate "single image" CSS path to drift.
      const svg = imageCache.get(n);
      return svg ? `<div class="figure"><span class="figure-item">${svg}</span></div>`
        : `<p class="figure-note">[Figure omitted from print workbook — not available locally or from the live edition.]</p>`;
    }
    case "interactive": return `<p class="figure-note">[Interactive figure omitted from print workbook — see the online edition.]</p>`;
    // <sage><input>code</input></sage> is a live, editable SageMath computation cell —
    // nearby prose often says something like "the SageMath cell below is set up to assist
    // you," which reads as broken if the cell just vanishes. Render its starting code as a
    // plain (non-interactive) code block instead, clearly labeled as such.
    case "sage": {
      const inputCode = qd(n, "input");
      if (!inputCode) return "";
      return `<p class="figure-note">[Not interactive in print — starting code for the SageMath cell:]</p>` +
        `<pre class="sage-code">${esc(textOf(inputCode).trim())}</pre>`;
    }
    case "tabular": {
      // Cell content is inline (bare text/math, occasionally a <p>) — never a full block
      // like a list or figure — so render via inline(), not block(), to avoid the same
      // "bare <m> gets its own stray <p>" bug that bit figure descriptions earlier.
      const rows = qda(n, "row").map(row => {
        const cells = qda(row, "cell").map(cell => `<td>${(cell.children || []).map(inline).join("")}</td>`).join("");
        return `<tr>${cells}</tr>`;
      }).join("");
      return `<table class="ptx-table">${rows}</table>`;
    }
    case "table": return (n.children || []).map(block).join("");
    case "title": case "caption": case "description": case "shortdescription": return "";
    case "sidebyside": return (n.children || []).map(block).join("");
    case "#text": return n.text.trim() ? `<p>${esc(n.text)}</p>` : "";
    default: return (n.children || []).map(block).join("");
  }
}

/* ------------------------------------------------------------------ */
/* Walk a chapter, tracking chapter/section/subsection titles and       */
/* live-matching numbering, collecting every <exploration>/<activity>   */
/* in document order.                                                    */
/* ------------------------------------------------------------------ */
function titleOf(n) {
  const t = qd(n, "title");
  return t ? textOf(t).trim() : "";
}

// Global registry of every xml:id in the book (parseAttrs strips the "xml:" prefix, so it's
// just .id), built once up front — lets an xref transclude a figure/table defined outside
// the activity currently being rendered (see the "xref" case in inline() above).
const idIndex = new Map();
function indexIds(n) {
  if (n.attrs && n.attrs.id) idIndex.set(n.attrs.id, n);
  for (const c of n.children || []) indexIds(c);
}
// <figure> and <table> node -> display label ("Figure 9.1.16", "Table 9.1.1"). Confirmed
// against the live site that figures and tables share ONE counter per section (not separate
// sequences) — activecalculus.org/multi/S-9-1-Functions.html runs Table 9.1.1, Table 9.1.2,
// ..., Figure 9.1.9, Figure 9.1.10, ... in one interleaved sequence, exactly like Preview
// Activity/Activity numbering. Populated by numberFiguresAndTables below, one pass per
// chapter, using the exact same per-section reset points as collect()'s activity numbering.
const figureLabels = new Map();
function numberFiguresAndTables(node, chapterNum, sectionCounter = { n: 0 }) {
  for (const c of node.children || []) {
    if (c.tag === "section") { sectionCounter.n++; numberFiguresAndTables(c, chapterNum, { n: sectionCounter.n, fig: 0 }); continue; }
    if (c.tag === "figure" || c.tag === "table") {
      sectionCounter.fig = (sectionCounter.fig || 0) + 1;
      const word = c.tag === "figure" ? "Figure" : "Table";
      figureLabels.set(c, `${word} ${chapterNum}.${sectionCounter.n}.${sectionCounter.fig}`);
    }
    numberFiguresAndTables(c, chapterNum, sectionCounter);
  }
}
// Reset per activity in renderTasks: which nodes belong to THIS activity (so an internal
// xref to a table nested inside itself doesn't get transcluded a second time) and which
// external ids have already been transcluded (so referencing the same external figure
// twice from one activity doesn't print it twice).
let currentInternalNodes = new Set();
let currentTranscluded = new Set();
function collectAllNodes(n, set) {
  set.add(n);
  for (const c of n.children || []) collectAllNodes(c, set);
  return set;
}

// A <task> can itself contain its own <introduction> plus either a <statement> OR one or
// more NESTED <task> children (a lettered part with its own multi-stage sub-parts) — e.g.
// S_Vector_StokesTheorem.ptx's preview activity part (a) is exactly this shape: <task><
// introduction>(figure + prose)</introduction><task><statement>...</statement></task></
// task>. Only checking for a direct <statement> (as before) silently rendered that whole
// part as empty. Recursive so arbitrary nesting depth works, not just one extra level.
function renderTaskContent(task) {
  const intro = qd(task, "introduction");
  const introHtml = intro ? renderMixedChildren(intro.children) : "";
  const stmt = qd(task, "statement");
  if (stmt) return introHtml + renderMixedChildren(stmt.children);
  const subtasks = qda(task, "task");
  if (subtasks.length) return introHtml + renderPartsList(subtasks);
  // Older MathBook-XML-era markup (AC3PreTeXt's merge.mbx) skips <statement> entirely —
  // content is just bare <p>/<ol>/etc. directly under <task> (or <exploration>/<activity>).
  const bare = (task.children || []).filter(c => c.tag !== "title" && c.tag !== "introduction" && c.tag !== "task");
  return introHtml + renderMixedChildren(bare);
}
function renderPartsList(tasks) {
  return tasks.map((task, i) => {
    const label = tasks.length > 1 ? `<span class="part-label">${String.fromCharCode(97 + i)})</span> ` : "";
    return `<div class="part">${label}${renderTaskContent(task)}</div>`;
  }).join("");
}

function renderTasks(n) {
  currentInternalNodes = collectAllNodes(n, new Set());
  currentTranscluded = new Set();
  const tasks = qda(n, "task");
  const intro = qd(n, "introduction");
  const introHtml = intro ? renderMixedChildren(intro.children) : "";
  if (!tasks.length) {
    const stmt = qd(n, "statement");
    if (stmt) return introHtml + renderMixedChildren(stmt.children) + `<div class="workspace"></div>`;
    const bare = (n.children || []).filter(c => c.tag !== "title" && c.tag !== "introduction");
    return introHtml + renderMixedChildren(bare) + `<div class="workspace"></div>`;
  }
  return introHtml + renderPartsList(tasks) + `<div class="workspace"></div>`;
}

// counters is a mutable {section, activity} pair shared across one chapter's whole walk (not
// cloned per branch, unlike ctx) — activity numbering is a single counter shared between
// Preview Activities and Activities within a section, confirmed against the live site
// (S-9-2-Vectors.html runs "Preview Activity 9.2.1", "Activity 9.2.2", "9.2.3", ... in one
// sequence), and it must keep incrementing across subsections within the same section too.
function collect(nodes, ctx, counters, assetsDir, out) {
  for (const n of nodes) {
    if (n.tag === "section") {
      counters.section++;
      counters.activity = 0;
      collect(n.children || [], { ...ctx, section: titleOf(n), subsection: "" }, counters, assetsDir, out);
      continue;
    }
    if (n.tag === "subsection") {
      collect(n.children || [], { ...ctx, subsection: titleOf(n) }, counters, assetsDir, out);
      continue;
    }
    if (n.tag === "exploration" || n.tag === "activity") {
      counters.activity++;
      out.push({
        kind: n.tag === "exploration" ? "Preview Activity" : "Activity",
        number: `${ctx.chapterNum}.${counters.section}.${counters.activity}`,
        chapter: ctx.chapter || "", section: ctx.section || "", subsection: ctx.subsection || "",
        node: n,
        assetsDir,
      });
      continue;
    }
    if (n.children) collect(n.children, ctx, counters, assetsDir, out);
  }
}

const ac3Chapters = loadChapters(join(AC3_DIR, "merge.mbx"), AC3_DIR); // [C-9, C-10, C-11], already merged, no includes left
// Chapter 12 (Vector Calculus) leans heavily on SageMath-plotted figures and interactive
// Sage cells with no static fallback — a genuinely different rendering problem than
// chapters 9-11, not something this print-focused extractor should try to paper over.
// Held back by default until that's solved properly (planned: a handout+webapp hybrid,
// not a straight PDF); pass --include-ch12 to build it anyway for testing.
const INCLUDE_CH12 = args["include-ch12"] !== undefined;
let vectorChapter = null;
if (INCLUDE_CH12) {
  const vectorChapters = loadChapters(join(VECTOR_DIR, "C-vector.ptx"), VECTOR_DIR); // [C-vector]
  vectorChapter = vectorChapters[0];
  vectorChapter.children = vectorChapter.children.filter(c =>
    c.tag !== "section" || titleOf(c) !== LIVE_ONLY_CHAPTER12_EXCLUDE_TITLE);
} else {
  console.log("Skipping chapter 12 (Vector Calculus) — pass --include-ch12 to build it anyway.");
}

const chapters = INCLUDE_CH12 ? [...ac3Chapters, vectorChapter] : ac3Chapters; // chapters 9, 10, 11(, 12)
chapters.forEach((c, i) => { indexIds(c); numberFiguresAndTables(c, 9 + i); });

const rawActivities = [];
chapters.forEach((chapterNode, i) => {
  const chapterNum = 9 + i;
  const assetsDir = chapterNode === vectorChapter ? VECTOR_ASSETS_DIR : AC3_IMAGES_DIR;
  const counters = { section: 0, activity: 0 };
  collect(chapterNode.children || [], { chapter: titleOf(chapterNode), chapterNum }, counters, assetsDir, rawActivities);
});

console.log(`Found ${rawActivities.length} activities across ${chapters.length} chapters, numbered to match activecalculus.org/multi/.`);

await resolveImages(chapters.map(c => ({ node: c, assetsDir: c === vectorChapter ? VECTOR_ASSETS_DIR : AC3_IMAGES_DIR })));

const activities = rawActivities.map(a => ({ ...a, html: renderTasks(a.node) }));

/* ------------------------------------------------------------------ */
/* Render the full print-ready HTML document                           */
/* ------------------------------------------------------------------ */
// One page break per activity, no separate blank page — whatever's left below an
// activity's content on its own page (via .workspace's min-height) is the writing space.
// Each section gets an id ("act-9-1-1") so the table of contents can link to it and (via
// Paged.js's target-counter()) show the real printed page number.
const pages = activities.map(a => {
  const macroGroup = a.assetsDir === VECTOR_ASSETS_DIR ? "mac-vector" : "mac-ac3";
  const id = `act-${a.number.replace(/\./g, "-")}`;
  return `
  <section class="activity-page ${macroGroup}" id="${id}">
    <div class="breadcrumb">Ch. ${a.number.split(".")[0]}: ${esc(a.chapter)}${a.section ? " &rsaquo; " + esc(a.section) : ""}${a.subsection ? " &rsaquo; " + esc(a.subsection) : ""}</div>
    <h2>${esc(a.kind)} <span class="wb-number">${a.number}</span></h2>
    ${a.html}
  </section>`;
}).join("\n");

// Table of contents: one entry per section (not per activity — sections have real titles,
// activities don't), linking to that section's first activity. Grouped under chapter
// headers, which link to the chapter's first activity.
const tocChapters = [];
for (const a of activities) {
  const [chapterNum, sectionNum] = a.number.split(".");
  let chapEntry = tocChapters.find(c => c.chapterNum === chapterNum);
  if (!chapEntry) { chapEntry = { chapterNum, chapter: a.chapter, sections: [] }; tocChapters.push(chapEntry); }
  if (!chapEntry.sections.find(s => s.sectionNum === sectionNum)) {
    chapEntry.sections.push({ sectionNum, section: a.section, id: `act-${a.number.replace(/\./g, "-")}` });
  }
}
const tocHtml = tocChapters.map(ch => `
  <p class="toc-chapter"><a class="toc-link" href="#${ch.sections[0].id}">Chapter ${ch.chapterNum}: ${esc(ch.chapter)}</a></p>
  <ul class="toc-sections">
    ${ch.sections.map(se => `<li><a class="toc-link" href="#${se.id}">${ch.chapterNum}.${se.sectionNum} ${esc(se.section)}</a></li>`).join("\n")}
  </ul>`).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Activities Workbook — Active Calculus: Multivariable</title>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
<script>
  // Paged.js auto-starts pagination as soon as the DOM is ready — a race against our own
  // math rendering below (both are roughly "DOM ready" timing, and Paged.js's script tag,
  // loaded synchronously in <head>, tends to register its own listener first). Its
  // documented fix is this PagedConfig.before hook: Paged.js awaits it before pagination
  // starts, so math is guaranteed to finish rendering first. Deferred scripts (KaTeX above)
  // always finish before DOMContentLoaded/"DOM ready", so window.renderMathInElement is
  // safely available by the time this hook runs.
  window.PagedConfig = {
    before: () => {
      const AC3_MACROS = ${JSON.stringify(AC3_MACROS)};
      const VECTOR_MACROS = ${JSON.stringify(VECTOR_MACROS)};
      const delimiters = [
        {left: "\\\\(", right: "\\\\)", display: false},
        {left: "\\\\[", right: "\\\\]", display: true},
      ];
      document.querySelectorAll(".mac-ac3").forEach(el =>
        renderMathInElement(el, { delimiters, macros: AC3_MACROS, throwOnError: false }));
      document.querySelectorAll(".mac-vector").forEach(el =>
        renderMathInElement(el, { delimiters, macros: VECTOR_MACROS, throwOnError: false }));
    },
  };
</script>
<!-- Chrome's print CSS doesn't support @page margin-box content (page numbers, running
     headers) or target-counter() (page-accurate TOC entries) on its own — Paged.js is the
     standard polyfill for both. It repaginates the page into actual page-sized boxes; the
     PagedConfig.before hook above makes it wait for KaTeX to finish first. -->
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
<style>
  @page {
    size: letter;
    margin: 0.75in 0.75in 0.9in 0.75in;
    @bottom-center { content: counter(page); font-family: Georgia, serif; font-size: 0.85em; color: #555; }
  }
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 7in; margin: 0 auto; color: #111; }
  .toc { page-break-after: always; }
  .toc h2 { border: none; }
  .toc-chapter { margin-top: 1.2em; font-weight: bold; }
  .toc-sections { list-style: none; padding-left: 1.2em; margin: 0.3em 0; }
  .toc-sections li { margin: 0.2em 0; }
  .toc-link { display: flex; justify-content: space-between; gap: 0.5em; text-decoration: none; color: inherit; }
  .toc-link::after { content: target-counter(attr(href url), page); color: #666; }
  .titlepage { text-align: center; padding-top: 2in; page-break-after: always; }
  .titlepage h1 { font-size: 1.8em; }
  .titlepage .authors { margin-top: 2em; font-size: 1.1em; }
  .license-note { max-width: 6in; margin: 3em auto 0; font-size: 0.85em; color: #555; text-align: left; border-top: 1px solid #ccc; padding-top: 1em; }
  .activity-page { page-break-after: always; padding-top: 0.5in; }
  .breadcrumb { font-size: 0.8em; color: #666; text-transform: uppercase; letter-spacing: 0.03em; }
  h2 { border-bottom: 2px solid #333; padding-bottom: 0.2em; }
  .wb-number { color: #888; font-weight: normal; font-size: 0.7em; }
  .part { margin: 1em 0; }
  .part-label { font-weight: bold; }
  /* No separate blank page anymore — this is the only dedicated writing space, so give it
     real room rather than the old 0.4in placeholder. */
  .workspace { min-height: 3in; }
  .part { min-height: 0.4in; }
  .figure-note { font-style: italic; color: #a00; }
  .blank { border-bottom: 1px solid #333; }
  .sage-code { background: #f4f4f4; border: 1px solid #ccc; border-radius: 4px; padding: 0.6em 0.8em; font-family: 'Courier New', monospace; font-size: 0.9em; white-space: pre-wrap; }
  /* width (not max-width) so small-native-size SVGs (some are authored at ~1.5in square)
     get scaled UP to fill the page, not just capped when larger than it — a plain
     max-width never enlarges an image smaller than its limit. Single and multi-image
     figures both use .figure-item now (see the "image"/"figure" cases in block()), sized
     the same so a lone graph doesn't render disproportionately larger than a side-by-side one. */
  .figure { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5em; margin: 1em 0; }
  .figure-item { width: 45%; }
  .figure-item svg, .figure-item img { width: 100%; height: auto; }
  .ptx-table { border-collapse: collapse; margin: 1em auto; }
  .ptx-table td { border: 1px solid #999; padding: 0.3em 0.6em; text-align: center; }
  @media print {
    .activity-page, .titlepage { page-break-after: always; }
  }
</style>
</head>
<body>

<div class="titlepage">
  <h1>Activities Workbook<br>for<br>Active&nbsp;Calculus&nbsp;&mdash;&nbsp;Multivariable</h1>
  <div class="authors">Steven Schlicker &middot; Mitchel T. Keller &middot; Nicholas Long<br>
  Contributing authors: David Austin &middot; Matt Boelkins</div>
  <p>Collects every Preview Activity and Activity from the book, one per page &mdash; numbered
  to match activecalculus.org/multi/ exactly &mdash; with space below each for student work.</p>
  <div class="license-note">
    <strong>License note:</strong> the live edition at activecalculus.org/multi/ currently
    shows <strong>CC BY-NC-SA 4.0</strong> (Attribution-NonCommercial-ShareAlike), credited to
    Steven Schlicker, Mitchel T. Keller, and Nicholas Long. This extract is labeled under that
    license, but it has not been separately confirmed with the authors. Confirm before
    distributing this beyond your own classroom use.
  </div>
</div>

<div class="toc">
  <h2>Table of Contents</h2>
  ${tocHtml}
</div>

${pages}

</body>
</html>
`;

writeFileSync(OUT_FILE, html, "utf8");
console.log(`Wrote ${OUT_FILE}`);
