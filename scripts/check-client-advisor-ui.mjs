import assert from "node:assert/strict";
import fs from "node:fs";
const html=fs.readFileSync("index.html","utf8"),css=fs.readFileSync("advisor-desk.css","utf8"),js=fs.readFileSync("advisor-desk.js","utf8");
const feed=JSON.parse(fs.readFileSync("data/client-advisor.json","utf8"));
const mandate=JSON.parse(fs.readFileSync("data/rakuten-one-year-mandate.json","utf8"));
const config=JSON.parse(fs.readFileSync("data/research-sweep-config.json","utf8"));
assert.equal(feed.contractVersion,"power-stack-client-advisor/1");
assert.equal(feed.capital.totalMYR,13491);
assert.equal(mandate.capital.startingAccountNAVMYR,13491);
assert.equal(mandate.allocationSumMYR,13491);
assert.equal(mandate.allocationSumPct,100);
assert.equal(feed.capital.cashVerified,false,"Do not imply broker cash sync");
assert.equal(feed.integrity.ordersPlaced,false,"Never imply orders placed");
assert.equal(feed.integrity.liveBrokerConnected,false,"No brokerage link exists");
assert.equal(feed.firstMoves.length,3);
assert.equal(feed.opportunities.length,6);
assert(feed.opportunities.every(x=>x.symbol&&x.action&&Number.isFinite(x.targetMYR)&&x.buyWhen&&x.sellWhen&&x.source));
assert.equal(mandate.allocation.reduce((s,x)=>s+x.targetMYR,0),13491);
assert(html.indexOf('id="next-moves"')<html.indexOf('id="market-summary"'),"Actions must be earlier than market article");
assert(html.indexOf('id="investment-plan"')<html.indexOf('id="market-summary"'),"Budget must be earlier than market article");
for(const id of ["advisor","adv-total-capital","adv-account-status","adv-move-list","adv-budget-body","adv-idea-list","adv-legacy-review","adv-insight-grid","adv-event-list","adv-research-status","adv-copy-update"]){assert(html.includes('id="'+id+'"'),"Missing actionable element "+id)}
assert(html.includes('advisor-desk.css')&&html.includes('advisor-desk.js'));
assert(html.includes('data/market-summary.json')&&html.includes('data/personal-decision-desk.json'),"Legacy clients broken");
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,"Duplicate HTML ids");
for(const p of ["@media(max-width:720px)","@media(max-width:460px)",":focus-visible","prefers-reduced-motion"])assert(css.includes(p),"Missing accessible/responsive treatment "+p);
for(const p of ["data/client-advisor.json","data/rakuten-one-year-mandate.json","data-adv-filter","aria-pressed","fetchJson","renderTimestamp"])assert(js.includes(p),"Missing live data filter/refresh "+p);
assert(config.manualInvestmentMandate.clientAdvisory?.data==="data/client-advisor.json");
assert(config.manualInvestmentMandate.clientAdvisory?.neverModifyLiveCanonical===true);
assert.equal(feed.marketDataThrough,"2026-10-26","26 Oct completed US session must be dated");
assert(html.includes("Nothing on this page sends orders."));
assert(html.includes("RM13,491"));
// Advisor V3: recommendations must be visibly above the portfolio catalogue.
assert(html.includes('id="decision-brief"') && html.includes('id="ps-decision-grid"'),"Missing first-screen decision desk");
assert(html.indexOf('id="decision-brief"') < html.indexOf('id="advisor"') && html.indexOf('id="advisor"') < html.indexOf('id="investing-now"'),"Assessments must be above the capital and seven-position model");
assert(html.includes('href="#decision-brief"') && html.includes('href="#next-moves"'),"Both quick decision and expanded rationale must be reachable");
assert.equal(feed.quickAssessment.actions.length,4,"Exactly four actionable quick decisions");
assert(feed.quickAssessment.verdict.status==="NO NEW ORDER CLEARED" && feed.quickAssessment.verdict.blocker.includes("not yet reconciled"),"Do not make an executable buy call from unverified broker data");
assert(html.indexOf('id="ps-decision-verdict"')<html.indexOf('id="ps-decision-grid"'),"One-glance verdict must appear above action cards");
assert(html.includes('id="ps-verdict-next"') && html.includes(feed.quickAssessment.verdict.headline.replaceAll("\'","&#39;")),"Decision headline, blocker and next event must render without JS");
assert((html.slice(html.indexOf('id="decision-brief"'),html.indexOf('id="advisor"')).match(/<details class="ps-decision-detail">/g)||[]).length===4,"All four proof requirements should be collapsed by default");
assert(js.includes('ps-verdict-blocker')&&js.includes('ps-decision-detail')&&js.includes('allowedAnchors'),"Client renderer should mirror short-form proof disclosures with safe destinations");
assert(css.includes('.ps-decision-verdict')&&css.includes('.ps-decision-detail summary:focus-visible'),"Compact verdict and disclosure accessibility missing");

assert.deepEqual(feed.quickAssessment.actions.map(x=>x.key),["review","prepare","liquid","wait"]);
assert(feed.quickAssessment.actions.every(x=>x.status && x.title && x.summary && x.next && x.href),"Quick cards require verdict, evidence and detail link");
assert(feed.quickAssessment.mandateAsOf==="23 Oct 2026" && feed.quickAssessment.assessedOn==="27 Oct 2026","Don't misdate inherited recommendations");
assert(feed.quickAssessment.accountWarning.includes("not confirmed available cash"),"Buying power must be marked unverified");
for (const x of feed.quickAssessment.actions) assert(html.includes(x.title),"No-JS first screen must match authored recommendation");
assert(js.includes("function renderQuickAssessment(d)") && js.includes("renderQuickAssessment(d);"),"Feed must update visible quick actions");
assert(css.includes(".ps-decision-grid") && css.includes(".ps-decision-card"),"Quick assessment styling missing");
// Advisor V2: the investment ownership model is still accessible below the decision brief, not an appendix table.
assert(html.includes('id="investing-now"')&&html.includes('id="adv-investment-cards"'),"Missing visual seven-position investment explorer");
assert(html.indexOf('id="investing-now"')<html.indexOf('id="next-moves"'),"What is owned must precede the action queue");
assert(html.indexOf('id="next-moves"')<html.indexOf('id="market-brief"')&&html.indexOf('id="market-brief"')<html.indexOf('id="investment-plan"'),"Actions then macro implications then detailed ledger");
for (const id of ["adv-class-bonds","adv-class-stocks","adv-class-cash","adv-class-bonds-rm","adv-class-stocks-rm","adv-class-cash-rm"]) assert(html.includes('id="'+id+'"'),"Missing asset-class summary "+id);
const sums=(symbols)=>mandate.allocation.filter(a=>symbols.includes(a.symbol)).reduce((tot,a)=>tot+a.allocationPct,0);
assert.equal(sums(["VGIT","TLT","SGOV"]),50);
assert.equal(sums(["CF","RSP","TSM"]),35);
assert.equal(sums(["MYR_CASH"]),15);
assert(js.includes('renderInvestmentOverview(m)')&&js.includes('investmentProfiles')&&js.includes('renderResearch(d)'),"Mandate and market lenses must drive visuals");
assert(js.includes('rows.length!==7')&&js.includes('pct!==100'),"Reject mismatched allocation totals");
assert(js.includes("source:'research/2026-10-14-ai-financing-picks-shovels.md'"),"AI theme must retain source provenance");
assert(js.includes("source:'research/2026-10-22-market-danger-risk-regime-deep-update.md'"),"Oil/inflation theme must retain source provenance");
assert(css.includes('.adv-position-cards')&&css.includes('.adv-class-grid')&&css.includes('#market-brief .adv-insight-grid'),"Investment and market visual component styling missing");
const font=fs.readFileSync("ps-ux.css","utf8");
assert(font.includes('Figtree')&&html.includes('family=Figtree'),"Figtree typography must reach all Power Stack pages");
assert(html.includes('Target allocation, not actual holdings.'),"The target must never be labelled as verified broker ownership");
assert(html.includes('id="adv-account-status"')&&html.includes("Nothing on this page sends orders."),"Investment safety states required");

const deep=feed.deepDecision;
assert.equal(deep.schema,"power-stack-evidence-led-decision/1");
assert.equal(deep.capitalMYR,13491);
assert.equal(deep.newestRegularClose,"2026-10-26");
assert.equal(deep.coverage.state,"PARTIAL");
assert.equal(deep.coverage.eligible,46);
assert.equal(deep.coverage.fullyRead,8);
assert.equal(deep.coverage.unconsumed,38);
assert.deepEqual([deep.cashVerified,deep.positionsVerified,deep.executionsAllowed],[false,false,false]);
assert.equal(deep.changes.length,6);
assert.equal(deep.calls.length,11);
assert(deep.calls.every(x=>x.action&&x.counter&&x.gate&&x.source),"No unsupported one-way security calls");
assert.equal(deep.catalysts.length,7);
assert(deep.catalysts.some(x=>x.id==="tsm-sales"&&x.dateMYT==="2026-11-10"),"TSMC Q3 is already reported; next issuer monthly sales matter");
assert(deep.catalysts.some(x=>x.id==="cf"&&x.status==="ISSUER CONFIRMED"),"CF earnings source verification must survive");
assert(deep.catalysts.some(x=>x.id==="merger"&&x.status==="UNSCHEDULED / EVENT WATCH"),"No invented signed Tesla-SpaceX merger deadline");
assert(deep.changes.some(x=>x.id==="tsla-merger"&&x.actionChanged),"Tesla committee must actually change decision");
assert(deep.changes.some(x=>x.id==="tsmc-q3"&&x.actionChanged),"TSM latest earnings must actually change decision");
assert(deep.quotes.every(x=>x.close==="2026-10-26"&&Number.isFinite(x.usd)),"Quoted prices must share a verified closed session");
assert(html.indexOf('id="decision-brief"')<html.indexOf('id="new-since"')
 &&html.indexOf('id="new-since"')<html.indexOf('id="security-decisions"')
 &&html.indexOf('id="security-decisions"')<html.indexOf('id="catalyst-window"')
 &&html.indexOf('id="catalyst-window"')<html.indexOf('id="advisor"'),"Decision, changes, security comparisons and dates must be ahead of model catalogue");
for(const id of ["ps-evidence-strip","ps-new-items","ps-security-calls","ps-event-cards","ps-extra-changes","ps-more-events"])assert(html.includes('id="'+id+'"'),"Missing progressive-disclosure section "+id);
assert(html.includes("Existing positions — archival")&&html.includes("Seven-position model — not owned"),"Broker actual versus proposal not separated");
assert(html.includes("MacroPulse Gate 8/46 read · PARTIAL"),"Partial Gate coverage warning must survive no-JS");
assert(html.includes('2026-10-27-deep-decision-refresh-plan.md'),"Research plan missing from public source lineage");
for(const q of deep.changes.slice(0,5))assert(html.includes(q.title),"No-JS change story mismatch "+q.id);
for(const c of deep.calls)assert(html.includes(c.symbol),"No-JS company judgement absent "+c.symbol);
for(const c of deep.catalysts)assert(html.includes(c.name),"No-JS catalyst absent "+c.name);
assert(js.includes("function renderDeepDecision(d)")&&js.includes("renderDeepDecision(d);"),"Single client-advisor feed must drive detailed sections");
assert(js.includes("power-stack-evidence-led-decision/1")&&js.includes("state.coverage?.fullyRead"),"Research coverage must stay wired to feed");
assert(css.includes(".ps-truth-duo")&&css.includes(".ps-change-grid")&&css.includes(".ps-event-grid"),"Responsive research/feed styles missing");
assert.equal(mandate.allocation.find(x=>x.symbol==="TSM").status,"CONDITIONAL_ENTRY_RESEARCH");
assert.equal(mandate.allocationSumMYR,13491);
assert.deepEqual(mandate.allocation.map(x=>x.targetMYR),[4047,1889,1619,1214,1349,1349,2024],"No position sizing was silently altered");
assert.deepEqual(feed.firstMoves.map(x=>x.id),["funding","duration","cash"],"Three existing workflows retained");


/* Mockup V2: investment advice belongs above research rows and keeps actual/model isolation. */
assert(html.includes('id="ps-decision-heading"')&&html.includes('id="ps-hero-capital"'),"Previous capital + next-move mockup hero must be retained");
assert(html.includes('id="ps-hero-headline-capital"'),"Hero capital must be source-bound");
assert(html.includes('Your next move.')&&html.includes("YOUR CAPITAL PLAN"),"Editorial decision and separate portfolio snapshot required");
assert(html.indexOf('class="ps-hero-layout"')<html.indexOf('id="ps-decision-grid"'),"High-level verdict and capital must appear before action list");
assert(html.includes('id="ps-hero-quote-list"')&&html.includes('26 Oct US close'),"Source-dated and clearly not-live market snapshot required");
for(const q of ["TSM","TSLA","VGIT"]){assert(html.includes('class="ps-quote-pill"><b>'+q+'</b>'),"Missing dated price pill "+q);}
assert(html.includes('ps-nav-more')&&html.includes('href="holdings.html"')&&html.includes('href="themes.html"'),"Navigation must retain full routes in progressive disclosure");
assert(html.includes('id="ps-verdict-next"')&&html.includes('id="ps-verdict-blocker"'),"All warnings in visible verdict area required");
assert(js.includes("function renderVisualBrief(d)")&&js.includes("renderVisualBrief(d);"),"Client API must bind visual hero to its data feed");
assert(js.includes("x.close===state.newestRegularClose"),"No cross-date quote pills");
assert(css.includes('.ps-hero-layout')&&css.includes('.ps-money-emphasis')&&css.includes('.ps-quote-pill'),"Mockup styling missing");
assert(css.includes('@media(max-width:800px)')&&css.includes('@media(max-width:640px)')&&css.includes('@media(max-width:460px)'),"Responsive layout gates missing");
assert.equal(feed.quickAssessment.headline,"Your RM13,491. Your next move.");
assert.equal(feed.capital.totalMYR,13491);
assert.equal(feed.deepDecision.newestRegularClose,"2026-10-26");
assert.equal(feed.deepDecision.coverage.state,"PARTIAL");
assert.equal(feed.deepDecision.coverage.fullyRead,8);
assert.equal(feed.deepDecision.coverage.eligible,46);


const basketGuide=feed.basketGuidance;
assert.equal(basketGuide.schema,"power-stack-basket-guidance/1");
assert.equal(basketGuide.status,"RESEARCH_COMPARISON_ONLY");
assert.equal(basketGuide.brokerVerified,false);
assert.equal(basketGuide.automaticReallocation,false);
assert.equal(basketGuide.evidenceCutoff,feed.deepDecision.preparedAtMyt);
assert.equal(basketGuide.basketModelsAsOf,"2026-10-26");
assert.equal(basketGuide.choices.length,3);
assert.deepEqual(basketGuide.rankings.map(x=>x.id),["dry-powder","two-catalysts","oil-nitrogen","uranium-repricing"]);
assert(basketGuide.choices[0].summary.includes("50% US Treasury ETFs"),"Baseline must stay independent of model alternatives");
assert(basketGuide.choices[1].summary.includes("65% MYR cash"),"Defensive comparison's true exposures must remain visible");
assert(basketGuide.choices[2].recommendation.includes("None clears a new trade"),"Theme baskets cannot silently become new orders");
assert(html.includes('id="basket-recommendations"') && html.includes('id="ps-home-basket-guides"'),"Homepage basket guidance missing");
assert(html.indexOf('id="ps-decision-grid"')<html.indexOf('id="basket-recommendations"')&&html.indexOf('id="basket-recommendations"')<html.indexOf('id="new-since"'),"Basket recommendations must follow actions, precede deep research");
assert(html.includes('id="ps-basket-next"') && html.includes('baskets.html#basket-dry-powder'),"Basket destination and first practical step absent");
for (const row of basketGuide.choices) assert(html.includes(row.title)&&html.includes(row.action),"No-JS basket recommendation differs from advisory feed");
for (const action of feed.quickAssessment.actions){ assert(html.includes(action.title)&&html.includes('bb-'+action.icon),"Semantic action icon or instruction absent: "+action.key); }
assert(js.includes("function deskIcon(")&&js.includes("function renderBasketGuidance(")&&js.includes("renderBasketGuidance(d);"),"Rendered semantic icons and basket guidance must bind to source feed");
assert(js.includes("'#security-decisions'")&&js.includes("'#catalyst-window'"),"Decision links must reach intended sections rather than generic action queue");
assert(css.includes(".ps-semantic-icon")&&css.includes(".ps-basket-guides"),"Consistent semantic icon and basket styling missing");
assert(basketGuide.riskNotice.includes("mutually exclusive")&&basketGuide.riskNotice.includes("not likely outcomes"),"Portfolio budget and sensitivity caveats must be explicit");

console.log("Advisor V2 UI guard OK: 7 sourced targets, 50/35/15 mix, 5 dated macro lenses, Figtree, no broker/trade claims.");

console.log("Client advisory UI OK: 13491 MYR, 3 next moves, 6 sourced candidates, responsive actions before Dossier, broker status honest.");
