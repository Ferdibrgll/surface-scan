(() => {
  "use strict";

  document.documentElement.classList.add("js");
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- İkonlar (sabit, güvenli SVG parçaları) ---------- */
  const ICONS = {
    search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
    check: '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="M22 4L12 14l-3-3"/>',
    alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    octagon: '<path d="M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9z"/><path d="M12 8v4M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    radar: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>',
    network: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    cookie: '<circle cx="12" cy="12" r="10"/><path d="M8 9h.01M15 8h.01M10 15h.01M16 14h.01"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>',
    zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>',
  };

  function icon(name) {
    const span = document.createElement("span");
    span.className = "ico";
    span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
    return span;
  }

  function h(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  $$("[data-icon]").forEach((n) => n.replaceWith(icon(n.dataset.icon)));

  /* ---------- Sayı animasyonu ---------- */
  function countUp(el, to, dur = 1200, suffix = "") {
    if (reduce) { el.textContent = to + suffix; return; }
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Görünürlükte animasyon ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      if (e.target.dataset.count !== undefined) {
        countUp(e.target, Number(e.target.dataset.count), 1300, e.target.dataset.suffix || "");
      }
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });

  $$(".reveal").forEach((el, i) => {
    el.style.setProperty("--d", `${(i % 4) * 90}ms`);
    io.observe(el);
  });
  $$("[data-count]").forEach((el) => io.observe(el));

  /* ---------- Fare ışığı + eğim efekti ---------- */
  document.addEventListener("pointermove", (e) => {
    const t = e.target instanceof Element ? e.target.closest(".spot") : null;
    if (t) {
      const r = t.getBoundingClientRect();
      t.style.setProperty("--mx", `${e.clientX - r.left}px`);
      t.style.setProperty("--my", `${e.clientY - r.top}px`);
    }
  });

  const heroVisual = $("#hero-visual");
  const mock = $("#mock");
  if (heroVisual && mock && !reduce) {
    heroVisual.addEventListener("pointermove", (e) => {
      const r = heroVisual.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      mock.style.setProperty("--ry", `${(x * 12).toFixed(2)}deg`);
      mock.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
    });
    heroVisual.addEventListener("pointerleave", () => {
      mock.style.setProperty("--ry", "-6deg");
      mock.style.setProperty("--rx", "3deg");
    });
  }

  /* ---------- Arka plan: hareketli ağ ---------- */
  (function startBackground() {
    const c = $("#bg");
    if (!c || reduce) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let w = 0, h2 = 0, dpr = 1, pts = [];
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.width = Math.floor(innerWidth * dpr);
      h2 = c.height = Math.floor(innerHeight * dpr);
      const n = Math.min(80, Math.floor(innerWidth / 20));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h2,
        vx: (Math.random() - 0.5) * 0.28 * dpr, vy: (Math.random() - 0.5) * 0.28 * dpr,
        r: (Math.random() * 1.4 + 0.6) * dpr,
      }));
    }
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", (e) => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; });
    resize();

    function frame() {
      requestAnimationFrame(frame);
      if (document.hidden) return;
      ctx.clearRect(0, 0, w, h2);
      const maxD = 130 * dpr;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h2; else if (p.y > h2) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(140,180,255,.65)";
        ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < maxD) {
            ctx.strokeStyle = `rgba(96,150,255,${(1 - d / maxD) * 0.22})`;
            ctx.lineWidth = dpr * 0.8;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (dm < 170 * dpr) {
          ctx.strokeStyle = `rgba(34,211,238,${(1 - dm / (170 * dpr)) * 0.5})`;
          ctx.lineWidth = dpr;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }
    frame();
  })();

  /* ---------- Saldırı yüzeyi haritası ---------- */
  const SURFACE = {
    headers: {
      icon: "shield",
      title: "Güvenlik başlıkları",
      desc: "Tarayıcının sayfayı nasıl işleyeceğini belirleyen HTTP başlıkları ve cookie bayrakları.",
      attack: "Eksik başlıklar clickjacking ve XSS gibi saldırıların işini kolaylaştırır.",
      tags: ["HSTS", "CSP", "X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy", "Cookie bayrakları"],
    },
    tls: {
      icon: "lock",
      title: "TLS ve HTTPS",
      desc: "Bağlantının geçerli bir sertifikayla şifrelendiği ve HTTP isteklerinin HTTPS'e yönlendirildiği doğrulanır.",
      attack: "Şifresiz bağlantı, aradaki bir kişinin trafiği okumasına ya da değiştirmesine izin verebilir.",
      tags: ["Sertifika", "HTTP → HTTPS yönlendirmesi"],
    },
    dns: {
      icon: "mail",
      title: "DNS ve e-posta",
      desc: "Alan adın adına sahte e-posta gönderilmesini zorlaştıran DNS kayıtları aranır.",
      attack: "SPF ve DMARC yoksa alan adın adına inandırıcı sahte e-posta göndermek kolaylaşır.",
      tags: ["SPF", "DMARC", "CAA"],
    },
    subs: {
      icon: "network",
      title: "Alt alan adları",
      desc: "Sertifika şeffaflık kayıtlarından unutulmuş ya da kullanılmayan alt alan adları bulunur.",
      attack: "Unutulmuş bir alt alan adı, ele geçirilmeye (subdomain takeover) en açık yerlerden biridir.",
      tags: ["crt.sh", "Sertifika kayıtları"],
    },
    files: {
      icon: "file",
      title: "Standart dosyalar",
      desc: "Güvenlik araştırmacılarının sana ulaşmasını sağlayan ve arama motorlarını yönlendiren dosyalar.",
      attack: "security.txt yoksa bir araştırmacı açığı sana nasıl bildireceğini bulamaz; robots.txt ise gizli yolları ele verebilir.",
      tags: ["security.txt", "robots.txt"],
    },
    tech: {
      icon: "cpu",
      title: "Teknoloji izleri",
      desc: "Başlıklardan ve sayfa kaynağından görünen yazılımlar listelenir, sürüm sızıntıları işaretlenir.",
      attack: "Sürüm bilgisi sızdıran bir sunucu, bilinen açıklara göre hedef seçmeyi kolaylaştırır.",
      tags: ["Server başlığı", "X-Powered-By", "Framework", "CDN"],
    },
  };

  (function initSurfaceMap() {
    const map = $("#map");
    const panel = $("#detail");
    if (!map || !panel) return;
    const nodes = $$(".node", map);
    const spokes = $$(".spoke", map);
    const keys = Object.keys(SURFACE);
    let cur = 0;
    let paused = false;

    function select(key) {
      const d = SURFACE[key];
      if (!d) return;
      cur = keys.indexOf(key);
      nodes.forEach((n) => n.classList.toggle("active", n.dataset.k === key));
      spokes.forEach((l) => l.classList.toggle("active", l.dataset.k === key));
      $("#d-ico").replaceChildren(icon(d.icon));
      $("#d-title").textContent = d.title;
      $("#d-desc").textContent = d.desc;
      $("#d-att").textContent = d.attack;
      const tags = $("#d-tags");
      tags.replaceChildren(...d.tags.map((t) => h("li", null, t)));
      panel.classList.remove("swap");
      void panel.offsetWidth;
      panel.classList.add("swap");
    }

    nodes.forEach((n) => {
      const k = n.dataset.k;
      n.addEventListener("click", () => select(k));
      n.addEventListener("pointerenter", () => select(k));
      n.addEventListener("focus", () => select(k));
    });
    [map, panel].forEach((el) => {
      el.addEventListener("pointerenter", () => { paused = true; });
      el.addEventListener("pointerleave", () => { paused = false; });
      el.addEventListener("focusin", () => { paused = true; });
      el.addEventListener("focusout", () => { paused = false; });
    });

    select(keys[0]);
    if (!reduce) {
      setInterval(() => {
        if (paused || document.hidden) return;
        select(keys[(cur + 1) % keys.length]);
      }, 4500);
    }
  })();

  /* ---------- Tarama ---------- */
  const LABELS = { high: "Yüksek", medium: "Orta", low: "Düşük", info: "Bilgi", pass: "Geçti" };
  const SEV_ICON = { high: "octagon", medium: "alert", low: "alert", info: "info", pass: "check" };
  const ORDER = ["high", "medium", "low", "info", "pass"];
  const CATS = {
    headers: ["Güvenlik başlıkları", "shield"],
    cookies: ["Cookie'ler", "cookie"],
    tls: ["TLS / HTTPS", "lock"],
    files: ["Standart dosyalar", "file"],
    dns: ["DNS ve e-posta", "mail"],
    subdomains: ["Alt alan adları", "network"],
    tech: ["Teknolojiler", "cpu"],
  };
  const STEPS = [
    ["HTTPS ve yönlendirme", "lock"],
    ["Güvenlik başlıkları", "shield"],
    ["Cookie bayrakları", "cookie"],
    ["security.txt ve robots.txt", "file"],
    ["SPF, DMARC, CAA", "mail"],
    ["Alt alan adları (crt.sh)", "network"],
    ["Teknoloji tespiti", "cpu"],
  ];

  const form = $("#form");
  const input = $("#domain");
  const btn = $("#btn");
  const progress = $("#progress");
  const result = $("#result");
  const bar = $("#bar");
  let timer = null;
  let busy = false;

  const scoreClass = (s) => (s >= 80 ? "good" : s >= 50 ? "mid" : "bad");
  const scoreLabel = (s) => (s >= 90 ? "Çok iyi" : s >= 80 ? "İyi" : s >= 50 ? "Geliştirilmeli" : "Riskli");

  function runProgress() {
    const list = $("#steps");
    list.replaceChildren();
    const items = STEPS.map(([label, ic]) => {
      const li = h("li");
      li.append(icon(ic), h("span", "s-label", label), h("span", "s-state"));
      list.append(li);
      return li;
    });
    let i = 0;
    const tick = () => {
      items.forEach((li, idx) => {
        li.classList.toggle("done", idx < i);
        li.classList.toggle("run", idx === i);
      });
      bar.style.width = `${Math.min(92, (i / STEPS.length) * 100 + 6)}%`;
      if (i < STEPS.length - 1) i++;
    };
    tick();
    timer = setInterval(tick, 1400);
    return items;
  }

  async function finishProgress(items) {
    clearInterval(timer);
    for (const li of items) {
      li.classList.remove("run");
      li.classList.add("done");
      await sleep(reduce ? 0 : 70);
    }
    bar.style.width = "100%";
    await sleep(reduce ? 0 : 380);
  }

  function showError(message) {
    clearInterval(timer);
    progress.classList.add("err");
    $("#prog-title").textContent = "Tarama başarısız";
    $("#steps").replaceChildren();
    bar.parentElement.hidden = true;
    const msg = $("#prog-msg");
    msg.hidden = false;
    msg.textContent = message;
  }

  function resetProgress() {
    progress.hidden = false;
    progress.classList.remove("err");
    $("#prog-title").textContent = "Taranıyor…";
    $("#prog-msg").hidden = true;
    bar.parentElement.hidden = false;
    bar.style.width = "0";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    const domain = input.value.trim();
    if (!domain) return;

    busy = true;
    btn.disabled = true;
    btn.classList.add("loading");
    result.replaceChildren();
    resetProgress();
    const items = runProgress();
    progress.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });

    try {
      const res = await fetch("/api/scan?domain=" + encodeURIComponent(domain));
      let data;
      try { data = await res.json(); } catch { throw new Error("Sunucudan geçersiz yanıt alındı."); }
      if (!res.ok) throw new Error(data.error || "Tarama başarısız.");
      await finishProgress(items);
      progress.hidden = true;
      render(data);
      result.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      busy = false;
      btn.disabled = false;
      btn.classList.remove("loading");
    }
  });

  $("#nav-scan")?.addEventListener("click", () => setTimeout(() => input.focus({ preventScroll: true }), 350));

  /* ---------- Sonuç ekranı ---------- */
  function makeRing(score) {
    const NS = "http://www.w3.org/2000/svg";
    const C = 326.73;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 120 120");
    svg.setAttribute("class", "ring-svg");
    const bg = document.createElementNS(NS, "circle");
    bg.setAttribute("class", "ring-bg");
    const fg = document.createElementNS(NS, "circle");
    fg.setAttribute("class", "ring-fg " + scoreClass(score));
    for (const c of [bg, fg]) { c.setAttribute("cx", "60"); c.setAttribute("cy", "60"); c.setAttribute("r", "52"); }
    svg.append(bg, fg);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fg.style.strokeDashoffset = String(C * (1 - score / 100));
    }));
    return svg;
  }

  function findingEl(f, i) {
    const el = h("div", "f sev-" + f.severity);
    el.dataset.sev = f.severity;
    el.style.setProperty("--i", String(i));
    const ic = h("div", "f-ico");
    ic.append(icon(SEV_ICON[f.severity] || "info"));
    const body = h("div", "f-body");
    const title = h("div", "f-title");
    title.append(h("span", "badge sev-" + f.severity, LABELS[f.severity] || f.severity), h("b", null, f.title));
    body.append(title);
    if (f.detail) body.append(h("p", "f-detail", f.detail));
    if (f.recommendation) {
      const fix = h("p", "f-fix");
      fix.append(h("strong", null, "Öneri: "), document.createTextNode(f.recommendation));
      body.append(fix);
    }
    el.append(ic, body);
    return el;
  }

  function applyFilter(mode) {
    $$(".f", result).forEach((el) => {
      const issue = ["high", "medium", "low"].includes(el.dataset.sev);
      el.hidden = !(mode === "all" || (mode === "issues" && issue) || (mode === "pass" && el.dataset.sev === "pass"));
    });
    $$(".cat", result).forEach((c) => { c.hidden = !$$(".f", c).some((x) => !x.hidden); });
  }

  function downloadJson(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `afemspectra-${data.domain}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ---------- Rapor görselleri ---------- */
  const SVG_NS = "http://www.w3.org/2000/svg";
  const PEN = { high: 25, medium: 10, low: 4, info: 0, pass: 0 };
  const SHORT = { headers: "Başlıklar", cookies: "Cookie", tls: "TLS", files: "Dosyalar", dns: "DNS", subdomains: "Alt alanlar", tech: "Teknoloji" };

  function svgEl(tag, attrs = {}) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    return e;
  }

  function categoryScores(findings) {
    const m = {};
    for (const f of findings) {
      if (!(f.category in m)) m[f.category] = 100;
      m[f.category] -= PEN[f.severity] || 0;
    }
    for (const k of Object.keys(m)) m[k] = Math.max(0, m[k]);
    return m;
  }

  function radarChart(scores) {
    const keys = Object.keys(CATS).filter((k) => k in scores);
    if (keys.length < 3) return null;
    const cx = 150, cy = 150, R = 100, n = keys.length;
    const svg = svgEl("svg", { viewBox: "-45 -8 390 316", class: "radar-svg", role: "img", "aria-label": "Kategori bazlı güvenlik skoru grafiği" });
    const pt = (i, r) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };
    for (const f of [0.25, 0.5, 0.75, 1]) {
      svg.append(svgEl("polygon", { class: "rd-ring", points: keys.map((_, i) => pt(i, R * f).join(",")).join(" ") }));
    }
    keys.forEach((_, i) => {
      const [x, y] = pt(i, R);
      svg.append(svgEl("line", { class: "rd-axis", x1: cx, y1: cy, x2: x, y2: y }));
    });
    svg.append(svgEl("polygon", { class: "rd-poly", points: keys.map((k, i) => pt(i, (R * scores[k]) / 100).join(",")).join(" ") }));
    keys.forEach((k, i) => {
      const [x, y] = pt(i, (R * scores[k]) / 100);
      const cls = scores[k] >= 80 ? "" : scores[k] >= 50 ? " mid" : " bad";
      svg.append(svgEl("circle", { class: "rd-dot" + cls, cx: x.toFixed(1), cy: y.toFixed(1), r: 4 }));
      const [lx, ly] = pt(i, R + 20);
      const anchor = Math.abs(lx - cx) < 8 ? "middle" : lx > cx ? "start" : "end";
      const t = svgEl("text", { class: "rd-label", x: lx.toFixed(1), y: ly.toFixed(1), "text-anchor": anchor, "dominant-baseline": "middle" });
      t.textContent = `${SHORT[k] || k} ${scores[k]}`;
      svg.append(t);
    });
    return svg;
  }

  function donutChart(summary) {
    const total = ORDER.reduce((a, s) => a + (summary[s] || 0), 0);
    const R = 40;
    const C = 2 * Math.PI * R;
    const wrap = h("div", "donut-wrap");

    const donut = h("div", "donut");
    const svg = svgEl("svg", { viewBox: "0 0 100 100", role: "img", "aria-label": "Bulguların önem dağılımı" });
    svg.append(svgEl("circle", { class: "dn-bg", cx: 50, cy: 50, r: R }));
    let acc = 0;
    const segs = [];
    for (const sev of ORDER) {
      const n = summary[sev] || 0;
      if (!n) continue;
      const len = (n / total) * C;
      const seg = svgEl("circle", { class: "dn-seg sev-" + sev, cx: 50, cy: 50, r: R });
      seg.style.strokeDasharray = `0 ${C}`;
      seg.style.strokeDashoffset = String(-acc);
      segs.push([seg, len]);
      acc += len;
      svg.append(seg);
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      for (const [seg, len] of segs) {
        const visible = Math.max(0, len - 1.4);
        seg.style.strokeDasharray = `${visible} ${C - visible}`;
      }
    }));
    const center = h("div", "donut-center");
    center.append(h("b", null, String(total)), h("span", null, "kontrol"));
    donut.append(svg, center);

    const legend = h("ul", "legend");
    for (const sev of ORDER) {
      const n = summary[sev] || 0;
      if (!n) continue;
      const li = h("li", "sev-" + sev);
      li.append(h("i"), h("span", null, LABELS[sev]), h("b", null, String(n)));
      legend.append(li);
    }
    wrap.append(donut, legend);
    return wrap;
  }

  const HEADER_TILES = [
    ["hsts", "HSTS"], ["csp", "CSP"], ["xfo", "X-Frame-Options"],
    ["xcto", "X-Content-Type"], ["referrer", "Referrer-Policy"], ["permissions", "Permissions-Policy"],
  ];

  function headerMatrix(findings) {
    const byId = Object.fromEntries(findings.map((f) => [f.id, f]));
    const grid = h("div", "matrix");
    let known = 0;
    for (const [id, label] of HEADER_TILES) {
      const ok = byId["hdr-" + id];
      const miss = byId["hdr-" + id + "-missing"];
      let cls = "tile unk", ic = "info", txt = "doğrulanamadı";
      if (ok) { cls = "tile sev-pass"; ic = "check"; txt = "mevcut"; known++; }
      else if (miss) { cls = "tile sev-" + miss.severity; ic = SEV_ICON[miss.severity] || "alert"; txt = "eksik"; known++; }
      const tile = h("div", cls);
      const info = h("div");
      info.append(h("b", null, label), h("small", null, txt));
      tile.append(icon(ic), info);
      grid.append(tile);
    }
    return known ? grid : null;
  }

  function fixSnippet(findings) {
    const lines = findings
      .filter((f) => /^hdr-.+-missing$/.test(f.id) && f.recommendation)
      .map((f) => f.recommendation.replace(/\s*\(.*\)\s*$/, "").replace(/;\s*\.\.\.$/, "").trim());
    if (!lines.length) return null;
    return [
      "# Cloudflare Pages / Netlify için _headers dosyası",
      "# CSP'yi yayına almadan önce sitene göre test et",
      "/*",
      ...lines.map((l) => "  " + l),
    ].join("\n");
  }

  async function copyText(text, pre) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const r = document.createRange();
        r.selectNodeContents(pre);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        return document.execCommand("copy");
      } catch {
        return false;
      }
    }
  }

  function card(cls, title, ic) {
    const c = h("section", cls + " glass");
    const t = h("h3");
    t.append(icon(ic), document.createTextNode(title));
    c.append(t);
    return c;
  }

  function pillsCard(title, ic, items, extraCls, limit) {
    const c = card("found-card", title, ic);
    const wrap = h("div", "pills");
    for (const it of items.slice(0, limit)) wrap.append(h("span", "pill-tag " + extraCls, it));
    if (items.length > limit) wrap.append(h("span", "pill-tag more", `+${items.length - limit} daha`));
    c.append(wrap);
    return c;
  }

  function render(data) {
    result.replaceChildren();
    const wrap = h("div", "res");

    /* Başlık kartı */
    const head = h("div", "res-head glass");
    const ring = h("div", "ring");
    ring.append(makeRing(data.score));
    const box = h("div", "score-box");
    const num = h("b", "score-num", "0");
    box.append(num, h("span", "score-of", "/ 100"));
    ring.append(box);
    countUp(num, data.score, 1500);

    const meta = h("div", "res-meta");
    meta.append(h("div", "res-domain", data.domain));
    meta.append(h("span", "res-label " + scoreClass(data.score), scoreLabel(data.score)));
    meta.append(h("div", "res-time", new Date(data.scannedAt).toLocaleString("tr-TR")));
    const chips = h("div", "chips");
    for (const sev of ORDER) {
      const c = h("span", "chip sev-" + sev);
      c.append(icon(SEV_ICON[sev]), h("b", null, String(data.summary[sev] ?? 0)), h("span", null, LABELS[sev]));
      chips.append(c);
    }
    meta.append(chips);

    const actions = h("div", "actions");
    const dl = h("button", "btn-ghost");
    dl.type = "button";
    dl.append(icon("download"), h("span", null, "JSON indir"));
    dl.addEventListener("click", () => downloadJson(data));
    const pr = h("button", "btn-ghost");
    pr.type = "button";
    pr.append(icon("file"), h("span", null, "PDF / Yazdır"));
    pr.addEventListener("click", () => {
      const old = document.title;
      document.title = `AfemSpectra – ${data.domain}`;
      window.print();
      setTimeout(() => { document.title = old; }, 600);
    });
    const again = h("button", "btn-ghost");
    again.type = "button";
    again.append(icon("refresh"), h("span", null, "Yeniden tara"));
    again.addEventListener("click", () => { input.value = data.domain; form.requestSubmit(); });
    actions.append(dl, pr, again);
    head.append(ring, meta, actions);
    wrap.append(head);

    /* Uyarılar (engellenen site, ulaşılamayan kaynak vb.) */
    for (const n of data.notes || []) {
      const b = h("div", "note-warn");
      b.append(icon("alert"), h("span", null, n));
      wrap.append(b);
    }

    /* Grafikler: radar + önem dağılımı */
    const charts = h("div", "charts");
    const radar = radarChart(categoryScores(data.findings));
    if (radar) {
      const c = card("chart-card", "Kategori skorları", "radar");
      c.append(radar);
      charts.append(c);
    }
    const cd = card("chart-card", "Bulguların dağılımı", "chart");
    cd.append(donutChart(data.summary));
    charts.append(cd);
    wrap.append(charts);

    /* Güvenlik başlıkları haritası */
    const matrix = headerMatrix(data.findings);
    if (matrix) {
      const mc = card("matrix-card", "Güvenlik başlıkları haritası", "shield");
      mc.append(matrix);
      wrap.append(mc);
    }

    /* Keşfedilenler: alt alan adları + teknolojiler */
    const subs = data.subdomains || [];
    const techs = data.technologies || [];
    if (subs.length || techs.length) {
      const grid = h("div", "found-grid");
      if (subs.length) grid.append(pillsCard(`Bulunan alt alan adları (${subs.length})`, "network", subs, "", 18));
      if (techs.length) grid.append(pillsCard(`Tespit edilen teknolojiler (${techs.length})`, "cpu", techs, "tech", 18));
      wrap.append(grid);
    }

    /* Öncelikli düzeltmeler */
    const todo = data.findings
      .filter((f) => ["high", "medium", "low"].includes(f.severity) && f.recommendation)
      .sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity))
      .slice(0, 3);
    if (todo.length) {
      const p = h("div", "priority glass");
      const t = h("h3");
      t.append(icon("zap"), document.createTextNode("Önce bunları düzelt"));
      const ol = h("ol");
      for (const f of todo) {
        const li = h("li");
        li.append(document.createTextNode(f.title + " "), h("span", null, "· " + f.recommendation));
        ol.append(li);
      }
      p.append(t, ol);
      wrap.append(p);
    }

    /* Hazır düzeltme kodu */
    const snippet = fixSnippet(data.findings);
    if (snippet) {
      const fb = h("section", "fixbox glass");
      const fh = h("div", "fix-head");
      const t = h("h3");
      t.append(icon("zap"), document.createTextNode("Eksik başlıklar için hazır kod"));
      const cp = h("button", "btn-ghost");
      cp.type = "button";
      cp.append(icon("file"), h("span", null, "Kopyala"));
      fh.append(t, cp);
      const pre = h("pre", null, snippet);
      fb.append(fh, h("p", "hint", "Başka bir platformda çalışıyorsan aynı başlıkları kendi sunucu ayarına ekle."), pre);
      cp.addEventListener("click", async () => {
        const ok = await copyText(snippet, pre);
        const label = $("span", cp);
        label.textContent = ok ? "Kopyalandı" : "Kopyalanamadı";
        setTimeout(() => { label.textContent = "Kopyala"; }, 1800);
      });
      wrap.append(fb);
    }

    /* Filtre sekmeleri */
    const tabs = h("div", "tabs");
    const modes = [["all", "Tümü"], ["issues", "Sorunlar"], ["pass", "Geçenler"]];
    for (const [mode, label] of modes) {
      const b = h("button", "tab", label);
      b.type = "button";
      b.setAttribute("aria-pressed", mode === "all" ? "true" : "false");
      b.addEventListener("click", () => {
        $$(".tab", tabs).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        applyFilter(mode);
      });
      tabs.append(b);
    }
    wrap.append(tabs);

    /* Kategoriler */
    const groups = {};
    for (const f of data.findings) (groups[f.category] ||= []).push(f);
    let idx = 0;
    for (const key of Object.keys(CATS)) {
      const list = groups[key];
      if (!list) continue;
      list.sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity));
      const [title, ic] = CATS[key];
      const cat = h("section", "cat glass");
      const ch = h("div", "cat-head");
      const ib = h("div", "ico-box");
      ib.append(icon(ic));
      const issues = list.filter((f) => ["high", "medium", "low"].includes(f.severity)).length;
      ch.append(ib, h("h3", null, title), h("small", null, issues ? `${issues} sorun` : "sorun yok"));
      cat.append(ch);
      for (const f of list) cat.append(findingEl(f, idx++));
      wrap.append(cat);
    }

    result.append(wrap);
  }
})();
