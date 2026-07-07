#!/usr/bin/env node
/**
 * verify-section.mjs — automates the CLAUDE.md "Verify before delivering" checklist
 * for one built section page:
 *   1. Renders every \( \) / \[ \] snippet through KaTeX with throwOnError.
 *   2. Parses every data-spec JSON (data-plot and data-desmos figures) and, for
 *      data-plot, evaluates each curve's fn at a few sample x values.
 *   3. Checks HTML tag balance (simple stack-based scan, ignores void elements).
 *   4. Counts examples / try-its / exercises / answers and — if --expect flags are
 *      given — compares them against the counts you pass in (e.g. from the CNXML
 *      source or from build-section.mjs's own console output).
 *
 * Usage:
 *   node tools/verify-section.mjs sections/6-3.html \
 *     --examples=8 --tryits=8 --exercises=66 --answers=33
 *
 * Requires the `katex` npm package (npm install katex --no-save).
 * Exits 0 and prints "PASS" if everything checks out, exits 1 and prints every
 * problem found otherwise.
 */
import { readFileSync } from "node:fs";
import katex from "katex";

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith("--"));
if (!file) {
  console.error('Usage: node tools/verify-section.mjs <path-to-section.html> [--examples=N --tryits=N --exercises=N --answers=N]');
  process.exit(1);
}
const expect = {};
for (const a of args) {
  const m = a.match(/^--(\w+)=(\d+)$/);
  if (m) expect[m[1]] = +m[2];
}

const html = readFileSync(file, "utf8");
const errors = [];
const warnings = [];

/* 1. HTML tag balance ------------------------------------------------- */
(function checkTagBalance() {
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g;
  const voidTags = new Set(["br", "img", "hr", "meta", "link", "input", "source", "area", "base", "col", "embed", "param", "track", "wbr"]);
  const stack = [];
  let m;
  while ((m = tagRe.exec(html))) {
    const [, closing, tag, selfClose] = m;
    const lower = tag.toLowerCase();
    if (voidTags.has(lower) || selfClose) continue;
    if (!closing) stack.push(lower);
    else {
      const top = stack[stack.length - 1];
      if (top === lower) stack.pop();
      else {
        // allow for the fact browsers/authors sometimes leave <p> unclosed before a block;
        // only flag when we can't find this tag anywhere in the open stack
        const idx = stack.lastIndexOf(lower);
        if (idx === -1) errors.push(`Tag balance: stray </${lower}> near offset ${m.index}`);
        else stack.splice(idx, stack.length - idx);
      }
    }
  }
  if (stack.length) errors.push(`Tag balance: unclosed at end of file: ${stack.join(", ")}`);
})();

/* 2. KaTeX render check ------------------------------------------------ */
let katexChecked = 0;
for (const re of [/\\\((.+?)\\\)/gs, /\\\[(.+?)\\\]/gs]) {
  let m;
  while ((m = re.exec(html))) {
    katexChecked++;
    try { katex.renderToString(m[1], { throwOnError: true }); }
    catch (e) { errors.push(`KaTeX: "${m[1].slice(0, 70).replace(/\s+/g, " ")}" -> ${e.message}`); }
  }
}

/* 2b. data-desmos figures require the Desmos API script tag in <head> --- */
if (/data-desmos/.test(html) && !/desmos\.com\/api\//.test(html)) {
  errors.push("Page has a data-desmos figure but no Desmos API <script> tag in <head> (see CLAUDE.md convention 8).");
}

/* 3. data-spec JSON parse + curve eval --------------------------------- */
let specChecked = 0;
{
  const specRe = /data-spec='([^']*)'/g;
  let m;
  while ((m = specRe.exec(html))) {
    specChecked++;
    let spec;
    try { spec = JSON.parse(m[1]); }
    catch (e) { errors.push(`data-spec JSON parse failed: ${e.message} -- ${m[1].slice(0, 70)}...`); continue; }
    if (Array.isArray(spec.curves)) {
      for (const c of spec.curves) {
        if (!c.fn) continue; // data-desmos curves use latex, not fn — nothing to eval
        const xs = [spec.xmin ?? -5, spec.xmax ?? 5, 0, 1, -1, ((spec.xmin ?? -5) + (spec.xmax ?? 5)) / 2];
        for (const x of xs) {
          try {
            const val = Function("x", `"use strict"; return (${c.fn});`)(x);
            if (typeof val !== "number") throw new Error(`fn returned ${typeof val}, not a number`);
          } catch (e) {
            errors.push(`data-plot curve fn "${c.fn}" failed at x=${x}: ${e.message}`);
          }
        }
      }
    }
  }
}

/* 4. Element counts ----------------------------------------------------- */
const count = re => (html.match(re) || []).length;
const counts = {
  examples: count(/class="card example(?! *warmup)/g),
  tryits: count(/class="tryit"/g),
  exercises: count(/<div class="exercise">/g),
  answers: count(/<div class="answer">/g),
  warmupExamples: count(/class="card example warmup"/g),
  warmupExercises: count(/class="exercise warmup"/g),
};
for (const key of Object.keys(expect)) {
  if (counts[key] === undefined) { warnings.push(`No counter for --${key}, skipped.`); continue; }
  if (counts[key] !== expect[key]) errors.push(`Count mismatch: ${key} expected ${expect[key]}, found ${counts[key]}`);
}

/* Report ------------------------------------------------------------------ */
console.log(`Checked ${katexChecked} math snippet(s), ${specChecked} figure spec(s).`);
console.log(`Counts: ${JSON.stringify(counts)}`);
if (warnings.length) warnings.forEach(w => console.warn(`WARN: ${w}`));
if (errors.length) {
  console.error(`FAIL — ${errors.length} issue(s):`);
  errors.forEach(e => console.error(" - " + e));
  process.exit(1);
} else {
  console.log("PASS");
}
