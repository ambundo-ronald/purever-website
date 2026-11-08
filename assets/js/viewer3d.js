/* ==========================================================================
   PUREVER 3D — Interactive RO system configurator (Three.js r147)
   Procedurally modelled machines: every component is a pickable group with
   engineering metadata, explode vectors and hotspot anchors.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ data */
  const MODELS = {
    c500: {
      sku: 'PV-C 500', name: '500 LPH Commercial RO', cap: '500', unit: 'L/h',
      desc: 'A compact, plug-and-play skid for clinics, restaurants, offices and water refilling stations.',
      kv: [['Permeate', '500 L/h'], ['Recovery', '50–65%'], ['Membranes', '2 × 4040'], ['HP pump', '1.1 kW'], ['Feed TDS', '≤ 2,000 mg/L'], ['Footprint', '1.2 × 0.65 m']],
      cfg: { L: 1.2, W: 0.65, H: 1.6, vessels: 2, el: '4040', housings: 2, kw: 1.1, uv: false, hmi: '4.3"' },
    },
    c1000: {
      sku: 'PV-C 1000', name: '1000 LPH Commercial RO', cap: '1,000', unit: 'L/h',
      desc: 'Hotel, hospital and bottling-grade RO with dual pre-filtration, UV polishing and PLC control.',
      kv: [['Permeate', '1,000 L/h'], ['Recovery', '55–70%'], ['Membranes', '3 × 4040'], ['HP pump', '2.2 kW'], ['Feed TDS', '≤ 3,000 mg/L'], ['Footprint', '1.5 × 0.7 m']],
      cfg: { L: 1.5, W: 0.7, H: 1.7, vessels: 3, el: '4040', housings: 2, kw: 2.2, uv: true, hmi: '7"' },
    },
    c2000: {
      sku: 'PV-C 2000', name: '2000 LPH Industrial RO', cap: '2,000', unit: 'L/h',
      desc: 'Continuous-duty industrial RO with an 8" membrane array, SS316 cartridge housing and a VFD-driven pump.',
      kv: [['Permeate', '2,000 L/h'], ['Recovery', '65–75%'], ['Membranes', '3 × 8040'], ['HP pump', '4.0 kW VFD'], ['Feed TDS', '≤ 5,000 mg/L'], ['Footprint', '1.9 × 0.85 m']],
      cfg: { L: 1.9, W: 0.85, H: 1.9, vessels: 3, el: '8040', housings: 'ss', kw: 4, uv: true, hmi: '10"' },
    },
    swro: {
      sku: 'PV-SWRO 100', name: 'Containerised Desalination', cap: '100', unit: 'm³/day',
      desc: 'A complete seawater RO plant in an insulated 20 ft ISO container, with media filtration, isobaric energy recovery, CIP and dosing.',
      kv: [['Permeate', '100 m³/day'], ['Recovery', '40–45%'], ['Membranes', '4 × SW-8040'], ['Energy', '≈ 3.0 kWh/m³'], ['Feed TDS', '≤ 45,000 mg/L'], ['Container', "20' ISO, insulated"]],
      cfg: { container: true },
    },
  };

  /* ------------------------------------------------------------------ boot */
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(() => {
    document.querySelectorAll('[data-pv3d]').forEach(el => {
      if (!window.THREE || !THREE.OrbitControls) {
        const l = el.querySelector('.v-loading');
        if (l) l.innerHTML = '3D viewer needs an internet connection to load.';
        return;
      }
      const sc = el.dataset.pv3d === 'showcase';
      el.__pv = new Viewer(el, { mini: el.dataset.pv3d === 'mini' || sc, showcase: sc, model: el.dataset.model });
    });
  });

  /* ======================================================================
     Viewer
     ====================================================================== */
  class Viewer {
    constructor(stage, opts) {
      const T = THREE;
      if (T.ColorManagement) T.ColorManagement.legacyMode = false;
      this.stage = stage; this.mini = opts.mini; this.showcase = !!opts.showcase;
      this.$ = (id) => document.getElementById(id);
      const q = new URLSearchParams(location.search).get('model');
      this.modelKey = (!this.mini && MODELS[q]) ? q : (opts.model || 'c1000');
      const qs = new URLSearchParams(location.search);
      this.state = { explode: !this.mini && qs.get('explode') === '1', flow: false, rotate: this.mini, labels: !this.mini, walls: 'cut', dims: !this.mini };
      this.renderMode = qs.get('render') === '1';
      if (this.renderMode) Object.assign(this.state, { labels: false, dims: false, rotate: false });
      this.selected = null; this.hovered = null; this.tween = null;

      // renderer
      const r = this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: false });
      r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      r.outputEncoding = T.sRGBEncoding;
      r.toneMapping = T.ACESFilmicToneMapping;
      r.toneMappingExposure = 1.0;
      r.shadowMap.enabled = true;
      r.shadowMap.type = T.PCFSoftShadowMap;
      stage.insertBefore(r.domElement, stage.firstChild);

      this.scene = new T.Scene();
      const pm = new T.PMREMGenerator(r);
      this.scene.environment = pm.fromScene(new T.RoomEnvironment(), 0.03).texture;

      this.camera = new T.PerspectiveCamera(38, 1, 0.05, 200);
      this.controls = new T.OrbitControls(this.camera, r.domElement);
      Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, screenSpacePanning: true, maxPolarAngle: Math.PI * 0.495, autoRotateSpeed: 0.9 });
      this.controls.autoRotate = this.state.rotate;
      if (this.mini) { this.controls.enableZoom = false; this.controls.enablePan = false; }
      this.controls.addEventListener('start', () => { this.tween = null; });

      // studio lighting: soft key, cool fill, warm bounce
      this.scene.add(new T.HemisphereLight(0xffffff, 0xd8d4cc, 0.55));
      const sun = this.sun = new T.DirectionalLight(0xfffaf2, 1.7);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.bias = -0.0004;
      sun.shadow.radius = 6;
      this.scene.add(sun, sun.target);
      const fill = new T.DirectionalLight(0xe8f0ff, 0.45); fill.position.set(-6, 3, 4); this.scene.add(fill);
      const back = new T.DirectionalLight(0xffffff, 0.5); back.position.set(-3, 5, -7); this.scene.add(back);

      // studio floor: soft contact shadows + a fine technical-drawing grid that fades out
      const shadowFloor = new T.Mesh(new T.PlaneGeometry(60, 60), new T.ShadowMaterial({ color: 0x1b2333, opacity: (opts.showcase ? 0.55 : 0.2) }));
      shadowFloor.rotation.x = -Math.PI / 2; shadowFloor.receiveShadow = true; this.scene.add(shadowFloor);
      this.gridMat = new T.ShaderMaterial({
        uniforms: { uScale: { value: 0.25 }, uFade: { value: 6.0 } },
        vertexShader: 'varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: 'uniform float uScale; uniform float uFade; varying vec3 vP;' +
          'float line(vec2 p, float s){ vec2 g = abs(fract(p / s - 0.5) - 0.5) / fwidth(p / s); return 1.0 - min(min(g.x, g.y), 1.0); }' +
          'void main(){ float minor = line(vP.xz, uScale) * 0.35; float major = line(vP.xz, uScale * 5.0);' +
          ' float d = length(vP.xz); float fade = 1.0 - smoothstep(uFade * 0.35, uFade, d);' +
          ' float a = max(minor, major) * fade * 0.38; if (a < 0.01) discard; gl_FragColor = vec4(vec3(0.42, 0.46, 0.52), a); }',
        transparent: true, depthWrite: false, extensions: { derivatives: true },
      });
      const gridPlane = new T.Mesh(new T.PlaneGeometry(60, 60), this.gridMat);
      gridPlane.rotation.x = -Math.PI / 2; gridPlane.position.y = 0.001; this.scene.add(gridPlane);
      if (this.renderMode) gridPlane.visible = false;
      if (opts.showcase) { gridPlane.visible = false; this.controls.autoRotateSpeed = 0.6; }

      // helpers
      this.selBox = new T.Box3Helper(new T.Box3(), new T.Color(0x0098d6)); this.selBox.visible = false; this.scene.add(this.selBox);
      this.hovBox = new T.Box3Helper(new T.Box3(), new T.Color(0x6b7a90)); this.hovBox.visible = false; this.scene.add(this.hovBox);
      this.raycaster = new T.Raycaster(); this.pointer = new T.Vector2();
      this.clock = new T.Clock();

      if (!this.mini) this.bindUI();
      this.bindPointer();
      this.load(this.modelKey, true);

      // size & loop
      const ro = new ResizeObserver(() => this.resize()); ro.observe(stage); this.resize();
      this.visible = true;
      new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }).observe(stage);
      const loop = () => { requestAnimationFrame(loop); if (this.visible && !document.hidden) this.frame(); };
      loop();
      const ld = stage.querySelector('.v-loading'); if (ld) ld.remove();
    }

    resize() {
      const w = this.stage.clientWidth, h = this.stage.clientHeight;
      if (!w || !h) return;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    }

    /* ------------------------------------------------------------ model load */
    load(key, instant) {
      const T = THREE;
      if (this.root) { this.scene.remove(this.root); this.disposeBuild(); }
      this.modelKey = key;
      const M = MODELS[key];
      const kit = new Kit();
      this.kit = kit;
      const root = this.root = new T.Group();
      const build = M.cfg.container ? buildContainer(kit, root) : buildSkid(kit, root, M.cfg, M);
      this.comps = build.comps;
      this.explodables = build.explodables;
      this.walls = build.walls || null;
      this.scene.add(root);
      root.updateMatrixWorld(true);

      // anchors for hotspots
      const box = new T.Box3();
      this.comps.forEach((c, i) => {
        c.no = i + 1;
        let first = c.pin || null; if (!first) c.group.traverse(o => { if (!first && o.isMesh && !o.userData.noPick) first = o; });
        box.setFromObject(first || c.group);
        const ctr = box.getCenter(new T.Vector3());
        c.anchorObj = first || c.group;
        c.anchorLocal = c.anchorObj.worldToLocal(new T.Vector3(ctr.x, box.max.y + 0.04, ctr.z));
      });
      this.explodables.forEach(e => { e.base = e.obj.position.clone(); });

      // camera framing
      const bb = new T.Box3().setFromObject(root);
      const size = bb.getSize(new T.Vector3()), ctr = bb.getCenter(new T.Vector3());
      const md = Math.max(size.x, size.y, size.z);
      const dist = md * (M.cfg.container ? 1.45 : 1.75) * (this.showcase ? (M.cfg.container ? 0.88 : 1.0) : this.mini ? 1.05 : 1);
      this.home = {
        target: new T.Vector3(ctr.x, ctr.y * (M.cfg.container ? 0.7 : 0.82), ctr.z),
        pos: new T.Vector3(ctr.x + dist * 0.62, ctr.y + dist * (this.showcase ? 0.3 : 0.42), ctr.z + dist * 0.78),
      };
      this.controls.minDistance = md * 0.15;
      this.controls.maxDistance = md * 4;
      const s = md * 0.9;
      Object.assign(this.sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 0.1, far: md * 6 });
      this.sun.shadow.camera.updateProjectionMatrix();
      this.sun.position.set(ctr.x + md * 0.8, md * 1.6, ctr.z + md * 0.9);
      this.sun.target.position.copy(ctr);

      // floor grid: 100 mm / 500 mm for skids, 500 mm / 2.5 m for the container
      this.gridMat.uniforms.uScale.value = M.cfg.container ? 0.5 : 0.1;
      this.gridMat.uniforms.uFade.value = md * 2.2;

      // GA-drawing style dimension lines
      if (this.dims) this.scene.remove(this.dims);
      this.dims = this.buildDims(M, md);
      this.scene.add(this.dims);

      this.setSelected(null);
      if (instant) { this.camera.position.copy(this.home.pos); this.controls.target.copy(this.home.target); this.controls.update(); }
      else this.flyTo(this.home.pos, this.home.target);

      this.applyFlow(); this.applyWalls();
      if (!this.mini) this.renderPanel();
    }

    buildDims(M, md) {
      const T = THREE, g = new T.Group(), c = M.cfg;
      const [L, W, H] = c.container ? [6.058, 2.438, 2.591] : [c.L, c.W, c.H];
      const off = Math.max(0.16, md * 0.08), tk = off * 0.28, seg = [];
      const P = (a, b) => seg.push(...a, ...b);
      const tick = (x, y, z, plane) => plane === 'v' ? P([x - tk * 0.5, y - tk * 0.5, z], [x + tk * 0.5, y + tk * 0.5, z]) : P([x - tk * 0.5, y, z + tk * 0.5], [x + tk * 0.5, y, z - tk * 0.5]);
      const zf = W / 2 + off, xr = L / 2 + off;
      // length (front)
      P([-L / 2, 0, W / 2 + tk * 0.3], [-L / 2, 0, zf + tk]); P([L / 2, 0, W / 2 + tk * 0.3], [L / 2, 0, zf + tk]); P([-L / 2, 0, zf], [L / 2, 0, zf]);
      tick(-L / 2, 0, zf); tick(L / 2, 0, zf);
      // width (right side)
      P([L / 2 + tk * 0.3, 0, -W / 2], [xr + tk, 0, -W / 2]); P([L / 2 + tk * 0.3, 0, W / 2], [xr + tk, 0, W / 2]); P([xr, 0, -W / 2], [xr, 0, W / 2]);
      tick(xr, 0, -W / 2); tick(xr, 0, W / 2);
      // height (back-right corner)
      P([L / 2 + tk * 0.3, H, -W / 2], [xr + tk, H, -W / 2]); P([xr, 0, -W / 2], [xr, H, -W / 2]);
      tick(xr, 0, -W / 2, 'v'); tick(xr, H, -W / 2, 'v');
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(seg, 3));
      const lines = new T.LineSegments(geo, this.kit.track(new T.LineBasicMaterial({ color: 0x2b3445, transparent: true, opacity: 0.8 })));
      lines.position.y = 0.004; g.add(lines);
      const label = (txt, x, y, z) => {
        const tex = this.kit.tex(360, 84, (cx, w, h) => {
          cx.fillStyle = 'rgba(255,255,255,0.94)';
          if (cx.roundRect) { cx.beginPath(); cx.roundRect(4, 8, w - 8, h - 16, 10); cx.fill(); } else cx.fillRect(4, 8, w - 8, h - 16);
          cx.strokeStyle = 'rgba(43,52,69,0.35)'; cx.lineWidth = 2; if (cx.roundRect) cx.stroke();
          cx.fillStyle = '#1b2333'; cx.font = '600 36px IBM Plex Mono, Consolas, monospace'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
          cx.fillText(txt, w / 2, h / 2 + 2);
        });
        const s = new T.Sprite(this.kit.track(new T.SpriteMaterial({ map: tex, depthTest: false, transparent: true })));
        const k = Math.max(0.105, md * 0.034); s.scale.set(k * 4.3, k, 1); s.position.set(x, y, z); s.renderOrder = 10; g.add(s);
      };
      const mm = (v) => Math.round(v * 1000).toLocaleString('en-GB') + ' mm';
      label(mm(L), 0, 0.06, zf);
      label(mm(W), xr, 0.06, 0);
      label(mm(H), xr, H / 2, -W / 2);
      return g;
    }

    disposeBuild() {
      if (this.dims) { this.scene.remove(this.dims); this.dims = null; }
      this.root.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      this.kit.dispose();
      if (this.hsWrap) this.hsWrap.innerHTML = '';
    }

    /* ------------------------------------------------------------------ UI */
    bindUI() {
      const $ = this.$;
      this.hsWrap = $('hotspots'); this.tip = $('vTip');
      document.querySelectorAll('.cfg-tab').forEach(b => {
        b.classList.toggle('active', b.dataset.model === this.modelKey);
        b.addEventListener('click', () => {
          if (b.dataset.model === this.modelKey) return;
          document.querySelectorAll('.cfg-tab').forEach(x => x.classList.toggle('active', x === b));
          this.load(b.dataset.model);
          history.replaceState(null, '', '?model=' + b.dataset.model);
        });
      });
      const tog = (id, key, fn) => {
        const b = $(id); if (!b) return;
        b.classList.toggle('on', !!this.state[key]);
        b.addEventListener('click', () => { this.state[key] = !this.state[key]; b.classList.toggle('on', this.state[key]); fn && fn(); });
      };
      tog('tExplode', 'explode');
      tog('tFlow', 'flow', () => this.applyFlow());
      tog('tDims', 'dims');
      tog('tRotate', 'rotate', () => { this.controls.autoRotate = this.state.rotate; });
      tog('tLabels', 'labels', () => this.hsWrap.classList.toggle('off', !this.state.labels));
      $('tReset').addEventListener('click', () => { this.setSelected(null); this.state.explode = false; $('tExplode').classList.remove('on'); this.flyTo(this.home.pos, this.home.target); });
      $('tWalls').addEventListener('click', () => {
        const order = ['cut', 'xray', 'closed'];
        this.state.walls = order[(order.indexOf(this.state.walls) + 1) % 3];
        this.applyWalls();
      });
      $('tFull').addEventListener('click', () => {
        if (document.fullscreenElement) document.exitFullscreen(); else this.stage.requestFullscreen && this.stage.requestFullscreen();
      });
      $('zIn').addEventListener('click', () => this.dolly(0.75));
      $('zOut').addEventListener('click', () => this.dolly(1.33));
      $('compDetail').addEventListener('click', (e) => { if (e.target.closest('.close')) this.setSelected(null, true); });
    }

    dolly(k) {
      const off = this.camera.position.clone().sub(this.controls.target).multiplyScalar(k);
      const len = THREE.MathUtils.clamp(off.length(), this.controls.minDistance, this.controls.maxDistance);
      off.setLength(len);
      this.flyTo(this.controls.target.clone().add(off), this.controls.target.clone(), 0.5);
    }

    renderPanel() {
      const M = MODELS[this.modelKey], $ = this.$;
      $('pvSku').textContent = M.sku;
      $('pvName').textContent = M.name;
      $('pvDesc').textContent = M.desc;
      $('sTitle').innerHTML = `${M.sku} · INTERACTIVE MODEL<b>${M.cap} ${M.unit}</b>`;
      $('pvKv').innerHTML = M.kv.map(([k, v]) => `<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
      $('pvQuote').href = 'contact.html?model=' + this.modelKey;
      $('compList').innerHTML = this.comps.map(c => `<li><button data-id="${c.id}"><span class="no">${c.no}</span><span>${c.name}</span><span class="tg">${c.tag}</span></button></li>`).join('');
      $('compList').onclick = (e) => { const b = e.target.closest('button'); if (b) this.setSelected(this.comps.find(c => c.id === b.dataset.id), true); };
      $('tWalls').hidden = !this.walls;
      // hotspots
      this.hsWrap.innerHTML = this.comps.map(c => `<button class="hs" data-id="${c.id}" aria-label="${c.name}">${c.no}</button>`).join('');
      this.hsWrap.querySelectorAll('.hs').forEach(b => {
        const c = this.comps.find(x => x.id === b.dataset.id); c.hs = b;
        b.addEventListener('click', () => this.setSelected(c, true));
        b.addEventListener('mouseenter', () => { this.hovered = c; });
        b.addEventListener('mouseleave', () => { this.hovered = null; });
      });
      this.hsWrap.classList.toggle('off', !this.state.labels);
      this.applyWalls();
    }

    setSelected(c, focus) {
      this.selected = c;
      if (this.mini) return;
      const $ = this.$, d = $('compDetail');
      document.querySelectorAll('#compList button').forEach(b => b.classList.toggle('sel', !!c && b.dataset.id === c.id));
      (this.comps || []).forEach(x => x.hs && x.hs.classList.toggle('sel', x === c));
      (this.comps || []).forEach(x => x.hs && x.hs.classList.toggle('dim', !!c && x !== c));
      if (!c) { d.classList.remove('show'); return; }
      d.innerHTML = `<button class="close" aria-label="Close">×</button><div class="tg">${c.tag} · COMPONENT ${c.no}/${this.comps.length}</div><h4>${c.name}</h4><p>${c.desc}</p>
        <ul>${c.specs.map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`).join('')}</ul>`;
      d.classList.remove('show'); void d.offsetWidth; d.classList.add('show');
      const li = document.querySelector(`#compList button[data-id="${c.id}"]`);
      if (li) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      if (focus) this.focus(c);
    }

    focus(c) {
      const T = THREE;
      const box = new T.Box3().setFromObject(c.group);
      const ctr = box.getCenter(new T.Vector3());
      const size = box.getSize(new T.Vector3()).length();
      const dir = this.camera.position.clone().sub(this.controls.target).normalize();
      dir.y = Math.max(dir.y, 0.25); dir.normalize();
      const dist = Math.max(size * 1.6, 0.7);
      this.flyTo(ctr.clone().add(dir.multiplyScalar(dist)), ctr);
    }

    flyTo(pos, target, dur = 1.1) {
      this.tween = { p0: this.camera.position.clone(), t0: this.controls.target.clone(), p1: pos.clone(), t1: target.clone(), k: 0, dur };
    }

    applyFlow() { if (this.kit) this.kit.flowMeshes.forEach(m => { m.visible = this.state.flow; }); }

    applyWalls() {
      if (!this.walls) return;
      const w = this.walls, mode = this.state.walls;
      w.cutaway.forEach(o => { o.visible = mode !== 'cut'; });
      w.mats.forEach(m => { m.transparent = mode === 'xray'; m.opacity = mode === 'xray' ? 0.14 : 1; m.depthWrite = mode !== 'xray'; m.needsUpdate = true; });
      const b = this.$('tWalls');
      if (b) { b.classList.toggle('on', mode !== 'closed'); b.querySelector('span').textContent = { cut: 'Cutaway', xray: 'X-ray', closed: 'Closed' }[mode]; }
    }

    /* -------------------------------------------------------------- picking */
    bindPointer() {
      const el = this.renderer.domElement;
      let down = null;
      el.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; if (this.mini) return; });
      el.addEventListener('pointerup', (e) => {
        if (!down) return;
        const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]);
        down = null;
        if (moved > 5) return;
        if (this.mini) { if (this.stage.dataset.href) location.href = this.stage.dataset.href; return; }
        const c = this.pick(e);
        this.setSelected(c, !!c);
      });
      if (this.mini) return;
      el.addEventListener('pointermove', (e) => {
        this._pm = e;
        if (this._pmq) return; this._pmq = true;
        requestAnimationFrame(() => {
          this._pmq = false;
          const ev = this._pm;
          const c = this.pick(ev);
          this.hovered = c;
          el.style.cursor = c ? 'pointer' : '';
          if (c) {
            const r = this.stage.getBoundingClientRect();
            this.tip.innerHTML = `<small>${c.tag}</small>${c.name}`;
            this.tip.style.transform = `translate(${ev.clientX - r.left + 16}px, ${ev.clientY - r.top - 18}px)`;
            this.tip.classList.add('show');
          } else this.tip.classList.remove('show');
        });
      });
      el.addEventListener('pointerleave', () => { this.hovered = null; this.tip && this.tip.classList.remove('show'); });
    }

    pick(e) {
      const r = this.renderer.domElement.getBoundingClientRect();
      this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObject(this.root, true);
      for (const h of hits) {
        let o = h.object, ok = true, comp = null;
        if (o.userData.noPick) continue;
        if (o.material && o.material.transparent && o.material.opacity < 0.2) continue;
        while (o) { if (!o.visible) { ok = false; break; } if (!comp && o.userData.comp) comp = o.userData.comp; o = o.parent; }
        if (ok && comp) return comp;
      }
      return null;
    }

    /* --------------------------------------------------------------- frame */
    frame() {
      const T = THREE;
      const dt = Math.min(0.05, this.clock.getDelta());
      const t = this.clock.elapsedTime;

      if (this.tween) {
        const tw = this.tween;
        tw.k = Math.min(1, tw.k + dt / tw.dur);
        const e = tw.k < 0.5 ? 4 * tw.k ** 3 : 1 - Math.pow(-2 * tw.k + 2, 3) / 2;
        this.camera.position.lerpVectors(tw.p0, tw.p1, e);
        this.controls.target.lerpVectors(tw.t0, tw.t1, e);
        if (tw.k >= 1) this.tween = null;
      }
      this.controls.autoRotate = this.state.rotate && !this.selected && !this.tween;
      this.controls.update();

      // explode
      const k = 1 - Math.pow(0.001, dt);
      this.explodables.forEach(x => {
        const goal = this.state.explode ? x.base.clone().add(x.vec) : x.base;
        x.obj.position.lerp(goal, k * 0.9);
      });

      if (this.dims) this.dims.visible = this.state.dims && !this.state.explode;
      // animated parts
      this.kit.flowMats.forEach(m => { m.uniforms.uTime.value = t; });
      this.kit.spinners.forEach(s => { s.rotation[s.userData.axis || 'y'] += dt * (s.userData.speed || 8); });
      this.kit.pulsers.forEach(p => { p.material.emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.4; });

      // highlight boxes
      if (this.selected) { this.selBox.box.setFromObject(this.selected.group); this.selBox.visible = true; } else this.selBox.visible = false;
      if (this.hovered && this.hovered !== this.selected) { this.hovBox.box.setFromObject(this.hovered.group); this.hovBox.visible = true; } else this.hovBox.visible = false;

      // hotspots
      if (!this.mini && this.state.labels) {
        const w = this.stage.clientWidth, h = this.stage.clientHeight, v = new T.Vector3();
        this.comps.forEach(c => {
          if (!c.hs) return;
          v.copy(c.anchorLocal).applyMatrix4(c.anchorObj.matrixWorld).project(this.camera);
          const off = v.z > 1 || !c.group.visible;
          c.hs.style.display = off ? 'none' : '';
          c.hs.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px)`;
        });
      }
      this.renderer.render(this.scene, this.camera);
    }
  }

  /* ======================================================================
     Kit — materials, textures and primitive builders for one model build
     ====================================================================== */
  class Kit {
    constructor() {
      const T = THREE;
      this.owned = []; this.flowMats = []; this.flowMeshes = []; this.spinners = []; this.pulsers = [];
      const S = (o) => { const m = new T.MeshStandardMaterial(o); this.owned.push(m); return m; };
      this.m = {
        steel: S({ color: 0xe3e8ee, metalness: 1, roughness: 0.2 }),
        brushed: S({ color: 0xc4ccd6, metalness: 0.95, roughness: 0.36 }),
        frame: S({ color: 0xb8c0cb, metalness: 0.9, roughness: 0.3 }),
        frp: S({ color: 0xf2f4f7, metalness: 0, roughness: 0.4 }),
        cap: S({ color: 0x3a4252, metalness: 0.3, roughness: 0.5 }),
        blue: S({ color: 0x1d62d6, metalness: 0.3, roughness: 0.38 }),
        bowl: S({ color: 0x1a56c4, metalness: 0, roughness: 0.25 }),
        black: S({ color: 0x1a1e26, metalness: 0.1, roughness: 0.55 }),
        dark: S({ color: 0x2b313c, metalness: 0.5, roughness: 0.45 }),
        pvc: S({ color: 0x6a7280, metalness: 0.05, roughness: 0.42 }),
        perm: S({ color: 0x3a8de0, metalness: 0.05, roughness: 0.32 }),
        white: S({ color: 0xeef1f5, metalness: 0.05, roughness: 0.5 }),
        clear: S({ color: 0xd8ecff, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.38 }),
        cart: S({ color: 0xf5f4ee, roughness: 0.9 }),
        brass: S({ color: 0xd2aa52, metalness: 1, roughness: 0.3 }),
        red: S({ color: 0xe3342f, roughness: 0.4 }),
        yellow: S({ color: 0xf2c230, roughness: 0.45 }),
        green: S({ color: 0x2fe39a, emissive: 0x1c8a5e, emissiveIntensity: 0.8, roughness: 0.4 }),
        uvGlow: S({ color: 0x9b6bff, emissive: 0x7f4dff, emissiveIntensity: 1, roughness: 0.3 }),
        floor: S({ color: 0x3a414e, metalness: 0.7, roughness: 0.55 }),
        shell: S({ color: 0xe8ecf1, metalness: 0.35, roughness: 0.5, side: T.DoubleSide }),
        shellDark: S({ color: 0x1f2a3d, metalness: 0.5, roughness: 0.5 }),
        tank: S({ color: 0xf1efe4, roughness: 0.65 }),
        mmf: S({ color: 0x1f4fa8, metalness: 0.15, roughness: 0.32 }),
        led: S({ color: 0xffffff, emissive: 0xe8f6ff, emissiveIntensity: 1.2 }),
        float: S({ color: 0xe3342f, roughness: 0.3 }),
      };
    }
    track(o) { this.owned.push(o); return o; }
    dispose() { this.owned.forEach(o => o.dispose && o.dispose()); }

    tex(w, h, draw) {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
      return this.track(t);
    }
    texMat(w, h, draw, extra = {}) {
      return this.track(new THREE.MeshStandardMaterial(Object.assign({ map: this.tex(w, h, draw), roughness: 0.45 }, extra)));
    }

    mesh(geo, mat, x = 0, y = 0, z = 0) {
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
    }
    box(w, h, d, mat, x, y, z) { return this.mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z); }
    cyl(r, h, mat, x, y, z, axis = 'y', seg = 32, r2) {
      const m = this.mesh(new THREE.CylinderGeometry(r, r2 != null ? r2 : r, h, seg), mat, x, y, z);
      if (axis === 'x') m.rotation.z = Math.PI / 2;
      if (axis === 'z') m.rotation.x = Math.PI / 2;
      return m;
    }
    sphere(r, mat, x, y, z, sy = 1) { const m = this.mesh(new THREE.SphereGeometry(r, 32, 16), mat, x, y, z); m.scale.y = sy; return m; }
    torus(R, r, mat, x, y, z, axis = 'y') {
      const m = this.mesh(new THREE.TorusGeometry(R, r, 10, 40), mat, x, y, z);
      if (axis === 'y') m.rotation.x = Math.PI / 2;
      if (axis === 'x') m.rotation.y = Math.PI / 2;
      return m;
    }
    plane(w, h, mat, x, y, z, ry = 0) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; return m; }

    // Orthogonal pipe run with elbows + animated flow overlay
    pipe(parent, pts, r, mat, stream) {
      const T = THREE, col = { feed: 0x3d7be6, hp: 0x0aa2e0, perm: 0x00b58f, conc: 0xf08a00 }[stream] || 0x0aa2e0;
      const up = new T.Vector3(0, 1, 0);
      for (let i = 0; i < pts.length - 1; i++) {
        const a = new T.Vector3(...pts[i]), b = new T.Vector3(...pts[i + 1]);
        const len = a.distanceTo(b); if (len < 1e-4) continue;
        const dir = b.clone().sub(a).normalize();
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const p = this.mesh(new T.CylinderGeometry(r, r, len, 20), mat);
        p.position.copy(mid); p.quaternion.setFromUnitVectors(up, dir); parent.add(p);
        // flow overlay
        const fm = this.track(new T.ShaderMaterial({
          uniforms: { uTime: { value: 0 }, uLen: { value: len }, uColor: { value: new T.Color(col) }, uSpeed: { value: stream === 'hp' ? 2.4 : 1.4 } },
          vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
          fragmentShader: 'uniform float uTime; uniform float uLen; uniform float uSpeed; uniform vec3 uColor; varying vec2 vUv;' +
            'void main(){ float s = fract(vUv.y * uLen * 6.0 - uTime * uSpeed); float a = smoothstep(0.0,0.06,s) * (1.0 - smoothstep(0.16,0.24,s));' +
            ' gl_FragColor = vec4(uColor, a * 0.8); }',
          transparent: true, depthWrite: false,
        }));
        this.flowMats.push(fm);
        const f = new T.Mesh(new T.CylinderGeometry(r * 1.18, r * 1.18, len, 16, 1, true), fm);
        f.position.copy(mid); f.quaternion.copy(p.quaternion); f.userData.noPick = true; f.renderOrder = 2;
        parent.add(f); this.flowMeshes.push(f);
        if (i > 0) parent.add(this.sphere(r * 1.12, mat, a.x, a.y, a.z));
      }
    }
  }

  /* ------------------------------------------------------- canvas artwork */
  const drawLogo = (c, w, h, sub) => {
    c.fillStyle = '#071433'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#19c3ff'; c.fillRect(0, h - h * 0.12, w, h * 0.12);
    c.fillStyle = '#fff'; c.font = `800 ${h * 0.42}px Archivo, Arial`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('PUREVER', w / 2, h * (sub ? 0.38 : 0.45));
    if (sub) { c.fillStyle = '#9fdcff'; c.font = `500 ${h * 0.17}px IBM Plex Mono, monospace`; c.fillText(sub, w / 2, h * 0.7); }
  };
  const drawHMI = (lpr) => (c, w, h) => {
    c.fillStyle = '#04112b'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#0b2a6b'; c.fillRect(0, 0, w, 34);
    c.fillStyle = '#fff'; c.font = '700 18px Arial'; c.textBaseline = 'middle'; c.fillText('PUREVER · RO CONTROL', 12, 17);
    c.fillStyle = '#2fe39a'; c.beginPath(); c.arc(w - 74, 17, 6, 0, 7); c.fill(); c.font = '600 15px Arial'; c.fillText('RUN', w - 62, 17);
    const tile = (x, y, k, v, u, col) => {
      c.fillStyle = '#0a1d45'; c.fillRect(x, y, 148, 70);
      c.fillStyle = '#7f93b8'; c.font = '600 12px Arial'; c.fillText(k, x + 10, y + 16);
      c.fillStyle = col; c.font = '800 30px Arial'; c.fillText(v, x + 10, y + 46);
      c.fillStyle = '#a9b4c8'; c.font = '13px Arial'; c.fillText(u, x + 12 + c.measureText(v).width * 0, y + 62);
    };
    c.font = '800 30px Arial';
    tile(10, 46, 'PERMEATE', lpr, 'L/h', '#19c3ff');
    tile(166, 46, 'PRODUCT TDS', '14', 'mg/L', '#00e0b8');
    tile(10, 124, 'FEED PRESS.', '11.2', 'bar', '#fff');
    tile(166, 124, 'RECOVERY', '68', '%', '#ffb547');
    c.strokeStyle = '#19c3ff'; c.lineWidth = 2; c.beginPath();
    for (let i = 0; i <= 40; i++) { const x = 10 + i * 7.4, y = 230 - Math.sin(i / 4) * 10 - Math.random() * 6; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
  };
  const drawGauge = (val) => (c, w, h) => {
    c.fillStyle = '#f7f8fb'; c.beginPath(); c.arc(w / 2, h / 2, w / 2, 0, 7); c.fill();
    c.strokeStyle = '#0b1f4d'; c.lineWidth = 3;
    for (let i = 0; i <= 20; i++) {
      const a = (-225 + i * 13.5) * Math.PI / 180, r1 = i % 5 ? w * 0.38 : w * 0.33, r2 = w * 0.43;
      c.lineWidth = i % 5 ? 2 : 4;
      c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * r1, h / 2 + Math.sin(a) * r1); c.lineTo(w / 2 + Math.cos(a) * r2, h / 2 + Math.sin(a) * r2); c.stroke();
    }
    c.strokeStyle = '#e3342f'; c.lineWidth = 8; c.beginPath(); c.arc(w / 2, h / 2, w * 0.41, 20 * Math.PI / 180, 45 * Math.PI / 180); c.stroke();
    c.fillStyle = '#0b1f4d'; c.font = `700 ${w * 0.09}px Arial`; c.textAlign = 'center'; c.fillText('bar', w / 2, h * 0.72);
    const a = (-225 + val * 270) * Math.PI / 180;
    c.strokeStyle = '#e3342f'; c.lineWidth = 5; c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 + Math.cos(a) * w * 0.36, h / 2 + Math.sin(a) * w * 0.36); c.stroke();
    c.fillStyle = '#0b1f4d'; c.beginPath(); c.arc(w / 2, h / 2, w * 0.05, 0, 7); c.fill();
  };
  const drawTDS = (c, w, h) => {
    c.fillStyle = '#10161f'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#9bffcf'; c.font = '700 54px monospace'; c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText('0014', w - 16, h / 2 + 4);
    c.fillStyle = '#5b6b88'; c.font = '600 16px Arial'; c.textAlign = 'left'; c.fillText('TDS ppm', 12, 18);
  };

  /* ======================================================================
     Builder: skid-mounted RO (500 / 1000 / 2000 LPH)
     ====================================================================== */
  function buildSkid(k, root, cfg, M) {
    const m = k.m, comps = [], explodables = [];
    const { L, W, H } = cfg;
    const add = (def, vec) => {
      const g = new THREE.Group(); g.userData.comp = def; def.group = g; root.add(g); comps.push(def);
      if (vec) explodables.push({ obj: g, vec: new THREE.Vector3(...vec) });
      return g;
    };
    const big = cfg.el === '8040';
    const r = big ? 0.105 : 0.056;
    const vl = L - 0.44;
    const xVL = -vl / 2 - 0.06, xVR = vl / 2 + 0.06;
    const zV = -W / 2 + r + 0.08;
    const gap = 2 * r + (big ? 0.09 : 0.07);
    const y0 = big ? 0.62 : 0.64;
    const ys = Array.from({ length: cfg.vessels }, (_, i) => y0 + i * gap);
    const yTop = ys[ys.length - 1];
    const zF = W / 2 - 0.15, yH = 0.86;
    const kwS = Math.pow(cfg.kw / 1.1, 0.22);
    const xP = L / 2 - 0.3, zP = W / 2 - 0.2;
    const xIP = L / 2 - 0.32, yIP = H - 0.42, zRM = W / 2 + 0.075;
    const xRMp = xIP - 0.09, xRMc = xIP - 0.17;

    /* --- 1. Frame --- */
    const fr = add({ id: 'frame', name: 'SS304 skid frame', tag: 'SK-100',
      desc: 'Welded, electropolished stainless steel frame with forklift-ready base rails and adjustable anti-vibration feet. All components are pre-plumbed and factory-tested.',
      specs: [['Material', 'SS304, 40 × 40 mm'], ['Dimensions', `${L} × ${W} × ${H} m`], ['Finish', 'Electropolished'], ['Test', 'FAT at 1.5 × design']] });
    const t = 0.04;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      fr.add(k.box(t, H - 0.04, t, m.frame, sx * (L / 2 - t / 2), (H + 0.04) / 2, sz * (W / 2 - t / 2)));
      fr.add(k.cyl(0.035, 0.04, m.black, sx * (L / 2 - t / 2), 0.02, sz * (W / 2 - t / 2)));
    });
    [0.1, H - t / 2].forEach(y => {
      [-1, 1].forEach(s => {
        fr.add(k.box(L, t, t, m.frame, 0, y, s * (W / 2 - t / 2)));
        fr.add(k.box(t, t, W, m.frame, s * (L / 2 - t / 2), y, 0));
      });
    });
    fr.add(k.box(L, t, t, m.frame, 0, H * 0.5, -(W / 2 - t / 2)));
    fr.add(k.box(L - 0.08, 0.012, W - 0.08, m.brushed, 0, 0.125, 0));
    const plate = k.texMat(512, 128, (c, w, h) => drawLogo(c, w, h, M.sku + ' · ' + M.cap + ' ' + M.unit));
    fr.add(k.plane(0.36, 0.09, plate, 0, 0.1, W / 2 + 0.001));

    /* --- 2. Pre-filtration --- */
    const pf = add({ id: 'prefilter', name: cfg.housings === 'ss' ? 'SS316 cartridge filter housing' : 'Cartridge pre-filters', tag: 'F-101',
      desc: cfg.housings === 'ss'
        ? 'A multi-round stainless housing with 5 µm melt-blown cartridges. It is the last barrier protecting the membranes from particulate fouling.'
        : 'Big Blue 20" housings: a 5 µm PP sediment cartridge followed by a CTO carbon block. They remove silt and the chlorine that would oxidise the membranes.',
      specs: cfg.housings === 'ss'
        ? [['Housing', 'SS316L, 5 × 40"'], ['Rating', '5 µm nominal'], ['Max pressure', '10 bar'], ['Change-out', 'ΔP > 0.7 bar']]
        : [['Housings', '2 × 20" Big Blue'], ['Stage 1', 'PP sediment 5 µm'], ['Stage 2', 'CTO carbon 10 µm'], ['Connections', '1" BSP']] }, [-0.35, 0, 0.45]);
    let hx;
    if (cfg.housings === 'ss') {
      hx = [-L / 2 + 0.27];
      const x = hx[0], hz = zF - 0.03;
      pf.add(k.cyl(0.12, 0.66, m.steel, x, 0.56, hz));
      pf.add(k.sphere(0.12, m.steel, x, 0.89, hz, 0.45));
      pf.add(k.cyl(0.135, 0.04, m.brushed, x, 0.88, hz));
      pf.add(k.sphere(0.12, m.steel, x, 0.23, hz, 0.4));
      [0, 2.1, 4.2].forEach(a => pf.add(k.cyl(0.012, 0.2, m.steel, x + Math.cos(a) * 0.09, 0.2, hz + Math.sin(a) * 0.09)));
      const gm = k.texMat(256, 256, drawGauge(0.25));
      pf.add(k.cyl(0.04, 0.03, m.steel, x, 1.0, hz));
      const gf = k.plane(0.07, 0.07, gm, x, 1.0, hz + 0.017); gf.rotation.x = -Math.PI / 2; pf.add(gf);
      pf.add(k.cyl(0.03, 0.12, m.steel, x - 0.14, yH, hz, 'x'));
      pf.add(k.cyl(0.03, 0.12, m.steel, x + 0.14, yH, hz, 'x'));
    } else {
      hx = Array.from({ length: cfg.housings }, (_, i) => -L / 2 + 0.22 + i * 0.22);
      hx.forEach((x, i) => {
        pf.add(k.box(0.17, 0.09, 0.15, m.black, x, yH, zF));
        pf.add(k.cyl(0.075, 0.05, m.black, x, yH - 0.06, zF));
        pf.add(k.cyl(0.012, 0.03, m.red, x + 0.05, yH + 0.06, zF));
        pf.add(k.cyl(0.068, 0.46, i === 0 ? m.bowl : m.clear, x, yH - 0.32, zF));
        pf.add(k.sphere(0.068, i === 0 ? m.bowl : m.clear, x, yH - 0.55, zF, 0.35));
        if (i > 0) pf.add(k.cyl(0.045, 0.42, m.dark, x, yH - 0.32, zF));
        pf.add(k.box(0.2, 0.03, 0.04, m.frame, x, yH + 0.06, W / 2 - 0.02));
      });
    }

    /* --- 3. HP pump --- */
    const pu = add({ id: 'pump', name: 'High-pressure pump', tag: 'P-101',
      desc: `A vertical multistage stainless pump that raises the feed above its osmotic pressure. ${cfg.kw >= 4 ? 'A variable frequency drive gives soft starts and constant-flow control.' : 'An inlet low-pressure switch protects it from running dry.'}`,
      specs: [['Type', 'Vertical multistage, SS304'], ['Motor', `${cfg.kw} kW, IE3, 400 V`], ['Duty', `${(cfg.kw * 0.68).toFixed(1)} m³/h @ 12–15 bar`], ['Control', cfg.kw >= 4 ? 'VFD, PID pressure' : 'DOL, LP/HP switches']] }, [0.4, 0, 0.45]);
    pu.add(k.box(0.24 * kwS, 0.03, 0.22 * kwS, m.brushed, xP, 0.145, zP));
    pu.add(k.cyl(0.07 * kwS, 0.06, m.steel, xP, 0.19, zP));
    pu.add(k.cyl(0.064 * kwS, 0.36, m.steel, xP, 0.4, zP));
    for (let i = 0; i < 5; i++) pu.add(k.torus(0.066 * kwS, 0.004, m.brushed, xP, 0.26 + i * 0.07, zP));
    pu.add(k.cyl(0.08 * kwS, 0.04, m.steel, xP, 0.6, zP));
    pu.add(k.cyl(0.02, 0.12, m.steel, xP - 0.09 * kwS, 0.2, zP, 'x'));
    pu.add(k.cyl(0.02, 0.12, m.steel, xP + 0.09 * kwS, 0.2, zP, 'x'));
    const mot = k.cyl(0.09 * kwS, 0.27 * kwS, m.blue, xP, 0.62 + 0.135 * kwS + 0.02, zP, 'y', 18); pu.add(mot);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; pu.add(k.box(0.012, 0.22 * kwS, 0.02, m.blue, xP + Math.cos(a) * 0.092 * kwS, 0.64 + 0.135 * kwS, zP + Math.sin(a) * 0.092 * kwS)); }
    pu.add(k.cyl(0.092 * kwS, 0.06, m.black, xP, 0.64 + 0.27 * kwS + 0.03, zP));
    pu.add(k.box(0.07, 0.07, 0.06, m.blue, xP, 0.7, zP + 0.1 * kwS));

    /* --- 4. Membrane array --- */
    const ma = add({ id: 'membranes', name: `RO membrane array · ${cfg.vessels} × ${cfg.el}`, tag: 'RO-201',
      desc: `${cfg.vessels} pressure vessels, each holding a HydraCore ${big ? 'BW-8040' : 'BW-4040'} spiral-wound element. Water permeates the polyamide layer, while 99%+ of the dissolved salts stay in the concentrate.`,
      specs: [['Elements', `${cfg.vessels} × HydraCore BW-${cfg.el}`], ['Active area', `${big ? 37 : 7.9} m² each`], ['Vessel', big ? 'FRP, 300 psi, side port' : 'SS304, 300 psi, end port'], ['Rejection', '99.5% stabilised'], ['Max pressure', '41 bar']] }, [0, 0.05, -0.55]);
    const vMat = big ? m.frp : m.steel;
    const lbl = k.texMat(512, 160, (c, w, h) => drawLogo(c, w, h, `HydraCore BW-${cfg.el}`));
    ys.forEach(y => {
      ma.add(k.cyl(r, vl, vMat, 0, y, zV, 'x', 36));
      [xVL + 0.03, xVR - 0.03].forEach(x => {
        ma.add(k.cyl(r * 1.13, 0.06, big ? m.cap : m.brushed, x, y, zV, 'x', 36));
        ma.add(k.cyl(0.016, 0.05, m.steel, x + Math.sign(x) * 0.05, y, zV, 'x'));
      });
      [-vl * 0.32, vl * 0.32].forEach(x => ma.add(k.torus(r + 0.006, 0.006, m.dark, x, y, zV, 'x')));
      if (big) { const lp = k.plane(0.34, 0.1, lbl, 0, y, zV + r + 0.002); ma.add(lp); }
    });
    [-vl * 0.32, vl * 0.32].forEach(x => ma.add(k.box(0.03, yTop - y0 + 2 * r + 0.1, 0.03, m.frame, x, (y0 + yTop) / 2, zV - r - 0.02)));
    if (!big) ma.add(k.plane(0.22, 0.07, lbl, 0, ys[0] - r - 0.04, zV + 0.001));

    /* --- 5. Control panel --- */
    const cp = add({ id: 'panel', name: 'PLC control panel', tag: 'CP-001',
      desc: `IP65 enclosure housing the PLC, motor protection and ${cfg.hmi} touchscreen HMI. It automates start-up flush, low/high-pressure trips, tank-level control and alarm logging.`,
      specs: [['HMI', `${cfg.hmi} colour touchscreen`], ['Controller', 'PLC + remote telemetry ready'], ['Protection', 'IP65, MCB/MPCB'], ['Supply', cfg.kw >= 2 ? '400 V / 3 ph / 50 Hz' : '230 V / 1 ph / 50 Hz']] }, [0, 0.25, 0.45]);
    const xCP = -L / 2 + 0.3, yCP = H - 0.36, zCP = W / 2 + 0.085;
    cp.add(k.box(0.42, 0.5, 0.15, m.white, xCP, yCP, zCP));
    cp.add(k.box(0.43, 0.012, 0.155, m.dark, xCP, yCP + 0.25, zCP));
    const hmi = k.texMat(320, 250, drawHMI(M.cap.replace(',', '')), { emissive: 0xffffff, emissiveIntensity: 0.55 });
    hmi.emissiveMap = hmi.map;
    cp.add(k.plane(0.24, 0.19, hmi, xCP - 0.04, yCP + 0.07, zCP + 0.0755));
    cp.add(k.cyl(0.024, 0.03, m.yellow, xCP + 0.15, yCP + 0.12, zCP + 0.08, 'z'));
    cp.add(k.cyl(0.018, 0.04, m.red, xCP + 0.15, yCP + 0.12, zCP + 0.1, 'z'));
    const led = k.cyl(0.012, 0.02, m.green, xCP + 0.15, yCP + 0.03, zCP + 0.085, 'z'); cp.add(led); k.pulsers.push(led);
    cp.add(k.cyl(0.012, 0.02, m.red, xCP + 0.15, yCP - 0.03, zCP + 0.085, 'z'));
    const logoM = k.texMat(400, 100, (c, w, h) => drawLogo(c, w, h));
    cp.add(k.plane(0.18, 0.045, logoM, xCP - 0.04, yCP - 0.15, zCP + 0.0755));

    /* --- 6. Instrument panel --- */
    const ip = add({ id: 'instruments', name: 'Instrument panel', tag: 'FI / PI / AI',
      desc: 'Panel-mounted flow meters for permeate and concentrate, glycerine-filled pressure gauges and an inline conductivity/TDS monitor. Operators can read recovery and quality at a glance.',
      specs: [['Flow meters', '2 × acrylic rotameter'], ['Gauges', '3 × Ø63 mm, 0–25 bar'], ['Quality', 'Inline TDS, 0–999 ppm'], ['Wetted parts', 'SS316 / PVC-U']] }, [0.05, 0.22, 0.5]);
    ip.add(k.box(0.5, 0.42, 0.02, m.brushed, xIP, yIP, W / 2 + 0.02));
    [xRMc, xRMp].forEach(x => {
      ip.add(k.cyl(0.022, 0.3, m.clear, x, yIP, zRM));
      ip.add(k.cyl(0.028, 0.035, m.black, x, yIP + 0.165, zRM));
      ip.add(k.cyl(0.028, 0.035, m.black, x, yIP - 0.165, zRM));
      const f = k.cyl(0.016, 0.03, m.float, x, yIP - 0.02 + (x === xRMp ? 0.05 : -0.03), zRM, 'y', 16, 0.004); ip.add(f);
    });
    const gMat = k.texMat(256, 256, drawGauge(0.42));
    [[xIP + 0.03, 0.09], [xIP + 0.13, 0.09], [xIP + 0.03, -0.06]].forEach(([x, dy]) => {
      ip.add(k.torus(0.045, 0.007, m.steel, x, yIP + dy, W / 2 + 0.04, 'z'));
      ip.add(k.cyl(0.045, 0.02, m.steel, x, yIP + dy, W / 2 + 0.035, 'z'));
      ip.add(k.plane(0.085, 0.085, gMat, x, yIP + dy, W / 2 + 0.046));
    });
    ip.add(k.box(0.12, 0.07, 0.04, m.dark, xIP + 0.15, yIP - 0.07, W / 2 + 0.045));
    ip.add(k.plane(0.1, 0.05, k.texMat(256, 128, drawTDS, { emissive: 0xffffff, emissiveIntensity: 0.4 }), xIP + 0.15, yIP - 0.07, W / 2 + 0.066));

    /* --- 7. UV --- */
    const xPM = xVR + 0.12, yT = H + 0.11;
    let uvL = 0, uvR = 0;
    if (cfg.uv) {
      const uv = add({ id: 'uv', name: 'UV steriliser', tag: 'UV-301',
        desc: 'A stainless UV reactor that gives the permeate a final 40 mJ/cm² dose of 254 nm light to inactivate bacteria and viruses before storage.',
        specs: [['Reactor', 'SS304, quartz sleeve'], ['Dose', '≥ 40 mJ/cm²'], ['Capacity', cfg.vessels > 2 && big ? '12 GPM' : '6 GPM'], ['Monitor', 'Lamp-failure alarm']] }, [0, 0.35, 0]);
      uvR = xPM - 0.14; uvL = uvR - 0.6;
      uv.add(k.cyl(0.05, 0.6, m.steel, (uvL + uvR) / 2, yT, 0, 'x'));
      uv.add(k.cyl(0.056, 0.03, m.brushed, uvL + 0.015, yT, 0, 'x'));
      uv.add(k.cyl(0.056, 0.03, m.brushed, uvR - 0.015, yT, 0, 'x'));
      const glow = k.cyl(0.02, 0.05, m.uvGlow, uvL - 0.02, yT, 0, 'x'); uv.add(glow); k.pulsers.push(glow);
      [uvL + 0.12, uvR - 0.12].forEach(x => uv.add(k.box(0.04, yT - H, 0.06, m.frame, x, (H + yT) / 2 - 0.02, 0)));
      uv.add(k.box(0.22, 0.12, 0.08, m.white, uvL + 0.18, yT + 0.11, 0));
      const uvled = k.cyl(0.01, 0.01, m.green, uvL + 0.1, yT + 0.11, 0.045, 'z'); uv.add(uvled); k.pulsers.push(uvled);
    }

    /* --- 8. Valves --- */
    const va = add({ id: 'valves', name: 'Valves & controls', tag: 'SV / NV',
      desc: 'An inlet solenoid valve isolates the feed when the unit stops. A stainless needle valve on the concentrate sets the system recovery, and an auto-flush valve rinses the membranes at shutdown.',
      specs: [['Inlet', 'Solenoid, NC, 24 V DC'], ['Concentrate', 'SS316 needle valve'], ['Flush', 'Timed auto-flush'], ['Check valve', 'Permeate non-return']] }, [0, -0.02, 0.5]);
    va.add(k.box(0.08, 0.06, 0.06, m.brass, -L / 2 - 0.1, yH, zF));
    va.add(k.cyl(0.03, 0.07, m.black, -L / 2 - 0.1, yH + 0.065, zF));
    va.add(k.box(0.07, 0.05, 0.05, m.steel, L / 2 - 0.06, 0.32, zRM));
    va.add(k.cyl(0.008, 0.06, m.steel, L / 2 - 0.06, 0.37, zRM));
    va.add(k.torus(0.03, 0.006, m.red, L / 2 - 0.06, 0.405, zRM));

    /* --- 9. Piping --- */
    const pp = add({ id: 'piping', name: 'Process piping', tag: 'PIPING',
      desc: 'Colour-coded process piping: PVC-U on the low-pressure feed, SS316 on the high-pressure side, and blue PVC on the permeate. Turn on Flow to see each stream animated.',
      specs: [['Low pressure', 'PVC-U Sch 80'], ['High pressure', 'SS316L, Victaulic'], ['Permeate', 'PVC-U, food grade'], ['Streams', 'Feed · HP · Permeate · Brine']] });
    const rp = big ? 0.024 : 0.016;
    const hLast = hx[hx.length - 1] + (cfg.housings === 'ss' ? 0.2 : 0.13);
    const yLo = y0 - r - 0.07, xHd = xVL - 0.08, zC = zV - r - 0.05, xC = xVR - 0.03;
    // feed
    k.pipe(pp, [[-L / 2 - 0.22, yH, zF], [hLast, yH, zF], [hLast, 0.2, zF], [xP - 0.15 * kwS, 0.2, zF], [xP - 0.15 * kwS, 0.2, zP], [xP - 0.09 * kwS, 0.2, zP]], rp, m.pvc, 'feed');
    // high pressure
    k.pipe(pp, [[xP + 0.09 * kwS, 0.2, zP], [xP + 0.15, 0.2, zP], [xP + 0.15, yLo, zP], [xP + 0.15, yLo, zV], [xHd, yLo, zV], [xHd, yTop, zV]], rp, m.steel, 'hp');
    ys.forEach(y => k.pipe(pp, [[xHd, y, zV], [xVL + 0.02, y, zV]], rp * 0.9, m.steel, 'hp'));
    // concentrate
    ys.forEach(y => k.pipe(pp, [[xC, y - r * 0.5, zV], [xC, y - r * 0.5, zC]], rp * 0.8, m.pvc, 'conc'));
    k.pipe(pp, [[xC, ys[0] - r * 0.5, zC], [xC, H - 0.06, zC], [xRMc, H - 0.06, zC], [xRMc, H - 0.06, zRM], [xRMc, yIP + 0.185, zRM]], rp * 0.8, m.pvc, 'conc');
    k.pipe(pp, [[xRMc, yIP - 0.185, zRM], [xRMc, 0.32, zRM], [L / 2 + 0.22, 0.32, zRM]], rp * 0.8, m.pvc, 'conc');
    // permeate
    ys.forEach(y => k.pipe(pp, [[xVR + 0.04, y, zV], [xPM, y, zV]], rp * 0.8, m.perm, 'perm'));
    const permTop = cfg.uv
      ? [[xPM, ys[0], zV], [xPM, yT, zV], [xPM, yT, 0], [uvR, yT, 0]]
      : [[xPM, ys[0], zV], [xPM, yT, zV], [xPM, yT, zRM], [xRMp, yT, zRM], [xRMp, yIP + 0.185, zRM]];
    k.pipe(pp, permTop, rp * 0.8, m.perm, 'perm');
    if (cfg.uv) k.pipe(pp, [[uvL, yT, 0], [uvL - 0.06, yT, 0], [uvL - 0.06, yT, zRM], [xRMp, yT, zRM], [xRMp, yIP + 0.185, zRM]], rp * 0.8, m.perm, 'perm');
    k.pipe(pp, [[xRMp, yIP - 0.185, zRM], [xRMp, yIP - 0.27, zRM], [L / 2 + 0.22, yIP - 0.27, zRM]], rp * 0.8, m.perm, 'perm');

    return { comps, explodables };
  }

  /* ======================================================================
     Builder: 20 ft containerised SWRO
     ====================================================================== */
  function buildContainer(k, root) {
    const T = THREE, m = k.m, comps = [], explodables = [];
    const L = 6.06, W = 2.44, H = 2.59, F = 0.12;
    const add = (def, vec) => {
      const g = new T.Group(); g.userData.comp = def; def.group = g; root.add(g); comps.push(def);
      if (vec) explodables.push({ obj: g, vec: new T.Vector3(...vec) });
      return g;
    };

    /* --- Shell --- */
    const sh = add({ id: 'shell', name: "20' ISO container", tag: 'CNT-20',
      desc: 'An insulated, CSC-plated 20 ft ISO container. It ships as standard ISO freight and arrives factory-tested, with lighting, ventilation and air-conditioning fitted.',
      specs: [['Size', '6.06 × 2.44 × 2.59 m'], ['Insulation', '50 mm PU panels'], ['HVAC', 'Split AC + extract fan'], ['Shipping', 'ISO / CSC certified']] });
    const shellMat = m.shell, darkMat = m.shellDark;
    const walls = { cutaway: [], mats: [shellMat, darkMat] };
    const part = (obj, vec) => { sh.add(obj); explodables.push({ obj, vec: new T.Vector3(...vec) }); return obj; };
    const fl = new T.Group(); fl.add(k.box(L, F, W, m.floor, 0, F / 2, 0)); sh.add(fl);
    // corrugated long wall
    const longWall = (z, sgn) => {
      const g = new T.Group();
      g.add(k.box(L - 0.2, H - 0.2, 0.025, shellMat, 0, H / 2, z));
      const rib = new T.BoxGeometry(0.1, H - 0.24, 0.05);
      const n = 34, inst = new T.InstancedMesh(rib, shellMat, n);
      const d = new T.Object3D();
      for (let i = 0; i < n; i++) { d.position.set(-L / 2 + 0.2 + i * ((L - 0.4) / (n - 1)), H / 2, z + sgn * 0.03); d.updateMatrix(); inst.setMatrixAt(i, d.matrix); }
      inst.castShadow = true; inst.receiveShadow = true; g.add(inst);
      g.add(k.box(L, 0.12, 0.14, darkMat, 0, H - 0.06, z), k.box(L, 0.16, 0.14, darkMat, 0, 0.08, z));
      return g;
    };
    const back = part(longWall(-W / 2 + 0.02, -1), [0, 0, -1.2]);
    sh.userData.comp.pin = back.children[0];
    const front = part(longWall(W / 2 - 0.02, 1), [0, 0, 1.6]);
    walls.cutaway.push(front);
    const decal = k.texMat(1024, 256, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = '#0b1f4d'; c.font = '800 120px Archivo, Arial'; c.textBaseline = 'middle'; c.fillText('PUREVER', 30, 100);
      c.fillStyle = '#0098d6'; c.font = '600 34px IBM Plex Mono, monospace'; c.fillText('SWRO · CONTAINERISED DESALINATION', 34, 196);
    }, { transparent: true });
    const d1 = k.plane(3, 0.75, decal, -0.6, 1.5, -W / 2 - 0.035, Math.PI); back.add(d1);
    const d2 = k.plane(3, 0.75, decal, -0.6, 1.5, W / 2 + 0.06); front.add(d2);
    // roof
    const roof = new T.Group();
    roof.add(k.box(L, 0.06, W, shellMat, 0, H - 0.03, 0));
    [-1.6, 0, 1.6].forEach(x => { const l = k.box(1.0, 0.02, 0.08, m.led, x, H - 0.07, 0); l.castShadow = false; roof.add(l); });
    part(roof, [0, 1.6, 0]); walls.cutaway.push(roof);
    // ends
    const endA = new T.Group();
    endA.add(k.box(0.06, H - 0.1, W - 0.1, shellMat, -L / 2 + 0.03, H / 2, 0));
    endA.add(k.box(0.3, 0.55, 0.85, m.white, -L / 2 - 0.15, 1.75, -0.55));
    for (let i = 0; i < 6; i++) endA.add(k.box(0.02, 0.03, 0.75, m.dark, -L / 2 - 0.305, 1.55 + i * 0.07, -0.55));
    part(endA, [-1.2, 0, 0]);
    const endB = new T.Group();
    [-1, 1].forEach(s => {
      endB.add(k.box(0.05, H - 0.14, W / 2 - 0.08, shellMat, L / 2 - 0.03, H / 2, s * (W / 4)));
      [0.25, 0.55].forEach(f => endB.add(k.cyl(0.018, H - 0.3, m.steel, L / 2 + 0.01, H / 2, s * (W / 2 * f), 'y', 12)));
    });
    part(endB, [1.2, 0, 0]);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => fl.add(k.box(0.16, H, 0.16, darkMat, sx * (L / 2 - 0.08), H / 2, sz * (W / 2 - 0.08))));
    walls.cutaway.push(...[]);

    /* --- MMF --- */
    const mf = add({ id: 'mmf', name: 'Multimedia filters', tag: 'MMF-101/102',
      desc: 'Duplex FRP pressure filters with graded anthracite, sand and garnet beds. They bring seawater SDI below 3 before cartridge filtration and backwash automatically through multiport valves.',
      specs: [['Vessels', '2 × FRP 30" × 72"'], ['Media', 'Anthracite / sand / garnet'], ['Filtration rate', '≤ 12 m/h'], ['Backwash', 'Automatic, ΔP or timer']] }, [0, 0.9, -0.5]);
    [-2.3, -1.6].forEach(x => {
      const z = -0.55, yc = F + 0.95;
      mf.add(k.cyl(0.29, 1.3, m.mmf, x, yc, z));
      mf.add(k.sphere(0.29, m.mmf, x, yc + 0.65, z, 0.45));
      mf.add(k.sphere(0.29, m.mmf, x, yc - 0.65, z, 0.45));
      mf.add(k.cyl(0.24, 0.18, m.dark, x, F + 0.12, z));
      mf.add(k.box(0.22, 0.14, 0.2, m.black, x, yc + 0.85, z));
      mf.add(k.cyl(0.06, 0.06, m.black, x, yc + 0.95, z));
    });

    /* --- Cartridge filter --- */
    const cf = add({ id: 'cartridge', name: 'Cartridge filter', tag: 'CF-201',
      desc: 'An SS316L multi-round housing with 5 µm cartridges, the final safety barrier before the high-pressure pump.',
      specs: [['Housing', 'SS316L, 7 × 40"'], ['Rating', '5 µm absolute'], ['ΔP alarm', '0.7 bar'], ['Closure', 'Swing-bolt']] }, [0, 0.9, 0.2]);
    cf.add(k.cyl(0.15, 0.85, m.steel, -0.95, F + 0.6, -0.1));
    cf.add(k.sphere(0.15, m.steel, -0.95, F + 1.03, -0.1, 0.45));
    cf.add(k.cyl(0.165, 0.04, m.brushed, -0.95, F + 1.02, -0.1));
    [0, 2.1, 4.2].forEach(a => cf.add(k.cyl(0.015, 0.2, m.steel, -0.95 + Math.cos(a) * 0.1, F + 0.1, -0.1 + Math.sin(a) * 0.1)));

    /* --- HP pump --- */
    const hp = add({ id: 'hppump', name: 'High-pressure pump', tag: 'HPP-301',
      desc: 'A duplex stainless steel high-pressure pump driven by an 11 kW IE3 motor on a VFD. It pressurises the seawater to about 60 bar, and its wetted parts are rated for chloride service.',
      specs: [['Motor', '11 kW IE3, VFD'], ['Pressure', '55–65 bar'], ['Material', 'Super-duplex SS'], ['Protection', 'LP/HP trip, soft start']] }, [0, 0.7, 0.6]);
    hp.add(k.box(1.1, 0.08, 0.5, m.brushed, -0.1, F + 0.04, 0.35));
    hp.add(k.cyl(0.13, 0.28, m.steel, -0.45, F + 0.3, 0.35, 'x'));
    hp.add(k.cyl(0.17, 0.5, m.blue, 0.05, F + 0.3, 0.35, 'x', 20));
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; hp.add(k.box(0.42, 0.012, 0.02, m.blue, 0.05, F + 0.3 + Math.cos(a) * 0.172, 0.35 + Math.sin(a) * 0.172)); }
    hp.add(k.cyl(0.17, 0.06, m.black, 0.33, F + 0.3, 0.35, 'x'));
    hp.add(k.box(0.12, 0.1, 0.12, m.blue, 0.05, F + 0.5, 0.35));
    const coupling = k.cyl(0.06, 0.08, m.yellow, -0.27, F + 0.3, 0.35, 'x'); hp.add(coupling);

    /* --- ERD --- */
    const er = add({ id: 'erd', name: 'Isobaric energy recovery', tag: 'ERD-401',
      desc: 'A rotary pressure exchanger that transfers up to 96% of the brine’s hydraulic energy straight back to the incoming seawater. This roughly halves the specific energy.',
      specs: [['Type', 'Rotary isobaric PX'], ['Efficiency', 'up to 96%'], ['Saving', '≈ 55–60% energy'], ['Booster', 'Circulation pump 1.5 kW']] }, [0, 0.8, 0.7]);
    [0.42, 0.62].forEach(y => er.add(k.cyl(0.09, 0.9, m.white, 0.95, F + y, 0.55, 'x')));
    [0.5, 1.4].forEach(x => er.add(k.box(0.06, 0.6, 0.24, m.frame, x, F + 0.3, 0.55)));

    /* --- RO rack --- */
    const ro = add({ id: 'rorack', name: 'SWRO membrane rack', tag: 'RO-501',
      desc: 'Four 1000 psi FRP pressure vessels loaded with HydraCore SW-8040 seawater elements, which give 99.75% salt rejection. The rack is mounted on an epoxy-coated frame with Victaulic manifolds.',
      specs: [['Vessels', '4 × FRP 8", 1000 psi'], ['Elements', 'HydraCore SW-8040'], ['Rejection', '99.75%'], ['Recovery', '40–45%']] }, [0, 1.0, -0.4]);
    const vys = [0.55, 0.85, 1.15, 1.45], zR = -0.72;
    const swLbl = k.texMat(512, 160, (c, w, h) => drawLogo(c, w, h, 'HydraCore SW-8040'));
    vys.forEach(y => {
      ro.add(k.cyl(0.11, 2.2, m.frp, 1.25, F + y, zR, 'x', 36));
      [0.12, 2.38].forEach(x => ro.add(k.cyl(0.125, 0.07, m.cap, x, F + y, zR, 'x', 36)));
      ro.add(k.plane(0.4, 0.12, swLbl, 1.25, F + y, zR + 0.112));
    });
    [0.35, 1.25, 2.15].forEach(x => ro.add(k.box(0.05, 1.45, 0.05, m.dark, x, F + 0.85, zR - 0.15)));
    ro.add(k.box(2.4, 0.05, 0.3, m.dark, 1.25, F + 0.3, zR));

    /* --- CIP --- */
    const ci = add({ id: 'cip', name: 'CIP cleaning system', tag: 'CIP-601',
      desc: 'A clean-in-place tank with a heater, cartridge filter and circulation pump. It restores membrane performance with periodic low- and high-pH chemical cleans.',
      specs: [['Tank', '500 L HDPE + heater'], ['Pump', '2.2 kW, SS316'], ['Cleaning', 'Low/high pH cycles'], ['Interval', 'Typically 3–6 months']] }, [0.4, 0.8, 0.6]);
    ci.add(k.cyl(0.36, 0.95, m.tank, 2.45, F + 0.5, 0.6));
    ci.add(k.cyl(0.22, 0.04, m.dark, 2.45, F + 1.0, 0.6));
    ci.add(k.cyl(0.07, 0.25, m.blue, 1.95, F + 0.2, 0.85, 'x'));

    /* --- Dosing --- */
    const ds = add({ id: 'dosing', name: 'Chemical dosing skid', tag: 'DS-701/703',
      desc: 'Three dosing stations for antiscalant, sodium metabisulphite (dechlorination) and pH correction. Each has a digital diaphragm pump and a level switch.',
      specs: [['Tanks', '3 × 60 L PE'], ['Pumps', 'Digital diaphragm'], ['Control', '4–20 mA, flow-paced'], ['Chemicals', 'AS · SMBS · pH']] }, [0, 0.8, 0.7]);
    [[1.0, 0x19c3ff], [1.35, 0xffb547], [1.7, 0x2fe39a]].forEach(([x, col]) => {
      const tm = k.track(new T.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.4, transparent: true, opacity: 0.55 }));
      ds.add(k.cyl(0.14, 0.5, tm, x, F + 0.25, 0.92));
      const lm = k.track(new T.MeshStandardMaterial({ color: col, roughness: 0.3, emissive: col, emissiveIntensity: 0.15 }));
      ds.add(k.cyl(0.12, 0.3, lm, x, F + 0.16, 0.92));
      ds.add(k.box(0.12, 0.1, 0.1, m.blue, x, F + 0.56, 0.92));
    });

    /* --- MCC --- */
    const mc = add({ id: 'mcc', name: 'MCC & PLC control cabinet', tag: 'MCC-001',
      desc: 'A motor control centre with VFDs, PLC, a 10" HMI and a 4G/LTE gateway for PUREVER remote monitoring, so engineers can see every sensor from anywhere.',
      specs: [['PLC', 'Siemens / Allen-Bradley'], ['HMI', '10" touchscreen'], ['Telemetry', '4G/LTE, cloud SCADA'], ['Supply', '400 V / 3 ph / 50 Hz']] }, [-0.6, 0.4, 0.5]);
    mc.add(k.box(0.45, 1.9, 0.8, m.white, -2.72, F + 0.95, 0.6));
    const hmi = k.texMat(320, 250, drawHMI('4,170'), { emissive: 0xffffff, emissiveIntensity: 0.55 }); hmi.emissiveMap = hmi.map;
    mc.add(k.plane(0.3, 0.24, hmi, -2.493, F + 1.35, 0.6, Math.PI / 2));
    const mled = k.cyl(0.015, 0.02, m.green, -2.49, F + 1.1, 0.4, 'x'); mc.add(mled); k.pulsers.push(mled);
    mc.add(k.plane(0.3, 0.075, k.texMat(400, 100, (c, w, h) => drawLogo(c, w, h)), -2.493, F + 1.6, 0.6, Math.PI / 2));

    /* --- Piping --- */
    const pp = add({ id: 'piping', name: 'Process piping', tag: 'PIPING',
      desc: 'Duplex stainless high-pressure manifolds with PVC-U low-pressure and brine lines. Seawater enters through the end wall; permeate and brine leave through flanged bulkheads.',
      specs: [['HP lines', 'Super-duplex SS, 80 bar'], ['LP lines', 'PVC-U PN16'], ['Permeate', 'PVC-U, food grade'], ['Streams', 'Feed · HP · Permeate · Brine']] });
    const rp = 0.035;
    k.pipe(pp, [[-L / 2, 2.25, -0.1], [-2.3, 2.25, -0.1], [-2.3, 2.25, -0.55], [-2.3, F + 1.98, -0.55]], rp, m.pvc, 'feed');
    k.pipe(pp, [[-2.3, 2.25, -0.1], [-1.6, 2.25, -0.1], [-1.6, 2.25, -0.55], [-1.6, F + 1.98, -0.55]], rp, m.pvc, 'feed');
    k.pipe(pp, [[-2.3, F + 0.3, -0.55], [-2.3, F + 0.3, -0.1], [-1.1, F + 0.3, -0.1]], rp, m.pvc, 'feed');
    k.pipe(pp, [[-1.6, F + 0.3, -0.55], [-1.6, F + 0.3, -0.1]], rp, m.pvc, 'feed');
    k.pipe(pp, [[-0.8, F + 0.3, -0.1], [-0.7, F + 0.3, -0.1], [-0.7, F + 0.3, 0.35], [-0.59, F + 0.3, 0.35]], rp, m.pvc, 'feed');
    k.pipe(pp, [[-0.45, F + 0.43, 0.35], [-0.45, F + 1.0, 0.35], [-0.45, F + 1.0, zR], [0.0, F + 1.0, zR]], rp * 0.85, m.steel, 'hp');
    k.pipe(pp, [[0.0, F + vys[0], zR], [0.0, F + vys[3], zR]], rp * 0.85, m.steel, 'hp');
    vys.forEach(y => k.pipe(pp, [[0.0, F + y, zR], [0.08, F + y, zR]], rp * 0.8, m.steel, 'hp'));
    vys.forEach(y => k.pipe(pp, [[2.42, F + y - 0.05, zR], [2.42, F + y - 0.05, zR - 0.22]], rp * 0.8, m.steel, 'conc'));
    k.pipe(pp, [[2.42, F + vys[0] - 0.05, zR - 0.22], [2.42, F + 1.85, zR - 0.22], [2.42, F + 1.85, 0.55], [1.45, F + 1.85, 0.55], [1.45, F + 0.62, 0.55]], rp * 0.85, m.steel, 'conc');
    k.pipe(pp, [[0.45, F + 0.42, 0.55], [0.3, F + 0.42, 0.55], [0.3, F + 0.1, 0.55], [0.3, F + 0.1, 1.1], [L / 2, F + 0.1, 1.1]], rp, m.pvc, 'conc');
    vys.forEach(y => k.pipe(pp, [[2.42, F + y, zR], [2.62, F + y, zR]], rp * 0.7, m.perm, 'perm'));
    k.pipe(pp, [[2.62, F + vys[0], zR], [2.62, 2.25, zR], [L / 2, 2.25, zR]], rp * 0.8, m.perm, 'perm');

    return { comps, explodables, walls };
  }

  window.PV3D = { MODELS };
})();
