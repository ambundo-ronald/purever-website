/* ==========================================================================
   PUREVER ROSA-Lite — Reverse Osmosis process simulator
   ---------------------------------------------------------------------------
   Steady-state, single-pass RO array using the solution-diffusion model:
     Water flux     J  = A · TCF · NDP                [L/m²·h]
     Salt passage   Cp = B·Cm / (J + B)                [mg/L]
     NDP            = Pf − ΔP/2 − π(Cm)                [bar]
     Cm (membrane)  = C_feed · LMCF · CPF              (log-mean + polarisation)
     π              ≈ 0.00076 bar per mg/L TDS (NaCl-equivalent)
     TCF            = exp[2640 · (1/298.15 − 1/T)]
   Indicative only — not a replacement for a full membrane projection.
   ========================================================================== */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  if (!$('#pid')) return;

  const MEM = {
    LE: { name: 'HydraCore LE-8040', A: 4.4, B: 0.16, maxP: 41, flux: 30, rated: '99.3%' },
    BW: { name: 'HydraCore BW-8040', A: 3.0, B: 0.09, maxP: 41, flux: 28, rated: '99.5%' },
    SW: { name: 'HydraCore SW-8040', A: 0.85, B: 0.03, maxP: 83, flux: 17, rated: '99.75%' },
  };
  const AREA = 37, EL_PER_V = 6, DP = 1.6, PI_K = 0.00076, ETA_P = 0.8, ETA_ERD = 0.95;

  const PRESETS = [
    { id: 'uk', n: 'UK mains · 320 ppm', s: { tds: 320, temp: 12, P: 9, R: 75, mem: 'LE', V: 2, age: 1, pre: true, as: true, erd: false } },
    { id: 'bore', n: 'Borehole Kenya · 1,800 ppm', s: { tds: 1800, temp: 25, P: 11, R: 75, mem: 'BW', V: 4, age: 0, pre: true, as: true, erd: false } },
    { id: 'gulf', n: 'Brackish Gulf · 6,000 ppm', s: { tds: 6000, temp: 32, P: 17, R: 70, mem: 'BW', V: 8, age: 0, pre: true, as: true, erd: false } },
    { id: 'sea', n: 'Seawater Red Sea · 41,000 ppm', s: { tds: 41000, temp: 28, P: 64, R: 42, mem: 'SW', V: 8, age: 0, pre: true, as: true, erd: true } },
  ];

  let S = Object.assign({}, PRESETS[1].s);

  /* ------------------------------------------------------------------ model */
  function model(st, Pover) {
    const m = MEM[st.mem];
    const P = Pover != null ? Pover : st.P;
    const T = st.temp;
    const TCF = Math.exp(2640 * (1 / 298.15 - 1 / (273.15 + T)));
    const A = m.A * TCF * Math.pow(0.93, st.age) * (st.pre ? 1 : 0.72);
    const B = m.B * TCF * Math.pow(1.1, st.age) * (st.pre ? 1 : 1.15);
    const CPF = 1.08 + 0.12 * (st.R / 100);

    // thermodynamic limit on recovery: concentrate osmotic pressure must stay below available pressure
    const Rset = st.R / 100;
    const Rmax = Math.max(0.01, 1 - (st.tds * CPF * PI_K) / Math.max(0.01, P - DP));
    const R = Math.max(0.01, Math.min(Rset, Rmax * 0.97));
    const limited = Rset > Rmax * 0.97;

    const LMCF = Math.log(1 / (1 - R)) / R;
    const Cm = st.tds * LMCF * CPF;
    const piM = Cm * PI_K;
    const NDP = P - DP / 2 - piM;
    const J = Math.max(0, A * NDP);
    const area = st.V * EL_PER_V * AREA;
    const Qp = (J * area) / 1000;
    const Cp = J > 0 ? (B * Cm) / (J + B) : st.tds;
    const Qf = Qp > 0 ? Qp / R : 0;
    const Qc = Qf - Qp;
    const Cc = Qc > 0 ? (Qf * st.tds - Qp * Cp) / Qc : st.tds / (1 - R);
    const rej = Math.max(0, 1 - Cp / st.tds);
    const kW = (P * Qf - (st.erd ? ETA_ERD * (P - DP) * Qc : 0)) / 36 / ETA_P;
    const SEC = Qp > 0 ? kW / Qp : 0;
    const kWnoErd = (P * Qf) / 36 / ETA_P;
    return { m, P, TCF, A, B, R, Rset, Rmax, limited, LMCF, Cm, piM, NDP, J, area, Qp, Cp, Qf, Qc, Cc, rej, kW, SEC, SECnoErd: Qp > 0 ? kWnoErd / Qp : 0 };
  }

  /* --------------------------------------------------------------- formatting */
  const nf = (v, d = 0) => Number(v).toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  const flowFmt = (q) => q >= 100 ? nf(q, 0) : q >= 10 ? nf(q, 1) : nf(q, 2);
  const tdsFmt = (c) => c >= 100 ? nf(c, 0) : c >= 10 ? nf(c, 1) : nf(c, 2);

  /* ------------------------------------------------------------------- inputs */
  const el = {
    tds: $('#inTds'), temp: $('#inTemp'), P: $('#inP'), R: $('#inR'), V: $('#inV'), age: $('#inAge'),
    pre: $('#inPre'), as: $('#inAs'), erd: $('#inErd'), mem: $('#inMem'),
  };
  const tdsToSlider = (t) => Math.round(1000 * Math.log(t / 50) / Math.log(900));
  const sliderToTds = (v) => { const t = 50 * Math.pow(900, v / 1000); return t < 1000 ? Math.round(t / 10) * 10 : Math.round(t / 100) * 100; };

  function syncInputs() {
    el.tds.value = tdsToSlider(S.tds); el.temp.value = S.temp; el.P.value = S.P; el.R.value = S.R; el.V.value = S.V; el.age.value = S.age;
    el.pre.checked = S.pre; el.as.checked = S.as; el.erd.checked = S.erd;
    $$('button', el.mem).forEach(b => { b.classList.toggle('active', b.dataset.v === S.mem); b.setAttribute('aria-checked', b.dataset.v === S.mem); b.setAttribute('role', 'radio'); });
  }
  function readOutputs() {
    $('#outTds').innerHTML = `${nf(S.tds)}<small>mg/L</small>`;
    $('#outTemp').innerHTML = `${S.temp}<small>°C</small>`;
    $('#outP').innerHTML = `${nf(S.P, 1)}<small>bar</small>`;
    $('#outR').innerHTML = `${S.R}<small>%</small>`;
    $('#outV').innerHTML = `${S.V}<small>× ${S.V * EL_PER_V} el.</small>`;
    $('#outAge').innerHTML = `${S.age}<small>yrs</small>`;
  }
  const clearPreset = () => $$('.preset').forEach(b => b.classList.remove('active'));
  const onInput = (k, fn) => el[k].addEventListener('input', () => { S[k] = fn(el[k].value); clearPreset(); update(); });
  onInput('tds', v => sliderToTds(+v));
  onInput('temp', v => +v); onInput('P', v => +v); onInput('R', v => +v); onInput('V', v => +v); onInput('age', v => +v);
  ['pre', 'as', 'erd'].forEach(k => el[k].addEventListener('change', () => { S[k] = el[k].checked; clearPreset(); update(); }));
  el.mem.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    S.mem = b.dataset.v; clearPreset(); syncInputs(); update();
  });

  // presets
  const pw = $('#presets');
  pw.innerHTML = PRESETS.map((p, i) => `<button class="preset ${i === 1 ? 'active' : ''}" data-id="${p.id}">${p.n}</button>`).join('');
  pw.addEventListener('click', (e) => {
    const b = e.target.closest('.preset'); if (!b) return;
    S = Object.assign({}, PRESETS.find(p => p.id === b.dataset.id).s);
    $$('.preset').forEach(x => x.classList.toggle('active', x === b));
    syncInputs(); update();
  });

  /* ======================================================================
     P&ID — generated SVG
     ====================================================================== */
  const svg = $('#pid');
  let drawnVessels = -1;
  const Y = 270;

  function tagBox(x, y, code, idv, w = 124) {
    return `<g transform="translate(${x} ${y})">
      <rect class="tag-box" width="${w}" height="38" rx="6"/>
      <text class="tag" x="9" y="14">${code}</text>
      <text class="tag-v" x="9" y="30" id="${idv}">–</text></g>`;
  }
  const pipe = (d, kind, fid) => `<path class="pipe ${kind}" d="${d}"/><path class="flow ${kind}" ${fid ? `data-f="${fid}"` : ''} d="${d}"/>`;

  function buildPID(n) {
    const gap = 58;
    const ys = Array.from({ length: n }, (_, i) => Y + (i - (n - 1) / 2) * gap);
    const top = ys[0], bot = ys[n - 1];
    const xL = 540, xR = 800, xC = 846, xP = 884;

    let s = `<defs>
      <linearGradient id="pidVes" x1="0" x2="1"><stop offset="0" stop-color="#2b5bb8"/><stop id="pidVesMid" offset=".6" stop-color="#3a78c8"/><stop id="pidVesEnd" offset="1" stop-color="#ffb547"/></linearGradient>
      <linearGradient id="pidSteel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa6ba"/><stop offset=".4" stop-color="#e6ebf3"/><stop offset="1" stop-color="#6b7689"/></linearGradient>
      <linearGradient id="pidWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#19c3ff" stop-opacity=".75"/><stop offset="1" stop-color="#0b4f9e" stop-opacity=".85"/></linearGradient>
      <linearGradient id="pidRaw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5f7fb8" stop-opacity=".7"/><stop offset="1" stop-color="#22385f" stop-opacity=".9"/></linearGradient>
      <pattern id="pidGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#fff" stroke-opacity=".03"/></pattern>
      <clipPath id="clipRaw"><rect x="22" y="182" width="76" height="146" rx="6"/></clipPath>
      <clipPath id="clipProd"><rect x="1022" y="152" width="62" height="146" rx="6"/></clipPath>
    </defs>
    <rect width="1100" height="440" fill="url(#pidGrid)"/>`;

    // ---- pipes (drawn first) ----
    s += pipe(`M100 ${Y} H125`, 'feed', 'feed');
    s += pipe(`M165 ${Y} H190`, 'feed', 'feed');
    s += pipe(`M230 ${Y} H260`, 'feed', 'feed');
    s += pipe(`M300 ${Y} H396`, 'feed', 'feed');
    s += pipe(`M444 ${Y} H510`, 'feed', 'feed');
    s += pipe(`M510 ${top} V${bot}`, 'feed', 'feedV');
    ys.forEach(y => { s += pipe(`M510 ${y} H${xL}`, 'feed', 'feedV'); });
    // concentrate from each vessel
    ys.forEach(y => { s += pipe(`M${xR} ${y + 8} H${xC}`, 'conc', 'conc'); });
    s += pipe(`M${xC} ${top + 8} V400 H880`, 'conc', 'conc');
    s += pipe(`M920 400 H955`, 'conc', 'conc');
    s += pipe(`M1025 400 H1060`, 'conc', 'conc');
    // permeate with hop over concentrate header
    ys.forEach(y => { const py = y - 8; s += pipe(`M${xR} ${py} H${xC - 7} A7 7 0 0 1 ${xC + 7} ${py} H${xP}`, 'perm', 'perm'); });
    s += pipe(`M${xP} ${bot - 8} V110 H922`, 'perm', 'perm');
    s += pipe(`M1000 110 H1053 V152`, 'perm', 'perm');
    // ERD pressure return (dashed)
    s += `<path id="erdReturn" d="M990 416 V430 H420 V296" fill="none" stroke="#00e0b8" stroke-width="1.6" stroke-dasharray="5 5" opacity=".0"/>`;

    // ---- equipment ----
    // Raw water tank
    s += `<g class="equip" data-tip="T-101|Raw water break tank|Buffers incoming raw water and gives the booster pump a stable suction head.">
      <rect x="20" y="180" width="80" height="150" rx="8" fill="#0a1b3d" stroke="#3d5a8f" stroke-width="2"/>
      <g clip-path="url(#clipRaw)"><rect id="rawLevel" x="20" y="215" width="80" height="120" fill="url(#pidRaw)"/></g>
      <text class="tag" x="60" y="170" text-anchor="middle">T-101 RAW</text></g>`;
    // Booster pump
    s += `<g class="equip" data-tip="P-101|Feed booster pump|Delivers 2–3 bar to the cartridge filters and keeps positive suction pressure on the high-pressure pump.">
      <circle cx="145" cy="${Y}" r="20" fill="#0a1b3d" stroke="#5f7fb8" stroke-width="2"/>
      <g class="pump-rotor" id="rotor1"><path d="M145 ${Y - 12} L156 ${Y + 7} L134 ${Y + 7} Z" fill="#8fb4ff"/></g>
      <text class="tag" x="145" y="${Y + 38}" text-anchor="middle">P-101</text></g>`;
    // Cartridge filters
    const cart = (cx, code, name, desc, color) => `<g class="equip prefilter" data-tip="${code}|${name}|${desc}">
      <rect x="${cx - 22}" y="${Y - 8}" width="44" height="14" rx="3" fill="#1c2738" stroke="#5a6272"/>
      <path d="M${cx - 16} ${Y + 6} H${cx + 16} V${Y + 70} Q${cx + 16} ${Y + 80} ${cx + 6} ${Y + 80} H${cx - 6} Q${cx - 16} ${Y + 80} ${cx - 16} ${Y + 70} Z" fill="${color}" fill-opacity=".25" stroke="${color}" stroke-width="1.6"/>
      <rect x="${cx - 7}" y="${Y + 12}" width="14" height="60" rx="2" fill="${color}" fill-opacity=".55"/>
      <text class="tag" x="${cx}" y="${Y - 16}" text-anchor="middle">${code}</text></g>`;
    s += cart(210, 'F-101', '5 µm PP sediment cartridge', 'Removes silt, sand and rust so particles do not foul the membrane surface.', '#c9d0da');
    s += cart(280, 'F-102', 'CTO carbon block', 'Adsorbs free chlorine, which would oxidise and permanently damage polyamide RO membranes.', '#6c7482');
    s += `<text id="bypassTxt" class="tag" x="245" y="${Y + 104}" text-anchor="middle" fill="#ff5a6a" opacity="0">BYPASSED</text>`;
    // Antiscalant dosing
    s += `<g class="equip" id="asGroup" data-tip="AS-101|Antiscalant dosing|Injects 2–4 mg/L of antiscalant to stop CaCO₃, CaSO₄ and silica scaling as salts concentrate along the array.">
      <rect x="326" y="150" width="40" height="52" rx="6" fill="#0a1b3d" stroke="#00e0b8" stroke-width="1.6"/>
      <rect x="330" y="172" width="32" height="26" rx="3" fill="#00e0b8" fill-opacity=".3"/>
      <path d="M346 202 V${Y - 6}" stroke="#00e0b8" stroke-width="1.6" stroke-dasharray="3 3"/>
      <circle class="drip" cx="346" cy="${Y - 32}" r="3" fill="#00e0b8"/>
      <text class="tag" x="346" y="142" text-anchor="middle">AS-101</text></g>`;
    // HP pump
    s += `<g class="equip" data-tip="HP-101|High-pressure pump|A multistage centrifugal or positive-displacement pump that raises the feed above its osmotic pressure. This is where most of the energy goes.">
      <circle cx="420" cy="${Y}" r="26" fill="#0a1b3d" stroke="#19c3ff" stroke-width="2.4"/>
      <g class="pump-rotor" id="rotor2"><path d="M420 ${Y - 16} L434 ${Y + 9} L406 ${Y + 9} Z" fill="#19c3ff"/></g>
      <text class="tag" x="420" y="${Y + 46}" text-anchor="middle">HP-101</text></g>`;
    // Pressure gauge
    s += `<g class="equip" data-tip="PI-101|Feed pressure|The membrane feed pressure. It must exceed the osmotic pressure at the membrane surface to drive permeation.">
      <path d="M470 ${Y} V${Y - 30}" stroke="#5a6272" stroke-width="2"/>
      <circle cx="470" cy="${Y - 46}" r="16" fill="#e9eef6" stroke="#9aa6ba" stroke-width="2"/>
      <line id="gaugeNeedle" x1="470" y1="${Y - 46}" x2="470" y2="${Y - 58}" stroke="#ff5a6a" stroke-width="2" stroke-linecap="round"/>
      <circle cx="470" cy="${Y - 46}" r="2.5" fill="#0b1f4d"/></g>`;
    // Pressure vessels
    ys.forEach((y, i) => {
      let dividers = '';
      for (let k = 1; k < 6; k++) dividers += `<line x1="${xL + k * ((xR - xL) / 6)}" y1="${y - 15}" x2="${xL + k * ((xR - xL) / 6)}" y2="${y + 15}" stroke="#061230" stroke-opacity=".6"/>`;
      s += `<g class="equip" data-tip="PV-10${i + 1}|Pressure vessel · 6 × 8040 elements|Spiral-wound membranes in series. Salinity rises along the vessel as permeate is withdrawn, which the gradient shows.">
        <rect x="${xL}" y="${y - 17}" width="${xR - xL}" height="34" rx="17" fill="url(#pidVes)" stroke="#8fb4ff" stroke-opacity=".5"/>
        ${dividers}
        <rect x="${xL + 12}" y="${y - 12}" width="${xR - xL - 24}" height="5" rx="2.5" fill="#fff" opacity=".18"/></g>`;
    });
    s += `<text class="tag" x="${xL}" y="${top - 30}" id="arrayLabel"></text>`;
    s += `<text class="tag" x="${(xL + xR) / 2}" y="${bot + 36}" text-anchor="middle" id="moreVessels"></text>`;
    // UV
    s += `<g class="equip" data-tip="UV-201|UV steriliser|254 nm ultraviolet light inactivates any bacteria or viruses in the permeate before storage.">
      <rect x="922" y="96" width="78" height="28" rx="12" fill="url(#pidSteel)"/>
      <rect class="uv-glow" x="930" y="106" width="62" height="8" rx="4" fill="#9b6bff"/>
      <text class="tag" x="961" y="88" text-anchor="middle">UV-201</text></g>`;
    // Product tank
    s += `<g class="equip" data-tip="T-201|Product water tank|Stores treated water for distribution. Level control starts and stops the RO train.">
      <rect x="1020" y="150" width="66" height="150" rx="8" fill="#0a1b3d" stroke="#19c3ff" stroke-width="2"/>
      <g clip-path="url(#clipProd)"><rect id="prodLevel" x="1020" y="250" width="66" height="60" fill="url(#pidWater)"/></g>
      <text class="tag" x="1012" y="200" text-anchor="end">T-201</text></g>`;
    // Control valve
    s += `<g class="equip" data-tip="CV-301|Concentrate control valve|Throttles the concentrate flow to hold the system recovery set point.">
      <path d="M880 388 L920 412 L920 388 L880 412 Z" fill="#0a1b3d" stroke="#ffb547" stroke-width="1.8"/>
      <path d="M900 400 V378 M890 378 H910" stroke="#ffb547" stroke-width="1.8"/>
      <text class="tag" x="900" y="432" text-anchor="middle">CV-301</text></g>`;
    // ERD
    s += `<g class="equip" id="erdGroup" data-tip="ERD-301|Isobaric energy recovery device|Transfers pressure from the high-pressure concentrate directly to incoming feed at about 95% efficiency. Essential for SWRO.">
      <rect x="955" y="384" width="70" height="32" rx="6" fill="#0a1b3d" stroke="#00e0b8" stroke-width="1.8"/>
      <path d="M968 400 h18 m-6 -6 l6 6 -6 6 M1012 400 h-18" stroke="#00e0b8" stroke-width="1.6" fill="none"/>
      <text class="tag" x="990" y="379" text-anchor="middle">ERD-301</text></g>`;
    // Drain
    s += `<g class="equip" data-tip="D-301|Concentrate discharge|Brine is sent to drain, sewer, evaporation pond or a diffuser outfall, as consented.">
      <path d="M1060 392 V412 M1052 412 H1068 M1055 418 H1065 M1058 424 H1062" stroke="#ffb547" stroke-width="1.8"/>
      <text class="tag" x="1072" y="380" text-anchor="middle">DRAIN</text></g>`;

    // ---- instrument tags ----
    s += tagBox(40, 360, 'FIT-101 · FEED', 'tFeed', 150);
    s += tagBox(346, 330, 'PIT-102 · ΔP / NDP', 'tNdp', 146);
    s += tagBox(904, 26, 'AIT-201 · PERMEATE', 'tPerm', 160);
    s += tagBox(xP + 18, Math.min(bot + 20, 318), 'AIT-301 · CONCENTRATE', 'tConc', 172);
    s += `<text class="tag-v" x="496" y="${Y - 50}" id="tPress" style="font-size:13px">–</text>`;

    svg.innerHTML = s;
    drawnVessels = n;
  }

  /* --------------------------------------------------------------- tooltips */
  const tip = $('#pidTip'), diag = $('.sim-diagram');
  svg.addEventListener('mousemove', (e) => {
    const g = e.target.closest('.equip');
    if (!g) { tip.classList.remove('show'); return; }
    const [code, title, desc] = g.dataset.tip.split('|');
    tip.innerHTML = `<span class="code">${code}</span><b>${title}</b>${desc}`;
    const r = diag.getBoundingClientRect();
    let x = e.clientX - r.left + 16, y = e.clientY - r.top + 16;
    if (x + 270 > r.width) x = e.clientX - r.left - 276;
    if (y + 120 > r.height) y = e.clientY - r.top - 120;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
    tip.classList.add('show');
  });
  svg.addEventListener('mouseleave', () => tip.classList.remove('show'));

  /* ======================================================================
     Update everything
     ====================================================================== */
  let last = null;
  function update() {
    readOutputs();
    const r = model(S);
    last = r;
    const n = Math.min(S.V, 4);
    if (n !== drawnVessels) buildPID(n);

    // KPIs
    const setK = (id, html, barId, frac, color) => {
      $(id).innerHTML = html;
      const b = $(barId); b.style.width = Math.max(0, Math.min(100, frac * 100)) + '%'; b.style.background = color || '';
    };
    const flux = r.J;
    setK('#kQp', `${flowFmt(r.Qp)}<small>m³/h</small>`, '#bQp', r.Qp / (S.V * 12));
    setK('#kCp', `${tdsFmt(r.Cp)}<small>mg/L</small>`, '#bCp', r.Cp / 500, r.Cp > 500 ? 'var(--red)' : r.Cp > 250 ? 'var(--amber)' : '');
    setK('#kRej', `${r.J > 0 ? nf(r.rej * 100, 2) : '—'}<small>%</small>`, '#bRej', r.J > 0 ? (r.rej - 0.9) / 0.1 : 0);
    setK('#kJ', `${nf(flux, 1)}<small>LMH</small>`, '#bJ', flux / (r.m.flux * 1.5), flux > r.m.flux ? 'var(--amber)' : '');
    setK('#kNdp', `${nf(r.NDP, 1)}<small>bar</small>`, '#bNdp', r.NDP / r.P, r.NDP <= 0 ? 'var(--red)' : '');
    setK('#kSec', `${r.Qp > 0 ? nf(r.SEC, 2) : '—'}<small>kWh/m³</small>`, '#bSec', r.SEC / 6, 'var(--amber)');

    // Foot
    $('#fDaily').textContent = `${nf(r.Qp * 24, r.Qp * 24 < 10 ? 1 : 0)} m³/day`;
    $('#fFeed').textContent = `${flowFmt(r.Qf)} m³/h`;
    $('#fConc').textContent = `${flowFmt(r.Qc)} m³/h @ ${nf(r.Cc)} mg/L`;
    $('#fPeople').textContent = nf(Math.round(r.Qp * 24 * 1000 / 50 / 10) * 10);

    // P&ID values
    const t = (id, v) => { const e = $('#' + id); if (e) e.textContent = v; };
    t('tFeed', `${flowFmt(r.Qf)} m³/h · ${nf(S.tds)} mg/L`);
    t('tNdp', `ΔP ${DP} · NDP ${nf(r.NDP, 1)} bar`);
    t('tPerm', `${flowFmt(r.Qp)} m³/h · ${tdsFmt(r.Cp)} mg/L`);
    t('tConc', `${flowFmt(r.Qc)} m³/h · ${nf(r.Cc)} mg/L`);
    t('tPress', `${nf(r.P, 1)} bar`);
    t('arrayLabel', `${S.V} × PRESSURE VESSEL · ${S.V * EL_PER_V} × ${r.m.name.toUpperCase()}`);
    t('moreVessels', S.V > 4 ? `+ ${S.V - 4} more vessels in parallel` : '');

    // vessel concentration gradient: blue → amber by recovery
    const endMix = Math.min(1, (r.Cc / Math.max(S.tds, 1) - 1) / 4);
    const lerp = (a, b, k) => Math.round(a + (b - a) * k);
    const endCol = `rgb(${lerp(58, 255, endMix)},${lerp(120, 181, endMix)},${lerp(200, 71, endMix)})`;
    $('#pidVesEnd').setAttribute('stop-color', endCol);

    // flows
    const speed = (q, ref) => q <= 0.0001 ? 0 : Math.max(0.25, Math.min(3, 1.1 / (0.2 + q / ref)));
    const ref = Math.max(1, S.V * 8);
    const setFlow = (sel, q, refq) => $$(`.flow[data-f="${sel}"]`).forEach(p => {
      const d = speed(q, refq);
      p.classList.toggle('off', d === 0);
      if (d) p.style.animationDuration = d.toFixed(2) + 's';
    });
    setFlow('feed', r.Qf, ref); setFlow('feedV', r.Qf / Math.min(S.V, 4), ref / 4);
    setFlow('perm', r.Qp, ref * 0.8); setFlow('conc', r.Qc, ref * 0.4);
    // pumps
    $('#rotor1').style.animationDuration = r.Qf > 0 ? '0.8s' : '0s';
    $('#rotor2').style.animationDuration = r.Qf > 0 ? Math.max(0.25, 1.2 - r.P / 90).toFixed(2) + 's' : '0s';
    $('#rotor2').style.animationPlayState = r.Qf > 0 ? 'running' : 'paused';
    $('#rotor1').style.animationPlayState = r.Qf > 0 ? 'running' : 'paused';
    // gauge needle (0..85 bar over 270°)
    const ang = (-225 + Math.min(85, r.P) / 85 * 270) * Math.PI / 180;
    const nd = $('#gaugeNeedle');
    nd.setAttribute('x2', 470 + Math.cos(ang) * 12); nd.setAttribute('y2', (Y - 46) + Math.sin(ang) * 12);
    // toggles
    $$('.prefilter').forEach(g => g.style.opacity = S.pre ? 1 : 0.25);
    $('#bypassTxt').setAttribute('opacity', S.pre ? 0 : 1);
    $('#asGroup').style.opacity = S.as ? 1 : 0.25;
    $('.drip', svg).style.display = S.as ? '' : 'none';
    $('#erdGroup').style.opacity = S.erd ? 1 : 0.3;
    $('#erdReturn').setAttribute('opacity', S.erd ? 0.8 : 0);

    renderAlerts(r);
    drawCurve();
    micro.set(r);
  }

  /* --------------------------------------------------------------- alerts */
  const ICON = {
    ok: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8.5l3 3 7-7"/></svg>',
    warn: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 2l6.5 12h-13z M8 6.5v3.5 M8 12v.01"/></svg>',
    crit: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="8" r="6.5"/><path d="M8 4.5v4.5 M8 11.5v.01"/></svg>',
  };
  function renderAlerts(r) {
    const A = [];
    const add = (lvl, title, body) => A.push({ lvl, title, body });
    if (r.NDP <= 0) add('crit', 'No permeate production', `Feed pressure is below the osmotic pressure at the membrane surface (${nf(r.piM, 1)} bar). Raise the pressure${S.tds > 15000 && S.mem !== 'SW' ? ' and select seawater elements' : ''}.`);
    if (r.P > r.m.maxP) add('crit', 'Pressure rating exceeded', `${r.m.name} elements are rated to ${r.m.maxP} bar. ${S.mem !== 'SW' ? 'Use SW-8040 elements for high-pressure duty.' : ''}`);
    if (r.limited && r.NDP > 0) add('crit', 'Recovery limited by osmotic pressure', `The concentrate would exceed the available pressure. The maximum achievable recovery is ≈${nf(r.Rmax * 97, 0)}% at ${nf(r.P, 1)} bar.`);
    if (r.Cc > 75000) add('crit', 'Concentrate salinity too high', `${nf(r.Cc)} mg/L is beyond the practical SWRO limit (~70,000 mg/L). Reduce recovery.`);
    if (r.J > r.m.flux) add('warn', 'Flux above design guideline', `${nf(r.J, 1)} LMH exceeds ${r.m.flux} LMH for this membrane and feed. Fouling will accelerate. Add vessels or lower the pressure.`);
    if (r.J > 0 && r.J < 8) add('warn', 'Low membrane flux', `${nf(r.J, 1)} LMH under-utilises the installed area. Reduce the vessel count or increase pressure.`);
    if (!S.as && r.R > 0.65 && S.tds < 20000) add('warn', 'Scaling risk', `The concentration factor is ×${nf(1 / (1 - r.R), 1)}. CaCO₃, CaSO₄ and silica may precipitate without antiscalant.`);
    if (S.as && r.R > 0.86) add('warn', 'Very high recovery', 'Above ~85%, scaling risk rises even with antiscalant. Consider a concentrate recycle or a second-stage design.');
    if (!S.pre) add('warn', 'Pre-treatment bypassed', 'An SDI above 5 is assumed, and a 28% flux loss from fouling is modelled. Unremoved chlorine will also oxidise polyamide membranes.');
    if (r.J > 0 && r.Cp > 500) add(r.Cp > 1000 ? 'crit' : 'warn', 'Permeate quality off-spec', `${tdsFmt(r.Cp)} mg/L is above a 500 mg/L drinking-water target. Increase pressure or add a second pass.`);
    if (S.age >= 4) add('warn', 'Membranes near end of life', `After ${S.age} years, flux has fallen ~${nf((1 - Math.pow(0.93, S.age)) * 100)}% and salt passage has risen ~${nf((Math.pow(1.1, S.age) - 1) * 100)}%. Plan a CIP or element replacement.`);
    if (!S.erd && S.tds > 15000 && r.Qp > 0) {
      const alt = model(Object.assign({}, S, { erd: true }));
      add('warn', 'No energy recovery', `An isobaric ERD would cut specific energy from ${nf(r.SEC, 2)} to ${nf(alt.SEC, 2)} kWh/m³ (−${nf((1 - alt.SEC / r.SEC) * 100)}%).`);
    }
    if (S.temp > 35) add('warn', 'High feed temperature', 'Salt passage increases with temperature. Check the element limit (45 °C) and the permeate spec.');

    const sev = A.some(a => a.lvl === 'crit') ? 'crit' : A.some(a => a.lvl === 'warn') ? 'warn' : 'ok';
    if (sev === 'ok') {
      const q = r.Cp < 50 ? 'Excellent' : r.Cp < 150 ? 'Very good' : r.Cp < 300 ? 'Good' : 'Fair';
      add('ok', 'Operating within design envelope', `Flux, pressure and recovery are all inside ${r.m.name} guidelines.`);
      add('ok', `Permeate quality: ${q}`, `${tdsFmt(r.Cp)} mg/L at ${nf(r.rej * 100, 2)}% rejection (rated ${r.m.rated} under standard test conditions).`);
    }
    const pill = $('#statusPill');
    pill.className = 'status-pill ' + sev;
    pill.textContent = { ok: 'OPTIMAL', warn: 'CAUTION', crit: 'CRITICAL' }[sev];
    const order = { crit: 0, warn: 1, ok: 2 };
    A.sort((a, b) => order[a.lvl] - order[b.lvl]);
    $('#alerts').innerHTML = A.map(a => `<div class="alert ${a.lvl}">${ICON[a.lvl]}<div><b>${a.title}</b>${a.body}</div></div>`).join('');
  }

  /* ======================================================================
     Performance curve
     ====================================================================== */
  const cv = $('#curve'), cx = cv.getContext('2d');
  function niceMax(v) {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p;
    const steps = [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10];
    return steps.find(x => f <= x) * p;
  }
  function drawCurve() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    cv.width = w * dpr; cv.height = h * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.clearRect(0, 0, w, h);
    const m = MEM[S.mem];
    const pMax = S.mem === 'SW' ? 85 : 45;
    const pad = { l: 44, r: 50, t: 10, b: 28 };
    const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
    const pts = [];
    for (let i = 0; i <= 120; i++) { const P = (i / 120) * pMax; pts.push([P, model(S, P)]); }
    const qMax = niceMax(Math.max(...pts.map(p => p[1].Qp), last.Qp) * 1.1 || 1);
    const cpCap = niceMax(Math.max(last.Cp * 2.5, 20));
    const X = (P) => pad.l + (P / pMax) * pw;
    const Yq = (q) => pad.t + ph - (q / qMax) * ph;
    const Yc = (c) => pad.t + ph - (Math.min(c, cpCap) / cpCap) * ph;

    // over-rating zone
    if (m.maxP < pMax) {
      cx.fillStyle = 'rgba(255,90,106,.07)'; cx.fillRect(X(m.maxP), pad.t, X(pMax) - X(m.maxP), ph);
      cx.fillStyle = 'rgba(255,90,106,.6)'; cx.font = '10px IBM Plex Mono, monospace'; cx.textAlign = 'left';
      cx.fillText('> RATING', X(m.maxP) + 4, pad.t + 12);
    }
    // grid
    cx.strokeStyle = 'rgba(255,255,255,.06)'; cx.lineWidth = 1; cx.font = '10px IBM Plex Mono, monospace';
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (ph * i) / 4;
      cx.beginPath(); cx.moveTo(pad.l, y); cx.lineTo(pad.l + pw, y); cx.stroke();
      const ax = (v) => v === 0 ? '0' : v >= 10 ? nf(v, 0) : v >= 1 ? nf(v, 1) : nf(v, 2);
      cx.fillStyle = '#19c3ff'; cx.textAlign = 'right'; cx.fillText(ax(qMax * (1 - i / 4)), pad.l - 6, y + 3);
      cx.fillStyle = '#ffb547'; cx.textAlign = 'left'; cx.fillText(ax(cpCap * (1 - i / 4)), pad.l + pw + 6, y + 3);
    }
    cx.fillStyle = '#5b6b88'; cx.textAlign = 'center';
    const step = pMax > 50 ? 10 : 5;
    for (let P = 0; P <= pMax; P += step) cx.fillText(P, X(P), h - 12);
    cx.fillText('bar', X(pMax) + 16, h - 12);
    cx.save(); cx.translate(10, pad.t + ph / 2); cx.rotate(-Math.PI / 2); cx.fillStyle = '#19c3ff'; cx.fillText('m³/h', 0, 0); cx.restore();
    cx.save(); cx.translate(w - 8, pad.t + ph / 2); cx.rotate(Math.PI / 2); cx.fillStyle = '#ffb547'; cx.fillText('mg/L', 0, 0); cx.restore();

    // permeate flow curve (fill)
    const g = cx.createLinearGradient(0, pad.t, 0, pad.t + ph);
    g.addColorStop(0, 'rgba(25,195,255,.28)'); g.addColorStop(1, 'rgba(25,195,255,0)');
    cx.beginPath(); pts.forEach(([P, r], i) => i ? cx.lineTo(X(P), Yq(r.Qp)) : cx.moveTo(X(P), Yq(r.Qp)));
    cx.lineTo(X(pMax), pad.t + ph); cx.lineTo(X(0), pad.t + ph); cx.closePath(); cx.fillStyle = g; cx.fill();
    cx.beginPath(); pts.forEach(([P, r], i) => i ? cx.lineTo(X(P), Yq(r.Qp)) : cx.moveTo(X(P), Yq(r.Qp)));
    cx.strokeStyle = '#19c3ff'; cx.lineWidth = 2; cx.stroke();
    // permeate TDS curve
    cx.beginPath(); let started = false;
    pts.forEach(([P, r]) => { if (r.Qp <= 0) return; const y = Yc(r.Cp); started ? cx.lineTo(X(P), y) : (cx.moveTo(X(P), y), started = true); });
    cx.setLineDash([5, 4]); cx.strokeStyle = '#ffb547'; cx.lineWidth = 1.8; cx.stroke(); cx.setLineDash([]);

    // operating point
    const ox = X(Math.min(S.P, pMax)), oy = Yq(last.Qp);
    cx.strokeStyle = 'rgba(255,255,255,.25)'; cx.setLineDash([2, 3]);
    cx.beginPath(); cx.moveTo(ox, pad.t); cx.lineTo(ox, pad.t + ph); cx.stroke(); cx.setLineDash([]);
    cx.beginPath(); cx.arc(ox, oy, 6, 0, Math.PI * 2); cx.fillStyle = 'rgba(25,195,255,.25)'; cx.fill();
    cx.beginPath(); cx.arc(ox, oy, 3.5, 0, Math.PI * 2); cx.fillStyle = '#fff'; cx.fill();
    if (last.Qp > 0) { cx.beginPath(); cx.arc(ox, Yc(last.Cp), 3.5, 0, Math.PI * 2); cx.fillStyle = '#ffb547'; cx.fill(); }
    // osmotic pressure marker
    const piX = X(Math.min(pMax, last.piM + DP / 2));
    cx.fillStyle = 'rgba(255,255,255,.5)'; cx.textAlign = 'left';
    cx.beginPath(); cx.moveTo(piX, pad.t + ph); cx.lineTo(piX - 4, pad.t + ph + 6); cx.lineTo(piX + 4, pad.t + ph + 6); cx.fill();
    cx.fillText('π', piX + 5, pad.t + ph - 4);
  }
  window.addEventListener('resize', () => { clearTimeout(drawCurve._t); drawCurve._t = setTimeout(() => { drawCurve(); micro.resize(); }, 120); });

  /* ======================================================================
     Membrane molecular view
     ====================================================================== */
  const micro = (function () {
    const c = $('#micro'), x = c.getContext('2d');
    let w, h, dpr, mY, parts = [], fluxN = 0.5, passS = 0.01, ionsN = 20, running = true;
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1); w = c.clientWidth; h = c.clientHeight;
      if (!w || !h) return;
      c.width = w * dpr; c.height = h * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
      mY = h * 0.62;
      populate();
    }
    function mk(type) {
      return { type, x: Math.random() * w, y: 8 + Math.random() * (mY - 16), vx: 0, vy: 0, side: 0 };
    }
    function populate() {
      const water = parts.filter(p => p.type === 'w');
      const ions = parts.filter(p => p.type !== 'w');
      while (water.length < 70) water.push(mk('w'));
      while (ions.length < ionsN) ions.push(mk(Math.random() < 0.5 ? 'na' : 'cl'));
      ions.length = ionsN;
      parts = water.concat(ions);
    }
    function set(r) {
      fluxN = Math.min(1.6, r.J / 25);
      passS = r.J > 0 ? Math.min(0.5, (1 - r.rej) * 12) : 0;
      ionsN = Math.round(4 + 46 * Math.sqrt(Math.min(1, S.tds / 45000)));
      if (w) populate();
    }
    function step() {
      if (!running) return;
      x.clearRect(0, 0, w, h);
      // regions
      x.fillStyle = 'rgba(25,195,255,.03)'; x.fillRect(0, 0, w, mY);
      x.fillStyle = 'rgba(25,195,255,.08)'; x.fillRect(0, mY + 8, w, h - mY - 8);
      // membrane
      x.fillStyle = '#16305f'; x.fillRect(0, mY, w, 8);
      x.fillStyle = '#2d5aa8'; for (let i = 0; i < w; i += 6) x.fillRect(i, mY, 3, 2);
      x.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 3; i < w; i += 12) x.fillRect(i, mY + 2, 1.5, 6);
      x.font = '9.5px IBM Plex Mono, monospace'; x.fillStyle = '#5b6b88';
      x.textAlign = 'left'; x.fillText('FEED / CONCENTRATE  →', 8, 14);
      x.fillText('PERMEATE', 8, h - 8);
      x.textAlign = 'right'; x.fillText('POLYAMIDE LAYER', w - 8, mY - 5);

      for (const p of parts) {
        const isW = p.type === 'w';
        if (p.side === 0) {
          // feed side: crossflow + drift toward membrane
          p.vx = 0.7 + (isW ? 0.25 : 0.15) * Math.sin(p.y * 0.05 + p.x * 0.01);
          p.vy += ((isW ? 0.05 : 0.035) * fluxN - p.vy * 0.04) + (Math.random() - .5) * 0.12;
          p.vy = Math.max(-1.2, Math.min(1.4, p.vy));
          p.x += p.vx; p.y += p.vy;
          if (p.y < 6) { p.y = 6; p.vy = Math.abs(p.vy); }
          const rad = isW ? 2 : p.type === 'na' ? 3 : 3.8;
          if (p.y > mY - rad) {
            const pass = isW ? (fluxN > 0.02 && Math.random() < 0.35) : Math.random() < passS;
            if (pass) { p.side = 1; p.y = mY + 10; p.vy = 0.6 + Math.random() * 0.5; }
            else { p.y = mY - rad; p.vy = -Math.abs(p.vy) * 0.4 - 0.1; }
          }
          if (p.x > w + 5) { p.x = -5; p.y = 8 + Math.random() * (mY - 30); p.vy = 0; }
        } else {
          p.x += 0.5; p.y += p.vy * 0.6 + (Math.random() - .5) * 0.3;
          if (p.y > h - 4) p.vy = -Math.abs(p.vy) * 0.3;
          if (p.y < mY + 10) p.y = mY + 10;
          if (p.x > w + 5 || Math.random() < 0.004) { p.side = 0; p.x = -5; p.y = 8 + Math.random() * (mY - 30); p.vy = 0; }
        }
        x.beginPath();
        if (isW) { x.fillStyle = 'rgba(120,200,255,.9)'; x.arc(p.x, p.y, 2, 0, Math.PI * 2); }
        else if (p.type === 'na') { x.fillStyle = '#ffb547'; x.arc(p.x, p.y, 3, 0, Math.PI * 2); }
        else { x.fillStyle = '#2fe39a'; x.arc(p.x, p.y, 3.8, 0, Math.PI * 2); }
        x.fill();
      }
      // legend
      const lg = [['H₂O', 'rgba(120,200,255,.9)', 2], ['Na⁺', '#ffb547', 3], ['Cl⁻', '#2fe39a', 3.8]];
      x.textAlign = 'left';
      lg.forEach(([t, col, rr], i) => {
        const lx = w - 150 + i * 50, ly = h - 8;
        x.beginPath(); x.fillStyle = col; x.arc(lx, ly - 3, rr, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#a9b4c8'; x.fillText(t, lx + 7, ly);
      });
      requestAnimationFrame(step);
    }
    resize();
    new IntersectionObserver(([e]) => { const was = running; running = e.isIntersecting; if (running && !was) { resize(); step(); } }).observe(c);
    step();
    return { set, resize };
  })();

  /* --------------------------------------------------------------- init */
  syncInputs();
  update();
  // charts need layout; redraw once fonts/layout settle
  window.addEventListener('load', () => { drawCurve(); micro.resize(); });
})();
