# Editing Guide — Making Changes to the MX Algebra Content

This is a guide for teachers and the Math Department on how content changes to this
site actually get made: what's editable, where it lives, what "coding" is really
involved, and the syntax you need for math and interactive graphs. It's written for
someone who isn't a full-time developer.

**Read this before editing anything.** If you just want to understand the codebase
conventions in depth (for a Claude Code session or a more technical contributor), see
[CLAUDE.md](CLAUDE.md) — this guide is the friendlier front door to the same rules.

## The process: discuss before you edit

This site is the students' live textbook right now — not a draft. Before any content
change is made (wording, examples, added hints, swapped figures, a new interactive
graph, anything beyond a typo fix), it should be **discussed and agreed at the course
level, then the department level.** Once there's agreement on *what* should change,
then someone makes the edit (themselves, or by asking Mike).

Two different kinds of requests:

- **"I don't want to touch code, I just want this changed"** — write up exactly what
  you want changed and why, and send it to Mike Harrington
  (mharrington@mxschool.edu). He (or whoever ends up owning this) will make the edit.
- **"I'm comfortable editing a text file and want to do it myself"** — read on. After
  department sign-off, edit the file, run the verifier (see below), and either hand
  the changed file to Mike or open a pull request if you have GitHub access.

## What "coding" means here

There's no build step, no framework, no server, no compiling. The whole site is plain
HTML/CSS/JavaScript files that you can open in a plain text editor (Notepad works;
[VS Code](https://code.visualstudio.com/) is free and much easier to read HTML in),
edit, save, and the change takes effect the moment the file is re-uploaded to the
host. Nearly everything you'll do is: find a pattern that already exists elsewhere on
the page, and copy that pattern with new content — not writing code from scratch.

## Where things live

```
index.html                    the book's home page / chapter list
sections/<book>/<slug>.html   one page per section, e.g.
                               sections/college-algebra-2e/6-2.html,
                               sections/intermediate-algebra-2e/9-7.html
assets/style.css               one shared stylesheet — colors, spacing, layout
assets/app.js                  the sidebar's chapter/section list (the "BOOK
                               manifest") + all interactive behavior
tools/build-section.mjs        script that auto-generates a brand-new section page
                               from OpenStax's original source (bigger job, see below)
tools/verify-section.mjs       script that checks a page for broken math/figures/HTML
                               before you publish it
```

## Changes that are safe to make directly

- Fixing a typo or awkward phrasing in material **we added** — a hint, a figure
  caption, alt text. Open the section's `.html` file, find the text, edit it, save.
- Adding or adjusting the one-sentence "first move" hint under a worked example
  (`<p class="sol-hint">...</p>` — sits right before that example's `.solution` div).
  It should point at the first move only, never give away the answer.
- Turning a static figure into a Desmos slider, when the figure demonstrates a
  *family* of curves (see "Figures" below).
- Color/spacing tweaks in `assets/style.css` — but always use the existing CSS
  variables, never a hardcoded color. The variable names are historical and don't
  match their current color exactly — `--gold` is actually the black/near-black
  accent, `--blue` is the grey accent, `--plum` is a deep crimson — change what a
  variable *equals*, not its name, and every page updates together.

## Changes that need department discussion first, always

- **Any change to the actual content of a page** — the wording of a definition, an
  example, an exercise, a numbered answer, adding/removing a problem. This is the
  one category where the default rule is *don't*, until the course and then the
  department have explicitly agreed to it. Once they have, it's allowed and it's a
  perfectly ordinary text edit — see "What this actually means to edit," below.
- Removing or altering the CC BY attribution footer at the bottom of every page —
  it's legally required by the OpenStax license, not optional styling (though see
  the note on "indicate if changes were made" below, which *is* something the
  footer wording may need to reflect once content diverges from the source).

### What this actually means to edit

Important distinction: **we are not editing OpenStax's book.** Their official text
stays exactly as published, forever, in their own GitHub repo and at openstax.org —
this project only reads from it once, when a page is first built. What lives in
this project's `sections/*.html` files is *our copy*, served only to Middlesex
students. So a department-approved wording change is not "modifying OpenStax
content" in any sense that touches the original — it's editing our local rendition
of it, exactly the same mechanical action as fixing a typo in a hint we added
ourselves: open the section's `.html` file, find the paragraph/example/exercise
text, edit it between its tags, save. There's no separate process or tooling for
this — it's the same file, the same `.card.example` / `.ex-body` / `.exercise`
structure described throughout this guide.

A few things worth knowing before doing it, though:

- **Answer/count consistency.** `tools/verify-section.mjs` checks example/Try
  It/exercise/answer counts against numbers you pass in (originally sourced from
  the CNXML). If you add, remove, or renumber anything, those expected counts (and
  any `#exampleN`/`#exN` anchors and Key Concepts links that reference the old
  numbering) need to be updated to match — a mismatch there is exactly the kind of
  drift the verifier exists to catch.
- **License note.** CC BY 4.0 requires indicating when you've modified the
  licensed material, not just crediting it. The attribution footer text is
  auto-generated by `assets/app.js` (search for `Content from`) from each book's
  `source`/`license` entry, book-wide — it doesn't currently distinguish an
  untouched section from a locally-adapted one. If a department decision produces
  a substantively reworded section, flag it to Mike so the footer wording (or a
  per-section note) can say "Adapted from," not just "Content from" — this isn't
  wired up per-section yet.

## Math syntax (KaTeX)

Math is written as LaTeX, wrapped in delimiters, and rendered live in the browser:

- Inline math: `\( ... \)` — e.g. `\(f(x)=2^x\)` renders inline with the sentence.
- Display (centered, own line) math: `\[ ... \]`
- Multi-step derivations use an aligned block, with `&&` introducing a step note:

  ```
  \[
  \begin{aligned}
  f(x) &= 2^x + 3 && \text{start} \\
  f(2) &= 2^2 + 3 && \text{substitute } x=2 \\
  &= 7
  \end{aligned}
  \]
  ```

- Handy commands: `^{ }` superscript, `_{ }` subscript, `\cdot` for multiplication,
  `\frac{a}{b}` for fractions, `\sqrt{ }`, `\le`, `\ge`, `\ne`, `\pi`, `\infty`.
- **`$` is reserved for actual currency amounts in text** — never use it to open a
  math expression, only `\(` / `\[`.
- After any math edit, reload the page and look at it. If you see raw backslashes,
  braces, or LaTeX commands sitting in the text instead of a rendered formula,
  something's unbalanced — almost always a `\(` or `\[` with no matching `\)` / `\]`.
  `tools/verify-section.mjs` (below) also catches this automatically.

## Figures: two patterns

**Default — the original OpenStax image**, hotlinked from their GitHub repo. Use this
for basically every figure; it matches the source book and looks best:

```html
<figure class="plot" id="fig1">
  <img src="https://raw.githubusercontent.com/openstax/osbooks-college-algebra-bundle/main/media/CNX_Precalc_Figure_04_06_001.jpg"
       alt="Seven rabbits in front of a brick building."
       style="max-width:100%;border:1px solid var(--line);border-radius:14px">
  <figcaption>Figure 1 — Wild rabbits in Australia. (credit: Richard Taylor, Flickr)</figcaption>
</figure>
```

**Desmos slider — only** when a figure demonstrates a *family* of curves as a
parameter varies (a vertical/horizontal shift, a stretch/compression, a reflection,
the general `y=ab^x` form, etc.). See below.

## Building a Desmos embed

The page's `<head>` needs the Desmos API script tag already present (every page that
already has a `data-desmos` figure has it — if starting a brand-new page, copy the
`<head>` from an existing one, e.g. `sections/college-algebra-2e/6-2.html`).

Real example, taken from `sections/college-algebra-2e/6-2.html` (shown here spread across lines for
readability — in the actual file the JSON must be all on **one line** inside the
single-quoted `data-spec` attribute):

```html
<figure class="plot" id="fig3" data-desmos data-spec='{
  "bounds": {"left": -3, "right": 3, "bottom": -1, "top": 9},
  "sliders": [
    {"var": "b", "min": 0.2, "max": 4, "step": 0.1, "value": 2, "color": "#cf003d"}
  ],
  "curves": [
    {"latex": "y=b^{x}", "color": "#cf003d"}
  ],
  "alt": "Interactive graph of f(x)=b^x — drag b to compare growth (b>1) and decay (0<b<1)"
}'><figcaption>Figure 3</figcaption></figure>
```

Field guide:

| Field | Meaning |
|---|---|
| `bounds` | the visible window: `left`/`right`/`bottom`/`top` |
| `sliders` | one entry per draggable constant — `var` is the letter used in your curve's `latex`; `min`/`max`/`step`/`value` set its range and starting point; `color` is a hex code (use the brand crimson `#cf003d` for the "hero" slider) |
| `curves` | one entry per plotted curve — `latex` is Desmos math syntax (very close to KaTeX's, but its own dialect — e.g. `\cdot` for multiplication, `{ }` around exponents) |
| `domain` *(optional, per curve)* | only for parametric/polar curves that need to sweep past Desmos's default 0–1 range — see [CLAUDE.md](CLAUDE.md) convention 7 for why (Desmos silently truncates otherwise) |
| `alt` | a text description for screen readers / if the API fails to load — always include one |

Keep the **same function(s) and values the original OpenStax figure used** as your
slider defaults — the goal is making the existing figure interactive, not inventing a
new scenario.

**Where to build the graph itself:** play with it live and free at
**https://www.desmos.com/calculator** first — get the curve(s) and slider(s) looking
right there, then port the LaTeX and bounds you land on into the JSON above. Full
Desmos API / LaTeX syntax reference: **https://www.desmos.com/api/v1.11/docs/index.html**

## Before publishing any change

Run the verifier once you have Node.js 18+ installed:

```
node tools/verify-section.mjs sections/college-algebra-2e/6-2.html
```

It checks that every math snippet renders, every figure's JSON is valid, HTML tags
are balanced, and (for full sections) example/Try It/exercise counts match the
source. Fix anything it flags before the page goes live.

## Adding a brand-new section (bigger job)

This is the "auto-build a whole page from OpenStax's source" workflow — meaningfully
more setup than the edits above, and it also means adding a new row to the site
navigation that students will see, which is exactly the kind of visible, permanent
change that needs course/department agreement before it happens. See README.md
("Adding more sections yourself") and CLAUDE.md ("Add a section" / "Hand-pass a
section") for the full step-by-step, and loop in Mike before starting one.

## Questions or stuck?

Mike Harrington — mharrington@mxschool.edu — Math Department.
