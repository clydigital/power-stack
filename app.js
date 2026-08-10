let ideas=[];
let liveContext=null;
const LIVE_URL='https://alchemy-live-market-desk.vercel.app/api/power-stack-context';
const state={theme:'All',region:'All',status:'All',q:'',sort:'conviction'};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const uniq=arr=>[...new Set(arr.filter(Boolean))].sort();
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

function regionBucket(x){const r=(x.region||'').toLowerCase();if(r.includes('malaysia'))return'Malaysia';if(r.includes('hong kong')||r.includes('china')||r.includes('kazakhstan'))return'HK / China';if(r==='us'||r.includes('united states'))return'US';return'Global'}
function statusBucket(x){const s=(x.status||'').toLowerCase();if(s.includes('priority'))return'Priority';if(s.includes('core'))return'Core';if(s.includes('speculative')||s.includes('high-beta'))return'Speculative';if(s.includes('queue')||s.includes('low-priority'))return'Research Queue';return'Watchlist'}
function themeContext(x){return liveContext?.themes?.find(t=>t.theme===x.themeGroup)||null}
function contextDelta(x){const t=themeContext(x);if(!t)return 0;return clamp(Number(t.score||0)*(Number(x.themeDependency||3)/5)*0.5,-1,1)}
function contextConviction(x){return clamp(Number(x.conviction||0)+contextDelta(x),0,10)}
function scoreClass(v){return v>0.15?'pos':v<-0.15?'neg':'neutral'}
function fmtSigned(v,d=1){const n=Number(v||0);return `${n>0?'+':''}${n.toFixed(d)}`}
function pct(v,max){return `${clamp(Number(v||0)/max*100,0,100)}%`}
function counts(items,getter){const out={};items.forEach(x=>{const k=getter(x);out[k]=(out[k]||0)+1});return out}

function navButton(label,count,total,group,active){return `<button class="nav-item ${active?'active':''}" data-group="${group}" data-value="${esc(label)}"><div class="nav-top"><span>${esc(label)}</span><b>${count}</b></div><div class="mini-track"><span class="mini-fill" style="width:${total?count/total*100:0}%"></span></div></button>`}
function renderSidebar(){
  const total=ideas.length;
  $('#allIdeasNav').innerHTML=`<button class="nav-item all-ideas ${state.theme==='All'&&state.region==='All'&&state.status==='All'?'active':''}" id="showAll"><div class="nav-top"><span>ALL IDEAS</span><b>${total}</b></div><div class="mini-track"><span class="mini-fill" style="width:100%"></span></div></button>`;
  const themes=counts(ideas,x=>x.themeGroup||'Other');
  $('#themeNav').innerHTML=Object.entries(themes).sort((a,b)=>b[1]-a[1]).map(([k,n])=>navButton(k,n,total,'theme',state.theme===k)).join('');
  const regions=counts(ideas,regionBucket);
  $('#regionNav').innerHTML=Object.entries(regions).sort((a,b)=>b[1]-a[1]).map(([k,n])=>navButton(k,n,total,'region',state.region===k)).join('');
  const statuses=counts(ideas,statusBucket);
  const order=['Priority','Core','Watchlist','Speculative','Research Queue'];
  $('#statusNav').innerHTML=order.filter(k=>statuses[k]).map(k=>navButton(k,statuses[k],total,'status',state.status===k)).join('');
  document.querySelectorAll('[data-group]').forEach(btn=>btn.onclick=()=>{state[btn.dataset.group]=btn.dataset.value;renderSidebar();render()});
  $('#showAll').onclick=()=>{state.theme='All';state.region='All';state.status='All';state.q='';$('#search').value='';renderSidebar();render()};
  renderLivePulse();
}

function renderLivePulse(){
  const box=$('#livePulse');
  const dot=$('#sidebarLiveDot');
  if(!liveContext?.themes?.length){box.innerHTML='<div class="side-micro">No live context yet. Using base research scores.</div>';dot.classList.remove('online');return}
  dot.classList.add('online');
  box.innerHTML=liveContext.themes.map(t=>{const pos=clamp((Number(t.score)+2)/4*100,0,100);return `<div class="pulse-row"><div class="pulse-label"><span>${esc(t.theme)}</span><b class="${scoreClass(t.score)}">${fmtSigned(t.score)}</b></div><div class="pulse-track"><span class="pulse-marker" style="left:${pos}%"></span></div></div>`}).join('');
  $('#liveTimestamp').textContent=`Market context: ${new Date(liveContext.marketUpdatedAt||liveContext.generatedAt).toLocaleString()}`;
}

function filteredIdeas(){
  const q=state.q.trim().toLowerCase();
  const rows=ideas.filter(x=>{
    const blob=JSON.stringify(x).toLowerCase();
    return (state.theme==='All'||x.themeGroup===state.theme) && (state.region==='All'||regionBucket(x)===state.region) && (state.status==='All'||statusBucket(x)===state.status) && (!q||blob.includes(q));
  });
  rows.sort((a,b)=>{
    if(state.sort==='ticker')return a.ticker.localeCompare(b.ticker);
    if(state.sort==='conviction')return Number(b.conviction)-Number(a.conviction);
    if(state.sort==='contextConviction')return contextConviction(b)-contextConviction(a);
    return Number(a[state.sort]??9)-Number(b[state.sort]??9);
  });
  return rows;
}

function scoreLine(label,value,max,cls=''){return `<div class="score-line"><span>${label}</span><div class="bar-track"><div class="bar-fill ${cls}" style="width:${pct(value,max)}"></div></div><b>${Number(value).toFixed(value%1?1:0)}/${max}</b></div>`}
function renderCard(x){
  const ctx=themeContext(x),delta=contextDelta(x),adj=contextConviction(x);
  return `<article class="idea-card" data-ticker="${esc(x.ticker)}"><div class="card-head"><div><div class="ticker">${esc(x.ticker)}</div><div class="company">${esc(x.name)} · ${esc(x.market)}</div></div><div class="status-badge">${esc(statusBucket(x))}</div></div><div class="card-tags"><span class="tag">${esc(x.themeGroup)}</span><span class="tag">${esc(regionBucket(x))}</span><span class="tag">${esc(x.theme)}</span></div><p class="thesis">${esc(x.thesis)}</p><div class="score-block">${scoreLine('Conviction',x.conviction,10,'conv')}${scoreLine('Live context',adj,10,'context')}${scoreLine('AI crash',x.aiRisk,5,'risk')}${scoreLine('Theme dep.',x.themeDependency,5,'')}</div><div class="card-foot"><span>Cycle ${esc(x.cyclicality)}/5 · Spec ${esc(x.speculation)}/5</span><span class="desk-tilt ${scoreClass(delta)}">${ctx?`Desk ${fmtSigned(delta)} → ${adj.toFixed(1)}`:'Desk —'}</span></div></article>`
}

function renderSummary(rows){
  const avg=rows.length?rows.reduce((s,x)=>s+Number(x.conviction||0),0)/rows.length:0;
  const ctxAvg=rows.length?rows.reduce((s,x)=>s+contextConviction(x),0)/rows.length:0;
  const priorities=rows.filter(x=>statusBucket(x)==='Priority').length;
  const lowTheme=rows.filter(x=>Number(x.themeDependency)<=2).length;
  $('#summaryStats').innerHTML=`<div class="summary-card"><b>${rows.length}</b><span>Ideas in view</span></div><div class="summary-card"><b>${avg.toFixed(1)}</b><span>Base conviction</span></div><div class="summary-card"><b>${ctxAvg.toFixed(1)}</b><span>Live-adjusted context</span></div><div class="summary-card"><b>${priorities} / ${lowTheme}</b><span>Priority / low dependency</span></div>`;
}

function renderContext(){
  const title=$('#contextTitle'),meta=$('#contextMeta'),body=$('#contextBody');
  if(!liveContext?.themes?.length){title.textContent='Cross-theme pulse';meta.textContent='Live feed unavailable · using base scores';body.innerHTML='<div class="context-copy">Power Stack remains fully usable without the Live Desk feed. Context adjustments are disabled until the read-only endpoint is reachable.</div>';return}
  meta.textContent=`${liveContext.source} · ${new Date(liveContext.marketUpdatedAt||liveContext.generatedAt).toLocaleString()}`;
  if(state.theme!=='All'){
    const t=liveContext.themes.find(v=>v.theme===state.theme);title.textContent=state.theme;
    if(!t){body.innerHTML='<div class="context-copy">No matching Live Desk theme overlay.</div>';return}
    const drivers=(t.drivers||[]).length?`<ul>${t.drivers.map(d=>`<li>${esc(d)}</li>`).join('')}</ul>`:'No fresh driver summary.';
    body.innerHTML=`<div class="single-context"><div class="context-gauge"><strong class="${scoreClass(t.score)}">${fmtSigned(t.score)}</strong><span>${esc(t.regime)} · ${t.confidence}% confidence</span></div><div class="context-copy">${drivers}</div></div>`;return;
  }
  title.textContent='Cross-theme pulse';
  body.innerHTML=`<div class="context-themes">${liveContext.themes.map(t=>{const width=Math.abs(Number(t.score))/2*50;const cls=scoreClass(t.score);const driver=(t.drivers||[])[0]||'No fresh driver summary.';return `<div class="theme-signal"><div class="signal-top"><span class="signal-name">${esc(t.theme)}</span><b class="signal-score ${cls}">${fmtSigned(t.score)}</b></div><div class="signal-track"><span class="signal-fill ${cls}" style="width:${width}%"></span></div><div class="signal-driver">${esc(driver)}</div></div>`}).join('')}</div>`;
}

function render(){
  const rows=filteredIdeas();
  $('#count').textContent=rows.length;
  $('#grid').innerHTML=rows.length?rows.map(renderCard).join(''):'<div class="empty">No matching ideas.</div>';
  $('#viewSubtitle').textContent=[state.theme!=='All'?state.theme:null,state.region!=='All'?state.region:null,state.status!=='All'?state.status:null].filter(Boolean).join(' · ')||'Long-duration theses with a separate Live Desk context overlay.';
  $('h1').textContent=state.theme!=='All'?state.theme:state.region!=='All'?state.region:state.status!=='All'?state.status:'All Ideas';
  renderSummary(rows);renderContext();
  document.querySelectorAll('.idea-card').forEach(c=>c.onclick=()=>openDetail(ideas.find(x=>x.ticker===c.dataset.ticker)));
}

function openDetail(x){if(!x)return;const t=themeContext(x),delta=contextDelta(x),adj=contextConviction(x);$('#dialogMarket').textContent=`${x.market} · ${x.region} · updated ${x.lastUpdated||'—'}`;$('#dialogTitle').textContent=`${x.ticker} — ${x.name}`;const sources=(x.sources||[]).map(s=>`<a class="source-link" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label||s.url)} ↗</a>`).join('')||'<p>No stored source link yet.</p>';const live=t?`<p><b>${esc(t.regime.toUpperCase())}</b> · theme score ${fmtSigned(t.score)} · ${t.confidence}% confidence. Base conviction ${Number(x.conviction).toFixed(1)} → context ${adj.toFixed(1)} (${fmtSigned(delta)}).</p>${(t.drivers||[]).map(d=>`<p>• ${esc(d)}</p>`).join('')}`:'<p>No Live Desk overlay available.</p>';$('#dialogBody').innerHTML=`<div class="detail-grid"><div class="detail"><h3>Thesis</h3><p>${esc(x.thesis)}</p></div><div class="detail"><h3>Catalysts</h3><p>${esc(x.catalysts)}</p></div><div class="detail"><h3>Risks</h3><p>${esc(x.risks)}</p></div><div class="detail"><h3>Research stance</h3><p>${esc(x.researchNote||'—')}</p></div><div class="detail full"><h3>Live Desk overlay</h3>${live}</div><div class="detail full"><h3>Scores</h3><p>Conviction ${x.conviction}/10 · AI crash ${x.aiRisk}/5 · Theme dependency ${x.themeDependency}/5 · Cyclicality ${x.cyclicality}/5 · Speculation ${x.speculation}/5.</p></div><div class="detail full"><h3>Sources</h3>${sources}</div></div>`;$('#detailDialog').showModal()}

async function loadLiveContext(){
  let cached=null;
  try{const r=await fetch('data/live-context.json',{cache:'no-store'});if(r.ok)cached=await r.json()}catch{}
  try{const r=await fetch(LIVE_URL,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);liveContext=await r.json();$('#liveBadge').className='live-badge online';$('#liveBadge').innerHTML='<span></span> Live Desk connected'}catch(err){liveContext=cached?.themes?.length?cached:null;$('#liveBadge').className=liveContext?'live-badge online':'live-badge offline';$('#liveBadge').innerHTML=liveContext?'<span></span> Live Desk cached':'<span></span> Live Desk unavailable'}
}

async function init(){
  const [ideaRes]=await Promise.all([fetch('data/ideas.json',{cache:'no-store'}),loadLiveContext()]);
  ideas=await ideaRes.json();renderSidebar();render();
  $('#search').oninput=e=>{state.q=e.target.value;render()};
  $('#sort').onchange=e=>{state.sort=e.target.value;render()};
  $('#clearFilters').onclick=()=>{state.theme='All';state.region='All';state.status='All';state.q='';$('#search').value='';renderSidebar();render()};
  $('#closeDialog').onclick=()=>$('#detailDialog').close();
  $('#detailDialog').addEventListener('click',e=>{if(e.target===$('#detailDialog'))$('#detailDialog').close()});
}
init().catch(err=>{$('#grid').innerHTML=`<div class="empty">Failed to load Power Stack: ${esc(err.message)}</div>`});
