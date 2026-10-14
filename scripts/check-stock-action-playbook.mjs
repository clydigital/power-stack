import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../stock-states.js';
const data=p=>JSON.parse(fs.readFileSync(p,'utf8')),read=p=>fs.readFileSync(p,'utf8');
const play=data('data/stock-action-playbook.json');
const holding=data('data/holdings-fundamentals.json').holdings;
const watch=data('data/watchlist.json').candidates;
const focus=data('data/personal-decision-desk.json').focus;
const cpi=data('data/cpi-2026-10-14-security-overlay.json');
const by=(xs,k)=>xs.find(x=>x.ticker===k);
assert.equal(play.contractVersion,'power-stack-action-playbook/1');
assert.equal(play.holdings.length,8,'All holdings require written next actions');
assert.equal(play.watchlist.length,46,'All watchlist candidates require written next actions');
assert.equal(play.adjacent.length,3,'Unrated focus names must not become scored trades');
assert.equal(play.asOf,cpi.asOf,'Action framework must not claim a newer research event');
assert.deepEqual(new Set(play.holdings.map(x=>x.ticker)),new Set(holding.map(x=>x.ticker)));
assert.deepEqual(new Set(play.watchlist.map(x=>x.ticker)),new Set(watch.map(x=>x.ticker)));
assert.deepEqual(new Set(play.adjacent.map(x=>x.ticker)),new Set(focus.filter(x=>x.unscored).map(x=>x.ticker)));
assert(play.interpretationRule.includes('not new trade instructions'));
assert(play.sourceLinks.some(x=>x.includes('bls.gov')));
const heldCodes=new Set(['HOLD_NO_CHASE','HOLD_NO_ADD','VERIFY_INSTRUMENT','NO_AVERAGE_DOWN']);
const watchCodes={buy:'PRIORITY_RESEARCH',selective:'WAIT_FOR_ENTRY',wait:'WAIT_FOR_PROOF',avoid:'AVOID'};
for(const plan of play.holdings){
 const h=by(holding,plan.ticker);
 assert(heldCodes.has(plan.code),'Unrecognised holding action '+plan.ticker);
 assert.equal(plan.existingAction,h.action);assert.equal(plan.existingScore,h.score);
 assert.equal(plan.originalContradiction,h.contradiction);
 assert.equal(plan.quoteAsOf,h.position?.priceAsOf||null);
 assert(plan.now.length>40&&plan.addOnlyIf.length>70&&plan.reviewOrReduceIf.length>55,'Vague holding action '+plan.ticker);
 assert.equal(plan.executionReady,false,'Unverified holding unexpectedly tradable');
}
for(const plan of play.watchlist){
 const w=by(watch,plan.ticker);
 assert.equal(plan.code,watchCodes[w.bucket],'Watchlist action differs from existing bucket '+plan.ticker);
 assert.equal(plan.existingBucket,w.bucket);
 assert.equal(plan.existingScore,w.score);
 assert.equal(plan.existingAction,w.action);
 assert.equal(plan.originalRank,w.rank);
 assert(plan.now.length>40,'Vague watchlist do-now '+plan.ticker);
 assert(w.entry?.length>0&&w.confirmation?.length>0&&w.invalidation?.length>0,'Missing original entry/risk gates '+plan.ticker);
 assert.equal(plan.executionReady,false,'Unverified watchlist is not executable');
}
for(const plan of play.adjacent){
 const f=by(focus,plan.ticker);
 assert(f.unscored&&f.sourceType==='ISSUER_VERIFIED'&&f.mustProve&&f.risk);
 assert.equal(plan.code,'RESEARCH_ONLY');assert.equal(plan.executionReady,false);
}
assert.equal(by(play.holdings,'DAYANG').code,'NO_AVERAGE_DOWN');
assert.equal(by(play.holdings,'6742UW').code,'VERIFY_INSTRUMENT');
assert.equal(by(play.holdings,'YTLPOWR').code,'HOLD_NO_ADD');
assert.equal(by(play.watchlist,'MU').code,'PRIORITY_RESEARCH');
assert.equal(by(play.watchlist,'SMR').code,'AVOID');
assert.equal(by(play.watchlist,'MSTR').code,'AVOID');
const S=globalThis.PowerStackState;
const a=S.holdingPlan(by(play.holdings,'DAYANG'),false);
assert(a.includes('DO NOW')&&a.includes('CONSIDER ADDING ONLY IF')&&a.includes('REVIEW REDUCING / EXIT IF'));
const w=S.watchPlan(by(play.watchlist,'MU'),by(watch,'MU'),by(cpi.watchlist,'MU'),false);
assert(w.includes('DO NOW')&&w.includes('ENTRY / PRICE GATE')&&w.includes('COMPANY PROOF REQUIRED')&&w.includes('STAND ASIDE / REVIEW IF')&&w.includes('CPI FOLLOW-UP'));
assert(w.includes('Trade gate: BLOCKED')&&w.includes('Prior reference:'));
const adj=S.watchPlan(by(play.adjacent,'VRT'),by(focus,'VRT'),null,true);
assert(adj.includes('RESEARCH ONLY')&&adj.includes('No instrument score'));
assert(S.holdingPlan({...by(play.holdings,'XOM'),now:'<script>bad</script>'},true).includes('&lt;script&gt;'),'Escape plans');
const home=read('index.html'),watchHtml=read('watchlist.html'),holdHtml=read('holdings.html');
for(const [name,html] of [['homepage',home],['watchlist',watchHtml],['holdings',holdHtml]]){
 assert(html.includes('data/stock-action-playbook.json'),'No action source '+name);
 assert(!html.includes('spectrum.css'),'Original colour scheme not restored '+name);
}
assert(home.includes('PowerStackState.holdingPlan(')&&home.includes('PowerStackState.watchPlan('));
assert(watchHtml.includes('PowerStackState.watchPlan(actionWatch.get(item.ticker)'));
assert(holdHtml.includes('PowerStackState.holdingPlan(actionHeld.get(h.ticker)'));
assert(!/BUY NOW|AUTOMATIC BUY|GUARANTEED PROFIT/i.test(JSON.stringify(play)));
console.log('54-stock action playbook validated: all securities mapped to explicit now/entry/risk gates, original ratings/actions unchanged, 3 unrated focus ideas, no executable stale-price trades.');
