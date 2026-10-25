import assert from 'node:assert/strict';
import fs from 'node:fs';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8')),text=p=>fs.readFileSync(p,'utf8');
const review=j('data/cpi-2026-10-14-security-overlay.json');
const holding=j('data/holdings-fundamentals.json'),watch=j('data/watchlist.json'),desk=j('data/personal-decision-desk.json');
const market=j('data/market-summary.json'),live=j('data/live-desk-canonical.json');
const index=text('index.html'),watchHtml=text('watchlist.html'),holdHtml=text('holdings.html');
const adapter=text('stock-states.js'),memo=text('research/2026-10-14-post-cpi-54-security-review.md');
assert.equal(review.contractVersion,'power-stack-cpi-crossasset-security-review/1');
assert.equal(review.status,'RESEARCH_REVIEW_PRE_TRADE');
assert.equal(review.investmentActionAuthority,'NONE');
assert(Number.isFinite(Date.parse(review.asOf))&&Date.parse(review.asOf)<=Date.now(),'CPI review timestamp is in the future');
assert.equal(review.cpiRelease,'2026-10-14T20:30:00+08:00');
assert.equal(review.cpi.headlineMoM.actual,0.6);
assert.equal(review.cpi.headlineMoM.consensus,0.6,'Headline surprise not fabricated');
assert.equal(review.cpi.coreMoM.actual,0.3);
assert.equal(review.cpi.coreMoM.consensus,0.2);
assert.equal(review.cpi.gasolineMoM,9.1);
assert.equal(review.cpi.gasolineEffectPp,0.337);
assert.equal(review.cpi.energyEffectPp,0.377);
assert(review.cpi.contributionRoundingNote.includes('nested'),'Double-count of BLS basket is not disclosed');
assert.deepEqual(review.totals,{holdings:8,watchlist:46,watchlistBuyResearch:6,watchlistSelective:25,watchlistWait:13,watchlistAvoid:2,rankChanges:0,scoreChanges:0,positionChanges:0},'Sweep coverage or invariant count changed');
assert.equal(holding.holdings.length,8);assert.equal(watch.candidates.length,46);assert.equal(desk.focus.length,8);
assert.equal(new Set(review.holdings.map(x=>x.ticker)).size,8);
assert.equal(new Set(review.watchlist.map(x=>x.ticker)).size,46);
const hBy=new Map(holding.holdings.map(x=>[x.ticker,x])),wBy=new Map(watch.candidates.map(x=>[x.ticker,x]));
for(const x of review.holdings){
 const h=hBy.get(x.ticker);assert(h,'Unknown holding '+x.ticker);
 assert.equal(x.existingScore,h.score,'Macro incorrectly changes holding score');
 assert.equal(x.existingAction,h.action,'Macro incorrectly changes recorded holding action');
 assert.equal(x.existingContradiction,h.contradiction,'Macro incorrectly changes thesis state');
 assert(x.unchangedCompanyScore&&x.newScore===null&&x.newAction===null&&x.postCpiQuote===null,'Unverified trade or new price invented');
 assert(x.nextProof&&x.interpretation&&x.macroTransmission,'Missing holding issuer proof '+x.ticker);
}
for(const x of review.watchlist){
 const w=wBy.get(x.ticker);assert(w,'Unknown watchlist security '+x.ticker);
 assert.equal(x.rank,w.rank,'CPI illegally changes ranking');assert.equal(x.existingScore,w.score,'CPI illegally changes score');
 assert.equal(x.originalBucket,w.bucket);assert.equal(x.existingAction,w.action);
 assert(x.unchangedRankAndScore&&x.newScore===null&&x.newBucket===null&&x.newAction===null&&x.postCpiQuote===null,'Unverified stock action or live price fabricated');
 assert(x.nextProof&&x.interpretation&&x.existingConfirmation&&x.existingInvalidation,'Missing issuer-specific proof '+x.ticker);
}
// Current market summary advances daily; a frozen 14 October CPI audit must not
// insist that today's headline or source links still describe the 14 October print.
assert.equal(market.contractVersion,'power-stack-market-summary/v1');
assert(Number.isFinite(Date.parse(market.asOf)),'Current market summary timestamp invalid');
assert(market.title && market.marketSession && market.dataLimits,'Current summary missing essential context');
assert(market.sourceLinks.length>=3,'Current summary lost source provenance');
assert(review.sources.some(x=>JSON.stringify(x).includes('cpi_10142026.htm')),'Frozen CPI review lost official release reference');
assert(memo.includes('8/8 current holdings')&&memo.includes('46/46 watchlist'));
assert(review.sources.some(x=>x.type==='OFFICIAL')&&review.sources.some(x=>x.type==='NOTION_PULSE'));
// The 14 Oct CPI review is an immutable point-in-time assessment. The
// current six-hour Live sync must not rewrite or invalidate its historical Dossier.
const pinnedLive = review.sourceHealth.liveSnapshot;
assert(pinnedLive.status && pinnedLive.dossierId,'CPI review lost its pinned Dossier provenance');
assert(Number.isFinite(Date.parse(pinnedLive.asOf)) && Date.parse(pinnedLive.asOf) <= Date.parse(review.asOf),
  'CPI review cites a Live snapshot newer than the review itself');
assert(Number.isFinite(Date.parse(live.asOf)),'Current Live snapshot timestamp is invalid');
assert(review.sourceHealth.creditAndFullCurve.includes('UNVERIFIED'),'Post-CPI full curve/credit not marked verified');
assert(review.sourceHealth.stockPrices.includes('NO_NEW_14_OCT_QUOTES'));
assert(index.includes('data/cpi-2026-10-14-security-overlay.json')&&index.includes('PowerStackState.cpiImpact(cpiHold.get(h.ticker))')&&index.includes('PowerStackState.cpiImpact(cpiWatch.get(x.ticker))'),'Homepage CPI chips missing');
assert(watchHtml.includes('data/cpi-2026-10-14-security-overlay.json')&&watchHtml.includes('cpiOverlayWatch.get(item.ticker)'),'Watchlist CPI chips missing');
assert(holdHtml.includes('data/cpi-2026-10-14-security-overlay.json')&&holdHtml.includes('cpiOverlayHold.get(h.ticker)'),'Holdings CPI chips missing');
assert(adapter.includes('function cpiImpact(')&&adapter.includes('Macro-only interpretation'),'Macro channel conflated with issuer proof');
assert(!/SCORE_CHANGED|BUY_NOW|AUTO_TRADE/.test(JSON.stringify(review)),'Trade promise in CPI dataset');
console.log('CPI 54-security review validation OK: official headline/core and nested contributions, 8 holdings + 46 watchlist, unchanged actions/scores/positions, dated source health and CPI-specific site cards.');
