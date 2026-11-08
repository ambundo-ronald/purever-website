/* ==========================================================================
   PUREVER — Parametric SVG product renders & illustrations
   Every product image is drawn in code so the site has no stock-photo
   dependency. To use real photography instead, set `img` on a product in
   main.js and that image will be used in place of the render.
   ========================================================================== */
(function () {
  let uid = 0;
  const id = (p) => `${p}${++uid}`;

  // ---- gradient helpers ----------------------------------------------------
  const cyl = (gid, dark, mid, light, vertical = true) => `
    <linearGradient id="${gid}" x1="0" y1="0" x2="${vertical ? 1 : 0}" y2="${vertical ? 0 : 1}">
      <stop offset="0" stop-color="${dark}"/>
      <stop offset=".22" stop-color="${light}"/>
      <stop offset=".42" stop-color="${mid}"/>
      <stop offset=".85" stop-color="${dark}"/>
      <stop offset="1" stop-color="${dark}"/>
    </linearGradient>`;
  const shadow = (cx, cy, rx, ry = 7) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#0a1630" opacity=".13" filter="url(#__BLUR__)"/>`;
  const blurDef = `<filter id="__BLUR__" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>`;
  const wrap = (vb, defs, body) => { const b = id("blur"); return (
    `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${blurDef}${defs}</defs>${body}</svg>`).split("__BLUR__").join(b); };
  const STEEL = ['#6f7a8b', '#c9d0da', '#ffffff'];
  const BLACK = ['#0d1117', '#2a303b', '#5a6272'];
  const NAVY = ['#0b1f4d', '#1a49a8', '#5aa0ff'];

  // ---- Brand label ---------------------------------------------------------
  const label = (x, y, w, h, text, sub, rot = 0) => `
    <g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#0b1f4d"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h * 0.22}" rx="3" fill="#19c3ff"/>
      <text x="${x + w / 2}" y="${y + h * 0.58}" font-family="Archivo,sans-serif" font-weight="800" font-size="${Math.min(w, h) * 0.2}" fill="#fff" text-anchor="middle" letter-spacing="1.5">${text}</text>
      ${sub ? `<text x="${x + w / 2}" y="${y + h * 0.84}" font-family="IBM Plex Mono,monospace" font-size="${Math.min(w, h) * 0.12}" fill="#9fdcff" text-anchor="middle">${sub}</text>` : ''}
    </g>`;

  // ---- Filter housing (slim / big blue) -----------------------------------
  function housing({ color = 'clear', big = false, tall = false } = {}) {
    const g = id('h'), gc = id('c'), gk = id('k');
    const W = big ? 120 : 92, cx = 100, x0 = cx - W / 2;
    const top = 70, bot = tall ? 268 : 232;
    const bowl = {
      clear: ['#7c8fc4', '#d6e0f7', '#ffffff'],
      blue: NAVY,
      white: ['#c3cad6', '#eef1f6', '#ffffff'],
      sky: ['#0f6fbf', '#2ea2ef', '#9be0ff'],
    }[color];
    const head = color === 'white' ? ['#c3cad6', '#eef1f6', '#ffffff'] : BLACK;
    const clear = color === 'clear';
    const ribs = Array.from({ length: 6 }, (_, i) => {
      const x = x0 + 10 + i * ((W - 20) / 5);
      return `<line x1="${x}" y1="${top + 30}" x2="${x}" y2="${bot - 16}" stroke="#fff" stroke-opacity="${clear ? .35 : .12}" stroke-width="2"/>`;
    }).join('');
    return wrap('0 0 200 290',
      cyl(g, ...bowl) + cyl(gc, '#cfd6e2', '#f4f6fa', '#ffffff') + cyl(gk, ...head),
      `${shadow(100, bot + 8, W * 0.55)}
      <rect x="${x0 - 22}" y="${top - 30}" width="${22}" height="22" rx="3" fill="url(#${gk})"/>
      <rect x="${x0 + W}" y="${top - 30}" width="${22}" height="22" rx="3" fill="url(#${gk})"/>
      <rect x="${x0 - 6}" y="${top - 44}" width="${W + 12}" height="44" rx="8" fill="url(#${gk})"/>
      <rect x="${cx - 18}" y="${top - 56}" width="36" height="14" rx="3" fill="url(#${gk})"/>
      <circle cx="${cx + 26}" cy="${top - 50}" r="5" fill="#e3342f"/>
      <rect x="${x0 - 4}" y="${top - 2}" width="${W + 8}" height="14" rx="4" fill="url(#${gk})"/>
      <path d="M${x0} ${top + 12} H${x0 + W} V${bot - 14} Q${x0 + W} ${bot} ${x0 + W - 14} ${bot} H${x0 + 14} Q${x0} ${bot} ${x0} ${bot - 14} Z" fill="url(#${g})" ${clear ? 'opacity=".55"' : ''}/>
      ${clear ? `<rect x="${cx - W * 0.3}" y="${top + 18}" width="${W * 0.6}" height="${bot - top - 40}" rx="6" fill="url(#${gc})"/>
        ${label(cx - W * 0.22, top + 50, W * 0.44, 56, 'PV', '5µm')}
        <path d="M${x0} ${top + 12} H${x0 + W} V${bot - 14} Q${x0 + W} ${bot} ${x0 + W - 14} ${bot} H${x0 + 14} Q${x0} ${bot} ${x0} ${bot - 14} Z" fill="url(#${g})" opacity=".35"/>` : ''}
      ${ribs}
      <rect x="${x0 + 8}" y="${top + 14}" width="${W * 0.08}" height="${bot - top - 36}" rx="3" fill="#fff" opacity=".35"/>`);
  }

  // ---- Cartridge ----------------------------------------------------------
  function cartridge({ kind = 'pp', size = 'std' } = {}) {
    const g = id('ct'), gp = id('pt');
    const tall = size === 'jumbo';
    const W = size === 'big' ? 96 : 66, x0 = 100 - W / 2, top = tall ? 14 : 30, bot = tall ? 272 : 256;
    const pal = {
      pp: ['#c8ced9', '#f1f3f7', '#ffffff'],
      carbon: ['#1c2128', '#3b424d', '#6c7482'],
      pleated: ['#c8ced9', '#f4f6f9', '#ffffff'],
      string: ['#d6d9df', '#f5f2ea', '#ffffff'],
    }[kind];
    let tex = '';
    if (kind === 'pp' || kind === 'carbon') {
      for (let y = top + 8; y < bot - 8; y += 5) tex += `<line x1="${x0}" y1="${y}" x2="${x0 + W}" y2="${y}" stroke="${kind === 'carbon' ? '#000' : '#a9b2c2'}" stroke-opacity=".18" stroke-width="1"/>`;
    }
    if (kind === 'pleated') {
      for (let x = x0 + 4; x < x0 + W - 2; x += 5) tex += `<line x1="${x}" y1="${top + 14}" x2="${x}" y2="${bot - 14}" stroke="#8e98aa" stroke-opacity=".35" stroke-width="1.6"/>`;
    }
    if (kind === 'string') {
      for (let y = top + 10; y < bot - 10; y += 7) {
        tex += `<path d="M${x0} ${y} L${x0 + W} ${y + 6}" stroke="#bdb39b" stroke-opacity=".55" stroke-width="1.5"/>`;
        tex += `<path d="M${x0} ${y + 6} L${x0 + W} ${y}" stroke="#bdb39b" stroke-opacity=".35" stroke-width="1.5"/>`;
      }
    }
    const cap = kind === 'pleated' ? '#1a74d6' : (kind === 'carbon' ? '#9aa3b2' : '#e6eaf0');
    return wrap('0 0 200 290', cyl(g, ...pal) + cyl(gp, '#000', '#000', '#fff'),
      `${shadow(100, bot + 8, W * 0.6)}
      <rect x="${x0}" y="${top}" width="${W}" height="${bot - top}" rx="6" fill="url(#${g})"/>
      ${tex}
      <rect x="${x0 - 2}" y="${top}" width="${W + 4}" height="12" rx="4" fill="${cap}"/>
      <rect x="${x0 - 2}" y="${bot - 12}" width="${W + 4}" height="12" rx="4" fill="${cap}"/>
      <ellipse cx="100" cy="${top}" rx="${W / 2}" ry="6" fill="${cap}"/>
      <ellipse cx="100" cy="${top}" rx="${W * 0.16}" ry="3" fill="#7d8798"/>
      ${kind !== 'pleated' ? label(x0 + W * 0.12, top + (bot - top) * 0.32, W * 0.76, Math.min(92, W * 1.15), 'PUREVER', { pp: 'PP 5µm', carbon: 'CTO 10µm', string: 'SW 10µm' }[kind]) : label(x0 + W * 0.12, top + (bot - top) * 0.36, W * 0.76, 40, 'PV', 'PLEAT')}
      <rect x="${x0 + 6}" y="${top + 12}" width="${W * 0.1}" height="${bot - top - 24}" fill="#fff" opacity=".25"/>`);
  }

  // ---- RO membrane element (horizontal) ------------------------------------
  function membrane({ type = 'BW' } = {}) {
    const g = id('m'), ge = id('me');
    const body = type === 'SW' ? ['#0b1f4d', '#1d4fa8', '#6fb3ff'] : ['#0d5f86', '#19a6e0', '#a5ecff'];
    return wrap('0 0 300 200', cyl(g, ...body, false) + cyl(ge, '#3a4252', '#7b8494', '#c8ced9', false),
      `${shadow(150, 150, 130)}
      <rect x="22" y="72" width="256" height="64" rx="10" fill="url(#${g})"/>
      <rect x="14" y="68" width="18" height="72" rx="5" fill="url(#${ge})"/>
      <rect x="268" y="68" width="18" height="72" rx="5" fill="url(#${ge})"/>
      <rect x="286" y="96" width="10" height="16" rx="2" fill="#2a303b"/>
      <rect x="4" y="96" width="10" height="16" rx="2" fill="#2a303b"/>
      ${Array.from({ length: 9 }, (_, i) => `<line x1="${48 + i * 25}" y1="74" x2="${40 + i * 25}" y2="134" stroke="#fff" stroke-opacity=".12" stroke-width="5"/>`).join('')}
      <rect x="110" y="80" width="80" height="48" rx="4" fill="#fff" opacity=".95"/>
      <text x="150" y="99" font-family="Archivo,sans-serif" font-weight="800" font-size="11" fill="#0b1f4d" text-anchor="middle" letter-spacing="1.2">PUREVER</text>
      <text x="150" y="112" font-family="IBM Plex Mono,monospace" font-size="7.5" fill="#1a74d6" text-anchor="middle">HydraCore ${type}-8040</text>
      <rect x="120" y="117" width="60" height="4" rx="2" fill="#19c3ff"/>
      <rect x="30" y="78" width="240" height="8" rx="4" fill="#fff" opacity=".22"/>`);
  }

  // ---- FRP pressure vessel (horizontal on stands) -------------------------
  function vesselFRP() {
    const g = id('v'), ge = id('ve');
    return wrap('0 0 300 200', cyl(g, '#c3cad6', '#eef1f6', '#ffffff', false) + cyl(ge, '#3c4452', '#6b7484', '#a7b0bf', false),
      `${shadow(150, 168, 130)}
      <rect x="62" y="130" width="10" height="36" fill="#2a303b"/><rect x="226" y="130" width="10" height="36" fill="#2a303b"/>
      <rect x="50" y="160" width="34" height="6" rx="2" fill="#2a303b"/><rect x="214" y="160" width="34" height="6" rx="2" fill="#2a303b"/>
      <rect x="30" y="74" width="240" height="64" rx="8" fill="url(#${g})"/>
      <rect x="16" y="70" width="24" height="72" rx="8" fill="url(#${ge})"/>
      <rect x="260" y="70" width="24" height="72" rx="8" fill="url(#${ge})"/>
      <rect x="6" y="98" width="12" height="16" rx="2" fill="#2a303b"/><rect x="282" y="98" width="12" height="16" rx="2" fill="#2a303b"/>
      <rect x="40" y="60" width="12" height="14" rx="2" fill="#2a303b"/><rect x="248" y="138" width="12" height="14" rx="2" fill="#2a303b"/>
      <rect x="40" y="82" width="220" height="7" rx="3" fill="#fff" opacity=".7"/>
      ${label(120, 92, 60, 36, 'PUREVER', 'FRP 300psi')}`);
  }

  // ---- Stainless multi-cartridge / bag housing (vertical) ------------------
  function ssHousing() {
    const g = id('s'), gl = id('sl');
    return wrap('0 0 200 290', cyl(g, ...STEEL) + cyl(gl, '#5b6574', '#b8c0cc', '#ffffff'),
      `${shadow(100, 272, 54)}
      <path d="M80 250 L70 274 M120 250 L130 274 M100 252 L100 276" stroke="#8892a2" stroke-width="4"/>
      <rect x="66" y="58" width="68" height="196" rx="8" fill="url(#${g})"/>
      <ellipse cx="100" cy="58" rx="40" ry="10" fill="url(#${gl})"/>
      <rect x="58" y="46" width="84" height="16" rx="4" fill="url(#${gl})"/>
      <path d="M78 46 Q100 18 122 46" fill="url(#${gl})"/>
      <rect x="96" y="14" width="8" height="12" rx="2" fill="#8892a2"/>
      <rect x="40" y="80" width="28" height="14" rx="3" fill="url(#${gl})"/>
      <rect x="132" y="210" width="28" height="14" rx="3" fill="url(#${gl})"/>
      <rect x="76" y="70" width="8" height="170" rx="4" fill="#fff" opacity=".75"/>
      <circle cx="122" cy="98" r="11" fill="#fff" stroke="#8892a2" stroke-width="3"/>
      <path d="M122 98 L128 92" stroke="#e3342f" stroke-width="2"/>
      <text x="100" y="170" font-family="Archivo,sans-serif" font-weight="800" font-size="10" fill="#2a303b" text-anchor="middle" letter-spacing="1.5" opacity=".75">PUREVER</text>`);
  }

  // ---- UV steriliser (horizontal stainless) --------------------------------
  function uv() {
    const g = id('u'), gl = id('ul');
    return wrap('0 0 300 200', cyl(g, ...STEEL, false) + cyl(gl, '#5b6574', '#b8c0cc', '#ffffff', false),
      `${shadow(150, 160, 120)}
      <path d="M78 136 L66 158 H96 L90 136 M212 136 L206 158 H236 L224 136" fill="#9aa3b2"/>
      <rect x="40" y="80" width="214" height="58" rx="10" fill="url(#${g})"/>
      <rect x="248" y="74" width="16" height="70" rx="5" fill="url(#${gl})"/>
      <rect x="262" y="96" width="24" height="24" rx="4" fill="url(#${gl})"/>
      <rect x="30" y="74" width="14" height="70" rx="5" fill="url(#${gl})"/>
      <rect x="86" y="62" width="16" height="20" rx="3" fill="url(#${gl})"/>
      <rect x="190" y="62" width="16" height="20" rx="3" fill="url(#${gl})"/>
      <rect x="92" y="54" width="4" height="10" fill="#2a303b"/>
      <rect x="50" y="88" width="196" height="8" rx="4" fill="#fff" opacity=".85"/>
      <rect x="282" y="102" width="12" height="12" rx="2" fill="#7f3fff" class="uv-glow" opacity=".7"/>
      <text x="147" y="122" font-family="Archivo,sans-serif" font-weight="800" font-size="11" fill="#2a303b" text-anchor="middle" letter-spacing="2" opacity=".7">PUREVER UV</text>`);
  }

  // ---- Variable area flow meter (rotameter) --------------------------------
  function rotameter() {
    const gt = id('rt'), gb = id('rb');
    let scale = '';
    for (let i = 0; i <= 10; i++) {
      const y = 70 + i * 15;
      scale += `<line x1="104" y1="${y}" x2="${i % 2 ? 110 : 114}" y2="${y}" stroke="#e3342f" stroke-width="1.2"/>`;
      if (i % 2 === 0) scale += `<text x="118" y="${y + 3}" font-family="IBM Plex Mono,monospace" font-size="7" fill="#e3342f">${100 - i * 10}</text>`;
    }
    return wrap('0 0 200 290', cyl(gt, '#9fb0cc', '#eaf0fa', '#ffffff') + cyl(gb, ...BLACK),
      `${shadow(100, 270, 40)}
      <rect x="80" y="22" width="40" height="36" rx="6" fill="url(#${gb})"/>
      <rect x="70" y="30" width="60" height="10" rx="3" fill="url(#${gb})"/>
      <rect x="84" y="56" width="32" height="180" rx="3" fill="url(#${gt})" opacity=".75"/>
      ${scale}
      <path d="M92 118 L108 118 L104 132 L96 132 Z" fill="#e3342f"/>
      <line x1="100" y1="62" x2="100" y2="232" stroke="#8a96ad" stroke-width="1"/>
      <rect x="80" y="234" width="40" height="36" rx="6" fill="url(#${gb})"/>
      <rect x="70" y="252" width="60" height="10" rx="3" fill="url(#${gb})"/>
      <rect x="88" y="60" width="5" height="172" fill="#fff" opacity=".7"/>`);
  }

  // ---- Pressure gauge ------------------------------------------------------
  function gauge() {
    const gr = id('gr'), gf = id('gf');
    let ticks = '';
    for (let i = 0; i <= 40; i++) {
      const a = (-225 + i * (270 / 40)) * Math.PI / 180;
      const r1 = i % 5 ? 64 : 58, r2 = 70;
      ticks += `<line x1="${100 + Math.cos(a) * r1}" y1="${120 + Math.sin(a) * r1}" x2="${100 + Math.cos(a) * r2}" y2="${120 + Math.sin(a) * r2}" stroke="#0b1f4d" stroke-width="${i % 5 ? 1 : 2}"/>`;
      if (i % 10 === 0) ticks += `<text x="${100 + Math.cos(a) * 46}" y="${123 + Math.sin(a) * 46}" font-family="IBM Plex Mono,monospace" font-size="9" fill="#0b1f4d" text-anchor="middle">${i * 2.5}</text>`;
    }
    const arc = (r, a0, a1) => {
      const p = (a) => [100 + Math.cos(a * Math.PI / 180) * r, 120 + Math.sin(a * Math.PI / 180) * r];
      const [x0, y0] = p(a0), [x1, y1] = p(a1);
      return `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`;
    };
    return wrap('0 0 200 290',
      `<radialGradient id="${gf}" cx=".4" cy=".35"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e3e8f0"/></radialGradient>` + cyl(gr, ...STEEL),
      `${shadow(100, 272, 40)}
      <rect x="90" y="196" width="20" height="30" fill="url(#${gr})"/>
      <path d="M86 226 h28 l-4 10 h-20 z" fill="#c4a35a"/>
      <rect x="92" y="236" width="16" height="30" fill="#c4a35a"/>
      ${Array.from({ length: 6 }, (_, i) => `<line x1="92" y1="${240 + i * 4.5}" x2="108" y2="${242 + i * 4.5}" stroke="#8f7535" stroke-width="1"/>`).join('')}
      <circle cx="100" cy="120" r="86" fill="url(#${gr})"/>
      <circle cx="100" cy="120" r="78" fill="url(#${gf})"/>
      <path d="${arc(74, 135 - 10, 135 + 10 + 40)}" stroke="#19c3ff" stroke-width="6" fill="none" opacity=".0"/>
      <path d="${arc(73, 20, 45)}" stroke="#e3342f" stroke-width="5" fill="none"/>
      ${ticks}
      <text x="100" y="160" font-family="Archivo,sans-serif" font-weight="800" font-size="9" fill="#0b1f4d" text-anchor="middle" letter-spacing="1.5">PUREVER</text>
      <text x="100" y="172" font-family="IBM Plex Mono,monospace" font-size="8" fill="#5b6b88" text-anchor="middle">bar · glycerine</text>
      <line x1="100" y1="120" x2="${100 + Math.cos(-60 * Math.PI / 180) * 62}" y2="${120 + Math.sin(-60 * Math.PI / 180) * 62}" stroke="#0b1f4d" stroke-width="3" stroke-linecap="round"/>
      <circle cx="100" cy="120" r="7" fill="#0b1f4d"/>
      <path d="M40 80 Q70 48 120 46" stroke="#fff" stroke-width="8" fill="none" opacity=".7" stroke-linecap="round"/>`);
  }

  // ---- Pressure switch -----------------------------------------------------
  function pswitch() {
    const gb = id('pb'), gbr = id('pbr');
    return wrap('0 0 200 290', cyl(gb, '#b9c1cd', '#eef1f5', '#ffffff') + cyl(gbr, '#7a5d22', '#d0aa55', '#ffe7a8'),
      `${shadow(100, 262, 60)}
      <path d="M88 70 h24 v-14 h-6 v-10 l6-6 h-24 l6 6 v10 h-6z" fill="url(#${gbr})"/>
      <rect x="40" y="70" width="120" height="180" rx="8" fill="url(#${gb})"/>
      <rect x="50" y="84" width="100" height="40" rx="4" fill="#0b1f4d"/>
      <path d="M64 96 l10 18 h-6 l6 0 M86 96 h18" stroke="#19c3ff" stroke-width="2.5" fill="none"/>
      <text x="100" y="146" font-family="Archivo,sans-serif" font-weight="800" font-size="10" fill="#0b1f4d" text-anchor="middle" letter-spacing="1.5">PUREVER</text>
      <rect x="62" y="160" width="76" height="70" rx="4" fill="#dfe4ec" stroke="#b9c1cd"/>
      ${Array.from({ length: 6 }, (_, i) => `<line x1="72" y1="${172 + i * 10}" x2="${96 + (i % 3) * 10}" y2="${172 + i * 10}" stroke="#5b6b88" stroke-width="1.2"/>`).join('')}
      <rect x="112" y="172" width="16" height="44" rx="2" fill="#2a303b"/>
      <rect x="114" y="${180}" width="12" height="8" fill="#19c3ff"/>`);
  }

  // ---- Domestic under-sink RO ---------------------------------------------
  function domesticRO() {
    const gw = id('dw'), gc = id('dc'), gt = id('dt'), gm = id('dm');
    const can = (x) => `<rect x="${x}" y="110" width="38" height="110" rx="6" fill="url(#${gc})" opacity=".85"/>
      <rect x="${x - 3}" y="98" width="44" height="16" rx="4" fill="url(#${gw})"/>
      <rect x="${x + 9}" y="124" width="20" height="82" rx="3" fill="#fff" opacity=".9"/>`;
    return wrap('0 0 300 260',
      cyl(gw, '#c3cad6', '#eef1f6', '#ffffff') + cyl(gc, '#7c8fc4', '#d6e0f7', '#ffffff') + cyl(gt, '#b9c1cd', '#eef1f5', '#ffffff') + cyl(gm, '#0d5f86', '#19a6e0', '#a5ecff', false),
      `${shadow(150, 236, 130)}
      <rect x="22" y="60" width="180" height="16" rx="4" fill="#e6eaf0" stroke="#c9d0da"/>
      <rect x="30" y="64" width="164" height="22" rx="4" fill="url(#${gm})"/>
      <text x="112" y="79" font-family="IBM Plex Mono,monospace" font-size="8" fill="#fff" text-anchor="middle">RO 75 GPD</text>
      <rect x="22" y="92" width="180" height="8" rx="3" fill="#dfe4ec"/>
      ${can(34)}${can(92)}${can(150)}
      <rect x="22" y="222" width="180" height="10" rx="3" fill="#dfe4ec"/>
      <rect x="212" y="96" width="70" height="130" rx="30" fill="url(#${gt})"/>
      <rect x="240" y="80" width="14" height="18" rx="3" fill="#0b1f4d"/>
      <text x="247" y="170" font-family="Archivo,sans-serif" font-weight="800" font-size="9" fill="#0b1f4d" text-anchor="middle" letter-spacing="1">PUREVER</text>
      <path d="M247 80 V36 Q247 22 233 22 H130 Q118 22 118 34 V46" fill="none" stroke="#19c3ff" stroke-width="3"/>
      <path d="M60 98 V40 H100" fill="none" stroke="#8fb4ff" stroke-width="3"/>
      <rect x="110" y="40" width="16" height="10" rx="2" fill="#2a303b"/>`);
  }

  // ---- Industrial RO skid --------------------------------------------------
  function skid({ vessels = 4, cols = 2, compact = false } = {}) {
    const gv = id('kv'), gf = id('kf'), gp = id('kp'), gpn = id('kpn');
    let vs = '';
    const rows = Math.ceil(vessels / cols);
    for (let r = 0; r < rows; r++) {
      const y = 48 + r * 30;
      vs += `<rect x="40" y="${y}" width="200" height="22" rx="11" fill="url(#${gv})"/>
             <rect x="34" y="${y - 1}" width="12" height="24" rx="4" fill="#3c4452"/><rect x="234" y="${y - 1}" width="12" height="24" rx="4" fill="#3c4452"/>
             <rect x="46" y="${y + 3}" width="188" height="4" rx="2" fill="#fff" opacity=".55"/>`;
    }
    const baseY = 48 + rows * 30 + 6;
    return wrap('0 0 300 230',
      cyl(gv, '#c3cad6', '#eef1f6', '#ffffff', false) + cyl(gf, ...STEEL, false) + cyl(gp, '#0d3f86', '#1a74d6', '#8fc3ff') + cyl(gpn, '#c3cad6', '#eef1f6', '#ffffff'),
      `${shadow(150, 214, 140)}
      <rect x="22" y="30" width="6" height="${baseY - 20}" fill="url(#${gf})"/><rect x="252" y="30" width="6" height="${baseY - 20}" fill="url(#${gf})"/>
      <rect x="22" y="28" width="236" height="6" fill="url(#${gf})"/>
      ${vs}
      <rect x="14" y="${baseY}" width="272" height="10" rx="2" fill="url(#${gf})"/>
      <rect x="266" y="${Math.max(30, baseY - 140)}" width="0" height="0"/>
      <g transform="translate(40 ${baseY - 2})">
        <rect x="0" y="-40" width="56" height="40" rx="6" fill="url(#${gp})"/>
        <rect x="56" y="-32" width="40" height="24" rx="4" fill="#2a303b"/>
        <circle cx="28" cy="-20" r="8" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>
      </g>
      ${compact ? '' : `<g transform="translate(160 ${baseY - 2})">
        <rect x="0" y="-52" width="18" height="52" rx="4" fill="url(#${gpn})"/>
        <rect x="24" y="-52" width="18" height="52" rx="4" fill="url(#${gpn})"/>
        <rect x="48" y="-52" width="18" height="52" rx="4" fill="url(#${gpn})"/>
      </g>`}
      <rect x="262" y="70" width="34" height="${Math.max(60, baseY - 80)}" rx="3" fill="#e6eaf0" stroke="#c9d0da"/>
      <rect x="267" y="78" width="24" height="16" rx="2" fill="#0b1f4d"/>
      <rect x="270" y="82" width="10" height="3" fill="#19c3ff"/>
      <circle cx="272" cy="104" r="3" fill="#2fe39a"/><circle cx="282" cy="104" r="3" fill="#ffb547"/>
      <text x="140" y="22" font-family="Archivo,sans-serif" font-weight="800" font-size="10" fill="#0b1f4d" text-anchor="middle" letter-spacing="2" opacity=".6">PUREVER</text>`);
  }

  // ---- Containerised SWRO --------------------------------------------------
  function container() {
    const gc = id('cc'), gs = id('cs');
    let ribs = '';
    for (let x = 34; x < 266; x += 9) ribs += `<rect x="${x}" y="68" width="4" height="112" fill="#000" opacity=".08"/>`;
    return wrap('0 0 300 230',
      `<linearGradient id="${gc}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f6fa"/><stop offset="1" stop-color="#cfd6e2"/></linearGradient>
       <linearGradient id="${gs}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#19c3ff"/><stop offset="1" stop-color="#00e0b8"/></linearGradient>`,
      `${shadow(150, 196, 140)}
      <rect x="26" y="62" width="248" height="124" rx="3" fill="url(#${gc})" stroke="#b9c1cd"/>
      ${ribs}
      <rect x="26" y="62" width="248" height="8" fill="#b9c1cd"/><rect x="26" y="178" width="248" height="8" fill="#b9c1cd"/>
      <path d="M26 150 C 90 132, 160 168, 274 140 V186 H26 Z" fill="url(#${gs})" opacity=".9"/>
      <text x="56" y="112" font-family="Archivo,sans-serif" font-weight="800" font-size="22" fill="#0b1f4d" letter-spacing="3">PUREVER</text>
      <text x="58" y="130" font-family="IBM Plex Mono,monospace" font-size="9" fill="#5b6b88" letter-spacing="1">SWRO · CONTAINERISED DESALINATION</text>
      <rect x="226" y="80" width="38" height="56" rx="2" fill="#dfe4ec" stroke="#b9c1cd"/>
      <line x1="245" y1="80" x2="245" y2="136" stroke="#b9c1cd"/>
      <rect x="40" y="36" width="70" height="26" fill="#0b1f4d" rx="2"/>
      ${Array.from({ length: 6 }, (_, i) => `<rect x="${46 + i * 10}" y="40" width="6" height="18" fill="#19c3ff" opacity=".6"/>`).join('')}
      <rect x="150" y="44" width="16" height="18" fill="#9aa3b2"/><rect x="180" y="40" width="16" height="22" fill="#9aa3b2"/>`);
  }

  // ---- UF hollow fibre module ---------------------------------------------
  function uf() {
    const g = id('f'), ge = id('fe');
    let fibres = '';
    for (let x = 84; x < 116; x += 4) fibres += `<line x1="${x}" y1="58" x2="${x}" y2="232" stroke="#d9dee7" stroke-width="1"/>`;
    return wrap('0 0 200 290', cyl(g, '#c3cad6', '#f3f5f9', '#ffffff') + cyl(ge, ...BLACK),
      `${shadow(100, 272, 44)}
      <rect x="76" y="44" width="48" height="200" rx="4" fill="url(#${g})"/>
      ${fibres}
      <rect x="72" y="22" width="56" height="32" rx="6" fill="url(#${ge})"/>
      <rect x="72" y="234" width="56" height="32" rx="6" fill="url(#${ge})"/>
      <rect x="124" y="30" width="18" height="14" rx="2" fill="url(#${ge})"/>
      <rect x="58" y="244" width="18" height="14" rx="2" fill="url(#${ge})"/>
      <rect x="92" y="8" width="16" height="16" rx="2" fill="url(#${ge})"/>
      ${label(80, 110, 40, 60, 'PV', 'UF 0.01')}
      <rect x="80" y="52" width="6" height="180" fill="#fff" opacity=".6"/>`);
  }

  // ---- Dosing pump --------------------------------------------------------
  function dosing() {
    const gt = id('dt'), gp = id('dp');
    return wrap('0 0 200 290', cyl(gt, '#c3cad6', '#f3f5f9', '#ffffff') + cyl(gp, ...NAVY),
      `${shadow(100, 268, 60)}
      <rect x="54" y="120" width="92" height="144" rx="10" fill="url(#${gt})" opacity=".95"/>
      <rect x="62" y="170" width="76" height="88" rx="6" fill="#00e0b8" opacity=".25"/>
      <rect x="60" y="56" width="80" height="64" rx="8" fill="url(#${gp})"/>
      <rect x="70" y="66" width="44" height="22" rx="3" fill="#061230"/>
      <text x="92" y="81" font-family="IBM Plex Mono,monospace" font-size="10" fill="#19c3ff" text-anchor="middle">2.4</text>
      <circle cx="126" cy="77" r="7" fill="#fff" opacity=".85"/>
      <text x="100" y="108" font-family="Archivo,sans-serif" font-weight="800" font-size="9" fill="#fff" text-anchor="middle" letter-spacing="1.5">PUREVER</text>
      <path d="M140 80 h20 v40" stroke="#5a6272" stroke-width="3" fill="none"/>
      <text x="100" y="214" font-family="IBM Plex Mono,monospace" font-size="8" fill="#0b1f4d" text-anchor="middle">ANTISCALANT</text>`);
  }

  // ======================================================================
  // Line-art scenes for solution cards (dark backgrounds)
  // ======================================================================
  function scene(kind) {
    const glow = id('gl'), bg = id('bg');
    const L = (d, o = 1, w = 1.4) => `<path d="${d}" fill="none" stroke="#19c3ff" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const T = (d, o = 1) => `<path d="${d}" fill="none" stroke="#00e0b8" stroke-opacity="${o}" stroke-width="1.4" stroke-linecap="round"/>`;
    let grid = '';
    for (let i = 0; i < 12; i++) grid += `<line x1="${i * 30}" y1="0" x2="${i * 30}" y2="480" stroke="#fff" stroke-opacity=".04"/>`;
    for (let i = 0; i < 17; i++) grid += `<line x1="0" y1="${i * 30}" x2="320" y2="${i * 30}" stroke="#fff" stroke-opacity=".04"/>`;
    let art = '';
    if (kind === 'residential') {
      art = L('M60 150 H260') + L('M100 150 V120 Q100 92 128 92 H170 Q190 92 190 112 V122', 1, 2) + L('M186 122 h8')
        + L('M60 150 L80 230 H240 L260 150', .7) + L('M70 250 V380 H250 V250', .5)
        + L('M92 270 v80 M118 270 v80 M144 270 v80', .9) + L('M84 262 h70', .6) + L('M180 280 q20 -20 40 0 v70 q-20 12 -40 0z', .9)
        + T('M190 132 q2 14 0 18', .9) + `<circle cx="190" cy="160" r="3" fill="#00e0b8"/>`;
    } else if (kind === 'commercial') {
      art = L('M50 360 H270', .6) + L('M60 360 V140 M260 360 V140 M60 140 H260', .8);
      for (let i = 0; i < 3; i++) art += L(`M80 ${170 + i * 40} H240 a10 10 0 0 1 0 20 H80 a10 10 0 0 1 0 -20z`, .95);
      art += L('M90 330 h50 v-40 h-50z', .9) + L('M140 310 h30') + L('M200 300 v50 M215 300 v50 M230 300 v50', .7) + T('M40 110 H280', .5);
    } else if (kind === 'industrial') {
      for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) art += L(`M${40 + c * 128} ${130 + r * 34} h112 a9 9 0 0 1 0 18 h-112 a9 9 0 0 1 0 -18z`, .9);
      art += L('M30 110 H290 M30 110 V300 M290 110 V300 M20 300 H300', .6) + L('M60 360 h60 v-50 h-60z M120 335 h40', .9)
        + L('M190 360 h22 v-60 h-22z M222 360 h22 v-60 h-22z M254 360 h22 v-60 h-22z', .8) + T('M30 90 C 120 60, 200 120, 290 90', .5);
    } else {
      art = L('M40 250 h240 v90 h-240z', .95) + L('M60 260 v70 M80 260 v70 M100 260 v70 M120 260 v70 M140 260 v70 M160 260 v70 M180 260 v70 M200 260 v70 M220 260 v70 M240 260 v70 M260 260 v70', .25)
        + `<circle cx="230" cy="130" r="34" fill="none" stroke="#ffb547" stroke-opacity=".7" stroke-width="1.4"/>`
        + T('M0 380 q20 -10 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0', .9) + T('M0 400 q20 -10 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0', .6) + T('M0 420 q20 -10 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0', .35)
        + L('M60 250 v-30 h40 v30 M120 250 v-20 M150 250 v-24', .6);
    }
    return `<svg viewBox="0 0 320 480" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="${bg}" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#0f2a63"/><stop offset="1" stop-color="#040b1a"/></radialGradient>
        <filter id="${glow}"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="320" height="480" fill="url(#${bg})"/>${grid}<g filter="url(#${glow})">${art}</g></svg>`;
  }

  // Topographic contour art for project cards (seeded)
  function topo(seed = 1, hue = '#19c3ff') {
    let s = seed * 9301 + 49297;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const cx = 120 + rnd() * 160, cy = 80 + rnd() * 80;
    const k = [rnd() * 6, rnd() * 6, rnd() * 6];
    let paths = '';
    for (let r = 14; r < 320; r += 14) {
      let d = '';
      for (let a = 0; a <= 64; a++) {
        const t = (a / 64) * Math.PI * 2;
        const rr = r * (1 + 0.18 * Math.sin(3 * t + k[0]) + 0.1 * Math.sin(5 * t + k[1]) + 0.06 * Math.sin(2 * t + k[2] + r / 60));
        d += `${a ? 'L' : 'M'}${(cx + Math.cos(t) * rr * 1.3).toFixed(1)} ${(cy + Math.sin(t) * rr).toFixed(1)}`;
      }
      paths += `<path d="${d}Z" fill="none" stroke="${hue}" stroke-opacity="${Math.max(0.06, 0.55 - r / 600)}" stroke-width="1"/>`;
    }
    return `<svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="400" height="220" fill="#061230"/>${paths}
      <circle cx="${cx}" cy="${cy}" r="5" fill="${hue}"/><circle cx="${cx}" cy="${cy}" r="14" fill="none" stroke="${hue}" stroke-opacity=".5"/>
      <line x1="${cx}" y1="0" x2="${cx}" y2="220" stroke="#fff" stroke-opacity=".08" stroke-dasharray="3 4"/>
      <line x1="0" y1="${cy}" x2="400" y2="${cy}" stroke="#fff" stroke-opacity=".08" stroke-dasharray="3 4"/></svg>`;
  }

  window.PVRender = {
    housing, cartridge, membrane, vesselFRP, ssHousing, uv, rotameter, gauge, pswitch,
    domesticRO, skid, container, uf, dosing, scene, topo,
  };
})();
