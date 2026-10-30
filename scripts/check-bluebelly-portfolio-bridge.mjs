import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const json=path=>JSON.parse(read(path));
const bridge=json('data/bluebelly-portfolio-bridge-2026-10-30.json');
const held=json('data/holdings-fundamentals.json').holdings;
const watch=json('data/watchlist.json').candidates;
const html=read('market-to-portfolio.html');
const nav=read('ps-ux.js');
assert.equal(bridge.contractVersion,'power-stack-bluebelly-portfolio-bridge/1');
assert.equal(bridge.reviewDate,'2026-10-30');
assert.equal(bridge.verdict.reviewState,'RESEARCH_ONLY');
assert.equal(bridge.dataQuality.tradePermission,'NONE');
assert.equal(bridge.dataQuality.ordersPlaced,false);
assert.equal(bridge.dataQuality.holdingsChanged,false);
assert.equal(bridge.dataQuality.watchlistScoresChanged,false);
assert.equal(bridge.dataQuality.newScheduledTasks,false);
assert.equal(held.length,8);
assert.equal(watch.length,46);
assert.deepEqual(new Set(bridge.holdings.map(x=>x.ticker)),new Set(held.map(x=>x.ticker)));
assert.equal(new Set(bridge.holdings.map(x=>x.priority)).size,8);
assert.equal(new Set(bridge.newsroom.map(x=>x.id)).size,bridge.newsroom.length);
assert.ok(bridge.marketObservations.length>=5);
assert.ok(bridge.watchlistLanes.length>=5);
assert.match(bridge.dataQuality.holdingPriceWindow,/Oct 2026/);
assert.match(bridge.dataQuality.watchlistPriceWindow,/22 Oct/);
assert.equal(bridge.sourceAuthority.powerStackSnapshot.status,'degraded_latest');
for(const item of bridge.marketObservations){
 assert.match(item.source.url,/^https:\/\//);
 assert.ok(item.asOf && item.confidence && item.implication && item.test);
}
for(const item of bridge.newsroom){
 assert.match(item.sourceUrl,/^https:\/\//);
 assert.ok(item.status && item.investorMeaning);
}
for(const row of bridge.holdings){
 assert.ok(row.actionGate && row.test && row.why);
 assert.ok(!/^BUY$|^SELL$/.test(row.actionGate));
}
for(const lane of bridge.watchlistLanes){
 assert.ok(lane.required && lane.risk && lane.signal);
 assert.ok(lane.tickers.length>1);
}
for(const anchor of ['bridge-macro','bridge-news','bridge-held','bridge-watch','bridge-blockers']){
 assert.match(html,new RegExp('id="'+anchor+'"'));
}
assert.match(html,/No trades placed/);
assert.match(html,/Bridge unavailable or invalid/);
assert.match(html,/source-dated/i);
assert.match(nav,/market-to-portfolio\.html/);
assert.match(nav,/attachBluebellyBridge/);
console.log('PASS: 30 Oct Bluebelly bridge covers 8 holdings, source-dated observations and guarded research views.');
