#!/usr/bin/env node
/**
 * build-search-index.mjs — scans every ready section across every book in the BOOKS
 * manifest (assets/app.js) and emits assets/search-index.json: a flat array of
 * searchable entries (topic headings, Key Concepts bullets, glossary terms) that the
 * site-wide search box (app.js, initSearch()) fetches and filters client-side.
 *
 * No dependencies beyond Node 18+. Run after any hand-pass edit that changes headings,
 * Key Concepts, or glossary content, and before shipping:
 *   node tools/build-search-index.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const root = decodeURIComponent(new URL("..", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1");

// --- Pull the BOOKS manifest out of assets/app.js (plain object literal, no exports) ---
const appJs = readFileSync(root + "assets/app.js", "utf8");
const start = appJs.indexOf("const BOOKS = {") + "const BOOKS = ".length;
const afterConst = appJs.slice(start);
const endMarker = "\nconst DEFAULT_BOOK";
const objText = afterConst.slice(0, afterConst.indexOf(endMarker));
const BOOKS = new Function(`return ${objText}`)();

const decodeEntities = s => s
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
const stripTags = s => decodeEntities(s.replace(/<[^>]*>/g, " "))
  .replace(/\\[()[\]]/g, "") // drop bare \( \) \[ \] math delimiters, keep the LaTeX source as plain text
  .replace(/\s+/g, " ").trim();

const SKIP_HEADING_IDS = new Set([
  "exercises", "key-concepts", "glossary", "chapter-review-exercises",
  "practice-test", "chapter-practice-test", "practice-makes-perfect", "writing-exercises",
]);

// Find the <ul>...</ul> that is the DIRECT child list right after a heading id, walking
// nested <ul> depth so a multi-level Key Concepts list doesn't get truncated at the first
// inner </ul> (same approach as tools/verify-section.mjs's Key-Concepts check).
function outerList(html, afterIdx) {
  const ulStart = html.indexOf("<ul", afterIdx);
  if (ulStart === -1) return "";
  const tagRe = /<\/?ul\b[^>]*>/g;
  tagRe.lastIndex = ulStart;
  let depth = 0, end = -1, m;
  while ((m = tagRe.exec(html))) {
    if (m[0][1] === "/") { depth--; if (depth === 0) { end = tagRe.lastIndex; break; } }
    else depth++;
  }
  return end === -1 ? html.slice(ulStart) : html.slice(ulStart, end);
}

const entries = [];
const seenPaths = new Set();

for (const [bookId, book] of Object.entries(BOOKS)) {
  for (const chapter of book.chapters) {
    for (const sec of chapter.sections) {
      if (!sec.ready) continue;
      const [filePart, hashPart] = sec.file.split("#");
      if (hashPart) continue; // virtual Chapter Review/Practice Test rows point into a file already indexed via its own section entry
      const diskPath = `${book.sectionsDir}/${filePart}`;
      if (seenPaths.has(diskPath)) continue;
      seenPaths.add(diskPath);

      let html;
      try { html = readFileSync(root + diskPath, "utf8"); }
      catch { console.warn(`! missing file, skipped: ${diskPath}`); continue; }

      const common = {
        book: bookId, bookTitle: book.title, chapterN: chapter.n, chapterTitle: chapter.title,
        sectionTitle: sec.title, path: diskPath,
      };

      // Everything from "Key Equations"/"Key Concepts"/"Section Exercises" onward is
      // backmatter (exercises, Chapter Review Exercises, Chapter Test/Practice Test,
      // Glossary). Its own h2/h3/h4 sub-headings are never real topic headings for *this*
      // page -- notably, Chapter Review Exercises groups review problems under h3s that
      // repeat other sections' titles verbatim (e.g. precalculus-2e/3-9.html's "Power
      // Functions and Polynomial Functions" h3, copied from section 3.3's own heading),
      // which used to leak into the index as if 3.9 itself covered that topic.
      let bodyEnd = html.length;
      for (const id of ["key-equations", "key-concepts", "exercises"]) {
        const i = html.indexOf(`id="${id}"`);
        if (i !== -1 && i < bodyEnd) bodyEnd = i;
      }
      const body = html.slice(0, bodyEnd);

      // 1. Topic headings (h2/h3/h4 with a meaningful id)
      for (const m of body.matchAll(/<h([234]) id="([a-z0-9-]+)">(.*?)<\/h\1>/gs)) {
        const [, , id, raw] = m;
        if (SKIP_HEADING_IDS.has(id)) continue;
        const text = stripTags(raw);
        if (text) entries.push({ ...common, type: "heading", anchor: id, text });
      }

      // 2. Key Concepts bullets (learning objectives) — every <li>, including nested sub-bullets
      const kcIdx = html.indexOf('id="key-concepts"');
      if (kcIdx !== -1) {
        const list = outerList(html, kcIdx);
        for (const m of list.matchAll(/<li>(.*?)<\/li>/gs)) {
          const raw = m[1];
          const text = stripTags(raw).slice(0, 220);
          if (!text) continue;
          const exampleMatch = raw.match(/href="#(example\d+)"/);
          entries.push({ ...common, type: "objective", anchor: exampleMatch ? exampleMatch[1] : "key-concepts", text });
        }
      }

      // 3. Glossary terms
      const glIdx = html.indexOf('id="glossary"');
      if (glIdx !== -1) {
        const dl = html.slice(glIdx, html.indexOf("</dl>", glIdx) + 5);
        for (const m of dl.matchAll(/<dt>(.*?)<\/dt><dd>(.*?)<\/dd>/gs)) {
          const term = stripTags(m[1]);
          const detail = stripTags(m[2]).slice(0, 200);
          if (term) entries.push({ ...common, type: "glossary", anchor: "glossary", text: term, detail });
        }
      }
    }
  }
}

writeFileSync(root + "assets/search-index.json", JSON.stringify(entries));
console.log(`Wrote assets/search-index.json: ${entries.length} entries from ${seenPaths.size} section files across ${Object.keys(BOOKS).length} books.`);
const byType = entries.reduce((a, e) => (a[e.type] = (a[e.type] || 0) + 1, a), {});
console.log(byType);
