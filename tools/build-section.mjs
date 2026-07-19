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
    sectionsDir: "sections/college-algebra-2e",
    brand: "MX Algebra",
    license: { name: "Creative Commons Attribution 4.0", url: "https://creativecommons.org/licenses/by/4.0/" },
    source: { name: "OpenStax College Algebra 2e", url: "https://openstax.org/books/college-algebra-2e", author: "Jay Abramson" },
  },
  "calculus-v1": {
    repo: "osbooks-calculus-bundle",
    sectionsDir: "sections/calculus-v1",
    brand: "MX Calculus",
    license: { name: "Creative Commons Attribution-NonCommercial-ShareAlike 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/" },
    source: { name: "OpenStax Calculus Volume 1", url: "https://openstax.org/books/calculus-volume-1", author: "Gilbert Strang, Edwin “Jed” Herman" },
  },
  "calculus-v3": {
    repo: "osbooks-calculus-bundle",
    sectionsDir: "sections/calculus-v3",
    brand: "MX Calculus",
    license: { name: "Creative Commons Attribution-NonCommercial-ShareAlike 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/" },
    source: { name: "OpenStax Calculus Volume 3", url: "https://openstax.org/books/calculus-volume-3", author: "Gilbert Strang, Edwin “Jed” Herman" },
  },
  "intermediate-algebra-2e": {
    repo: "osbooks-prealgebra-bundle",
    sectionsDir: "sections/intermediate-algebra-2e",
    brand: "MX Algebra",
    license: { name: "Creative Commons Attribution-NonCommercial-ShareAlike 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/" },
    source: { name: "OpenStax Intermediate Algebra 2e", url: "https://openstax.org/books/intermediate-algebra-2e", author: "Lynn Marecek, Andrea Honeycutt Mathis" },
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
// root (every book is scoped under sections/<book-id>/, 2 levels, e.g.
// sections/calculus-v1/2-1.html) — asset/index links in the emitted page must climb
// back out that many levels.
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
const OPS = { "−": "-", "–": "-", "—": "-", "×": "\\times ", "⋅": "\\cdot ", "≈": "\\approx ", "≠": "\\ne ",
  "≤": "\\le ", "≥": "\\ge ", "→": "\\to ", "±": "\\pm ", "∞": "\\infty ", "∈": "\\in ",
  "π": "\\pi ", "⁢": "", "⁡": "", " ": "\\,", " ": "\\,",
  // LaTeX-reserved ASCII characters that sometimes show up as literal text (e.g. "$" for
  // currency, "%" for percent) inside <mi>/<mn>/<mo> — must be escaped or KaTeX either
  // errors (stray $) or silently eats the rest of the line as a comment (stray %).
  "$": "\\$", "#": "\\#", "%": "\\%", "&": "\\&",
  // Literal "{"/"}" used as set-builder braces (e.g. "D={(x,y)|...}") show up as bare
  // <mo>{</mo>/<mo>}</mo> characters, not LaTeX grouping syntax. Left unescaped they're
  // either silently swallowed as invisible LaTeX grouping (when balanced) or, when the
  // matching brace is nested deeper in the tree than the mrow piecewise-brace check below
  // can see, produce an early "}" that breaks a \left\{...\right. wrap outright. Escaping
  // both to \{ / \} makes them visible glyphs instead of grouping chars either way. Found
  // building 5-1/5-2 (m53949/m53963) double-integral region definitions.
  "{": "\\{", "}": "\\}",
  // Empty-set symbol (used in region-decomposition/improper-integral discussions, e.g.
  // 5-1/5-2's "D1 ∩ D2 = ∅") has no default KaTeX glyph. Found building 5-1/5-2.
  "∅": "\\varnothing ",
  // Capital omega (solid regions/domains in triple-integral and PDE sections, e.g. "Ω")
  // and nabla (gradient/divergence/curl operator, ubiquitous in ch. 6 vector calculus)
  // have no default KaTeX glyph in math mode. Found building 4-4/4-5/7-3 and 6-1/6-3/6-4/6-5.
  "Ω": "\\Omega ", "∇": "\\nabla ",
  // Capital delta (rate-of-change notation "Δy/Δx", central to 3.3) has no KaTeX-mapped
  // glyph for the bare Unicode character — renders as an "unknown symbol" warning/tofu
  // box unless mapped to \Delta. Zero-width space (U+200B) shows up as an empty
  // placeholder superscript in some OpenStax figure captions (e.g. the "∪" between
  // increasing/decreasing intervals) and has no KaTeX character metrics at all — strip
  // it outright. Found building 3-3 (m51263). "∆" (U+2206, the dedicated INCREMENT
  // symbol) is a visually-identical but distinct codepoint from the Greek capital
  // delta (U+0394) — OpenStax's editor uses it interchangeably for the same rate-of-
  // change notation (e.g. "Δy/Δx" in 4.1's slope formula). Same fix, different input
  // character. Found building 4-1 (m51270).
  "Δ": "\\Delta ", "∆": "\\Delta ", "​": "",
  // Curly quotes appear as literal characters inside <mo>/<mi> nodes when OpenStax's
  // editor stylistically quotes a symbol *inside* math mode itself (e.g. "read the
  // left side as “f composed with g at x,”" — the quote marks are literal MathML
  // operator/identifier text, not surrounding prose). KaTeX has no font glyph for the
  // bare Unicode curly-quote characters ("Unrecognized Unicode character" warning,
  // strict-mode warn not throw, but visually risks a tofu box) — wrapping them in
  // \text{} routes them through KaTeX's text-mode renderer, which does have the glyph.
  // Found building 3-4 (m51265).
  "“": "\\text{“}", "”": "\\text{”}",
  // Prime (U+2032) is OpenStax's encoding for derivative notation (x′(t), y′(t)) — pervasive
  // in the parametric-curves/vector-calculus modules. No KaTeX glyph for the bare Unicode
  // character (unknownSymbol warning); \prime is the correct command. Found building
  // calculus-v3 1-2 (m53850). Angle (∠, U+2220) and midline ellipsis (⋯, U+22EF) are the
  // same class of bug — literal Unicode math symbol with a direct KaTeX command available
  // (\angle, \cdots) instead of a font glyph. Found building calculus-v3 1-1 (m53834,
  // parametrized-line angle diagrams) and 1-2 (m53850, Riemann-sum "…" notation).
  "′": "\\prime ", "∠": "\\angle ", "⋯": "\\cdots ",
  // Double vertical bar (‖, U+2016, vector norm/magnitude "‖v‖") and angle brackets
  // (〈〉, U+3008/U+3009, component notation "⟨x,y,z⟩") are pervasive throughout the
  // Vectors in Space / Vector-Valued Functions chapters — same class of bug as prime/
  // angle/ellipsis above, no KaTeX glyph for the bare Unicode characters. \Vert, \langle,
  // \rangle are the correct commands. Found building calculus-v3 2-1 (m53900) — over 600
  // unknownSymbol warnings in that one section alone before this fix.
  "‖": "\\Vert ", "〈": "\\langle ", "〉": "\\rangle ",
  // Double prime (″) is the second-derivative counterpart to prime -- same fix,
  // two \prime commands (no single-glyph "\dprime" in KaTeX). Degree sign written as the
  // masculine ordinal indicator (º -- not the real degree sign U+00B0, but this is
  // what OpenStax's editor emits for angle values like "30º") has no glyph either; map
  // to a raised circle. Found building calculus-v3 2-2/3-2/3-3/3-4 (second derivatives of
  // vector-valued functions) and 2-4 (torque angle in degrees).
  "″": "\\prime\\prime ", "º": "^{\\circ}" };
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
    case "mi": case "mn": case "mo": {
      // OpenStax's editor sometimes emits a run of literal underscores as a blank-fill-in
      // placeholder inside a plain <mo> (or occasionally <mi>/<mn>) rather than wrapping it
      // in <mtext> (e.g. m53493's "epsilon-delta" fill-in-the-blank proofs: <mo>_____</mo>
      // used as a blank instead of <mtext>_____</mtext>). Unlike mtext (see below), this
      // path had no underscore-escaping, so a bare "_" reached KaTeX and threw "Expected
      // group after '_'" since underscore means subscript in math mode. Escape underscores
      // here the same way the mtext case already does. Found building calculus-v1 2-5.
      return mtxt(textOf(n)).replace(/_/g, "\\_");
    }
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
      // Characters that are math *commands*, not literal glyphs, have no font metrics
      // inside KaTeX's \text{} mode ("Undefined control sequence" or "No character
      // metrics ... in mode 'text'") when OpenStax's editor embeds them as bare Unicode
      // characters inside an <mtext> node instead of a proper <mi>/<mo>. Originally only
      // "Δ" was special-cased (found building 3-3); generalized into a table so the next
      // one found (π, found building calculus-v3 1-4/1-1 — "2π," inside a text clause;
      // also affects ± tolerance phrases per 3-6) is a one-line addition instead of
      // duplicating the split/interleave logic again. Split the run on any of these
      // delimiters and drop the bare command (valid here since mtext content is always
      // reached from inside an outer math-mode context) between \text{}-wrapped literal
      // segments instead of embedding the character inside \text{}.
      const MATHCMD = { "Δ": "\\Delta ", "±": "\\pm ", "π": "\\pi ", "∠": "\\angle ", "⋯": "\\cdots ", "‖": "\\Vert ", "〈": "\\langle ", "〉": "\\rangle ", "×": "\\times ", "″": "\\prime\\prime ", "º": "^{\\circ}", "′": "\\prime " , "•": "\\bullet ", "θ": "\\theta ", "Ω": "\\Omega ", "∇": "\\nabla " };
      const re = new RegExp(`(${Object.keys(MATHCMD).join("|")})`);
      const parts = raw.split(re);
      return parts.map(seg => MATHCMD[seg] ?? (seg ? `\\text{${seg.replace(/[$#%&_{}]/g, m => "\\" + m)}}` : "")).join("");
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
    case "mover": {
      // OpenStax's editor encodes accent marks (bar/hat/tilde over a variable, e.g. the
      // "sample point" notation t̄ᵢ / t̂ᵢ used in Riemann-sum-style parametric arc length
      // derivations) as a literal ASCII/near-ASCII character in the accent slot rather
      // than a proper combining diacritic — "^" (hat), "˜"/"~" (tilde), "–"/"—"/"−" (bar).
      // The old code fed that raw character through \overset{...}{...} unconditionally:
      // harmless for the dash characters (OPS already maps them to "-", so it degenerates
      // to a thin overline-ish "-" — not exact but doesn't crash) but a hard KaTeX parse
      // error ("Expected group after '^'") for "^", since ^ is the superscript operator in
      // math mode. Recognize the known accent glyphs and emit the correct KaTeX accent
      // command instead of overset. Found building calculus-v3 1-2 (m53850). "¯" (U+00AF,
      // macron) is the same class of bug — College Algebra's line-segment notation
      // (e.g. line segment AB) uses it as the bar glyph. Found building 2-1 (m51252).
      const accentCmd = { "^": "hat", "˜": "tilde", "~": "tilde", "–": "bar", "—": "bar", "−": "bar", "‾": "bar", "¯": "bar" }[textOf(K[1]).trim()];
      return accentCmd ? `\\${accentCmd}{${g(0)}}` : `\\overset{${g(1)}}{${g(0)}}`;
    }
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
      case "math": {
        // OpenStax's source occasionally has a genuinely empty inline <m:math/> stuck
        // mid-sentence (e.g. "Dot product of <m:math/>u and v" — apparently meant to put
        // "u and v" in bold math but the math element itself carries no content). Emitting
        // the usual "\(${content}\)" wrapper unconditionally produces a literal "\(\)" —
        // and because content-between-delimiters is zero characters, verify-section.mjs's
        // (and the browser's actual auto-render's) "\((.+?)\)" matcher can't pair those two
        // delimiters at all (.+? requires >=1 char), so it skips forward and mismatches the
        // stray "\)" against some unrelated LATER "\(" in the page, corrupting an unrelated
        // KaTeX snippet ("Can't use function '\)' in math mode"). Skip the wrapper entirely
        // for empty math nodes — there's nothing to render. Found building calculus-v3 2-3
        // (m53902)'s dot-product summary table.
        const content = esc(m2l(c).replace(/\s+/g, " ").trim());
        if (content) out += ` \\(${content}\\) `;
        break;
      }
      case "term": case "emphasis": out += `<strong>${inline(c)}</strong>`; break;
      case "sub": out += `<sub>${inline(c)}</sub>`; break;
      case "sup": out += `<sup>${inline(c)}</sup>`; break;
      case "link": {
        const tid = c.attrs["target-id"];
        const url = c.attrs.url;
        // The author's own embedded text, if any (e.g. <link target-id="X">Second
        // Derivative Test for Functions of Two Variables.</link>) — always wins over an
        // auto-generated label when present, even if it doesn't quite match the target's
        // canonical name. OpenStax's own published rendering does the same: calculus-v3
        // 4-7 (m53942) has two such links whose target-id actually resolves to a note
        // titled "Fermat's Theorem for Functions of Two Variables" (an upstream CNXML
        // mistargeting), yet openstax.org still shows the author's original wording
        // ("Second Derivative Test for Functions of Two Variables.") as the link text —
        // only the href goes to the (mistargeted) note. An earlier version of this code
        // used the resolved label unconditionally, which would have silently overwritten
        // correct, published wording with a mismatched note title. Found auditing
        // calculus-v3 4-7 for an unrelated numbering-alignment issue.
        const embedded = inline(c);
        let href = null, label = null;
        if (tid && figIdMap.has(tid)) { href = `#fig${figIdMap.get(tid)}`; label = `Figure ${figIdMap.get(tid)}`; }
        else if (tid && tabIdMap.has(tid)) { href = `#tab${tabIdMap.get(tid)}`; label = `Table ${tabIdMap.get(tid)}`; }
        else if (tid && exampleIdMap.has(tid)) { href = `#example${exampleIdMap.get(tid)}`; label = `Example ${exampleIdMap.get(tid)}`; }
        // Equations were missing from this resolution chain entirely — every
        // <link target-id> pointing at an <equation id="..."> (e.g. "use Equation 3.3" —
        // OpenStax auto-numbers ALL equations for cross-reference purposes, including ones
        // marked class="unnumbered" which just means no visible "(N)" printed beside the
        // formula itself) fell straight through to the generic fallback below and shipped
        // as the literal, student-facing text "(see original)". This is the single most
        // common unresolved-link case in the Calculus volumes (derivative-definition
        // formulas are cross-referenced constantly: "use Equation 3.3", "using either
        // Equation 3.4 or Equation 3.5"...). Found in calculus-v1 3-1, just before
        // Exercise 11; audited afterward across every built section.
        else if (tid && eqIdMap.has(tid)) { href = `#eq${eqIdMap.get(tid)}`; label = `Equation ${eqIdMap.get(tid)}`; }
        else if (tid && noteIdMap.has(tid)) { href = `#${esc(tid)}`; label = noteIdMap.get(tid); }
        if (href) out += `<a href="${href}">${embedded || label}</a>`;
        else if (url) {
          // External link (no target-id, just a bare url="..." attribute) — used for the
          // "Media" callouts' applet links (e.g. the epsilon-delta definition applet in
          // 2.5, m53493). The old code only ever checked target-id, so every external
          // <link url="..."> fell through to the target-id-only branch below and emitted
          // its link TEXT with no <a> around it at all — a silently dead, unclickable
          // "link" in every Media callout across every section built so far (16 sections
          // audited 2026-07-13, all 16 affected). Found building calculus-v1 2-5, flagged
          // by the project owner as "Media links seem generally not to be live throughout
          // the sections we've done."
          out += `<a href="${esc(url)}" target="_blank" rel="noopener">${embedded}</a>`;
        }
        else if (embedded) out += embedded;
        else {
          // Figures/tables/non-coreq examples/equations/titled notes are resolvable — a
          // link to anything else (an exercise, an untitled callout, or another module via
          // <link document="...">) still falls back to this placeholder. Surface it loudly
          // so a human catches it during hand-polish instead of it silently shipping as
          // "(see original)" — this was the bug behind the 6.2/6.4/6.5 Key Concepts links,
          // and separately the missing-equation-link bug found in calculus-v1 3-1.
          // verify-section.mjs also hard-fails on the literal placeholder text now, so this
          // can no longer slip through unnoticed even if the warning is missed.
          console.warn(`⚠ unresolved <link target-id="${tid}"> — no matching figure/table/example/equation/note; emitting "(see original)" placeholder, fix by hand`);
          // Cross-module links (<link target-id="X" document="mNNNNN"/>, e.g. "Be Prepared"
          // quiz items referencing an earlier chapter's example) can't be resolved here at
          // all — this module was rendered in isolation, with no numbering map for any other
          // module. Stamp the raw target-id/document into an HTML comment right next to the
          // placeholder so a later cross-module resolver pass (tools/resolve-crossrefs.mjs)
          // can look the target up in the *other* module's own numbering and patch this link
          // in place, instead of a human having to re-derive target-id/document by hand from
          // the original CNXML (which the rendered HTML no longer carries).
          out += `<!--xref target-id="${esc(tid || "")}" document="${esc(c.attrs.document || "")}"-->(see original)`;
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
// CNXML id -> assigned number, for resolving <link target-id> refs. Figures/tables/equations
// number sequentially regardless of coreq context (matches the unconditional figN++/tabN++/
// eqN++ below); examples only count outside the coreq warm-up (matches the exampleN++ in
// case "example").
let figIdMap = new Map(), tabIdMap = new Map(), exampleIdMap = new Map(), eqIdMap = new Map();
// Titled callouts (mostly class="theorem" boxes) referenced by <link target-id> — e.g.
// "Complete the proof of [The Path Independence Test for Conservative Fields]". OpenStax
// renders the link text as the callout's own title, not a number, so this maps straight
// to title HTML rather than a sequential count like the other four maps.
let noteIdMap = new Map();
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
        // id="eqN" only when this equation is an actual <link> target (has an eqIdMap
        // entry) — most equations are never cross-referenced, so most don't need an
        // anchor. eqN still increments for every equation regardless, so numbers stay in
        // sync with the eqIdMap built by the collectIds pre-pass below.
        const idAttr = c.attrs.id && eqIdMap.has(c.attrs.id) ? ` id="eq${eqIdMap.get(c.attrs.id)}"` : "";
        // esc() the LaTeX here too — same reasoning as the inline "math" case above.
        out += `<p${idAttr}>\\[${m ? esc(m2l(m).replace(/\s+/g, " ")) : esc(textOf(c))}\\]</p>\n`;
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
          // A <commentary> ("Analysis") is a continuation of the solution's reasoning, not
          // separate content — OpenStax always places it right after the worked solution,
          // still discussing the same proof/steps. It must be nested INSIDE .sol-body so it
          // hides/shows together with "Show solution"; previously it was appended as a
          // sibling AFTER </div></div> closed the .solution wrapper, so it rendered fully
          // visible before the reader ever clicked "Show solution" — a spoiler, and also an
          // upstream OpenStax authoring quirk this site was blindly reproducing instead of
          // fixing. Found in calculus-v1 2.5 Example 1 (flagged by the project owner);
          // audited afterward and found in 13 already-built sections, 44 occurrences total.
          const comm = qd(c, "commentary");
          const analysisHtml = comm ? `<div class="ex-body analysis"><span class="chip">Analysis</span>${blocks(comm, ctx)}</div>` : "";
          out += `<div class="ex-body">${prob ? blocks(prob, ctx) : ""}</div>` +
            (sol
              ? `<div class="solution"><button class="sol-toggle">Show solution</button><div class="sol-body">${blocks(sol, ctx)}${analysisHtml}</div></div>`
              : analysisHtml);
        } else if (ctx.inCoreq) {
          warmN++;
          out += `<div class="exercise warmup" id="warmex${warmN}"><div class="n">P${warmN}</div><div class="body">${prob ? blocks(prob, ctx) : ""}` +
            (sol ? `<div class="answer"><button>Show answer</button><div class="a">${blocks(sol, ctx)}</div></div>` : "") + `</div></div>\n`;
        } else if (ctx.inReview) {
          reviewExN++;
          out += `<div class="exercise" id="reviewex${reviewExN}"><div class="n">${reviewExN}</div><div class="body">${prob ? blocks(prob, ctx) : ""}` +
            (sol ? `<div class="answer"><button>Show answer</button><div class="a">${blocks(sol, ctx)}</div></div>` : "") + `</div></div>\n`;
        } else if (ctx.inPracticeTest) {
          practiceExN++;
          out += `<div class="exercise" id="practiceex${practiceExN}"><div class="n">${practiceExN}</div><div class="body">${prob ? blocks(prob, ctx) : ""}` +
            (sol ? `<div class="answer"><button>Show answer</button><div class="a">${blocks(sol, ctx)}</div></div>` : "") + `</div></div>\n`;
        } else {
          exN++;
          out += `<div class="exercise" id="ex${exN}"><div class="n">${exN}</div><div class="body">${prob ? blocks(prob, ctx) : ""}` +
            (sol ? `<div class="answer"><button>Show answer</button><div class="a">${blocks(sol, ctx)}</div></div>` : "") + `</div></div>\n`;
        }
        break;
      }
      case "note": {
        const cls = c.attrs.class || "";
        const t = qd(c, "title");
        // Anchor for <link target-id> refs to this note (e.g. "Complete the proof of
        // <link target-id="...">" pointing at a named theorem box) — see noteIdMap below.
        // Reuse the CNXML id directly rather than renumbering; unlike figures/tables/
        // examples/equations, the rendered link text is the callout's own title, not a
        // number, so there's no sequence to keep in sync.
        const idAttr = c.attrs.id ? ` id="${esc(c.attrs.id)}"` : "";
        // "try" is College Algebra's CNXML class for these self-check callouts;
        // "checkpoint" is the equivalent class used in the Calculus bundle's CNXML.
        // Both render as the same .tryit self-check block (CLAUDE.md section-page contract).
        if (/\btry\b/.test(cls) || /\bcheckpoint\b/.test(cls)) { out += blocks(c, { ...ctx, inTry: true }); }
        else if (/how-to/.test(cls)) out += `<div class="card howto"${idAttr}><span class="chip">How To</span>${blocks(c, ctx)}</div>\n`;
        else if (/\bqa\b/.test(cls)) out += `<div class="card qa"${idAttr}><span class="chip">Q&amp;A</span>${blocks(c, ctx)}</div>\n`;
        else if (/media/.test(cls)) out += `<div class="card callout"${idAttr}><span class="chip">Media</span>${blocks(c, ctx)}</div>\n`;
        else out += `<div class="card definition"${idAttr}><span class="chip">${t ? inline(t) : "Definition"}</span>${blocks(c, ctx)}</div>\n`;
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
    if (c.tag === "equation" && c.attrs.id) eqIdMap.set(c.attrs.id, eqIdMap.size + 1);
    if (c.tag === "note" && c.attrs.id) { const t = qd(c, "title"); if (t) noteIdMap.set(c.attrs.id, inline(t)); }
    const childCtx = (c.tag === "section" && /coreq/.test(c.attrs.class || "")) ? { ...ctx, inCoreq: true } : ctx;
    collectIds(c, childCtx);
  }
})(doc);
const body = blocks(doc, { depth: 2 });

// Book home (topbar brand link) — not the top-level picker hub, which is reached via the
// sidebar's "All books" link instead (see assets/app.js).
const bookHome = `${rootUp}books/${bookId}/index.html`;
const brandText = bookDef.brand;
const brandLabel = brandText.replace(/^(\S+)\s+(.+)$/, "$1 <span>$2</span>");

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · ${brandText}</title>
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
