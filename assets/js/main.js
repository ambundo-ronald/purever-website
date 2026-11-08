/* ==========================================================================
   PUREVER — Site interactions
   ========================================================================== */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const R = window.PVRender;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const arrow = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';

  /* ---------------- Navigation ---------------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toggle = $('#menuToggle'), menu = $('#mobileMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', menu).forEach(a => a.addEventListener('click', () => {
      menu.classList.remove('open'); toggle.setAttribute('aria-expanded', false); document.body.style.overflow = '';
    }));
  }

  /* ---------------- Marquee (duplicate for loop) ---------------- */
  const mq = $('#marquee');
  if (mq) mq.innerHTML += mq.innerHTML;

  /* ---------------- Counters ---------------- */
  function countUp(el) {
    const target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.decimals || 0, 10);
    if (reduceMotion) { el.textContent = target.toFixed(dec); return; }
    const t0 = performance.now(), dur = 1600;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------------- Solutions art ---------------- */
  $$('[data-art]').forEach(el => { el.innerHTML = R.scene(el.dataset.art); });
  $$('[data-render]').forEach(el => { el.innerHTML = R[el.dataset.render](); });

  /* ---------------- Spectrum ---------------- */
  (function buildSpectrum() {
    if (!$('#spectrumChart')) return;
    const pos = (um) => ((Math.log10(um) + 4) / 7) * 100; // 0.0001 µm → 1000 µm
    const ticks = [0.0001, 0.001, 0.01, 0.1, 1, 10, 100, 1000];
    const fmt = (v) => v < 0.01 ? v.toString() : v.toLocaleString();
    const stages = [
      { n: 'Sediment', s: 'PP / string-wound · 5 µm', from: 5, to: 1000, t: 'Silt, sand, rust, sediment' },
      { n: 'Activated carbon', s: 'CTO block · adsorption', from: 0.0003, to: 0.03, t: 'Chlorine, VOCs, taste & odour' },
      { n: 'Ultrafiltration', s: 'Hollow fibre · 0.01 µm', from: 0.01, to: 1000, t: 'Bacteria, colloids, turbidity' },
      { n: 'Reverse osmosis', s: 'HydraCore™ · ~0.0001 µm', from: 0.0001, to: 1000, t: 'Dissolved salts, metals, nitrates, PFAS' },
      { n: 'UV disinfection', s: '254 nm · 40 mJ/cm²', from: 0.02, to: 20, t: 'Inactivates viruses, bacteria, cysts' },
    ];
    const contam = [
      { n: 'Ions & salts', v: 0.0003, s: 6 }, { n: 'Pesticides', v: 0.002, s: 8 }, { n: 'Viruses', v: 0.05, s: 10 },
      { n: 'Bacteria', v: 1, s: 13 }, { n: 'Cysts', v: 10, s: 16 }, { n: 'Silt & sand', v: 200, s: 22 },
    ];
    let html = `<div class="spec-row"><div class="name"><small>PARTICLE SIZE (µm)</small></div><div class="spec-scale">`;
    ticks.forEach(t => { html += `<div class="spec-tick" style="left:${pos(t)}%">${fmt(t)}</div>`; });
    html += `</div></div><div class="spec-row contaminants"><div class="name">Contaminants<small>typical size</small></div><div class="contam-pills">`;
    contam.forEach(c => { html += `<div class="cpill" style="left:${pos(c.v)}%;top:${30 - c.s}px"><i style="width:${c.s * 2}px;height:${c.s * 2}px"></i>${c.n}</div>`; });
    html += `</div></div>`;
    stages.forEach(st => {
      const l = pos(st.from), r = pos(st.to);
      html += `<div class="spec-row"><div class="name">${st.n}<small>${st.s}</small></div><div class="spec-track"><div class="spec-bar" style="left:${l}%;width:${r - l}%">${st.t}</div></div></div>`;
    });
    $('#spectrumChart').innerHTML = html;
  })();

  /* ---------------- Products ---------------- */
  // To use real photography, add  img: 'assets/img/your-photo.jpg'  to any product.
  const products = [
    { cat: 'ro', sku: 'PV-HOME 5', name: 'PureHome 5-Stage RO', d: 'Under-sink purifier with sediment, dual carbon, RO membrane and a pressurised storage tank.', specs: ['75 GPD', '5 stages', 'NSF 58 design'], r: () => R.domesticRO() },
    { cat: 'ro', sku: 'PV-C 500', name: 'PV-C 500 LPH Commercial RO', d: 'Compact SS304 skid for clinics, restaurants and water refilling stations.', specs: ['500 L/h', '2 × 4040', 'View in 3D'], img: 'assets/img/renders/c500.png', r: () => R.skid({ vessels: 2, cols: 1, compact: true }), link: 'ro-systems.html?model=c500' },
    { cat: 'ro', sku: 'PV-C 1000', name: 'PV-C 1000 LPH Commercial RO', d: 'Hotel and bottling-grade RO with UV polishing and PLC control.', specs: ['1,000 L/h', '3 × 4040', 'View in 3D'], img: 'assets/img/renders/c1000.png', r: () => R.skid({ vessels: 3, cols: 1, compact: true }), link: 'ro-systems.html?model=c1000' },
    { cat: 'ro', sku: 'PV-C 2000', name: 'PV-C 2000 LPH Industrial RO', d: 'An 8" membrane array with an SS cartridge housing and VFD pump for continuous industrial duty.', specs: ['2,000 L/h', '3 × 8040', 'View in 3D'], img: 'assets/img/renders/c2000.png', r: () => R.skid({ vessels: 6, cols: 2 }), link: 'ro-systems.html?model=c2000' },
    { cat: 'ro', sku: 'PV-SWRO 100', name: 'Containerised SWRO', d: 'Plug-and-play seawater desalination in a 20 ft container with isobaric ERD.', specs: ['100 m³/day', '≈3 kWh/m³', 'View in 3D'], img: 'assets/img/renders/swro.png', r: () => R.container(), link: 'ro-systems.html?model=swro' },

    { cat: 'mem', sku: 'HC-BW-8040', name: 'HydraCore™ BW-8040', d: 'High-rejection brackish water RO element for industrial and municipal trains.', specs: ['99.5% rejection', '37 m²', '41 bar max'], r: () => R.membrane({ type: 'BW' }) },
    { cat: 'mem', sku: 'HC-SW-8040', name: 'HydraCore™ SW-8040', d: 'Seawater element engineered for 99.75% rejection at low energy consumption.', specs: ['99.75% rejection', '83 bar max', 'Boron-select'], r: () => R.membrane({ type: 'SW' }) },
    { cat: 'mem', sku: 'PV-UF 90', name: 'PV-UF Hollow Fibre Module', d: 'PVDF ultrafiltration for RO pre-treatment and surface water, with an outside-in configuration.', specs: ['0.01 µm', 'PVDF', 'Backwashable'], r: () => R.uf() },
    { cat: 'mem', sku: 'PV-FRP-8', name: 'FRP Pressure Vessels', d: 'Filament-wound composite membrane housings, side- or end-ported, in 4" and 8" diameters.', specs: ['300–1,200 psi', '1–8 elements', 'ASME design'], r: () => R.vesselFRP() },

    { cat: 'pre', sku: 'PV-BB 20', name: 'Big Blue Filter Housings', d: 'Heavy-duty 10" and 20" housings for whole-house and commercial pre-filtration.', specs: ['4.5" Ø', '1" BSP', 'Pressure relief'], r: () => R.housing({ color: 'blue', big: true }) },
    { cat: 'pre', sku: 'PV-SL 10', name: 'Slim-Line Clear Housings', d: 'Transparent SAN bowls for easy visual inspection of cartridge loading.', specs: ['10" / 20"', '½"–¾" BSP', '8 bar'], r: () => R.housing({ color: 'clear' }) },
    { cat: 'pre', sku: 'PV-PP 5', name: 'PP Sediment Cartridges', d: 'Melt-blown, graded-density polypropylene for high dirt-holding capacity.', specs: ['1–50 µm', '10"–40"', 'FDA-grade PP'], r: () => R.cartridge({ kind: 'pp' }) },
    { cat: 'pre', sku: 'PV-CTO 10', name: 'CTO Carbon Block', d: 'Coconut-shell carbon block for chlorine, taste, odour and VOC reduction.', specs: ['10 µm', 'Coconut shell', '>99% Cl₂'], r: () => R.cartridge({ kind: 'carbon' }) },
    { cat: 'pre', sku: 'PV-PL 20', name: 'Pleated & String-Wound', d: 'Washable pleated polyester and string-wound cartridges for high-flow duty.', specs: ['Washable', 'High flow', '1–50 µm'], r: () => R.cartridge({ kind: 'pleated' }) },
    { cat: 'pre', sku: 'PV-SSH 7', name: 'SS316 Multi-Cartridge Housing', d: 'Stainless steel housings for 3–51 cartridges, with swing-bolt closure and gauge port.', specs: ['SS304 / SS316', '10 bar', '3–51 rounds'], r: () => R.ssHousing() },

    { cat: 'uv', sku: 'PV-UV 12', name: 'PureGuard™ UV Steriliser', d: 'SS304 UV reactor with quartz sleeve, lamp-failure alarm and hour counter.', specs: ['1–60 GPM', '40 mJ/cm²', '254 nm'], r: () => R.uv() },
    { cat: 'uv', sku: 'PV-DP 6', name: 'Chemical Dosing Pump', d: 'Digital diaphragm pump for antiscalant, chlorine and pH correction dosing.', specs: ['0.5–20 L/h', '10 bar', '4–20 mA'], r: () => R.dosing() },

    { cat: 'inst', sku: 'PV-FM 40', name: 'Panel Flow Meters', d: 'Variable-area rotameters for permeate and concentrate flow indication.', specs: ['0.5–40 GPM', 'Acrylic body', 'PVC unions'], r: () => R.rotameter() },
    { cat: 'inst', sku: 'PV-PG 63', name: 'Glycerine Pressure Gauges', d: 'Stainless steel, liquid-filled gauges that damp pulsation from high-pressure pumps.', specs: ['0–25 / 0–100 bar', '63 / 100 mm', 'SS304'], r: () => R.gauge() },
    { cat: 'inst', sku: 'PV-PS 1', name: 'Pressure Switches', d: 'Low- and high-pressure protection switches for RO pump control circuits.', specs: ['Adjustable', 'IP65', '¼" BSP'], r: () => R.pswitch() },
  ];
  const cats = [
    { k: 'all', n: 'All products' }, { k: 'ro', n: 'RO Systems' }, { k: 'mem', n: 'Membranes & Vessels' },
    { k: 'pre', n: 'Pre-treatment' }, { k: 'uv', n: 'Disinfection & Dosing' }, { k: 'inst', n: 'Instrumentation' },
  ];
  const catName = Object.fromEntries(cats.map(c => [c.k, c.n]));
  const grid = $('#productGrid'), bar = $('#filterBar');
  if (grid && bar) {
  bar.innerHTML = cats.map((c, i) => `<button role="tab" data-k="${c.k}" class="${i ? '' : 'active'}" aria-selected="${!i}">${c.n}<span class="count">${c.k === 'all' ? products.length : products.filter(p => p.cat === c.k).length}</span></button>`).join('');
  grid.innerHTML = products.map(p => `
    <article class="p-card" data-cat="${p.cat}">
      <div class="p-media"><span class="sku">${p.sku}</span><span class="cat">${catName[p.cat].split(' ')[0]}</span>
        ${p.img ? `<img src="${p.img}" alt="${p.name}" loading="lazy">` : p.r()}</div>
      <div class="p-body"><h3>${p.name}</h3><p>${p.d}</p><div class="p-specs">${p.specs.map(s => `<span>${s}</span>`).join('')}</div></div>
      <div class="p-foot">${p.link ? `<a href="${p.link}">Explore in 3D ${arrow}</a>` : `<span class="stock">In stock · UK &amp; hubs</span>`}<a href="contact.html?product=${encodeURIComponent(p.sku)}">Enquire ${arrow}</a></div>
    </article>`).join('');
  }
  if (grid && bar) bar.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', bar).forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-selected', x === b); });
    $$('.p-card', grid).forEach(c => c.classList.toggle('hide', b.dataset.k !== 'all' && c.dataset.cat !== b.dataset.k));
  });

  /* ---------------- Industries ---------------- */
  const ic = {
    city: '<path d="M3 21h18M5 21V9l5-3v15M10 21V4l9 4v13M13 10h3M13 14h3M13 18h3M7 12h1M7 16h1"/>',
    hotel: '<path d="M3 21V7l9-4 9 4v14M3 21h18M8 21v-5h8v5M7 10h2M11 10h2M15 10h2M7 13h2M11 13h2M15 13h2"/>',
    lab: '<path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3M7 15h10"/>',
    food: '<path d="M8 2h8l-1 5a4 4 0 0 1-2 3.5V20h2v2H9v-2h2v-9.5A4 4 0 0 1 9 7z"/>',
    mine: '<path d="M2 20h20M4 20l4-9 4 4 3-7 5 12M14 5l3-3M17 2l3 3"/>',
    leaf: '<path d="M5 21c0-9 5-15 16-17-1 11-7 16-16 17zM5 21c3-5 6-8 11-11"/>',
  };
  const svg = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const P = 'assets/img/photos/';
  const inds = [
    ['city', 'Municipal & Utilities', 'Brackish and seawater desalination, community water kiosks and emergency mobile treatment units.', 'community-smiles', 'Containerised SWRO · PV-C 2000'],
    ['hotel', 'Hospitality & Real Estate', 'Resort desalination, potable and pool water, laundry softening and bottled-water replacement.', 'water-glass', 'PV-C 1000 · UV polishing'],
    ['lab', 'Healthcare & Pharma', 'Purified water and water for injection pre-treatment, dialysis-grade RO and laboratory ultrapure water.', 'lab-analysis', 'Double-pass RO · EDI'],
    ['food', 'Food & Beverage', 'Process water for brewing, dairy and bottling, with consistent mineral profiles batch after batch.', 'quality-inspection', 'PV-C 2000 · remineralisation'],
    ['mine', 'Mining, Oil & Energy', 'Boiler feed, cooling tower make-up, produced water and mine dewatering under harsh conditions.', 'site-construction', 'Industrial RO trains · UF'],
    ['leaf', 'Agriculture & Aquaculture', 'Desalinated irrigation, hydroponics and hatchery water engineered for yield and animal health.', 'aerial-water-forest', 'Brackish RO · high recovery'],
  ];
  const ig = $('#indGrid');
  if (ig && ig.dataset.variant === 'photo') {
    ig.innerHTML = inds.map((d, i) => `
      <article class="ind-photo reveal" data-delay="${i % 3}">
        <div class="ph"><img src="${P}${d[3]}.jpg" alt="" loading="lazy"><div class="ic">${svg(ic[d[0]])}</div></div>
        <div class="bd"><span class="num">0${i + 1}</span><h3>${d[1]}</h3><p>${d[2]}</p><span class="fit">${d[4]}</span></div>
      </article>`).join('');
  } else if (ig) {
    ig.innerHTML = inds.map((d, i) => `
      <a href="industries.html" class="ind reveal" data-delay="${i % 3}"><span class="num">0${i + 1}</span><div class="ic">${svg(ic[d[0]])}</div><h3>${d[1]}</h3><p>${d[2]}</p></a>`).join('');
  }

  /* ---------------- Global hubs list (globe.js reads this) ---------------- */
  window.PV_HUBS = [
    { n: 'London', c: 'United Kingdom', r: 'Global HQ · R&D · Engineering', lat: 51.507, lon: -0.128, hq: true },
    { n: 'Rotterdam', c: 'Netherlands', r: 'EU logistics hub', lat: 51.924, lon: 4.478 },
    { n: 'Dubai', c: 'UAE', r: 'Middle East & GCC', lat: 25.205, lon: 55.271 },
    { n: 'Nairobi', c: 'Kenya', r: 'East & Central Africa', lat: -1.286, lon: 36.817 },
    { n: 'Lagos', c: 'Nigeria', r: 'West Africa', lat: 6.524, lon: 3.379 },
    { n: 'Johannesburg', c: 'South Africa', r: 'Southern Africa', lat: -26.204, lon: 28.047 },
    { n: 'Mumbai', c: 'India', r: 'South Asia', lat: 19.076, lon: 72.878 },
    { n: 'Singapore', c: 'Singapore', r: 'Asia-Pacific', lat: 1.352, lon: 103.82 },
    { n: 'Sydney', c: 'Australia', r: 'Oceania', lat: -33.869, lon: 151.209 },
    { n: 'Houston', c: 'United States', r: 'North America', lat: 29.76, lon: -95.37 },
    { n: 'São Paulo', c: 'Brazil', r: 'Latin America', lat: -23.55, lon: -46.633 },
  ];
  if ($('#hubList')) $('#hubList').innerHTML = window.PV_HUBS.map((h, i) => `
    <button class="hub ${h.hq ? 'hq active' : ''}" data-i="${i}"><i class="pin"></i><b>${h.n}, ${h.c}</b><span>${h.r}</span></button>`).join('');

  /* ---------------- Projects ---------------- */
  // Placeholder reference projects: replace with real case studies before launch.
  const projects = [
    { loc: 'MOMBASA · KENYA', sector: 'Hospitality', t: 'Coastal resort seawater desalination', d: 'A containerised SWRO with isobaric energy recovery replaced trucked-in water for a 400-key beach resort.', f: [['300', 'm³/day'], ['3.1', 'kWh/m³'], ['45%', 'recovery']], img: 'site-team' },
    { loc: 'DUBAI · UAE', sector: 'Industrial', t: 'District cooling make-up water', d: 'Two-train brackish RO with UF pre-treatment supplying make-up water to a district cooling plant.', f: [['2,400', 'm³/day'], ['82%', 'recovery'], ['2 × 50%', 'trains']], img: 'site-construction' },
    { loc: 'MIDLANDS · UK', sector: 'Pharmaceutical', t: 'Purified water generation', d: 'Double-pass RO with EDI polishing and a hot-water sanitisable loop for GMP manufacturing.', f: [['15', 'm³/h'], ['<1', 'µS/cm'], ['GMP', 'validated']], img: 'lab-analysis' },
  ];
  if ($('#projGrid')) $('#projGrid').innerHTML = projects.map((p, i) => `
    <article class="proj reveal" data-delay="${i}">
      <div class="top"><img src="${P}${p.img}.jpg" alt="" loading="lazy"><span class="loc">${p.loc}</span></div>
      <div class="body"><span class="sector">${p.sector}</span><h3>${p.t}</h3><p>${p.d}</p>
        <div class="facts">${p.f.map(x => `<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div></div>
    </article>`).join('');

  /* ---------------- Reveal on scroll ---------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      $$('[data-count]', e.target).forEach(countUp);
      if (e.target.matches('[data-count]')) countUp(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  $$('.reveal, .s-metric').forEach(el => io.observe(el));
  // counters not inside a .reveal
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
  });
  $$('[data-count]').forEach(el => { if (!el.closest('.reveal, .s-metric')) cio.observe(el); });

  /* ---------------- Contact form ---------------- */
  const qf = $('#quoteForm');
  if (qf) {
    const qs = new URLSearchParams(location.search);
    const names = { c500: 'PV-C 500 LPH Commercial RO', c1000: 'PV-C 1000 LPH Commercial RO', c2000: 'PV-C 2000 LPH Industrial RO', swro: 'PV-SWRO 100 Containerised desalination' };
    const want = qs.get('model') ? names[qs.get('model')] : qs.get('product');
    if (want && $('#fMsg')) $('#fMsg').value = `I'm interested in: ${want}\n\n`;
    qf.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      const bad = $$('[required]', f).filter(i => !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value)));
      $$('input', f).forEach(i => i.style.borderColor = '');
      if (bad.length) { bad.forEach(i => i.style.borderColor = 'var(--red)'); bad[0].focus(); return; }
      $('#formOk').classList.add('show');
      f.reset();
    });
  }

  /* ======================================================================
     Hero canvas — flowing water streamlines
     ====================================================================== */
  (function hero() {
    const cv = $('#heroCanvas'); if (!cv) return;
    const ctx = cv.getContext('2d');
    let W, H, dpr, parts = [], running = true, t = 0;
    const N = () => Math.min(900, Math.floor((W * H) / 1800));
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      parts = Array.from({ length: N() }, spawn);
    }
    function spawn() {
      return { x: Math.random() * W, y: Math.random() * H, life: Math.random() * 200, s: 0.6 + Math.random() * 1.2, c: Math.random() < 0.12 ? 1 : 0 };
    }
    function field(x, y) {
      const a = Math.sin(y * 0.004 + t * 0.6) * 0.9 + Math.cos(x * 0.003 - t * 0.4) * 0.6 + Math.sin((x + y) * 0.002 + t) * 0.3;
      return a * 0.6;
    }
    function frame() {
      if (!running) return;
      t += 0.004;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      for (const p of parts) {
        const a = field(p.x, p.y);
        const nx = p.x + Math.cos(a) * p.s * 1.4, ny = p.y + Math.sin(a) * p.s;
        ctx.strokeStyle = p.c ? 'rgba(0,224,184,.55)' : 'rgba(25,195,255,.38)';
        ctx.lineWidth = p.c ? 1.4 : 0.9;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
        p.x = nx; p.y = ny; p.life++;
        if (p.x > W + 10 || p.x < -10 || p.y < -10 || p.y > H + 10 || p.life > 400) Object.assign(p, spawn(), { x: Math.random() < 0.7 ? -5 : Math.random() * W, life: 0 });
      }
      requestAnimationFrame(frame);
    }
    resize();
    window.addEventListener('resize', () => { clearTimeout(resize._t); resize._t = setTimeout(resize, 150); });
    if (reduceMotion) { for (let i = 0; i < 120; i++) { t += 0.004; } return; }
    new IntersectionObserver(([e]) => { const was = running; running = e.isIntersecting; if (running && !was) frame(); }).observe(cv);
    frame();
  })();

  /* ======================================================================
     Hero telemetry card — simulated plant data
     ====================================================================== */
  (function telemetry() {
    const sp = $('#tmSpark'); if (!sp) return;
    const ctx = sp.getContext('2d');
    const data = Array.from({ length: 60 }, (_, i) => 24 + Math.sin(i / 6) * 0.4 + (Math.random() - .5) * 0.3);
    let base = { flow: 24, tds: 18, rej: 99.2, e: 0.71 };
    function draw() {
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = sp.clientWidth, h = sp.clientHeight;
      sp.width = w * dpr; sp.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const min = Math.min(...data) - 0.3, max = Math.max(...data) + 0.3;
      const X = i => (i / (data.length - 1)) * w, Y = v => h - ((v - min) / (max - min)) * h;
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(25,195,255,.35)'); g.addColorStop(1, 'rgba(25,195,255,0)');
      ctx.beginPath(); data.forEach((v, i) => i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)));
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); data.forEach((v, i) => i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)));
      ctx.strokeStyle = '#19c3ff'; ctx.lineWidth = 1.6; ctx.stroke();
      const lx = X(data.length - 1), ly = Y(data[data.length - 1]);
      ctx.beginPath(); ctx.arc(lx - 2, ly, 3, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
    }
    function tick() {
      const v = 24 + Math.sin(Date.now() / 6000) * 0.4 + (Math.random() - .5) * 0.3;
      data.push(v); data.shift();
      $('#tmFlow').innerHTML = `${v.toFixed(1)}<small>m³/h</small>`;
      $('#tmTds').innerHTML = `${Math.round(base.tds + (Math.random() - .5) * 2)}<small>mg/L</small>`;
      $('#tmRej').innerHTML = `${(base.rej + (Math.random() - .5) * 0.08).toFixed(2)}<small>%</small>`;
      $('#tmEnergy').innerHTML = `${(base.e + (Math.random() - .5) * 0.02).toFixed(2)}<small>kWh/m³</small>`;
      const d = new Date();
      $('#tmClock').textContent = d.toISOString().substr(11, 8) + ' UTC';
      draw();
    }
    tick(); setInterval(tick, 1500);
    window.addEventListener('resize', draw);
  })();
})();
