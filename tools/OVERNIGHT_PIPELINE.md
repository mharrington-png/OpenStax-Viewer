# Overnight section pipeline — runbook

Read this before building a section unattended. It captures everything learned getting
the 6.3/6.4 pipeline working live, so you don't have to rediscover it. Follow it in order.

## 0. Check for collisions first

Another session may already be working the same section (this happened the night this
runbook was written — a second chat was mid-build on 6.3 while this one ran). Before
touching anything:

1. Read `assets/app.js`'s BOOK manifest and `tools/AUTOBUILD_LOG.md`.
2. Pick the **first** chapter-6 section that has a `module` id but no `ready: true`.
3. If a session_info tool is available, check for another running session with a name
   suggesting it's building the same section, and skip to the next section if so.

## 1. Why you can't just run the documented workflow

The README says `node tools/build-section.mjs <moduleId> <slug> "<title>"`. That's correct
for a human with normal internet, but two things are true in this sandboxed environment:

- **The project folder doesn't mount into the bash sandbox** (it's a Google Drive path).
  Use the `Read`/`Write`/`Edit`/`Glob`/`Grep` tools for all reads/writes to the real
  project files. Do all *command execution* (node, git) in a scratch directory inside the
  bash sandbox, then copy finished output back out via Read (sandbox scratch file) + Write
  (real project path). There is no direct file-copy tool between the two filesystems.
- **`raw.githubusercontent.com` and `api.github.com` are blocked** by the sandbox's network
  allowlist, and `cdn.jsdelivr.net`'s `/gh/` proxy is too. The `web_fetch` tool *can* reach
  raw.githubusercontent.com but silently truncates large files (~60KB) with no error —
  it'll cut a CNXML module off mid-tag, which build-section.mjs will happily "parse" into
  a broken, incomplete page (missing the Section Exercises entirely; this bit us on 6.3
  before the git-clone approach was in place). **Do not use web_fetch for CNXML modules.**

**The fix that works:** `git clone` over `https://github.com/...` is *not* blocked (only the
raw-content subdomains are). Use a shallow, blobless, sparse clone:

```
mkdir -p /tmp/pipeline/{cnxml,sections} && cd /tmp/pipeline
git clone --depth 1 --filter=blob:none --sparse \
  https://github.com/openstax/osbooks-college-algebra-bundle.git src
cd src && git sparse-checkout set modules/m4936X   # the module you need
cp modules/m4936X/index.cnxml /tmp/pipeline/cnxml/m4936X.cnxml
```

This gets the complete, well-formed file every time (verified: a module web_fetch
truncated at 1,836 lines came back as 4,414 complete lines via git clone, with a proper
closing `</document>` tag).

## 2. Build

`tools/build-section.mjs` already supports a local-file mode — no network calls needed
once you have the CNXML locally:

```
cd /tmp/pipeline
cp "<path to project>/tools/build-section.mjs" tools/    # use the CURRENT version, see §4
node tools/build-section.mjs m4936X 6-N "Section Title" --file=cnxml/m4936X.cnxml
```

This writes `sections/6-N.html` inside `/tmp/pipeline`. Also run, right away:

```
npm install katex --no-save --silent   # first time only
node tools/verify-section.mjs sections/6-N.html
```

Fix anything it flags (KaTeX errors, bad data-spec JSON, tag imbalance) before moving on.
Note the reported example/try-it/exercise/answer counts — you'll pass them back in as
`--examples=N --tryits=N --exercises=N --answers=N` on the final verify pass so the count
check actually checks something.

## 3. Hand-polish (this is most of the work — budget real time for it)

**Figures.** For each `<figure>` in the CNXML, read the surrounding prose to classify it:

- **Parameter family** (the text says things like "as c varies," shows a general
  transformation, or the figure caption/alt describes two+ cases of the *same* relationship,
  e.g. "b>1" vs "0<b<1", or a general shift/stretch/reflection) → convert to
  `data-desmos` with slider(s). Mirror the exact bounds/slider/curve JSON shape already
  used in `sections/college-algebra-2e/6-1.html` and `sections/college-algebra-2e/6-2.html`
  — don't invent a new schema. Reuse
  slider ranges from those pages when the situation matches (e.g. shift sliders are
  typically min -5 max 5 step 0.5 value 3; stretch sliders min 0.1 max 5 step 0.1 value 3;
  reflection sliders are a single toggle, min -1 max 1 step 2).
- **Fixed worked example/answer graph** (a specific equation with specific numbers, e.g.
  "graph f(x)=log₅(x)") → convert to `data-plot` (SVG plotter). Extract the exact function
  and any labeled points from the solution text — don't guess numbers, solve them from the
  CNXML's own worked solution if needed (this was necessary for 6.4's "find the equation
  from the graph" examples).
- **Multi-curve "match the graph" puzzles and purely illustrative photos/diagrams** — leave
  as the auto-generated hotlinked `<img>`. You cannot see the source JPGs, so redrawing them
  risks silently contradicting the answer key. This is an acceptable, documented fallback
  (CLAUDE.md convention 6), not a shortcut to feel bad about.
- Every `data-plot`/`data-desmos` figure keeps its `id="figN"` (already emitted by the
  build script) and `<figcaption>Figure N</figcaption>` — **N is the sequential position of
  that figure in the whole document (1, 2, 3, ...), not the number embedded in the source
  filename** (e.g. `CNX_Precalc_Figure_04_04_013` might be the *10th* figure in the doc,
  i.e. `id="fig10"`). Get this wrong and you'll silently overwrite the wrong figure. Verify
  the mapping with `grep -o 'id="fig[0-9]*"><img[^>]*alt="[^"]\{0,60\}' sections/6-N.html`
  (that's the sandbox scratch copy; the real project path is `sections/college-algebra-2e/6-N.html`)
  before writing any replacement — match by the alt text, not by assumption.
- If you add any `data-desmos` figure, add the Desmos API `<script>` tag to `<head>`
  (see CLAUDE.md convention 8) — `verify-section.mjs` now fails the build if you forget it.

**Sol-hints.** Every non-warmup `Example` gets one `<p class="sol-hint">...</p>` inserted
between its `ex-body`'s closing `</div>` and the following `<div class="solution">`. One
short sentence pointing at the *first move*, never the answer. See
`sections/college-algebra-2e/6-1.html` for tone/length (the class exists in `style.css`
already).

## 4. Known bugs already fixed — use the current `tools/build-section.mjs`, don't rewrite it

If you're regenerating the pipeline scripts from scratch instead of copying the real
`tools/build-section.mjs`, you'll rediscover these the hard way:

- `<mtext>` content containing a literal `$`, `#`, `%`, or `&` must be escaped for KaTeX
  (currency values like "$2,500" appear in word problems) — otherwise KaTeX either errors
  on a stray `$` or silently comments out the rest of the line on `%`.
- `mtable` → `\begin{array}{l}` must count actual columns, not hardcode one `l` — multi-column
  tables (e.g. step-by-step equation solutions) trigger a KaTeX strict-mode warning otherwise.
- `<link target-id="...">` references to figures should resolve to `<a href="#figN">Figure
  N</a>`, not the placeholder "(see original)". The current script does this for figures via
  a pre-pass that numbers figures in document order (`figIdMap`) before rendering. It does
  **not** resolve links to tables or other examples — those still fall back to
  "(see original)"; that's a known, acceptable gap, not a regression.

## 5. Deliver

1. Copy the finished, verified `sections/6-N.html` from the sandbox scratch dir to the real
   project's `sections/college-algebra-2e/6-N.html` with Write (read the sandbox file's
   content, write it to the project path — for files too large to Read in one call, either
   chunk it with offset/limit or delegate the mechanical copy to a subagent so the bulk text
   doesn't fill your own context).
2. In `assets/app.js`, change that section's manifest entry from `{ id, title, module }` to
   `{ id, title, file: "6-N.html", ready: true }` (just the filename — `sectionsDir` already
   points at `sections/college-algebra-2e`).
3. In `books/college-algebra-2e/index.html`, change the `<span>6.N ...</span>` placeholder to
   `<a href="../../sections/college-algebra-2e/6-N.html">6.N ...</a>` — **re-read the file
   immediately before editing** in case another concurrent session already touched nearby
   lines.
4. Append a dated entry to `tools/AUTOBUILD_LOG.md`.

## 6. On failure

Per standing instruction: attempt one automated fix, re-verify once. If it still fails,
leave that section's manifest entry as `module`-only (not `ready: true`), log the specific
failure in `tools/AUTOBUILD_LOG.md`, and move on to the next section rather than stalling.
