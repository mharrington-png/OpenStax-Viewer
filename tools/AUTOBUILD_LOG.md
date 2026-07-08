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

### 6-5 — done — 2026-07-07

Built by a scheduled overnight-pipeline run. Collision check clear (manifest had `6-5`
as module-only, no `ready: true`; no matching entry in this log; no running session
building the same section). CNXML fetched via shallow sparse git clone of
`osbooks-college-algebra-bundle` module m49365 (6,889 lines, well-formed) — web_fetch
was not used, per runbook. Built with `build-section.mjs --file=`.

First verify pass failed with 4 KaTeX errors (`\cdotx`, `\approxP`, and a bare `\`).
Root-caused to a real bug in `build-section.mjs`'s MathML→LaTeX converter: `mtxt()`
called `.trim()` on the OPS-mapped string, stripping the intentional trailing space that
commands like `\cdot `, `\approx `, `\pi `, and the space/mspace entries rely on to avoid
gluing onto the next token (or, when the space *was* the entire node, trimming a lone
`\ ` down to a bare invalid `\`). Fixed permanently in `build-section.mjs` (now checked
into the real project, not just the pipeline scratch copy): removed the `.trim()` in
`mtxt()`, and changed the space/mspace LaTeX output from `\ ` (control space, needs a
following literal space to stay valid) to `\,` (thin space, self-contained) so it survives
being the sole content of a math node even after the top-level wrapper's own
`.replace(/\s+/g," ").trim()`. Re-verify passed clean: 349 KaTeX snippets, counts match
(14 examples, 14 try-its, 42 exercises, 21 answers; plus 4 warm-up examples / 11 warm-up
exercises excluded from those counts per the corequisite-skills convention).

Figures: only 1 in this module — a photo of litmus-paper pH testing, purely illustrative
(no function graph, no parameter family) — left as the auto-generated hotlinked image per
CLAUDE.md convention 6. Added 14 sol-hints, one per non-warmup example.

Delivered: `sections/6-5.html` written to the real project, `assets/app.js` manifest
entry flipped to `{ id: "6-5", title: "6.5 Logarithmic Properties", file: "6-5.html",
ready: true }`, `index.html` placeholder `<span>` swapped for a link.

Environment note: the bash sandbox's mount of the project folder and the host-side
Read/Write/Edit tools were badly out of sync for a stretch of this run in both
directions — a host-side `Edit` to `build-section.mjs` didn't show up via bash `cp`/`cat`
for several minutes (worked around by patching the bash-side scratch copy directly with
the same fix), and separately a file written via bash into the mapped `outputs` scratch
dir wasn't visible to the host `Read` tool (root cause: bash's cwd is the sandbox root,
`/sessions/<id>`, **not** `/sessions/<id>/mnt/outputs/` as its own docs claim — files
meant for the host-visible scratch dir must be written explicitly under `mnt/outputs/`).
Confirmed with an explicit marker-file test in both directions before trusting the bridge
again. Something for the next unattended session to watch for if `cp`/`Read` of a
just-written file comes back stale or missing.
