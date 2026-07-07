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
6. **Figures.** Hand-built sections use the runtime SVG plotter (`data-plot` +
   `data-spec` JSON on a `figure.plot`) for fixed, single-curve figures — not OpenStax
   image files. Auto-built sections may hotlink OpenStax images from GitHub until
   hand-polished.
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
   `DOMContentLoaded` handler runs). Currently wired to Desmos's own public demo key
   (`dcb31709b452b1cf9dc26972add0fda6`, published in their API docs for development use)
   — **swap this for a registered production key from desmos.com/my-api** once Mike
   hears back from Desmos about personal-project/production pricing and terms. It's a
   single string to find-and-replace across `sections/*.html`.
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
- Figures: `figure.plot[data-plot]` (SVG, fixed curves) or `figure.plot[data-desmos]`
  (Desmos, parameter sliders) — see conventions 6–8. Pages with any `data-desmos`
  figure need the Desmos `<script>` tag in `<head>`.

## Workflows

**Add a section (automated):** `node tools/build-section.mjs m49362 6-2 "Graphs of Exponential Functions"`,
then set `ready: true` in the BOOK manifest, and add the link in index.html.

**Hand-polish a section:** replace each figure `<img>` with either the SVG plotter
(fixed single-curve figures) or a Desmos `data-desmos` embed (figures demonstrating a
parameter — see convention 7); add `sol-hint` lines ("try before you peek" prompts);
verify exercise numbering parity (odd = answer). If the module bundles corequisite
warm-up content ahead of the real section (common in this Corequisite edition —
`class="coreq-skills"`), `tools/build-section.mjs` already keeps its examples/exercises
on separate `Warm-up Example N` / `PN` counters so they don't steal numbers from the
real section content — no manual fix needed there.

**Verify before delivering (do this after any content change):**
- Render every `\( \)`/`\[ \]` snippet with KaTeX (`throwOnError: true`) — zero errors.
- Parse every `data-spec` JSON (both `data-plot` and `data-desmos` figures) and, for
  `data-plot`, eval each curve `fn`.
- Check HTML tag balance.
- Count examples / try-its / exercises / answers against the CNXML source.

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
