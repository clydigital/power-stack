/* Research-only basket comparison. No write-back to mandate, scores, holdings or broker. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const money = value => 'RM'+Number(value).toLocaleString('en-MY',{maximumFractionDigits:0});
  const icons = {
    shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    layers:'<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
    fuel:'<path d="M3 21h13V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16Z"/><path d="M3 10h13M16 7h2l3 3v8a2 2 0 0 1-4 0v-3"/>',
    atom:'<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4"/><circle cx="12" cy="12" r="1"/>',
    wallet:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M16 14h2"/>',
    leaf:'<path d="M21 3c-7 1-15 2-16 10a6 6 0 0 0 6 6c8-1 9-9 10-16Z"/><path d="M3 21c3-6 7-9 13-12"/>',
    arrow:'<path d="m5 12 7-7 7 7M12 5v14"/>',
    alert:'<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v4M12 17h.01"/>',
    check:'<path d="m4 12 5 5L20 6"/>',
    scope:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>'
  };
  const svg = key => '<svg class="basket-icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">' + (icons[key]||icons.scope) + '</svg>';
  let model = null;
  let filter = 'all';
  let mode = 'positive';
  const full = id => model.baskets.find(b => b.id===id);
  function summaryCards(){
    const root=$('#basket-grid');
    const visible=model.baskets.filter(b=>filter==='all'||b.group===filter);
    $('#basket-count').textContent=visible.length+' of '+model.baskets.length+' alternatives';
    root.innerHTML=visible.map((b,i)=>{
      const group=model.groups.find(g=>g.id===b.group);
      const illustration=b.illustrations[mode];
      const pct=illustration.pct;
      const outcome=(pct>=0?'+':'')+pct.toFixed(pct%1?2:0)+'%';
      const chips=b.weights.map(w=>'<span class="basket-asset"><span class="basket-asset-icon">'+svg(w.icon)+'</span><strong>'+esc(w.symbol)+'</strong><span>'+esc(w.role)+'</span></span>').join('');
      const spans=b.weights.map((w,j)=>'<div class="basket-segment basket-segment-'+esc(w.symbol.toLowerCase())+'" style="width:'+w.pct+'%" title="'+esc(w.symbol)+' '+w.pct+'%" aria-hidden="true"></div>').join('');
      const rows=b.weights.map(w=>'<tr><td>'+svg(w.icon)+' <strong>'+esc(w.symbol)+'</strong><span>'+esc(w.role)+'</span></td><td class="basket-num">'+w.pct+'%</td><td class="basket-num">'+money(w.rm)+'</td></tr>').join('');
      return '<article class="basket-card" data-group="'+esc(b.group)+'" id="basket-'+esc(b.id)+'">'+
       '<div class="basket-card-head"><span class="basket-category basket-category-'+esc(b.group)+'">'+svg(b.icon)+esc(group.label)+'</span><span class="basket-card-index">'+String(i+1).padStart(2,'0')+' / 04</span></div>'+
       '<h3>'+esc(b.name)+'</h3><p class="basket-subtitle">'+esc(b.short)+'</p>'+
       '<div class="basket-card-chips">'+chips+'</div>'+
       '<div class="basket-card-allocation"><div class="basket-bar" role="img" aria-label="'+esc(b.weights.map(w=>w.symbol+' '+w.pct+'%').join(', '))+'">'+spans+'</div>'+
       '<div class="basket-bar-legend"><span>'+b.capitalExposurePct+'% market exposure</span><span>'+ (100-b.capitalExposurePct)+'% MYR liquidity</span></div></div>'+
       '<div class="basket-card-outcome"><div><span>'+ (mode==='positive'?'Illustrative positive':'Illustrative negative') +'</span><strong class="'+(pct>=0?'basket-gain':'basket-loss')+'">'+outcome+'</strong></div><div><span>Portfolio impact</span><strong class="'+(pct>=0?'basket-gain':'basket-loss')+'">'+(illustration.profitMYR>=0?'+':'−')+money(Math.abs(illustration.profitMYR))+'</strong></div></div>'+
       '<p class="basket-case">'+esc(b.why)+'</p>'+
       '<p class="basket-risk"><span>'+svg('alert')+'</span><strong>'+esc(b.risk)+'</strong></p>'+
       '<details class="basket-evidence"><summary>Allocation, assumptions & failure test</summary>'+
       '<div class="basket-details"><table><thead><tr><th>Asset / role</th><th>Weight</th><th>Target</th></tr></thead><tbody>'+rows+'</tbody></table>'+
       '<div class="basket-evidence-row"><strong>Scenario maths</strong><p>'+esc(illustration.assumptions)+' NAV would be '+money(illustration.navMYR)+'. Hypothetical only; FX, tax, fees, dividends and distributions excluded.</p></div>'+
       '<div class="basket-evidence-row"><strong>Key downside</strong><p>'+esc(b.whatCanGoWrong)+'</p></div>'+
       '<div class="basket-evidence-row"><strong>Reassess if</strong><p>'+esc(b.reconsider)+'</p></div>'+
       '<div class="basket-evidence-row"><strong>Required before trading</strong><p>'+esc(b.check)+'</p></div></div></details></article>';
    }).join('');
    if(!visible.length)root.innerHTML='<p>No baskets match that filter.</p>';
  }
  function renderFilters(){
    const groups=[{id:'all',label:'All strategies',icon:'scope'},...model.groups];
    $('#basket-filters').innerHTML=groups.map(g=>'<button type="button" class="basket-filter" data-group="'+esc(g.id)+'" aria-pressed="'+(g.id===filter?'true':'false')+'">'+svg(g.icon)+'<span>'+esc(g.label)+'</span></button>').join('')+
      '<div class="basket-scenario-toggle" role="group" aria-label="Show illustrative scenario"><button type="button" data-mode="positive" aria-pressed="'+(mode==='positive')+'">'+svg('arrow')+' Positive case</button><button type="button" data-mode="negative" aria-pressed="'+(mode==='negative')+'">'+svg('alert')+' Negative case</button></div>';
    $('#basket-filters').querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{filter=b.dataset.group;renderFilters();summaryCards()});
    $('#basket-filters').querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;renderFilters();summaryCards()});
  }
  async function load(){
    const response=await fetch('data/basket-strategies.json',{cache:'no-store'});
    if(!response.ok)throw Error('HTTP '+response.status);
    model=await response.json();
    if(model.schema!=='power-stack-basket-comparison/v1'||!Array.isArray(model.baskets)||model.baskets.length!==4||!Array.isArray(model.groups))throw Error('Unexpected research contract');
    for(const b of model.baskets){
      if(!model.groups.some(g=>g.id===b.group)||b.weights.reduce((s,x)=>s+x.pct,0)!==100||b.weights.reduce((s,x)=>s+x.rm,0)!==model.capitalMYR)throw Error('Invalid funding total for '+b.id);
      if(!full(b.id))throw Error('Missing '+b.id);
    }
    renderFilters();summaryCards();
  }
  load().catch(error=>{
    $('#basket-grid').textContent='Basket research unavailable ('+error.message+'). No portfolio actions have been changed.';
    $('#basket-filters').textContent='Categories unavailable';
    $('#basket-count').textContent='Research data unavailable';
  });
})();