# Middlesex Math — a friendlier reader for OpenStax textbooks

Same content, same exercises, same numbering as the OpenStax source books, presented with:

- clean reading typography, dark mode, reading-progress bar
- collapsible solutions on worked examples ("try before you peek")
- interactive Try Its with show-answer + self-check tracking (saved in the browser)
- section exercises with original numbering; odd-numbered answers revealable
- OpenStax's original figures, plus interactive Desmos sliders for parameter-family graphs
- KaTeX-rendered math
- site-wide search across every book

Four books are built out as far as Middlesex's courses need them: **College Algebra 2e**,
**Precalculus 2e**, **Intermediate Algebra 2e**, and **Calculus Volume 3**. **Calculus
Volume 1** is in progress. See `CLAUDE.md`'s "Current build state" section for exact
chapter-by-chapter coverage — it's kept current there, not duplicated here.

## Files

```
index.html                        book home / table of contents
sections/<book-id>/<slug>.html    one page per section (e.g. sections/college-algebra-2e/6-1.html)
assets/style.css                  design system (light + dark)
assets/app.js                     behavior + the BOOK manifest (sidebar nav, search)
assets/search-index.json          generated site-wide search index
tools/build-section.mjs           generate more sections yourself — no AI needed
tools/build-search-index.mjs      regenerate assets/search-index.json after content edits
tools/resolve-crossrefs.mjs       patch cross-module links build-section.mjs can't resolve alone
tools/verify-section.mjs          fidelity/completeness checks before marking a section ready
```

## Hosting (GitHub Pages, ~5 minutes)

1. Create a repository on GitHub (e.g. `mx-algebra`).
2. Upload this folder's contents (drag-and-drop works on github.com).
3. Repo Settings → Pages → Source: `main` branch, root folder. Save.
4. Your site is live at `https://<your-username>.github.io/mx-algebra/`.

Any static host works (Netlify, school web space, etc.) — there is no server code.

## Adding more sections yourself

Every OpenStax section is a "module" in their public GitHub repo. With Node 18+ installed:

```
node tools/build-section.mjs m49362 6-2 "Graphs of Exponential Functions"
node tools/build-section.mjs --book calculus-v1 m53483 2-1 "A Preview of Calculus"
```

`--book` defaults to `college-algebra-2e`; pass it explicitly for any other book (valid
values are the BOOK manifest's keys in `assets/app.js`: `college-algebra-2e`,
`precalculus-2e`, `intermediate-algebra-2e`, `calculus-v1`, `calculus-v3` — each has its
own repo, section directory, brand, and license/attribution baked into
`build-section.mjs`'s `BOOK_DEFAULTS`). The script fetches the section source, converts
the math, and emits a page with the standard styling, collapsible solutions, Try It
self-checks, and exercise answer reveals — but its output is a *draft*: CLAUDE.md's
"Hand-pass a section" workflow (sol-hints, Key Concepts links, figure choices) is required
before marking it `ready: true`, and `tools/verify-section.mjs` will hard-fail a build that
skips it. After any hand-pass edit, also run `node tools/build-search-index.mjs` to keep
site-wide search in sync.

### Module IDs — College Algebra 2e

| Chapter | Modules (in section order) |
|---|---|
| 1 Prerequisites | m51240 m51239 m51241 m51242 m51246 m51247 m51248 |
| 2 Equations and Inequalities | m51251 m51252 m51253 m51254 m51255 m51256 m51258 m51259 |
| 3 Functions | m51260 (intro) m51261 m51262 m51263 m51265 m51266 m51267 m51268 |
| 4 Linear Functions | m51269 m51270 m51271 m51272 |
| 5 Polynomial and Rational Functions | m51273 m51274 m51275 m51276 m51277 m51278 m51279 m51280 m51281 |
| 6 Exponential and Logarithmic Functions | m49356 (intro) m49361 m49362 m49363 m49364 m49365 m49366 m49367 m49368 |
| 7 Systems of Equations and Inequalities | m49418 m49420 m49419 m49431 m49432 m49433 m49434 m49435 m49436 |
| 8 Analytic Geometry | m49437 m49438 m49439 m49440 m49441 m49442 |
| 9 Sequences, Probability, and Counting Theory | m49443 m49444 m49445 m49446 m49447 m49448 m49449 m49450 |

Source repo: https://github.com/openstax/osbooks-college-algebra-bundle

### Module IDs — Precalculus 2e

Same repo as College Algebra 2e (`osbooks-college-algebra-bundle`,
`collections/precalculus-2e.collection.xml`), but its own distinct set of module IDs —
don't assume a chapter number lines up with College Algebra 2e's module for the same
topic. Chapters 2 (Linear Functions) and 9 (Systems of Equations and Inequalities) are
not built on this site (see CLAUDE.md's "Current build state").

| Chapter | Modules (in section order) |
|---|---|
| 1 Functions | m49299 m49301 m49304 m49306 m49308 m49312 m49314 m49320 |
| 2 Linear Functions | m49321 m49324 m50389 m49326 m49327 |
| 3 Polynomial and Rational Functions | m49334 m49335 m49337 m49346 m49347 m49348 m49349 m49351 m49352 m49353 |
| 4 Exponential and Logarithmic Functions | m49356 m49361 m49362 m49363 m49364 m49365 m49366 m49367 m49368 |
| 5 Trigonometric Functions | m49369 m49371 m49372 m49374 m49384 |
| 6 Periodic Functions | m49386 m49387 m49389 m49390 |
| 7 Trigonometric Identities and Equations | m49392 m49393 m49395 m49396 m49397 m49398 m49399 |
| 8 Further Applications of Trigonometry | m49402 m49404 m49405 m49406 m49407 m49408 m49409 m49411 m49412 |
| 9 Systems of Equations and Inequalities | m49418 m49420 m49419 m49431 m49432 m49433 m49434 m49435 m49436 |
| 10 Analytic Geometry | m49437 m49438 m49439 m49440 m49441 m49442 |
| 11 Sequences, Probability and Counting Theory | m49443 m49444 m49445 m49446 m49447 m49448 m49449 m49450 |
| 12 Introduction to Calculus | m49451 m49452 m49453 m49454 m49455 |

Note NC-SA license, unlike plain College Algebra 2e's CC BY — see the license note below.

### Module IDs — Algebra and Trigonometry 2e (roadmap, not started)

Same repo again (`collections/algebra-and-trigonometry-2e.collection.xml`). Shares a lot
of module IDs directly with College Algebra 2e (its Chapter 1 Prerequisites, for
instance, is byte-for-byte the same module list) — when this book gets picked up, check
`errata-reports/` for shared-content errata already surfaced against the other book first.

| Chapter | Modules (in section order) |
|---|---|
| 1 Prerequisites | m51240 m51239 m51241 m51242 m51246 m51247 m51248 |
| 2 Equations and Inequalities | m51251 m51252 m51253 m51254 m51255 m51256 m51258 m51259 |
| 3 Functions | m51260 (intro) m51261 m51262 m51263 m51265 m51266 m51267 m51268 |
| 4 Linear Functions | m51269 m51270 m51271 m51272 |
| 5 Polynomial and Rational Functions | m51273 m51274 m51275 m51276 m51277 m51278 m51279 m51280 m51281 |
| 6 Exponential and Logarithmic Functions | m49356 m49361 m49362 m49363 m49364 m49365 m49366 m49367 m49368 |
| 7 The Unit Circle: Sine and Cosine Functions | m51282 m51283 m51284 m51285 m51286 |
| 8 Periodic Functions | m49386 m49387 m49389 m49390 |
| 9 Trigonometric Identities and Equations | m51287 m51288 m51289 m51290 m51291 m51292 |
| 10 Further Applications of Trigonometry | m49402 m49404 m49405 m49406 m49407 m49408 m49409 m49411 m49412 |
| 11 Systems of Equations and Inequalities | m49418 m49420 m49419 m49431 m49432 m49433 m49434 m49435 m49436 |
| 12 Analytic Geometry | m49437 m49438 m49439 m49440 m49441 m49442 |
| 13 Sequences, Probability, and Counting Theory | m49443 m49444 m49445 m49446 m49447 m49448 m49449 m49450 |

### Module IDs — Intermediate Algebra 2e

Repo: https://github.com/openstax/osbooks-prealgebra-bundle (also contains Prealgebra 2e
and Elementary Algebra 2e). Collection file: `collections/intermediate-algebra-2e.collection.xml`.
First module (m81357) is the preface.

| Chapter | Modules (in section order) |
|---|---|
| 1 Foundations | m81358 m81422 m81423 m81359 m81425 m81360 |
| 2 Solving Linear Equations | m81361 m81362 m81363 m81364 m81365 m81366 m81367 m81426 |
| 3 Graphs and Functions | m81368 m81369 m81370 m81371 m81372 m81373 m81374 |
| 4 Systems of Linear Equations | m81375 m81427 m81380 m81381 m81428 m81429 m81431 m81432 |
| 5 Polynomials and Polynomial Functions | m81382 m81383 m81384 m81385 m81386 |
| 6 Factoring | m81438 m81437 m81387 m81388 m81389 m81390 |
| 7 Rational Expressions and Functions | m81391 m81392 m81439 m81440 m81393 m81394 m81441 |
| 8 Roots and Radicals | m81442 m81444 m81445 m81396 m81397 m81446 m81398 m81447 m81448 |
| 9 Quadratic Equations and Functions | m81399 m81400 m81401 m81449 m81402 m81403 m81404 m81405 m81406 |
| 10 Exponential and Logarithmic Functions | m81407 m81408 m81409 m81410 m81411 m81450 |
| 11 Conics | m81412 m81452 m81413 m81414 m81415 m81453 |
| 12 Sequences, Series and Binomial Theorem | m81416 m81417 m81418 m81419 m81420 |

### Module IDs — Calculus Volumes 1–3

Repo: https://github.com/openstax/osbooks-calculus-bundle. The three volumes share
modules (Vol 2 reuses Vol 1's Integration chapters; Vol 3 reuses Vol 2's Parametric/Polar
chapter). Prefaces: m60027 (V1), m60028 (V2), m60029 (V3). Appendices: m54049 m54050 m54053.

**Volume 1**

| Chapter | Modules (in section order) |
|---|---|
| 1 Functions and Graphs | m53472 m53477 m53478 m53479 m53480 m53481 |
| 2 Limits | m53483 m53485 m53491 m53492 m53489 m53493 |
| 3 Derivatives | m53494 m53495 m53573 m53575 m53576 m53578 m53581 m53584 m53585 m53586 |
| 4 Applications of Derivatives | m53602 m53604 m53605 m53611 m53612 m53613 m53596 m53614 m53619 m53620 m53621 |
| 5 Integration | m53623 m53624 m53631 m53632 m53633 m53634 m53635 m53636 |
| 6 Applications of Integration | m53638 m53640 m53642 m53643 m53644 m53648 m53649 m53650 m53651 m53653 |

**Volume 2**

| Chapter | Modules (in section order) |
|---|---|
| 1 Integration | (same as Vol 1 ch 5) |
| 2 Applications of Integration | (same as Vol 1 ch 6) |
| 3 Techniques of Integration | m53654 m53656 m53657 m53659 m53681 m53684 m53685 m53686 |
| 4 Introduction to Differential Equations | m53696 m53697 m53701 m53704 m53710 m53713 |
| 5 Sequences and Series | m53756 m53758 m53739 m53754 m53751 m53743 m53747 |
| 6 Power Series | m53760 m53761 m53762 m53817 m53769 |
| 7 Parametric Equations and Polar Coordinates | m53831 m53834 m53850 m53852 m53840 m53846 |

**Volume 3**

| Chapter | Modules (in section order) |
|---|---|
| 1 Parametric Equations and Polar Coordinates | (same as Vol 2 ch 7) |
| 2 Vectors in Space | m53906 m53900 m53897 m53902 m53903 m53870 m53874 m53875 |
| 3 Vector-Valued Functions | m53907 m53913 m53916 m53919 m53930 |
| 4 Differentiation of Functions of Several Variables | m53929 m53946 m53933 m53934 m53937 m53938 m53940 m53942 m53943 |
| 5 Multiple Integration | m53961 m53949 m53963 m53966 m53965 m53967 m53971 m53970 |
| 6 Vector Calculus | m54017 m53989 m54012 m53987 m53982 m53986 m54004 m54009 m54001 |
| 7 Second-Order Differential Equations | m54039 m54040 m54047 m54044 m54046 |

**License note:** College Algebra 2e is CC BY 4.0; every other book on this site
(Precalculus 2e, Algebra and Trigonometry 2e, Intermediate Algebra 2e, and all three
Calculus volumes) declares CC BY-NC-SA 4.0 in its own collection file, even where it
shares a GitHub repo with College Algebra 2e — license is per-collection, not per-repo.
`build-section.mjs`'s `BOOK_DEFAULTS` already has the right license/attribution baked in
per book; if you add a new book, confirm its license on openstax.org first and add a
matching entry there rather than assuming CC BY.

## License / attribution

Each page's own footer names its actual source book, author, and license — CC BY 4.0 for
College Algebra 2e, CC BY-NC-SA 4.0 for everything else (see the license note above).
This site is an independent presentation and is not affiliated with or endorsed by
OpenStax. Keep the attribution footer on every page — required by both licenses. The
original, always-current OpenStax text for any book here is free at
https://openstax.org/subjects/math.
