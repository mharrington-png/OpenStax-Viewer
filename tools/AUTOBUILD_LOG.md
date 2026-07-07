# Autobuild log

Dated entries for each section built (or attempted) by an unattended/pipeline session.
Read `tools/OVERNIGHT_PIPELINE.md` before adding to this file. Format per entry:

`### <section> — <status> — <ISO timestamp>` then a short summary.

---

### 6-3 — done — 2026-07-07

Built by a separate concurrent session ("Section 6.3 development"). Marked `ready: true`
in the BOOK manifest with `file: "6-3.html"`. Not built or touched by the pipeline session
that wrote this log — noted here only so overnight runs know it's already spoken for.

### 6-4 — done — 2026-07-07

Built live end-to-end in the pipeline-setup session (not via a scheduled task) as a proof
run: git-clone CNXML fetch (web_fetch truncated this module at ~60KB, confirmed unusable),
`build-section.mjs` with `--file=`, hand-polished 15 of 19 figures (5 as `data-desmos`
parameter families — base, horizontal shift, vertical shift, stretch, reflection — 10 as
`data-plot` fixed worked-example graphs), left 4 as hotlinked images (1 illustrative,
3 multi-curve "match the graph" exercises that can't be redrawn without seeing the source
JPGs). Added 11 sol-hints. `verify-section.mjs` passes (650 KaTeX snippets, 15 figure specs,
counts match: 11 examples, 11 try-its, 60 exercises, 30 answers). Fixed three real bugs in
`build-section.mjs` along the way (now permanent — see OVERNIGHT_PIPELINE.md §4): `$`/`%`
escaping, `mtable` column count, figure `<link>` resolution. Added the Desmos API script
tag requirement to `verify-section.mjs`'s checks.

Known gap: 11 remaining `<link>` references to a summary table (not a figure) still render
as the placeholder "(see original)" — table-link resolution isn't implemented, only
figure-link resolution is. Cosmetic, not a fidelity issue.
