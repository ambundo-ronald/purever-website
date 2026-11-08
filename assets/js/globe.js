/* ==========================================================================
   PUREVER — Interactive partner-network globe (d3-geo orthographic)
   ========================================================================== */
(function () {
  const cv = document.getElementById('globe');
  if (!cv) return;
  const hubs = window.PV_HUBS || [];
  const ctx = cv.getContext('2d');

  if (!window.d3 || !window.topojson) {
    cv.style.display = 'none';
    return;
  }

  let W, H, R, dpr, proj, path;
  let rot = [10, -25, 0];
  let target = null, dragging = false, last = null, auto = true, autoTimer;
  let landDots = [], land = null, running = true, active = 0;
  const hq = hubs.find(h => h.hq) || hubs[0];

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.min(W, H) * 0.40;
    proj = d3.geoOrthographic().scale(R).translate([W / 2, H / 2]).clipAngle(90).rotate(rot);
    path = d3.geoPath(proj, ctx);
  }

  // Build land dot grid once (spaced evenly on the sphere)
  function buildDots() {
    const dots = [];
    const step = 1.9;
    for (let lat = -84; lat <= 84; lat += step) {
      const n = Math.max(1, Math.round((360 / step) * Math.cos(lat * Math.PI / 180)));
      for (let i = 0; i < n; i++) {
        const lon = -180 + (i * 360) / n;
        if (d3.geoContains(land, [lon, lat])) dots.push([lon, lat]);
      }
    }
    return dots;
  }

  function visible(p) {
    const c = [-rot[0], -rot[1]];
    return d3.geoDistance(p, c) < Math.PI / 2;
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    proj.rotate(rot);

    // sphere (printed-map look)
    const sg = ctx.createRadialGradient(W / 2 - R * 0.35, H / 2 - R * 0.4, R * 0.1, W / 2, H / 2, R);
    sg.addColorStop(0, '#ffffff'); sg.addColorStop(1, '#e3e6ea');
    ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = sg; ctx.fill();
    ctx.strokeStyle = '#c9ced5'; ctx.lineWidth = 1; ctx.stroke();

    // graticule
    ctx.beginPath(); path(d3.geoGraticule10()); ctx.strokeStyle = 'rgba(15,23,34,.07)'; ctx.lineWidth = .6; ctx.stroke();

    // land dots
    ctx.fillStyle = 'rgba(15,23,34,.42)';
    const ds = Math.max(1, R / 230);
    for (const d of landDots) {
      if (!visible(d)) continue;
      const p = proj(d);
      ctx.fillRect(p[0] - ds / 2, p[1] - ds / 2, ds, ds);
    }

    // arcs from HQ
    hubs.forEach((h, i) => {
      if (h === hq) return;
      const a = [hq.lon, hq.lat], b = [h.lon, h.lat];
      const interp = d3.geoInterpolate(a, b);
      const dist = d3.geoDistance(a, b);
      const N = 48;
      ctx.beginPath();
      let pen = false;
      for (let k = 0; k <= N; k++) {
        const pt = interp(k / N);
        if (!visible(pt)) { pen = false; continue; }
        const p = proj(pt);
        // lift arc above surface
        const lift = 1 + Math.sin((k / N) * Math.PI) * dist * 0.12;
        const x = W / 2 + (p[0] - W / 2) * lift, y = H / 2 + (p[1] - H / 2) * lift;
        pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true;
      }
      ctx.strokeStyle = i === active ? '#0050c8' : 'rgba(0,80,200,.35)';
      ctx.lineWidth = i === active ? 2 : 1.1;
      ctx.stroke();
      // travelling pulse
      const k = ((t / 2400 + i * 0.13) % 1);
      const pt = interp(k);
      if (visible(pt)) {
        const p = proj(pt);
        const lift = 1 + Math.sin(k * Math.PI) * dist * 0.12;
        ctx.beginPath(); ctx.arc(W / 2 + (p[0] - W / 2) * lift, H / 2 + (p[1] - H / 2) * lift, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#0050c8'; ctx.fill();
      }
    });

    // hubs
    hubs.forEach((h, i) => {
      const ll = [h.lon, h.lat];
      if (!visible(ll)) return;
      const p = proj(ll);
      const pulse = (t / 1400 + i * 0.2) % 1;
      ctx.beginPath(); ctx.arc(p[0], p[1], 4 + pulse * 14, 0, Math.PI * 2);
      ctx.strokeStyle = h.hq ? `rgba(0,163,224,${1 - pulse})` : `rgba(0,80,200,${0.7 - pulse * 0.7})`; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(p[0], p[1], h.hq ? 5 : 3.6, 0, Math.PI * 2);
      ctx.fillStyle = h.hq ? '#00a3e0' : '#0050c8'; ctx.fill();
      if (i === active || h.hq) {
        ctx.font = '600 12px Archivo, sans-serif';
        const label = h.hq ? `${h.n} · HQ` : h.n;
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = '#0f1722';
        ctx.fillRect(p[0] + 10, p[1] - 22, tw + 14, 22);
        ctx.fillStyle = '#fff'; ctx.fillText(label, p[0] + 17, p[1] - 7);
      }
    });
  }

  function loop(t) {
    if (!running) return;
    if (target) {
      const dx = ((target[0] - rot[0] + 540) % 360) - 180;
      const dy = target[1] - rot[1];
      rot[0] += dx * 0.08; rot[1] += dy * 0.08;
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) target = null;
    } else if (auto && !dragging) {
      rot[0] += 0.12;
    }
    draw(t);
    requestAnimationFrame(loop);
  }

  // interactions
  cv.addEventListener('pointerdown', (e) => { dragging = true; last = [e.clientX, e.clientY]; target = null; auto = false; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const k = 75 / R;
    rot[0] += (e.clientX - last[0]) * k * 4.5 / 3;
    rot[1] = Math.max(-70, Math.min(70, rot[1] - (e.clientY - last[1]) * k * 4.5 / 3));
    last = [e.clientX, e.clientY];
  });
  const end = () => { dragging = false; clearTimeout(autoTimer); autoTimer = setTimeout(() => auto = true, 3500); };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

  function focus(i) {
    active = i;
    const h = hubs[i];
    target = [-h.lon, -h.lat * 0.8];
    auto = false; clearTimeout(autoTimer); autoTimer = setTimeout(() => auto = true, 6000);
    document.querySelectorAll('.hub').forEach(b => b.classList.toggle('active', +b.dataset.i === i));
  }
  document.getElementById('hubList').addEventListener('click', (e) => {
    const b = e.target.closest('.hub'); if (b) focus(+b.dataset.i);
  });

  resize();
  window.addEventListener('resize', () => { clearTimeout(resize._t); resize._t = setTimeout(resize, 150); });

  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json')
    .then(r => r.json())
    .then(topo => {
      land = topojson.feature(topo, topo.objects.land);
      landDots = buildDots();
    })
    .catch(() => { /* globe still renders as sphere + hubs offline */ });

  new IntersectionObserver(([e]) => {
    const was = running; running = e.isIntersecting;
    if (running && !was) requestAnimationFrame(loop);
  }).observe(cv);
  requestAnimationFrame(loop);
})();
