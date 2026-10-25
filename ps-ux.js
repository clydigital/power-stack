/* Shared visual navigation for Power Stack. No market-data, score or trade mutations. */
(() => {
  'use strict';
  const file = window.location.pathname.split('/').pop() || 'index.html';
  const pages = [
    {file:'index.html',title:'Decision desk',icon:'home',description:'Portfolio decisions and capital plan'},
    {file:'research-library.html',title:'Full library',icon:'library',description:'Research universe, scores and source history'},
    {file:'holdings.html',title:'Holdings',icon:'wallet',description:'What you own, why, and when to reduce risk'},
    {file:'watchlist.html',title:'Watchlist',icon:'list',description:'What qualifies for an entry and what does not'},
    {file:'themes.html',title:'Themes',icon:'layers',description:'Market stories and company transmission'},
    {file:'motion.html',title:'Market motion',icon:'activity',description:'Canonical catalysts from Live Desk'},
    {file:'capital-scarcity.html',title:'Rates & capital',icon:'chart',description:'Financing pressure and capital ranking'}
  ];
  const current = pages.find(p => p.file === file);
  if (!current) return;
  const paths = {
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    library:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M8 7h8M8 11h6"/>',
    wallet:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M16 14h2"/>',
    list:'<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
    layers:'<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
    activity:'<path d="M2 12h4l3-8 5 16 3-8h5"/>',
    chart:'<path d="M3 21h18M5 17V9M11 17V4M17 17v-6"/>',
    shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  };
  const svg = name => '<svg class="ps-icon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (paths[name] || paths.compass) + '</svg>';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const iconForLink = link => {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) {
      if (/portfolio|next-moves/.test(href)) return 'wallet';
      if (/investment-plan|opportunit/.test(href)) return 'chart';
      if (/market/.test(href)) return 'activity';
      return null;
    }
    try {
      const target = new URL(href, window.location.href);
      if (target.origin !== window.location.origin) return null;
      return pages.find(p => p.file === (target.pathname.split('/').pop() || 'index.html'))?.icon || null;
    } catch (err) { return null; }
  };
  function decorateLink(link) {
    if (link.querySelector('.ps-icon')) return;
    const symbol = iconForLink(link);
    if (!symbol) return;
    const navText = link.querySelector('.nav-top > span');
    if (navText) {
      navText.insertAdjacentHTML('afterbegin', svg(symbol));
      navText.classList.add('ps-link-icon-text');
    } else {
      link.insertAdjacentHTML('afterbegin', svg(symbol));
      link.classList.add('ps-link-with-icon');
    }
  }
  document.querySelectorAll('header nav a, .top-actions a, .themes-actions a, .motion-actions a, .side-scroll a.nav-item, .nav a').forEach(decorateLink);
  if (file === 'index.html') {
    document.body.classList.add('ps-front-icons');
    [
      ['#next-moves .adv-title-row h2','compass'],
      ['#investment-plan .adv-title-row h2','chart'],
      ['#opportunities .adv-title-row h2','layers'],
      ['#portfolio-review .adv-title-row h2','wallet'],
      ['#market-summary .adv-title-row h2','activity']
    ].forEach(([selector,name]) => {
      const heading = document.querySelector(selector);
      if (heading && !heading.querySelector('.ps-icon')) {
        heading.insertAdjacentHTML('afterbegin',svg(name));
        heading.classList.add('ps-icon-heading');
      }
    });
    return;
  }
  document.body.classList.add('ps-deep-ux');
  const main = document.querySelector('.main-content, .themes-main, .motion-main, main.scarcity');
  if (!main) return;
  const guide = {
    'research-library.html':'This is the full historical universe, not a live buy list. Scores show research quality; prices, funding and source dates determine whether an idea is actionable.',
    'holdings.html':'Start with conditional sell/trim explanations. Check current broker holdings and issuer evidence before changing size. A review label never means an order was placed.',
    'watchlist.html':'Priority is not permission to buy. Each candidate needs an entry price, business proof, and an invalidation condition. Older market quotes can be stale.',
    'themes.html':'Read the transmission from event to business profit first. Themes suggest what to research; company financials and price determine investment decisions.',
    'motion.html':'Events shown here come from Live Desk promotion. A new catalyst is a research lead, not independent proof that a stock should be traded.',
    'capital-scarcity.html':'The rate and funding regime is context, not a portfolio order. Check as-of dates and issuer evidence before extrapolating price or financing effects.'
  };
  const nav = document.createElement('div');
  nav.className = 'ps-research-navigator';
  nav.innerHTML = '<div class="ps-research-context"><span class="ps-context-kicker">RESEARCH WORKSPACE</span><span class="ps-context-location">' + svg(current.icon) + esc(current.title) + '</span><span class="ps-context-description">' + esc(current.description) + '</span></div>' +
    '<nav class="ps-view-switch" aria-label="Switch Power Stack research page">' +
    pages.map(p => '<a href="' + p.file + '"' + (p.file===file?' aria-current="page"':'') + '>' + svg(p.icon) + '<span>' + esc(p.title) + '</span></a>').join('') + '</nav>' +
    '<details class="ps-reading-guide"><summary>' + svg('compass') + ' How to read this page</summary><p>' + esc(guide[file]) + '</p></details>';
  main.prepend(nav);
  const editorialIcons = {
    'research-library.html': [['#bondWatchHome h2','chart'],['#marketMotionHome h2','activity']],
    'holdings.html': [['.topbar h1','wallet']],
    'watchlist.html': [['.topbar h1','list']],
    'themes.html': [['.themes-top h1','layers']],
    'motion.html': [['.motion-top h1','activity']],
    'capital-scarcity.html': [['.top h1','chart']]
  };
  for (const [selector,name] of editorialIcons[file] || []) {
    const heading = document.querySelector(selector);
    if (heading && !heading.querySelector('.ps-icon')) {
      heading.insertAdjacentHTML('afterbegin',svg(name));
      heading.classList.add('ps-icon-heading');
    }
  }
  if (file !== 'holdings.html') return;

  const section = document.createElement('section');
  section.id = 'ps-holdings-action-brief';
  section.className = 'ps-holdings-action-brief';
  section.setAttribute('aria-labelledby','ps-holdings-brief-title');
  section.innerHTML = '<div class="ps-action-brief-head"><div><span class="ps-context-kicker">ACTION CLARITY</span><h2 id="ps-holdings-brief-title">' + svg('shield') + ' What the portfolio reviews actually mean</h2><p>Proposed exit or size limits, not placed orders. Current Rakuten holdings and buying power are not reconciled.</p></div><a href="index.html#portfolio-review">See client summary</a></div><div id="ps-holdings-action-cards" class="ps-action-brief-grid"><p class="ps-loading">Loading dated holding instructions…</p></div>';
  nav.insertAdjacentElement('afterend',section);
  fetch('data/client-advisor.json',{cache:'no-store'}).then(response => {
    if (!response.ok) throw Error('Advisor HTTP ' + response.status);
    return response.json();
  }).then(data => {
    if (!Array.isArray(data?.legacyActions)) throw Error('Missing portfolio actions');
    const cards = section.querySelector('#ps-holdings-action-cards');
    cards.innerHTML = data.legacyActions.map(item =>
      '<article class="ps-holding-explainer">' +
        '<div class="ps-holding-explainer-top"><strong>' + esc(item.ticker) + '</strong><span>' + esc(item.action) + '</span></div>' +
        '<p class="ps-holding-verdict">' + esc(item.plainAction || item.why) + '</p>' +
        '<div class="ps-holding-target">' + svg('chart') + '<span>' + esc(item.target || 'Position sizing requires verified holdings.') + '</span></div>' +
        '<dl><div><dt>Act only if</dt><dd>' + esc(item.trigger || item.gate) + '</dd></div>' +
        '<div><dt>Check first</dt><dd>' + esc(item.nextStep || item.gate) + '</dd></div></dl>' +
        '<details><summary>Why, and when not to act</summary><p>' + esc(item.why) + '</p><p><strong>Keep instead:</strong> ' + esc(item.holdInstead || 'Keep under review until supported by current evidence.') + '</p><small>' + esc(item.reviewAsOf || '') + '</small></details>' +
      '</article>'
    ).join('');
  }).catch(() => {
    const cards = section.querySelector('#ps-holdings-action-cards');
    cards.textContent = 'Detailed instructions unavailable. Do not act on archived labels; verify the current broker position and issuer evidence.';
  });
})();