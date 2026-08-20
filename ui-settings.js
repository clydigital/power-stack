(() => {
  const defaults={font:'bebas',scale:'1',theme:'dark',bg:'default'};
  const key='powerStackUI';
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
  const state={...defaults,...saved};
  const apply=()=>{
    document.body.dataset.font=state.font;
    document.body.dataset.theme=state.theme;
    document.body.dataset.bg=state.bg;
    document.documentElement.style.setProperty('--font-scale',String(state.scale));
    localStorage.setItem(key,JSON.stringify(state));
    const val=document.getElementById('uiScaleValue');if(val)val.textContent=`${Math.round(Number(state.scale)*100)}%`;
  };
  apply();

  const button=document.createElement('button');
  button.className='ui-settings-button';button.type='button';button.title='Display settings';button.setAttribute('aria-label','Open display settings');button.textContent='✦';
  const panel=document.createElement('section');
  panel.className='ui-settings-panel';panel.setAttribute('aria-label','Display settings');
  panel.innerHTML=`
    <div class="ui-settings-title"><span>Display</span><span id="uiScaleValue">100%</span></div>
    <label class="ui-setting"><span>Font</span><select id="uiFont"><option value="bebas">Bebas Neue</option><option value="figtree">Figtree</option><option value="mono">Mono Serif</option></select></label>
    <label class="ui-setting"><span>Font size</span><input id="uiScale" type="range" min="0.82" max="1.28" step="0.02" /></label>
    <label class="ui-setting"><span>Mode</span><select id="uiTheme"><option value="dark">Dark</option><option value="light">Light</option></select></label>
    <label class="ui-setting"><span>Background</span><select id="uiBg"><option value="default">Default · Chrome</option><option value="city">City</option></select></label>
    <div class="ui-settings-note">Saved locally on this device. City mode uses the supplied city artwork; Default keeps the dark green / dark blue matte-chrome gradient.</div>`;
  document.body.append(panel,button);

  const font=panel.querySelector('#uiFont'),scale=panel.querySelector('#uiScale'),theme=panel.querySelector('#uiTheme'),bg=panel.querySelector('#uiBg');
  font.value=state.font;scale.value=state.scale;theme.value=state.theme;bg.value=state.bg;
  button.onclick=()=>panel.classList.toggle('open');
  document.addEventListener('click',e=>{if(!panel.contains(e.target)&&e.target!==button)panel.classList.remove('open')});
  font.onchange=()=>{state.font=font.value;apply()};
  scale.oninput=()=>{state.scale=scale.value;apply()};
  theme.onchange=()=>{state.theme=theme.value;apply()};
  bg.onchange=()=>{state.bg=bg.value;apply()};
})();
