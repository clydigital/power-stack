let ideas=[];
let macroContext=null;
let macroSensitivityData=null;
let macroProfileMap=new Map();
const MACRO_PACKET_MAX_HOURS=168;
const savedView=localStorage.getItem('powerStackView');
const state={theme:'All',region:'All',status:'All',q:'',sort:'conviction',sortDir:'desc',view:savedView==='row'?'row':'card'};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const uniq=arr=>[...new Set(arr.filter(Boolean))].sort();
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

function regionBucket(x){const r=(x.region||'').toLowerCase();if(r.includes('malaysia'))return'Malaysia';if(r.includes('hong kong')||r.includes('china')||r.includes('kazakhstan'))return'HK / China';if(r==='us'||r.includes('united states'))return'US';return'Global'}
function statusBucket(x){const s=(x.status||'').toLowerCase();if(s.includes('priority'))return'Priority';if(s.includes('core'))return'Core';if(s.includes('speculative')||s.includes('high-beta'))return'Speculative';if(s.includes('queue')||s.includes('low-priority'))return'Research Queue';return'Watchlist'}
function themeContext(x){return macroContext?.themes?.find(t=>t.theme===x.themeGroup)||null}
function stockProfile(x){return macroProfileMap.get(x?.ticker)||null}
function channelContext(key){return macroContext?.channels?.find(c=>c.key===key)||null}
function parseMs(v){const ms=Date.parse(v||'');return Number.isFinite(ms)?ms:null}
function ageHours(v){const ms=parseMs(v);return ms===null?Infinity:(Date.now()-ms)/36e5}
function packetFresh(){if(!macroContext)return false;const max=Number(macroContext.packetStaleAfterHours||MACRO_PACKET_MAX_HOURS);return ageHours(macroContext.generatedAt)<=max}
function channelFresh(c){if(!c||!packetFresh()||c.fresh===false)return false;const max=Number(c.staleAfterHours||macroContext.packetStaleAfterHours||MACRO_PACKET_MAX_HOURS);return ageHours(c.observedAt||macroContext.generatedAt)<max}
function channelFreshnessWeight(c){if(!channelFresh(c))return 0;const max=Number(c.staleAfterHours||macroContext.packetStaleAfterHours||MACRO_PACKET_MAX_HOURS);return clamp(1-.35*(ageHours(c.observedAt||macroContext.generatedAt)/max),.65,1)}
function themeFresh(t){return !!t&&packetFresh()}
function scoreClass(v){return v>0.015?'pos':v<-0.015?'neg':'neutral'}
function fmtSigned(v,d=1){const n=Number(v||0);return `${n>0?'+':''}${n.toFixed(d)}`}
function pct(v,max){return `${clamp(Number(v||0)/max*100,0,100)}%`}
function counts(items,getter){const out={};items.forEach(x=>{const k=getter(x);out[k]=(out[k]||0)+1});return out}
function prettyKind(kind){const c=channelContext(kind);return c?.label||({growthDemand:'Growth / Demand',policyRelief:'Policy Relief',financialConditions:'Financial Conditions',creditAvailability:'Broad Credit',tailCreditStress:'Weak-End Credit Stress',consumerStrength:'Consumer',housingStrength:'Housing',industrialCapex:'Industrial / Power Capex',inputCostPressure:'Input Costs',labourStrength:'Labour',riskAppetite:'Risk Appetite',crudeTightness:'Crude',productTightness:'Refined Products',gasTightness:'US Gas'})[kind]||'Macro signal'}
function safeUrl(url){return /^https?:\/\//i.test(String(url||''))?String(url):null}
function timeLabel(v){if(!v)return'No timestamp';const d=new Date(v);return Number.isNaN(d.getTime())?'No timestamp':d.toLocaleString()}
function contextSignalContributions(x){
  const p=stockProfile(x);if(!p||!packetFresh())return[];
  const fw=Number(p.fundamentalWeight??macroSensitivityData?.fundamentalWeight??.65),mw=Number(p.marketWeight??macroSensitivityData?.marketWeight??.35),pc=clamp(Number(p.profileConfidence??.5),0,1);
  let rows=[];
  Object.entries(p.factors||{}).forEach(([key,f])=>{
    const c=channelContext(key);if(!c||!channelFresh(c)||Number(f.weight||0)<=0)return;
    const fundamental=clamp(Number(f.fundamental||0),-5,5),market=clamp(Number(f.market||0),-5,5);
    const effective=(fw*fundamental+mw*market)/5;
    const freshW=channelFreshnessWeight(c),factorC=clamp(Number(f.confidence??.5),0,1),channelC=clamp(Number(c.confidence??.5),0,1);
    const adjustment=(Number(c.score||0)/2)*effective*Number(f.weight||0)*factorC*pc*channelC*freshW;
    if(Math.abs(adjustment)<.00005)return;
    rows.push({id:`${x.ticker}:${key}`,kind:key,title:c.label||prettyKind(key),detail:c.interpretation||'',adjustment,channelScore:Number(c.score||0),effectiveSensitivity:effective,fundamentalSensitivity:fundamental,marketSensitivity:market,factorWeight:Number(f.weight||0),factorConfidence:factorC,profileConfidence:pc,channelConfidence:channelC,freshnessWeight:freshW,rationale:f.rationale||'',observedAt:c.observedAt||macroContext.generatedAt,sourceName:macroContext.source||'Power Stack Macro Context',sourceUrl:macroContext.sourceUrl||null});
  });
  const sum=rows.reduce((s,r)=>s+r.adjustment,0),clipped=clamp(sum,-1,1);
  if(Math.abs(sum)>1&&Math.abs(sum)>.0001){const scale=clipped/sum;rows=rows.map(r=>({...r,adjustment:r.adjustment*scale}))}
  return rows.sort((a,b)=>Math.abs(b.adjustment)-Math.abs(a.adjustment));
}
function contextWatchSignals(x){const t=themeContext(x);return packetFresh()?(t?.watch||[]).slice(0,5):[]}
function contextDelta(x){return clamp(contextSignalContributions(x).reduce((s,r)=>s+Number(r.adjustment||0),0),-1,1)}
function contextConviction(x){return clamp(Number(x.conviction||0)+contextDelta(x),0,10)}
function contextState(x){if(!stockProfile(x))return'none';if(!packetFresh())return'stale';return contextSignalContributions(x).length?'fresh':'none'}
function themeDelta(theme){const rows=ideas.filter(x=>x.themeGroup===theme&&stockProfile(x));return rows.length?rows.reduce((s,x)=>s+contextDelta(x),0)/rows.length:0}
function themeTopDrivers(theme){const rows=ideas.filter(x=>x.themeGroup===theme&&stockProfile(x));const sums={};rows.forEach(x=>contextSignalContributions(x).forEach(r=>{sums[r.kind]=(sums[r.kind]||0)+r.adjustment}));return Object.entries(sums).map(([kind,total])=>({kind,total:rows.length?total/rows.length:0})).sort((a,b)=>Math.abs(b.total)-Math.abs(a.total)).slice(0,5)}

function navButton(label,count,total,group,active){return `<button class="nav-item ${active?'active':''}" data-group="${group}" data-value="${esc(label)}"><div class="nav-top"><span>${esc(label)}</span><b>${count}</b></div><div class="mini-track"><span class="mini-fill" style="width:${total?count/total*100:0}%"></span></div></button>`}
function renderSidebar(){
  const total=ideas.length;
  $('#allIdeasNav').innerHTML=`<button class="nav-item all-ideas ${state.theme==='All'&&state.region==='All'&&state.status==='All'?'active':''}" id="showAll"><div class="nav-top"><span>ALL IDEAS</span><b>${total}</b></div><div class="mini-track"><span class="mini-fill" style="width:100%"></span></div></button>`;
  const themes=counts(ideas,x=>x.themeGroup||'Other');
  $('#themeNav').innerHTML=Object.entries(themes).sort((a,b)=>b[1]-a[1]).map(([k,n])=>navButton(k,n,total,'theme',state.theme===k)).join('');
  const regions=counts(ideas,regionBucket);
  $('#regionNav').innerHTML=Object.entries(regions).sort((a,b)=>b[1]-a[1]).map(([k,n])=>navButton(k,n,total,'region',state.region===k)).join('');
  const statuses=counts(ideas,statusBucket);const order=['Priority','Core','Watchlist','Speculative','Research Queue'];
  $('#statusNav').innerHTML=order.filter(k=>statuses[k]).map(k=>navButton(k,statuses[k],total,'status',state.status===k)).join('');
  document.querySelectorAll('[data-group]').forEach(btn=>btn.onclick=()=>{state[btn.dataset.group]=btn.dataset.value;renderSidebar();render()});
  $('#showAll').onclick=()=>{state.theme='All';state.region='All';state.status='All';state.q='';$('#search').value='';renderSidebar();render()};
  renderMacroPulse();
}

function renderMacroPulse(){
  const box=$('#livePulse'),dot=$('#sidebarLiveDot');
  if(!macroContext?.channels?.length){box.innerHTML='<div class="side-micro">No macro snapshot yet. Using base research scores.</div>';dot.className='live-dot';return}
  const packetOk=packetFresh();dot.className=`live-dot ${packetOk?'online':'stale'}`;
  box.innerHTML=macroContext.channels.map(c=>{const fresh=channelFresh(c);const pos=clamp((Number(c.score)+2)/4*100,0,100);return `<div class="pulse-row ${fresh?'':'stale'}"><div class="pulse-label"><span>${esc(c.label||c.key)}</span><b class="${fresh?scoreClass(c.score):'stale-text'}">${fresh?fmtSigned(c.score):'STALE'}</b></div><div class="pulse-track"><span class="pulse-marker" style="left:${pos}%"></span></div><div class="pulse-regime">${esc(c.regime||'')}</div></div>`}).join('');
  $('#liveTimestamp').textContent=packetOk?`Macro snapshot: ${timeLabel(macroContext.generatedAt)}`:`Macro snapshot is ${ageHours(macroContext.generatedAt).toFixed(1)}h old · adjustments off`;
}

function defaultSortDir(key){return key==='ticker'?'asc':key==='conviction'||key==='contextConviction'?'desc':'asc'}
function sortValue(x,key){if(key==='ticker')return `${x.ticker} ${x.name}`.toLowerCase();if(key==='contextConviction')return contextConviction(x);return Number(x[key]??0)}
function filteredIdeas(){
  const q=state.q.trim().toLowerCase();
  const rows=ideas.filter(x=>{const blob=JSON.stringify(x).toLowerCase();return (state.theme==='All'||x.themeGroup===state.theme)&&(state.region==='All'||regionBucket(x)===state.region)&&(state.status==='All'||statusBucket(x)===state.status)&&(!q||blob.includes(q))});
  const direction=state.sortDir==='asc'?1:-1;
  rows.sort((a,b)=>{const av=sortValue(a,state.sort),bv=sortValue(b,state.sort);const primary=typeof av==='string'?av.localeCompare(bv):av-bv;return (primary||a.ticker.localeCompare(b.ticker))*direction});
  return rows;
}

function scoreLine(label,value,max,cls=''){return `<div class="score-line"><span>${label}</span><div class="bar-track"><div class="bar-fill ${cls}" style="width:${pct(value,max)}"></div></div><b>${Number(value).toFixed(value%1?1:0)}/${max}</b></div>`}
function compactMeter(value,max,cls=''){const n=clamp(Number(value||0),0,max);const cells=Array.from({length:max},(_,i)=>{const load=clamp(n-i,0,1)*100;return `<i class="ammo-cell ${cls}" style="--load:${load}%" aria-hidden="true"></i>`}).join('');return `<div class="row-meter"><b>${n.toFixed(n%1?1:0)}<small>/${max}</small></b><div class="row-meter-track ammo-track" aria-label="${n.toFixed(1)} out of ${max}">${cells}</div></div>`}
function sortHeader(label,key){const active=state.sort===key,arrow=active?(state.sortDir==='asc'?'↑':'↓'):'↕';return `<button class="row-sort ${active?'active':''}" type="button" data-sort-key="${key}" aria-label="Sort by ${label} ${active?state.sortDir:''}"><span>${label}</span><b aria-hidden="true">${arrow}</b></button>`}
function renderRow(x){const adj=contextConviction(x);return `<article class="idea-row" data-ticker="${esc(x.ticker)}" tabindex="0" role="button" aria-label="Open ${esc(x.ticker)} ${esc(x.name)} details"><div class="row-stock"><div class="row-stock-top"><strong>${esc(x.ticker)}</strong>${macroChip(x)}</div><span>${esc(x.name)} · ${esc(x.market)}</span><small>${esc(statusBucket(x))} · ${esc(x.themeGroup)}</small></div><div class="row-score" data-label="Base conviction">${compactMeter(x.conviction,10,'conv')}</div><div class="row-score" data-label="Macro-adjusted conviction">${compactMeter(adj,10,'context')}</div><div class="row-score" data-label="AI crash risk">${compactMeter(x.aiRisk,5,'risk')}</div><div class="row-score" data-label="Theme dependency">${compactMeter(x.themeDependency,5,'dependency')}</div><div class="row-score" data-label="Cyclicality">${compactMeter(x.cyclicality,5,'cycle')}</div><div class="row-score" data-label="Speculation">${compactMeter(x.speculation,5,'spec')}</div></article>`}
function renderRowView(rows){return `<div class="idea-table-wrap"><div class="idea-table"><div class="idea-table-head"><div>${sortHeader('Ticker / company','ticker')}</div><div>${sortHeader('Base conviction','conviction')}</div><div>${sortHeader('Adjusted now','contextConviction')}</div><div>${sortHeader('AI crash','aiRisk')}</div><div>${sortHeader('Theme dep.','themeDependency')}</div><div>${sortHeader('Cyclicality','cyclicality')}</div><div>${sortHeader('Speculation','speculation')}</div></div>${rows.map(renderRow).join('')}</div></div>`}
function updateViewControls(){const card=state.view==='card';$('#cardViewBtn').classList.toggle('active',card);$('#rowViewBtn').classList.toggle('active',!card);$('#cardViewBtn').setAttribute('aria-pressed',String(card));$('#rowViewBtn').setAttribute('aria-pressed',String(!card))}
function setView(view){state.view=view;localStorage.setItem('powerStackView',view);updateViewControls();render()}
function bindIdeaOpeners(){document.querySelectorAll('.idea-card,.idea-row').forEach(c=>{const open=()=>openDetail(ideas.find(x=>x.ticker===c.dataset.ticker));c.onclick=open;c.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}}});document.querySelectorAll('.row-sort').forEach(btn=>btn.onclick=e=>{e.stopPropagation();const key=btn.dataset.sortKey;if(state.sort===key)state.sortDir=state.sortDir==='asc'?'desc':'asc';else{state.sort=key;state.sortDir=defaultSortDir(key)};$('#sort').value=state.sort;render()})}
function macroChip(x){const t=themeContext(x),mode=contextState(x),delta=contextDelta(x);if(!stockProfile(x))return'<span class="live-chip neutral">NO PROFILE</span>';if(mode==='stale')return'<span class="live-chip stale">STALE</span>';return `<span class="live-chip ${scoreClass(delta)}">${fmtSigned(delta,2)} MACRO</span>`}
function renderCard(x){
  const adj=contextConviction(x);
  return `<article class="idea-card" data-ticker="${esc(x.ticker)}"><div class="card-head"><div><div class="ticker-row"><div class="ticker">${esc(x.ticker)}</div>${macroChip(x)}</div><div class="company">${esc(x.name)} · ${esc(x.market)}</div></div><div class="status-badge">${esc(statusBucket(x))}</div></div><div class="card-tags"><span class="tag">${esc(x.themeGroup)}</span><span class="tag">${esc(regionBucket(x))}</span><span class="tag">${esc(x.theme)}</span></div><p class="thesis">${esc(x.thesis)}</p><div class="score-block">${scoreLine('Base conviction',x.conviction,10,'conv')}${scoreLine('Adjusted now',adj,10,'context')}${scoreLine('AI crash',x.aiRisk,5,'risk')}${scoreLine('Theme dep.',x.themeDependency,5,'')}</div><div class="card-foot"><span>Cycle ${esc(x.cyclicality)}/5 · Spec ${esc(x.speculation)}/5</span><span class="desk-tilt ${scoreClass(contextDelta(x))}">${contextState(x)==='fresh'?`${contextSignalContributions(x).length} macro driver${contextSignalContributions(x).length===1?'':'s'}`:contextState(x)==='stale'?'Macro paused':'No macro overlay'}</span></div></article>`
}

function renderSummary(rows){const avg=rows.length?rows.reduce((s,x)=>s+Number(x.conviction||0),0)/rows.length:0;const ctxAvg=rows.length?rows.reduce((s,x)=>s+contextConviction(x),0)/rows.length:0;const priorities=rows.filter(x=>statusBucket(x)==='Priority').length;const lowTheme=rows.filter(x=>Number(x.themeDependency)<=2).length;$('#summaryStats').innerHTML=`<div class="summary-card"><b>${rows.length}</b><span>Ideas in view</span></div><div class="summary-card"><b>${avg.toFixed(1)}</b><span>Base conviction</span></div><div class="summary-card"><b>${ctxAvg.toFixed(1)}</b><span>Macro-adjusted</span></div><div class="summary-card"><b>${priorities} / ${lowTheme}</b><span>Priority / low dependency</span></div>`}

function renderSignalMini(t){const fresh=packetFresh(),impact=themeDelta(t.theme),drivers=themeTopDrivers(t.theme),top=drivers[0];return `<div class="theme-signal ${fresh?'':'stale-panel'}"><div class="signal-top"><span class="signal-name">${esc(t.theme)}</span><b class="signal-score ${fresh?scoreClass(impact):'neutral'}">${fresh?fmtSigned(impact,2):'STALE'}</b></div><div class="signal-track"><span class="signal-fill ${fresh?scoreClass(impact):'neutral'}" style="width:${fresh?clamp(Math.abs(impact)*50,0,50):0}%"></span></div><div class="signal-driver">${top?`${esc(prettyKind(top.kind))} ${fmtSigned(top.total,2)} avg`:`${esc(t.regime||'No stock-level driver')}`}</div><div class="signal-freshness">${fresh?'average stock macro adjustment · stock-specific':'no adjustment · stale snapshot'}</div></div>`}
function renderBlockMini(c){const fresh=channelFresh(c),width=Math.abs(Number(c.score))/2*50,cls=fresh?scoreClass(c.score):'neutral';return `<div class="theme-signal ${fresh?'':'stale-panel'}"><div class="signal-top"><span class="signal-name">${esc(c.label||c.key)}</span><b class="signal-score ${cls}">${fresh?fmtSigned(c.score):'STALE'}</b></div><div class="signal-track"><span class="signal-fill ${cls}" style="width:${fresh?clamp(width,0,50):0}%"></span></div><div class="signal-driver">${esc(c.regime||'')} · ${esc(c.interpretation||'')}</div><div class="signal-freshness">${fresh?`${Math.round(Number(c.confidence||0)*100)}% confidence · ${timeLabel(c.observedAt||macroContext.generatedAt)}`:'stale channel · no influence'}</div></div>`}
function renderContext(){
  const title=$('#contextTitle'),meta=$('#contextMeta'),body=$('#contextBody');
  if(!macroContext?.channels?.length){title.textContent='Macro pulse';meta.textContent='Macro snapshot unavailable · using base scores';body.innerHTML='<div class="context-copy">Power Stack remains usable without macro context. Macro adjustments stay at zero until data/macro-context.json is refreshed.</div>';return}
  const packetOk=packetFresh();meta.textContent=`${macroContext.source||'Power Stack Macro Context'} · ${packetOk?'fresh snapshot':'stale snapshot'} · ${timeLabel(macroContext.generatedAt)}`;
  if(state.theme!=='All'){
    const t=macroContext.themes?.find(v=>v.theme===state.theme),impact=themeDelta(state.theme),drivers=themeTopDrivers(state.theme);title.textContent=`${state.theme} · stock-level macro impact`;
    const lis=drivers.length?`<ul>${drivers.map(d=>`<li><b>${esc(prettyKind(d.kind))} ${fmtSigned(d.total,2)} avg</b> — average contribution across profiled stocks in this theme.</li>`).join('')}</ul>`:'No fresh profiled macro drivers.';
    body.innerHTML=`<div class="single-context"><div class="context-gauge"><strong class="${packetOk?scoreClass(impact):'neutral'}">${packetOk?fmtSigned(impact,2):'—'}</strong><span>${packetOk?`${esc(t?.regime||'stock-specific')} · ${t?.confidence||'—'}% theme confidence`:'Stale · adjustment disabled'}</span></div><div class="context-copy">${lis}</div></div>`;return;
  }
  title.textContent='Macro regime → stock fingerprints';
  const blocks=`<div class="macro-section"><div class="macro-section-title">DIRECTIONAL MACRO CHANNELS</div><div class="context-themes">${macroContext.channels.map(renderBlockMini).join('')}</div></div>`;
  const themes=`<div class="macro-section"><div class="macro-section-title">AVERAGE STOCK IMPACT BY THEME</div><div class="context-themes">${(macroContext.themes||[]).map(renderSignalMini).join('')}</div></div>`;
  body.innerHTML=blocks+themes;
}

function renderReasonRows(x){
  const p=stockProfile(x),mode=contextState(x);if(!p)return'<div class="reason-empty">No researched stock macro fingerprint exists yet, so this idea receives zero macro adjustment.</div>';
  if(mode==='stale')return `<div class="stale-callout"><b>No macro adjustment applied.</b><span>The macro snapshot is stale. Base conviction remains unchanged.</span></div>`;
  const rows=contextSignalContributions(x),watches=contextWatchSignals(x);
  const scored=rows.length?`<div class="reason-list">${rows.map(r=>{const url=safeUrl(r.sourceUrl);return `<div class="reason-row"><div class="reason-delta ${scoreClass(r.adjustment)}">${fmtSigned(r.adjustment,3)}</div><div class="reason-copy"><b>${esc(r.title)}</b><p>${esc(r.detail||'')} ${r.rationale?`Stock link: ${esc(r.rationale)}`:''}</p><div class="reason-meta"><span>Macro ${fmtSigned(r.channelScore,2)}</span><span>F ${fmtSigned(r.fundamentalSensitivity,1)}/5 · M ${fmtSigned(r.marketSensitivity,1)}/5</span><span>Weight ${(r.factorWeight*100).toFixed(1)}%</span><span>Sensitivity ${fmtSigned(r.effectiveSensitivity,2)}</span><span>${esc(timeLabel(r.observedAt))}</span>${url?`<a href="${esc(url)}" target="_blank" rel="noopener">source ↗</a>`:''}</div></div></div>`}).join('')}</div>`:'<div class="reason-empty">Fresh macro channels net to no material stock-specific adjustment.</div>';
  const watch=watches.length?`<div class="watch-block"><div class="watch-title">Macro tensions / next tests</div>${watches.map(s=>`<div class="watch-row"><span>${esc(s.kind||'watch')}</span><div><b>${esc(s.title)}</b><p>${esc(s.detail||'')}</p>${s.nextTest?`<small>Next test: ${esc(s.nextTest)}</small>`:''}</div></div>`).join('')}</div>`:'';
  return `<div class="context-explain"><div class="formula-line"><b>Stock fingerprint confidence ${Math.round(Number(p.profileConfidence||0)*100)}%.</b> Each channel uses 65% fundamental + 35% market sensitivity, then factor/channel confidence and freshness. Contributions sum to the Macro adjustment, capped at ±1.00.</div>${scored}${watch}</div>`;
}

function render(){const rows=filteredIdeas(),container=$('#grid');$('#count').textContent=rows.length;container.className=state.view==='row'?'idea-row-view':'idea-grid';container.innerHTML=rows.length?(state.view==='row'?renderRowView(rows):rows.map(renderCard).join('')):'<div class="empty">No matching ideas.</div>';$('#viewSubtitle').textContent=[state.theme!=='All'?state.theme:null,state.region!=='All'?state.region:null,state.status!=='All'?state.status:null].filter(Boolean).join(' · ')||'Long-duration theses with a separate macro-regime overlay.';$('h1').textContent=state.theme!=='All'?state.theme:state.region!=='All'?state.region:state.status!=='All'?state.status:'All Ideas';renderSummary(rows);renderContext();updateViewControls();bindIdeaOpeners()}

function openDetail(x){
  if(!x)return;const t=themeContext(x),delta=contextDelta(x),adj=contextConviction(x),mode=contextState(x);
  $('#dialogMarket').textContent=`${x.market} · ${x.region} · updated ${x.lastUpdated||'—'}`;$('#dialogTitle').textContent=`${x.ticker} — ${x.name}`;
  const sources=(x.sources||[]).map(s=>`<a class="source-link" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label||s.url)} ↗</a>`).join('')||'<p>No stored source link yet.</p>';
  const comparison=`<div class="conviction-compare"><div><span>BASE</span><b>${Number(x.conviction).toFixed(1)}</b></div><div class="compare-arrow">→</div><div><span>MACRO-ADJUSTED</span><b class="${scoreClass(delta)}">${adj.toFixed(1)}</b></div>${mode==='fresh'?`<div class="big-live-chip ${scoreClass(delta)}">${fmtSigned(delta,2)} MACRO</div>`:`<div class="big-live-chip stale">${mode==='stale'?'STALE':'NO MACRO'}</div>`}</div>`;
  $('#dialogBody').innerHTML=`${comparison}<div class="detail-grid"><div class="detail"><h3>Thesis</h3><p>${esc(x.thesis)}</p></div><div class="detail"><h3>Catalysts</h3><p>${esc(x.catalysts)}</p></div><div class="detail"><h3>Risks</h3><p>${esc(x.risks)}</p></div><div class="detail"><h3>Research stance</h3><p>${esc(x.researchNote||'—')}</p></div><div class="detail full live-rationale"><h3>Why Macro moved this idea</h3>${renderReasonRows(x)}</div><div class="detail full"><h3>Scores</h3><p>Base conviction ${x.conviction}/10 · Macro-adjusted ${adj.toFixed(1)}/10 · AI crash ${x.aiRisk}/5 · Theme dependency ${x.themeDependency}/5 · Cyclicality ${x.cyclicality}/5 · Speculation ${x.speculation}/5.${t?` Theme regime: ${esc(t.regime)}. Stock macro-profile confidence ${Math.round(Number(stockProfile(x)?.profileConfidence||0)*100)}%.`:''}</p></div><div class="detail full"><h3>Sources</h3>${sources}</div></div>`;
  $('#detailDialog').showModal();
}

async function loadMacroContext(){
  try{const r=await fetch('data/macro-context.json',{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);macroContext=await r.json();const fresh=packetFresh();$('#liveBadge').className=`live-badge ${fresh?'online':'stale'}`;$('#liveBadge').innerHTML=fresh?'<span></span> Macro snapshot active':'<span></span> Macro snapshot stale'}catch(err){macroContext=null;$('#liveBadge').className='live-badge offline';$('#liveBadge').innerHTML='<span></span> Macro snapshot unavailable'}
}
async function loadMacroProfiles(){
  try{
    const r=await fetch('data/macro-sensitivities.json',{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const base=await r.json();let supplement={stocks:[]};
    try{const s=await fetch('data/macro-sensitivity-supplement.json',{cache:'no-store'});if(s.ok)supplement=await s.json()}catch(_){}
    const merged=new Map((base.stocks||[]).map(p=>[p.ticker,p]));(supplement.stocks||[]).forEach(p=>merged.set(p.ticker,p));
    macroSensitivityData={...base,updatedAt:supplement.updatedAt||base.updatedAt,profileCoverageUpdate:supplement.coverageAdded||[],stocks:[...merged.values()]};
    macroProfileMap=new Map(macroSensitivityData.stocks.map(p=>[p.ticker,p]));
  }catch(err){macroSensitivityData=null;macroProfileMap=new Map()}
}

async function init(){const [ideaRes]=await Promise.all([fetch('data/ideas.json',{cache:'no-store'}),loadMacroContext(),loadMacroProfiles()]);ideas=await ideaRes.json();renderSidebar();render();$('#search').oninput=e=>{state.q=e.target.value;render()};$('#sort').onchange=e=>{state.sort=e.target.value;state.sortDir=defaultSortDir(state.sort);render()};$('#cardViewBtn').onclick=()=>setView('card');$('#rowViewBtn').onclick=()=>setView('row');$('#clearFilters').onclick=()=>{state.theme='All';state.region='All';state.status='All';state.q='';$('#search').value='';renderSidebar();render()};$('#closeDialog').onclick=()=>$('#detailDialog').close();$('#detailDialog').addEventListener('click',e=>{if(e.target===$('#detailDialog'))$('#detailDialog').close()})}
init().catch(err=>{$('#grid').innerHTML=`<div class="empty">Failed to load Power Stack: ${esc(err.message)}</div>`});