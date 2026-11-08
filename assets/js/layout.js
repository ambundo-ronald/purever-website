/* ==========================================================================
   PUREVER — Shared header & footer (edit navigation here, once, for all pages)
   ========================================================================== */
(function () {
  /* ------------------------------------------------------------------
     CONTACT DETAILS: single source of truth for the whole site.
     DEMO VALUES: replace with real details before going live.
     (+44 20 7946 0xxx is an Ofcom-reserved drama range: it never rings.)
     ------------------------------------------------------------------ */
  const C = window.PV_CONTACT = {
    company: 'PUREVER Ltd',
    street: 'PUREVER House, 25 Westferry Circus',
    area: 'Canary Wharf',
    city: 'London',
    postcode: 'E14 8RR',
    country: 'United Kingdom',
    phone: '+44 20 7946 0123',
    whatsapp: '+44 20 7946 0123',
    email: 'hello@purever.co.uk',
    salesEmail: 'sales@purever.co.uk',
    partnerEmail: 'partners@purever.co.uk',
    serviceEmail: 'service@purever.co.uk',
    hours: 'Mon–Fri · 08:30–17:30 GMT',
    lat: 51.5055, lon: -0.0275,
    regional: [
      { name: 'East Africa office', street: 'Westlands', city: 'Nairobi', country: 'Kenya', email: 'nairobi@purever.co.uk' },
    ],
  };
  const tel = (n) => 'tel:' + n.replace(/[^\d+]/g, '');
  const wa = (n) => 'https://wa.me/' + n.replace(/\D/g, '');
  const addr1 = `${C.street}, ${C.area}`;
  const addrFull = `${C.street}, ${C.area}, ${C.city} ${C.postcode}, ${C.country}`;
  const mapsLink = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(addrFull);

  const PAGES = [
    { href: 'ro-systems.html', n: 'RO Systems', k: 'ro' },
    { href: 'products.html', n: 'Products', k: 'products' },
    { href: 'simulator.html', n: 'Simulator', k: 'simulator' },
    { href: 'industries.html', n: 'Industries', k: 'industries' },
    { href: 'about.html', n: 'About', k: 'about' },
    { href: 'contact.html', n: 'Contact', k: 'contact' },
  ];
  const current = document.body.dataset.page || 'home';
  const arrow = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
  const logo = `
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <defs><linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0050c8"/><stop offset="1" stop-color="#00a3e0"/></linearGradient></defs>
      <path d="M24 3 C24 3 9 19.5 9 30 a15 15 0 0 0 30 0 C39 19.5 24 3 24 3Z" fill="none" stroke="url(#lg1)" stroke-width="3"/>
      <path d="M16 31 h16 M18.5 25 h11 M16 37 h16" stroke="url(#lg1)" stroke-width="2.6" stroke-linecap="round"/>
    </svg>
    <span><span class="wordmark">PUREVER</span><span class="sub">WATER ENGINEERING · UK</span></span>`;

  const header = `
  <div class="topbar">
    <div class="container">
      <div class="tb-left">
        <span><i class="dot"></i>Global HQ · ${C.city}, ${C.country}</span>
        <span>${C.hours}</span>
      </div>
      <div class="tb-right">
        <a href="about.html#global">Find a partner</a>
        <a href="mailto:${C.email}">${C.email}</a>
        <a href="${tel(C.phone)}" class="tb-phone">${C.phone}</a>
      </div>
    </div>
  </div>
  <nav class="nav" id="nav">
    <div class="container">
      <a href="index.html" class="logo" aria-label="PUREVER home">${logo}</a>
      <ul class="nav-links">
        ${PAGES.filter(p => p.k !== 'contact').map(p => `<li><a href="${p.href}" class="${p.k === current ? 'active' : ''}">${p.n}</a></li>`).join('')}
      </ul>
      <div class="nav-cta">
        <a href="contact.html" class="btn btn-primary">Request a quote ${arrow}</a>
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu" aria-expanded="false">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h14M3 10h14M3 14h14"/></svg>
        </button>
      </div>
    </div>
  </nav>
  <div class="mobile-menu" id="mobileMenu">
    <a href="index.html">Home</a>
    ${PAGES.map(p => `<a href="${p.href}">${p.n}</a>`).join('')}
    <a href="contact.html" class="btn btn-primary">Request a quote</a>
  </div>`;

  const footer = `
  <footer>
    <div class="container">
      <div class="foot-grid">
        <div class="foot-brand">
          <a href="index.html" class="logo">${logo.replace(/<defs>.*<\/defs>/s, '')}</a>
          <p>Reverse osmosis, filtration and disinfection engineering for a water-secure world. Headquartered in the United Kingdom and partnering across five continents.</p>
          <address class="foot-contact">
            <a href="${mapsLink}" target="_blank" rel="noopener">${C.street}<br>${C.area}, ${C.city} ${C.postcode}<br>${C.country}</a>
            <a href="${tel(C.phone)}"><b>T</b> ${C.phone}</a>
            <a href="mailto:${C.email}"><b>E</b> ${C.email}</a>
            <span><b>H</b> ${C.hours}</span>
          </address>
          <div class="socials">
            <a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.5c0-1.3-.02-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9V21H9z"/></svg></a>
            <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.75 15.02V8.98L15.5 12z"/></svg></a>
            <a href="#" aria-label="X"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23 22h-6.3l-4.9-6.4L6.2 22H3.1l7.3-8.3L1 2h6.4l4.4 5.8zm-1.1 18h1.7L6.3 3.9H4.5z"/></svg></a>
          </div>
        </div>
        <div><h6>RO Systems</h6><ul><li><a href="ro-systems.html?model=c500">PV-C 500 LPH</a></li><li><a href="ro-systems.html?model=c1000">PV-C 1000 LPH</a></li><li><a href="ro-systems.html?model=c2000">PV-C 2000 LPH</a></li><li><a href="ro-systems.html?model=swro">Containerised SWRO</a></li></ul></div>
        <div><h6>Products</h6><ul><li><a href="products.html">Membranes &amp; vessels</a></li><li><a href="products.html">Filtration</a></li><li><a href="products.html">UV disinfection</a></li><li><a href="products.html">Instrumentation</a></li></ul></div>
        <div><h6>Company</h6><ul><li><a href="about.html">About PUREVER</a></li><li><a href="about.html#global">Global network</a></li><li><a href="about.html#sustainability">Sustainability</a></li><li><a href="industries.html">Industries &amp; projects</a></li></ul></div>
        <div><h6>Resources</h6><ul><li><a href="simulator.html">RO Simulator</a></li><li><a href="ro-systems.html">3D configurator</a></li><li><a href="#">Datasheets</a></li><li><a href="contact.html">Contact &amp; quotes</a></li></ul></div>
      </div>
      <div class="foot-bottom">
        <span>© ${new Date().getFullYear()} PUREVER Ltd. Registered in England &amp; Wales.</span>
        <div class="links"><a href="#">Privacy</a><a href="#">Cookies</a><a href="#">Terms</a><a href="#">Modern Slavery Statement</a><a href="#">Accessibility</a></div>
      </div>
    </div>
  </footer>`;

  const h = document.getElementById('site-header');
  if (h) h.outerHTML = header;

  // structured data so search engines can show address, phone and hours
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Organization', name: 'PUREVER', legalName: C.company,
    url: location.origin + location.pathname.replace(/[^/]*$/, ''), email: C.email, telephone: C.phone,
    address: { '@type': 'PostalAddress', streetAddress: C.street, addressLocality: C.city, postalCode: C.postcode, addressCountry: 'GB' },
    contactPoint: [{ '@type': 'ContactPoint', telephone: C.phone, contactType: 'sales', areaServed: 'Worldwide', availableLanguage: 'English' }],
  });
  document.head.appendChild(ld);
  const putFooter = () => {
    const f = document.getElementById('site-footer'); if (f) f.outerHTML = footer;
    // fill any [data-c] placeholders on the page (e.g. contact page)
    const val = {
      company: C.company, addr1, addrFull, city: `${C.city} ${C.postcode}`, country: C.country,
      phone: C.phone, email: C.email, salesEmail: C.salesEmail, partnerEmail: C.partnerEmail, serviceEmail: C.serviceEmail, hours: C.hours,
    };
    const href = { phone: tel(C.phone), email: 'mailto:' + C.email, salesEmail: 'mailto:' + C.salesEmail, partnerEmail: 'mailto:' + C.partnerEmail, serviceEmail: 'mailto:' + C.serviceEmail, maps: mapsLink, whatsapp: wa(C.whatsapp) };
    document.querySelectorAll('[data-c]').forEach(el => { if (val[el.dataset.c] != null) el.textContent = val[el.dataset.c]; });
    document.querySelectorAll('[data-link]').forEach(el => { if (href[el.dataset.link]) el.href = href[el.dataset.link]; });
    const map = document.getElementById('officeMap');
    if (map) {
      const d = 0.012;
      map.src = `https://www.openstreetmap.org/export/embed.html?bbox=${C.lon - d * 1.6},${C.lat - d},${C.lon + d * 1.6},${C.lat + d}&layer=mapnik&marker=${C.lat},${C.lon}`;
    }
    const reg = document.getElementById('regionalOffices');
    if (reg) reg.innerHTML = C.regional.map(r => `<div class="office-mini"><h5>${r.name}</h5><p>${r.street}, ${r.city}<br>${r.country}<br><a href="mailto:${r.email}">${r.email}</a></p></div>`).join('');
    // floating WhatsApp button
    if (C.whatsapp && !document.querySelector('.wa-float')) {
      const a = document.createElement('a');
      a.className = 'wa-float'; a.href = wa(C.whatsapp); a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', 'Chat with PUREVER on WhatsApp');
      a.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3a.4.4 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg><span>WhatsApp us</span>';
      document.body.appendChild(a);
    }
  };
  if (document.getElementById('site-footer')) putFooter();
  else document.addEventListener('DOMContentLoaded', putFooter);
})();
