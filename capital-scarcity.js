fetch('data/capital-scarcity-2026-09-16.json',{cache:'no-store'}).then(r=>r.json()).then(d=>{
  document.querySelector('#regime').textContent=`${d.regime} · ${d.asOf}`;
  document.querySelector('#summary').textContent=d.summary;
  document.querySelector('#signals').innerHTML=d.signals.map(x=>`<article class="card signal ${x.status}"><div class="meta">${x.category} · ${x.status}</div><h3>${x.signal}</h3><div>${x.implication}</div></article>`).join('');
  document.querySelector('#actions').innerHTML=d.portfolioActions.map(x=>`<article class="card action"><b>${x.ticker}</b><span>${x.price}</span><span><strong>${x.action}</strong><br>${x.trigger}</span></article>`).join('');
  document.querySelector('#steps').innerHTML=d.todaySequence.map(x=>`<li>${x}</li>`).join('');
}).catch(e=>document.querySelector('#summary').textContent=`Data unavailable: ${e.message}`);
