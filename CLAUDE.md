# CLAUDE.md — Middlesex Math (OpenStax Viewer)

Instructions for any Claude session working in this folder. Read this before changing anything.

## What this project is

A static website re-presenting OpenStax textbook content (CC BY 4.0) with a cleaner,
more interactive reading experience for Middlesex School students. Currently College
Algebra 2e, Sections 6.1–6.2 are complete; the long-term goal is a comprehensive
"Middlesex Math" book assembled from OpenStax modules across repositories.

Owner: Mike Harrington (mharrington@mxschool.edu), Math Department.

## Non-negotiable conventions

1. **Content fidelity.** Text, examples, Try Its, exercises, numbering, and answers must
   match the OpenStax source exactly. Never paraphrase, renumber, or invent content.
   Source of truth: CNXML modules in OpenStax GitHub repos (see README for module IDs).
2. **Student-facing voice.** This IS the students' textbook. Never reference "the book,"
   "the original," or OpenStax in student-facing UI text (attribution footer excepted).
3. **Attribution.** Every page keeps the CC BY 4.0 attribution footer. Required by license.
4. **Branding.** Primary #cf003d (crimson), secondary black, tertiary white/grey.
   All colors live as CSS variables in `assets/style.css` — never hardcode colors in HTML/JS.
   Variable names `--gold` (= black accents), `--blue` (= grey), `--plum` (= deep crimson)
   are historical hooks; change their values, not their names.
5. **Math.** KaTeX via CDN, delimiters `\( \)` inline and `\[ \]` display ($ is reserved
   for currency). Multi-step derivations use `\begin{aligned}` with `&&` before step notes.
6. **Figures.** Use the original OpenStax images (hotlinked from GitHub, `figure.plot`
   with a plain `<img>`) by default — they look better than the runtime SVG plotter's
   output and match the source book. Do NOT convert static figures to the SVG plotter
   (`data-plot` + `data-spec`) during hand-polish; that tool is effectively deprecated
   in favor of images except for genuinely rare cases where no OpenStax image exists at
   all (e.g. a figure built purely from a table in the CNXML). See convention 7 for the
   one real exception: figures demonstrating a parameter family become Desmos embeds,
   not images and not the SVG plotter.
7. **Interactive/parameter figures use Desmos, not the SVG plotter.** Any figure that
   demonstrates a *family* of curves as a parameter varies (vertical/horizontal shifts,
   stretch/compression, reflections, the general `y=ab^x` or `y=ab^(x+c)+d` forms, etc.)
   should be a `figure.plot[data-desmos]` with slider(s) — see `drawDesmos()` in
   `assets/app.js` for the JSON schema (`bounds`, `sliders`, `curves`, `alt`) and
   `sections/6-2.html` for worked examples. Keep the same functions/values the source
   figure used as slider defaults — don't invent new scenarios, just make the existing
   one draggable. Requires a Desmos Graphing Calculator API script tag in the page
   `<head>` (see convention 8) and `window.Desmos` to be loaded; `drawDesmos()` no-ops
   silently if the API didn't load, so pages degrade gracefully offline.
8. **Desmos API key.** Every page using `data-desmos` figures loads
   `https://www.desmos.com/api/v1.11/calculator.js?apiKey=...` in `<head>`, right after
   the KaTeX scripts (deferred, so it's guaranteed to finish before `app.js`'s
   `DOMContentLoaded` handler runs). Currently wired to Mike's own registered key
   (`64dd35f0fdbe40c5bb00a4a5df4237b6`) — **this is a 90-day free trial key.**
   **Swap this for the production key from desmos.com/my-api once Mike's Desmos API
   request is approved.** It's a single string to find-and-replace across
   `sections/*.html`. (Prior to this, the project used Desmos's public demo key,
   `dcb31709b452b1cf9dc26972add0fda6`.)
9. **No frameworks, no build step.** Plain HTML/CSS/JS (third-party CDN scripts for
   KaTeX and Desmos are fine, same as existing precedent). Single shared stylesheet +
   single shared app.js. Sections must work as static files on any host.

## Architecture

```
index.html                book home; chapter list is hand-maintained here
sections/<slug>.html      one page per section (e.g. 6-1.html)
assets/style.css          all styling, light + dark themes
assets/app.js             BOOK manifest + all behavior (see below)
tools/build-section.mjs   Node 18+ script: CNXML → section page (no AI needed)
README.md                 hosting guide + module ID tables
```

`assets/app.js` owns, generically (works on any conforming section page):
- BOOK manifest → sidebar "Book contents" fold. New section = add entry, set `ready: true`.
- Page outline: auto-built from DOM (`h2[id]`, `.example`, `.tryit`, `.card.qa`,
  `.card.howto`), grouped into collapsible `details.ogroup` per h2, with badges.
  Content inside `details.bigfold` (warm-up) is excluded.
  Groups default to CONDENSED and must stay that way: the scrollspy never expands a
  group (it highlights the group heading when the group is closed); only a user click
  expands a group.
- Scrollspy: scroll-position based ("last target above y=140px", bottom-of-page handled).
  Do NOT switch back to IntersectionObserver — it fails for short sections at page end.
  Hard-won rules: rAF-throttle the scroll handler; ignore the sidebar's own scroll
  events; never call scrollIntoView on sidebar links from the spy (it moves the page
  scroll → glitchy scrollbars, upward drift). Adjust `sidebar.scrollTop` directly instead.
- Sidebar toggle (☰, `body.nosidebar`), practice panel toggle (⇄, `body.split`),
  theme toggle, reading progress bar, solution/answer collapsibles,
  Try It self-check persisted per page in localStorage, SVG plotter.

Section page contract (what build-section.mjs emits and hand-built pages follow):
- `.card.example` with `.ex-head > .num/.t`, body, `.solution` with `.sol-toggle`
- `.tryit` with id `tryit-N`, solution, `.selfcheck` buttons
- `.card.definition|howto|qa|callout` callouts with `.chip`
- Section exercises wrapped in `<div id="exercise-panel-content">` (enables split view),
  each `.exercise` with `.n` number and optional `.answer` (odd-numbered only)
- Glossary as `dl.glossary`, attribution `footer.attribution`
- Figures: `figure.plot` with a plain OpenStax `<img>` by default, or `figure.plot[data-desmos]`
  (Desmos, parameter sliders) for parameter-family figures — see conventions 6–8.
  `figure.plot[data-plot]` (SVG plotter) is a rare fallback only, not the default.
  Pages with any `data-desmos` figure need the Desmos `<script>` tag in `<head>`.

## Workflows

**Add a section:** `node tools/build-section.mjs m49362 6-2 "Graphs of Exponential Functions"`
does the mechanical CNXML → HTML conversion, but its output is a *draft*, not something
to ship as `ready: true` yet — the hand-pass below is required first, and
`tools/verify-section.mjs` will hard-fail if it's skipped (see "Verify before delivering").
Once the hand-pass is done and verify passes, set `ready: true` in the BOOK manifest and
add the link in index.html.

**Chapter-end sections get two extra sidebar rows (standard, not optional).** OpenStax
bundles "Chapter Review Exercises" and (College Algebra/Precalc only — Calculus doesn't
have this) "Practice Test" into the *last* section's own page rather than giving them their
own module/file (see the `reviewExN`/`practiceExN` note above). Left as pure in-page content,
they're only reachable via that page's own outline — not visible anywhere in the "Book
contents" sidebar fold that lists the rest of the book. Whenever the section you just built
is the last one in its chapter and its page has `id="chapter-review-exercises"` and/or
`id="practice-test"` headings, add sibling entries right after that section's own entry in
the BOOK manifest (`assets/app.js`), e.g.:
```js
{ id: "3-7", title: "3.7 Inverse Functions", file: "3-7.html", ready: true },
{ id: "3-7-review", title: "Chapter Review Exercises", file: "3-7.html#chapter-review-exercises", ready: true },
{ id: "3-7-practice", title: "Practice Test", file: "3-7.html#practice-test", ready: true },
```
No number prefix on the title (matches the page's own un-numbered heading). This applies
per book, not just College Algebra 2e — every Calculus volume's chapters need the Review
Exercises row too, just without a Practice Test row.

**Hand-pass a section (required before `ready: true`):**
- **Sol-hints (required, mechanically enforced).** Every non-warmup `Example` gets exactly
  one `<p class="sol-hint">...</p>` inserted as the last child of `.ex-body`, right before
  the `.solution` div. One short sentence pointing at the *first move* only — never the
  answer. This is a judgment call about the example's content (`build-section.mjs` cannot
  generate it, since it has no understanding of the math), but `verify-section.mjs` checks
  the *count* matches the number of non-warmup examples and fails the build if any are
  missing — so this step can no longer be silently skipped, only its wording needs a human/
  AI's judgment.
- **Key Concepts → Examples links (required, mechanically enforced).** Every `Key Concepts`
  bullet that's demonstrated by a specific worked example should link to it — `(See
  <a href="#exampleN">Example N</a>.)` — using the `id="exampleN"` anchors `build-section.mjs`
  already emits. Link to **Examples only, never Exercises** — Exercises get their own
  `id="exN"`/`id="reviewexN"` anchors (also auto-emitted) as reusable wiring for other
  features, but Key Concepts on the student-facing page must not surface exercise links.
  A bullet with no matching worked example (e.g. a pure definition) is fine to leave
  unlinked. `verify-section.mjs` fails the build if a Key Concepts section links to any
  `#exN`/`#reviewexN`/`#practiceexN` id, or if a section has examples but zero Key-Concepts
  links to any of them; it warns (doesn't fail) if only some bullets are linked, since not
  every bullet has a matching example.
- **Figures.** Keep each figure as the original OpenStax `<img>` (convention 6) unless it
  demonstrates a parameter family, in which case replace it with a Desmos `data-desmos`
  embed (convention 7). This part stays a judgment call — `verify-section.mjs` cannot
  determine which figures are parameter families — but see convention 7 for the pattern to
  follow, and if you set an explicit domain restriction on a parametric or polar curve (a
  curve that needs to sweep further than Desmos's default range), use `curves[].domain:
  {min,max}` in the JSON spec (which `drawDesmos()` forwards to Desmos's
  `parametricDomain`/`polarDomain` API options) — **not** a `\left\{min \le t \le max\right\}`
  restriction embedded in the curve's own `latex`. Desmos auto-adds a separate min/max
  "domain" UI control for restricted parametric/polar plots that defaults to 0–1 regardless
  of what an embedded inequality says, silently truncating the curve (found and fixed in
  calculus-v3 1-1's hypocycloid Figure 10 and 1-3's rose Figure 7).
- Verify exercise numbering parity (odd = answer). If the module bundles corequisite
  warm-up content ahead of the real section (common in this Corequisite edition —
  `class="coreq-skills"`), `tools/build-section.mjs` already keeps its examples/exercises
  on separate `Warm-up Example N` / `PN` counters so they don't steal numbers from the
  real section content — no manual fix needed there.

**Verify before delivering (do this after any content change — `tools/verify-section.mjs`
automates all of this except the CNXML count cross-check):**
- Render every `\( \)`/`\[ \]` snippet with KaTeX (`throwOnError: true`) — zero errors.
- Parse every `data-spec` JSON (both `data-plot` and `data-desmos` figures) and, for
  `data-plot`, eval each curve `fn`.
- Check HTML tag balance.
- Count examples / try-its / exercises / answers against the CNXML source.
- Count of `sol-hint` elements equals the count of non-warmup examples (hard fail if not).
- Key Concepts links only to Examples, never Exercises, and links to at least one Example
  if the section has any (hard fail if not; see "Hand-pass a section" above).

**Known environment gotchas (for Claude sessions):**
- This folder may not mount into the bash sandbox. Use Read/Write/Edit/Grep on the
  host path; keep a working copy in the sandbox outputs dir for shell-based testing.
- `web_fetch` truncates at ~64 KB; full CNXML modules exceed this. The build script
  (run locally by the user) has no such limit. For in-session extraction, fetch the
  raw GitHub CNXML another way or work from the script's output.

## Roadmap

1. Sections 6.2–6.8 (module IDs in README), auto-build then polish.
2. "Middlesex Math" combined book: pick modules across OpenStax repos
   (osbooks-college-algebra-bundle covers College Algebra/Precalc/Trig variants;
   Intermediate Algebra 2e lives in osbooks-prealgebra-bundle; Calculus 1–3 in
   osbooks-calculus-bundle — full module maps in README). Requires:
   repo parameter + per-repo media base in build-section.mjs, custom chapter/section
   numbering in the BOOK manifest (decouple display number from source module),
   per-book attribution lines in footers, and a fidelity pass on cross-module links.
3. Possible: per-student progress export, teacher dashboard.
