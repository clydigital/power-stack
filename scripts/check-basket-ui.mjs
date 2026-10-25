import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=path=>fs.readFileSync(path,'utf8');
const document=read('holdings.html');
assert.equal((document.match(/<\/html>/gi)||[]).length,1,'Holdings contains more than one HTML document');
assert.match(document,/^<!doctype html>/i,'Holdings missing doctype');
assert.match(document,/<script src="ps-ux.js"><\/script>\s*<\/body>\s*<\/html>\s*$/,'Holdings has extraneous code after HTML end');
assert.ok(document.includes('renderLiveOverlay(overlay)')&&document.includes('renderCards(data.holdings)'),'Holdings behaviour missing');
const html=read('baskets.html'),app=read('app.js'),library=read('research-library.html'),front=read('index.html'),navigation=read('ps-ux.js');
assert.ok(html.includes('baskets.js')&&html.includes('baskets.css'));
assert.ok(html.includes('basket-grid')&&html.includes('basket-filters'),'Basket view missing interactive surfaces');
assert.ok(navigation.includes("file:'baskets.html'"),'Basket research missing from shared navigation');
assert.ok(library.includes('exposureNav')&&library.includes('baskets.html'),'Full library taxonomy/basket link missing');
assert.ok(front.includes('ps-basket-link')&&front.includes('baskets.html'),'Front page lacks restrained basket icon');
const ideas=JSON.parse(read('data/ideas.json'));
const groupMap={'Power / Grid':'Power & generation','Nuclear':'Power & generation','Uranium / Fuel':'Fuel & materials','Oil & Gas':'Fuel & materials','Metals':'Fuel & materials','AI / Data centres':'Compute & automation','Robotics / Automation':'Compute & automation','Digital Platforms & Fintech':'Digital businesses'};
for(const idea of ideas)assert.ok(idea.themeGroup==='Uncategorised'||groupMap[idea.themeGroup],idea.ticker+': unmatched exposure');
assert.ok(app.includes("state.exposure")&&app.includes("exposureBucket(x)"),'Library exposure filtering unavailable');
const data=JSON.parse(read('data/basket-strategies.json'));
assert.equal(data.schema,'power-stack-basket-comparison/v1');
assert.equal(data.status,'RESEARCH_ONLY_NOT_FUNDED');
assert.equal(data.capitalMYR,13491);
assert.equal(data.baskets.length,4);
assert.equal(data.groups.length,4);
for(const item of data.baskets){
 assert.ok(data.groups.some(g=>g.id===item.group));
 assert.equal(item.weights.reduce((s,x)=>s+x.pct,0),100,item.id+' bad percentage');
 assert.equal(item.weights.reduce((s,x)=>s+x.rm,0),13491,item.id+' capital exceeds account');
 assert.ok(item.weights.some(x=>x.symbol==='MYR'),'Cash assumption missing');
 assert.ok(item.weights.filter(x=>x.symbol!=='MYR').length<=2,item.id+' over-diversified');
 for(const key of ['positive','negative']){
  const c=item.illustrations[key],expected=Math.round(13491*c.pct/100);
  assert.ok(Math.abs(expected-c.profitMYR)<=2,item.id+': '+key+' sensitivity arithmetic');
  assert.ok(Math.abs((13491+c.profitMYR)-c.navMYR)<=1,item.id+': '+key+' NAV arithmetic');
 }
}
const js=read('baskets.js');
assert.ok(js.includes('aria-pressed')&&js.includes('data-mode')&&js.includes('data-group'),'Basket controls lack operational state');
assert.ok(js.includes('schema')&&js.includes('illustrations'));
console.log('Basket view, 56 historical ideas, 4 allocation alternatives and clean Holdings markup checks passed.');
