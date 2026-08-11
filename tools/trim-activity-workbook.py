#!/usr/bin/env python
"""Post-processes the authors' own acm-activity-workbook.pdf (a real LaTeX/PreTeXt build,
correct math, all four chapters including the Sage-heavy Vector Calculus chapter):

1. Masks the thick blue vertical rule bracketing every activity in the left margin -- a
   stroked line (not a filled box, not text) at a consistent position/color across the whole
   book. Can't delete it as "content" without rebuilding from LaTeX source, so instead masks
   it with a white line redrawn on top at the same coordinates.
2. Every activity is followed by an intentional blank left-hand page (by design, per the
   book's own preface -- ~42% of the document). Rather than deleting these, turns the bottom
   half of each into a small note-taking organizer (top half stays blank workspace, matching
   Middlesex's own "Meaningful Notes" template style: a couple of labeled boxes, not the
   full 5-box original -- just "What I Learned" and "Important" (formulas/key items)).

Usage: python tools/trim-activity-workbook.py acm-activity-workbook.pdf activity-workbook-final.pdf
"""
import sys
import fitz  # PyMuPDF

PAGE_W, PAGE_H = 612, 792  # US Letter, points
MARGIN = 54
GAP = 20
ORGANIZER_TOP = 420  # bottom half starts here; page content above this is left untouched
ORGANIZER_BOTTOM = PAGE_H - 60

BOXES = [
    ("What I Learned", "Key takeaways from this activity"),
    ("Important", "Formulas and results to remember"),
]

def draw_organizer(page):
    box_w = (PAGE_W - 2 * MARGIN - GAP) / len(BOXES)
    for i, (title, prompt) in enumerate(BOXES):
        x0 = MARGIN + i * (box_w + GAP)
        rect = fitz.Rect(x0, ORGANIZER_TOP, x0 + box_w, ORGANIZER_BOTTOM)
        page.draw_rect(rect, color=(0.4, 0.4, 0.4), width=1, radius=0.04)
        pad = 10
        # insert_textbox silently draws nothing (not even clipped) when text doesn't fit the
        # given rect at all -- a plain fontsize*1 tall box isn't enough room once line-height/
        # ascent overhead is included, which is what silently dropped these titles before.
        title_r = page.insert_textbox(
            fitz.Rect(x0 + pad, ORGANIZER_TOP + 8, x0 + box_w - pad, ORGANIZER_TOP + 30),
            title, fontname="hebo", fontsize=12, color=(0, 0, 0))
        prompt_r = page.insert_textbox(
            fitz.Rect(x0 + pad, ORGANIZER_TOP + 30, x0 + box_w - pad, ORGANIZER_TOP + 48),
            prompt, fontname="helv", fontsize=9, color=(0.35, 0.35, 0.35))
        if title_r < 0 or prompt_r < 0:
            print(f"WARNING: '{title}' box text didn't fit (title={title_r}, prompt={prompt_r})")

def main():
    if len(sys.argv) != 3:
        print("Usage: python tools/trim-activity-workbook.py <input.pdf> <output.pdf>")
        sys.exit(1)
    src, dst = sys.argv[1], sys.argv[2]
    doc = fitz.open(src)

    # Blue bracket rule: consistent stroked line at x0=55.5, color (0, 0.31, 0.53) — verified
    # against all 198 occurrences in the source PDF before hardcoding these thresholds.
    BAR_COLOR = (0.0, 0.31171131134033203, 0.5313191413879395)
    def is_bar(d):
        c = d.get("color")
        return c is not None and all(abs(c[i] - BAR_COLOR[i]) < 0.02 for i in range(3))

    masked = 0
    # Identify blank pages from the ORIGINAL content before we draw anything on them —
    # otherwise our own inserted text would make a page look "non-blank" to a check done later.
    blank_pages = [i for i, page in enumerate(doc) if not page.get_text().strip()]

    # Front matter (title pages, preface, TOC) has its own blank pages -- those shouldn't get
    # a "what did I learn from this activity" organizer since there's no activity yet. Body
    # content starts at the first activity's own page; skip every blank page before it.
    body_start = next(i for i, page in enumerate(doc) if "Preview Activity 9.1.1" in page.get_text())
    organizer_pages = [i for i in blank_pages if i > body_start]

    for i, page in enumerate(doc):
        for d in page.get_drawings():
            if is_bar(d):
                r = d["rect"]
                # Slightly wider than the original ~3pt stroke so antialiasing at the edges
                # doesn't leave a thin blue sliver visible.
                page.draw_line(fitz.Point(r.x0, r.y0), fitz.Point(r.x1, r.y1),
                                color=(1, 1, 1), width=d.get("width", 3) + 1.5)
                masked += 1
        if i in organizer_pages:
            draw_organizer(page)

    doc.save(dst)
    print(f"Masked {masked} blue bars. Added a notes organizer to {len(organizer_pages)} "
          f"blank pages (of {len(blank_pages)} blank, {len(doc)} total). Wrote {dst}.")

if __name__ == "__main__":
    main()
