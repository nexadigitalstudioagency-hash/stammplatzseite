/* =========================================================
   Stammplatz – main.js
   ========================================================= */

// Hierhin gehen die Anfragen aus dem Formular (über FormSubmit.co)
const CONTACT_EMAIL = "stammplatz.agency@gmail.com";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Sprache (DE / EN) ---------- */
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
};

const deText = new Map();
$$("[data-i18n]").forEach(el => deText.set(el, el.innerHTML));
const deAttr = new Map();
$$("[data-i18n-attr]").forEach(el => {
  const [attr] = el.dataset.i18nAttr.split(":");
  deAttr.set(el, el.getAttribute(attr));
});
const deMeta = { title: document.title, desc: $('meta[name="description"]').content };

let lang = store.get("lang") || ((navigator.language || "de").toLowerCase().startsWith("de") ? "de" : "en");
if (lang !== "de" && lang !== "en") lang = "de"; // nur gültige Sprachen
const T = () => window.I18N_DYN[lang];

function applyLang(next) {
  lang = next;
  const en = window.I18N_EN;
  document.documentElement.lang = lang;
  $$("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    el.innerHTML = lang === "en" && en[key] != null ? en[key] : deText.get(el);
  });
  $$("[data-i18n-attr]").forEach(el => {
    const [attr, key] = el.dataset.i18nAttr.split(":");
    el.setAttribute(attr, lang === "en" && en[key] ? en[key] : deAttr.get(el));
  });
  document.title = lang === "en" ? en["meta.title"] : deMeta.title;
  $('meta[name="description"]').content = lang === "en" ? en["meta.desc"] : deMeta.desc;
  $$(".lang button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  updateBurgerLabel();
  renderStamps();
  store.set("lang", lang);
}
$$(".lang button").forEach(b => b.addEventListener("click", () => applyLang(b.dataset.lang)));

/* ---------- Header & mobiles Menü ---------- */
const header = $("#header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const burger = $("#burger");
function updateBurgerLabel() {
  const open = document.body.classList.contains("nav-open");
  burger.setAttribute("aria-label", open ? T().menuClose : T().menuOpen);
}
function setNav(open) {
  document.body.classList.toggle("nav-open", open);
  burger.setAttribute("aria-expanded", String(open));
  updateBurgerLabel();
}
burger.addEventListener("click", () => setNav(!document.body.classList.contains("nav-open")));
$$("#nav a").forEach(a => a.addEventListener("click", () => setNav(false)));
document.addEventListener("keydown", e => { if (e.key === "Escape") setNav(false); });
window.addEventListener("resize", () => { if (window.innerWidth > 900) setNav(false); });

/* ---------- Einblenden beim Scrollen ---------- */
if ("IntersectionObserver" in window && !reduceMotion) {
  // leichte Staffelung für Geschwister-Elemente
  const groups = new Map();
  $$(".reveal").forEach(el => {
    const p = el.parentElement;
    const i = groups.get(p) || 0;
    el.style.setProperty("--d", `${Math.min(i, 6) * 0.07}s`);
    groups.set(p, i + 1);
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  $$(".reveal").forEach(el => io.observe(el));
} else {
  $$(".reveal").forEach(el => el.classList.add("in"));
}

/* ---------- Stempelkarten-Demo ---------- */
const slots = $$("#stampGrid i");
const MAX = slots.length;
let stamps = 3;
const stampBtn = $("#stampBtn");
const stampCount = $("#stampCount");
const stampReward = $("#stampReward");
const passN = $("#passN");

function renderStamps() {
  slots.forEach((s, i) => s.classList.toggle("on", i < stamps));
  const done = stamps >= MAX;
  passN.textContent = `${stamps}/${MAX}`;
  stampCount.innerHTML = T().count(stamps, MAX);
  stampCount.hidden = done;
  stampReward.hidden = !done;
  stampBtn.textContent = done ? T().resetBtn : T().stampBtn;
}
stampBtn.addEventListener("click", () => {
  stamps = stamps >= MAX ? 0 : stamps + 1;
  renderStamps();
});

/* "Wir vermissen Sie"-Benachrichtigung */
const toast = $("#toast");
const demo = $(".demo");
let toastTimer;
function cycleToast() {
  toast.classList.add("show");
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    toastTimer = setTimeout(cycleToast, 3500);
  }, 4500);
}
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([e]) => {
    clearTimeout(toastTimer);
    if (e.isIntersecting) toastTimer = setTimeout(cycleToast, 900);
    else toast.classList.remove("show");
  }, { threshold: 0.3 }).observe(demo);
} else {
  toast.classList.add("show");
}

/* ---------- Echtes Projekt: TV-Videos ---------- */
const caseVideo = $("#caseVideo");
const caseThumbs = $$(".case-thumb");
let caseVisible = false;

function playCase() {
  if (!caseVideo || reduceMotion) return;
  const p = caseVideo.play();
  if (p && p.catch) p.catch(() => {});
}
caseThumbs.forEach(btn => btn.addEventListener("click", () => {
  const name = btn.dataset.video;
  caseThumbs.forEach(b => {
    const on = b === btn;
    b.classList.toggle("on", on);
    b.setAttribute("aria-selected", String(on));
  });
  caseVideo.poster = `assets/work/web/${name}.jpg`;
  caseVideo.src = `assets/work/web/${name}.mp4`;
  if (caseVisible) playCase();
}));
if (caseVideo) {
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => {
      caseVisible = e.isIntersecting;
      if (caseVisible) playCase(); else caseVideo.pause();
    }, { threshold: 0.35 }).observe(caseVideo);
  } else {
    caseVideo.preload = "metadata";
  }
}

/* ---------- Lightbox für Speisekarten-Seiten (alle Projekte) ---------- */
// Jedes Projekt hat data-gallery="bild1.jpg,bild2.jpg,…" (aus assets/work/web/),
// jeder Button darin data-i = Startbild.
const lb = $("#lightbox");
const lbImg = $("#lbImg");
const lbCount = $("#lbCount");
const canModal = lb && typeof lb.showModal === "function";
let lbList = [], lbName = "", lbIndex = 0;

function showPage(i) {
  lbIndex = (i + lbList.length) % lbList.length;
  lbImg.src = `assets/work/web/${lbList[lbIndex]}`;
  lbImg.alt = `${lbName} ${lbIndex + 1} / ${lbList.length}`;
  lbCount.textContent = `${lbIndex + 1} / ${lbList.length}`;
}
$$("[data-gallery] [data-i]").forEach(btn => btn.addEventListener("click", () => {
  const g = btn.closest("[data-gallery]");
  lbList = g.dataset.gallery.split(",").map(s => s.trim());
  lbName = g.dataset.name || "";
  const i = Number(btn.dataset.i) || 0;
  if (canModal) { showPage(i); lb.showModal(); }
  else window.open(`assets/work/web/${lbList[i]}`, "_blank"); // Fallback: Bild in neuem Tab
}));
if (canModal) {
  lb.addEventListener("click", e => {
    const act = e.target.dataset.lb;
    if (act === "prev") showPage(lbIndex - 1);
    else if (act === "next") showPage(lbIndex + 1);
    else if (act === "close" || e.target === lb) lb.close();
  });
  lb.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") showPage(lbIndex - 1);
    if (e.key === "ArrowRight") showPage(lbIndex + 1);
  });
  // Wischen auf dem Handy
  let x0 = null;
  lb.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) showPage(lbIndex + (dx < 0 ? 1 : -1));
    x0 = null;
  });
}

/* ---------- Rabatt-Countdown (bis Mitternacht) ---------- */
const promoTimer = $("#promoTimer");
function tickPromo() {
  const now = new Date();
  const end = new Date(now); end.setHours(24, 0, 0, 0);
  let s = Math.max(0, Math.floor((end - now) / 1000));
  const p = n => String(n).padStart(2, "0");
  promoTimer.textContent = `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
}
if (promoTimer) { tickPromo(); setInterval(tickPromo, 1000); }

/* ---------- Zahlen zählen hoch (50+) ---------- */
$$(".count").forEach(el => {
  const to = Number(el.dataset.to);
  if (reduceMotion || !("IntersectionObserver" in window)) return;
  el.textContent = "0";
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    const t0 = performance.now(), dur = 1600;
    const step = t => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, { threshold: 0.6 });
  io.observe(el);
});

/* ---------- Instagram: Follower zählen hoch ---------- */
const followersEl = $("#followers");
if (followersEl && "IntersectionObserver" in window) {
  const FROM = 1204, TO = 3870;
  const fmt = n => n.toLocaleString("de-DE");
  let raf;
  new IntersectionObserver(([e]) => {
    cancelAnimationFrame(raf);
    if (!e.isIntersecting) { followersEl.textContent = fmt(FROM); return; }
    const t0 = performance.now(), dur = reduceMotion ? 1 : 2600;
    const step = t => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      followersEl.textContent = fmt(Math.round(FROM + (TO - FROM) * eased));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }, { threshold: 0.4 }).observe(followersEl.closest(".tile"));
}

/* ---------- Preise: durchstreichen, dann neuer Preis ---------- */
$$(".plan").forEach(plan => {
  const b = plan.querySelector(".plan-now b");
  const from = Number(b && b.dataset.from), to = Number(b && b.dataset.to);
  const fmt = n => `${Math.round(n).toLocaleString("de-DE")} €`;
  if (reduceMotion || !("IntersectionObserver" in window)) { plan.classList.add("priced"); return; }
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    plan.classList.add("priced");
    if (!from || !to) return;
    b.textContent = fmt(from);
    setTimeout(() => {
      const t0 = performance.now(), dur = 400;
      const step = t => {
        const k = Math.min(1, (t - t0) / dur);
        b.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, 300);
  }, { threshold: 0.45 });
  io.observe(plan);
});

/* ---------- Fester Anfrage-Button auf dem Handy ---------- */
const sticky = $("#stickyCta");
if (sticky && "IntersectionObserver" in window) {
  const visible = new Set();
  const hero = $(".hero");
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target));
    const show = visible.size === 0; // weder Hero noch Kontakt/Footer im Bild
    sticky.classList.toggle("show", show);
    sticky.inert = !show;
  });
  [hero, $("#kontakt"), $(".footer")].forEach(el => el && io.observe(el));
}

/* ---------- Kontaktformular ---------- */
// Anfragen gehen über FormSubmit.co direkt in das Postfach CONTACT_EMAIL – ohne E-Mail-Programm.
// Beim allerersten Absenden schickt FormSubmit eine Bestätigungs-Mail („Activate Form“),
// einmal anklicken, danach kommen alle Anfragen an.
// Funktioniert nur, wenn die Seite online ist (nicht als Datei file:// geöffnet).
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;
const form = $("#contactForm");
const status = $("#formStatus");

form.addEventListener("submit", e => {
  e.preventDefault();
  const d = new FormData(form);
  const required = [["restaurant", form.elements.restaurant], ["contact", form.elements.contact]];
  let ok = true;
  required.forEach(([k, input]) => {
    const val = String(d.get(k) || "").trim();
    const bad = !val || (k === "contact" && !/^[^s@]+@[^s@]+.[^s@]+$/.test(val));
    input.closest(".field").classList.toggle("invalid", bad);
    if (bad) ok = false;
  });

  if (!ok) {
    const first = form.querySelector(".invalid input");
    if (first) first.focus({ preventScroll: true }), first.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    status.textContent = T().formMissing;
    status.classList.add("err");
    return;
  }

  const t = T();
  status.classList.remove("err");

  // Seite als Datei geöffnet: FormSubmit lehnt das ab. Hinweis nur für uns (Besucher sehen das nie).
  if (location.protocol === "file:") {
    status.textContent = "Форма отправляет заявки только когда сайт выложен в интернет. Сейчас открыт файл с компьютера.";
    status.classList.add("err");
    return;
  }

  const btn = form.querySelector('[type="submit"]');
  btn.disabled = true;
  status.textContent = t.formSending;
  const rest = String(d.get("restaurant")).trim();
  const mail = String(d.get("contact")).trim();
  // So sieht die Mail im Postfach aus (Beschriftungen auf Russisch, für uns)
  const payload = {
    "Ресторан / компания": rest,
    "Почта клиента": mail,
    "Что нужно": d.getAll("interest").join(", ") || "—",
    "Доп. информация": String(d.get("message") || "").trim() || "—",
    "Язык сайта": lang.toUpperCase(),
    _subject: `Новая заявка с сайта: ${rest}`,
    _replyto: mail,          // «Ответить» в Gmail → сразу клиенту
    _template: "table",
    _captcha: "false",
    _honey: d.get("_honey") || ""
  };
  fetch(FORM_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json", Accept: "application/json" }
  })
    .then(r => r.json().catch(() => ({})).then(j => {
      if (!r.ok || String(j.success) === "false") throw new Error(j.message || r.status);
      form.reset(); status.textContent = t.formSent;
    }))
    .catch(() => { status.textContent = t.formError(CONTACT_EMAIL); status.classList.add("err"); })
    .finally(() => { btn.disabled = false; });
});
form.addEventListener("input", e => {
  const f = e.target.closest(".field");
  if (f) f.classList.remove("invalid");
});

/* ---------- Footer-Jahr & Start ---------- */
$("#year").textContent = new Date().getFullYear();
applyLang(lang);
