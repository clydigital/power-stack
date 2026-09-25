let ideas=[];
let macroContext=null;
let liveDeskContext=null;
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
function liveDeskFresh(){return !!liveDeskContext?.asOf&&ageHours(liveDeskContext.asOf)<=48}
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
function contextDelta(_x){return 0}
function contextConviction(x){return clamp(Number(x.conviction||0),0,10)}
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
  if(!liveDeskContext){
    box.innerHTML='<div class="side-micro">Live monetary snapshot unavailable. Base research scores remain unchanged.</div>';
    dot.className='live-dot';
    $('#liveTimestamp').textContent='Waiting for Live Desk snapshot…';
    return;
  }
  const fresh=liveDeskFresh();
  dot.className=`live-dot ${fresh?'online':'stale'}`;
  const signals=liveDeskContext?.monetarySignals?.signals||[];
  if(signals.length){
    box.innerHTML=signals.slice(0,6).map(s=>`<div class="pulse-row ${fresh?'':'stale'}"><div class="pulse-label"><span>${esc(s.label||s.key)}</span><b class="${s.confirmation==='CONFIRMING'?'pos':s.confirmation==='CONTRADICTING'?'neg':'neutral'}">${esc(s.confirmation||'UNRESOLVED')}</b></div><div class="pulse-regime">${esc(s.direction||'UNRESOLVED')}</div></div>`).join('');
  }else{
    const rates=liveDeskContext?.rateRegime?.signals||[];
    box.innerHTML=rates.length
      ? rates.slice(0,6).map(s=>`<div class="pulse-row ${fresh?'':'stale'}"><div class="pulse-label"><span>${esc(s.label||s.key)}</span><b class="neutral">${esc(s.state||'UNRESOLVED')}</b></div><div class="pulse-regime">${esc(s.detail||'')}</div></div>`).join('')
      : '<div class="side-micro">Live snapshot is present; monetary-signal v2 fields are pending the next sync.</div>';
  }
  $('#liveTimestamp').textContent=`${fresh?'Live snapshot':'Live snapshot stale'} · ${timeLabel(liveDeskContext.asOf)}`;
}

function defaultSortDirfunction defaultSortDir(key){return key==='ticker'?'asc':key==='conviction'?'desc':'asc'}
function sortValue(x,key){if(key==='ticker')return `${x.ticker} ${x.name}`.toLowerCase();return Number(x[key]??0)}
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
function renderRow(x){const profiled=Boolean(stockProfile(x));return `<article class="idea-row" data-ticker="${esc(x.ticker)}" tabindex="0" role="button" aria-label="Open ${esc(x.ticker)} ${esc(x.name)} details"><div class="row-stock"><div class="row-stock-top"><strong>${esc(x.ticker)}</strong>${macroChip(x)}</div><span>${esc(x.name)} · ${esc(x.market)}</span><small>${esc(statusBucket(x))} · ${esc(x.themeGroup)}</small></div><div class="row-score" data-label="Base conviction">${compactMeter(x.conviction,10,'conv')}</div><div class="row-score" data-label="Macro overlay"><div class="reason-empty">${profiled?'PROFILED':'UNMAPPED'}</div></div><div class="row-score" data-label="AI crash risk">${compactMeter(x.aiRisk,5,'risk')}</div><div class="row-score" data-label="Theme dependency">${compactMeter(x.themeDependency,5,'dependency')}</div><div class="row-score" data-label="Cyclicality">${compactMeter(x.cyclicality,5,'cycle')}</div><div class="row-score" data-label="Speculation">${compactMeter(x.speculation,5,'spec')}</div></article>`}
function renderRowView(rows){return `<div class="idea-table-wrap"><div class="idea-table"><div class="idea-table-head"><div>${sortHeader('Ticker / company','ticker')}</div><div>${sortHeader('Base conviction','conviction')}</div><div><span>Macro overlay</span></div><div>${sortHeader('AI crash','aiRisk')}</div><div>${sortHeader('Theme dep.','themeDependency')}</div><div>${sortHeader('Cyclicality','cyclicality')}</div><div>${sortHeader('Speculation','speculation')}</div></div>${rows.map(renderRow).join('')}</div></div>`}
function updateViewControlsfunction updateViewControls(){const card=state.view==='card';$('#cardViewBtn').classList.toggle('active',card);$('#rowViewBtn').classList.toggle('active',!card);$('#cardViewBtn').setAttribute('aria-pressed',String(card));$('#rowViewBtn').setAttribute('aria-pressed',String(!card))}
function setView(view){state.view=view;localStorage.setItem('powerStackView',view);updateViewControls();render()}
function bindIdeaOpeners(){document.querySelectorAll('.idea-card,.idea-row').forEach(c=>{const open=()=>openDetail(ideas.find(x=>x.ticker===c.dataset.ticker));c.onclick=open;c.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}}});document.querySelectorAll('.row-sort').forEach(btn=>btn.onclick=e=>{e.stopPropagation();const key=btn.dataset.sortKey;if(state.sort===key)state.sortDir=state.sortDir==='asc'?'desc':'asc';else{state.sort=key;state.sortDir=defaultSortDir(key)};$('#sort').value=state.sort;render()})}
function macroChip(x){return stockProfile(x)?'<span class="live-chip neutral">MACRO PROFILE</span>':'<span class="live-chip neutral">NO PROFILE</span>'}
function renderCard(x){
  const profiled=Boolean(stockProfile(x));
  return `<article class="idea-card" data-ticker="${esc(x.ticker)}"><div class="card-head"><div><div class="ticker-row"><div class="ticker">${esc(x.ticker)}</div>${macroChip(x)}</div><div class="company">${esc(x.name)} · ${esc(x.market)}</div></div><div class="status-badge">${esc(statusBucket(x))}</div></div><div class="card-tags"><span class="tag">${esc(x.themeGroup)}</span><span class="tag">${esc(regionBucket(x))}</span><span class="tag">${esc(x.theme)}</span></div><p class="thesis">${esc(x.thesis)}</p><div class="score-block">${scoreLine('Base conviction',x.conviction,10,'conv')}${scoreLine('AI crash',x.aiRisk,5,'risk')}${scoreLine('Theme dep.',x.themeDependency,5,'')}</div><div class="card-foot"><span>Cycle ${esc(x.cyclicality)}/5 · Spec ${esc(x.speculation)}/5</span><span class="desk-tilt neutral">${profiled?'Macro sensitivity mapped':'Macro sensitivity unmapped'}</span></div></article>`
}

function renderSummary(rows){const avg=rows.length?rows.reduce((s,x)=>s+Number(x.conviction||0),0)/rows.length:0;const profiled=rows.filter(x=>stockProfile(x)).length;const priorities=rows.filter(x=>statusBucket(x)==='Priority').length;const lowTheme=rows.filter(x=>Number(x.themeDependency)<=2).length;$('#summaryStats').innerHTML=`<div class="summary-card"><b>${rows.length}</b><span>Ideas in view</span></div><div class="summary-card"><b>${avg.toFixed(1)}</b><span>Base conviction</span></div><div class="summary-card"><b>${profiled} / ${rows.length}</b><span>Macro profiles mapped</span></div><div class="summary-card"><b>${priorities} / ${lowTheme}</b><span>Priority / low dependency</span></div>`}

function renderSignalMinifunction renderSignalMini(t){const fresh=packetFresh(),impact=themeDelta(t.theme),drivers=themeTopDrivers(t.theme),top=drivers[0];return `<div class="theme-signal ${fresh?'':'stale-panel'}"><div class="signal-top"><span class="signal-name">${esc(t.theme)}</span><b class="signal-score ${fresh?scoreClass(impact):'neutral'}">${fresh?fmtSigned(impact,2):'STALE'}</b></div><div class="signal-track"><span class="signal-fill ${fresh?scoreClass(impact):'neutral'}" style="width:${fresh?clamp(Math.abs(impact)*50,0,50):0}%"></span></div><div class="signal-driver">${top?`${esc(prettyKind(top.kind))} ${fmtSigned(top.total,2)} avg`:`${esc(t.regime||'No stock-level driver')}`}</div><div class="signal-freshness">${fresh?'average stock macro adjustment · stock-specific':'no adjustment · stale snapshot'}</div></div>`}
function renderBlockMini(c){const fresh=channelFresh(c),width=Math.abs(Number(c.score))/2*50,cls=fresh?scoreClass(c.score):'neutral';return `<div class="theme-signal ${fresh?'':'stale-panel'}"><div class="signal-top"><span class="signal-name">${esc(c.label||c.key)}</span><b class="signal-score ${cls}">${fresh?fmtSigned(c.score):'STALE'}</b></div><div class="signal-track"><span class="signal-fill ${cls}" style="width:${fresh?clamp(width,0,50):0}%"></span></div><div class="signal-driver">${esc(c.regime||'')} · ${esc(c.interpretation||'')}</div><div class="signal-freshness">${fresh?`${Math.round(Number(c.confidence||0)*100)}% confidence · ${timeLabel(c.observedAt||macroContext.generatedAt)}`:'stale channel · no influence'}</div></div>`}
function renderLiveDeskCrossCheck(){
  if(!liveDeskContext)return '<div class="macro-section"><div class="macro-section-title">LIVE DESK CANONICAL BASELINE</div><div class="context-copy">Live Desk snapshot unavailable. Power Stack keeps Base Conviction unchanged and records the macro-context gap rather than rebuilding a competing regime.</div></div>';
  const fresh=liveDeskFresh(),regime=liveDeskContext.regime||{},signals=liveDeskContext?.monetarySignals?.signals||[],lenses=liveDeskContext.lenses||[],radar=liveDeskContext.stockRadar||[],verify=liveDeskContext.verification||{};
  const signalHtml=signals.length
    ? signals.slice(0,10).map(s=>`<div class="theme-signal ${fresh?'':'stale-panel'}"><div class="signal-top"><span class="signal-name">${esc(s.label||s.key)}</span><b class="signal-score ${s.confirmation==='CONFIRMING'?'pos':s.confirmation==='CONTRADICTING'?'neg':'neutral'}">${esc(s.confirmation||'UNRESOLVED')}</b></div><div class="signal-driver">${esc(s.detail||'')}</div><div class="signal-freshness">${esc(s.direction||'UNRESOLVED')} · ${esc(s.asOf||'no timestamp')}</div></div>`).join('')
    : lenses.slice(0,6).map(l=>`<div class="theme-signal ${fresh?'':'stale-panel'}"><div class="signal-top"><span class="signal-name">${esc(l.label||l.key)}</span><b class="signal-score neutral">${l.observed?'OBSERVED':'OPEN'}</b></div><div class="signal-driver">${esc(l.interpretation||l.reaction||'')}</div><div class="signal-freshness">${l.unresolvedSignals?.length?`Open: ${esc(l.unresolvedSignals.join(' · '))}`:`Live evidence refs ${(l.evidenceRefs||[]).length}`}</div></div>`).join('');
  const health=liveDeskContext.sourceHealth||{};
  const healthText=Object.keys(health).length?Object.entries(health).map(([k,v])=>`${k}: ${v}`).join(' · '):'Source-health details pending v2 sync';
  const contradictions=(liveDeskContext.contradictions||[]).slice(0,3);
  const gaps=(liveDeskContext.researchGaps||[]).slice(0,3);
  const openHtml=(contradictions.length||gaps.length)?`<div class="context-copy"><b>Open contradictions / gaps:</b><ul>${contradictions.map(x=>`<li>${esc(x.title||x.detail||'Contradiction')}</li>`).join('')}${gaps.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:'';
  const radarHtml=radar.length?`<div class="context-copy"><b>Live Stock Radar:</b> ${radar.map(x=>`<span class="tag">${esc(x.symbol)}</span>`).join(' ')}<br><span style="color:var(--muted)">Research priority only. Power Stack fundamentals, valuation and entry discipline remain independent.</span></div>`:'';
  return `<div class="macro-section"><div class="macro-section-title">LIVE DESK CANONICAL BASELINE · ${fresh?'FRESH':'STALE'}</div><div class="single-context"><div class="context-copy"><b>${esc(regime.family||'UNRESOLVED')}</b> — ${esc(regime.headline||regime.answer||'No canonical regime headline.')}</div></div><div class="context-copy"><b>Source health:</b> ${esc(healthText)}</div><div class="context-themes">${signalHtml}</div>${openHtml}${radarHtml}<div class="context-copy">Creator verification: ${Number(verify.verifiedCount||0)} verified · ${Number(verify.partialCount||0)} partial · ${Number(verify.creatorOnlyCount||0)} creator-only. None of these fields mechanically changes Base Conviction.</div></div>`;
}

function renderContext(){
  const title=$('#contextTitle'),meta=$('#contextMeta'),body=$('#contextBody');
  if(!liveDeskContext){
    title.textContent='Live monetary state → Power Stack';
    meta.textContent='Live snapshot unavailable · Base Conviction unchanged';
    body.innerHTML=renderLiveDeskCrossCheck();
    return;
  }
  const fresh=liveDeskFresh();
  title.textContent=state.theme!=='All'?`${state.theme} · Live portfolio overlay`:'Live monetary state → Power Stack';
  meta.textContent=`Alchemy Live Desk · ${fresh?'fresh snapshot':'stale snapshot'} · ${timeLabel(liveDeskContext.asOf)}`;
  const profiled=state.theme!=='All'?ideas.filter(x=>x.themeGroup===state.theme&&stockProfile(x)).length:null;
  const profileNote=profiled===null?'':`<div class="context-copy"><b>Power Stack exposure map:</b> ${profiled} names in this theme have documented macro-sensitivity profiles. These profiles guide investigation and risk checks; they do not alter the numeric company score.</div>`;
  body.innerHTML=renderLiveDeskCrossCheck()+profileNote;
}

function renderReasonRowsfunction renderSensitivityProfile(x){
  const p=stockProfile(x);
  if(!p)return '<div class="reason-empty">No documented Power Stack macro-sensitivity profile yet. Treat this as a research gap, not as zero sensitivity.</div>';
  const rows=Object.entries(p.factors||{}).filter(([,f])=>Number(f?.weight||0)>0).sort((a,b)=>Number(b[1]?.weight||0)-Number(a[1]?.weight||0));
  if(!rows.length)return '<div class="reason-empty">Profile exists, but no active sensitivity factors are mapped.</div>';
  return `<div class="context-explain"><div class="formula-line"><b>Profile confidence ${Math.round(Number(p.profileConfidence||0)*100)}%.</b> These are exposure mappings only; Live monetary signals are evaluated separately and do not add/subtract from Base Conviction.</div><div class="reason-list">${rows.map(([key,f])=>`<div class="reason-row"><div class="reason-copy"><b>${esc(prettyKind(key))}</b><p>${esc(f.rationale||'Documented sensitivity.')}</p><div class="reason-meta"><span>Fundamental ${fmtSigned(f.fundamental,1)}/5</span><span>Market ${fmtSigned(f.market,1)}/5</span><span>Weight ${(Number(f.weight||0)*100).toFixed(0)}%</span></div></div></div>`).join('')}</div></div>`;
}

function render(){function render(){const rows=filteredIdeas(),container=$('#grid');$('#count').textContent=rows.length;container.className=state.view==='row'?'idea-row-view':'idea-grid';container.innerHTML=rows.length?(state.view==='row'?renderRowView(rows):rows.map(renderCard).join('')):'<div class="empty">No matching ideas.</div>';$('#viewSubtitle').textContent=[state.theme!=='All'?state.theme:null,state.region!=='All'?state.region:null,state.status!=='All'?state.status:null].filter(Boolean).join(' · ')||'Company research with a separate Live-owned monetary and market-risk overlay.';$('h1').textContent=state.theme!=='All'?state.theme:state.region!=='All'?state.region:state.status!=='All'?state.status:'All Ideas';renderSummary(rows);renderContext();updateViewControls();bindIdeaOpeners()}

function openDetail(x){
  if(!x)return;
  const p=stockProfile(x);
  $('#dialogMarket').textContent=`${x.market} · ${x.region} · updated ${x.lastUpdated||'—'}`;$('#dialogTitle').textContent=`${x.ticker} — ${x.name}`;
  const sources=(x.sources||[]).map(s=>`<a class="source-link" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label||s.url)} ↗</a>`).join('')||'<p>No stored source link yet.</p>';
  const comparison=`<div class="conviction-compare"><div><span>BASE CONVICTION</span><b>${Number(x.conviction).toFixed(1)}</b></div><div class="big-live-chip neutral">LIVE OVERLAY SEPARATE</div></div>`;
  $('#dialogBody').innerHTML=`${comparison}<div class="detail-grid"><div class="detail"><h3>Thesis</h3><p>${esc(x.thesis)}</p></div><div class="detail"><h3>Catalysts</h3><p>${esc(x.catalysts)}</p></div><div class="detail"><h3>Risks</h3><p>${esc(x.risks)}</p></div><div class="detail"><h3>Research stance</h3><p>${esc(x.researchNote||'—')}</p></div><div class="detail full live-rationale"><h3>Macro exposure profile</h3>${renderSensitivityProfile(x)}</div><div class="detail full"><h3>Scores</h3><p>Base conviction ${x.conviction}/10 · AI crash ${x.aiRisk}/5 · Theme dependency ${x.themeDependency}/5 · Cyclicality ${x.cyclicality}/5 · Speculation ${x.speculation}/5.${p?` Macro-profile confidence ${Math.round(Number(p.profileConfidence||0)*100)}%.`:''} Live context is not added to this score.</p></div><div class="detail full"><h3>Sources</h3>${sources}</div></div>`;
  $('#detailDialog').showModal();
}

async function loadMacroContextasync function loadMacroContext(){
  try{const r=await fetch('data/macro-context.json',{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);macroContext=await r.json();const fresh=packetFresh();$('#liveBadge').className=`live-badge ${fresh?'online':'stale'}`;$('#liveBadge').innerHTML=fresh?'<span></span> Macro snapshot active':'<span></span> Macro snapshot stale'}catch(err){macroContext=null;$('#liveBadge').className='live-badge offline';$('#liveBadge').innerHTML='<span></span> Macro snapshot unavailable'}
}
async function loadLiveDeskContext(){
  try{
    const r=await fetch('data/live-desk-canonical.json',{cache:'no-store'});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    liveDeskContext=await r.json();
    const fresh=liveDeskFresh();
    $('#liveBadge').className=`live-badge ${fresh?'online':'stale'}`;
    $('#liveBadge').innerHTML=fresh?'<span></span> Live macro active':'<span></span> Live macro stale';
  }catch(_){
    liveDeskContext=null;
    $('#liveBadge').className='live-badge offline';
    $('#liveBadge').innerHTML='<span></span> Live macro unavailable';
  }
}
async function loadMacroProfiles(){async function loadMacroProfiles(){
  try{
    const r=await fetch('data/macro-sensitivities.json',{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const base=await r.json();let supplement={stocks:[]};
    try{const s=await fetch('data/macro-sensitivity-supplement.json',{cache:'no-store'});if(s.ok)supplement=await s.json()}catch(_){}
    const merged=new Map((base.stocks||[]).map(p=>[p.ticker,p]));(supplement.stocks||[]).forEach(p=>merged.set(p.ticker,p));
    macroSensitivityData={...base,updatedAt:supplement.updatedAt||base.updatedAt,profileCoverageUpdate:supplement.coverageAdded||[],stocks:[...merged.values()]};
    macroProfileMap=new Map(macroSensitivityData.stocks.map(p=>[p.ticker,p]));
  }catch(err){macroSensitivityData=null;macroProfileMap=new Map()}
}

async function init(){const [ideaRes]=await Promise.all([fetch('data/ideas.json',{cache:'no-store'}),loadLiveDeskContext(),loadMacroProfiles()]);ideas=await ideaRes.json();renderSidebar();render();$('#search').oninput=e=>{state.q=e.target.value;render()};$('#sort').onchange=e=>{state.sort=e.target.value;state.sortDir=defaultSortDir(state.sort);render()};$('#cardViewBtn').onclick=()=>setView('card');$('#rowViewBtn').onclick=()=>setView('row');$('#clearFilters').onclick=()=>{state.theme='All';state.region='All';state.status='All';state.q='';$('#search').value='';renderSidebar();render()};$('#closeDialog').onclick=()=>$('#detailDialog').close();$('#detailDialog').addEventListener('click',e=>{if(e.target===$('#detailDialog'))$('#detailDialog').close()})}
init().catch(err=>{$('#grid').innerHTML=`<div class="empty">Failed to load Power Stack: ${esc(err.message)}</div>`});