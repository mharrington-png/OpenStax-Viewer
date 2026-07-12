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
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Per-book defaults — repo, where section files land, and the attribution footer's
// license/source (must match CLAUDE.md convention 3/4 and README's license note: Calculus
// and Intermediate Algebra collections are CC BY-NC-SA 4.0, not CC BY 4.0). Add an entry
// here (and a matching entry in assets/app.js's BOOKS map) when starting a new book.
const BOOK_DEFAULTS = {
  "college-algebra-2e": {
    repo: "osbooks-college-algebra-bundle",
    sectionsDir: "sections", // legacy: flat, no book subfolder, for backward compatibility
    license: { name: "Creative Commons Attribution 4.0", url: "https://creativecommons.org/licenses/by/4.0/" },
    source: { name: "OpenStax College Algebra 2e", url: "https://openstax.org/books/college-algebra-2e", author: "Jay Abramson" },
  },
  "calculus-v1": {
    repo: "osbooks-calculus-bundle",
    sectionsDir: "sections/calculus-v1",
    license: { name: "Creative Commons Attribution-NonCommercial-ShareAlike 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/" },
    source: { name: "OpenStax Calculus Volume 1", url: "https://openstax.org/books/calculus-volume-1", author: "Gilbert Strang, Edwin “Jed” Herman" },
  },
};

// Optional --file=<path> / --repo=<owner/name> / --book=<id> flags (order-independent)
// let this run against a locally-saved CNXML file instead of hitting the network
// directly (used by the automation pipeline in sandboxes where raw.githubusercontent.com
// is blocked but a fetch tool upstream can still retrieve the module and save it locally
// first), and let it target a book other than College Algebra 2e. --book also accepts a
// bare "--book calculus-v1" (space-separated) form for CLI ergonomics, not just "=".
const rawArgs = process.argv.slice(2);
let localFile = null, repoOverride = null, bookId = "college-algebra-2e";
const positional = [];
for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i];
  if (a.startsWith("--file=")) localFile = a.slice(7);
  else if (a.startsWith("--repo=")) repoOverride = a.slice(7);
  else if (a.startsWith("--book=")) bookId = a.slice(7);
  else if (a === "--book") { bookId = rawArgs[++i]; }
  else positional.push(a);
}
if (!BOOK_DEFAULTS[bookId]) {
  console.error(`Unknown --book "${bookId}". Known books: ${Object.keys(BOOK_DEFAULTS).join(", ")}`);
  process.exit(1);
}
const bookDef = BOOK_DEFAULTS[bookId];
const repo = repoOverride || bookDef.repo;
const [moduleId, slug, ...titleParts] = positional;
if (!moduleId || !slug) {
  console.error('Usage: node tools/build-section.mjs [--book=<book-id>] <moduleId> <slug> "<Section title>" [--file=<local .cnxml path>] [--repo=<org/repo>]');
  console.error('  e.g.: node tools/build-section.mjs m49362 6-2 "Graphs of Exponential Functions"');
  console.error('        node tools/build-section.mjs --book calculus-v1 m53483 2-1 "A Preview of Calculus"');
  process.exit(1);
}
const title = titleParts.join(" ") || slug;

const RAW = `https://raw.githubusercontent.com/openstax/${repo}/main/modules/${moduleId}/index.cnxml`;
const MEDIA = `https://raw.githubusercontent.com/openstax/${repo}/main/media/`;
// Section files for a book nest sectionsDir.split("/").length levels below the site
// root (College Algebra 2e's legacy flat "sections" = 1 level, e.g. sections/6-1.html;
// a book-scoped "sections/calculus-v1" = 2 levels, e.g. sections/calculus-v1/2-1.html) —
// asset/index links in the emitted page must climb back out that many levels.
const rootUp = "../".repeat(bookDef.sectionsDir.split("/").length);

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
          // Decimal (&#160;) AND hex (&#xA0;) numeric character references both appear in
          // OpenStax source (e.g. non-breaking space &#xA0; and en dash &#x2013; used as
          // manual spacing inside <mo> math nodes) — the old regex only matched decimal,
          // so hex entities passed through as literal text, then got double-escaped by
          // esc() into visible "&amp;#xA0;" garbage in exercise answers. Found in 3-4
          // (m51265), Example 8/Exercise 11.
          .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
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
  "$": "\\$", "#": "\\#", "%": "\\%", "&": "\\&",
  // Capital delta (rate-of-change notation "Δy/Δx", central to 3.3) has no KaTeX-mapped
  // glyph for the bare Unicode character — renders as an "unknown symbol" warning/tofu
  // box unless mapped to \Delta. Zero-width space (U+200B) shows up as an empty
  // placeholder superscript in some OpenStax figure captions (e.g. the "∪" between
  // increasing/decreasing intervals) and has no KaTeX character metrics at all — strip
  // it outright. Found building 3-3 (m51263).
  "Δ": "\\Delta ", "​": "",
  // Curly quotes appear as literal characters inside <mo>/<mi> nodes when OpenStax's
  // editor stylistically quotes a symbol *inside* math mode itself (e.g. "read the
  // left side as “f composed with g at x,”" — the quote marks are literal MathML
  // operator/identifier text, not surrounding prose). KaTeX has no font glyph for the
  // bare Unicode curly-quote characters ("Unrecognized Unicode character" warning,
  // strict-mode warn not throw, but visually risks a tofu box) — wrapping them in
  // \text{} routes them through KaTeX's text-mode renderer, which does have the glyph.
  // Found building 3-4 (m51265).
  "“": "\\text{“}", "”": "\\text{”}" };
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
    case "mrow": {
      // Piecewise-function idiom: MathML represents "f(x) = { <cases table> " with a lone
      // opening <mo>{</mo> and NO matching closing brace (the "}" is implied, never
      // written) — this is how OpenStax's editor emits every piecewise definition/exercise.
      // A literal, unescaped "{" with no closing counterpart is an unbalanced LaTeX group
      // and KaTeX throws "Expected '}', got EOF" on it. Originally only the "brace is the
      // very first child" shape was handled (3-2, m51262), but 3-7 (m51268) uses a second
      // shape where the brace comes after some prefix content in the SAME mrow (e.g.
      // "f(x)=" then the lone "{" then the mtable, all as siblings) — find the brace
      // anywhere in this row's children (not just position 0) and wrap only the tail after
      // it, keeping any prefix content untouched. Found building 3-7.
      const braceIdx = K.findIndex(k => k.tag === "mo" && textOf(k) === "{");
      if (braceIdx !== -1 && !K.some(k => k.tag === "mo" && textOf(k) === "}")) {
        const before = K.slice(0, braceIdx).map(m2l).join("");
        const after = K.slice(braceIdx + 1).map(m2l).join("");
        return `${before}\\left\\{${after}\\right.`;
      }
      return j();
    }
    case "math": case "mstyle": case "mpadded": return j();
    case "mi": case "mn": case "mo": return mtxt(textOf(n));
    case "mtext": {
      // Strip zero-width spaces (no KaTeX character metrics, invisible anyway) before
      // anything else. Found building 3-3 (m51263) — see the msup/OPS comments above.
      // Also normalize the real Unicode minus sign (−, U+2212) to an ASCII hyphen: OpenStax
      // sometimes puts a lone negation sign in its own <mtext> (e.g. "f(−x)") rather than an
      // <mo>, and \text{} has no glyph for U+2212 (unknownSymbol warning, same class of bug
      // as the Δ/curly-quote fixes below) — the OPS table already does this same "−"→"-"
      // mapping for the mi/mn/mo path. Found building 3-5 (m51266).
      const raw = textOf(n).replace(/​/g, "").replace(/−/g, "-");
      if (/^\s*$/.test(raw)) return "\\,";
      // "Δ" (capital delta, rate-of-change notation) has no glyph inside KaTeX's \text{}
      // mode ("Undefined control sequence: \Delta") — \text{} only supports literal
      // characters, not math commands. Split the run on Δ and drop bare \Delta (valid
      // here since mtext content is always reached from inside an outer math-mode
      // context) between \text{}-wrapped literal segments instead of embedding it.
      // Found building 3-3.
      return raw.split("Δ").map(seg => seg.replace(/[$#%&_{}]/g, m => "\\" + m))
        .map(seg => seg ? `\\text{${seg}}` : "").join("\\Delta ");
    }
    // "\\," (thin space) rather than "\\ " (control space) — self-contained, so it
    // survives being the sole content of a math node even after the outer
    // .replace(/\s+/g," ").trim() at the top-level math wrapper call sites strips a
    // trailing literal space. "\\ " alone would trim down to a bare "\", which KaTeX
    // rejects. Found building 6-5 — see AUTOBUILD_LOG.md.
    case "mspace": return "\\,";
    case "msup": {
      // OpenStax's editor sometimes wraps a symbol in an msup with an empty (zero-width
      // space) exponent purely for visual kerning (seen around "∪" joining interval
      // notation, e.g. "(-∞,-2) ∪ (2,∞)" in figure captions) — not a real superscript.
      // An empty "^{}" is harmless to KaTeX, but emitting it is pointless and the
      // zero-width space that used to fill it had no character metrics at all. Unwrap to
      // just the base when the exponent is empty (or maps to nothing but a thin space —
      // the mtext case above turns an all-zero-width-space run into "\," rather than "")
      // after mapping. Found building 3-3.
      const sup = g(1);
      return sup.replace(/\\,/g, "").trim() ? `{${g(0)}}^{${sup}}` : g(0);
    }
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
      // esc() here is required: m2l() can emit literal "<", ">", "&" (inequality signs,
      // \begin{array} column separators, etc.) straight from the MathML text. Left
      // unescaped, a stray "<letter" (e.g. "0<b<1") is parsed by the browser as the start
      // of an HTML tag and corrupts the page. KaTeX's auto-render reads decoded
      // textContent, so escaping here is transparent to it. Found in 6.2/6.4 Key Concepts.
      case "math": out += ` \\(${esc(m2l(c).replace(/\s+/g, " ").trim())}\\) `; break;
      case "term": case "emphasis": out += `<strong>${inline(c)}</strong>`; break;
      case "sub": out += `<sub>${inline(c)}</sub>`; break;
      case "sup": out += `<sup>${inline(c)}</sup>`; break;
      case "link": {
        const tid = c.attrs["target-id"];
        if (tid && figIdMap.has(tid)) out += `<a href="#fig${figIdMap.get(tid)}">Figure ${figIdMap.get(tid)}</a>`;
        else if (tid && tabIdMap.has(tid)) out += `<a href="#tab${tabIdMap.get(tid)}">Table ${tabIdMap.get(tid)}</a>`;
        else if (tid && exampleIdMap.has(tid)) out += `<a href="#example${exampleIdMap.get(tid)}">Example ${exampleIdMap.get(tid)}</a>`;
        else {
          const fallback = inline(c);
          if (fallback) { out += fallback; break; }
          // Only figures/tables/non-coreq examples are resolvable — a link to anything
          // else (an exercise, a glossary term, another module) still falls back to this
          // placeholder. Surface it loudly so a human catches it during hand-polish
          // instead of it silently shipping as "(see original)" — this was the bug behind
          // the 6.2/6.4/6.5 Key Concepts links.
          console.warn(`⚠ unresolved <link target-id="${tid}"> — no matching figure/table/example; emitting "(see original)" placeholder, fix by hand`);
          out += "(see original)";
        }
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
let exN = 0, tryN = 0, exampleN = 0, figN = 0, tabN = 0, warmN = 0, warmExN = 0, reviewExN = 0, practiceExN = 0;
// reviewExN/practiceExN: chapter-end modules (the last section of a chapter) bundle
// "Chapter Review Exercises" and "Practice Test" content after the section's own Section
// Exercises. OpenStax always restarts numbering to 1 for each of those, independently of
// the Section Exercises count and of each other — matching the published book. Found
// building 6-8 (m49368 bundles both after its Section Exercises).
// CNXML id -> assigned number, for resolving <link target-id> refs. Figures/tables number
// sequentially regardless of coreq context (matches the unconditional figN++/tabN++ below);
// examples only count outside the coreq warm-up (matches the exampleN++ in case "example").
let figIdMap = new Map(), tabIdMap = new Map(), exampleIdMap = new Map();
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
        // esc() the LaTeX here too — same reasoning as the inline "math" case above.
        out += `<p>\\[${m ? esc(m2l(m).replace(/\s+/g, " ")) : esc(textOf(c))}\\]</p>\n`;
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
        out += `<div class="tablewrap" id="tab${tabN}"><table class="data"><caption>Table ${tabN}</caption><tbody>` +
          rows.map(r => `<tr>${(r.children || []).filter(e => e.tag === "entry").map(e => `<td>${inline(e)}${blocks(e, ctx)}</td>`).join("")}</tr>`).join("") +
          `</tbody></table></div>\n`;
        break;
      }
      case "example": {
        let label, idAttr = "";
        if (ctx.inCoreq) { warmExN++; label = `Warm-up Example ${warmExN}`; }
        else { exampleN++; label = `Example ${exampleN}`; idAttr = ` id="example${exampleN}"`; }
        out += `<div class="card example${ctx.inCoreq ? " warmup" : ""}"${idAttr}><div class="ex-head"><span class="num">${label}</span><span class="t">${inline(qd(c, "title") || { children: [] })}</span></div>` +
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
        } else if (ctx.inReview) {
          reviewExN++;
          out += `<div class="exercise"><div class="n">${reviewExN}</div><div class="body">${prob ? blocks(prob, ctx) : ""}` +
            (sol ? `<div class="answer"><button>Show answer</button><div class="a">${blocks(sol, ctx)}</div></div>` : "") + `</div></div>\n`;
        } else if (ctx.inPracticeTest) {
          practiceExN++;
          out += `<div class="exercise"><div class="n">${practiceExN}</div><div class="body">${prob ? blocks(prob, ctx) : ""}` +
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
        } else if (/review-exercises/.test(cls)) {
          out += `<h${depth} id="${id}">${t ? inline(t) : "Chapter Review Exercises"}</h${depth}>\n` + blocks(c, { ...ctx, depth: Math.min(depth + 1, 4), inReview: true });
        } else if (/practice-test/.test(cls)) {
          out += `<h${depth} id="${id}">${t ? inline(t) : "Practice Test"}</h${depth}>\n` + blocks(c, { ...ctx, depth: Math.min(depth + 1, 4), inPracticeTest: true });
        } else if (!t && !cls) {
          // A bare <section> with no <title> and no meaningful class is just a grouping
          // wrapper in the source (e.g. OpenStax sometimes splits prose into an untitled
          // <section> right before the next titled one) — emitting a heading for it
          // produces a visible, anchor-less empty <h3></h3> bar in the page. Skip the
          // heading entirely and inline its content at the *same* depth (no new heading
          // level was actually introduced). Found in 3-4 (m51265), the untitled section
          // wrapping the "composite function is a two-step function" intro prose.
          out += blocks(c, { ...ctx, depth });
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
(function collectIds(n, ctx = {}) { // pre-pass: number figures/tables/examples in document order before rendering, so forward <link> refs resolve
  for (const c of n.children || []) {
    if (c.tag === "figure" && c.attrs.id) figIdMap.set(c.attrs.id, figIdMap.size + 1);
    if (c.tag === "table" && c.attrs.id) tabIdMap.set(c.attrs.id, tabIdMap.size + 1);
    if (c.tag === "example" && !ctx.inCoreq && c.attrs.id) exampleIdMap.set(c.attrs.id, exampleIdMap.size + 1);
    const childCtx = (c.tag === "section" && /coreq/.test(c.attrs.class || "")) ? { ...ctx, inCoreq: true } : ctx;
    collectIds(c, childCtx);
  }
})(doc);
const body = blocks(doc, { depth: 2 });

// Book home (topbar brand link) — not the top-level picker hub, which is reached via the
// sidebar's "All books" link instead (see assets/app.js).
const bookHome = `${rootUp}books/${bookId}/index.html`;
const brandLabel = bookId === "college-algebra-2e" ? "MX <span>Algebra</span>" : "MX <span>Calculus</span>";

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
<link rel="stylesheet" href="${rootUp}assets/style.css">
<script defer src="${rootUp}assets/app.js"></script>
</head>
<body data-book="${bookId}">
<header class="topbar">
  <a class="brand" href="${bookHome}">${brandLabel}</a>
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
  Content from <a href="${bookDef.source.url}">${bookDef.source.name}</a> by ${bookDef.source.author}, © OpenStax, licensed under
  <a href="${bookDef.license.url}">${bookDef.license.name}</a>.
  OpenStax is not affiliated with this site and does not endorse it. Access the original free at <a href="https://openstax.org">openstax.org</a>.
</footer>
</main>
</div>
</body>
</html>`;

// fileURLToPath (not raw .pathname) is required here: .pathname stays percent-encoded
// (e.g. a space in a folder name — as in this project's own "OpenStax Viewer" — becomes
// literal "%20" in the string), which then gets treated as a literal-character directory
// name instead of being decoded back to a real path, silently writing to the wrong place.
const outDir = fileURLToPath(new URL(`../${bookDef.sectionsDir}/`, import.meta.url));
mkdirSync(outDir, { recursive: true });
const outPath = fileURLToPath(new URL(`../${bookDef.sectionsDir}/${slug}.html`, import.meta.url));
writeFileSync(outPath, page);
console.log(`Wrote ${bookDef.sectionsDir}/${slug}.html (${page.length.toLocaleString()} chars, ${exN} exercises, ${tryN} try-its, ${exampleN} examples)` +
  (reviewExN || practiceExN ? ` [+ ${reviewExN} chapter-review exercises, ${practiceExN} practice-test exercises]` : ""));
console.log(`Now open assets/app.js and set ready: true for "${slug}" in the "${bookId}" entry of the BOOKS manifest.`);
