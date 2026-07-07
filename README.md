# MX Algebra — a friendlier reader for OpenStax College Algebra 2e

Same content, same exercises, same numbering as the OpenStax book, presented with:

- clean reading typography, dark mode, reading-progress bar
- collapsible solutions on worked examples ("try before you peek")
- interactive Try Its with show-answer + self-check tracking (saved in the browser)
- section exercises with original numbering; odd-numbered answers revealable
- crisp interactive SVG graphs instead of scanned images
- KaTeX-rendered math

## Files

```
index.html            book home / table of contents
sections/6-1.html     Section 6.1 Exponential Functions (complete)
assets/style.css      design system (light + dark)
assets/app.js         behavior + the BOOK manifest (sidebar nav)
tools/build-section.mjs   generate more sections yourself — no AI needed
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
```

Then open `assets/app.js` and mark that section `ready: true` in the BOOK manifest.
The script fetches the section source, converts the math, and emits a page with the
same styling, collapsible solutions, Try It self-checks, and exercise answer reveals.
(Auto-built pages use the book's original figure images; the hand-built 6.1 uses
redrawn interactive SVG graphs.)

### Module IDs — College Algebra 2e

| Chapter | Modules (in section order) |
|---|---|
| 1 Prerequisites | m51240 m51239 m51241 m51242 m51246 m51247 m51248 |
| 2 Equations and Inequalities | m51251 m51252 m51253 m51254 m51255 m51256 m51258 m51259 |
| 3 Functions | m51260 m51261 m51262 m51263 m51265 m51266 m51267 m51268 |
| 4 Linear Functions | m51269 m51270 m51271 m51272 |
| 5 Polynomial and Rational Functions | m51273 m51274 m51275 m51276 m51277 m51278 m51279 m51280 m51281 |
| 6 Exponential and Logarithmic Functions | m49356 (intro) m49361 m49362 m49363 m49364 m49365 m49366 m49367 m49368 |
| 7 Systems of Equations and Inequalities | m49418 m49420 m49419 m49431 m49432 m49433 m49434 m49435 m49436 |
| 8 Analytic Geometry | m49437 m49438 m49439 m49440 m49441 m49442 |
| 9 Sequences, Probability, and Counting Theory | m49443 m49444 m49445 m49446 m49447 m49448 m49449 m49450 |

Source repo: https://github.com/openstax/osbooks-college-algebra-bundle

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

**License note for expansion:** the Calculus and Intermediate Algebra collection files
declare CC BY-NC-SA 4.0 (vs. CC BY 4.0 for College Algebra 2e). Before publishing pages
from a new book, confirm the license on that book's openstax.org page and match the
attribution footer to it. NC-SA is fine for a free school site but requires the footer
to name the correct license.

**Build-script note:** `tools/build-section.mjs` currently fetches only from
osbooks-college-algebra-bundle. Pulling from these repos requires adding a repo
parameter (and per-repo media path) — see CLAUDE.md roadmap.

## License / attribution

Textbook content © OpenStax (Jay Abramson, *College Algebra 2e*), licensed
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This site is an
independent presentation and is not affiliated with or endorsed by OpenStax.
Keep the attribution footer on every page. The original, always-current text is
free at https://openstax.org/details/books/college-algebra-2e.
