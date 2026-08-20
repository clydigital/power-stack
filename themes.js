(() => {
  const list = document.getElementById('themeList');
  const count = document.getElementById('themeCount');
  const updated = document.getElementById('themesUpdated');

  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const directionClass = (direction = '') => {
    const d = direction.toLowerCase();
    if (d.includes('strength') || d.includes('accelerat')) return 'strong';
    if (d.includes('speculative') || d.includes('elevated') || d.includes('tactical')) return 'warn';
    return '';
  };

  const renderNews = (items = []) => items.length
    ? items.map(item => `
      <article class="news-item">
        <div class="news-date">${esc(item.date || '')}</div>
        <a class="news-title" href="${esc(item.url || item.source || '#')}" target="_blank" rel="noopener">${esc(item.title || item.headline || 'Untitled')}</a>
        <div class="news-source">${esc(item.publisher || item.sourceLabel || item.sourceName || (item.url ? item.source || '' : ''))}</div>
        ${item.implication ? `<div class="news-implication">${esc(item.implication)}</div>` : ''}
      </article>`).join('')
    : '<div class="news-implication">No material news link recorded yet.</div>';

  const renderChips = (items = [], cls = 'ticker-chip') => items.length
    ? items.map(item => `<span class="${cls}">${esc(typeof item === 'string' ? item : item.ticker || item.name || '')}</span>`).join('')
    : '<span class="watch-chip">None recorded</span>';

  const renderTheme = theme => `
    <article class="theme-card" id="${esc(theme.id || '')}">
      <div class="theme-head">
        <div>
          <div class="theme-title">${esc(theme.name || 'Theme')}</div>
          <div class="theme-status">
            <span class="theme-pill ${directionClass(theme.direction)}">${esc(theme.direction || 'monitoring')}</span>
            <span class="theme-pill">${esc(theme.status || 'Researching')}</span>
          </div>
          <div class="theme-copy">${esc(theme.summary || '')}</div>
        </div>
        <div class="theme-updated">Last updated<br><strong>${esc(theme.lastUpdated || '—')}</strong></div>
      </div>
      ${theme.whyDeveloping ? `<div class="theme-why"><strong>Why it is developing:</strong> ${esc(theme.whyDeveloping)}</div>` : ''}
      <div class="theme-grid">
        <div class="theme-panel">
          <h3>Main news + implications</h3>
          ${renderNews(theme.mainNews)}
        </div>
        <div class="theme-panel">
          <h3>Power Stack exposure</h3>
          <div class="ticker-cloud">${renderChips(theme.powerStackTickers)}</div>
          ${Array.isArray(theme.researchCandidates) && theme.researchCandidates.length ? `
            <h3 style="margin-top:14px">Research candidates</h3>
            <div class="ticker-cloud">${renderChips(theme.researchCandidates)}</div>` : ''}
          <h3 style="margin-top:14px">Watch next</h3>
          <div class="watch-cloud">${renderChips(theme.watch, 'watch-chip')}</div>
        </div>
      </div>
    </article>`;

  Promise.all([
    fetch('data/developing-themes.json', { cache: 'no-store' }).then(res => {
      if (!res.ok) throw new Error(`Theme feed HTTP ${res.status}`);
      return res.json();
    }),
    fetch('data/water-cooling-research.json', { cache: 'no-store' }).then(res => res.ok ? res.json() : null).catch(() => null)
  ])
    .then(([data, water]) => {
      const themes = Array.isArray(data?.themes) ? data.themes.map(theme => ({ ...theme })) : [];

      if (water) {
        const waterTheme = themes.find(theme => theme.id === 'water-cooling');
        if (waterTheme) {
          const candidateTickers = Array.isArray(water.newResearchCandidates)
            ? water.newResearchCandidates.map(x => x.ticker).filter(Boolean)
            : [];
          const freshNews = Array.isArray(water.currentThemeNews)
            ? water.currentThemeNews.map(item => ({
                date: item.date,
                title: item.headline,
                url: item.source,
                publisher: 'Current research',
                implication: item.implication
              }))
            : [];
          waterTheme.researchCandidates = [...new Set([...(waterTheme.researchCandidates || []), ...candidateTickers])];
          waterTheme.mainNews = [...freshNews, ...(waterTheme.mainNews || [])];
          waterTheme.lastUpdated = water.lastUpdated || waterTheme.lastUpdated;
          waterTheme.summary = water.themeRead || waterTheme.summary;
        }
      }

      count.textContent = themes.length;
      updated.textContent = data?.lastUpdated || water?.lastUpdated || '—';
      list.innerHTML = themes.length
        ? themes.map(renderTheme).join('')
        : '<div class="empty-themes">No developing themes are currently recorded.</div>';
    })
    .catch(err => {
      console.error('Developing themes load failed', err);
      list.innerHTML = '<div class="empty-themes">Unable to load the thematic research feed.</div>';
    });
})();
