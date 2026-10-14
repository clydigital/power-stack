import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../stock-states.js';

const S=globalThis.PowerStackState;
assert(S && typeof S.holding==='function' && typeof S.watchlist==='function');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const txt=p=>fs.readFileSync(p,'utf8');
const holdings=read('data/holdings-fundamentals.json').holdings;
const watch=read('data/watchlist.json').candidates;
const focus=read('data/personal-decision-desk.json').focus;
const byTicker=(xs,t)=>xs.find(x=>x.ticker===t);
assert.equal(holdings.length,8,'The portfolio must preserve eight positions');
assert.equal(focus.length,8,'The decision desk must preserve eight focus stocks');
assert.equal(watch.length,46,'The watchlist must preserve the existing 46 stocks');
assert.equal(S.holding(byTicker(holdings,'XOM')).tone,'bullish');
assert.equal(S.holding(byTicker(holdings,'MISC')).tone,'bullish');
assert.equal(S.holding(byTicker(holdings,'DAYANG')).tone,'bearish');
assert.equal(S.holdingAction(byTicker(holdings,'DAYANG')).text,'NO AVERAGE DOWN');
assert.equal(S.holding(byTicker(holdings,'YTLPOWR')).tone,'unconfirmed');
assert.equal(S.holding(byTicker(holdings,'6742UW')).tone,'unconfirmed');
assert.equal(S.holdingAction(byTicker(holdings,'6742UW')).text,'VERIFY TERMS');
assert.equal(S.holding(byTicker(holdings,'TTWO')).tone,'caution');
assert.equal(S.watchlist(byTicker(watch,'MU')).tone,'bullish');
assert.equal(S.watchlistAction(byTicker(watch,'MU')).text,'RESEARCH FIRST');
assert.equal(S.candidateAction(byTicker(focus,'MU')).text,'NO CHASE');
assert.equal(S.candidate(byTicker(focus,'VRT'),null).tone,'unrated');
for(const bucket of ['buy','selective','wait','avoid']) {
 const item=watch.find(x=>x.bucket===bucket);
 assert(item,'Missing existing watchlist category '+bucket);
 const v=S.watchlist(item), action=S.watchlistAction(item);
 assert(v.tone&&action.tone&&action.text&&!/BUY NOW/.test(action.text),'Missing/noisy state for '+bucket);
}
for(const h of holdings) {
 const thesis=S.holding(h),decision=S.holdingAction(h);
 assert(['bullish','bearish','caution','unconfirmed'].includes(thesis.tone),'Unexpected holding thesis '+h.ticker);
 assert(decision.basis&&decision.text,'Missing action source '+h.ticker);
}
for(const item of focus) {
 const base=byTicker(watch,item.ticker);
 const t=S.candidate(item,base),a=S.candidateAction(item);
 assert(t.text&&t.basis&&a.text&&a.basis,'Missing focused-card labels '+item.ticker);
 assert(item.unscored?t.tone==='unrated':!!base,'Unscored status or watchlist linkage changed');
}
assert.equal(S.library('Speculative').tone,'bearish');
assert.equal(S.library('Priority').tone,'conditional','Research priority is not a purchase');
assert(S.badge('<script>','bullish').includes('&lt;script&gt;'),'Rendered badges must escape text');
assert(!S.badge('<script>','bullish').includes('<script>'));
const pages={
 'index.html':'ps-home',
 'watchlist.html':'ps-watchlist',
 'holdings.html':'ps-holdings',
 'research-library.html':'ps-library',
 'themes.html':'ps-themes',
 'motion.html':'ps-motion',
 'capital-scarcity.html':'ps-capital'
};
for(const [page,oldClass] of Object.entries(pages)) {
 const html=txt(page);
 assert(!html.includes('spectrum.css')&&!html.includes('class="'+oldClass+'"'),'Global visual redesign not fully reverted on '+page);
 const isStock=['index.html','watchlist.html','holdings.html','research-library.html'].includes(page);
 assert.equal(html.includes('href="stock-states.css"'),isStock,'Stock CSS loading mismatch '+page);
 assert.equal(html.includes('src="stock-states.js"'),isStock,'Stock JS loading mismatch '+page);
 if(isStock)assert(html.indexOf('src="stock-states.js"')<html.lastIndexOf('</body>'),'Stock JS not loaded in '+page);
}
assert(!fs.existsSync('spectrum.css'),'Unused Spectrum file should be removed');
const home=txt('index.html'), wpage=txt('watchlist.html'),hpage=txt('holdings.html'),app=txt('app.js');
assert(home.includes("PowerStackState.holding(h)")&&home.includes("PowerStackState.candidate(x,prev)"),'Homepage badges missing');
assert(home.includes("data-holding-tone")&&home.includes("data-shortlist-tone")&&home.includes("aria-pressed"),'Homepage stock filters unavailable');
assert(wpage.includes("data-watch-tone")&&wpage.includes("renderBuckets(watch)")&&wpage.includes("PowerStackState.watchlistAction(item)"),'Watchlist filters/actions unavailable');
assert(hpage.includes("PowerStackState.holdingAction(h)")&&hpage.includes("stock-card-state"),'Holding action colour absent');
assert(app.includes("PowerStackState.library(statusBucket(x))"),'Library status colours missing');
const css=txt('stock-states.css');
for(const tone of ['bullish','bearish','caution','conditional','unconfirmed','unrated']) assert(css.includes('.stock-tag--'+tone),'Missing visible label '+tone);
assert(css.includes(':focus-visible')&&css.includes('prefers-reduced-motion'),'Missing keyboard/reduced-motion support');
console.log('Stock-state validation OK: original palette restored; 8 positions/8 focus/46 watchlist preserved; dated thesis and action meanings distinct; filters, escape and contrast tokens present.');
