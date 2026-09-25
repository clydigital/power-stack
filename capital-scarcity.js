const fmtMove = value => value == null ? '—' : (value > 0 ? '+' : '') + Number(value).toFixed(2) + '%';

Promise.all([
  fetch('data/portfolio-live-overlay.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('overlay HTTP ' + r.status);return r.json();}),
  fetch('data/portfolio-management.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('portfolio HTTP ' + r.status);return r.json();}),
  fetch('data/rate-resilience-overlay-2026-09-25.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('rate overlay HTTP ' + r.status);return r.json();})
]).then(([overlay,portfolio,rateOverlay])=>{
  const regime = overlay.regime || {};
  document.querySelector('#regime').textContent = (regime.family || portfolio.regime?.structural || 'UNRESOLVED') + ' · Live ' + (overlay.liveAsOf ? new Date(overlay.liveAsOf).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}) : '—');
  document.querySelector('#summary').textContent = portfolio.regime?.portfolioRead || regime.implication || regime.answer || 'No current portfolio summary.';

  document.querySelector('#rateGate').innerHTML =
    '<strong>' + rateOverlay.macroGate.admissionQuestion + '</strong><br>' +
    'US10Y ' + rateOverlay.macroGate.us10yOfficialClosePct.toFixed(2) + '% official ' + rateOverlay.macroGate.us10yCloseDate +
    ' close · breadth ' + rateOverlay.macroGate.sp500Above50dmaPct.toFixed(2) + '% above 50DMA · 5Y auction tail +' +
    rateOverlay.macroGate.fiveYearAuction.tailBp.toFixed(1) + 'bp. ' + rateOverlay.macroGate.coreRead;
  document.querySelector('#rateRanking').innerHTML=(rateOverlay.ranking || []).map(x=>
    '<article class="card rank-card"><div class="rank-no">#' + x.rank + '</div><div><div class="rank-ticker">' + x.ticker + '</div><div class="meta">' + x.company + '</div></div><div><div class="rank-decision">' + x.decision + '</div><div class="rank-copy">' + x.reason + '<br><strong>Watch:</strong> ' + x.watch + '</div></div></article>'
  ).join('');
  document.querySelector('#premiumNames').innerHTML=(rateOverlay.existingPremiumNames || []).map(x=>
    '<article class="card"><div class="rank-ticker">' + x.ticker + '</div><div class="rank-decision">' + x.decision + '</div><div class="premium">' + x.rule + '</div></article>'
  ).join('');

  const rates=overlay.currentSignals?.rates || {};
  const funding=overlay.currentSignals?.funding || {};
  const energy=overlay.currentSignals?.physicalEnergy || {};
  const signalCards=[
    {
      category:'RATES / DURATION',
      status:rates.state === 'TIGHTER' ? 'RED' : rates.state === 'EASIER' ? 'GREEN' : '',
      signal:rates.state || 'UNRESOLVED',
      implication:(rates.tighter || 0) + ' tighter · ' + (rates.easier || 0) + ' easier · ' + (rates.unresolved || 0) + ' unresolved layers.'
    },
    {
      category:'FUNDING / CREDIT',
      status:funding.state === 'TIGHTER' ? 'RED' : funding.state === 'EASIER' ? 'GREEN' : '',
      signal:funding.state || 'UNRESOLVED',
      implication:(funding.tighter || 0) + ' tighter · ' + (funding.easier || 0) + ' easier · ' + (funding.neutral || 0) + ' neutral layers.'
    },
    {
      category:'PHYSICAL ENERGY',
      status:energy.status === 'ACTIVE' ? 'GREEN' : '',
      signal:energy.status || 'UNRESOLVED',
      implication:energy.detail || 'No current physical-energy read.'
    }
  ];
  document.querySelector('#signals').innerHTML = signalCards.map(x=>
    '<article class="card signal ' + x.status + '"><div class="meta">' + x.category + ' · ' + (x.status || 'WATCH') + '</div><h3>' + x.signal + '</h3><div>' + x.implication + '</div></article>'
  ).join('');

  const actionsByTicker=new Map((portfolio.actions || []).map(x=>[x.ticker,x]));
  document.querySelector('#actions').innerHTML=(overlay.holdings || []).map(h=>{
    const action=actionsByTicker.get(h.ticker) || {};
    const tape=h.actualReaction || {};
    const currency=tape.currency === 'USD' ? '$' : tape.currency === 'MYR' ? 'RM' : '';
    const price=tape.close == null ? 'No completed tape' : currency + Number(tape.close).toLocaleString(undefined,{maximumFractionDigits:4}) + ' · ' + fmtMove(tape.changePct);
    return '<article class="card action">' +
      '<b>' + h.ticker + '</b>' +
      '<span>' + price + '</span>' +
      '<span><strong>' + (action.action || h.reviewPriority || 'MONITOR') + '</strong><br>' +
      (action.addGate || action.sizingRead || 'No current add gate.') +
      '<br><span class="reaction ' + (tape.status || 'UNRESOLVED') + '">' + (tape.status || 'UNRESOLVED') + ' vs macro · ' + h.overlayState + '</span></span>' +
    '</article>';
  }).join('');

  document.querySelector('#clusters').innerHTML=(overlay.hiddenConcentration || []).map(x=>
    '<article class="card cluster ' + (x.status || '') + '"><div class="meta">' + String(x.status || 'WATCH').replaceAll('_',' ') + '</div><h3>' + x.label + '</h3><div>' +
    (x.members || []).join(' · ') + '<br>' + x.dependency + (x.nextCheck ? '<br><strong>Next:</strong> ' + x.nextCheck : '') +
    '</div></article>'
  ).join('');

  document.querySelector('#steps').innerHTML=(portfolio.newCapitalPriority || []).map(x=>
    '<li><strong>' + x.bucket + ':</strong> ' + x.instruction + '</li>'
  ).join('');

  const divs=overlay.reviewQueue?.tapeDivergences || [];
  const confirms=overlay.reviewQueue?.tapeConfirmations || [];
  document.querySelector('#provenance').textContent =
    'Live Desk is the canonical macro baseline. The 10Y rate-resilience overlay owns the current fresh-US research order and entry hurdle; Power Stack still owns company fundamentals and action gates. Completed-session tape is secondary delayed quote data and never changes the fundamental score. Current tape divergences: ' +
    (divs.length ? divs.join(', ') : 'none') + '. Confirmations: ' + (confirms.length ? confirms.join(', ') : 'none') + '. USD and MYR are not aggregated until portfolio weights are normalized.';
}).catch(e=>{
  document.querySelector('#summary').textContent='Data unavailable: ' + e.message;
  document.querySelector('#provenance').textContent='Live portfolio data failed to load.';
});
