import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
const sprite=read('assets/market-iconography/sprite.svg');
const symbols=[...sprite.matchAll(/<symbol id="bb-([\w-]+)"\b/g)].map(m=>m[1]);
assert.equal(symbols.length,40,'Hybrid sprite must contain forty canonical symbols');
assert.equal(new Set(symbols).size,40,'Hybrid sprite has duplicate IDs');
const script=read('ps-market-icons.js');
const css=read('ps-market-icons.css');
assert.ok(script.includes("const sprite = 'assets/market-iconography/sprite.svg#bb-'"),'Icon source path diverges from local sprite');
assert.ok(script.includes('MutationObserver')&&script.includes('dataset.psMarketIcon'),'Dynamic rerender idempotency guard missing');
assert.ok(script.includes('aria-hidden="true"')&&script.includes('focusable="false"'),'Decorative icons missing accessibility safeguards');
assert.ok(!script.includes('localStorage')&&!script.includes('fetch(')&&!script.includes('navigator.clipboard'),'Iconography must remain read-only');
assert.ok(!script.includes('ordersPlaced')&&!script.includes('allocationPct')&&!script.includes('score='),'No investment state changes permitted');
assert.ok(css.includes('@media(max-width:640px)'),'Responsive icon scaling missing');
for (const key of ['market','rates','bond','oil','gold','ai','chip','evidence','risk','catalyst','divergence','transmission','source','credit']) assert.ok(symbols.includes(key),key+' is missing');
const pages=['index.html','research-library.html','holdings.html','watchlist.html','themes.html','motion.html','capital-scarcity.html','baskets.html'];
for(const page of pages) {
 const html=read(page);
 assert.equal((html.match(/<\/html>/gi)||[]).length,1,page+': malformed duplicate HTML tail');
 assert.equal((html.match(/href="ps-market-icons\.css"/g)||[]).length,1,page+': CSS inclusion missing or repeated');
 assert.equal((html.match(/src="ps-market-icons\.js"/g)||[]).length,1,page+': JS inclusion missing or repeated');
 assert.ok(html.indexOf('ps-market-icons.css')<html.indexOf('</head>'),page+': stylesheet placement incorrect');
 assert.ok(html.indexOf('ps-market-icons.js')<html.indexOf('</body>'),page+': icon script placement incorrect');
}
assert.ok(script.includes('.idea-card .ticker')&&script.includes('.holding-card .holding-ticker'),'Company ticker icon selectors missing');
for(const key of ['contextIcon','symbolForMarket','portfolioSector','markMarketRows','details','schedule'])assert.ok(script.includes(key),'Missing '+key);
console.log('Hybrid iconography checks passed: '+symbols.length+' source symbols; '+pages.length+' pages; read-only, accessible, rerender-safe.');
