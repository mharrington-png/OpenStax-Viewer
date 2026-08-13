#!/usr/bin/env node
// Converts one Active Calculus - Multivariable (1st edition) section from its PreTeXt/
// MathBook-XML source into a viewer page matching sections/<book>/<slug>.html conventions.
//
// This book is NOT OpenStax and reads differently — no sol-hints or Try-Its (those are
// OpenStax-specific structures), built around Activities and navigable subsections instead.
// Images are hotlinked straight from the source repo (no Desmos pass yet).
//
// WeBWorK exercises ARE rendered, not flagged — see resolveWebworkProblems() below: each one
// is rendered once (fixed problemSeed, so the same version every rebuild) via a direct POST
// to the same public webwork-ptx.aimath.org test server pretext itself would use, bypassing
// pretext's own asset-generation pipeline (which has an unrelated bug against this book's
// pre-merged source — see conversation history / CLAUDE.md if resurrecting that path
// instead). No live grading backend, so answer blanks are just visual blanks; the graded
// answer value itself (from <answerhashes>, present for every problem regardless of whether
// it has an authored solution narrative) is shown behind the same "Show answer" toggle
// already used elsewhere in this codebase — deliberately just the final answer, not a
// worked solution, matching how this book's other exercises behave.
//
// Sage interactives have no static fallback and genuinely can't be embedded from a section
// converter alone — those are still rendered as a visible "flagged" callout instead of
// silently dropped, so they're easy to find and revisit once there's a plan for them.
//
// Usage: node tools/build-acm-section.mjs --src "S-9-1-Functions.mbx" --srcdir "C:\...\AC3PreTeXt\src" --repo ac3 --chapter 9 --section 1 --out sections/active-calculus-multivariable/9-1.html
//   --repo ac3     images hotlink to raw.githubusercontent.com/StevenSchlicker/AC3PreTeXt/master/source/images/...
//   --repo vector  images hotlink to raw.githubusercontent.com/active-calculus/active-calculus-vector/first-edition/source/assets/images/... (ch. 12)

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, arr) => {
    if (arg.startsWith("--")) pairs.push([arg.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : "true"]);
    return pairs;
  }, [])
);
for (const req of ["src", "srcdir", "repo", "chapter", "section", "out"]) {
  if (!args[req]) { console.error(`Missing --${req}`); process.exit(1); }
}
const CHAPTER = +args.chapter, SECTION = +args.section;

const IMAGE_BASE = {
  // AC3PreTeXt's top-level source folder is named "src", NOT "source" (unlike the vector
  // repo below) — confirmed by curl against raw.githubusercontent.com directly after every
  // image on the page 404'd silently (existsSync against the local clone's own "src" dir
  // matched fine, so this only broke the deployed URL, not the build).
  ac3: "https://raw.githubusercontent.com/StevenSchlicker/AC3PreTeXt/master/src/",
  // Images actually live under the repo's top-level "assets/" folder (a sibling of "source/",
  // matching IMAGE_LOCAL_DIR below), NOT "source/" itself -- confirmed directly: a "source/"
  // URL 404s, an "assets/" one 200s (found via 12.1's fig_Vector_VectorFields_FluidVelocity,
  // whose <image source="/12_1_PIVlab_multipass.jpg"> silently failed to resolve because of
  // this, not because the image is genuinely missing).
  vector: "https://raw.githubusercontent.com/active-calculus/active-calculus-vector/first-edition/assets/",
}[args.repo];
if (!IMAGE_BASE) { console.error(`Unknown --repo "${args.repo}", expected "ac3" or "vector"`); process.exit(1); }
// vector repo's images live under assets/images/ (a sibling of source/), not source/images/
const IMAGE_LOCAL_DIR = args.repo === "vector" ? join(args.srcdir, "..", "assets") : args.srcdir;

/* ------------------------------------------------------------------ */
/* Minimal dependency-free XML parser (same as tools/build-activity-workbook.mjs) */
/* ------------------------------------------------------------------ */
// Shared by both text-node content AND attribute values below -- WeBWorK's render_rpc
// XML-escapes "<"/">" inside attributes like correct_ans_latex_string (e.g. a Value (Vector)
// answer's "\left<...\right>" comes back as "\left&lt;...\right&gt;"). Attribute values were
// previously left raw, so that escaped text survived into our own esc() call later and got
// escaped a SECOND time -- "&lt;" printed literally on the page as "&amp;lt;".
function decodeXmlEntities(text) {
  return text
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d));
}
function parseXML(s) {
  let i = 0;
  function node(tag) { return { tag, attrs: {}, children: [] }; }
  function parseAttrs(str, n) {
    const re = /([\w:-]+)\s*=\s*"([^"]*)"/g; let m;
    while ((m = re.exec(str))) n.attrs[m[1].replace(/^\w+:/, "")] = decodeXmlEntities(m[2]);
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
        if (text) out.push({ tag: "#text", text: decodeXmlEntities(text) });
        i = nxt === -1 ? s.length : nxt;
      }
    }
    return out;
  }
  return { tag: "#root", attrs: {}, children: walk() };
}

// The vector-calculus repo (chapter 12) splits content across files via <xi:include> --
// parseXML() already strips the "xi:" namespace prefix generically, so these arrive as plain
// <include href="..." parse="..."/> nodes. Two flavors appear: parse="text" (raw Sage source
// for a <slate>, e.g. interacts/CCA-DD1.txt -- must NOT be XML-parsed, it can contain bare <
// and & that would corrupt the tree) and the default/xml mode (a whole exercises file,
// spliced in as if its top-level children had been written inline). Resolved as a tree walk
// BEFORE indexAndNumber/rendering, mutating children arrays in place via splice.
function resolveIncludes(node, dir) {
  if (!node.children) return;
  for (let i = 0; i < node.children.length; i++) {
    const c = node.children[i];
    if (c.tag === "include" && c.attrs.href) {
      const filePath = join(dir, c.attrs.href);
      if (!existsSync(filePath)) {
        console.warn(`xi:include not found: ${filePath}`);
        node.children.splice(i, 1); i--; continue;
      }
      const raw = readFileSync(filePath, "utf8");
      if (c.attrs.parse === "text") {
        node.children.splice(i, 1, { tag: "#text", text: raw });
      } else {
        const includedRoot = parseXML(raw);
        resolveIncludes(includedRoot, join(filePath, ".."));
        node.children.splice(i, 1, ...includedRoot.children);
        i += includedRoot.children.length - 1;
      }
      continue;
    }
    resolveIncludes(c, dir);
  }
}

const esc = s => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// WeBWorK's own PG problems write vector angle brackets as \left<...\right> or bare
// \lt...> (plain less/greater-than) instead of this book's own \langle/\rangle convention --
// but \lt/\gt are ALSO genuine "less than"/"greater than" comparisons elsewhere in the
// AC3PreTeXt source itself (e.g. "\cos(\theta) \lt 0" in the orthogonality discussion), so
// only convert a \lt that has an actual matching \gt/> closing it later in the same string --
// a real comparison never has that pairing, and KaTeX already renders bare \lt/\gt correctly
// as "<"/">" on its own, so leaving them untouched is exactly right.
// Some WeBWorK PG source embeds raw HTML tags (e.g. <B><I>u</I></B> for a bold-italic
// variable name) but escapes the angle brackets as \lt/&gt; instead of writing them
// literally -- "\lt B&gt;\lt I&gt;u\lt /B&gt;\lt /I&gt;" for what should just be "u". Left
// alone, the vector-bracket normalization below (correctly) treats \lt...&gt; as an opening/
// closing pair and "resolves" it into nonsense \langle-wrapped soup. A real vector's \lt...>
// always holds a number/expression list; a bare short word (optionally "/"-prefixed) between
// them never is one, so it's safe to recognize and drop these as broken tags instead.
const stripBrokenHtmlTags = tex => tex.replace(/\\lt\s*\/?[A-Za-z]+\s*(?:&gt;|>)/g, "");
// The replacement string needs a space (or some non-letter) right after "\langle" -- without
// one, content starting with a letter (e.g. "t-(4+4s),...") merges directly onto the command
// name, producing an invalid "\left\langlet-..." that TeX parses as the undefined control
// sequence "\langlet" (found in 11.6's plane-parameterization answer).
const normalizeAngleBrackets = tex => stripBrokenHtmlTags(tex || "")
  .replace(/\\left\s*(?:\\lt|<)([^<>]*)\\right\s*(?:\\gt|>)/g, "\\left\\langle $1\\right\\rangle")
  .replace(/\\lt\s*([^<>]*?)\s*(?:\\gt|>)/g, "\\langle $1 \\rangle");
const qd = (n, tag) => (n.children || []).find(c => c.tag === tag);
const qda = (n, tag) => (n.children || []).filter(c => c.tag === tag);
// <idx> (index entry) is invisible printed-index metadata that can appear nested inside a
// <title> (e.g. "Change of Variables in a Double Integral<idx><h>change of variable</h>
// <h>double integral</h></idx>") -- textOf() recurses through every tag indiscriminately, so
// without this it leaked the index terms' own text directly into visible titles (11.9's
// "Change of Variables in a Double Integralchange of variabledouble integral" callout).
function textOf(n) {
  if (n.tag === "#text") return n.text;
  if (n.tag === "idx") return "";
  return (n.children || []).map(textOf).join("");
}
function titleOf(n) {
  const t = qd(n, "title");
  return t ? textOf(t).trim() : "";
}
function isInstructorOnly(n) { return n.attrs && n.attrs.component === "instructor"; }

/* ------------------------------------------------------------------ */
/* Numbering + id index — activities and figures/tables share one counter each per section, */
/* matching the live site (confirmed against activecalculus.org/multi1e — e.g. Preview       */
/* Activity 9.1.1, Activity 9.1.2, ... one sequence; Table/Figure likewise one sequence).    */
/* ------------------------------------------------------------------ */
const idIndex = new Map();
const activityLabels = new Map(); // node -> "Activity 9.1.4" / "Preview Activity 9.1.1"
const figureLabels = new Map();   // node -> "Figure 9.1.7" / "Table 9.1.1"
const equationLabels = new Map(); // node -> "9.4.1" (bare number -- see displayMath/xref)
// node -> the anchor id actually rendered in the HTML for this equation (its own xml:id, or a
// synthetic fallback derived from the label if it has none -- see indexAndNumber). A row
// within a multi-row block maps to the PARENT block's anchor, since only the parent gets a
// rendered <span id>; using the row's own (never-rendered) id here would be a dead link.
const equationAnchors = new Map();
const exerciseLabels = new Map(); // node -> N (bare number, matches the rendered .n counter)
// <fn> (footnote) content used to get spliced directly into the middle of the surrounding
// sentence via inline()'s default kids() fallback -- e.g. "important fact<fn>As we saw in
// ...</fn> that the plane..." rendered as one garbled run-on sentence with the footnote body
// injected mid-clause. Collected here in encounter order and rendered as a real numbered
// footnote (superscript marker + a Footnotes list at the end of the section, same convention
// as a printed textbook) instead.
const footnotes = [];
const exampleLabels = new Map();  // node -> "Example 9.8.1" (a narrative worked example, own counter)
// Exercises get a plain sequential number (1, 2, 3, ...), shared between WeBWorK and plain
// exercises in document order — a different scheme than activities/figures, confirmed
// against the live site's own exercise numbering for this section. Counted here too (not
// just at render time by `exerciseCounter`) so an <xref> earlier in the page can resolve a
// later exercise's number before that exercise itself has actually been rendered yet.
let exerciseCounter = 0;
function indexAndNumber(node, counters = { act: 0, fig: 0, eq: 0, exn: 0, ex: 0 }) {
  if (node.attrs && node.attrs.id) idIndex.set(node.attrs.id, node);
  if (node.tag === "exploration" || node.tag === "activity") {
    counters.act++;
    activityLabels.set(node, `${node.tag === "exploration" ? "Preview Activity" : "Activity"} ${CHAPTER}.${SECTION}.${counters.act}`);
  }
  // <example> is a plain narrative worked example (no statement/solution split, unlike
  // OpenStax's Try-It-bearing examples) -- own counter, first seen in this book at 9.8.
  if (node.tag === "example") {
    counters.ex++;
    exampleLabels.set(node, `Example ${CHAPTER}.${SECTION}.${counters.ex}`);
  }
  if (node.tag === "figure" || node.tag === "table") {
    counters.fig++;
    figureLabels.set(node, `${node.tag === "figure" ? "Figure" : "Table"} ${CHAPTER}.${SECTION}.${counters.fig}`);
  }
  // <men>/<mdn> are PreTeXt's NUMBERED display-math variants (vs. <me>/<md>, unnumbered) --
  // only these get a number, matching which equations the source actually labels/cross-refers.
  if (node.tag === "men" || node.tag === "mdn") {
    counters.eq++;
    const eqLabel = `${CHAPTER}.${SECTION}.${counters.eq}`;
    const anchor = anchorId(node) || `eq-${eqLabel.replace(/\./g, "-")}`;
    equationLabels.set(node, eqLabel);
    equationAnchors.set(node, anchor);
    // A multi-row <mdn> only gets ONE shared \tag{} (and one rendered <span id>) for the whole
    // block, but its individual <mrow> children often carry their own xml:id for a same-page
    // <xref> to point at just that row (e.g. "using Equations <xref ref="row1"/> and <xref
    // ref="row2"/>"). Without this, such an xref finds no equationLabels entry for the row
    // itself and falls through to an empty, unlabeled link -- give each row the parent
    // block's label AND its actual rendered anchor (the row's own id is never rendered).
    for (const row of qda(node, "mrow")) { equationLabels.set(row, eqLabel); equationAnchors.set(row, anchor); }
  }
  if (node.tag === "exercise") {
    counters.exn++;
    exerciseLabels.set(node, counters.exn);
  }
  for (const c of node.children || []) indexAndNumber(c, counters);
}

/* ------------------------------------------------------------------ */
/* WeBWorK: render each problem once via the same public test server    */
/* pretext itself uses (webwork-ptx.aimath.org, anonymous course),      */
/* with a FIXED problem seed for reproducibility, and embed the result  */
/* directly instead of flagging it as unintegrated. Verified by hand    */
/* against the render_rpc endpoint directly — pretext's own asset-      */
/* generation pipeline has an unrelated bug that made it unusable, but  */
/* the underlying server call it wraps works fine called directly.      */
/* ------------------------------------------------------------------ */
const WEBWORK_ENDPOINT = "https://webwork-ptx.aimath.org/webwork2/render_rpc";
const WEBWORK_SEED = "1"; // fixed, not per-student -- same rendering every rebuild
const webworkCache = new Map(); // <webwork> node -> parsed <webwork> response node
const webworkAnswers = new Map(); // <webwork> node -> array of answer HTML strings to reveal

// render_rpc's <answerhashes> only comes back populated for plain fill-in-the-blank answers
// (Value/Formula/etc.) -- multiple-choice, matching, and pop-up-list problems come back with
// <answerhashes /> empty, because this anonymous test course has no grading/session state to
// evaluate a submission against (confirmed: submitting answersSubmitted=1 with candidate
// values didn't populate it either). Same limitation shows up PARTIALLY on multi-part problems
// that mix a graded fill-in with an ungraded <var form="buttons"> choice in the same problem —
// the hash covers the fill-in only and silently drops the choice part, which is easy to miss
// since the exercise still renders "an answer," just not all of them (caught this via the
// answer-count check below, not by eyeballing every problem).
//
// For any part missing from <answerhashes>, the correct answer was worked out by hand — by
// reading the problem's OWN embedded answer key in its .pg source (the qa()/new_match_list
// pairs), not guessed, then cross-checked against the actual math independently — and hardcoded
// here. Tied to WEBWORK_SEED="1" above: if that ever changes, every entry here needs
// re-deriving, since the random parameters (and therefore which choice is correct) would
// change with it. Keyed by the problem's own sourceFilePath; values are in the same order the
// blanks/parts appear in the rendered statement — including any part(s) render_rpc DID supply a
// hash for, since an entry here replaces the whole answer array, not just the missing pieces.
// Add to this table whenever a newly-converted section's build log warns of an answer-count
// mismatch — same process: read the source, verify the math, add the entry, don't guess.
const MANUAL_WEBWORK_ANSWERS = {
  "Library/FortLewis/Calc3/12-3-Contour-diagrams/HGM4-12-3-22-Contour-diagrams.pg":
    ["Hyperbolas", "Ellipses", "Parabolas", "Lines"],
  "Library/Rochester/setVmultivariable1Functions/UR_VC_5_1.pg": [
    "E) a collection of equally spaced parallel lines",
    "D) a collection of unequally spaced concentric circles",
    "F) a collection of equally spaced concentric circles",
    "C) a collection of concentric ellipses",
    "A) a collection of unequally spaced parallel lines",
    "B) two straight lines and a collection of hyperbolas",
    "D) a collection of unequally spaced concentric circles",
  ],
  "Library/FortLewis/Calc3/12-1-Two-variable-functions/HGM4-12-1-28-Functions-of-two-variables.pg":
    ["A cone opening along the x-axis", "\\(x^2 = y^2 + z^2\\)"],
  "Library/FortLewis/Calc3/12-2-Multivariable-graphs/HGM4-12-2-11-Multivariable-functions-graphs.pg":
    ["Plate", "Bowl", "Neither", "Bowl", "Plate"],
  // f(x,t) = 30t·e^(-(4-x)t); f(3,2) = 60e^-2 ≈ 8.12012 (this part IS in <answerhashes>, kept
  // verbatim). The interpretation choice is not: x is dose (mg), t is time (hr) since injection,
  // and C = f(x,t) is concentration, so f(3,2) is the concentration of a 3 mg dose 2 hours after
  // injection — matches choice 1, not the "amount" or swapped-dose/time decoys.
  "Library/FortLewis/Calc3/12-2-Multivariable-graphs/HGM4-12-2-16-Multivariable-functions-graphs.pg":
    ["\\(8.12012\\)", "the concentration of a 3 mg dose in the blood 2 hours after injection."],
  // P(a,b) = 260a + 430b - 300 (in <answerhashes>, kept verbatim) is linear in a and b, so its
  // level curves (constant-profit curves) are lines, not any of the other listed conic shapes.
  "Library/FortLewis/Calc3/12-3-Contour-diagrams/HGM4-12-3-24-Contour-diagrams.pg":
    ["\\(260a+430b-300\\)", "lines"],
  // Embedded answer key in the .pg source: $mc->qa(..., "positive") -- also matches the math:
  // a supportive/aligned force and Luke point the "same direction," so their dot product is
  // positive (dot product is negative for opposing directions, zero for perpendicular).
  "Library/Rochester/setVectors2DotProduct/UR_VC_1_F.pg": ["positive"],
  // A bare true/false list with no per-item widget in the PTX render at all (<answerhashes />
  // empty, and no <fillin>/<var>/popup-<ul> for render_rpc to have graded even if it could) --
  // worked out directly from the definitions, not guessed:
  // (i) (i×j)·k = k·k = 1; i·(j×k) = i·i = 1 -- equal, TRUE.
  // (ii) v×w is always orthogonal to v (a core cross-product property), so v·(v×w) = 0 -- TRUE.
  // (iii) ||v+w|| = ||v||+||w|| only holds when v, w point the same direction, not for any two
  // vectors (triangle inequality is generally strict) -- FALSE.
  // (iv) ||cv|| = |c| ||v||, not c||v|| -- fails whenever c < 0 -- FALSE.
  "Library/FortLewis/Calc3/13-4-Cross-product/HGM4-13-CYU-01-The-cross-product.pg":
    ["True", "True", "False", "False"],
  // WeBWorK's own correct_ans_latex_string renders unsimplified "2*t*t" as literally "2tt"
  // (unexponentiated -- easy to misread as two different variables juxtaposed). With x=t:
  // y = 2x^2 = 2t^2 (from the cylinder); z = 2x^2+5y^2 = 2t^2+5(2t^2)^2 = 2t^2+20t^4 (from the
  // paraboloid) -- both verified independently, just retypeset with a real exponent.
  "Library/Dartmouth/setStewartCh14S1/problem_4.pg": ["\\(2t^2\\)", "\\(2t^2+20t^4\\)"],
  // Another bare true/false list with no per-item widget in the PTX render (<answerhashes />
  // empty). Worked out directly:
  // (i) direction vector is <0,5,1>, not parallel to the x-axis's <1,0,0> -- FALSE.
  // (ii) x=e^t, y=t gives y=ln(x) since ln(e^t)=t, and x=e^t covers all of x>0 as t ranges
  // over all reals -- TRUE.
  // (iii) x=(3t+4)^2, y=5x-9 is linear in x; on 0<=t<=3, 3t+4 is positive and increasing so
  // x=(3t+4)^2 increases monotonically from 16 to 169 with no retracing -- a genuine segment,
  // not just a subset of the line -- TRUE.
  "Library/FortLewis/Calc3/17-1-Parametrized-curves/HGM4-17-CYU-04-06-10-Parametrized-curves.pg":
    ["False", "True", "True"],
  // Part (c)'s raw correct_ans is "-i+10k+(t-5)*-3.14159j+2k" (note the "*") but
  // correct_ans_latex_string drops the multiplication sign entirely -- "\left(t-5\right)
  // -3.14159j+2k" reads as SUBTRACTING 3.14159j, not scaling the velocity vector by (t-5).
  // Parenthesizing the velocity vector restores the actual meaning without changing the math.
  "Library/FortLewis/Calc3/17-2-Motion-velocity/HGM4-17-2-30-Motion-velocity-acceleration.pg":
    ["\\(5\\)", "\\(-3.14159\\boldsymbol{j}+2\\boldsymbol{k}\\)", "\\(-\\boldsymbol{i}+10\\boldsymbol{k}+(t-5)(-3.14159\\boldsymbol{j}+2\\boldsymbol{k})\\)"],
  // This problem's own answer evaluator is broken server-side (<answerhashes> literally
  // returns correct_ans="No correct answer specified", type="Undefined answer evaluator
  // type" -- not an empty-hash case, an actually broken one). Solved independently: range
  // R = v0^2 sin(2*theta)/g (level launch and landing), so sin(2*theta) = R*g/v0^2 =
  // 190*9.8/50^2 = 0.7448, giving theta = arcsin(0.7448)/2 ≈ 0.420 rad (the low-trajectory
  // solution; 1.151 rad also hits the target but is the conventional "high arc" alternative).
  "Library/maCalcDB/setVecFunction3Motion/ur_vc_4_8.pg": ["\\(0.420\\)"],
  // Embedded answer key ($mca->qa(..., "z_{yy} = 0")) -- also matches the math: z = f(x) +
  // y*g(x), so z_y = g(x) (f(x) and y*g(x) don't depend on y beyond that factor), and
  // z_yy = d/dy[g(x)] = 0 since g(x) doesn't depend on y at all.
  "Library/FortLewis/Calc3/14-7-Second-order-partials/HGM4-14-7-34-Second-order-partials.pg":
    ["\\(z_{yy} = 0\\)"],
  // z = x^2-y^3 at (4,1): z(4,1)=15, z_x(4,1)=2(4)=8, z_y(4,1)=-3(1)^2=-3, so the correct
  // tangent plane is z=15+8(x-4)-3(y-1) (matches AnSwEr0002, kept verbatim). The student's
  // answer z=15+2x(x-4)-3y^2(y-1) used the UNevaluated partials (2x, -3y^2) as coefficients
  // instead of their values at the point, which is also why the result is quadratic, not
  // linear -- checkbox correct_choices ["B2","B3"] match those same two listed mistakes (the
  // hash's own text is truncated with "..." so quoted here in full instead).
  "Library/FortLewis/Calc3/14-3-Local-linearity/HGM4-14-3-14-Local-linearity-differential.pg": [
    "The partial derivatives were not evaluated at the point, and the answer is not a linear function.",
    "\\(z=15+8(x-4)-3(y-1)\\)",
  ],
  // Only part (a)'s answer came back with a real hash (correct_ans="B" = "it decreases
  // slightly", matching AnSwEr0001's type="checkbox_cmp"); parts (b) and (c) have their own
  // <var>/<fillin> widgets but no hash at all. dU = 840 dV + 27.32 dT:
  // (a) dV=0, dT<0 (slight cooling) -> dU=27.32*dT<0 -- "it decreases slightly".
  // (b) dT=0, dV>0 (slight increase) -> dU=840*dV>0 -- "it increases slightly".
  // (c) dV=-500 cm^3=-0.0005 m^3 (compressed), dT=+6 K ->
  //     dU = 840*(-0.0005) + 27.32*6 = -0.42 + 163.92 = 163.5 J.
  "Library/FortLewis/Calc3/14-3-Local-linearity/HGM4-14-3-24-Local-linearity-differential.pg": [
    "it decreases slightly", "it increases slightly", "\\(163.5\\text{ J}\\)",
  ],
  // T(x,y) = 110/(x^2+y^2+4). render_rpc's own hashes here are shifted/incomplete: the var-
  // buttons choice DOES get a hash (unusual -- type="str_cmp", correct_ans="D"), but the very
  // last blank (minimum rate of change) has no hash at all, so the 6 hashes present cover only
  // 6 of the 7 blanks (this is what the answer-count check actually caught). Verified directly:
  // level curves x^2+y^2+4=k (k>4) are circles -- (D). Max at (0,0): T(0,0)=110/4=27.5.
  // grad T = (-220x, -220y)/(x^2+y^2+4)^2; at (3,3), x^2+y^2+4=22, so grad T =
  // (-660/484, -660/484) = <-1.36364, -1.36364> (direction of steepest increase), matching
  // AnSwEr0004 (kept verbatim). |grad T| = 1.36364*sqrt(2) = 1.92847 = the maximum rate of
  // increase (AnSwEr0005, verbatim). Steepest decrease direction is -grad T = <1.36364,
  // 1.36364> (AnSwEr0006, verbatim), and its rate is simply -|grad T| = -1.92847 (the missing
  // 7th answer, derived here, not guessed).
  "Library/FortLewis/Calc3/14-4-Gradients-in-plane/HGM4-14-4-66-Gradients-etc.pg": [
    "D) circles",
    "\\(\\left(0,0\\right)\\)",
    "\\(27.5\\)",
    "\\(\\left\\langle-1.36364,-1.36364\\right\\rangle\\)",
    "\\(1.92847\\)",
    "\\(\\left\\langle1.36364,1.36364\\right\\rangle\\)",
    "\\(-1.92847\\)",
  ],
  // Another bare true/false list with no per-item widget (<answerhashes /> empty). Worked out
  // directly:
  // (1) The gradient is PERPENDICULAR to the contour, not tangent to it (this section's own
  //     "Direction of the Gradient" result) -- FALSE.
  // (2) D_u f(a,b) = grad f . u. If grad f = 0, this is 0 for every direction; if grad f != 0,
  //     it's 0 for the direction(s) perpendicular to grad f -- a zero-rate direction always
  //     exists either way -- TRUE.
  // (3) Zero partials at one point says nothing about other points, e.g. f=x^2+y^2 has
  //     f_x=f_y=0 only at the origin -- FALSE.
  // (4) f_u(a,b) is a scalar; it can equal 0 but never equals the vector <0,0> -- FALSE.
  // (5) f_u(a,b) = grad f . u = |grad f| cos(theta) equals |grad f| only when u points along
  //     the gradient, not for an arbitrary u -- FALSE.
  // (6) grad f for f(x,y) has exactly 2 components (one per independent variable), not 3 --
  //     FALSE.
  // (7) f_u(a,b) is always a scalar, regardless of u being a unit vector -- FALSE.
  // (8) f_u(a,b) is a scalar; "parallel to a vector" isn't a meaningful relation for a scalar
  //     -- FALSE.
  "Library/FortLewis/Calc3/14-5-Gradients-in-space/HGM4-14-CYU-01-Gradients-etc.pg": [
    "False", "True", "False", "False", "False", "False", "False", "False",
  ],
  // Earth-pile problem (problemSeed=1: height 9m, cross-section x^2+y^2=9-z, 0<=z<=9) -- a
  // solid disk of radius^2=9-z, area A(z)=pi(9-z). <answerhashes> only returns 4 of the 6
  // blanks (the two multiple-choice equation parts (a)/(c), correct_ans "D"/"A" -- confirmed
  // against the exercise's own listed choices: (a) x^2+y^2=9 is choice D, (c) at z=7,
  // x^2+y^2=9-7=2 is choice A -- and the two numeric area parts (b)/(d): pi*9=28.2743 and
  // pi*(9-7)=2*pi, both kept verbatim). Parts (e) and (f) -- the general formula A(z) and the
  // total volume -- have no hash at all, so derived directly: A(z)=pi(9-z), and Volume =
  // integral from 0 to 9 of pi(9-z) dz = pi[9z-z^2/2] from 0 to 9 = pi(81-40.5) = 40.5*pi.
  "Library/FortLewis/Calc3/16-1-Double-integrals/HGM4-16-1-32-Double-integrals.pg": [
    "D", "\\(28.2743\\)", "A", "\\(2\\pi\\)", "\\(\\pi(9-z)\\)", "\\(40.5\\pi\\)",
  ],
  // Bare multiple-choice with no <answerhashes> at all. r=3/cos(theta) means r*cos(theta)=3,
  // i.e. x=3 (a vertical line, in Cartesian); theta ranges from 0 (y=0) to pi/4 (y=x). So the
  // region is bounded by y=0, y=x, and x=3 -- matches choice B exactly.
  "Library/FortLewis/Calc3/16-4-Polar-integrals/HGM5-16-4-14-Double-integrals-polar.pg": ["B"],
  // MultiAnswer type: ONE answerhash entry (AnSwEr0001) bundles all 9 table cells' values as a
  // single HTML table in correct_ans_latex_string, but countWebworkBlanks() sees 9 individual
  // <fillin>s (AnSwEr0001 + 8 MuLtIaNsWeR_AnSwEr0001_N). Unpacked here in the hash's own given
  // row-major order (kept verbatim, not independently recomputed) -- also verified directly:
  // F(x,y)=<-2y,2x>, e.g. F(-1,1)=<-2,-2> (row y=1, col x=-1), matches the first entry exactly.
  "Library/Hope/Multi2/12-01-Vector-fields/Vector-fields-01a.pg": [
    "\\(\\langle-2,-2\\rangle\\)", "\\(\\langle-2,0\\rangle\\)", "\\(\\langle-2,2\\rangle\\)",
    "\\(\\langle0,-2\\rangle\\)", "\\(\\langle0,0\\rangle\\)", "\\(\\langle0,2\\rangle\\)",
    "\\(\\langle2,-2\\rangle\\)", "\\(\\langle2,0\\rangle\\)", "\\(\\langle2,2\\rangle\\)",
  ],
  // "Match the plot" multiple-choice with <answerhashes /> empty -- the 4 candidate plots are
  // only ephemeral generated images (no way to bake a fixed answer key from the XML alone), so
  // downloaded and visually inspected all 4 directly. F=<9(x+1),y> has positive divergence
  // (9+1=10>0, points AWAY from x=-1) and zero curl (no rotation). Plot 1 and Plot 2 both show
  // clear rotational/spiral patterns (nonzero curl) -- wrong. Plot 3 shows pure INWARD
  // convergence (negative divergence) -- wrong sign. Plot 4 is the only one showing pure
  // outward radiation with no rotation, matching this field's actual divergence/curl exactly.
  // Keyed by the RAW source path (this repo's own long prefix), not the normalized one --
  // MANUAL_WEBWORK_ANSWERS is looked up by n.attrs.source verbatim, before normalization.
  "webwork-open-problem-library/OpenProblemLibrary/WHFreeman/Rogawski_Calculus_Early_Transcendentals_Second_Edition/16_Line_and_Surface_Integrals/16.1_Vector_Fields/16.1.15.pg": ["Plot 4"],
};

// Some WeBWorK problems' generated graphs come back from render_rpc as something we can't
// embed (see embedWebworkImage's .tgz case) -- but the SAME problem, rendered as part of the
// published activecalculus.org build, has its generated image hosted at a stable, permanent
// URL under activecalculus.org/multi1e/generated/webwork/images/ (confirmed live, 200 image/png
// -- not vendored in the AC3PreTeXt GitHub repo itself, so this is a hotlink to the published
// book's own asset, same idea as convention 6's OpenStax image hotlinking). Found by loading
// the problem's live page and reading its <img src>. Add an entry here whenever a WeBWorK image
// can't be embedded and the live book has it, instead of leaving a "not available" flag.
const MANUAL_WEBWORK_IMAGES = {
  "Library/Michigan/Chap12Sec4/Q15.pg":
    "https://activecalculus.org/multi1e/generated/webwork/images/webwork-59-image-1.png",
};

// A bare <sageplot> with no enclosing <image xml:id="..."> (case "image"'s own hotlink rule
// needs that id to build the URL) -- rare: only one in all of 12.1. No id to derive a URL
// from, so found by hand instead: loaded the live page and read its actual <img src>. Keyed
// by the enclosing <figure>'s own xml:id.
const MANUAL_SAGEPLOT_IMAGES = {
  "fig_Vector_VectorFields_circle": "https://activecalculus.com/multi1e/generated/sageplot/fig_12_1_circle.svg",
};

// The vector-calculus repo (chapter 12) writes WeBWorK source paths with a
// "webwork-open-problem-library/OpenProblemLibrary/" prefix instead of the older repos' bare
// "Library/" -- webwork-ptx.aimath.org's render_rpc only recognizes the "Library/" root
// (confirmed directly: the same path with this prefix returns "ERROR caught by Translator",
// stripped down to "Library/..." it renders fine), so normalize before ever querying it.
const normalizeWebworkPath = p => p.replace(/^webwork-open-problem-library\/OpenProblemLibrary\//, "Library/");
async function fetchWebworkProblem(rawSourcePath) {
  const sourcePath = normalizeWebworkPath(rawSourcePath);
  const params = new URLSearchParams({
    // showSolutions/showHints deliberately omitted -- we only use <answerhashes> (the graded
    // answer value), not the authored solution narrative.
    displayMode: "PTX",
    courseID: "anonymous", user: "anonymous", passwd: "anonymous",
    outputformat: "ptx", disableCookies: "1",
    problemSeed: WEBWORK_SEED, problemUUID: sourcePath.replace(/[^\w]/g, "_"),
    sourceFilePath: sourcePath,
  });
  const res = await fetch(WEBWORK_ENDPOINT, { method: "POST", body: params });
  const text = await res.text();
  if (!res.ok || text.includes("ERROR caught by Translator")) return null;
  return text;
}
// The rendered solution's images live at ephemeral /webwork2_files/tmp/... URLs (scoped to
// this anonymous session) — not safe to hotlink like the source-repo SVGs elsewhere in this
// script, so these get downloaded once now and embedded as data URIs.
async function embedWebworkImage(src) {
  // Some problems' generated graphs come back as a .tgz archive (a tarball, not an image --
  // confirmed by hand: the "image" data actually starts with the gzip magic bytes) instead of
  // a real image file, seemingly a quirk of this specific graph-plotting problem type on the
  // public render_rpc server. Rather than mislabel that archive as image/jpeg and ship a
  // broken <img>, bail out here so the caller's existing "not available statically" fallback
  // (same one used for Sage-only figures) kicks in instead of a broken image tag.
  const mime = src.endsWith(".png") ? "image/png" : /\.jpe?g$/.test(src) ? "image/jpeg" : null;
  if (!mime) return null;
  try {
    const url = src.startsWith("http") ? src : `https://webwork-ptx.aimath.org${src}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch { return null; }
}
function findAllWebworkNodes(node, out = []) {
  if (node.tag === "webwork" && node.attrs.source) out.push(node);
  for (const c of node.children || []) findAllWebworkNodes(c, out);
  return out;
}
// A pop-up-list's choice key is an <ol label="A."> -- but WHERE it sits under <webwork>
// varies by problem author (direct sibling of <statement>, or nested inside a second
// <statement> sibling), so search the whole node rather than assuming one shape. The
// `label` attribute is the signal (a plain content list never has one).
function findPopupList(node) {
  if (node.tag === "ol" && node.attrs.label) return node;
  for (const c of node.children || []) {
    const found = findPopupList(c);
    if (found) return found;
  }
  return null;
}
function isWebworkBlank(x) {
  // <ul form="popup"> is an inline dropdown; <ul form="checkboxes"> is a "select all that
  // apply" list -- both are single answerable widgets, same as <fillin>/<var>.
  return x.tag === "fillin" || x.tag === "var" || (x.tag === "ul" && (x.attrs.form === "popup" || x.attrs.form === "checkboxes"));
}
// Every <fillin>, every <var> (a WeBWorK multiple-choice/matching button group), and every
// inline <ul form="popup"> (a WeBWorK dropdown, a different markup for the same idea) is one
// answerable part of the problem -- counting them gives a mechanical check that the answer
// array we're about to show has one entry per part, instead of relying on eyeballing each
// problem (how the Q10/Q11-style partial-<answerhashes> bug above was actually caught).
function countWebworkBlanks(ww) {
  let n = 0;
  // Scan the whole <webwork> node, not just its (possibly first-of-several) <statement> --
  // <answerhashes> never contains a <fillin>/<var>, so this is safe and also handles the
  // multi-<statement> case correctly without special-casing it here too.
  (function walk(x) {
    if (isWebworkBlank(x)) { n++; return; }
    for (const c of x.children || []) walk(c);
  })(ww);
  return n;
}
async function resolveWebworkProblems(sectionNode) {
  const nodes = findAllWebworkNodes(sectionNode);
  let ok = 0, fail = 0;
  await Promise.all(nodes.map(async (n) => {
    const xml = await fetchWebworkProblem(n.attrs.source);
    const ww = xml && parseXML(xml).children.find(c => c.tag === "webwork");
    if (!ww) { fail++; return; }
    const imgs = [];
    (function findImgs(x) { if (x.tag === "image") imgs.push(x); for (const c of x.children || []) findImgs(c); })(ww);
    await Promise.all(imgs.map(async img => {
      const data = img.attrs.source && await embedWebworkImage(img.attrs.source);
      if (data) img.attrs.source = data;
      else if (MANUAL_WEBWORK_IMAGES[n.attrs.source]) img.attrs.source = MANUAL_WEBWORK_IMAGES[n.attrs.source];
    }));
    webworkCache.set(n, ww);
    // A pop-up-list problem's choices come back as an <ol label="A."> somewhere under
    // <webwork> -- sometimes a direct sibling of the (single) <statement>, sometimes nested
    // inside a SECOND <statement> sibling of its own (a different problem author's markup for
    // the same idea) -- render_rpc's <answerhashes> then gives just the bare winning letter
    // (correct_ans="A"), meaningless on its own once printed on a static page with no dropdown
    // to reference. Resolve it against the same list students would have seen, wherever it is.
    const popupList = findPopupList(ww);
    const popupItems = popupList ? qda(popupList, "li") : [];
    const hashes = qd(ww, "answerhashes");
    let answers = hashes ? (hashes.children || []).flatMap(a => {
      const raw = a.attrs.correct_ans;
      if (popupItems.length && raw && /^[A-Za-z]$/.test(raw)) {
        const item = popupItems[raw.toUpperCase().charCodeAt(0) - 65];
        // inline(), not esc(textOf(...)) -- a choice can contain real math (e.g. "the circle
        // <m>x^2+y^2=4</m>"), and textOf() strips the <m> tag along with its \(...\)
        // delimiters, leaving unrendered bare LaTeX source as the visible answer text.
        if (item) return [`${raw.toUpperCase()}) ${item.children.map(inline).join("").trim()}`];
      }
      // Value (PopUp)/Value (String)/str_cmp answers are already plain text (e.g. "the first
      // car", "Local Maximum") -- wrapping them in \(...\) math mode is wrong (KaTeX would
      // render "Local Maximum" as italicized math variables with the space collapsed, and
      // correct_ans_latex_string for these comes through as literal "\text{...}" source
      // anyway, not real LaTeX to render).
      if (/PopUp|String|str_cmp/i.test(a.attrs.type || "")) return raw ? [esc(raw)] : [];
      // MultiAnswer grades several blanks (e.g. x(t), y(t), z(t) of one parametrization)
      // together as a SINGLE <answerhashes> entry, with the parts joined by ";\," in both
      // correct_ans and its LaTeX string -- split back into one answer per blank instead of
      // treating the whole semicolon-joined group as if it answered only the first blank.
      if (a.attrs.type === "MultiAnswer") {
        const tex = a.attrs.correct_ans_latex_string || raw || "";
        return tex.split(/;\\,/).map(p => p.trim()).filter(Boolean)
          .map(p => `\\(${esc(normalizeAngleBrackets(p))}\\)`);
      }
      const tex = a.attrs.correct_ans_latex_string || raw;
      return tex ? [`\\(${esc(normalizeAngleBrackets(tex))}\\)`] : [];
    }) : [];
    // A curated entry always wins when present -- it's the verified full answer array (see the
    // table's own comment), not just a fallback for when render_rpc came back empty.
    if (MANUAL_WEBWORK_ANSWERS[n.attrs.source]) answers = MANUAL_WEBWORK_ANSWERS[n.attrs.source];
    webworkAnswers.set(n, answers);
    // expected === 0 means the problem has no <fillin>/<var> widget at all (e.g. a "sketch
    // and categorize" problem graded some other way) -- there's no ground truth to check
    // against, so only flag a real fillin/var undercount, not that shape of problem.
    const expected = countWebworkBlanks(ww);
    if (expected > 0 && answers.length !== expected) {
      console.warn(`WeBWorK answer-count mismatch: ${n.attrs.source} has ${expected} blank(s) but ${answers.length} answer(s) -- check MANUAL_WEBWORK_ANSWERS.`);
    }
    ok++;
  }));
  if (nodes.length) console.log(`WeBWorK: ${ok} rendered, ${fail} failed (of ${nodes.length}).`);
}

/* ------------------------------------------------------------------ */
/* Image resolution: hotlink to the source repo's raw GitHub content, matching this          */
/* project's existing convention for OpenStax figures (convention 6) rather than vendoring   */
/* copies into this repo.                                                                     */
/* ------------------------------------------------------------------ */
function resolveImageUrl(source) {
  // The old ac3 repo's <image source="..."> is always a bare filename with no extension (the
  // extension gets guessed below) -- the vector repo (chapter 12) is inconsistent: some are
  // bare ("/Curl_-yx_field"), some already include a real extension ("/12_1_PIVlab_multipass.
  // jpg"). Try the source verbatim first when it already looks like an image filename, instead
  // of only ever appending an extension (which produced "...jpg.svg" and never matched).
  // The vector repo's own <image source="..."> values are consistently written with a leading
  // "/" (e.g. "/12_1_PIVlab_multipass.jpg") even though IMAGE_BASE already ends in "/" -- left
  // alone this produced a working-but-sloppy double slash (redirects fine on GitHub's raw CDN,
  // no reason to depend on that).
  const rel = source.replace(/^\/+/, "");
  if (/\.(svg|png|jpe?g)$/i.test(rel) && existsSync(join(IMAGE_LOCAL_DIR, rel))) return IMAGE_BASE + rel;
  for (const ext of [".svg", ".png", ".jpg", ".jpeg"]) {
    if (existsSync(join(IMAGE_LOCAL_DIR, rel + ext))) return IMAGE_BASE + rel + ext;
  }
  return null; // no static file at all -- e.g. a pure Sage/interactive-only figure
}
function findLeafImages(node, out = []) {
  if (node.tag === "image") out.push(node);
  for (const c of node.children || []) findLeafImages(c, out);
  return out;
}
function findFirstTag(node, tags) {
  if (tags.includes(node.tag)) return node;
  for (const c of node.children || []) { const f = findFirstTag(c, tags); if (f) return f; }
  return null;
}

/* ------------------------------------------------------------------ */
/* Inline / block rendering                                                                   */
/* ------------------------------------------------------------------ */
// PreTeXt's own escape for the alignment "&" inside <mrow>s of an aligned/gather block --
// literal "&" can't appear in the XML source without its own escaping, so PTX authors write
// \amp instead; KaTeX has no idea what to do with an \amp token (renders it as inert literal
// text, not a real column break), so it needs translating back to "&" before KaTeX ever sees it.
const deAmp = tex => tex.replace(/\\amp\b/g, "&");
// KaTeX's array environment doesn't support the LaTeX array package's @{...} custom
// column-separator syntax (e.g. \begin{array}{r@{\,}c@{\,}l}) -- it's a hard ParseError
// ("Unknown column alignment: @"), not a rendering quirk. Dropping it loses only the extra
// thin-space between columns; the plain r/c/l alignment (and KaTeX's own default column gap)
// still renders a readable aligned system.
const stripArrayColSep = tex => tex.replace(/@\{[^}]*\}/g, "");
// \mbox{...} (plain TeX's box-of-text primitive, e.g. "... \mbox{and} ...") isn't one of
// KaTeX's supported commands either -- a ParseError rendered as a literal red "\mbox" token,
// not a warning. \text{...} is KaTeX's own equivalent and takes the same {argument} syntax,
// so a straight rename is a safe, lossless fix.
const mboxToText = tex => tex.replace(/\\mbox\{/g, "\\text{");
function displayMath(n) {
  const rows = qda(n, "mrow").map(r => mboxToText(stripArrayColSep(deAmp(normalizeAngleBrackets(textOf(r))))));
  const body = rows.length ? rows.join(" \\\\\n") : mboxToText(stripArrayColSep(deAmp(normalizeAngleBrackets(textOf(n)))));
  const core = rows.length ? `\\begin{aligned}${body}\\end{aligned}` : body;
  // <men>/<mdn> (numbered equations, see indexAndNumber) get a right-margin number via
  // KaTeX's native \tag{} -- and need their own anchor so an <xref> elsewhere on the page can
  // actually jump to them (a bare \[...\] string has nowhere for an id to attach). The anchor
  // itself was already resolved once in indexAndNumber (same value <xref> resolution uses via
  // equationAnchors) so there's exactly one source of truth for it.
  const label = equationLabels.get(n);
  const html = `\\[${esc(label ? `${core}\\tag{${label}}` : core)}\\]`;
  return label ? `<span id="${equationAnchors.get(n)}">${html}</span>` : html;
}

function inline(n) {
  if (!n) return "";
  if (n.tag === "#text") return esc(n.text);
  const kids = () => (n.children || []).map(inline).join("");
  switch (n.tag) {
    case "m": return `\\(${esc(mboxToText(stripArrayColSep(deAmp(normalizeAngleBrackets(textOf(n))))))}\\)`;
    case "me": case "men": case "md": case "mdn": return displayMath(n);
    case "term": case "em": case "alert": return `<em>${kids()}</em>`;
    case "q": return `&ldquo;${kids()}&rdquo;`;
    // <lq/>/<rq/> are WeBWorK's self-closing left/right smart-quote markers (from Perl
    // ${LQ}/${RQ} string interpolation) -- empty elements, so without a case here they fell
    // through to kids() and vanished silently, dropping the quote marks around the quoted text.
    case "lq": return "&ldquo;";
    case "rq": return "&rdquo;";
    // <lsq/>/<rsq/> are the single-quote counterparts -- <rsq/> in particular shows up as a
    // plain apostrophe (e.g. "The student<rsq/>s answer" = "The student's answer"), not just
    // in quoted speech.
    case "lsq": return "&lsquo;";
    case "rsq": return "&rsquo;";
    case "mdash": return "&mdash;";
    case "nbsp": return "&nbsp;";
    case "idx": return ""; // invisible index entries
    // A physical <quantity> (e.g. "10 km/hr") -- new to this book's chapter 12 source, never
    // seen in chapters 9-11, and always sits inline within a sentence (not its own block), so
    // this belongs in inline(), not block() -- a first attempt placed it in block() by mistake
    // and it silently rendered as just the bare number with no unit at all (kids()'s default
    // fallback recursed into <mag> fine but <unit>/<per> are self-closing with no text
    // children, so kids() on those returned ""). <mag> is the number; <unit>/<per> carry a
    // "base" name (e.g. "meter", "hour") and an optional SI "prefix" (e.g. "kilo"). Spelled out
    // in full rather than abbreviated (no dedicated symbol table maintained here) -- unambiguous.
    case "quantity": {
      const mag = qd(n, "mag");
      const unit = qd(n, "unit");
      const per = qd(n, "per");
      const unitName = u => u ? `${u.attrs.prefix ? u.attrs.prefix + "-" : ""}${u.attrs.base || ""}` : "";
      const magText = mag ? textOf(mag).trim() : "";
      const unitText = unitName(unit);
      const perText = unitName(per);
      return esc(`${magText} ${unitText}${perText ? "/" + perText : ""}`.trim());
    }
    case "fn": {
      const num = footnotes.length + 1;
      footnotes.push(kids());
      return `<sup id="fnref-${num}"><a href="#fn-${num}">${num}</a></sup>`;
    }
    case "xref": {
      const target = n.attrs.ref && idIndex.get(n.attrs.ref);
      // Equation xrefs are usually self-closing (<xref ref="..." />, no inner text at all) --
      // the surrounding prose already supplies the word "Equation"/"the formula", so the
      // resolved text is just the bare parenthesized number, not another "Equation 9.4.1".
      const eqLabel = target && equationLabels.get(target);
      if (eqLabel) return `<a href="#${equationAnchors.get(target)}">(${eqLabel})</a>`;
      // Exercise xrefs (e.g. "see <xref>Exercise</xref> at the end of this section") carry
      // "Exercise" as their own inner text, same convention as Activity/Figure -- resolve to
      // the exercise's actual sequential number instead of leaving the number off entirely.
      const exLabel = target && exerciseLabels.get(target);
      if (exLabel != null) return `<a href="#${anchorId(target)}">Exercise ${exLabel}</a>`;
      const label = target && (activityLabels.get(target) || figureLabels.get(target) || exampleLabels.get(target));
      if (label && target.attrs.id) return `<a href="#${anchorId(target)}">${label}</a>`;
      // This book never numbers <definition>/<assemblage>/<callout> boxes (confirmed: every
      // one rendered so far shows an unnumbered chip, by design) -- so there's no label to
      // substitute, but the target still has a real anchor on this same page. A bare "see
      // Definition" with no link is worse than the unnumbered word linked to where it lives.
      if (target && target.attrs.id) return `<a href="#${anchorId(target)}">${kids()}</a>`;
      return kids(); // truly unresolvable (e.g. no ref, or target not on this page) — bare text
    }
    case "url": return `<a href="${esc(n.attrs.href || "")}">${kids() || esc(n.attrs.href || "")}</a>`;
    // WeBWorK render_rpc's PTX output represents each answer blank as <fillin> — this is a
    // static page (no live grading backend), so it's just a visual blank, same idea as the
    // rest of this book's activities not showing a checked answer inline.
    case "fillin": return `<span class="blank">${"_".repeat(+n.attrs.characters || 15)}</span>`;
    // <ul form="popup"> is a WeBWorK inline dropdown (e.g. "... <dropdown> is the faster
    // car.") -- same idea as <fillin>, just different source markup, so treat it the same
    // way: a blank, not a literal bulleted list of its own options.
    case "ul": if (n.attrs.form === "popup") return `<span class="blank">${"_".repeat(15)}</span>`;
      return block(n);
    case "title": case "caption": case "description": case "shortdescription": return "";
    // <definition>/<assemblage> are usually top-level section children (already reached via
    // block()'s own child-mapping), but this book sometimes nests one mid-paragraph (e.g. "The
    // definition ... can be extended... <definition>...</definition> (As we will see...)") --
    // without a case here it fell through to kids(), losing the card styling entirely and
    // just dumping its text inline with the surrounding prose.
    case "ol": case "table": case "tabular": case "figure": case "image": case "webwork": case "var": case "cd":
    case "definition": case "assemblage": case "example":
      return block(n);
    default: return kids();
  }
}

const INLINE_TAGS = new Set(["#text", "m", "me", "men", "md", "mdn", "term", "em", "alert", "q", "xref", "url", "var", "mdash", "nbsp", "idx"]);
function renderMixed(children) {
  let html = "", buf = [];
  const flush = () => {
    if (!buf.length) return;
    const rendered = buf.map(inline).join("");
    if (rendered.replace(/&\w+;|\s/g, "")) html += `<p>${rendered}</p>`;
    buf = [];
  };
  for (const c of children || []) {
    if (isInstructorOnly(c)) continue;
    if (INLINE_TAGS.has(c.tag)) buf.push(c);
    else { flush(); html += block(c); }
  }
  flush();
  return html;
}

// Stable per-node anchor id, e.g. "F-9-1-porcupine" (the source's own xml:id) -> same string,
// slugified for HTML id safety.
function anchorId(n) { return (n.attrs.id || "").replace(/[^\w-]/g, "-"); }
function idAttr(n) { const id = anchorId(n); return id ? ` id="${id}"` : ""; }

// Shared by case "image" and renderFigureImages() below -- previously each had its OWN
// separate (and inconsistent) URL-resolution logic, so the sageplot-hotlink fallback added to
// one didn't apply to the other, and an <image xml:id><sageplot> nested inside a <figure>
// resolved via findLeafImages() never got a chance to use it at all.
function resolveImageSrc(n) {
  let src = n.attrs.source && /^(data|https?):/.test(n.attrs.source) ? n.attrs.source : n.attrs.source && resolveImageUrl(n.attrs.source);
  if (!src && n.attrs.id && qd(n, "sageplot")) src = `https://activecalculus.com/multi1e/generated/sageplot/${n.attrs.id}.svg`;
  return src;
}
function renderFigureImages(n) {
  const imgs = findLeafImages(n).map(img => {
    const url = resolveImageSrc(img);
    return url ? `<img src="${url}" alt="">` : null;
  }).filter(Boolean);
  if (imgs.length) {
    return imgs.length > 1
      ? `<div class="figrow">${imgs.map(i => `<div class="figitem">${i}</div>`).join("")}</div>`
      : imgs[0];
  }
  // A bare <sageplot> with no enclosing <image xml:id> at all (no id to derive a hotlink URL
  // from) -- check the hand-curated lookup, keyed by this figure's own id, before giving up.
  if (n.attrs.id && MANUAL_SAGEPLOT_IMAGES[n.attrs.id]) return `<img src="${MANUAL_SAGEPLOT_IMAGES[n.attrs.id]}" alt="">`;
  // No plain <image> leaves -- chapter 12's figures are sometimes a live <interactive> or a
  // <sageplot> (pre-rendered-only, not embeddable here) instead. Render whichever is present
  // through its own case in block() rather than always assuming "not available"; genuinely
  // image-less figures (no image, no interactive, no sageplot) still fall through to the flag.
  const sageChild = findFirstTag(n, ["interactive", "sageplot"]);
  if (sageChild) return block(sageChild);
  return `<div class="card flag"><span class="chip">Figure not available statically — Sage-only, needs its own integration</span></div>`;
}

// Shared by activities AND plain (non-WeBWorK) exercises built from <task> sub-parts --
// chapter 12 uses this structure in both places. Each task gets its own lettered part and,
// if present, a "Show answer" reveal (same convention as WeBWorK's own answer box).
function renderTaskParts(tasks) {
  return tasks.map((task, i) => {
    const tIntro = qd(task, "introduction");
    const tIntroHtml = tIntro ? renderMixed(tIntro.children) : "";
    const stmt = qd(task, "statement");
    const stmtHtml = stmt ? renderMixed(stmt.children) : "";
    const lbl = tasks.length > 1 ? `<span class="part-label">${String.fromCharCode(97 + i)})</span> ` : "";
    // Prefer <solution> over <answer> when a task has both (seen in 12.1's exercise 4): in
    // practice they're near-duplicate text, but <answer> had a genuine copy-paste typo ("As x
    // increases" repeated, never mentioning y) that <solution> gets right.
    const reveal = qd(task, "solution") || qd(task, "answer");
    const ansHtml = reveal ? `<div class="answer"><button>Show answer</button><div class="a">${renderMixed(reveal.children)}</div></div>` : "";
    // idAttr(task) -- a task's own xml:id was never reaching the HTML, so any same-page
    // <xref> pointing at one specific part (e.g. "see part <a href="#task_...">part</a>")
    // dangled even though the target existed on the page (found via 12.1's own id/href diff).
    return `<div class="part"${idAttr(task)}>${lbl}${tIntroHtml}${stmtHtml}${ansHtml}</div>`;
  }).join("");
}

function renderActivity(n) {
  const label = activityLabels.get(n);
  const isPreview = n.tag === "exploration";
  const tasks = qda(n, "task");
  const intro = qd(n, "introduction");
  const introHtml = intro ? renderMixed(intro.children) : "";
  let body;
  if (tasks.length) {
    body = renderTaskParts(tasks);
  } else {
    const stmt = qd(n, "statement");
    body = stmt ? renderMixed(stmt.children)
      : renderMixed((n.children || []).filter(c => c.tag !== "title" && c.tag !== "introduction"));
  }
  return `<div class="card activity${isPreview ? " preview" : ""}"${idAttr(n)}>` +
    `<div class="ex-head"><span class="num">${label}</span></div>` +
    `<div class="ex-body">${introHtml}${body}</div></div>`;
}

function block(n) {
  if (!n) return "";
  if (isInstructorOnly(n)) return "";
  switch (n.tag) {
    case "p": return `<p>${inline(n)}</p>`;
    case "me": case "men": case "md": case "mdn": return displayMath(n);
    case "ul": case "ol": {
      const tag = n.tag === "ul" ? "ul" : "ol";
      // WeBWorK matching/pop-up-list choices come through as <ol label="A."> (or "a.") --
      // that's the letter scheme the correct-answer text below refers to (e.g. "E) a
      // collection of..."), so the rendered list needs to match it instead of defaulting
      // to plain numbers.
      const m = /^([A-Za-z])\./.exec(n.attrs.label || "");
      const type = m ? ` type="${m[1] === m[1].toUpperCase() ? "A" : "a"}"` : "";
      const items = qda(n, "li").map(li => `<li>${renderMixed(li.children)}</li>`).join("");
      return `<${tag}${type}>${items}</${tag}>`;
    }
    case "li": return `<li>${renderMixed(n.children)}</li>`;
    // <cd> is a literal code display (e.g. Postscript commands) -- plain text, not LaTeX, and
    // the source's own indentation/line breaks are meaningful, so render verbatim in a <pre>
    // rather than falling through to kids() and having them collapsed into one run-on line.
    case "cd": {
      const lines = textOf(n).replace(/^\n+/, "").replace(/\s+$/, "").split("\n");
      const indent = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^\s*/)[0].length));
      return `<pre class="code">${esc(lines.map(l => l.slice(indent)).join("\n"))}</pre>`;
    }
    // <var form="buttons"><li>...</li>...</var> is a WeBWorK multiple-choice/matching
    // question's set of options — without a case here it fell through to the "kids()"
    // default and every choice ran together as one continuous sentence with no separation.
    case "var": {
      const items = qda(n, "li").map(li => `<li>${renderMixed(li.children)}</li>`).join("");
      return items ? `<ol type="a">${items}</ol>` : `<span class="blank">${"_".repeat(15)}</span>`;
    }
    case "figure": {
      const cap = qd(n, "caption");
      // inline(), not esc(textOf(...)) — the caption can contain <m> math (e.g. "z=x^2+y^2"
      // in the gallery-of-functions figures), and textOf() strips it to bare LaTeX source
      // with no \(...\) delimiters, so KaTeX never sees it as math to render at all.
      const capHtml = cap ? " — " + cap.children.map(inline).join("") : "";
      return `<figure class="plot"${idAttr(n)}>${renderFigureImages(n)}` +
        `<figcaption>${figureLabels.get(n) || ""}${capHtml}</figcaption></figure>`;
    }
    // A WeBWorK image was already resolved to a data: URI or an external https: URL
    // (MANUAL_WEBWORK_IMAGES) by resolveWebworkProblems — use as-is; everything else resolves
    // against the source repo's local clone (or, for chapter 12's <image xml:id><sageplot>
    // figures with no local file at all, a hotlink to the published book's own pre-rendered
    // SVG at a predictable URL keyed by the image's own xml:id — see resolveImageSrc()).
    case "image": {
      const src = resolveImageSrc(n);
      return src ? `<img src="${src}" alt="">`
        : `<div class="card flag"><span class="chip">Image not available statically</span></div>`;
    }
    // Chapter 12 (vector calculus, active-calculus-vector repo) only. A live Sage Cell Server
    // embed (sagecell.sagemath.org) -- see the ".sage-embed" scan + makeSagecell() call in
    // app.js's DOMContentLoaded handler, which converts the <script type="text/x-sage"> block
    // below into an interactive "Evaluate" cell client-side. n's own <slate surface="sage">
    // child holds the raw Sage source verbatim (already resolved from its xi:include, if any,
    // by resolveIncludes() before this ever runs) -- must NOT go through esc()'s HTML-escaping
    // twice; textOf() -> a literal <script> body is exactly what Sage Cell's own embed
    // convention expects. The <description> is this book's own accessibility alt-text for the
    // plot (screen-reader-facing in the original), shown here as a visible caption instead,
    // since the plot itself doesn't render until a student clicks "Run interactive".
    // Deliberately NOT self-wrapped in its own <figure> -- this almost always sits inside the
    // source's own <figure> (see case "figure" / renderFigureImages' sageChild fallback below),
    // which already supplies the real figcaption/numbering via figureLabels; wrapping here too
    // would nest a <figure> inside a <figure>.
    case "interactive": {
      const slate = qd(n, "slate");
      // The source's own XML pretty-printing indents every line of a <slate> to match its
      // nesting depth -- meaningless to Sage but NOT to Python, whose indentation IS syntax.
      // Left in place, this produced a real "IndentationError: unexpected indent" the moment
      // a student actually ran the cell (caught by clicking "Run interactive" against the
      // real Sage Cell backend, not just a build-time check). Strip the common leading
      // whitespace shared by every non-blank line first, same idea as Python's textwrap.dedent.
      const dedent = text => {
        const lines = text.split("\n");
        const indents = lines.filter(l => l.trim()).map(l => l.match(/^[ \t]*/)[0].length);
        const min = indents.length ? Math.min(...indents) : 0;
        return lines.map(l => l.slice(min)).join("\n");
      };
      const code = slate ? dedent(textOf(slate)).trim() : "";
      if (!code) return `<div class="card flag"><span class="chip">Sage interactive — no code found</span>` +
        `<p>Flagged for follow-up (id: <code>${esc(n.attrs.label || n.attrs.id || "")}</code>).</p></div>`;
      // The wrapper's class must NOT be literally "sagecell" -- collides with the library's
      // own internal namespace (same name as the global `sagecell` object) and makeSagecell()
      // silently matches zero elements when given that selector, with no error at all. Confirmed
      // by isolated testing: identical markup with class="sage-embed" instead works immediately.
      return `<div class="sage-interactive"${idAttr(n)}><div class="sage-embed"><script type="text/x-sage">${code}</script></div></div>`;
    }
    // <sageplot> is inline Sage source meant to be PRE-RENDERED to a static image by the
    // official Sage-based PreTeXt build -- we don't run Sage at build time (no local install,
    // and these render at authoring time, not per-request like WeBWorK), so there's no way to
    // produce the actual image here. Flagged the same way an unavailable WeBWorK image is,
    // rather than silently dropped, so it's easy to find and revisit (e.g. hotlinking the
    // published book's own rendered image, once matched up by hand per plot).
    case "sageplot": {
      // Most of these have no label/id at all (confirmed: none in 12.1) -- an empty
      // <code></code> reads worse than just omitting the follow-up line entirely.
      const flagId = n.attrs.label || n.attrs.id || "";
      return `<div class="card flag"><span class="chip">Sage plot — not yet integrated</span>` +
        (flagId ? `<p>Flagged for follow-up (id: <code>${esc(flagId)}</code>).</p>` : "") + `</div>`;
    }
    // <outcomes> is this book's own name for what chapters 9-11 (a different source repo)
    // call the "Summary" -- same role (a bulleted takeaways list at the end of a section), new
    // tag name only. Reuses the exact "Summary" h2 id/text convention the rest of this site's
    // sections and its outline/scrollspy (assets/app.js) already expect.
    case "outcomes": return `<h2 id="summary">Summary</h2>${(n.children || []).map(block).join("")}`;
    case "webwork": {
      const ww = webworkCache.get(n);
      if (!ww) return `<div class="card flag"><span class="chip">WeBWorK exercise — could not render</span>` +
        `<p>source: <code>${esc(n.attrs.source || "")}</code></p></div>`;
      // Some problems (e.g. a multi-part question split into a letter-choice part and a
      // separate numeric part) come back with MULTIPLE <statement> siblings under <webwork>,
      // not one -- qd() only grabbed the first, silently dropping every later part (and its
      // blank) from the page entirely, not just from the answer.
      const stmtHtml = qda(ww, "statement").map(s => renderMixed(s.children)).join("");
      // Only the direct-sibling-of-<statement> popup-list shape needs rendering separately
      // here -- if it's nested inside one of the <statement>s instead (see findPopupList),
      // stmtHtml above already rendered it as ordinary content, and doing it again here
      // would show the choice list twice.
      const popupList = qd(ww, "ol");
      const popupHtml = popupList ? block(popupList) : "";
      // Precomputed in resolveWebworkProblems: from <answerhashes> when render_rpc actually
      // populates it (plain fill-in answers), or from MANUAL_WEBWORK_ANSWERS when it doesn't
      // (multiple-choice/matching/pop-up-list types) — either way, just the final answer, not
      // a worked solution, matching how this book's other exercises behave.
      const answers = webworkAnswers.get(n) || [];
      const answerHtml = answers.length
        ? `<div class="answer"><button>Show answer</button><div class="a"><p>${answers.join(", ")}</p></div></div>`
        : "";
      return stmtHtml + popupHtml + answerHtml;
    }
    case "exercise": {
      // WeBWorK and plain exercises share ONE simple sequential counter in this book (1, 2,
      // 3, ... — confirmed against the live site: #1-13 are WeBWorK, #14+ are these plain
      // ones, not restarted). Previously these had no .n/.body wrapper at all, so the CSS
      // grid built for OpenStax's numbered exercises (.exercise { grid-template-columns:
      // 44px 1fr }) split whatever the FIRST two children happened to be into that 44px/1fr
      // layout instead — a stray narrow column next to the real content.
      exerciseCounter++;
      const stmt = qd(n, "statement");
      // A plain (non-WeBWorK) exercise built from <task> sub-parts instead of a <statement>
      // (chapter 12's own conceptual, non-WeBWorK exercises use this shape) previously matched
      // neither branch here and silently vanished -- returned "" and got skipped entirely, no
      // trace in the output (found: 12.1 was missing its 4th exercise this way).
      const tasks = qda(n, "task");
      let body;
      if (stmt) body = renderMixed(stmt.children);
      else if (qd(n, "webwork")) body = block(qd(n, "webwork"));
      else if (tasks.length) {
        const intro = qd(n, "introduction");
        body = (intro ? renderMixed(intro.children) : "") + renderTaskParts(tasks);
      } else body = "";
      if (!body) return "";
      return `<div class="exercise"${idAttr(n)}><div class="n">${exerciseCounter}</div><div class="body">${body}</div></div>`;
    }
    // Wrapping in #exercise-panel-content is the ENTIRE practice-panel wiring needed — app.js's
    // setupSplit() already looks for this id generically and injects the "⇄ Practice panel"
    // toggle button + split layout automatically when it finds one; nothing else on the page
    // needs to change.
    case "exercises": return `<div id="exercise-panel-content"><h2 id="exercises-${SECTION}">Exercises</h2>${(n.children || []).map(block).join("")}</div>`;
    case "tabular": {
      // A corner cell like <m>x\backslash y</m> is this book's convention for "rows vary by
      // x, columns vary by y" -- \backslash is literally just the backslash GLYPH in KaTeX,
      // not a dividing line, so it prints as a plain "x\y". Give it a real diagonal instead
      // (row variable bottom-left, column variable top-right, matching how the table itself
      // reads: x values run down the first column, y values run across the first row).
      const renderCell = cell => {
        const kids = (cell.children || []).filter(c => c.tag !== "#text" || c.text.trim());
        if (kids.length === 1 && kids[0].tag === "m") {
          const m = textOf(kids[0]).match(/^\s*(\S+)\s*\\backslash\s*(\S+)\s*$/);
          if (m) return `<td class="diag"><span class="colvar">\\(${esc(m[2])}\\)</span><span class="rowvar">\\(${esc(m[1])}\\)</span></td>`;
        }
        // Same corner-cell convention, but with plain-word labels split around the
        // backslash instead of one all-math cell (e.g. "weight<m>\backslash</m>speed") --
        // the labels here are English words, not math variables, so render them as plain
        // text rather than wrapping "weight"/"speed" in math mode.
        const bsIdx = (cell.children || []).findIndex(c => c.tag === "m" && textOf(c).trim() === "\\backslash");
        if (bsIdx !== -1) {
          const rowLabel = (cell.children || []).slice(0, bsIdx).map(textOf).join("").trim();
          const colLabel = (cell.children || []).slice(bsIdx + 1).map(textOf).join("").trim();
          if (rowLabel && colLabel) return `<td class="diag"><span class="colvar">${esc(colLabel)}</span><span class="rowvar">${esc(rowLabel)}</span></td>`;
        }
        return `<td>${renderMixed(cell.children)}</td>`;
      };
      const rows = qda(n, "row").map(row => `<tr>${qda(row, "cell").map(renderCell).join("")}</tr>`).join("");
      return `<div class="tablewrap"><table class="data gridlines">${rows}</table></div>`;
    }
    // A <table> can carry its own xml:id (targeted by same-page <xref>s resolving via
    // figureLabels, since tables and figures share one numbering counter) and a <title> —
    // previously neither was rendered: the id never reached the HTML (dangling xref links)
    // and the title was silently dropped (case "title" => "") instead of shown as a caption.
    case "table": {
      const cap = qd(n, "title");
      const label = figureLabels.get(n) || "";
      const capHtml = cap ? cap.children.map(inline).join("") : "";
      const caption = label || capHtml ? `<p class="tablecap">${label}${label && capHtml ? " — " : ""}${capHtml}</p>` : "";
      return `<div class="tablewrap-outer"${idAttr(n)}>${(n.children || []).filter(c => c.tag !== "title").map(block).join("")}${caption}</div>`;
    }
    case "definition": {
      const stmt = qd(n, "statement");
      return `<div class="card definition"${idAttr(n)}><span class="chip">Definition</span>${stmt ? renderMixed(stmt.children) : ""}</div>`;
    }
    case "assemblage": return `<div class="card callout"${idAttr(n)}><span class="chip">${esc(titleOf(n))}</span>${renderMixed((n.children || []).filter(c => c.tag !== "title"))}</div>`;
    // A plain narrative worked example -- unlike OpenStax's examples, no statement/solution
    // split or sol-hint is needed (this book just walks through the example directly), so
    // reuse the same .card.example/.ex-head/.ex-body shell without the .solution toggle.
    case "example": return `<div class="card example"${idAttr(n)}><div class="ex-head"><span class="num">${exampleLabels.get(n) || "Example"}</span></div>` +
      `<div class="ex-body">${renderMixed(n.children)}</div></div>`;
    case "exploration": case "activity": return renderActivity(n);
    case "objectives": return `<div class="card objectives"><span class="chip" style="background:var(--accent-soft);color:var(--accent-ink)">Motivating Questions</span>${(n.children || []).map(block).join("")}</div>`;
    case "sidebyside": {
      // Skip whitespace-only text nodes (pretty-printed XML indentation between elements) —
      // otherwise each one gets its own empty .figitem wrapper interleaved with the real ones.
      const real = (n.children || []).filter(c => c.tag !== "#text" || c.text.trim());
      return `<div class="figrow">${real.map(c => `<div class="figitem">${block(c)}</div>`).join("")}</div>`;
    }
    case "title": case "caption": case "description": case "shortdescription": case "idx": return "";
    case "introduction": return renderMixed(n.children);
    case "#text": return n.text.trim() ? `<p>${esc(n.text)}</p>` : "";
    default: return (n.children || []).map(block).join("");
  }
}

/* ------------------------------------------------------------------ */
/* Load section, walk subsections as h2 groups                                                */
/* ------------------------------------------------------------------ */
const srcPath = join(args.srcdir, args.src);
const sectionNode = parseXML(readFileSync(srcPath, "utf8")).children.find(n => n.tag === "section");
if (!sectionNode) { console.error(`No <section> found in ${srcPath}`); process.exit(1); }
resolveIncludes(sectionNode, args.srcdir);
indexAndNumber(sectionNode);
await resolveWebworkProblems(sectionNode);

const sectionTitle = titleOf(sectionNode);
const topObjectives = qd(sectionNode, "objectives");
const topIntro = qd(sectionNode, "introduction");
const bodyParts = [];
if (topObjectives) bodyParts.push(block(topObjectives));
if (topIntro && !isInstructorOnly(topIntro)) bodyParts.push(renderMixed(topIntro.children));

for (const c of sectionNode.children || []) {
  if (c.tag !== "subsection") continue;
  // A whole <subsection component="instructor"> (e.g. chapter 12's "Notes to the Instructor")
  // must never reach the student page -- block()'s own isInstructorOnly() guard is why every
  // OTHER instructor-only node already gets dropped, but this loop renders each subsection's
  // heading/children directly instead of calling block() on the subsection itself, bypassing
  // that guard entirely (found in 12.1: a whole instructor-notes subsection leaked through).
  if (isInstructorOnly(c)) continue;
  const subTitle = titleOf(c);
  // titleOf() is plain textOf() -- fine for the id-slug fallback below, but a subsection
  // title CAN contain inline math (e.g. "The Length of <m>\vu\times\vv</m>"), and textOf()
  // strips the <m> tag along with its \(...\) delimiters, leaving bare unrendered LaTeX
  // source as the visible heading text. Render the title's own children through inline()
  // instead so any <m> content still gets wrapped and picked up by KaTeX.
  const titleNode = qd(c, "title");
  const subTitleHtml = titleNode ? titleNode.children.map(inline).join("") : "";
  bodyParts.push(`<h2 id="${anchorId(c) || subTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}">${subTitleHtml}</h2>`);
  const subIntro = qd(c, "introduction");
  const rest = (c.children || []).filter(n => n.tag !== "title" && n !== subIntro);
  if (subIntro && !isInstructorOnly(subIntro)) bodyParts.push(renderMixed(subIntro.children));
  bodyParts.push(rest.map(block).join(""));
}
if (footnotes.length) {
  const items = footnotes.map((f, i) => `<li id="fn-${i + 1}">${f} <a href="#fnref-${i + 1}">&#8617;</a></li>`).join("");
  bodyParts.push(`<h2 id="footnotes">Footnotes</h2><ol class="footnotes">${items}</ol>`);
}
// exercises can sit directly under <section> (not nested in a subsection)
const exercisesNode = qd(sectionNode, "exercises");
if (exercisesNode) bodyParts.push(block(exercisesNode));

// Only load the Sage Cell embed script on pages that actually have a live interactive --
// same conditional-CDN-script convention as the Desmos API key script (see CLAUDE.md
// convention 8), so every other section pays zero cost for this.
const needsSageCell = bodyParts.some(p => p.includes('class="sage-embed"'));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(sectionTitle)} · Active Calculus — Multivariable</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
${needsSageCell ? `<script defer src="https://sagecell.sagemath.org/static/embedded_sagecell.js"></script>\n` : ""}<link rel="stylesheet" href="../../assets/style.css">
<script defer src="../../assets/app.js"></script>
</head>
<body data-book="active-calculus-multivariable">
<header class="topbar">
  <a class="brand" href="../../books/active-calculus-multivariable/index.html">MX <span>Calculus</span></a>
  <span class="crumb">${esc(sectionTitle)}</span>
  <span class="spacer"></span>
  <button class="iconbtn" data-theme-toggle>☀ / ☾</button>
  <div id="progressbar"></div>
</header>
<div class="layout">
<nav class="sidebar" aria-label="Book navigation"></nav>
<main>
<h1><span class="kicker">Section ${CHAPTER}.${SECTION}</span>${esc(sectionTitle)}</h1>
${bodyParts.join("\n")}
<footer class="attribution"></footer>
</main>
</div>
</body>
</html>
`;

// A recurring WeBWorK PG source bug (seen so far in 11.6, 11.7, and 11.8's answer notes): a
// broken template interpolation leaves the instruction as literally "(Include .)" instead of
// "(Include units.)" -- the answer itself always does have units (NumberWithUnits type), so
// this is always the same fix, not a per-problem judgment call.
const fixedHtml = html.replace(/\(Include \.\)/g, "(Include units.)");

writeFileSync(args.out, fixedHtml, "utf8");
// Counted from the final HTML, not a pre-render tree walk -- most <sageplot>/<interactive>
// nodes now resolve to a real hotlinked image or live embed (see resolveImageSrc() and case
// "interactive"), so a raw tag count would overstate how many are actually still unresolved.
const sageFlags = (fixedHtml.match(/Sage (plot|interactive) — (not yet integrated|no code found)/g) || []).length;
console.log(`Wrote ${args.out}. Flagged: ${sageFlags} Sage interactive(s) still unintegrated.`);
