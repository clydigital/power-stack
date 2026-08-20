(() => {
  const style=document.createElement('style');
  style.textContent=`
    .theme-risk-section{margin-bottom:16px}
    .theme-risk-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-end;margin-bottom:8px}
    .theme-risk-title{font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:#7f8992;font-weight:800}
    .theme-risk-note{font-size:8px;line-height:1.35;color:#64717b;text-align:right;max-width:620px}
    .theme-risk-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}
    .theme-risk-card{--risk:#93dfb4;border:1px solid #202a31;background:linear-gradient(180deg,#0c1216,#0a0f12);border-radius:9px;padding:10px;text-align:left;color:inherit;cursor:pointer;min-width:0;position:relative;overflow:hidden}
    .theme-risk-card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--risk);box-shadow:0 0 10px var(--risk)}
    .theme-risk-card:hover{border-color:#3a4650;transform:translateY(-1px)}
    .theme-risk-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
    .theme-risk-name{font-size:10px;font-weight:750;line-height:1.2;color:#d8dfe4;min-width:0}
    .theme-risk-score{font-size:14px;font-weight:900;color:var(--risk);font-variant-numeric:tabular-nums;white-space:nowrap}
    .theme-risk-label{margin-top:3px;font-size:7px;letter-spacing:.09em;text-transform:uppercase;color:var(--risk);font-weight:850}
    .theme-risk-track{height:4px;border-radius:8px;background:#202a33;overflow:hidden;margin:8px 0 7px}
    .theme-risk-fill{height:100%;width:var(--risk-pct);background:var(--risk);box-shadow:0 0 9px var(--risk)}
    .theme-risk-meta{font-size:8px;line-height:1.35;color:#78858f}
    .theme-risk-card.low{--risk:#72e0a3}.theme-risk-card.moderate{--risk:#d8d56a}.theme-risk-card.elevated{--risk:#e8ad5e}.theme-risk-card.high{--risk:#ee7d64}.theme-risk-card.severe{--risk:#ef667c}
    @media(max-width:1180px){.theme-risk-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:720px){.theme-risk-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.theme-risk-head{align-items:flex-start;flex-direction:column}.theme-risk-note{text-align:left}}
  `;
  document.head.appendChild(style);

  function avg(rows,key){return rows.length?rows.reduce((s,x)=>s+Number(x[key]||0),0)/rows.length:0}
  function riskClass(score){if(score<35)return['low','Low'];if(score<50)return['moderate','Moderate'];if(score<65)return['elevated','Elevated'];if(score<80)return['high','High'];return['severe','Severe']}
  function themeRisk(theme){
    const rows=ideas.filter(x=>(x.themeGroup||'Other')===theme);
    const structural=(avg(rows,'aiRisk')*.30+avg(rows,'themeDependency')*.25+avg(rows,'cyclicality')*.25+avg(rows,'speculation')*.20)/5*100;
    const profiled=rows.filter(x=>typeof stockProfile==='function'&&stockProfile(x));
    const macro=(typeof packetFresh==='function'&&packetFresh()&&profiled.length)?profiled.reduce((s,x)=>s+contextDelta(x),0)/profiled.length:0;
    const score=clamp(structural-macro*12,0,100);
    const [cls,label]=riskClass(score);
    return {theme,rows,score,cls,label,structural,macro,profiled:profiled.length};
  }
  function renderRisk(){
    const body=document.getElementById('contextBody');
    if(!body||document.getElementById('themeRiskNow')||!Array.isArray(ideas)||!ideas.length)return;
    const themes=[...new Set(ideas.map(x=>x.themeGroup||'Other'))].map(themeRisk).sort((a,b)=>b.score-a.score);
    const fresh=typeof packetFresh==='function'&&packetFresh();
    const section=document.createElement('div');
    section.id='themeRiskNow';section.className='theme-risk-section';
    section.innerHTML=`<div class="theme-risk-head"><div class="theme-risk-title">INDUSTRY / THEME RISK NOW</div><div class="theme-risk-note">Power Stack relative risk: 30% AI exposure · 25% theme dependence · 25% cyclicality · 20% speculation, then current stock-level macro adjusts risk by up to ±12 points. ${fresh?'Live macro included.':'Macro stale/unavailable — structural risk only.'}</div></div><div class="theme-risk-grid">${themes.map(r=>`<button class="theme-risk-card ${r.cls}" data-risk-theme="${esc(r.theme)}" type="button"><div class="theme-risk-top"><span class="theme-risk-name">${esc(r.theme)}</span><b class="theme-risk-score">${r.score.toFixed(0)}</b></div><div class="theme-risk-label">${r.label} risk</div><div class="theme-risk-track"><div class="theme-risk-fill" style="--risk-pct:${r.score.toFixed(1)}%"></div></div><div class="theme-risk-meta">Structural ${r.structural.toFixed(0)} · Macro ${fresh?fmtSigned(r.macro,2):'—'} · ${r.rows.length} idea${r.rows.length===1?'':'s'}</div></button>`).join('')}</div>`;
    body.prepend(section);
    section.querySelectorAll('[data-risk-theme]').forEach(btn=>btn.onclick=()=>{state.theme=btn.dataset.riskTheme;state.region='All';state.status='All';renderSidebar();render()});
  }

  const body=document.getElementById('contextBody');
  if(body){
    const observer=new MutationObserver(()=>{if(!document.getElementById('themeRiskNow'))queueMicrotask(renderRisk)});
    observer.observe(body,{childList:true});
  }
  queueMicrotask(renderRisk);
})();
