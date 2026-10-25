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
 if(!Number.isFinite(time)){status.textContent='Research date unavailable · decisions not trade-ready';status.dataset.freshness='missing';return;}
 const age=(Date.now()-time)/3600000;
 const txt='Research '+fmtDate(stamp)+' · last market prices '+esc(d.marketDataThrough||'unconfirmed');
 status.textContent=(age>72?'OLDER RESEARCH — verify before acting · ':age>24?'Research ageing — new evidence required · ':'Research snapshot · ')+txt;
 status.dataset.freshness=age>72?'stale':'dated';
}
function renderTop(d){
 if(!d||d.contractVersion!=='power-stack-client-advisor/1')return;
 const title=get('adv-hero-title'),desc=get('adv-hero-description');
 if(title)title.innerHTML='What I would do with <span>'+money(d.capital?.totalMYR)+'.</span>';
 if(desc)desc.textContent=d.standfirst;
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
 if(market&&Array.isArray(d?.marketSignals))market.innerHTML=d.marketSignals.map(x=>'<div class="adv-insight"><strong>'+esc(x.name)+'</strong><small>'+esc(x.state)+'</small><p>'+esc(x.body)+'</p></div>').join('');
 if(cal&&Array.isArray(d?.calendar))cal.innerHTML=d.calendar.map(x=>'<div class="adv-event"><span class="adv-overline">'+esc(x.date)+'</span><strong>'+esc(x.name)+'</strong><p>'+esc(x.why)+'</p></div>').join('');
 const guide=get('adv-signal-advice');if(guide&&d?.outlook?.whatChanges)guide.textContent=d.outlook.whatChanges;
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
 if(d&&d.contractVersion==='power-stack-client-advisor/1'){renderTimestamp(d);renderTop(d);renderMoves(d);renderOpportunity(d);renderResearchRadar(d);renderPortfolio(d);renderResearch(d)}
 else{const s=get('adv-research-status');if(s)s.textContent='Live decision data unavailable · dated plan below requires new verification';}
 if(m&&m.schema==='power-stack-manual-investment-mandate/v1')renderAllocation(m);
 applyFilters();handleCopy();
}
load();
})();
