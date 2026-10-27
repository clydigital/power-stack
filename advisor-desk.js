/* Power Stack client decision layer: presentation only, no trading or upstream writes. */
(()=>{'use strict';
const get=id=>document.getElementById(id);
const money=n=>Number.isFinite(Number(n))?'RM'+new Intl.NumberFormat('en-MY',{maximumFractionDigits:0}).format(Number(n)):'—';
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
const tags={positive:'Research buy',conditional:'Conditions apply',caution:'Review reduction',neutral:'Monitor'};
const palette=['#86dcb4','#2d8b84','#5fa8c4','#d09d67','#9eaa9e','#78909e','#c5ba8a'];
function fmtDate(iso){const d=new Date(iso);return Number.isNaN(d.getTime())?'Date not verified':new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kuala_Lumpur'}).format(d)}
async function fetchJson(path){try{const response=await fetch(path,{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);return await response.json()}catch(e){return null}}
function renderTimestamp(d){
 const status=get('adv-research-status');
 const stamp=d?.asOf;const time=Date.parse(stamp||'');
 if(!status)return;
 if(d?.quickAssessment?.assessedOn)status.dataset.quickAssessment=d.quickAssessment.assessedOn;
 if(!Number.isFinite(time)){status.textContent='Research date unavailable · decisions not trade-ready';status.dataset.freshness='missing';return;}
 const age=(Date.now()-time)/3600000;
 const txt='Research '+fmtDate(stamp)+' · last market prices '+esc(d.marketDataThrough||'unconfirmed');
 status.textContent=(age>72?'OLDER RESEARCH — verify before acting · ':age>24?'Research ageing — new evidence required · ':'Research snapshot · ')+txt;
 status.dataset.freshness=age>72?'stale':'dated';
}
function renderQuickAssessment(d){
 const a=d?.quickAssessment,root=get('ps-decision-grid');
 if(!root||!a||!Array.isArray(a.actions)||a.actions.length!==4)return;
 const keys=new Set(a.actions.map(x=>x.key));
 if(keys.size!==4||!['review','prepare','liquid','wait'].every(k=>keys.has(k)))return;
 const date=get('ps-decision-date'),summary=get('ps-decision-summary'),caveat=get('ps-decision-caveat');
 if(date)date.textContent=a.assessedOn+' research review';
 if(summary)summary.textContent=a.summary;
 if(caveat)caveat.innerHTML='<strong>Before any trade:</strong> '+esc(a.accountWarning);
 if(a.verdict){
   const v=a.verdict;
   for(const [id,value] of [['ps-verdict-status',v.status],['ps-verdict-headline',v.headline],['ps-verdict-reason',v.reason],['ps-verdict-blocker',v.blocker],['ps-verdict-next','Next: '+v.nextCheck]]){
     const el=get(id);if(el && typeof value==='string')el.textContent=value;
   }
 }
 const allowedAnchors=new Set(['#portfolio-review','#investment-plan','#market-brief']);
 root.innerHTML=a.actions.map((x,i)=>{
   const href=allowedAnchors.has(x.href)?x.href:'#next-moves';
   return '<article class="ps-decision-card ps-decision-'+esc(x.key)+'"><div class="ps-decision-card-top"><span class="ps-decision-index">0'+(i+1)+'</span><span class="ps-decision-state">'+esc(x.status)+'</span></div><h3>'+esc(x.title)+'</h3><p>'+esc(x.summary)+'</p><details class="ps-decision-detail"><summary>What must be true?</summary><p>'+esc(x.next)+'</p><a href="'+href+'">Full decision reasoning ↗</a></details></article>';
 }).join('');
}
function renderTop(d){
 if(!d||d.contractVersion!=='power-stack-client-advisor/1')return;
 const title=get('adv-hero-title'),desc=get('adv-hero-description');
 if(title)title.innerHTML='What you\'re <span>investing in.</span>';
 if(desc)desc.textContent='Seven proposed positions across US Treasuries, equities and MYR cash — a target portfolio, not a verified brokerage account.';
 const total=get('adv-total-capital');if(total)total.textContent=money(d.capital?.totalMYR);
 const goal=get('adv-target-value');if(goal)goal.textContent=money(d.capital?.targetRangeMYR?.[0])+'–'+money(d.capital?.targetRangeMYR?.[1]).replace('RM','');
 const floor=get('adv-review-value');if(floor)floor.textContent=money(d.capital?.drawdownReviewMYR);
 const out=get('adv-current-outlook');if(out)out.textContent=d.outlook?.summary||'Review the latest market context.';
 const text=get('adv-account-status');if(text)text.textContent=d.capital?.cashVerified&&d.capital?.positionsVerified?'Positions and cash reconciled':'Account total confirmed. Holdings, warrant terms and available buying power need verification before any trade.';
}
function renderMoves(d){
 const root=get('adv-move-list');if(!root||!Array.isArray(d?.firstMoves))return;
 root.innerHTML=d.firstMoves.map(x=>{
 const amount=x.amountMYR===null?'Portfolio review':x.totalTargetMYR?money(x.amountMYR)+' first':money(x.amountMYR);
 const sub=x.totalTargetMYR?'of '+money(x.totalTargetMYR)+' total target':'Proposed action only';
 return '<article class="adv-move"><div class="adv-move-num">'+esc(x.number)+'</div><div><div class="adv-move-top"><span class="adv-tag '+esc(x.tone)+'">'+esc(x.label)+'</span><span class="adv-tag">'+esc(x.decision)+'</span></div><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><div class="adv-move-more"><strong>Do next:</strong> '+esc(x.do)+'</div></div><div class="adv-move-side"><strong>'+esc(amount)+'</strong><small>'+esc(sub)+'</small><a href="'+esc(x.anchor)+'">See the plan →</a></div></article>'
 }).join('');
}

const investmentProfiles={
 VGIT:{kind:'bonds',icon:'bonds',label:'Intermediate US Treasuries',role:'Medium-term US government bonds. Core rate exposure and potential bond gains if yields fall.',risk:'Prices can fall if yields rise. USD/MYR also matters.',tag:'Staged candidate'},
 TLT:{kind:'bonds',icon:'bonds',label:'Long US Treasuries',role:'Long-dated US government bonds. A more volatile rate-sensitive satellite.',risk:'A yield increase can cause a substantial price drop.',tag:'Tactical only'},
 SGOV:{kind:'bonds',icon:'shield',label:'Short US Treasury bills',role:'Very short-term US government debt for liquid USD exposure.',risk:'Currency, tax and dealing costs; not ringgit cash.',tag:'Check USD costs'},
 CF:{kind:'equity',icon:'plant',label:'Fertiliser producer',role:'Shares in CF Industries, a nitrogen fertiliser and ammonia producer.',risk:'Margins depend on fertiliser prices and natural-gas costs.',tag:'Wait for results'},
 RSP:{kind:'equity',icon:'stocks',label:'Equal-weight US stocks',role:'ETF owning S&P 500 constituents at approximately equal weights.',risk:'Still exposed to broad US equity and cyclical earnings risk.',tag:'Breadth must hold'},
 TSM:{kind:'equity',icon:'chip',label:'Advanced chip manufacturer',role:'US-listed TSMC shares. Exposure to leading-edge semiconductor manufacturing.',risk:'AI demand, valuations and geopolitical risk.',tag:'Wait for entry'},
 MYR_CASH:{kind:'cash',icon:'cash',label:'MYR settlement reserve',role:'Ringgit held for a later investment that clears its checks.',risk:'Not a return guarantee; the real account cash amount is unverified.',tag:'Keep uncommitted'}
};
const shape={
 bonds:'<path d="m3 9 9-6 9 6M4 9h16M6 9v10m4-10v10m4-10v10m4-10v10M3 21h18"/>',
 stocks:'<path d="M4 19h16M6 16l5-5 4 2 4-8m-4 0h4v4"/>',
 cash:'<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 10h18M16 15h2"/>',
 shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
 plant:'<path d="M12 22V12m0 5c-6 0-9-3-9-8 6 0 9 3 9 8zm0-5c0-6 3-9 9-9 0 6-3 9-9 9z"/>',
 chip:'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 9h6v6H9zM9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/>',
 world:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18m0-18c5 5 5 13 0 18"/>',
 flame:'<path d="M12 22c4.8 0 8-3.4 8-7.5 0-4-3-6.8-4-8-.4 2.7-2 4-3 4-1-2-1-5-3-8-1 4-6 7-6 12 0 4.5 3.4 7.5 8 7.5z"/>'
};
function psIcon(name){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(shape[name]||shape.stocks)+'</svg>'}
function renderInvestmentOverview(m){
 const root=get('adv-investment-cards');
 if(!root)return;
 const rows=m?.allocation;
 const pct=Array.isArray(rows)?rows.reduce((s,a)=>s+(Number(a.allocationPct)||0),0):NaN;
 const total=Array.isArray(rows)?rows.reduce((s,a)=>s+(Number(a.targetMYR)||0),0):NaN;
 if(m?.schema!=='power-stack-manual-investment-mandate/v1'||!Number.isFinite(total)||pct!==100||total!==Number(m.capital?.startingAccountNAVMYR)||rows.length!==7){
  root.innerHTML='<div class="adv-card-loading">The proposed allocation could not be reconciled. Review the dated <a href="data/rakuten-one-year-mandate.json">mandate</a>; no buy is authorised.</div>';
  return;
 }
 const definitions=[
  ['bonds',['VGIT','TLT','SGOV'],'adv-class-bonds','adv-class-bonds-rm'],
  ['equity',['CF','RSP','TSM'],'adv-class-stocks','adv-class-stocks-rm'],
  ['cash',['MYR_CASH'],'adv-class-cash','adv-class-cash-rm']
 ];
 for(const [key,symbols,pctId,amountId] of definitions){
  const subset=rows.filter(a=>symbols.includes(a.symbol));
  const pp=subset.reduce((s,a)=>s+Number(a.allocationPct),0);
  const rm=subset.reduce((s,a)=>s+Number(a.targetMYR),0);
  const p=get(pctId),a=get(amountId);
  if(p)p.textContent=pp+'%';
  if(a)a.textContent=money(rm)+' · '+(key==='cash'?'MYR reserve':symbols.join(' / '));
 }
 root.innerHTML=rows.map(a=>{
  const profile=investmentProfiles[a.symbol];
  if(!profile)return '';
  const first=a.entryStages?.[0]?.condition||'Confirm source-dated research and current broker cash.';
  return '<article class="adv-position '+profile.kind+'"><div class="adv-position-head"><span class="adv-position-logo">'+psIcon(profile.icon)+'</span><span class="adv-position-tag">'+esc(profile.tag)+'</span></div>'+
   '<div class="adv-position-main"><div class="adv-position-name"><strong>'+esc(a.symbol==='MYR_CASH'?'MYR cash':a.symbol)+'</strong><small>'+esc(profile.label)+'</small></div><div class="adv-position-money"><strong>'+money(a.targetMYR)+'</strong><small>'+esc(a.allocationPct)+'% target</small></div></div>'+
   '<p class="adv-position-role">'+esc(profile.role)+'</p><p class="adv-position-risk">'+esc(profile.risk)+'</p>'+
   '<details class="adv-position-detail"><summary>Why / when to enter</summary><p><b>First check:</b> '+esc(first)+'</p><p><b>Status:</b> '+esc(a.status.replaceAll('_',' ').toLowerCase())+'. Model only, not an order.</p></details></article>';
 }).join('');
}

function renderAllocation(m){
 if(!m||!Array.isArray(m.allocation))return;
 const bar=get('adv-budget-bar'),table=get('adv-budget-body'),legend=get('adv-budget-legend');
 const rows=m.allocation;
 if(bar)bar.innerHTML=rows.map((a,i)=>'<div style="width:'+Math.max(0,Number(a.allocationPct)||0)+'%;background:'+palette[i%palette.length]+'" title="'+esc(a.symbol)+' · '+esc(a.allocationPct)+'%"></div>').join('');
 if(legend)legend.innerHTML=rows.map((a,i)=>'<span><i style="background:'+palette[i%palette.length]+'"></i>'+esc(a.symbol)+' '+esc(a.allocationPct)+'%</span>').join('');
 if(table)table.innerHTML=rows.map(a=>{const step=a.entryStages?.[0];const nice=(a.symbol==='MYR_CASH'?'Ringgit reserve':a.symbol);
 return '<tr><td><strong>'+esc(nice)+'</strong><small>'+esc(a.name)+'</small></td><td data-num>'+esc(a.allocationPct)+'%</td><td data-num><strong>'+money(a.targetMYR)+'</strong></td><td><span class="adv-sleeve">'+esc(a.status.replace(/_/g,' '))+'</span><small>'+esc(step?.condition||'Pending review')+'</small></td></tr>';
 }).join('');
 const sum=get('adv-budget-total');if(sum)sum.textContent=money(m.allocationSumMYR);
 const reserve=get('adv-cash-line');if(reserve)reserve.textContent='Keep '+money(rows.find(x=>x.symbol==='MYR_CASH')?.targetMYR)+' in MYR. All proposed buys must be funded from confirmed cash or a specific sale, not extra deposits.';
}
function renderOpportunity(d){
 const root=get('adv-idea-list');if(!root||!Array.isArray(d?.opportunities))return;
 root.innerHTML=d.opportunities.map(x=>{
 const grp=x.group==='Bonds'?'bonds':'stocks';
 const actionCat=x.tone==='positive'?'buy':x.tone==='conditional'?'conditional':'wait';
 return '<article class="adv-idea" data-category="'+esc(grp)+'" data-action="'+esc(actionCat)+'"><div class="adv-idea-symbol-wrap"><div class="adv-idea-symbol">'+esc(x.symbol)+'</div><div class="adv-idea-name">'+esc(x.name)+'</div><div class="adv-idea-price">'+esc(x.priceReference||'Price check needed')+'</div></div><div class="adv-idea-copy"><span class="adv-tag '+esc(x.tone)+'">'+esc(x.action)+'</span><p>'+esc(x.case)+'</p><details class="adv-details"><summary>Entry, exit and risk</summary><div class="adv-detail-grid"><div><b>Buy only when</b><p>'+esc(x.buyWhen)+'</p></div><div><b>What makes me sell</b><p>'+esc(x.sellWhen)+'</p></div><div><b>Risk to watch</b><p>'+esc(x.risk)+'</p></div><div><b>Next checkpoint</b><p>'+esc(x.nextEvent)+'</p><a class="adv-inline-link" href="'+esc(x.source)+'" target="_blank" rel="noopener noreferrer">See primary/fund source ↗</a></div></div></details></div><div class="adv-idea-amount"><strong>'+money(x.targetMYR)+'</strong><span>Target allocation</span><span>First stage '+money(x.firstStageMYR)+'</span></div></article>'
 }).join('');
}
function renderResearchRadar(d){
 const root=get('adv-idea-list');if(!root||!Array.isArray(d?.researchRadar))return;
 const section=document.createElement('section');section.className='adv-radar-section';section.innerHTML='<h3>Under research — not funded</h3><p>These are candidates for comparison, not additional spending. Existing RM13,491 allocation remains unchanged.</p>';
 section.innerHTML+=d.researchRadar.map(x=>'<article class="adv-idea"><div class="adv-idea-symbol-wrap"><div class="adv-idea-symbol">'+esc(x.symbol)+'</div><div class="adv-idea-name">'+esc(x.name)+'</div><div class="adv-idea-price">'+esc(x.priceReference)+'</div></div><div class="adv-idea-copy"><span class="adv-tag neutral">'+esc(x.action)+'</span><p>'+esc(x.case)+'</p><details class="adv-details"><summary>Entry, exit and risk</summary><div class="adv-detail-grid"><div><b>Buy only when</b><p>'+esc(x.buyWhen)+'</p></div><div><b>Reject thesis if</b><p>'+esc(x.sellWhen)+'</p></div><div><b>Risk</b><p>'+esc(x.risk)+'</p></div><div><b>Next checkpoint</b><p>'+esc(x.nextEvent)+'</p><a class="adv-inline-link" href="'+esc(x.source)+'" target="_blank" rel="noopener noreferrer">Issuer source ↗</a></div></div></details></div><div class="adv-idea-amount"><strong>RM0</strong><span>Not allocated</span></div></article>').join('');
 root.after(section);
}
function renderPortfolio(d){
 const root=get('adv-legacy-review');if(!root||!Array.isArray(d?.legacyActions))return;
 root.innerHTML=d.legacyActions.map(x=>{
  const target=x.target||'No position-size decision until the account is reconciled.';
  const action=x.plainAction||x.why;
  const extra='<details class="adv-holding-explanation"><summary>Why this action? What must be true?</summary>'+
   '<p><b>Reason:</b> '+esc(x.why)+'</p>'+
   '<p><b>Act only if:</b> '+esc(x.trigger||x.gate)+'</p>'+
   '<p><b>Check first:</b> '+esc(x.nextStep||x.gate)+'</p>'+
   '<p><b>When to keep instead:</b> '+esc(x.holdInstead||'Await refreshed issuer evidence and current holdings.')+'</p></details>';
  return '<div class="adv-portfolio-item"><div class="adv-portfolio-name"><strong>'+esc(x.ticker)+'</strong><div class="adv-tag '+esc(x.tone)+'">'+esc(x.action)+'</div><small>'+esc(x.lastKnown)+'</small></div>'+
   '<div class="adv-portfolio-decision"><p class="adv-holding-action">'+esc(action)+'</p><p class="adv-holding-target">'+esc(target)+'</p>'+extra+'</div>'+
   '<a class="adv-inline-link" href="holdings.html#ps-holdings-action-brief">Full decision notes →</a></div>'
 }).join('');
}
function renderResearch(d){
 const market=get('adv-insight-grid'),cal=get('adv-event-list');
 if(market&&Array.isArray(d?.marketSignals)){
  const lens=d.marketSignals.map(x=>{
   const name=(x.name||'').toLowerCase();
   const isRate=name.includes('treasur'),isRotation=name.includes('rotation');
   const role=isRate?'What it means: VGIT / TLT / SGOV':isRotation?'What it means: RSP / TSM':'What it means: foreign bonds / MYR';
   const impact=isRate?'Treasury entries still depend on real yields, term premium and FX.':isRotation?'Review whether equal-weight earnings breadth persists before buying RSP.':'Do not fund a new overseas bond sleeve without yield and MYR-cost comparisons.';
   return {name:x.name,caption:x.state,body:x.body,role,impact,icon:isRate?'bonds':isRotation?'stocks':'world',source:x.source||'https://alchemy-live-market-desk.vercel.app/',date:'23 Oct research'};
  });
  lens.splice(1,0,{name:'AI funding',caption:'Capital spending versus financing',body:'Separate paid chip demand from customers’ ability to fund AI build-outs.',role:'What it means: TSM / existing tech exposure',impact:'Prefer confirmed earnings and funded demand to chasing AI share-price rallies.',icon:'chip',source:'research/2026-10-14-ai-financing-picks-shovels.md',date:'14 Oct thesis'},{name:'Oil and inflation',caption:'Energy shortages can complicate rate cuts',body:'Gulf supply and fuel-price shocks can sustain inflation even while equities sell off.',role:'What it means: XOM / MISC / HIBISCS / Treasuries',impact:'Check energy concentration and whether inflation threatens the bond case.',icon:'flame',source:'research/2026-10-22-market-danger-risk-regime-deep-update.md',date:'22 Oct research'});
  market.innerHTML=lens.map(x=>'<article class="adv-insight"><span class="adv-insight-icon">'+psIcon(x.icon)+'</span><strong>'+esc(x.name)+'</strong><small>'+esc(x.caption)+' · '+esc(x.date)+'</small><p>'+esc(x.body)+'</p><div class="adv-implication">'+esc(x.role)+'<br>'+esc(x.impact)+'</div><a href="'+esc(x.source)+'" target="_blank" rel="noopener noreferrer">Underlying source ↗</a></article>').join('');
 }
 if(cal&&Array.isArray(d?.calendar))cal.innerHTML=d.calendar.map(x=>'<div class="adv-event"><span class="adv-overline">'+esc(x.date)+'</span><strong>'+esc(x.name)+'</strong><p>'+esc(x.why)+'</p></div>').join('');
 const guide=get('adv-signal-advice');if(guide&&d?.outlook?.whatChanges)guide.textContent='These are '+fmtDate(d.asOf)+' research views, not live market signals. '+d.outlook.whatChanges+' Live Desk owns canonical macro evidence; Bluebelly is its presentation layer.';
}
function applyFilters(){
 const buttons=[...document.querySelectorAll('[data-adv-filter]')],root=get('adv-idea-list');
 for(const b of buttons)b.addEventListener('click',()=>{
 const filter=b.dataset.advFilter;
 buttons.forEach(q=>q.setAttribute('aria-pressed',String(q===b)));
 const nodes=[...root.querySelectorAll('.adv-idea')];
 for(const node of nodes)node.classList.toggle('adv-idea-hidden',filter!=='all'&&node.dataset.category!==filter&&node.dataset.action!==filter);
 const count=nodes.filter(node=>!node.classList.contains('adv-idea-hidden')).length;
 const summary=get('adv-filter-result');if(summary)summary.textContent=count+' investment '+(count===1?'idea':'ideas')+' shown';
 });
}
function handleCopy(){
 const button=get('adv-copy-update');if(!button)return;
 button.addEventListener('click',async()=>{
 const text='PS update. Follow PS_MANUAL_INVESTMENT_MANIFESTO.md and data/rakuten-one-year-mandate.json. Refresh Live and Bluebelly context, MacroPulse/Research Gap, global sovereign bonds, latest earnings, transcripts, and current market/FX data. Reconcile my RM13,491 total Rakuten capital; rank funded buys, sells and holds with entry stages, failure tests and dated evidence. Update Power Stack and show only what changed.';
 try{await navigator.clipboard.writeText(text);button.textContent='Prompt copied';}catch(e){button.textContent='Copy unavailable · use PS update in chat';}
 });
}
async function load(){
 const [d,m]=await Promise.all([fetchJson('data/client-advisor.json'),fetchJson('data/rakuten-one-year-mandate.json')]);
 if(d&&d.contractVersion==='power-stack-client-advisor/1'){renderTimestamp(d);renderQuickAssessment(d);renderTop(d);renderMoves(d);renderOpportunity(d);renderResearchRadar(d);renderPortfolio(d);renderResearch(d)}
 else{const s=get('adv-research-status');if(s)s.textContent='Live decision data unavailable · dated plan below requires new verification';}
 renderInvestmentOverview(m);
 if(m&&m.schema==='power-stack-manual-investment-mandate/v1')renderAllocation(m);
 applyFilters();handleCopy();
}
load();
})();
