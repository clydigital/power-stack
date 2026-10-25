/* Power Stack x Alchemy Hybrid: source-shared market iconography.
 * Decorative inline SVG uses the local copied Hybrid 40-symbol sprite.
 * Text labels, timestamps, scores and investment actions remain authoritative.
 * Dynamic content is re-decorated after rerenders without rewriting model HTML.
 */
(() => {
  'use strict';
  const sprite = 'assets/market-iconography/sprite.svg#bb-';
  const symbols = new Set(['home','market','deep-dive','research','library','calendar','learn','studio','rates','bond','curve','currency','gold','oil','energy','credit','inflation','ai','chip','factory','equities','volatility','divergence','risk','shield','source','evidence','transmission','catalyst','chart','compare','global','layers','watch','spark','download','copy','arrow-up','arrow-down','check']);
  const page = location.pathname.split('/').pop() || 'index.html';

  function icon(name, tone='neutral') {
    const glyph = symbols.has(name) ? name : 'research';
    const shade = /^(good|warn|risk|info|neutral)$/.test(tone) ? tone : 'neutral';
    return '<svg class="ps-market-icon ps-market-icon--'+shade+'" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="'+sprite+glyph+'"></use></svg>';
  }
  function text(el) {return (el?.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();}
  function symbolForMarket(textValue) {
    const t = String(textValue||'').toLowerCase();
    if (/uranium|nuclear|reactor|atomic|fuel cycle/.test(t)) return 'energy';
    if (/power|grid|electric|utility|renewable|turbine/.test(t)) return 'energy';
    if (/gold|silver|precious/.test(t)) return 'gold';
    if (/oil|gas|gulf|hormuz|diesel|brent|refin/.test(t)) return 'oil';
    if (/rate|treasury|bond|duration|fed|yield curve/.test(t)) return 'rates';
    if (/credit|financ|debt|spread|funding|lending/.test(t)) return 'credit';
    if (/fx|forex|dollar|yen|currency/.test(t)) return 'currency';
    if (/chip|semiconduct|memory|hbm/.test(t)) return 'chip';
    if (/ai|compute|cloud|data cent|automati|robot|inference/.test(t)) return 'ai';
    if (/capex|factory|manufactur|industr/.test(t)) return 'factory';
    if (/inflation|cpi|ppi|fertilis|nitrogen|commodity|material|metal/.test(t)) return 'inflation';
    if (/geopolitic|war|sanction|china|trade/.test(t)) return 'global';
    return 'market';
  }
  function contextIcon(s) {
    if (/what would invalidate|invalidat|the catch|downside|thesis fail|weakness|risk|avoid|concentration|stress/.test(s)) return ['risk','risk'];
    if (/confirmed|what proves|confirm|verification|source|evidence|what supports|why it works|quality/.test(s)) return ['evidence','good'];
    if (/expected|baseline|pre-tape/.test(s)) return ['chart','neutral'];
    if (/actual|reaction|market tape|completed/.test(s)) return ['equities','info'];
    if (/divergen|mismatch|contradic/.test(s)) return ['divergence','warn'];
    if (/leading hypothesis|why this matters|money chain|transmission|impact|mechanism|exposed/.test(s)) return ['transmission','info'];
    if (/next test|reassess|when to|what to watch|watch|trigger|catalyst|earnings/.test(s)) return ['catalyst','warn'];
    if (/cash|liquid|reserve|dry powder/.test(s)) return ['shield','good'];
    if (/entry|buy|allocation|capital priority|staged/.test(s)) return ['chart','neutral'];
    if (/thesis|research stance|profile|method/.test(s)) return ['research','info'];
    if (/score|ranking|valuation|metrics/.test(s)) return ['chart','neutral'];
    return null;
  }
  function prepend(el, name, tone='neutral', presentation='inline') {
    if (!el || el.nodeType !== 1 || el.dataset.psMarketIcon === '1') return;
    if (!symbols.has(name)) return;
    if (el.querySelector(':scope > svg.ps-market-icon, :scope > .ps-market-tile')) return;
    if (presentation==='tile') {
      const tile = document.createElement('span');
      tile.className='ps-market-tile ps-market-tile--'+tone;
      tile.innerHTML=icon(name,tone);
      tile.setAttribute('aria-hidden','true');
      el.prepend(tile);
      el.classList.add('ps-market-has-tile');
    } else {
      el.insertAdjacentHTML('afterbegin',icon(name,tone));
      el.classList.add('ps-market-has-glyph');
    }
    el.dataset.psMarketIcon='1';
  }
  function select(rules) {
    for (const [selector,name,tone,presentation] of rules) {
      for (const el of document.querySelectorAll(selector)) prepend(el,name,tone,presentation);
    }
  }
  function inferred(selector,resolver,presentation='inline') {
    for(const el of document.querySelectorAll(selector)){
      if (el.dataset.psMarketIcon) continue;
      const result=resolver(el);
      if (result) prepend(el,result[0],result[1]||'neutral',presentation);
    }
  }
  function portfolioSector(el){
    const label=text(el);
    const parent=el.closest('.holding-card,.watch-card,.idea-card,.idea-row,.adv-idea,.adv-portfolio-item');
    const theme=text(parent?.querySelector('.ps-exposure-tag,.tag,.ticker-chip'));
    if (/\b(tsm|mu|nvda|amd|avgo)\b/.test(label)) return 'chip';
    if (/\b(xom|misc|hibiscs|dayang|vlo)\b/.test(label)) return 'oil';
    if (/\b(ytlpowr|6742uw|gev|etn)\b/.test(label)) return 'energy';
    if (/\b(bwxt|urnm|ccj|ivn)\b/.test(label)) return 'energy';
    if (/\b(tsla|ttwo|grab)\b/.test(label)) return 'equities';
    return symbolForMarket(theme);
  }
  function markMarketRows(){
    inferred('.idea-card .ticker,.idea-row .row-stock-top strong', el=>[portfolioSector(el),'info'], 'tile');
    inferred('.holding-card .holding-ticker,.watch-card .watch-ticker',el=>[portfolioSector(el),'info'], 'tile');
    inferred('.adv-idea-symbol',el=>[portfolioSector(el),'info'],'tile');
  }
  const navStyles = {
    'index.html': [
      ['.adv-move h3','chart','info'],
      ['.adv-event .adv-overline','calendar','neutral'],
      ['.adv-insight strong','market','info'],
      ['.adv-radar-section h3','research','info'],
      ['.adv-portfolio-name > strong','equities','info'],
      ['.adv-holding-explanation summary','evidence','warn']
    ],
    'research-library.html': [
      ['#rateResilienceHome h2','rates','warn'],
      ['#bondWatchHome h2','bond','info'],
      ['#marketMotionHome h2','catalyst','info'],
      ['.context-head h2','transmission','info'],
      ['.ps-exposure-explainer strong','layers','info'],
      ['.result-bar strong','library','neutral']
    ],
    'holdings.html': [
      ['.live-overlay h2,.live-overlay h3','market','info'],
      ['.context-panel h2','divergence','warn'],
      ['.ranking-head h2','chart','info'],
      ['.divergence-lab-head h3','compare','info'],
      ['.ps-action-brief-head .ps-context-kicker','shield','good'],
      ['.ps-holding-explainer-top > strong','equities','info'],
      ['.live-open-items h3','research','warn']
    ],
    'watchlist.html': [
      ['.watch-hero-copy h2','watch','info'],
      ['#regimePanel strong','rates','info'],
      ['#rateOverlaySection h2','rates','warn'],
      ['.holdings-head h2','equities','info'],
      ['.bucket-head h2','watch','info']
    ],
    'themes.html': [
      ['.themes-meta strong','layers','info']
    ],
    'motion.html': [
      ['.motion-hero-copy h2','catalyst','info'],
      ['.motion-section-head h2','evidence','info'],
      ['.motion-rule strong','shield','warn'],
      ['.motion-live-note strong','source','info']
    ],
    'capital-scarcity.html': [
      ['#rateGate strong','rates','info']
    ],
    'baskets.html': [
      ['.basket-heading h2','compare','info'],
      ['.basket-logic h2','layers','info'],
      ['.basket-hero-number > span','currency','neutral'],
      ['.basket-baseline p strong','shield','warn'],
      ['.basket-logic-grid h3','evidence','info']
    ]
  };
  function details(){
    inferred('.detail h3,.card-section h3,.theme-panel h3,.theme-why strong,.news-implication strong,.divergence-card h4,.basket-evidence-row strong,.ps-holding-explainer dt,.adv-detail-grid b', el=>contextIcon(text(el)));
    inferred('.theme-title',el=>[symbolForMarket(text(el)),'info'],'tile');
    inferred('.motion-card h3',el=>[symbolForMarket(text(el.closest('.motion-card')?.querySelector('.motion-kicker'))+' '+text(el)),'info'],'tile');
    inferred('.motion-card .motion-kicker',el=>[symbolForMarket(text(el)),'neutral']);
    inferred('.motion-toolbar .filter-row button',el=>[symbolForMarket(text(el)),'info']);
    inferred('.basket-card-outcome span',el=>[text(el).includes('portfolio')?'currency':'chart','neutral']);
    inferred('.basket-evidence summary',el=>['evidence','neutral']);
    inferred('.watch-card .action-pill',el=>{
      const s=text(el);
      return /buy/.test(s)?['check','good']:/select/.test(s)?['evidence','warn']:/avoid/.test(s)?['risk','risk']:['watch','neutral'];
    });
    inferred('.bucket-head h2',el=>{
      const s=text(el);
      return /buy/.test(s)?['check','good']:/avoid/.test(s)?['risk','risk']:/select/.test(s)?['evidence','warn']:['watch','info'];
    });
    inferred('.news-date',el=>['calendar','neutral']);
    inferred('.signal .meta',el=>[symbolForMarket(text(el)),'info']);
    inferred('.cluster .meta,.cluster-card b',el=>['risk','warn']);
    inferred('.divergence-card .div-top b',el=>['divergence','warn']);
    inferred('.motion-stat span',el=>['chart','neutral']);
    inferred('.watch-stat span',el=>['chart','neutral']);
    inferred('.bond-metric span',el=>[symbolForMarket(text(el)),'info']);
    inferred('.summary-card span',el=>[symbolForMarket(text(el)),'neutral']);
    inferred('.adv-move .adv-tag',el=>contextIcon(text(el)));
    inferred('.adv-portfolio-name .adv-tag',el=>contextIcon(text(el)));
    inferred('.ps-holding-target',el=>['shield','info']);
    inferred('main.scarcity .section > .meta',el=>contextIcon(text(el))||[symbolForMarket(text(el)),'info']);
    inferred('.rate-rank .rticker,.rank-card .rank-ticker',el=>['chart','info']);
    inferred('.motion-home-card > span',el=>['catalyst','neutral']);
    inferred('.ps-basket-link',el=>['compare','info']);
  }
  function decorate(){
    select(navStyles[page]||[]);
    markMarketRows();
    details();
  }
  let scheduled=false;
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;decorate()});
  }
  function start(){
    decorate();
    const contentRoot=document.querySelector('.workspace,.themes-shell,.motion-shell,main.scarcity')||document.body;
    if(typeof MutationObserver==='undefined') return;
    const obs=new MutationObserver(records=>{
      // Only react to content added by page renderers, never to our glyphs.
      if(records.some(r=>Array.from(r.addedNodes||[]).some(n=>n.nodeType===1 &&
          !(n.classList?.contains('ps-market-icon')||n.classList?.contains('ps-market-tile'))))) schedule();
    });
    obs.observe(contentRoot,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
  window.PowerStackMarketIcons = Object.freeze({icon, symbolForMarket, contextIcon});
})();