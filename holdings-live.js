(() => {
  const MAX_MACRO_PACKET_HOURS = 168;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const parseMs = v => { const ms = Date.parse(v || ''); return Number.isFinite(ms) ? ms : null; };
  const ageHours = v => { const ms = parseMs(v); return ms === null ? Infinity : (Date.now() - ms) / 36e5; };
  const ageDays = v => ageHours(v) / 24;
  const fmtSigned = (v, d = 2) => `${Number(v || 0) > 0 ? '+' : ''}${Number(v || 0).toFixed(d)}`;

  const maxByComponent = {
    'Earnings & cash generation': 25,
    'Balance sheet': 20,
    'Business quality': 20,
    'Growth trajectory': 15,
    'Valuation': 20
  };

  let macroContext = null;
  let macroSensitivityData = null;
  let holdingsContext = null;
  let themes = [];
  let macroProfiles = new Map();

  function packetFresh() {
    if (!macroContext) return false;
    const max = Number(macroContext.packetStaleAfterHours || MAX_MACRO_PACKET_HOURS);
    return ageHours(macroContext.generatedAt) <= max;
  }

  function channelContext(key) {
    return macroContext?.channels?.find(c => c.key === key) || null;
  }

  function channelFresh(c) {
    if (!c || !packetFresh() || c.fresh === false) return false;
    const max = Number(c.staleAfterHours || macroContext.packetStaleAfterHours || MAX_MACRO_PACKET_HOURS);
    return ageHours(c.observedAt || macroContext.generatedAt) < max;
  }

  function freshnessWeight(c) {
    if (!channelFresh(c)) return 0;
    const max = Number(c.staleAfterHours || macroContext.packetStaleAfterHours || MAX_MACRO_PACKET_HOURS);
    return clamp(1 - .35 * (ageHours(c.observedAt || macroContext.generatedAt) / max), .65, 1);
  }

  function buildMacroProfiles() {
    const canonical = Array.isArray(macroSensitivityData?.stocks) ? macroSensitivityData.stocks : [];
    const fallback = Array.isArray(holdingsContext?.fallbackMacroProfiles) ? holdingsContext.fallbackMacroProfiles : [];
    macroProfiles = new Map(fallback.map(p => [p.ticker, p]));
    canonical.forEach(p => macroProfiles.set(p.ticker, p));
  }

  function macroContributions(holding) {
    const p = macroProfiles.get(holding.ticker);
    if (!p || !packetFresh()) return [];
    const fw = Number(p.fundamentalWeight ?? macroSensitivityData?.fundamentalWeight ?? .65);
    const mw = Number(p.marketWeight ?? macroSensitivityData?.marketWeight ?? .35);
    const pc = clamp(Number(p.profileConfidence ?? .5), 0, 1);
    let rows = [];

    Object.entries(p.factors || {}).forEach(([key, f]) => {
      const c = channelContext(key);
      if (!c || !channelFresh(c) || Number(f.weight || 0) <= 0) return;
      const fundamental = clamp(Number(f.fundamental || 0), -5, 5);
      const market = clamp(Number(f.market || 0), -5, 5);
      const effective = (fw * fundamental + mw * market) / 5;
      const freshW = freshnessWeight(c);
      const factorC = clamp(Number(f.confidence ?? .5), 0, 1);
      const channelC = clamp(Number(c.confidence ?? .5), 0, 1);
      const adjustment = (Number(c.score || 0) / 2) * effective * Number(f.weight || 0) * factorC * pc * channelC * freshW;
      if (Math.abs(adjustment) < .00005) return;
      rows.push({
        key,
        label: c.label || key,
        regime: c.regime || '',
        interpretation: c.interpretation || '',
        adjustment,
        rationale: f.rationale || '',
        observedAt: c.observedAt || macroContext.generatedAt
      });
    });

    const sum = rows.reduce((s, r) => s + r.adjustment, 0);
    const clipped = clamp(sum, -1, 1);
    if (Math.abs(sum) > 1 && Math.abs(sum) > .0001) {
      const scale = clipped / sum;
      rows = rows.map(r => ({...r, adjustment: r.adjustment * scale}));
    }
    return rows.sort((a, b) => Math.abs(b.adjustment) - Math.abs(a.adjustment));
  }

  function macroAdjustment(holding) {
    return clamp(macroContributions(holding).reduce((s, r) => s + Number(r.adjustment || 0), 0), -1, 1);
  }

  function applyResearchOverlay(baseThemes, overlay) {
    if (!overlay) return;
    const additions = overlay.candidateAdds && typeof overlay.candidateAdds === 'object' ? overlay.candidateAdds : {};
    Object.entries(additions).forEach(([themeId, tickers]) => {
      const theme = baseThemes.find(item => item.id === themeId);
      if (!theme || !Array.isArray(tickers)) return;
      theme.researchCandidates = [...new Set([...(theme.researchCandidates || []), ...tickers])];
      theme.lastUpdated = overlay.lastUpdated || theme.lastUpdated;
    });
    if (Array.isArray(overlay.newThemes)) {
      overlay.newThemes.forEach(theme => {
        if (!theme?.id || baseThemes.some(item => item.id === theme.id)) return;
        baseThemes.push({...theme});
      });
    }
  }

  function directionSignal(direction = '') {
    const text = direction.toLowerCase();
    const map = holdingsContext?.themePolicy?.directionSignals || {};
    let signal = 0;
    Object.entries(map).forEach(([needle, value]) => {
      if (text.includes(needle)) signal = Number(value);
    });
    if (text.includes('riskier') && signal > 0) signal *= .75;
    if (text.includes('mixed')) signal *= .5;
    return clamp(signal, -1, 1);
  }

  function statusWeight(status = '') {
    const text = status.toLowerCase();
    const weights = holdingsContext?.themePolicy?.statusWeights || {};
    for (const [needle, weight] of Object.entries(weights)) {
      if (needle !== 'default' && text.includes(needle)) return Number(weight);
    }
    return Number(weights.default ?? .75);
  }

  function themeFreshness(theme) {
    const maxDays = Number(holdingsContext?.themePolicy?.maxAgeDays || 30);
    const age = ageDays(theme.lastUpdated);
    if (!Number.isFinite(age) || age > maxDays) return 0;
    return clamp(1 - .4 * (age / maxDays), .6, 1);
  }

  function themeContributions(holding) {
    const scale = Number(holdingsContext?.themePolicy?.perThemeScale || .35);
    const candidateMult = Number(holdingsContext?.themePolicy?.candidateExposureMultiplier || .5);
    const rows = [];

    themes.forEach(theme => {
      const direct = Array.isArray(theme.powerStackTickers) && theme.powerStackTickers.includes(holding.ticker);
      const candidate = Array.isArray(theme.researchCandidates) && theme.researchCandidates.includes(holding.ticker);
      if (!direct && !candidate) return;
      const direction = directionSignal(theme.direction || '');
      const freshW = themeFreshness(theme);
      if (!freshW || Math.abs(direction) < .001) return;
      const exposure = direct ? 1 : candidateMult;
      const adjustment = direction * statusWeight(theme.status || '') * freshW * scale * exposure;
      rows.push({
        id: theme.id,
        name: theme.name,
        direction: theme.direction || '',
        status: theme.status || '',
        adjustment,
        direct,
        lastUpdated: theme.lastUpdated || ''
      });
    });

    return rows.sort((a, b) => Math.abs(b.adjustment) - Math.abs(a.adjustment));
  }

  function themeAdjustment(holding) {
    return clamp(themeContributions(holding).reduce((s, r) => s + Number(r.adjustment || 0), 0), -1, 1);
  }

  function liveScore(holding) {
    const macro = macroAdjustment(holding);
    const theme = themeAdjustment(holding);
    return clamp(Number(holding.score || 0) + 5 * macro + 5 * theme, 0, 100);
  }

  function gradeClass(grade = '') {
    if (grade === 'A') return 'grade-a';
    if (grade.startsWith('B')) return 'grade-b';
    if (grade.startsWith('C')) return 'grade-c';
    return 'grade-f';
  }

  function overlayClass(v) {
    return v > .015 ? 'overlay-pos' : v < -.015 ? 'overlay-neg' : 'overlay-neutral';
  }

  function renderSummary(holdings) {
    const live = holdings.map(h => ({...h, live: liveScore(h)}));
    const avgFund = Math.round(holdings.reduce((s, h) => s + h.score, 0) / holdings.length);
    const avgLive = Math.round(live.reduce((s, h) => s + h.live, 0) / live.length);
    const top = [...live].sort((a, b) => b.live - a.live)[0];
    document.getElementById('summaryStats').innerHTML = [
      [holdings.length, 'Current holdings'],
      [avgFund, 'Avg fundamental'],
      [avgLive, 'Avg live score'],
      [top.ticker, 'Highest live score']
    ].map(([v, l]) => `<div class="summary-card"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('');
  }

  function renderWeights(weights) {
    document.getElementById('weights').innerHTML = Object.entries(weights).map(([name, weight]) => `
      <div class="weight-row"><span>${esc(name)}</span><b>${weight}%</b><div class="weight-track"><div class="weight-fill" style="width:${Number(weight) * 4}%"></div></div></div>
    `).join('');
  }

  function renderLiveMethod() {
    const macroState = !macroContext ? 'No macro packet' : packetFresh() ? `LIVE · ${new Date(macroContext.generatedAt).toLocaleString()}` : `STALE · ${ageHours(macroContext.generatedAt).toFixed(1)}h old`;
    const directMatches = themes.reduce((n, t) => n + (Array.isArray(t.powerStackTickers) ? t.powerStackTickers.length : 0), 0);
    document.getElementById('liveMethod').innerHTML = `
      <div class="live-method-card"><span>Fundamental anchor</span><b>0–100</b><small>Never overwritten</small></div>
      <div class="live-method-card ${packetFresh() ? 'live-ok' : 'live-stale'}"><span>Macro overlay</span><b>±5 pts</b><small>${esc(macroState)}</small></div>
      <div class="live-method-card live-ok"><span>Developing Themes</span><b>±5 pts</b><small>${themes.length} themes · ${directMatches} direct ticker links</small></div>
      <div class="live-method-card"><span>Live score</span><b>0–100</b><small>Fundamental + Macro + Themes</small></div>
    `;
  }

  function renderRanking(holdings) {
    const sorted = [...holdings].sort((a, b) => liveScore(b) - liveScore(a));
    document.getElementById('rankingBody').innerHTML = sorted.map((h, i) => {
      const macro = macroAdjustment(h);
      const theme = themeAdjustment(h);
      return `<tr>
        <td>${i + 1}</td>
        <td><strong>${esc(h.ticker)}</strong><span>${esc(h.name)} · ${esc(h.market)}</span></td>
        <td><span class="ranking-score">${Number(h.score).toFixed(0)}</span></td>
        <td><span class="overlay-number ${overlayClass(macro)}">${packetFresh() ? fmtSigned(macro, 2) : 'OFF'}</span></td>
        <td><span class="overlay-number ${overlayClass(theme)}">${fmtSigned(theme, 2)}</span></td>
        <td><span class="ranking-score live-ranking-score">${liveScore(h).toFixed(1)}</span></td>
        <td><span class="grade-pill ${gradeClass(h.grade)}">${esc(h.grade)}</span></td>
        <td>${esc(h.status)}</td>
      </tr>`;
    }).join('');
  }

  function componentRows(h) {
    return Object.entries(h.components).map(([name, value]) => {
      const max = maxByComponent[name] || 20;
      const width = Math.min(100, Math.max(0, Number(value) / max * 100));
      return `<div class="component-row"><span>${esc(name)}</span><div class="component-track"><div class="component-fill" style="width:${width}%"></div></div><b>${value}/${max}</b></div>`;
    }).join('');
  }

  function renderDriverList(rows, type) {
    if (!rows.length) return `<div class="driver-empty">No active ${type} contribution.</div>`;
    return rows.slice(0, 4).map(r => `<div class="driver-row"><div><strong>${esc(r.label || r.name)}</strong><span>${esc(r.regime || r.direction || '')}</span></div><b class="${overlayClass(r.adjustment)}">${fmtSigned(r.adjustment, 2)}</b></div>`).join('');
  }

  function renderCards(holdings) {
    const sorted = [...holdings].sort((a, b) => liveScore(b) - liveScore(a));
    document.getElementById('holdingsGrid').innerHTML = sorted.map(h => {
      const macro = macroAdjustment(h);
      const theme = themeAdjustment(h);
      const macroRows = macroContributions(h);
      const themeRows = themeContributions(h);
      const metrics = h.metrics.map(m => `<div class="metric">${esc(m)}</div>`).join('');
      const sources = h.sources.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join('');
      const macroLabel = macroProfiles.has(h.ticker) ? (packetFresh() ? fmtSigned(macro, 2) : 'STALE') : 'NO PROFILE';
      return `<article class="holding-card">
        <div class="holding-card-head">
          <div>
            <div class="holding-title"><div><div class="holding-ticker">${esc(h.ticker)}</div><div class="holding-name">${esc(h.name)} · ${esc(h.market)}</div></div><span class="grade-pill ${gradeClass(h.grade)}">${esc(h.grade)}</span></div>
            <div class="holding-status">${esc(h.status)}</div>
          </div>
          <div class="score-stack">
            <div class="score-orb fundamental-orb"><div><b>${Number(h.score).toFixed(0)}</b><span>FUND.</span></div></div>
            <div class="score-orb live-orb"><div><b>${liveScore(h).toFixed(1)}</b><span>LIVE</span></div></div>
          </div>
        </div>
        <div class="overlay-strip">
          <div><span>Macro</span><b class="${overlayClass(macro)}">${macroLabel}</b></div>
          <div><span>Themes</span><b class="${overlayClass(theme)}">${fmtSigned(theme, 2)}</b></div>
          <div><span>Live move</span><b class="${overlayClass(liveScore(h) - h.score)}">${fmtSigned(liveScore(h) - h.score, 1)} pts</b></div>
        </div>
        <div class="metric-grid">${metrics}</div>
        <div class="component-grid">${componentRows(h)}</div>
        <div class="context-drivers-grid">
          <div class="context-driver-panel"><h3>Macro drivers</h3>${renderDriverList(macroRows, 'macro')}</div>
          <div class="context-driver-panel"><h3>Developing-theme links</h3>${renderDriverList(themeRows, 'theme')}</div>
        </div>
        <div class="card-section"><h3>What supports the fundamental score</h3><p>${esc(h.strength)}</p></div>
        <div class="card-section risk"><h3>What drags the fundamental score</h3><p>${esc(h.weakness)}</p></div>
        <div class="card-section verdict"><h3>Fundamental verdict</h3><p>${esc(h.verdict)}</p></div>
        <div class="source-list">${sources}</div>
      </article>`;
    }).join('');
  }

  Promise.all([
    fetch('data/holdings-fundamentals.json', {cache:'no-store'}).then(r => { if (!r.ok) throw new Error(`Holdings HTTP ${r.status}`); return r.json(); }),
    fetch('data/macro-context.json', {cache:'no-store'}).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('data/macro-sensitivities.json', {cache:'no-store'}).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('data/holdings-context-profiles.json', {cache:'no-store'}).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('data/developing-themes.json', {cache:'no-store'}).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('data/water-cooling-research.json', {cache:'no-store'}).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('data/resource-stock-screen-2026-08-21.json', {cache:'no-store'}).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('data/deep-bottleneck-stock-screen-2026-08-21.json', {cache:'no-store'}).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('data/adjacent-theme-overlay-2026-08-24.json', {cache:'no-store'}).then(r => r.ok ? r.json() : null).catch(() => null)
  ]).then(([holdingsData, macro, sensitivities, contextProfiles, themeData, water, resource, deep, adjacent]) => {
    macroContext = macro;
    macroSensitivityData = sensitivities;
    holdingsContext = contextProfiles || {};
    buildMacroProfiles();

    themes = Array.isArray(themeData?.themes) ? themeData.themes.map(t => ({...t})) : [];
    if (water) {
      const waterTheme = themes.find(t => t.id === 'water-cooling');
      if (waterTheme) {
        const candidateTickers = Array.isArray(water.newResearchCandidates) ? water.newResearchCandidates.map(x => x.ticker).filter(Boolean) : [];
        waterTheme.researchCandidates = [...new Set([...(waterTheme.researchCandidates || []), ...candidateTickers])];
        waterTheme.lastUpdated = water.lastUpdated || waterTheme.lastUpdated;
      }
    }
    applyResearchOverlay(themes, resource);
    applyResearchOverlay(themes, deep);
    applyResearchOverlay(themes, adjacent);

    const holdings = Array.isArray(holdingsData?.holdings) ? holdingsData.holdings : [];
    document.getElementById('asOf').textContent = `Fundamentals: ${holdingsData?.asOf || '—'} · Macro: ${macroContext?.generatedAt ? new Date(macroContext.generatedAt).toLocaleString() : 'unavailable'} · Themes: ${adjacent?.lastUpdated || themeData?.lastUpdated || '—'}`;
    renderSummary(holdings);
    renderWeights(holdingsData?.methodology?.weights || {});
    renderLiveMethod();
    renderRanking(holdings);
    renderCards(holdings);
  }).catch(err => {
    console.error('Holdings live-context load failed', err);
    document.getElementById('holdingsGrid').innerHTML = `<div class="error-state">Could not load holdings context: ${esc(err.message)}</div>`;
    document.getElementById('asOf').textContent = 'Holdings context unavailable';
  });
})();
