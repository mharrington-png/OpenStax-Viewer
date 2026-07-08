#!/usr/bin/env node
/**
 * build-section.mjs — turn any OpenStax College Algebra 2e section into a page for this site.
 *
 *   node tools/build-section.mjs m49362 6-2 "Graphs of Exponential Functions"
 *
 * Then add the section to the BOOK manifest in assets/app.js (set ready: true).
 * Module IDs for every section are listed in the README.
 *
 * Requires Node 18+ (uses global fetch). No dependencies.
 */
import { writeFileSync, readFileSync } from "node:fs";

// Optional --file=<path> / --repo=<owner/name> flags (order-independent) let this run
// against a locally-saved CNXML file instead of hitting the network directly — used by
// the automation pipeline in sandboxes where raw.githubusercontent.com is blocked but a
// fetch tool upstream can still retrieve the module and save it locally first.
const rawArgs = process.argv.slice(2);
let localFile = null, repo = "osbooks-college-algebra-bundle";
const positional = [];
for (const a of rawArgs) {
  if (a.startsWith("--file=")) localFile = a.slice(7);
  else if (a.startsWith("--repo=")) repo = a.slice(7);
  else positional.push(a);
}
const [moduleId, slug, ...titleParts] = positional;
if (!moduleId || !slug) {
  console.error('Usage: node tools/build-section.mjs <moduleId> <slug> "<Section title>" [--file=<local .cnxml path>] [--repo=<org/repo>]');
  process.exit(1);
}
const title = titleParts.join(" ") || slug;

const RAW = `https://raw.githubusercontent.com/openstax/${repo}/main/modules/${moduleId}/index.cnxml`;
const MEDIA = `https://raw.githubusercontent.com/openstax/${repo}/main/media/`;

const xmlText = localFile ? readFileSync(localFile, "utf8") : await (await fetch(RAW)).text();

/* ------------------------------------------------------------------ */
/* Minimal XML parser (DOM-ish) — enough for CNXML                      */
/* ------------------------------------------------------------------ */
function parseXML(s) {
  let i = 0;
  function node(tag) { return { tag, attrs: {}, children: [], text: null }; }
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
        const nxt = s.indexOf("<", i);
        const text = s.slice(i, nxt === -1 ? s.length : nxt);
        if (text) out.push({ tag: "#text", text: text
          .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
          .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)) });
        i = nxt === -1 ? s.length : nxt;
      }
    }
    return out;
  }
  return { tag: "#root", attrs: {}, children: walk() };
}

const q = (n, tag) => { // first descendant
  for (const c of n.children || []) {
    if (c.tag === tag) return c;
    const r = q(c, tag); if (r) return r;
  }
  return null;
};
const qd = (n, tag) => (n.children || []).find(c => c.tag === tag); // direct child

/* ------------------------------------------------------------------ */
/* MathML -> LaTeX                                                      */
/* ------------------------------------------------------------------ */
const OPS = { "−": "-", "–": "-", "×": "\\times ", "⋅": "\\cdot ", "≈": "\\approx ", "≠": "\\ne ",
  "≤": "\\le ", "≥": "\\ge ", "→": "\\to ", "±": "\\pm ", "∞": "\\infty ", "∈": "\\in ",
  "π": "\\pi ", "⁢": "", "⁡": "", " ": "\\,", " ": "\\,",
  // LaTeX-reserved ASCII characters that sometimes show up as literal text (e.g. "$" for
  // currency, "%" for percent) inside <mi>/<mn>/<mo> — must be escaped or KaTeX either
  // errors (stray $) or silently eats the rest of the line as a comment (stray %).
  "$": "\\$", "#": "\\#", "%": "\\%", "&": "\\&" };
// NOTE: deliberately does NOT .trim() the mapped result — several OPS entries (\cdot ,
// \approx , \pi , \times , etc.) carry an intentional trailing space so the next token
// doesn't get glued onto the command name (e.g. "\cdotx", "\approxP", or a bare "\" when
// the whole node is just a space char mapped to "\ "). Callers already collapse/trim
// whitespace at the top level (see inline()/m2l() call sites), so leaving this space in
// is harmless there and necessary here. Found building 6-5 — see AUTOBUILD_LOG.md.
const mtxt = s => [...(s || "")].map(c => OPS[c] ?? c).join("");
function m2l(n) {
  if (n.tag === "#text") return mtxt(n.text);
  const K = (n.children || []).filter(c => c.tag !== "#text" || c.text.trim());
  const j = () => K.map(m2l).join("");
  const g = k => (K[k] ? m2l(K[k]) : "");
  switch (n.tag) {
    case "semantics": return K.length ? m2l(K[0]) : "";
    case "math": case "mrow": case "mstyle": case "mpadded": return j();
    case "mi": case "mn": case "mo": return mtxt(textOf(n));
    case "mtext": {
      const raw = textOf(n);
      const t = raw.replace(/[$#%&_{}]/g, m => "\\" + m);
      return /^\s*$/.test(raw) ? "\\," : `\\text{${t}}`;
    }
    // "\\," (thin space) rather than "\\ " (control space) — self-contained, so it
    // survives being the sole content of a math node even after the outer
    // .replace(/\s+/g," ").trim() at the top-level math wrapper call sites strips a
    // trailing literal space. "\\ " alone would trim down to a bare "\", which KaTeX
    // rejects. Found building 6-5 — see AUTOBUILD_LOG.md.
    case "mspace": return "\\,";
    case "msup": return `{${g(0)}}^{${g(1)}}`;
    case "msub": return `{${g(0)}}_{${g(1)}}`;
    case "msubsup": return `{${g(0)}}_{${g(1)}}^{${g(2)}}`;
    case "mfrac": return `\\frac{${g(0)}}{${g(1)}}`;
    case "msqrt": return `\\sqrt{${j()}}`;
    case "mroot": return `\\sqrt[${g(1)}]{${g(0)}}`;
    case "mfenced": return `\\left(${K.map(m2l).join(",")}\\right)`;
    case "munder": return `\\underset{${g(1)}}{${g(0)}}`;
    case "mover": return `\\overset{${g(1)}}{${g(0)}}`;
    case "mtable": {
      const maxCols = K.reduce((mx, tr) => Math.max(mx, (tr.children || []).filter(x => x.tag === "mtd").length), 1);
      return `\\begin{array}{${"l".repeat(maxCols)}}${K.map(m2l).join(" \\\\ ")}\\end{array}`;
    }
    case "mtr": return (n.children || []).filter(c => c.tag === "mtd").map(m2l).join(" & ");
    case "mtd": return j();
    case "annotation": case "annotation-xml": return "";
    default: return j();
  }
}
function textOf(n) {
  if (n.tag === "#text") return n.text;
  return (n.children || []).map(textOf).join("");
}

/* ------------------------------------------------------------------ */
/* CNXML -> HTML                                                        */
/* ------------------------------------------------------------------ */
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function inline(n) { // serialize inline content of a para/entry/item
  let out = "";
  for (const c of n.children || []) {
    if (c.tag === "#text") { out += esc(c.text); continue; }
    switch (c.tag) {
      case "math": out += ` \\(${m2l(c).replace(/\s+/g, " ").trim()}\\) `; break;
      case "term": case "emphasis": out += `<strong>${inline(c)}</strong>`; break;
      case "sub": out += `<sub>${inline(c)}</sub>`; break;
      case "sup": out += `<sup>${inline(c)}</sup>`; break;
      case "link": {
        const tid = c.attrs["target-id"];
        if (tid && figIdMap.has(tid)) out += `<a href="#fig${figIdMap.get(tid)}">Figure ${figIdMap.get(tid)}</a>`;
        else out += inline(c) || "(see original)";
        break;
      }
      case "newline": out += "<br>"; break;
      case "footnote": out += ` <span class="footnote">(${inline(c)})</span>`; break;
      case "list": case "figure": case "table": case "equation": break; // block-level, handled by blocks()
      default: out += inline(c);
    }
  }
  return out.replace(/\s+/g, " ").trim();
}
let exN = 0, tryN = 0, exampleN = 0, figN = 0, tabN = 0, warmN = 0, warmExN = 0;
let figIdMap = new Map(); // CNXML figure id -> assigned figure number, for resolving <link target-id> refs
const seenIds = new Map();
function uniqueId(base) {
  const n = (seenIds.get(base) || 0) + 1;
  seenIds.set(base, n);
  return n === 1 ? base : `${base}-${n}`;
}
function blocks(n, ctx = {}) { // serialize block children
  let out = "";
  for (const c of n.children || []) {
    switch (c.tag) {
      case "title": break;
      case "para": {
        const t = inline(c);
        if (t) out += `<p>${t}</p>\n`;
        out += blocks(c, ctx); // nested figures/lists/equations
        break;
      }
      case "list":
        out += `<ul class="tight">${(c.children || []).filter(x => x.tag === "item").map(it => `<li>${inline(it)}${blocks(it, ctx)}</li>`).join("")}</ul>\n`;
        break;
      case "equation": {
        const m = q(c, "math");
        out += `<p>\\[${m ? m2l(m).replace(/\s+/g, " ") : esc(textOf(c))}\\]</p>\n`;
        break;
      }
      case "figure": {
        figN++;
        const img = q(c, "image");
        const media = q(c, "media");
        const cap = qd(c, "caption");
        const src = img ? MEDIA + img.attrs.src.replace(/^(\.\.\/)+media\//, "") : "";
        out += `<figure class="plot" id="fig${figN}"><img src="${src}" alt="${esc(media?.attrs.alt || "")}" style="max-width:100%;border:1px solid var(--line);border-radius:14px">` +
               `<figcaption>Figure ${figN}${cap ? " — " + inline(cap) : ""}</figcaption></figure>\n`;
        break;
      }
      case "media": {
        // A bare <media>/<image> not wrapped in <figure> — common in graphical answer
        // keys (Try It / exercise solutions). No figure number/caption, just the image.
        const img = q(c, "image");
        if (img) {
          const src = MEDIA + img.attrs.src.replace(/^(\.\.\/)+media\//, "");
          out += `<img src="${src}" alt="${esc(c.attrs.alt || "")}" style="max-width:100%;border:1px solid var(--line);border-radius:14px;display:block;margin:.8em 0">\n`;
        }
        break;
      }
      case "table": {
        tabN++;
        const rows = [];
        (function collect(x) { for (const y of x.children || []) { if (y.tag === "row") rows.push(y); else collect(y); } })(c);
        out += `<div class="tablewrap"><table class="data"><caption>Table ${tabN}</caption><tbody>` +
          rows.map(r => `<tr>${(r.children || []).filter(e => e.tag === "entry").map(e => `<td>${inline(e)}${blocks(e, ctx)}</td>`).join("")}</tr>`).join("") +
          `</tbody></table></div>\n`;
        break;
      }
      case "example": {
        let label;
        if (ctx.inCoreq) { warmExN++; label = `Warm-up Example ${warmExN}`; }
        else { exampleN++; label = `Example ${exampleN}`; }
        out += `<div class="card example${ctx.inCoreq ? " warmup" : ""}"><div class="ex-head"><span class="num">${label}</span><span class="t">${inline(qd(c, "title") || { children: [] })}</span></div>` +
               blocks(c, { ...ctx, inExample: true }) + `</div>\n`;
        break;
      }
      case "exercise": {
        const prob = qd(c, "problem"), sol = qd(c, "solution");
        if (ctx.inTry) {
          tryN++;
          out += `<div class="tryit" id="tryit-${tryN}"><div class="ex-head"><span class="num">Try It #${tryN}</span></div>` +
            `<div class="ex-body">${prob ? blocks(prob, ctx) : ""}</div>` +
            (sol ? `<div class="solution"><button class="sol-toggle">Show answer</button><div class="sol-body">${blocks(sol, ctx)}</div></div>` : "") +
            `<div class="selfcheck"><span>Did you get it?</span><button data-mark="right">I got it ✓</button><button data-mark="wrong">Not yet — review</button></div></div>\n`;
        } else if (ctx.inExample) {
          out += `<div class="ex-body">${prob ? blocks(prob, ctx) : ""}</div>` +
            (sol ? `<div class="solution"><button class="sol-toggle">Show solution</button><div class="sol-body">${blocks(sol, ctx)}</div></div>` : "");
          const comm = qd(c, "commentary");
          if (comm) out += `<div class="ex-body analysis"><span class="chip">Analysis</span>${blocks(comm, ctx)}</div>`;
        } else if (ctx.inCoreq) {
          warmN++;
          out += `<div class="exercise warmup"><div class="n">P${warmN}</div><div class="body">${prob ? blocks(prob, ctx) : ""}` +
            (sol ? `<div class="answer"><button>Show answer</button><div class="a">${blocks(sol, ctx)}</div></div>` : "") + `</div></div>\n`;
        } else {
          exN++;
          out += `<div class="exercise"><div class="n">${exN}</div><div class="body">${prob ? blocks(prob, ctx) : ""}` +
            (sol ? `<div class="answer"><button>Show answer</button><div class="a">${blocks(sol, ctx)}</div></div>` : "") + `</div></div>\n`;
        }
        break;
      }
      case "note": {
        const cls = c.attrs.class || "";
        const t = qd(c, "title");
        if (/\btry\b/.test(cls)) { out += blocks(c, { ...ctx, inTry: true }); }
        else if (/how-to/.test(cls)) out += `<div class="card howto"><span class="chip">How To</span>${blocks(c, ctx)}</div>\n`;
        else if (/\bqa\b/.test(cls)) out += `<div class="card qa"><span class="chip">Q&amp;A</span>${blocks(c, ctx)}</div>\n`;
        else if (/media/.test(cls)) out += `<div class="card callout"><span class="chip">Media</span>${blocks(c, ctx)}</div>\n`;
        else out += `<div class="card definition"><span class="chip">${t ? inline(t) : "Definition"}</span>${blocks(c, ctx)}</div>\n`;
        break;
      }
      case "section": {
        const t = qd(c, "title");
        const cls = c.attrs.class || "";
        const depth = ctx.depth || 2;
        const id = uniqueId((t ? textOf(t) : cls).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
        if (/coreq/.test(cls)) {
          out += `<details class="bigfold"><summary>Corequisite Skills review (optional warm-up)</summary><div class="fold-body">${blocks(c, { ...ctx, depth: 3, inCoreq: true })}</div></details>\n`;
        } else if (/section-exercises/.test(cls)) {
          out += `<div id="exercise-panel-content">\n<h2 id="exercises">Section Exercises</h2>\n` + blocks(c, { ...ctx, depth: 3 }) + `</div>\n`;
        } else {
          out += `<h${depth} id="${id}">${t ? inline(t) : ""}</h${depth}>\n` + blocks(c, { ...ctx, depth: Math.min(depth + 1, 4) });
        }
        break;
      }
      case "glossary":
        out += `<h2 id="glossary">Glossary</h2>\n<dl class="glossary">` +
          (c.children || []).filter(d => d.tag === "definition").map(d =>
            `<dt>${inline(qd(d, "term") || { children: [] })}</dt><dd>${inline(qd(d, "meaning") || { children: [] })}</dd>`).join("") +
          `</dl>\n`;
        break;
      case "content": case "document": out += blocks(c, ctx); break;
      case "metadata": case "#text": break;
      default: out += blocks(c, ctx);
    }
  }
  return out;
}

const root = parseXML(xmlText);
const doc = q(root, "document");
(function collectFigureIds(n) { // pre-pass: number figures in document order before rendering, so forward <link> refs resolve
  for (const c of n.children || []) {
    if (c.tag === "figure" && c.attrs.id) figIdMap.set(c.attrs.id, figIdMap.size + 1);
    collectFigureIds(c);
  }
})(doc);
const body = blocks(doc, { depth: 2 });

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · MX Algebra</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
<link rel="stylesheet" href="../assets/style.css">
<script defer src="../assets/app.js"></script>
</head>
<body>
<header class="topbar">
  <a class="brand" href="../index.html">MX <span>Algebra</span></a>
  <span class="crumb">${esc(title)}</span>
  <span class="spacer"></span>
  <span class="crumb" id="tryit-score"></span>
  <button class="iconbtn" data-theme-toggle>☀ / ☾</button>
  <div id="progressbar"></div>
</header>
<div class="layout">
<nav class="sidebar" aria-label="Book navigation"></nav>
<main>
<h1><span class="kicker">Section ${esc(slug.replace("-", "."))}</span>${esc(title)}</h1>
${body}
<footer class="attribution">
  Content from <a href="https://openstax.org/books/college-algebra-2e">OpenStax College Algebra 2e</a> by Jay Abramson, © OpenStax, licensed under
  <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0</a>.
  OpenStax is not affiliated with this site and does not endorse it. Access the original free at <a href="https://openstax.org">openstax.org</a>.
</footer>
</main>
</div>
</body>
</html>`;

const outPath = new URL(`../sections/${slug}.html`, import.meta.url).pathname;
writeFileSync(outPath, page);
console.log(`Wrote sections/${slug}.html (${page.length.toLocaleString()} chars, ${exN} exercises, ${tryN} try-its, ${exampleN} examples)`);
console.log(`Now open assets/app.js and set ready: true for "${slug}" in the BOOK manifest.`);
