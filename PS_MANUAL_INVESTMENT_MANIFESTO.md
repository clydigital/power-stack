# POWER STACK — MANUAL INVESTMENT UPDATE MANIFESTO
**Version:** 1.0 • **Adopted:** 23 October 2026 (MYT) • **Next one-year reset:** 23 October 2027  
**Primary trigger:** User says “PS update”, “manual PS”, “PS deep sweep”, “what to buy/sell”, “PS bonds”, or “review Rakuten”.  
**Capital mandate:** **RM13,491 total account risk capital**, expressly user-confirmed. **Not RM13,491 of new cash.** All of this is funds the user is willing to risk, not a command to use leverage or to lose it. Prices, quantities and cash allocation still require per-holding broker reconciliation.

> **INVESTMENT INTENT.** Use the next 12 months to turn RM13,491 into more RM through evidence-backed, staged ownership of attractive securities, disciplined selling and capital recycling. **Seek buys and sells, not perpetual WAIT.** Do not force buys when none qualifies. Make money in *MYR after costs and FX*, not by maximizing gross nominal coupon, impressive stock forecasts or the number of open positions. End-cycle decisions must allow the capital to be withdrawn or redeployed for the next one-year cycle.

## 0. What counts as success

- **Horizon:** 23 Oct 2026 → 23 Oct 2027, reviewed monthly; reset next October.
- **Stretch objective:** **+8–12%** net MYR capital appreciation, *not a forecast or promise*: approximately **RM14,570–15,110** before rounding and fees/FX variations. **Benchmark** against (a) comparable MYR T-bill/MGS/cash return, (b) S&P equal-weight and (c) one-year 7–10Y Treasury total return in MYR.
- **Risk checkpoint:** A **−10%** total NAV decline from RM13,491 = approximately **RM12,142** triggers a full re-underwrite and position/concentration reduction review; not a guarantee or automated stop. Track realized+unrealized gains and expenses. No leverage, margin, uncovered options, fragile microcap or unverified warrants as a default.
- **Capital is expendable:** user accepts possibility of total loss; the research process must *still* maximize survivability and minimise unnecessary permanent losses, trading costs, FX friction, and doubled macro bets.
- **Capital arithmetic:** fixed *initial* portfolio capital RM13,491. Subsequent NAV floats; future deposits/withdrawals require explicit user confirmation. All percentages sum to 100% of the currently approved budget, not an extra deposit. Held positions always count.
- **Broker rule:** **no orders are placed by this manifesto or a manual research sweep**. Output is a reviewable, exact-RM intended action sheet with current quote/availability, readiness and limits. Never imply broker connectivity, live cash or receipt unless accessed directly.

## 1. The starting allocation — hypothesis, not locked positions

| Sleeve / candidate | Weight | Target RM | Role / earliest condition |
|---|---:|---:|---|
| Intermediate US Treasury **VGIT** (*IEF is an alternative, not extra*) | 30% | **4,047** | Defensive bond-duration + carry; buy in two staged tranches after rate, duration, FX checks |
| Nitrogen/fertiliser **CF** | 14% | **1,889** | Profitable cyclical cash generator; refresh issuer Q3 Nov4 before final entry |
| S&P 500 equal-weight **RSP** | 12% | **1,619** | Broader profitable US stocks; avoid paying a one-day defensive squeeze |
| **TSM** (US ADR) | 9% | **1,214** | Company earnings-led growth; check refreshed semiconductor breadth/forward valuation |
| Tactical 20+Y Treasury **TLT** | 10% | **1,349** | Optional higher-duration rate opportunity; consider only after long-end yields/real yields confirm |
| Short bill ETF **SGOV** | 10% | **1,349** | USD liquidity; validate eligibility/distribution tax and USD/MYR |
| **MYR cash reserve** | 15% | **2,024** | Emergency investment optionality / cheaper local settlement; not assumed to earn US rates |
| **TOTAL** | **100%** | **13,491** | No independent extra cash allocation |

**Do not mechanically buy all seven.** If CF, TSM, TLT or any fund fails its entry tests, their target RM remains in cash/short bills for a replacement idea. Better fully researched substitutes from other countries/sectors may replace these names at the next manual sweep, with an explicit old/new evidence comparison. Duration TLT and VGIT are **correlated**, not independent hedges. Target allocations are rounded whole RM, with actual order quantities based on prices and rounding/fees.

**Existing actual account:** user confirms **RM13,491 total**. Repository holdings still have older quantity dates (~2 Oct 2026); some estimated equities alone happened to sum to a similar figure **excluding cash and an unverified warrant**, which is NOT broker reconciliation. Therefore target post-rebalance position values are **not** current free buying power. Before any new buy, compute per-ticker **confirmed market value in MYR, current cash, 6742UW actual value, fees, and EUR/GBP/AUD/USD FX exposure**. Never simultaneously count the confirmed RM13,491 account value and the old holdings sum as separate money.

**Current legacy eight holdings to verify:** YTLPOWR, 6742UW, HIBISCS, MISC, DAYANG, XOM, TTWO, TSLA. Proposed *research reviews*, not orders: DAYANG = priority operating-thesis SELL review; TSLA = valuation/TRIM review; YTLPOWR + 6742UW = correlated concentration and warrant terms review; XOM/MISC/HIBISCS = energy overlap; TTWO = catalyst evidence. Retained positions replace the equivalent **RM** of model equity allocation. Position reduction is justified by opportunity cost, damaged cash economics or concentration, not just a loss or gain.

## 2. Immutable division of responsibility

**Discovery → Verification → Market authority → Investment authority → Presentation.**

1. **MacroPulse in Notion** is the timestamped *what changed* discovery log, with oil, inflation, central banks, earnings, US rates, EU debt, AI financing, Asia and physical markets. Search the recent daily Notion page and log; use Pulse IDs and source links, not a rewritten summary as original proof.
2. **Research Gap Gate in Notion** specifies contradictions, missing evidence, falsifiers and research routing. Treat a Gate hypothesis as a question, **not confirmed Story or price catalyst**.
3. **Alchemy Live Market Desk** `clydigital/alchemy-live-market-desk` is the **canonical owner of verified evidence, Story/Regime, Motion, Dossier, publication editions and market interpretation**. Snapshot IDs, dossierId, sourceStatus, asOf, evidence/marketMotion IDs and source age must be retained unchanged.
4. **Blue Desk / Bluebelly** `https://bluebelly-desk.vercel.app/` is the **presentation/read-only view** of Live. Its public Markets, briefs, event calendar and edition-pinned Presenter Prep help identify *which already-admitted* findings matter. Never scrape the UI and claim it is a second independently corroborating analytical authority. Private presenter tech checklist may require authentication and should not be silently bypassed.
5. **Power Stack** `clydigital/power-stack` is the **single owner of portfolio choices** — MYR return, security selection, financial due diligence, allocation, entry, exits, FX and overlap. PS may research issuer fundamentals independently and send a candidate *to* Live research intake only through an authenticated approved route; it may **never** overwrite Live Dossier/Story/Regime or interpret its own market thesis as new independent Live evidence.
6. **Issuer and market data sources** are independent proof behind a PS-specific recommendation. Blue Desk and Live's projection of the *same source* count as **one observation**, not two.

### Working Live and Blue Desk read contracts

- **Preferred Live canonical:** `https://alchemy-live-market-desk.vercel.app/api/market-intelligence-snapshot`. Existing PS snapshot `data/live-desk-canonical.json` is generated by `scripts/sync-live-desk.mjs` and contains `sourceUrl`, `sourceStatus`, `dossierId`, `asOf`, `regime`, `rateRegime`, `monetarySignals`, `sourceHealth`, `contradictions`, `researchGaps`, `lenses`, `assetState`, `stories`, `verification`, `marketMotion` and `syncedAt`. **Read actual latest live payload if accessible; never rename a cached file as fresh.** If Live is degraded/stale, flag it and independently fetch timestamped official measurements.
- **Read-only thematic handoff:** `/api/power-stack-context` on the **Live Market Desk** host; code shows `version:2`, `generatedAt`, `marketUpdatedAt`, `themes[theme,score,confidence,regime,fresh,freshestAt,staleAfterHours,drivers,signals,nextTests]`, `contradictions`, `researchTriggers`, `marketRows` and `marketStates`. Theme scores are explanatory and freshness-gated; stale contexts have **zero upgrade power**.
- **Other approved read-only projections:** `/api/presenter-calendar` (future macro/earnings dates), `/api/presenter-horizon` (frozen published event horizon), `/api/hybrid-feed-v2?edition=<id>` (edition pinned; exact ID, not current webpage approximation), `/api/market-intelligence-snapshot`. The public Bluebelly hostname may not expose every backend endpoint; retry canonical Live or repo snapshot and **log any 401/403/404**. Private `/api/presenter/technical-checks` requires owner auth and is an optional manual trade-chart checklist, not a public financial observation.
- **Reader constraints:** preserve `asOf`, `observedAt`, `publishedAt`, `editionId`, `dossierId`, `sourceUrl`, `verified/reported/unresolved/stale` and separate **market price time** from **publication time**. Log mismatched Dossiers / edition ages as errors, not conclusions.

## 3. When the user pings “PS update” — mandatory ordered sweep

**This is an on-demand workflow.** Do the research **in the current turn**; do not promise future work or create scheduled jobs. **No new automation**, and retain the existing PowerSweep **12 investigation maximum**. A large manual deep sweep can partition the evidence, but record what actually ran versus what remained unswept.

### Pass 0 — Establish real money and freshness (first, not last)

Fetch PS `data/holdings-fundamentals.json`, `data/portfolio-management.json`, `data/decision-refresh-2026-10-23.json`, `data/bond-watch.json`, `data/watchlist.json`, `data/market-summary.json`, `data/live-desk-canonical.json` and `data/power-sweep-latest.json`. Declare timestamps of the latest *provider quote*, *issuer reporting period*, *cash/account confirmation* and *macro Dossier edition*. **RM13,491 user-confirmed total NAV is current mandate, but not proof all eight broker quantities are current.** When prices are stale or market closed, use last completed close explicitly and mark orders not executable.

First output the **actual current portfolio allocation, available cash and concentration** if verified; otherwise output a **provisional model plus reconciliation gap**. The unverified `6742UW` must not be assigned a fabricated price/strike/expiry. CTVA pre/post-spin levels cannot be compared without corporate actions.

### Pass 1 — What changed in macro? Not just a giant news dump

1. Read **latest MacroPulse daily page + Log** and **the latest morning/evening Research Gap** (newest first). Extract novel catalysts, false positives, unresolved observations and time windows.
2. Read **Live canonical Dossier/regime** with source health, changed Story/Motion IDs, rateRegime and contradictions. Compare new `asOf`/dossierId to last PS snapshot. A headline published after old `asOf` requires a new admitted edition before replacing a canonical narrative.
3. Read **Blue Desk Markets/Presenter Prep** for projection of verified cross-asset moves and *technical checklist*, not for new underlying facts. Only authenticated checklists may be accessed; failing private access is not evidence that checks passed.
4. Research primary **US 2Y/5Y/10Y/20Y/30Y nominal and real yields**, 2s30s, 10Y breakeven, Fed-funds path, US IG/HY OAS, 5Y CDS for vulnerable AI debt, US dollar **DXY** versus **yen index JXY**, USDJPY, oil Brent/WTI, ULSD cracks/diesel and **LNG** cargoes/insurance/Hormuz, gold/silver/copper and inventories, equity breadth **RSP vs SPY**, **SMH vs QQQ**, sovereign spreads **France OAT vs Bund**, UK gilt, Japan JGB, Australia and NZ rate paths, Malaysian MGS and USD/MYR. Date and synchronize where possible.
5. Interpret **the disagreement**: Treasury rally during tech selloff can mean flight to quality, not disinflation; high commodity margin can be a peak-cycle trap; high OAT 5% can mean French fiscal stress, not free income.

### Pass 2 — Earnings and the actual company, including new companies

For **all held securities + currently active PS investable shortlist + the strongest new discoveries**, get: latest issuer earnings **publication date/period**, revenue, GAAP margins, CFO, capex, **FCF**, net debt, maturing debt, interest expense, valuation **same-currency/same-listing**, capital returns, outlook vs actual and upcoming dated events. Include costs and capex sensitivity. Separate recurring cash from working capital and acquisitions; don't substitute EBITDA for free cash. Validate pre-/post-split/spinoff share counts and ADR FX. Compare with relevant peers and previous thesis. **Never infer that a company is inexpensive because its price fell or its latest profit margin was huge.**

Screen beyond current tech/mining bias: fertiliser/agriculture, power/grid equipment, integrated energy, defensives, industrial software, healthcare, quality Asian earnings and local Malaysian companies, cash-management and global sovereigns. **At least one genuine non-AI alternative should be considered** when a normal full sweep runs. An already-held business and a fresh idea compete for the *same capital*.

### Pass 3 — Bond decision is first-class, not a footnote

Compare **SGOV, VGIT/IEF, TLT, TIP** and direct eligible Treasury bills/notes vs domestic **MYR MGS** at the **same date**. Compare UK gilts, Germany Bund, France OAT, Italy BTP, AU IAF/VGB, NZ NGB, Japan JGB, China/India/Korea/Singapore/ASEAN yields when material. Output **actual ETF issuer SEC yield date**, YTM vs distribution yield, effective duration, 50bp/100bp mark-to-market shock, fees, bid/ask/liquidity, USD/MYR or AUD/GBP/EUR/NZD/MYR FX exposure and potential net MYR returns. Do not confuse a **5% nominal foreign coupon** with a guaranteed 5% MYR return. Separate a **bond held to maturity** from a rolling bond **ETF**. French spread risk must not be treated as risk-free carry.

### Pass 4 — Transcripts: ideas, not evidence

Use ONLY the fixed standing **Tier 1 StockedUp, Wall Street Truth Bombs / Mark Malek, FXEvolution** and **Tier 2 TraderNick**, plus creator add-ons only on explicit manual request. **Never include Lucid Trading.** Locate **dated original video/podcast URLs** and transcripts via YouTube native first, then accessible alternative transcription/source, then Firecrawl/Exa when normal methods fail. Record **upload time, content retrieval success, direct claim, trade hypothesis, independent falsification and issuer/market check**. Creator prediction never adds numeric score, company profit, Treasury sales volume or BUY readiness until corroborated. Do not recycle Oct15 speech as “new today”. Prioritize highest-value latest material within the existing ~15/day, max 18 discipline; no new scheduled creator scrape.

### Pass 5 — Discover and decide: decisive when warranted

For each candidate answer in THIS ORDER: **What changed? → What does it own/earn? → What is priced in? → Why now? → Strongest contrary fact? → Expected positive path and adverse scenario? → Buy/Hold/Trim/Sell/Wait/Pass → Intended RM amount → First/second entry and sell conditions → Next exact event.**

- **BUY (research candidate)** requires time-matched/dated price, issuer economics or fund issuer statistics, credible valuation after FX/fees, an identifiable fundamental or yield catalyst and a tolerable downside scenario. **BUY STARTER** if thesis is good but timing remains noisy; add only on new proof. Do not declare new buys ready to execute without broker eligibility and live quotes.
- **HOLD** if current ownership still beats the next-best alternative on prospective after-cost return.
- **TRIM/SELL** when earnings/credit deterioration, persistent concentration, negative expected payoff or better-funded alternatives make opportunity cost decisive. Never recommend a sale solely because past P/L is negative, nor hold solely because past gain is positive.
- **WAIT** must specify the *one missing gate*, source owner and dated recheck. If nothing passes, no forced buy. **PASS** is legitimate when normalized cash economics or issuer debt destroy risk/reward.
- Portfolio exposure: 35% starting equity budget and 40% combined **VGIT+TLT** rate duration budget, not 40% independent hedges; 15% MYR reserve. The 10% long duration is **optional**, return it to cash when its thesis fails. Every proposed addition is financed by a reduction in a current security or genuinely available cash. State which.
- Risk guardrail: **−10% total NAV** calls an immediate full review, *not automatic liquidation or a guaranteed stop*. For company-specific issuer deterioration, sell/trim can be recommended before that threshold. No market orders without authorization; no implied risk-free 5% yield.
- No arbitrary 20-minute waiting, background running or future result promise. A bounded manual sweep can be partial but must state which parts are unverified.

### Pass 6 — Write, check, show

1. Reconcile number of securities analyzed, **why at least one new candidate was rejected**, and source timestamps; avoid repeating old headlines and upgrading stale ideas.
2. **Source of truth**: never mutate `data/live-desk-canonical.json` manually, overwrite `data/power-sweep-latest.json` with a made-up current regime or raise the 12-slot investigations cap. Sync with existing generator only when its API can be independently verified. Avoid damaging `data/ideas.json` (full 120 library ideas) and 46-row watchlist ranks/scores.
3. Save an **additive dated decision ledger** (with `asOf`, `sourceIds`, `period`, `ticker`, `lastClose`, `currency`, `issuerActuals`, `bullCase`, `bearCase`, `valuation`, `action`, `targetMYR`, `currentMYR`, `deltaMYR`, `entryStages`, `exitRule`, `nextDate`, `confidence`, `executionReady:false`) and a concise update memo. Carry forward unresolved requests with reason, not assumed resolution.
4. Update user-facing `data/market-summary.json`, portfolio action metadata and bond-watch **only when source date improves**; archive superseded calculations. The static homepage market summary must agree with JSON and contract tests.
5. **Run/review validation**: JSON parse; targets sum to mandate; no invented score; issuer date <= current date; same FX; no unauthorized positions/order edits; portfolio eight holdings remain; 46 scored watchlist unchanged unless evidence-backed explicit revisions; 120 research ideas not deleted; CI actions and Pages deployment observed. If regression fails, repair or report honestly.
6. Return a short visible digest: **WHAT CHANGED / BUY (ranked + RM) / SELL or TRIM (finances new buys) / HOLD / WAIT because / NEXT CATALYST / WHAT'S UNVERIFIED / write links**. A deep manual request adds analysis, scenario matrix and source links. Do not bury the user in tool/status narratives.

## 4. Plugin / evidence sourcing playbook

Connectors are **tools and data**, not alternate owners of PS or Live truth. Discover connected tool availability each run; no tool should be assumed authorised merely because code exists.

| Priority | Plugin / app | Pull exactly this | Backstop / verification |
|---|---|---|---|
| **P0 authority** | **GitHub** | `clydigital/power-stack` holdings, dated decision boards, validator and `clydigital/alchemy-live-market-desk` canonical route implementation; source hash/time | If Live runtime down, snapshot is **stale fallback** not live confirmation |
| **P0 discovery** | **Notion** | Latest MacroPulse daily+Log, Research Gap AM/PM, AI Infrastructure Capex & Bubble 16-company tracker, creator research ledger, evidence dates/IDs | Check official source URLs; Notion notes never equal original filing |
| **P0 canonical market** | **Live Desk read APIs** | `market-intelligence-snapshot`, `power-stack-context`, `presenter-calendar`, published editions + event horizons, sourceHealth/asOf/IDs | Live only, do not use Blue UI as independent corroboration |
| **P0 projection** | **Blue Desk** | Markets story/motion reaction, presenter verified event context, technical note only if authorised | Map each item back to canonical ID or mark `PROJECTION_ONLY` |
| **P1 pricing** | **Finnhub**, **Alpha Vantage**, official venues and `web` | Timestamped closes, full company identifiers and 52-week prices; FX spot; sovereign rates/FRED/Treasury and source units | Provider can mismatch ADR quotes vs local primary exchange metrics; no phantom live close |
| **P1 fundamental** | **FactIQ**, **FMP** where entitlement works, issuer SEC/IR, **Quartr** for earnings docs/transcripts | Filings and actual financial statement lines, consensus separately, surprises, debt maturities, capex, owner FCF | FMP paid `quote` previously denied; fallback Finnhub/issuer. Quartr may need paid level; log denied rather than invent |
| **P1 equity analysis** | **Public Equity Investing** skills | Earnings deep-dive, financials-normalizer, comps, idea generation, scenario sensitivity, portfolio risk, catalyst/thesis | Methodology tools do not mint primary data or act as execution authority |
| **P2 source discovery** | **Exa**, `web`, **Firecrawl** (fallback), **Opera/Browser** if connected, creator original pages | Locate newest media, full transcript/dated URL, specialist source when normal public URLs blocked | Captions may be incomplete; quotes timestamped; hypothesis-only |
| **P2 underlying backend** | **Supabase** only authorized scoped read; **Composio** only supported explicit workflows | Evidence ID status and synced handoff when official Live endpoints lack evidence; Notion/Drive dispatch *only if configured* | Never query/update private Live tables blindly or duplicate canonical Story/Regime |
| **P2 research** | **Quartr**, company presentations, central bank/BIS/IMF, government statistics | Management tone, capital-cost risk, sovereign auction/balance data, revisions, policy decision text | Primary confirmation trumps podcasts, headlines and vendor score |

**Always attempt the lightest valid primary source first.** If an app is disconnected or subscription-gated, use the publicly available issuer/official page and clearly state the gap. Never recommend adding a paid feed solely to complete one manual run.

## 5. Running triggers

- **“PS update”** → Standard manual diff. Latest regime, whole portfolio risk, held names + selected discoveries, ranked BUY/SELL/WAIT, exact RM portfolio target and next event; GitHub update/read-back. Focus on **new evidence since last snapshot**.
- **“PS deep sweep” / “sweep everything”** → Partition US/equities, rates/FX/global sovereigns, Asia/China/Japan, oil/LNG/metals, AI financing/earnings, creator transcripts and portfolio. Return one reconciled decision; explicitly mark incomplete sectors; same caps/authority.
- **“PS action” / “what do I buy now?”** → Fast trade-readiness on best **two** buys and best **two** recycle/sell candidates, quote timestamps, sized RM, funding path, execution blockers and sell conditions. If no ready quote, give order-preparation conditions, never fictional fills.
- **“PS bonds”** → Compare VGIT/IEF/TLT/SGOV versus 3–10Y MGS, plus 5% UK/AU/NZ/France/German/Japan rates if material; net MYR duration + FX stresses and central-bank dates.
- **“PS results”** → One-year ledger in MYR: initial NAV, current NAV, contributions/withdrawals, realised gains, unrealised gains, distributions, fees, tax, FX, running high, max drawdown, benchmark. No invented performance.
- **“PS reset”** → At 23 October 2027, review actual outcomes and regenerate a fresh one-year plan from final capital. Do not mechanically buy back last year's winners.

## 6. Data lineage, source links and failure behavior

**Canonical primary runtime** [Live Market Desk](https://alchemy-live-market-desk.vercel.app/) and [Blue Desk read-only](https://bluebelly-desk.vercel.app/); [PS web](https://clydigital.github.io/power-stack/).  
**Notion sources:** [MacroPulse](https://app.notion.com/p/3ea519b67a948161ba4dec8f97ebf658), [MacroPulse Log](https://app.notion.com/p/851feb425fe24a6abee0458f21d6c755), [Research Gap Gate](https://app.notion.com/p/3ea519b67a9481f9aa03d9767069487e), [AI Infrastructure 16-company tracker](https://app.notion.com/p/3f4519b67a9481639302eee63384c180), [Creator Intelligence 15 Oct source ledger](https://app.notion.com/p/3f9519b67a94810e9a84cf07edd61689).

**Important:** Current latest Live PS cached snapshot has **sourceStatus `degraded_latest` and asOf `2026-10-22T15:05:32.495Z`**; a subsequent generator run does not automatically make its underlying regime later. In its old regime headline, Meta “holds up,” although its equity sold off at the actual 22 Oct US close. **Do not use stale canonical conclusions as contemporaneous tape**. Ask Live source to refresh through its approved workflow; independently verify session close and market reaction for PS until then.

**Effective mandate:** user-confirmed `capitalMYR = 13491` (2026-10-23). No unknown broker fill, unscheduled investment automation or public Blue Desk endpoint can override that. To change it, receive an explicit new user instruction and archive superseded mandate versions.
