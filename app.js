let ideas=[];
let liveContext=null;
const LIVE_URL='https://alchemy-live-market-desk.vercel.app/api/power-stack-context';
const CONTEXT_PACKET_MAX_HOURS=18;
const state={theme:'All',region:'All',status:'All',q:'',sort:'conviction'};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const uniq=arr=>[...new Set(arr.filter(Boolean))].sort();
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

function regionBucket(x){const r=(x.region||'').toLowerCase();if(r.includes('malaysia'))return'Malaysia';if(r.includes('hong kong')||r.includes('china')||r.includes('kazakhstan'))return'HK / China';if(r==='us'||r.includes('united states'))return'US';return'Global'}
function statusBucket(x){const s=(x.status||'').toLowerCase();if(s.includes('priority'))return'Priority';if(s.includes('core'))return'Core';if(s.includes('speculative')||s.includes('high-beta'))return'Speculative';if(s.includes('queue')||s.includes('low-priority'))return'Research Queue';return'Watchlist'}
function themeContext(x){return liveContext?.themes?.find(t=>t.theme===x.themeGroup)||null}
function parseMs(v){const ms=Date.parse(v||'');return Number.isFinite(ms)?ms:null}
function ageHours(v){const ms=parseMs(v);return ms===null?Infinity:(Date.now()-ms)/36e5}
function packetFresh(){return Boolean(liveContext)&&ageHours(liveContext.generatedAt||liveContext.marketUpdatedAt)<=CONTEXT_PACKET_MAX_HOURS}
function themeFresh(t){if(!t||!packetFresh())return false;if(t.fresh===false)return false;const max=Number(t.staleAfterHours||CONTEXT_PACKET_MAX_HOURS);const stamp=t.freshestAt||liveContext.marketUpdatedAt||liveContext.generatedAt;return ageHours(stamp)<=Math.max(max,CONTEXT_PACKET_MAX_HOURS)}
function scoreClass(v){return v>0.015?'pos':v<-0.015?'neg':'neutral'}
function fmtSigned(v,d=1){const n=Number(v||0);return `${n>0?'+':''}${n.toFixed(d)}`}
function pct(v,max){return `${clamp(Number(v||0)/max*100,0,100)}%`}
function counts(items,getter){const out={};items.forEach(x=>{const k=getter(x);out[k]=(out[k]||0)+1});return out}
function prettyKind(kind){return ({market_state:'Desk state',market_row:'Market data',contradiction:'Contradiction',research_trigger:'Research trigger'})[kind]||'Live signal'}
function safeUrl(url){return /^https?:\/\//i.test(String(url||''))?String(url):null}
function timeLabel(v){if(!v)return'No timestamp';const d=new Date(v);return Number.isNaN(d.getTime())?'No timestamp':d.toLocaleString()}

function contextSignalContributions(x){
  const t=themeContext(x);
  if(!t||!themeFresh(t))return[];
  const factor=(Number(x.themeDependency||3)/5)*0.5;
  const available=(t.signals||[]).filter(s=>s.fresh!==false&&Number.isFinite(Number(s.themeContribution))&&Math.abs(Number(s.themeContribution))>0.0001);
  let rows=available.map(s=>({...s,adjustment:Number(s.themeContribution)*factor}));
  if(!rows.length&&Number.isFinite(Number(t.score))&&Math.abs(Number(t.score))>0.0001){
    rows=[{id:'legacy-theme-score',kind:'theme_score',title:`${t.theme} aggregate`,detail:(t.drivers||[])[0]||'Aggregate Live Desk theme score.',themeContribution:Number(t.score),adjustment:Number(t.score)*factor,observedAt:t.freshestAt||liveContext.marketUpdatedAt||liveContext.generatedAt,sourceName:liveContext.source||'Alchemy Live Desk',sourceUrl:null,fresh:true}];
  }
  const sum=rows.reduce((s,r)=>s+r.adjustment,0);
  const clipped=clamp(sum,-1,1);
  if(Math.abs(sum)>1&&Math.abs(sum)>0.0001){const scale=clipped/sum;rows=rows.map(r=>({...r,adjustment:r.adjustment*scale}))}
  return rows.sort((a,b)=>Math.abs(b.adjustment)-Math.abs(a.adjustment));
}
function contextWatchSignals(x){const t=themeContext(x);if(!t||!themeFresh(t))return[];return (t.signals||[]).filter(s=>s.fresh!==false&&(s.kind==='contradiction'||s.kind==='research_trigger')).slice(0,5)}
function contextDelta(x){return clamp(contextSignalContributions(x).reduce((s,r)=>s+Number(r.adjustment||0),0),-1,1)}
function contextConviction(x){return clamp(Number(x.conviction||0)+contextDelta(x),0,10)}
function contextState(x){const t=themeContext(x);if(!t)return'none';return themeFresh(t)?'fresh':'stale'}

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
  renderLivePulse();
}

function renderLivePulse(){
  const box=$('#livePulse'),dot=$('#sidebarLiveDot');
  if(!liveContext?.themes?.length){box.innerHTML='<div class="side-micro">No live context yet. Using base research scores.</div>';dot.className='live-dot';return}
  const packetOk=packetFresh();dot.className=`live-dot ${packetOk?'online':'stale'}`;
  box.innerHTML=liveContext.themes.map(t=>{const fresh=themeFresh(t);const pos=clamp((Number(t.score)+2)/4*100,0,100);return `<div class="pulse-row ${fresh?'':'stale'}"><div class="pulse-label"><span>${esc(t.theme)}</span><b class="${fresh?scoreClass(t.score):'stale-text'}">${fresh?fmtSigned(t.score):'STALE'}</b></div><div class="pulse-track"><span class="pulse-marker" style="left:${pos}%"></span></div></div>`}).join('');
  $('#liveTimestamp').textContent=packetOk?`Market context: ${timeLabel(liveContext.marketUpdatedAt||liveContext.generatedAt)}`:`Cached packet is ${ageHours(liveContext.generatedAt).toFixed(1)}h old · adjustments off`;
}

function filteredIdeas(){
  const q=state.q.trim().toLowerCase();
  const rows=ideas.filter(x=>{const blob=JSON.stringify(x).toLowerCase();return (state.theme==='All'||x.themeGroup===state.theme)&&(state.region==='All'||regionBucket(x)===state.region)&&(state.status==='All'||statusBucket(x)===state.status)&&(!q||blob.includes(q))});
  rows.sort((a,b)=>{if(state.sort==='ticker')return a.ticker.localeCompare(b.ticker);if(state.sort==='conviction')return Number(b.conviction)-Number(a.conviction);if(state.sort==='contextConviction')return contextConviction(b)-contextConviction(a);return Number(a[state.sort]??9)-Number(b[state.sort]??9)});return rows;
}

function scoreLine(label,value,max,cls=''){return `<div class="score-line"><span>${label}</span><div class="bar-track"><div class="bar-fill ${cls}" style="width:${pct(value,max)}"></div></div><b>${Number(value).toFixed(value%1?1:0)}/${max}</b></div>`}
function liveChip(x){const t=themeContext(x),mode=contextState(x),delta=contextDelta(x);if(!t)return'<span class="live-chip neutral">NO LIVE</span>';if(mode==='stale')return'<span class="live-chip stale">STALE</span>';return `<span class="live-chip ${scoreClass(delta)}">${fmtSigned(delta,2)} LIVE</span>`}
function renderCard(x){
  const adj=contextConviction(x);
  return `<article class="idea-card" data-ticker="${esc(x.ticker)}"><div class="card-head"><div><div class="ticker-row"><div class="ticker">${esc(x.ticker)}</div>${liveChip(x)}</div><div class="company">${esc(x.name)} · ${esc(x.market)}</div></div><div class="status-badge">${esc(statusBucket(x))}</div></div><div class="card-tags"><span class="tag">${esc(x.themeGroup)}</span><span class="tag">${esc(regionBucket(x))}</span><span class="tag">${esc(x.theme)}</span></div><p class="thesis">${esc(x.thesis)}</p><div class="score-block">${scoreLine('Base conviction',x.conviction,10,'conv')}${scoreLine('Adjusted now',adj,10,'context')}${scoreLine('AI crash',x.aiRisk,5,'risk')}${scoreLine('Theme dep.',x.themeDependency,5,'')}</div><div class="card-foot"><span>Cycle ${esc(x.cyclicality)}/5 · Spec ${esc(x.speculation)}/5</span><span class="desk-tilt ${scoreClass(contextDelta(x))}">${contextState(x)==='fresh'?`${contextSignalContributions(x).length} live driver${contextSignalContributions(x).length===1?'':'s'}`:contextState(x)==='stale'?'Context paused':'No overlay'}</span></div></article>`
}

function renderSummary(rows){const avg=rows.length?rows.reduce((s,x)=>s+Number(x.conviction||0),0)/rows.length:0;const ctxAvg=rows.length?rows.reduce((s,x)=>s+contextConviction(x),0)/rows.length:0;const priorities=rows.filter(x=>statusBucket(x)==='Priority').length;const lowTheme=rows.filter(x=>Number(x.themeDependency)<=2).length;$('#summaryStats').innerHTML=`<div class="summary-card"><b>${rows.length}</b><span>Ideas in view</span></div><div class="summary-card"><b>${avg.toFixed(1)}</b><span>Base conviction</span></div><div class="summary-card"><b>${ctxAvg.toFixed(1)}</b><span>Context-adjusted</span></div><div class="summary-card"><b>${priorities} / ${lowTheme}</b><span>Priority / low dependency</span></div>`}

function renderSignalMini(t){const fresh=themeFresh(t),width=Math.abs(Number(t.score))/2*50,cls=fresh?scoreClass(t.score):'neutral',driver=(t.signals||[]).find(s=>Math.abs(Number(s.themeContribution||0))>0.01)?.detail||(t.drivers||[])[0]||'No fresh driver summary.';return `<div class="theme-signal ${fresh?'':'stale-panel'}"><div class="signal-top"><span class="signal-name">${esc(t.theme)}</span><b class="signal-score ${cls}">${fresh?fmtSigned(t.score):'STALE'}</b></div><div class="signal-track"><span class="signal-fill ${cls}" style="width:${fresh?width:0}%"></span></div><div class="signal-driver">${esc(driver)}</div><div class="signal-freshness">${fresh?`fresh · ${timeLabel(t.freshestAt||liveContext.marketUpdatedAt)}`:'no adjustment · stale inputs'}</div></div>`}
function renderContext(){
  const title=$('#contextTitle'),meta=$('#contextMeta'),body=$('#contextBody');
  if(!liveContext?.themes?.length){title.textContent='Cross-theme pulse';meta.textContent='Live feed unavailable · using base scores';body.innerHTML='<div class="context-copy">Power Stack remains fully usable without the Live Desk feed. Context adjustments are disabled until the read-only endpoint is reachable.</div>';return}
  const packetOk=packetFresh();meta.textContent=`${liveContext.source} · ${packetOk?'fresh packet':'stale packet'} · ${timeLabel(liveContext.generatedAt)}`;
  if(state.theme!=='All'){
    const t=liveContext.themes.find(v=>v.theme===state.theme);title.textContent=state.theme;if(!t){body.innerHTML='<div class="context-copy">No matching Live Desk theme overlay.</div>';return}
    const fresh=themeFresh(t);const signals=(t.signals||[]).filter(s=>s.fresh!==false).slice(0,5);body.innerHTML=`<div class="single-context"><div class="context-gauge"><strong class="${fresh?scoreClass(t.score):'neutral'}">${fresh?fmtSigned(t.score):'—'}</strong><span>${fresh?`${esc(t.regime)} · ${t.confidence}% confidence`:'Stale · adjustment disabled'}</span></div><div class="context-copy">${signals.length?`<ul>${signals.map(s=>`<li><b>${esc(s.title)}</b> — ${esc(s.detail)}</li>`).join('')}</ul>`:'No fresh signal detail.'}</div></div>`;return;
  }
  title.textContent='Cross-theme pulse';body.innerHTML=`<div class="context-themes">${liveContext.themes.map(renderSignalMini).join('')}</div>`;
}

function renderReasonRows(x){
  const t=themeContext(x),mode=contextState(x),factor=(Number(x.themeDependency||3)/5)*0.5;
  if(!t)return'<div class="reason-empty">No matching Live Desk theme exists for this idea.</div>';
  if(mode==='stale')return `<div class="stale-callout"><b>No context adjustment applied.</b><span>The latest ${esc(t.theme)} inputs are stale or the cached packet is older than ${CONTEXT_PACKET_MAX_HOURS} hours. Base conviction remains unchanged.</span></div>`;
  const rows=contextSignalContributions(x),watches=contextWatchSignals(x);
  const scored=rows.length?`<div class="reason-list">${rows.map(r=>{const url=safeUrl(r.sourceUrl);return `<div class="reason-row"><div class="reason-delta ${scoreClass(r.adjustment)}">${fmtSigned(r.adjustment,2)}</div><div class="reason-copy"><b>${esc(r.title)}</b><p>${esc(r.detail||'')}</p><div class="reason-meta"><span>${esc(prettyKind(r.kind))}</span><span>${esc(r.sourceName||liveContext.source||'Live Desk')}</span><span>${esc(timeLabel(r.observedAt))}</span>${url?`<a href="${esc(url)}" target="_blank" rel="noopener">source ↗</a>`:''}</div></div></div>`}).join('')}</div>`:'<div class="reason-empty">Fresh inputs are neutral, so the Live Desk applies no conviction adjustment.</div>';
  const watch=watches.length?`<div class="watch-block"><div class="watch-title">Contradictions / research triggers</div>${watches.map(s=>`<div class="watch-row"><span>${esc(prettyKind(s.kind))}</span><div><b>${esc(s.title)}</b><p>${esc(s.detail||'')}</p>${s.nextTest?`<small>Next test: ${esc(s.nextTest)}</small>`:''}</div></div>`).join('')}</div>`:'';
  return `<div class="context-explain"><div class="formula-line">Theme dependency ${Number(x.themeDependency||3)}/5 → signal scaling factor <b>${factor.toFixed(2)}</b>. Total context movement is capped at ±1.00.</div>${scored}${watch}</div>`;
}

function render(){const rows=filteredIdeas();$('#count').textContent=rows.length;$('#grid').innerHTML=rows.length?rows.map(renderCard).join(''):'<div class="empty">No matching ideas.</div>';$('#viewSubtitle').textContent=[state.theme!=='All'?state.theme:null,state.region!=='All'?state.region:null,state.status!=='All'?state.status:null].filter(Boolean).join(' · ')||'Long-duration theses with a separate Live Desk context overlay.';$('h1').textContent=state.theme!=='All'?state.theme:state.region!=='All'?state.region:state.status!=='All'?state.status:'All Ideas';renderSummary(rows);renderContext();document.querySelectorAll('.idea-card').forEach(c=>c.onclick=()=>openDetail(ideas.find(x=>x.ticker===c.dataset.ticker)))}

function openDetail(x){
  if(!x)return;const t=themeContext(x),delta=contextDelta(x),adj=contextConviction(x),mode=contextState(x);
  $('#dialogMarket').textContent=`${x.market} · ${x.region} · updated ${x.lastUpdated||'—'}`;$('#dialogTitle').textContent=`${x.ticker} — ${x.name}`;
  const sources=(x.sources||[]).map(s=>`<a class="source-link" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label||s.url)} ↗</a>`).join('')||'<p>No stored source link yet.</p>';
  const comparison=`<div class="conviction-compare"><div><span>BASE</span><b>${Number(x.conviction).toFixed(1)}</b></div><div class="compare-arrow">→</div><div><span>CONTEXT-ADJUSTED</span><b class="${scoreClass(delta)}">${adj.toFixed(1)}</b></div>${mode==='fresh'?`<div class="big-live-chip ${scoreClass(delta)}">${fmtSigned(delta,2)} LIVE</div>`:`<div class="big-live-chip stale">${mode==='stale'?'STALE':'NO LIVE'}</div>`}</div>`;
  $('#dialogBody').innerHTML=`${comparison}<div class="detail-grid"><div class="detail"><h3>Thesis</h3><p>${esc(x.thesis)}</p></div><div class="detail"><h3>Catalysts</h3><p>${esc(x.catalysts)}</p></div><div class="detail"><h3>Risks</h3><p>${esc(x.risks)}</p></div><div class="detail"><h3>Research stance</h3><p>${esc(x.researchNote||'—')}</p></div><div class="detail full live-rationale"><h3>Why Live Desk moved this idea</h3>${renderReasonRows(x)}</div><div class="detail full"><h3>Scores</h3><p>Base conviction ${x.conviction}/10 · Context-adjusted ${adj.toFixed(1)}/10 · AI crash ${x.aiRisk}/5 · Theme dependency ${x.themeDependency}/5 · Cyclicality ${x.cyclicality}/5 · Speculation ${x.speculation}/5.${t?` Theme regime: ${esc(t.regime)}.`:''}</p></div><div class="detail full"><h3>Sources</h3>${sources}</div></div>`;
  $('#detailDialog').showModal();
}

async function loadLiveContext(){
  let cached=null;try{const r=await fetch('data/live-context.json',{cache:'no-store'});if(r.ok)cached=await r.json()}catch{}
  try{const r=await fetch(LIVE_URL,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);liveContext=await r.json();const fresh=packetFresh();$('#liveBadge').className=`live-badge ${fresh?'online':'stale'}`;$('#liveBadge').innerHTML=fresh?'<span></span> Live Desk connected':'<span></span> Live Desk stale'}catch(err){liveContext=cached?.themes?.length?cached:null;const fresh=packetFresh();$('#liveBadge').className=liveContext?(fresh?'live-badge online':'live-badge stale'):'live-badge offline';$('#liveBadge').innerHTML=liveContext?(fresh?'<span></span> Live Desk cached':'<span></span> Cached context stale'):'<span></span> Live Desk unavailable'}
}

async function init(){const [ideaRes]=await Promise.all([fetch('data/ideas.json',{cache:'no-store'}),loadLiveContext()]);ideas=await ideaRes.json();renderSidebar();render();$('#search').oninput=e=>{state.q=e.target.value;render()};$('#sort').onchange=e=>{state.sort=e.target.value;render()};$('#clearFilters').onclick=()=>{state.theme='All';state.region='All';state.status='All';state.q='';$('#search').value='';renderSidebar();render()};$('#closeDialog').onclick=()=>$('#detailDialog').close();$('#detailDialog').addEventListener('click',e=>{if(e.target===$('#detailDialog'))$('#detailDialog').close()})}
init().catch(err=>{$('#grid').innerHTML=`<div class="empty">Failed to load Power Stack: ${esc(err.message)}</div>`});
