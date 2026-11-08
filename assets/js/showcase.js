/* ==========================================================================
   PUREVER — Home page product range showcase
   Drives the turntable viewer, range tabs and spec strip.
   ========================================================================== */
(function () {
  const stage = document.querySelector('[data-pv3d="showcase"]');
  const tabs = document.getElementById('scTabs');
  if (!stage || !tabs || !window.PV3D) return;
  const M = window.PV3D.MODELS;
  const order = ['c500', 'c1000', 'c2000', 'swro'];
  const label = { c500: 'Commercial', c1000: 'Commercial', c2000: 'Industrial', swro: 'Containerised' };
  const pick = ['Membranes', 'Recovery', 'HP pump', 'Energy', 'Feed TDS', 'Footprint', 'Container'];
  const arrow = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
  let current = stage.dataset.model || 'c1000';

  tabs.innerHTML = order.map(k => `
    <button role="tab" data-k="${k}" aria-selected="${k === current}" class="${k === current ? 'on' : ''}">
      <span class="t-cap">${M[k].cap}<small>${M[k].unit}</small></span>
      <span class="t-name">${M[k].sku} · ${label[k]}</span>
    </button>`).join('');

  function render(k) {
    const m = M[k];
    document.getElementById('scSku').textContent = m.sku;
    document.getElementById('scCap').textContent = `${m.cap} ${m.unit}`;
    const kv = m.kv.filter(([key]) => pick.includes(key)).slice(0, 4);
    document.getElementById('scSpecs').innerHTML = kv.map(([key, v]) => `<div><dt>${key}</dt><dd>${v}</dd></div>`).join('');
    const link = document.getElementById('scLink');
    link.href = 'ro-systems.html?model=' + k;
    link.innerHTML = `Explore the ${m.sku} ${arrow}`;
    tabs.querySelectorAll('button').forEach(b => { const on = b.dataset.k === k; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  }

  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.dataset.k === current) return;
    current = b.dataset.k;
    render(current);
    if (stage.__pv) {
      stage.classList.add('swap');
      setTimeout(() => { stage.__pv.load(current, true); stage.classList.remove('swap'); }, 220);
    }
  });
  render(current);
})();
