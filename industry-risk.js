(() => {
  const style=document.createElement('style');
  style.textContent=`
    .theme-risk-section{margin-bottom:16px}
    .theme-risk-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-end;margin-bottom:8px}
    .theme-risk-title{font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:#7f8992;font-weight:800}
    .theme-risk-note{font-size:8px;line-height:1.4;color:#64717b;text-align:right;max-width:720px}
    .theme-risk-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}
    .theme-risk-card{--risk:#93dfb4;border:1px solid #202a31;background:linear-gradient(180deg,#0c1216,#0a0f12);border-radius:9px;padding:10px;text-align:left;color:inherit;min-width:0;position:relative;overflow:hidden}
    .theme-risk-card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--risk);box-shadow:0 0 10px var(--risk)}
    .theme-risk-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
    .theme-risk-name{font-size:10px;font-weight:750;line-height:1.2;color:#d8dfe4;min-width:0}
    .theme-risk-score{font-size:14px;font-weight:900;color:var(--risk);font-variant-numeric:tabular-nums;white-space:nowrap}
    .theme-risk-label{margin-top:3px;font-size:7px;letter-spacing:.09em;text-transform:uppercase;color:var(--risk);font-weight:850}
    .theme-risk-track{height:4px;border-radius:8px;background:#202a33;overflow:hidden;margin:8px 0 7px}
    .theme-risk-fill{height:100%;width:var(--risk-pct);background:var(--risk);box-shadow:0 0 9px var(--risk)}
    .theme-risk-meta{font-size:8px;line-height:1.35;color:#78858f}
    .theme-risk-driver{margin-top:5px;font-size:7.5px;line-height:1.35;color:#65727c}
    .theme-risk-card.low{--risk:#72e0a3}.theme-risk-card.moderate{--risk:#d8d56a}.theme-risk-card.elevated{--risk:#e8ad5e}.theme-risk-card.high{--risk:#ee7d64}.theme-risk-card.severe{--risk:#ef667c}
    @media(max-width:1180px){.theme-risk-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:720px){.theme-risk-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.theme-risk-head{align-items:flex-start;flex-direction:column}.theme-risk-note{text-align:left}}
  `;
  document.head.appendChild(style);

  const INDUSTRIES=[
    {name:'AI / Data Centres',f:[['financialConditions','low',1.4],['industrialCapex','low',1.3],['riskAppetite','low',1.0],['inputCostPressure','high',.7],['creditAvailability','low',.8]]},
    {name:'Semiconductors',f:[['financialConditions','low',1.2],['industrialCapex','low',1.1],['growthDemand','low',1.0],['riskAppetite','low',1.0],['inputCostPressure','high',.5]]},
    {name:'Robotics / Automation',f:[['industrialCapex','low',1.4],['growthDemand','low',1.0],['financialConditions','low',1.0],['riskAppetite','low',.8],['inputCostPressure','high',.6]]},
    {name:'Power / Grid',f:[['financialConditions','low',.9],['industrialCapex','low',1.4],['inputCostPressure','high',1.0],['creditAvailability','low',.5],['growthDemand','low',.5]]},
    {name:'Water / Cooling',f:[['industrialCapex','low',1.2],['financialConditions','low',.8],['inputCostPressure','high',.7],['growthDemand','low',.5]]},
    {name:'Nuclear / Uranium',f:[['industrialCapex','low',1.0],['financialConditions','low',.7],['riskAppetite','low',.6],['inputCostPressure','high',.4],['growthDemand','low',.4]]},
    {name:'Metals / Mining',f:[['growthDemand','low',1.3],['industrialCapex','low',1.0],['financialConditions','low',.8],['inputCostPressure','high',.5],['riskAppetite','low',.5]]},
    {name:'Oil & Gas / Refining',f:[['crudeTightness','low',1.2],['productTightness','low',1.0],['growthDemand','low',.7],['financialConditions','low',.4],['inputCostPressure','high',.3]]},
    {name:'Agriculture / Food',f:[['inputCostPressure','high',1.1],['financialConditions','low',.6],['growthDemand','low',.4],['consumerStrength','low',.4]]},
    {name:'Healthcare',f:[['financialConditions','low',.4],['consumerStrength','low',.3],['riskAppetite','low',.2],['growthDemand','low',.1]]},
    {name:'Consumer Discretionary',f:[['consumerStrength','low',1.5],['labourStrength','low',1.0],['financialConditions','low',1.0],['inputCostPressure','high',.7],['creditAvailability','low',.6]]},
    {name:'Housing / Construction',f:[['housingStrength','low',1.5],['financialConditions','low',1.3],['creditAvailability','low',.8],['inputCostPressure','high',.6],['labourStrength','low',.3]]},
    {name:'Financials / Credit',f:[['financialConditions','low',1.0],['creditAvailability','low',1.2],['tailCreditStress','high',1.4],['growthDemand','low',.6],['consumerStrength','low',.5]]},
    {name:'Utilities',f:[['financialConditions','low',1.2],['inputCostPressure','high',.6],['creditAvailability','low',.7],['growthDemand','low',.2]]}
  ];

  function riskClass(score){if(score<35)return['low','Low'];if(score<50)return['moderate','Moderate'];if(score<65)return['elevated','Elevated'];if(score<80)return['high','High'];return['severe','Severe']}
  function channel(key){return typeof channelContext==='function'?channelContext(key):macroContext?.channels?.find(c=>c.key===key)}
  function riskSignal(key,mode){const c=channel(key);if(!c||!(typeof channelFresh==='function'?channelFresh(c):true))return null;const score=Number(c.score||0);return {c,signal:(mode==='high'?score:-score)*Number(c.confidence??1)} }
  function industryRisk(ind){
    let weighted=0,total=0,drivers=[];
    ind.f.forEach(([key,mode,w])=>{const r=riskSignal(key,mode);if(!r)return;weighted+=r.signal*w;total+=w;drivers.push({label:r.c.label||key,impact:r.signal*w});});
    const avg=total?weighted/total:0;
    const score=clamp(50+avg*22,0,100);
    const [cls,label]=riskClass(score);
    drivers.sort((a,b)=>b.impact-a.impact);
    const top=drivers.filter(d=>d.impact>0).slice(0,2).map(d=>d.label).join(' + ')||'No major macro stress driver';
    return {...ind,score,cls,label,avg,top,coverage:drivers.length};
  }
  function renderRisk(){
    const body=document.getElementById('contextBody');
    if(!body||document.getElementById('themeRiskNow'))return;
    const fresh=typeof packetFresh==='function'&&packetFresh();
    const industries=INDUSTRIES.map(industryRisk).sort((a,b)=>b.score-a.score);
    const section=document.createElement('div');
    section.id='themeRiskNow';section.className='theme-risk-section';
    section.innerHTML=`<div class="theme-risk-head"><div class="theme-risk-title">MACRO INDUSTRY RISK NOW</div><div class="theme-risk-note">Pure macro view — not based on Power Stack holdings, stock scores or portfolio exposure. Each industry is mapped to the live macro channels it is most sensitive to. 50 = neutral macro risk; higher = more hostile macro backdrop. ${fresh?'Current macro snapshot applied.':'Macro snapshot stale/unavailable.'}</div></div><div class="theme-risk-grid">${industries.map(r=>`<div class="theme-risk-card ${r.cls}"><div class="theme-risk-top"><span class="theme-risk-name">${esc(r.name)}</span><b class="theme-risk-score">${r.score.toFixed(0)}</b></div><div class="theme-risk-label">${r.label} macro risk</div><div class="theme-risk-track"><div class="theme-risk-fill" style="--risk-pct:${r.score.toFixed(1)}%"></div></div><div class="theme-risk-meta">Macro pressure ${r.avg>=0?'+':''}${r.avg.toFixed(2)} · ${r.coverage} live channels</div><div class="theme-risk-driver">Main pressure: ${esc(r.top)}</div></div>`).join('')}</div>`;
    body.prepend(section);
  }

  const body=document.getElementById('contextBody');
  if(body){const observer=new MutationObserver(()=>{if(!document.getElementById('themeRiskNow'))queueMicrotask(renderRisk)});observer.observe(body,{childList:true});}
  queueMicrotask(renderRisk);
})();
