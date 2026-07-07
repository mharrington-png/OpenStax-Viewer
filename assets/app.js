/* MX Algebra reader — shared behavior */

/* ---------- book manifest: add sections here as you build them ---------- */
const BOOK = {
  title: "College Algebra",
  chapters: [
    { n: 6, title: "Exponential and Logarithmic Functions", sections: [
      { id: "6-1", title: "6.1 Exponential Functions", file: "6-1.html", ready: true },
      { id: "6-2", title: "6.2 Graphs of Exponential Functions", file: "6-2.html", ready: true },
      { id: "6-3", title: "6.3 Logarithmic Functions", file: "6-3.html", ready: true },
      { id: "6-4", title: "6.4 Graphs of Logarithmic Functions", file: "6-4.html", ready: true },
      { id: "6-5", title: "6.5 Logarithmic Properties", module: "m49365" },
      { id: "6-6", title: "6.6 Exponential and Logarithmic Equations", module: "m49366" },
      { id: "6-7", title: "6.7 Exponential and Logarithmic Models", module: "m49367" },
      { id: "6-8", title: "6.8 Fitting Exponential Models to Data", module: "m49368" },
    ]},
  ],
};

/* ---------- theme ---------- */
const themeKey = "mxalg-theme";
function applyTheme(t) { document.documentElement.dataset.theme = t; }
applyTheme(localStorage.getItem(themeKey) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
function toggleTheme() {
  const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(themeKey, t); applyTheme(t);
}

/* ---------- per-page setup ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const isSection = location.pathname.includes("/sections/");
  const root = isSection ? ".." : ".";

  /* sidebar: collapsible book contents + auto-generated page outline */
  const sb = document.querySelector(".sidebar");
  if (sb) {
    let book = "";
    for (const ch of BOOK.chapters) {
      book += `<h4>Chapter ${ch.n} · ${ch.title}</h4>`;
      for (const s of ch.sections) {
        if (s.ready) {
          const active = location.pathname.endsWith("/" + s.file) ? " class=\"active\"" : "";
          book += `<a href="${root}/sections/${s.file}"${active}>${s.title}</a>`;
        } else {
          book += `<a class="soon">${s.title}</a>`;
        }
      }
    }
    sb.innerHTML =
      `<details class="booknav"${isSection ? "" : " open"}><summary>Book contents</summary>${book}</details>` +
      `<div class="outline"></div>`;
    if (isSection) buildOutline(sb.querySelector(".outline"));

    /* whole-sidebar show/hide toggle, persisted, independent of practice panel */
    const topbar = document.querySelector(".topbar");
    if (topbar) {
      const btn = document.createElement("button");
      btn.className = "iconbtn navbtn";
      btn.title = "Show or hide the contents sidebar";
      btn.textContent = "☰";
      topbar.insertBefore(btn, topbar.firstChild);
      const key = "mxalg-nav";
      const apply = on => { document.body.classList.toggle("nosidebar", !on); btn.classList.toggle("on", on); };
      let on = localStorage.getItem(key) !== "0";
      apply(on);
      btn.addEventListener("click", () => { on = !on; localStorage.setItem(key, on ? "1" : "0"); apply(on); });
    }
  }

  // theme button
  document.querySelectorAll("[data-theme-toggle]").forEach(b => b.addEventListener("click", toggleTheme));

  // split practice panel
  setupSplit();

  // reading progress
  const bar = document.getElementById("progressbar");
  if (bar) {
    const upd = () => {
      const h = document.documentElement;
      bar.style.width = (100 * h.scrollTop / (h.scrollHeight - h.clientHeight)) + "%";
    };
    addEventListener("scroll", upd, { passive: true }); upd();
  }

  // collapsible solutions
  document.querySelectorAll(".solution .sol-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const sol = btn.closest(".solution");
      sol.classList.toggle("open");
      const tryit = btn.closest(".tryit");
      if (tryit && sol.classList.contains("open")) tryit.classList.add("answered");
    });
  });

  // exercise answer buttons
  document.querySelectorAll(".exercise .answer > button").forEach(btn => {
    btn.addEventListener("click", () => {
      const a = btn.parentElement;
      a.classList.toggle("open");
      btn.textContent = a.classList.contains("open") ? "Hide answer" : "Show answer";
    });
  });

  // try-it self check, persisted
  const pageKey = "mxalg-" + location.pathname.split("/").pop();
  const saved = JSON.parse(localStorage.getItem(pageKey) || "{}");
  document.querySelectorAll(".tryit").forEach(t => {
    const id = t.id; if (!id) return;
    const mark = saved[id];
    if (mark) { t.classList.add("answered"); }
    t.querySelectorAll(".selfcheck button").forEach(b => {
      if (mark === b.dataset.mark) b.classList.add(b.dataset.mark === "right" ? "on-right" : "on-wrong");
      b.addEventListener("click", () => {
        saved[id] = b.dataset.mark;
        localStorage.setItem(pageKey, JSON.stringify(saved));
        t.querySelectorAll(".selfcheck button").forEach(x => x.classList.remove("on-right", "on-wrong"));
        b.classList.add(b.dataset.mark === "right" ? "on-right" : "on-wrong");
        updateScore();
      });
    });
  });
  function updateScore() {
    const el = document.getElementById("tryit-score"); if (!el) return;
    const total = document.querySelectorAll(".tryit").length;
    const right = Object.values(JSON.parse(localStorage.getItem(pageKey) || "{}")).filter(v => v === "right").length;
    el.textContent = `Try Its: ${right}/${total} ✓`;
  }
  updateScore();

  // math
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true },
      ],
      throwOnError: false,
    });
  }

  // plots
  document.querySelectorAll("[data-plot]").forEach(drawPlot);
  document.querySelectorAll("[data-desmos]").forEach(drawDesmos);
});

/* ---------- page outline: collapsible groups per section heading ---------- */
function buildOutline(container) {
  const main = document.querySelector("main");
  if (!main || !container) return;
  const nodes = main.querySelectorAll("h2[id], .example, .tryit, .card.qa, .card.howto");
  const short = (s, n = 36) => {
    s = (s || "").replace(/\s+/g, " ").trim();
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  };
  const groups = []; let cur = null;
  const counters = { ex: 0, qa: 0, how: 0 };
  nodes.forEach(el => {
    if (el.closest("details.bigfold")) return;           // skip optional warm-up content
    if (el.tagName === "H2") { cur = { id: el.id, title: short(el.textContent, 42), items: [] }; groups.push(cur); return; }
    if (!cur) return;
    let id, badge, cls, label;
    if (el.classList.contains("example")) {
      id = el.id || (el.id = "example-" + (++counters.ex)); badge = "Ex"; cls = "b-ex";
      const num = el.querySelector(".ex-head .num")?.textContent || "Example";
      const t = el.querySelector(".ex-head .t")?.textContent || "";
      label = short(num + (t ? " · " + t : ""));
    } else if (el.classList.contains("tryit")) {
      if (!el.id) return; id = el.id; badge = "Try"; cls = "b-try";
      label = short(el.querySelector(".ex-head .num")?.textContent || "Try It");
    } else if (el.classList.contains("qa")) {
      id = el.id || (el.id = "qa-" + (++counters.qa)); badge = "Q&A"; cls = "b-qa";
      label = short(el.querySelector(".q")?.textContent || "Q&A");
    } else {
      id = el.id || (el.id = "howto-" + (++counters.how)); badge = "How"; cls = "b-how";
      label = short((el.querySelector("strong")?.textContent || "How To").replace(/^Given /, ""));
    }
    cur.items.push({ id, badge, cls, label });
  });

  let html = "<h4>On this page</h4>";
  for (const g of groups) {
    if (!g.items.length) { html += `<a class="lvl1 solo" href="#${g.id}">${g.title}</a>`; continue; }
    html += `<details class="ogroup"><summary><a class="lvl1" href="#${g.id}">${g.title}</a></summary>` +
      g.items.map(it => `<a class="lvl2" href="#${it.id}"><span class="b ${it.cls}">${it.badge}</span>${it.label}</a>`).join("") +
      `</details>`;
  }
  container.innerHTML = html;

  const links = [...container.querySelectorAll("a")];
  const map = new Map(links.map(a => [a.getAttribute("href").slice(1), a]));
  const sbEl = container.closest(".sidebar");
  let current = null;

  /* Groups stay condensed: the spy never expands them. If the active item's group is
     closed, its group heading is highlighted instead. Only a user click expands.
     Never call scrollIntoView here — it can move the page scroll and fight the user. */
  const setActive = (a, userClick) => {
    if (!a) return;
    const g = a.closest("details.ogroup");
    if (g && !g.open && !userClick) a = g.querySelector("summary a.lvl1") || a;
    if (a === current) return;
    current = a;
    links.forEach(x => x.classList.remove("active"));
    a.classList.add("active");
    if (sbEl) {                                           // keep visible by scrolling the sidebar only
      const r = a.getBoundingClientRect(), s = sbEl.getBoundingClientRect();
      if (r.top < s.top + 60 || r.bottom > s.bottom - 20) sbEl.scrollTop += r.top - s.top - 110;
    }
  };
  let holdUntil = 0;

  /* click: navigate, expand that group (explicit user intent), open folds around target */
  container.addEventListener("click", e => {
    const a = e.target.closest("a[href^='#']"); if (!a) return;
    e.preventDefault();                                   // keeps summary clicks from toggling the group
    const id = a.getAttribute("href").slice(1);
    const t = document.getElementById(id); if (!t) return;
    t.closest("details:not(.ogroup)")?.setAttribute("open", "");
    const g = a.closest("details.ogroup"); if (g) g.open = true;
    setActive(a, true);
    holdUntil = Date.now() + 1000;                        // let the smooth scroll finish before spy resumes
    t.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", "#" + id);
  });

  /* scrollspy: last visible target above the reading line (works for short end-of-page sections),
     rAF-throttled, and ignores the sidebar's own scroll events to avoid feedback loops */
  const targets = links.map(a => document.getElementById(a.getAttribute("href").slice(1))).filter(Boolean);
  const spy = () => {
    if (Date.now() < holdUntil) return;
    let best = null, bestTop = -Infinity;
    const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
    for (const t of targets) {
      if (!t.getClientRects().length) continue;           // hidden (e.g., inside a closed fold)
      const top = t.getBoundingClientRect().top;
      if ((top <= 140 || atBottom) && top > bestTop && top < innerHeight) { bestTop = top; best = t; }
    }
    if (best) setActive(map.get(best.id));
  };
  let ticking = false;
  addEventListener("scroll", e => {
    if (e.target === sbEl) return;                        // sidebar scrolling must not retrigger the spy
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; spy(); });
  }, { passive: true, capture: true });                   // capture also catches the practice panel's scroll
  spy();
}

/* ---------- split view: content left, section exercises right ---------- */
function setupSplit() {
  const panel = document.getElementById("exercise-panel-content");
  if (!panel) return;
  const themeBtn = document.querySelector("[data-theme-toggle]");
  if (!themeBtn) return;
  const btn = document.createElement("button");
  btn.className = "iconbtn splitbtn";
  btn.title = "Show exercises beside the reading";
  btn.textContent = "⇄ Practice panel";
  themeBtn.parentElement.insertBefore(btn, themeBtn);
  const key = "mxalg-split";
  const apply = on => { document.body.classList.toggle("split", on); btn.classList.toggle("on", on); };
  let on = localStorage.getItem(key) === "1" && matchMedia("(min-width: 1100px)").matches;
  apply(on);
  btn.addEventListener("click", () => { on = !on; localStorage.setItem(key, on ? "1" : "0"); apply(on); });
}

/* ---------- tiny SVG function plotter ----------
   Reads JSON from the element's data-spec attribute:
   { xmin,xmax,ymin,ymax, xstep,ystep, w,h,
     curves:[{fn:"Math.pow(2,x)", cls:"", label:"", labelAt:[x,y]}],
     points:[[x,y,"label"]], xlabel, ylabel }                       */
function drawPlot(el) {
  let s; try { s = JSON.parse(el.dataset.spec); } catch (e) { return; }
  const W = s.w || 560, H = s.h || 380, pad = { l: 52, r: 18, t: 16, b: 42 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const X = x => pad.l + (x - s.xmin) / (s.xmax - s.xmin) * iw;
  const Y = y => pad.t + ih - (y - s.ymin) / (s.ymax - s.ymin) * ih;
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("width", W);
  svg.setAttribute("role", "img");
  if (s.alt) { const t = document.createElementNS(NS, "title"); t.textContent = s.alt; svg.appendChild(t); }
  const add = (tag, attrs, parent = svg) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n); return n;
  };
  // grid + tick labels
  const xs = s.xstep || Math.ceil((s.xmax - s.xmin) / 10);
  const ys = s.ystep || Math.ceil((s.ymax - s.ymin) / 10);
  for (let x = Math.ceil(s.xmin / xs) * xs; x <= s.xmax; x += xs) {
    add("line", { x1: X(x), y1: pad.t, x2: X(x), y2: pad.t + ih, class: "grid" });
    const tl = add("text", { x: X(x), y: pad.t + ih + 18, "text-anchor": "middle" });
    tl.textContent = +x.toFixed(6);
  }
  for (let y = Math.ceil(s.ymin / ys) * ys; y <= s.ymax; y += ys) {
    add("line", { x1: pad.l, y1: Y(y), x2: pad.l + iw, y2: Y(y), class: "grid" });
    const tl = add("text", { x: pad.l - 8, y: Y(y) + 4, "text-anchor": "end" });
    tl.textContent = +y.toFixed(6);
  }
  // axes at 0 (or at edge)
  const ax = s.xmin <= 0 && s.xmax >= 0 ? X(0) : pad.l;
  const ay = s.ymin <= 0 && s.ymax >= 0 ? Y(0) : pad.t + ih;
  add("line", { x1: pad.l, y1: ay, x2: pad.l + iw, y2: ay, class: "axis" });
  add("line", { x1: ax, y1: pad.t, x2: ax, y2: pad.t + ih, class: "axis" });
  // axis labels
  if (s.xlabel) { const t = add("text", { x: pad.l + iw / 2, y: H - 6, "text-anchor": "middle" }); t.textContent = s.xlabel; }
  if (s.ylabel) {
    const t = add("text", { x: 14, y: pad.t + ih / 2, "text-anchor": "middle", transform: `rotate(-90 14 ${pad.t + ih / 2})` });
    t.textContent = s.ylabel;
  }
  // curves
  for (const c of s.curves || []) {
    const fn = new Function("x", "return " + c.fn);
    let d = "", pen = false;
    const n = 240;
    for (let i = 0; i <= n; i++) {
      const x = s.xmin + (s.xmax - s.xmin) * i / n;
      let y; try { y = fn(x); } catch (e) { y = NaN; }
      if (!isFinite(y) || y < s.ymin - (s.ymax - s.ymin) || y > s.ymax + (s.ymax - s.ymin)) { pen = false; continue; }
      const px = X(x), py = Math.max(pad.t - 40, Math.min(pad.t + ih + 40, Y(y)));
      d += (pen ? "L" : "M") + px.toFixed(1) + " " + py.toFixed(1); pen = true;
    }
    add("path", { d, class: "curve " + (c.cls || "") });
    if (c.label && c.labelAt) {
      const t = add("text", { x: X(c.labelAt[0]) + 6, y: Y(c.labelAt[1]), class: "ptlabel" });
      t.textContent = c.label;
    }
  }
  // points
  for (const p of s.points || []) {
    add("circle", { cx: X(p[0]), cy: Y(p[1]), r: 4.5, class: "pt" });
    if (p[2]) { const t = add("text", { x: X(p[0]) + 8, y: Y(p[1]) - 8, class: "ptlabel" }); t.textContent = p[2]; }
  }
  el.appendChild(svg);
}

/* ---------- Desmos interactive plotter ----------
   For figures that demonstrate a parameter (a, b, c, d...) rather than a single
   fixed curve. Reads JSON from data-spec:
   { bounds:{left,right,bottom,top},
     sliders:[{var:"a", min,max,step, value, color}],
     curves:[{latex:"y=a\\cdot b^{x}", color}],
     alt }
   Requires window.Desmos (loaded via a per-page <script> with an API key — see
   CLAUDE.md). If the API script failed to load (offline, key issue, ad blocker),
   the figure is silently skipped; the figcaption/alt text still describes it. */
function drawDesmos(el) {
  let s; try { s = JSON.parse(el.dataset.spec); } catch (e) { return; }
  if (typeof Desmos === "undefined") return;
  const holder = document.createElement("div");
  holder.className = "desmos-embed";
  if (s.alt) holder.setAttribute("aria-label", s.alt);
  el.appendChild(holder);
  const calc = Desmos.GraphingCalculator(holder, {
    expressions: true,
    expressionsCollapsed: false,
    keypad: false,
    settingsMenu: false,
    zoomButtons: false,
    border: false,
    lockViewport: false,
  });
  if (s.bounds) calc.setMathBounds(s.bounds);
  (s.sliders || []).forEach((sl, i) => {
    calc.setExpression({
      id: "slider-" + i,
      latex: `${sl.var}=${sl.value}`,
      sliderBounds: { min: sl.min, max: sl.max, step: sl.step },
      color: sl.color || "#1f1d1d",
    });
  });
  (s.curves || []).forEach((c, i) => {
    calc.setExpression({ id: "curve-" + i, latex: c.latex, color: c.color || "#cf003d" });
  });
}
