(() => {
  const defaults={font:'bebas',scale:'1',theme:'dark',bg:'default'};
  const key='powerStackUI';
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
  const state={...defaults,...saved};
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number(v)||1));
  state.scale=String(clamp(state.scale,.82,2));

  const applyTextScale=()=>{
    const scale=clamp(state.scale,.82,2);
    document.querySelectorAll('body *').forEach(el=>{
      if(el.closest('.ui-settings-panel')||el.classList.contains('ui-settings-button')) return;
      if(!el.dataset.psBaseFont){
        const n=parseFloat(getComputedStyle(el).fontSize);
        if(Number.isFinite(n)&&n>0) el.dataset.psBaseFont=String(n);
      }
      const base=parseFloat(el.dataset.psBaseFont||'');
      if(Number.isFinite(base)) el.style.fontSize=`${base*scale}px`;
    });
  };

  const apply=()=>{
    document.body.dataset.font=state.font;
    document.body.dataset.theme=state.theme;
    document.body.dataset.bg=state.bg;
    document.documentElement.style.setProperty('--font-scale',String(state.scale));
    localStorage.setItem(key,JSON.stringify(state));
    const val=document.getElementById('uiScaleValue');if(val)val.textContent=`${Math.round(Number(state.scale)*100)}%`;
    requestAnimationFrame(applyTextScale);
  };

  let cityLayer=document.querySelector('.city-background-layer');
  if(!cityLayer){
    cityLayer=document.createElement('div');
    cityLayer.className='city-background-layer';
    cityLayer.setAttribute('aria-hidden','true');
    cityLayer.innerHTML='<img src="assets/Background.gif" alt="">';
    document.body.prepend(cityLayer);
  }

  apply();

  const button=document.createElement('button');
  button.className='ui-settings-button';button.type='button';button.title='Display settings';button.setAttribute('aria-label','Open display settings');button.textContent='✦';
  const panel=document.createElement('section');
  panel.className='ui-settings-panel';panel.setAttribute('aria-label','Display settings');
  panel.innerHTML=`
    <div class="ui-settings-title"><span>Display</span><span id="uiScaleValue">${Math.round(Number(state.scale)*100)}%</span></div>
    <label class="ui-setting"><span>Font</span><select id="uiFont"><option value="bebas">Bebas Neue · Thin</option><option value="figtree">Figtree</option><option value="mono">Mono Serif</option></select></label>
    <label class="ui-setting"><span>Font size</span><input id="uiScale" type="range" min="0.82" max="2" step="0.02" /></label>
    <label class="ui-setting"><span>Mode</span><select id="uiTheme"><option value="dark">Dark</option><option value="light">Light</option></select></label>
    <label class="ui-setting"><span>Background</span><select id="uiBg"><option value="default">Default · Chrome</option><option value="city">City</option></select></label>
    <div class="ui-settings-note">Font size now applies to all page text up to 200%. Settings are saved on this device. City mode uses the supplied pixel-city background at higher visibility.</div>`;
  document.body.append(panel,button);

  const font=panel.querySelector('#uiFont'),scale=panel.querySelector('#uiScale'),theme=panel.querySelector('#uiTheme'),bg=panel.querySelector('#uiBg');
  font.value=state.font;scale.value=state.scale;theme.value=state.theme;bg.value=state.bg;
  button.onclick=()=>panel.classList.toggle('open');
  document.addEventListener('click',e=>{if(!panel.contains(e.target)&&e.target!==button)panel.classList.remove('open')});
  font.onchange=()=>{state.font=font.value;apply()};
  scale.oninput=()=>{state.scale=scale.value;apply()};
  theme.onchange=()=>{state.theme=theme.value;apply()};
  bg.onchange=()=>{state.bg=bg.value;apply()};

  const observer=new MutationObserver(muts=>{
    if(!muts.some(m=>m.addedNodes?.length))return;
    requestAnimationFrame(applyTextScale);
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();