/* ============================================================
   app.js — Del barrio al trabajo · Comuna 3 Manrique
   Interactividad: navegación, reproductor persistente, galería
   con likes y editor, lightbox, mapa Leaflet, charts, explorador
   de datos, pestañas de código y animaciones de aparición.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Util ---------- */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const fmtTime = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ":" + String(sec).padStart(2, "0");
  };
  const toast = (() => {
    const el = $("#toast");
    let t;
    return (msg) => {
      el.textContent = msg;
      el.classList.add("show");
      clearTimeout(t);
      t = setTimeout(() => el.classList.remove("show"), 2200);
    };
  })();

  /* ---------- Navbar ---------- */
  const navToggle = $("#navToggle");
  const navLinks = $("#navLinks");
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  $$("#navLinks a").forEach((a) =>
    a.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    })
  );
  // active section highlight
  const sections = ["trabajo", "econometria", "datos", "entrevistas", "galeria", "mapa", "literatura"];
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const id = e.target.id;
          $$("#navLinks a").forEach((a) =>
            a.classList.toggle("active", a.getAttribute("href") === "#" + id)
          );
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((id) => { const el = document.getElementById(id); if (el) navObserver.observe(el); });

  /* ---------- Reveal on scroll ---------- */
  const revealObs = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); }
      });
    },
    { threshold: 0.12 }
  );
  $$(".reveal").forEach((el) => revealObs.observe(el));

  /* ---------- Count-up stats ---------- */
  const countObs = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.count, 10);
        const dur = 1400;
        const start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const val = Math.floor((1 - Math.pow(1 - p, 3)) * target);
          el.textContent = val.toLocaleString("es-CO");
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = target.toLocaleString("es-CO");
        };
        requestAnimationFrame(step);
        obs.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  $$("[data-count]").forEach((el) => countObs.observe(el));

  /* ---------- Transcript toggles ---------- */
  $$(".transcript-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = document.getElementById(btn.dataset.target);
      if (!panel) return;
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      panel.hidden = open;
    });
  });

  /* ============================================================
     CÓDIGO ECONOMÉTRICO (pestañas)
     ============================================================ */
  (function buildCode() {
    const tabs = $("#codeTabs");
    const blocks = $("#codeBlocks");
    if (!tabs || typeof ECON_CODE === "undefined") return;
    ECON_CODE.forEach((g, i) => {
      const btn = document.createElement("button");
      btn.className = "code-tab" + (i === 0 ? " active" : "");
      btn.textContent = g.title;
      btn.setAttribute("role", "tab");
      btn.dataset.target = g.id;
      tabs.appendChild(btn);

      const block = document.createElement("div");
      block.className = "code-block" + (i === 0 ? " active" : "");
      block.id = "cb-" + g.id;
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.className = "language-r";
      code.textContent = g.code;
      pre.appendChild(code);

      const head = document.createElement("div");
      head.style.cssText = "display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap";
      head.innerHTML = `<div><h4>${g.title}</h4><p class="desc">${g.desc}</p></div>`;
      const copy = document.createElement("button");
      copy.className = "code-tab";
      copy.textContent = "⧉ Copiar";
      copy.addEventListener("click", () => {
        navigator.clipboard.writeText(g.code).then(
          () => toast("Código copiado al portapapeles"),
          () => toast("No se pudo copiar")
        );
      });
      head.appendChild(copy);
      block.appendChild(head);
      block.appendChild(pre);
      blocks.appendChild(block);
    });
    if (window.Prism) Prism.highlightAll();

    tabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".code-tab");
      if (!btn || !btn.dataset.target) return;
      $$(".code-tab", tabs).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      $$(".code-block").forEach((b) => b.classList.remove("active"));
      $("#cb-" + btn.dataset.target).classList.add("active");
    });
  })();

  /* ============================================================
     EXPLORADOR DE DATOS
     ============================================================ */
  (function dataExplorer() {
    const people = [
      {
        name: "Andrés", job: "Puesto de jugos",
        cells: {
          "Trabajo": "Puesto de jugos de naranja y borojó",
          "Estudios": "Ing. mecatrónica (en curso)",
          "Localidad": "Manrique (cerca a San Pablo)",
          "Transporte al trabajo": "Ninguno · camina 25 min",
          "Familia a cargo": "No (solo depende él)",
          "Cotiza pensión": "No → informal",
          "Tiempo en el barrio": "2 años",
        },
      },
      {
        name: "Jessica", job: "Belleza (uñas, pestañas)",
        cells: {
          "Trabajo": "Depilación, uñas y pestañas",
          "Estudios": "Bachiller",
          "Localidad": "Niquía",
          "Transporte al trabajo": "Uber moto / público · ~30 min",
          "Familia a cargo": "Una hija",
          "Cotiza pensión": "No → informal",
          "Gasto en transporte": "~30 % del salario mínimo",
        },
      },
    ];
    const tabsEl = $("#personTabs");
    const dataEl = $("#personData");
    if (!tabsEl) return;
    const render = (idx) => {
      $$(".person-tab", tabsEl).forEach((t, i) => t.classList.toggle("active", i === idx));
      const p = people[idx];
      const cells = Object.entries(p.cells)
        .map(([k, v]) => `<div class="data-cell"><div class="k">${k}</div><div class="v">${v}</div></div>`)
        .join("");
      dataEl.innerHTML = `<div class="data-grid">${cells}</div>`;
    };
    people.forEach((p, i) => {
      const t = document.createElement("button");
      t.className = "person-tab";
      t.innerHTML = `<div class="name">${p.name}</div><div class="job">${p.job}</div>`;
      t.addEventListener("click", () => render(i));
      tabsEl.appendChild(t);
    });
    render(0);
  })();

  /* ============================================================
     GALERÍA + LIKES + LIGHTBOX + EDITOR
     ============================================================ */
  const images = Array.from({ length: 9 }, (_, i) => ({
    src: `assets/img/campo-${String(i + 1).padStart(2, "0")}.jpeg`,
    caption: `Salida de campo · Comuna 3 Manrique · foto ${i + 1}`,
  }));

  (function gallery() {
    const g = $("#gallery");
    if (!g) return;
    const likes = JSON.parse(localStorage.getItem("manrique_likes") || "{}");

    images.forEach((im, idx) => {
      const fig = document.createElement("figure");
      fig.innerHTML = `
        <img src="${im.src}" alt="${im.caption}" loading="lazy" />
        <button class="edit-btn" title="Editar foto" aria-label="Editar foto ${idx + 1}">✎</button>
        <button class="like-btn" aria-label="Dar me gusta a la foto ${idx + 1}">
          <span class="heart">🤍</span><span class="count">${likes[idx] || 0}</span>
        </button>
        <div class="overlay"><span class="caption">${im.caption}</span></div>`;
      // open lightbox on image click
      fig.querySelector("img").addEventListener("click", () => openLightbox(idx));
      // edit
      fig.querySelector(".edit-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        openLightbox(idx, true);
      });
      // like
      const likeBtn = fig.querySelector(".like-btn");
      const countEl = likeBtn.querySelector(".count");
      const heart = likeBtn.querySelector(".heart");
      if (likes[idx]) heart.textContent = "💜";
      likeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        likes[idx] = (likes[idx] || 0) + 1;
        countEl.textContent = likes[idx];
        heart.textContent = "💜";
        likeBtn.classList.remove("pop");
        void likeBtn.offsetWidth;
        likeBtn.classList.add("pop");
        localStorage.setItem("manrique_likes", JSON.stringify(likes));
      });
      g.appendChild(fig);
    });
  })();

  /* ---------- Lightbox with canvas editor ---------- */
  const lb = $("#lightbox");
  const lbCanvas = $("#lbCanvas");
  const ctx = lbCanvas.getContext("2d");
  let lbIndex = 0;
  let lbFilter = "none";
  let currentImg = null;

  function drawCanvas() {
    if (!currentImg) return;
    const maxW = Math.min(window.innerWidth * 0.9, 1100);
    const maxH = window.innerHeight * 0.68;
    let w = currentImg.naturalWidth, h = currentImg.naturalHeight;
    const ratio = Math.min(maxW / w, maxH / h, 1);
    w = Math.round(w * ratio); h = Math.round(h * ratio);
    lbCanvas.width = w; lbCanvas.height = h;
    ctx.filter = lbFilter;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(currentImg, 0, 0, w, h);
  }

  function openLightbox(idx, editMode) {
    lbIndex = idx;
    lbFilter = "none";
    $$("#lbTools button[data-filter]").forEach((b) =>
      b.classList.toggle("active", b.dataset.filter === "none")
    );
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { currentImg = img; drawCanvas(); };
    img.src = images[idx].src;
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    if (editMode) toast("Aplica filtros y descarga tu versión ✎");
  }
  function closeLightbox() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
  }
  function navLightbox(dir) {
    lbIndex = (lbIndex + dir + images.length) % images.length;
    openLightbox(lbIndex);
  }
  $("#lbClose").addEventListener("click", closeLightbox);
  $("#lbPrev").addEventListener("click", () => navLightbox(-1));
  $("#lbNext").addEventListener("click", () => navLightbox(1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
  window.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") navLightbox(-1);
    if (e.key === "ArrowRight") navLightbox(1);
  });
  window.addEventListener("resize", () => { if (lb.classList.contains("open")) drawCanvas(); });
  $$("#lbTools button[data-filter]").forEach((b) =>
    b.addEventListener("click", () => {
      $$("#lbTools button[data-filter]").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      lbFilter = b.dataset.filter;
      drawCanvas();
    })
  );
  $("#lbDownload").addEventListener("click", () => {
    try {
      const link = document.createElement("a");
      link.download = `manrique-foto-${lbIndex + 1}-editada.png`;
      link.href = lbCanvas.toDataURL("image/png");
      link.click();
      toast("Imagen descargada 💜");
    } catch (err) {
      toast("No se pudo exportar la imagen");
    }
  });

  /* ============================================================
     REPRODUCTOR DE AUDIO PERSISTENTE
     ============================================================ */
  (function player() {
    const audio = $("#audio");
    const player = $("#player");
    const playBtn = $("#pPlay");
    const seek = $("#pSeek");
    const vol = $("#pVol");
    const rateBtn = $("#pRate");
    const rates = [0.75, 1, 1.25, 1.5, 1.75, 2];
    let rateIdx = 1;
    let currentBtn = null;

    function show() { player.classList.add("visible"); document.body.classList.remove("player-hidden"); }

    function setTrack(src, title, sub, btn) {
      if (audio.src.endsWith(src) && !audio.paused) return;
      const already = audio.src.endsWith(src);
      if (!already) { audio.src = src; }
      $("#pTitle").textContent = title;
      $("#pSub").textContent = sub;
      currentBtn = btn;
      show();
      audio.play();
    }

    $$(".play-inline").forEach((btn) =>
      btn.addEventListener("click", () => {
        const src = btn.dataset.audio;
        if (audio.src.endsWith(src)) {
          if (audio.paused) audio.play(); else audio.pause();
        } else {
          setTrack(src, btn.dataset.title, btn.dataset.sub, btn);
        }
      })
    );

    function updateButtons() {
      $$(".play-inline").forEach((b) => {
        const active = audio.src.endsWith(b.dataset.audio) && !audio.paused;
        b.classList.toggle("playing", active);
        b.textContent = active ? "⏸ Pausar" : "▶ Reproducir";
      });
    }

    playBtn.addEventListener("click", () => {
      if (!audio.src) { toast("Selecciona una entrevista para reproducir"); return; }
      if (audio.paused) audio.play(); else audio.pause();
    });
    $("#pBack").addEventListener("click", () => { audio.currentTime = Math.max(0, audio.currentTime - 10); });
    $("#pFwd").addEventListener("click", () => {
      const dur = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : audio.currentTime + 10;
      audio.currentTime = Math.min(dur, audio.currentTime + 10);
    });
    $("#pClose").addEventListener("click", () => {
      audio.pause(); audio.currentTime = 0;
      player.classList.remove("visible");
      document.body.classList.add("player-hidden");
      updateButtons();
    });

    audio.addEventListener("play", () => { playBtn.textContent = "⏸"; updateButtons(); });
    audio.addEventListener("pause", () => { playBtn.textContent = "▶"; updateButtons(); });
    audio.addEventListener("ended", () => { playBtn.textContent = "▶"; updateButtons(); });
    audio.addEventListener("loadedmetadata", () => {
      $("#pDur").textContent = fmtTime(audio.duration);
      seek.max = Math.floor(audio.duration);
    });
    audio.addEventListener("timeupdate", () => {
      $("#pCur").textContent = fmtTime(audio.currentTime);
      if (!seek.dragging) seek.value = Math.floor(audio.currentTime);
    });
    seek.addEventListener("input", () => { seek.dragging = true; $("#pCur").textContent = fmtTime(seek.value); });
    seek.addEventListener("change", () => { audio.currentTime = seek.value; seek.dragging = false; });
    vol.addEventListener("input", () => { audio.volume = vol.value / 100; });
    rateBtn.addEventListener("click", () => {
      rateIdx = (rateIdx + 1) % rates.length;
      audio.playbackRate = rates[rateIdx];
      rateBtn.textContent = rates[rateIdx] + "×";
    });

    // keyboard: space toggles when not typing & player visible
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" && player.classList.contains("visible") &&
          !["INPUT", "TEXTAREA", "BUTTON"].includes(document.activeElement.tagName)) {
        e.preventDefault();
        if (audio.paused) audio.play(); else audio.pause();
      }
    });
  })();

  /* ============================================================
     MAPA INTERACTIVO (Leaflet)
     ============================================================ */
  (function map() {
    if (typeof L === "undefined" || !$("#map")) return;
    const center = [6.2735, -75.5441];
    const m = L.map("map", { scrollWheelZoom: false }).setView(center, 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(m);

    // approximate Comuna 3 boundary (illustrative polygon)
    const comuna = [
      [6.2863, -75.5520], [6.2863, -75.5320], [6.2606, -75.5320],
      [6.2606, -75.5520], [6.2700, -75.5560],
    ];
    L.polygon(comuna, { color: "#7c2fc4", weight: 2, fillColor: "#f0409b", fillOpacity: 0.12 })
      .addTo(m).bindPopup("<h4>Comuna 3 · Manrique</h4>Zona nororiental de Medellín (área aproximada).");

    const pois = [
      { name: "Avenida Carlos Gardel (la 45)", lat: 6.2735, lng: -75.5441, desc: "Columna vertebral del barrio: comercio, vida nocturna y cultura. Aquí realizamos las entrevistas.", icon: "🧡" },
      { name: "Casa Gardeliana", lat: 6.2748, lng: -75.5452, desc: "Museo dedicado a Carlos Gardel y a la memoria tanguera de Manrique.", icon: "🎶" },
      { name: "Estatua de Carlos Gardel", lat: 6.2740, lng: -75.5446, desc: "Punto de inicio de la ruta turística 'Vive Manrique'.", icon: "🗿" },
      { name: "Parque Jorge Eliécer Gaitán", lat: 6.2722, lng: -75.5435, desc: "Espacio de encuentro y referencia comunitaria de la comuna.", icon: "🌳" },
      { name: "Puesto de jugos de Andrés", lat: 6.2738, lng: -75.5438, desc: "Jugos de naranja y borojó sobre la calle principal. Trabajador independiente entrevistado.", icon: "🍊" },
      { name: "Salón Sara Arrieta Lashes", lat: 6.2731, lng: -75.5449, desc: "Salón de belleza donde entrevistamos a Jessica.", icon: "💅" },
    ];

    const markers = [];
    pois.forEach((p) => {
      const icon = L.divIcon({
        className: "poi-marker",
        html: `<div style="font-size:1.6rem;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))">${p.icon}</div>`,
        iconSize: [30, 30], iconAnchor: [15, 15],
      });
      const mk = L.marker([p.lat, p.lng], { icon }).addTo(m)
        .bindPopup(`<h4>${p.icon} ${p.name}</h4>${p.desc}`);
      markers.push(mk);
    });

    const list = $("#poiList");
    pois.forEach((p, i) => {
      const item = document.createElement("div");
      item.className = "poi-item";
      item.innerHTML = `<h4>${p.icon} ${p.name}</h4><p>${p.desc}</p>`;
      item.addEventListener("click", () => {
        m.setView([p.lat, p.lng], 17, { animate: true });
        markers[i].openPopup();
      });
      list.appendChild(item);
    });

    m.on("focus", () => m.scrollWheelZoom.enable());
    m.on("blur", () => m.scrollWheelZoom.disable());
    // fix sizing when scrolled into view
    const mapObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setTimeout(() => m.invalidateSize(), 200); });
    });
    mapObs.observe($("#map"));
  })();

  /* ============================================================
     GRÁFICOS (Chart.js) — ilustrativos del análisis
     ============================================================ */
  (function charts() {
    if (typeof Chart === "undefined") return;
    Chart.defaults.font.family = "Poppins, sans-serif";
    Chart.defaults.color = "#7a5d8a";
    const PURPLE = "#7c2fc4", PINK = "#f0409b", GREY = "#cbb8d8";

    function whenVisible(id, fn) {
      const el = document.getElementById(id);
      if (!el) return;
      const o = new IntersectionObserver((entries, obs) => {
        entries.forEach((e) => { if (e.isIntersecting) { fn(el); obs.disconnect(); } });
      }, { threshold: 0.3 });
      o.observe(el);
    }

    // Comunas (ilustrativo) — Manrique resaltada
    whenVisible("chartComunas", (el) => {
      const comunas = ["Poblado", "Laureles", "Belén", "Guayabal", "Candelaria", "Manrique", "Aranjuez", "Popular", "Santa Cruz", "Villa Hermosa"];
      const vals = [22, 28, 34, 40, 44, 52, 55, 61, 63, 58];
      new Chart(el, {
        type: "bar",
        data: { labels: comunas, datasets: [{ label: "% informalidad (ilustrativo)", data: vals,
          backgroundColor: comunas.map((c) => (c === "Manrique" ? PINK : GREY)),
          borderRadius: 6 }] },
        options: { indexAxis: "y", plugins: { legend: { display: false } },
          scales: { x: { ticks: { callback: (v) => v + "%" }, grid: { color: "#f0e0f5" } }, y: { grid: { display: false } } } },
      });
    });

    // AME forest (ilustrativo)
    whenVisible("chartAME", (el) => {
      const labels = ["Tiempo viaje (+10m)", "Transp. público", "Mujer", "Años educación", "Casado/unión", "Hogar con moto"];
      const vals = [-1.2, 6.5, 3.1, -2.8, -4.2, -3.5];
      new Chart(el, {
        type: "bar",
        data: { labels, datasets: [{ label: "Efecto (puntos porcentuales)", data: vals,
          backgroundColor: vals.map((v) => (v >= 0 ? PINK : PURPLE)), borderRadius: 6 }] },
        options: { indexAxis: "y", plugins: { legend: { display: false },
          tooltip: { callbacks: { label: (c) => (c.raw > 0 ? "+" : "") + c.raw + " pp" } } },
          scales: { x: { ticks: { callback: (v) => v + " pp" }, grid: { color: "#f0e0f5" } }, y: { grid: { display: false } } } },
      });
    });

    // Scatter comunas
    whenVisible("chartScatter", (el) => {
      const pts = [
        { x: 18, y: 22, c: "Poblado" }, { x: 24, y: 28, c: "Laureles" }, { x: 30, y: 34, c: "Belén" },
        { x: 33, y: 44, c: "Candelaria" }, { x: 36, y: 52, c: "Manrique" }, { x: 38, y: 55, c: "Aranjuez" },
        { x: 42, y: 61, c: "Popular" }, { x: 40, y: 63, c: "Santa Cruz" },
      ];
      new Chart(el, {
        type: "scatter",
        data: { datasets: [
          { label: "Comunas", data: pts.filter((p) => p.c !== "Manrique"), backgroundColor: PURPLE, pointRadius: 6 },
          { label: "Manrique", data: pts.filter((p) => p.c === "Manrique"), backgroundColor: PINK, pointRadius: 10 },
        ] },
        options: { plugins: { legend: { position: "bottom" },
          tooltip: { callbacks: { label: (c) => `${c.raw.c}: ${c.raw.x} min · ${c.raw.y}%` } } },
          scales: { x: { title: { display: true, text: "Minutos de viaje" }, grid: { color: "#f0e0f5" } },
                    y: { title: { display: true, text: "% informalidad" }, grid: { color: "#f0e0f5" } } } },
      });
    });

    // Edad curve (U shape) ilustrativo
    whenVisible("chartEdad", (el) => {
      const edades = [], h = [], mu = [];
      for (let a = 16; a <= 70; a += 3) {
        edades.push(a);
        const base = 0.0006 * Math.pow(a - 42, 2) + 0.30;
        h.push(+(base * 100).toFixed(1));
        mu.push(+((base + 0.05) * 100).toFixed(1));
      }
      new Chart(el, {
        type: "line",
        data: { labels: edades, datasets: [
          { label: "Hombre", data: h, borderColor: PURPLE, backgroundColor: "rgba(124,47,196,.12)", fill: true, tension: 0.35, pointRadius: 0 },
          { label: "Mujer", data: mu, borderColor: PINK, backgroundColor: "rgba(240,64,155,.12)", fill: true, tension: 0.35, pointRadius: 0 },
        ] },
        options: { plugins: { legend: { position: "bottom" } },
          scales: { x: { title: { display: true, text: "Edad" }, grid: { display: false } },
                    y: { title: { display: true, text: "P(informal)" }, ticks: { callback: (v) => v + "%" }, grid: { color: "#f0e0f5" } } } },
      });
    });
  })();

})();
