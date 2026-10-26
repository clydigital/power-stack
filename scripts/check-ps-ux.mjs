#!/usr/bin/env node
/** Verify UI wiring and non-executable holding action text without network access. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const pages = ['index.html','research-library.html','holdings.html','watchlist.html','themes.html','motion.html','capital-scarcity.html'];
for (const path of pages) {
  const html=read(path);
  assert.equal((html.match(/ps-ux\.css/g)||[]).length,1,path+' stylesheet');
  assert.equal((html.match(/ps-ux\.js/g)||[]).length,1,path+' script');
  assert.ok(html.indexOf('ps-ux.css') < html.indexOf('</head>'),path+' CSS placement');
  assert.ok(html.indexOf('ps-ux.js') < html.indexOf('</body>'),path+' JS placement');
}
const src=read('ps-ux.js');
for (const label of ['Decision desk','Full library','Holdings','Watchlist','Themes','Market motion','Rates & capital']) assert.ok(src.includes(label),'Missing navigation: '+label);
assert.ok(src.includes("if (file === 'index.html')"),'Front page must keep icon-only treatment');
assert.ok(src.includes('ps-holdings-action-brief'),'Holdings action explanation must exist');
assert.ok(src.includes("nav.className = 'ps-research-navigator ps-library-nav'"),
  'Full Library must use a dedicated top-level navigation surface');
assert.ok(src.includes("header.insertAdjacentElement('afterend', nav)"),
  'Library navigation belongs directly under the main page header');
assert.ok(src.includes('ps-view-switch ps-library-tabs') && src.includes("aria-label=\"Power Stack sections\""),
  'Library sections need one accessible, flat navigation bar');
for (const page of ['index.html','research-library.html','holdings.html','watchlist.html','baskets.html','themes.html','motion.html','capital-scarcity.html']) {
  assert.ok(src.includes("'"+page+"'"),'Library top-level nav must retain a link to '+page);
}
const data=JSON.parse(read('data/client-advisor.json'));
assert.equal(data.contractVersion,'power-stack-client-advisor/1');
assert.equal(data.capital.totalMYR,13491);
assert.equal(data.capital.cashVerified,false);
assert.equal(data.capital.positionsVerified,false);
assert.equal(data.integrity.ordersPlaced,false);
for (const ticker of ['DAYANG','TSLA','YTLPOWR + 6742UW','XOM · MISC · HIBISCS','TTWO']) {
  const action=data.legacyActions.find(x=>x.ticker===ticker);
  assert.ok(action,'Missing '+ticker);
  for (const field of ['plainAction','target','trigger','nextStep','holdInstead','reviewAsOf']) assert.ok(action[field],'Missing '+ticker+'.'+field);
}
assert.ok(read('advisor-desk.js').includes('adv-holding-explanation'),'Client explanations must render');
console.log('Power Stack UI and conditional holding action checks passed for '+pages.length+' pages and '+data.legacyActions.length+' holdings reviews.');
