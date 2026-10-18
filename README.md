# Power Stack

## 18 October 2026 — AI regime and portfolio trade review (research only)

The [18 October source-dated portfolio decision review](research/2026-10-18-ai-regime-portfolio-trade-review.md) and [machine-readable decision overlay](data/portfolio-decision-review-2026-10-18.json) reconcile the existing 16/16 current Notion AI-capex company trackers, Friday 16 October US/Malaysia share closes, the eight recorded holdings and seven conditional trade candidates. The first capital-recycling reviews are **DAYANG** (support/operating thesis broken), **YTLPOWR** (large verified MY common-equity concentration, former support broken), the **unverified warrant**, and **TSLA** (21 October binary earnings risk). Research priorities are **CF, ETN and BWXT** first; **GRAB, TSM and MU** require stronger specific confirmation. This does **not** overwrite company scores, positions, ranks, canonical Dossier or live trade permissions.

**Data-quality blocker:** the 6-hour Yahoo holding-tape sync still carries 24-25 September closes after failed fetches. Some displayed tape-versus-regime `CONFIRMS / DIVERGES` statuses are stale and must not be treated as October trade evidence. This separate research-only snapshot contains source-dated 16 October observations while the automated freshness/quote path is repaired. All prices and review gates require checking at the next trading session.


## 15 October 2026 — Full-spectrum portfolio sweep (research only)

The [15 Oct cross-asset research report](research/2026-10-15-power-stack-full-spectrum-sweep.md) and [full-coverage triage ledger](data/full-spectrum-triage-2026-10-15.json) reconcile latest MacroPulse, 15 Oct reviewed creator-video hypotheses and independent sector sources across picks-and-shovels, agriculture, refined energy, LNG, nuclear, renewables and bonds. All eight holdings, 46 scored watchlist names and 56 historical idea rows have triage dispositions; seven additional sector names are explicitly **unscored**. The proposed active-radar archive is **not deletion, a sale or a reranking**. Current scores, buckets, holding quantities, prior company evidence, existing canonical Live authority and all executable action gates remain unchanged; mostly September quotes are stale and new additions require current pricing and issuer due diligence.

A searchable, versioned investment-research vault for nuclear, AI infrastructure, grid/electrical equipment, uranium/fuel, oil & gas, robotics, water/cooling, agriculture, healthcare, metals and adjacent ideas across the US, Hong Kong/China and Malaysia.

## Decision instructions on stock cards — 14 October 2026

The [action playbook](data/stock-action-playbook.json) adds a **plain-language next decision** for every current holding (8), every scored watchlist security (46), and the three unrated adjacent focus ideas. This is a presentation and review overlay, not a new stock-scoring system. It uses the existing [post-CPI 54-security review](data/cpi-2026-10-14-security-overlay.json), unchanged holding/stock fundamentals and each watchlist item's existing **entry / confirmation / invalidation**.

- For holdings, read **DO NOW** first; open **CONSIDER ADDING ONLY IF** and **REVIEW REDUCING / EXIT IF** for separate evidence-based gates.
- For watchlist/focus stocks, read **DO NOW**, **ENTRY / PRICE GATE**, **COMPANY PROOF REQUIRED** and **STAND ASIDE / REVIEW IF**. The CPI follow-up is shown separately from company fundamentals.
- The highest-priority risk reviews currently include the instrument-level YTL-linked warrant (verify strike/expiry/terms) and DAYANG's weak operating proof. **Risk review is not an automatic sell order.**
- The current as-of date is 14 October 2026, **not an observation that those shares traded at the archived quote today**. No position size, score, rank, watchlist bucket, rating or source has changed; the trade gate remains blocked pending a current quote, valuation and issuer evidence.

Run `node scripts/check-stock-action-playbook.mjs` to validate complete coverage, action taxonomy, stale-price guardrails and identical canonical source values.

## 14 October CPI · 54-security investment review

The [official September US CPI](https://www.bls.gov/news.release/archives/cpi_10142026.htm) was released 14 October 2026 at 20:30 Malaysia time. The [dated 8-holding + 46-watchlist post-CPI decision review](research/2026-10-14-post-cpi-54-security-review.md) and [read-only machine-ledger](data/cpi-2026-10-14-security-overlay.json) document **energy vs core-service effects, initial 2Y/10Y and futures reactions, and each security's rate/energy/customer-funding transmission and issuer proof gates**. The latest Power Stack market summary has been updated for the event.

CPI-specific labels are **separate** from original bullish/bearish stock thesis and action tabs. They imply no trade and **do not edit stock scores, buckets, rankings, holding quantities or security actions**. Current event prices, complete Treasury and real-yield curves, live credit and TSMC final earnings are not independently verified at this event time. Read the linked BLS and Notion MacroPulse for official CPI detail; the existing Research Gap Gate precedes CPI.

## Stock-state colours (14 October 2026)

The previous visual-only `spectrum.css` site-wide redesign was reverted. The original dark theme, typography, backgrounds and navigation are retained. Only `stock-states.css` and `stock-states.js` add purpose-specific **stock thesis** and **action** colours on the Personal Desk, Holdings, Watchlist and Research Library. Themes, Motion and Capital Scarcity retain their original page styling.

- **Green (bullish thesis):** stored `CONFIRMED` holdings or `buy`-bucket priority research; not a live BUY action.
- **Red (bearish/high risk):** stored `BREAKING` holdings, high-risk `avoid` research, or recorded restrictions such as DO NOT AVERAGE DOWN.
- **Amber (caution):** diverging/price-led holdings, NO CHASE/NO ADD and WAIT/RETEST entry decisions.
- **Purple (conditional):** selective entry study; not an active position or implied purchase.
- **Grey/blue (unconfirmed or unrated):** incomplete evidence, unscored research or warrant-term verification.

Two separate pills prevent thesis and action being conflated. Interactive state filters select from stored classifications only and never generate a fresh market signal. Full valuation/entry evidence and current quotes are still needed before capital is added; prices in the archived research may be stale. No scores, rankings, positions, data contracts or canonical Live Desk state were changed by this UI work.


## 14 October — Live Desk research reuse and TSMC catalyst

The source-linked `data/ai-catalyst-gates.json` powers the homepage TSMC earnings checkpoint (15 October, 14:00 MYT) without changing any security score. Its five checks distinguish margins, AI orders, cash capex, customer financing and price/rate reaction. Results are **not** recorded before the issuer publishes them.

The companion `research/2026-10-14-live-ps-capability-routing.md` inventories reusable Live API contracts, documented provider adapters and analyst plugin/skill workflows. It explicitly avoids duplicate MacroPulse, Story/Regime reasoning, API credentials, Market Motion feeds or recurring PS research schedules. Missing credit/breadth and stale quote inputs block investment conclusions rather than becoming assumed confirmations.

## Personal Investment Desk — 14 October 2026

`index.html` is now the minimal personal investment home. Its goal is to make decisions easy **without hiding or diluting research**:

- **Holdings first:** all eight recorded positions remain in `data/holdings-fundamentals.json`, with actual price-as-of dates. The desk foregrounds risky/stale positions, not falsely executable quotes.
- **Only eight focus companies:** `data/personal-decision-desk.json` is the curated decision layer. Five existing scored research names are shown alongside three explicitly **unscored** AI-adjacent research candidates (Vertiv, Xylem, GE HealthCare). A research card is not a BUY order.
- **Archive, don't delete:** the former full index is preserved at `research-library.html`; the complete 46-stock watchlist, 56-ish idea universe, risk overlays, deep theme history and existing score components remain available. Dropping a candidate from the *front page* does not rewrite its prior thesis.
- **Three decision questions:** what do I own; what are the few opportunities; what evidence would change my decision? Each research idea has a reason, proof required and an explicit risk.
- **Provenance:** Live Desk remains the single owner of regime and promoted Motion, including source degradation. MacroPulse, Research Gap/Gate, creator transcripts and the Notion AI-capex hub provide research leads; company scores and action gates change only on independent company-level evidence.
- **Chat sweeps:** after a material company change, refresh the decision desk only when necessary; keep all other stock history. `data/research-sweep-config.json.personalDecisionDesk` records intake rules and boundaries, while `node scripts/check-personal-decision-desk.mjs` validates the front page.
- **Research evidence:** `research/2026-10-12-ai-adjacent-and-healthcare.md` has issuer sources and explicit valuation gaps for cooling, power, water and healthcare.
- **14 October financing/market overlay:** `research/2026-10-14-ai-financing-picks-shovels.md` adds the 13 October completed US close, Nvidia/Oracle concentration tests, actual customer cash versus contracted spend, picks-and-shovels lanes (GEV/ETN/ANET/CSCO/MU/NVDA), conditional risk paths and named next proof points. Theme, watchlist, portfolio, decision-desk and dated market-summary entries link back to it; no company score or holding quantity was changed.

The old process/automation integrations still use the same canonical `data/live-desk-canonical.json`, `data/ideas.json`, `data/watchlist.json`, and `data/holdings-fundamentals.json` files. The visible eight-company shortlist is not a replacement for PowerSweep's 12-investigation research limit. Never feed Live-derived macro conclusions back into Live as company evidence.

## Data model

- `data/ideas.json` is the canonical long-term research database.
- `data/macro-context.json` is retained as historical/internal research material only. Active macro/regime state comes from `data/live-desk-canonical.json`.
- `data/ism-macro-snapshot.json` stores the deeper official-ISM analytical snapshot used as one input to macro interpretation.
- `data/holdings-fundamentals.json` is the canonical current-holdings fundamentals ledger.
- `data/watchlist.json` is the live price/action queue.
- `data/market-motion.json` is a legacy Power Stack discovery snapshot retained only for internal audit comparison against Live Motion. It is not rendered and never enters active portfolio research priority.
- `data/rate-resilience-overlay-2026-09-25.json` is the current 10Y hurdle-rate overlay. It owns the fresh-US research/action ranking and regime-specific entry gates while leaving company company-evidence components company-evidence owned.
- `data/research-sweep-config.json` is the PowerSweep process contract. Live Desk is loaded first as canonical macro/market state; PowerSweep then spends a bounded research budget only on portfolio divergences, company-specific evidence, actionable watchlist names, portfolio-relevant themes and a capped China/HK adjunct.
- `data/power-sweep-latest.json` is the deterministic current PowerSweep queue. It records input health, capped holding/watchlist/theme/China investigations, monitor-only holdings, hidden concentration, research gaps and explicit no-change rules.
- `data/research-sweep-latest.json` is the compatibility/index pointer to the current PowerSweep plan and its canonical inputs.
- Dated `data/cranium-rates-sweep-YYYY-MM-DD.json` files are research overlays that preserve Cranium-driven hypotheses, regional rate regimes and stock-level rate sensitivities without overwriting Research Score or company fundamentals.
- Category and intraday research files add specialised research without replacing the long-term database.
- `data/live-desk-canonical.json` is the active read-only Live Desk cross-check: canonical regime, lenses, asset state, Stock Radar, creator-verification status and up to 18 immutable promoted Market Motion items.
- `data/macro-sensitivities.json` plus its supplement are active **exposure maps** for holdings/candidates. They describe causal sensitivity but never add to or subtract from Research Score.
- `data/live-context.json` is retained only as historical integration data and is not used by the active decision path.

### Cranium ingestion guardrail

The Market Research Cranium is a **research seed, synthesis layer and source-URL registry**, not direct canonical evidence. Daily research should preserve its `[FACT]`, `[SELL-SIDE VIEW]`, `[CRANIUM SYNTHESIS]`, `[WATCH]` and `[INVALIDATION]` distinctions. Material factual claims must be independently verified before they can alter a Power Stack company-evidence component, action gate or portfolio conclusion. Cranium synthesis must not rewrite Live's canonical macro/regime state. Sell-side disagreements should remain attributed disagreements rather than being averaged into a false consensus.

The rate sweep is explicitly jurisdictional. US sensitivity separates Fed expectations from 2Y/10Y/30Y yields, real yields, breakevens, long-end/term-premium pressure, volatility, credit and Treasury operations. China/Hong Kong sensitivity separately tracks LPRs, China government yields, PBOC/liquidity conditions, CNY/CNH, credit demand, bank margins, recapitalisation/fiscal support and whether liquidity actually transmits into private-sector capex and consumption. Low China yields are not automatically treated as bullish easing when they coexist with weak credit demand.

## Market Motion

Market Motion is the fast story layer between raw news and durable Power Stack research. It scans fresh stock-specific, sector and geopolitical developments, then forces each item into a simple chain:

`headline → why it is interesting → big-picture bridge → portfolio/theme link → next test`

Active Market Motion now comes from Live's immutable edition in `data/live-desk-canonical.json`, using the same 48-hour contract and an 18-item pathological-feed ceiling. Exact ticker-linked Live Motion may raise bounded research priority, but it cannot change Research Score, a company-evidence component, ranking, sizing or an action gate without independent company-level evidence.

`data/market-motion.json` is retained only as an internal audit comparator. `scripts/generate-motion-shadow.mjs` writes `data/motion-shadow.json`, which measures exact-source/headline overlap, Live-only coverage and Power-Stack-only residuals. Neither file is rendered on the normal Market Motion surface, and neither may substitute for missing or stale Live Motion.

## PowerSweep

PowerSweep is the recurring **portfolio research and decision engine**. It is not a second macro brain.

Its order is:

1. validate Live canonical state, portfolio exposure and completed-session holding tape;
2. promote only decision-relevant divergences or data gaps;
3. research a capped number of holdings and watchlist candidates;
4. investigate only portfolio-relevant themes and China/HK names;
5. emit explicit CHANGE, NO_CHANGE or RESEARCH_GAP outcomes;
6. write back only Power Stack-owned company, portfolio, watchlist and theme conclusions.

The default hard cap is **12 external investigations per sweep**: up to 3 holding deep-dives, 4 watchlist deep-dives, 3 theme deep-dives and a capped China/HK adjunct. Confirming tape is normally monitor-only. UNKNOWN / UNRESOLVED remains a valid result.

PowerSweep must never send a Live-derived market overlay back to Live as independent confirmation.
## Live-owned macro context

Power Stack no longer runs a competing dashboard-first macro brain. Its canonical market/regime context comes from the read-only Live Desk snapshot in `data/live-desk-canonical.json`.

Live owns acquisition, source health, monetary signals, cross-asset confirmation/contradiction and regime interpretation. The intended canonical upstream stack is official or verified data such as FRED, New York Fed, Treasury and Live's existing verified adapters. Daily Investment Brief and MacroMicro are not primary or fallback machine sources for Power Stack; at most they may be opened manually as non-canonical reading.

If the Live snapshot is unavailable or stale, Power Stack records the gap. It must not silently recreate the regime by scraping a third-party dashboard.

### Portfolio overlay

Power Stack consumes Live context to answer portfolio-specific questions:

- which holdings depend on low rates, strong growth, persistent inflation, easy funding, China demand or high energy prices;
- whether those assumptions are confirmed, contradicted or unresolved;
- where several holdings express the same hidden macro exposure;
- which thesis, valuation, funding or entry conditions require review.

The monetary overlay is **separate from Research Score**. It may change research priority, portfolio-risk flags, required evidence and action queues, but it does not mechanically add or subtract from the company-evidence score. Company scores change only on company-level evidence.

The Sep 25 rate-resilience layer makes the U.S. 10Y an explicit admission gate for fresh capital. The current research question is: **can the company beat a ~5.2% risk-free hurdle without multiple expansion?** The overlay is surfaced on Watchlist and Capital Scarcity and is stored separately so a macro rerank cannot silently rewrite the fundamental ledger.

`data/macro-context.json` remains historical/internal analytical material. The sensitivity-profile files remain active only as exposure maps. Neither constitutes a second canonical macro state, and no Live-derived macro adjustment is exported back to Live as confirmation.

## Live Desk exchange contracts

### Live → Power Stack

`data/live-desk-canonical.json` is the read-only downstream snapshot. It is refreshed from Live and may include the Dossier regime, deterministic monetary/rates state, contradictions, source health, research gaps, asset state, research-priority signals and the bounded promoted Market Motion frozen into the current immutable Live edition.

Power Stack interprets that state against holdings, candidates and portfolio concentration. Exact ticker-linked promoted Motion can move a name into the existing capped research queue, but it cannot itself alter fundamentals, ranking, sizing or conviction. Legacy Power Stack Motion is audit-only and evaluated through `data/motion-shadow.json`; it is not rendered and cannot substitute for missing or stale Live Motion. Power Stack does not rewrite Live's market conclusion.

### Power Stack → Live

`data/live-fundamentals-snapshot.json` uses contract `power-stack-fundamentals/v1`.

It contains **independent Power Stack company research only**: Research Score, thesis, catalysts, risks, status and slow-moving quality characteristics. It deliberately excludes:

- Live-derived monetary or regime signals;
- macro adjustments;
- adjusted scores;
- industry macro-risk scores.

Regenerate and validate it after changing the referenced company-research source:

```bash
node scripts/generate-live-fundamentals-snapshot.mjs
node scripts/generate-live-fundamentals-snapshot.mjs --check
```

The legacy macro-adjusted rating export has been retired. `power-stack-fundamentals/v1` is the only supported Power Stack → Live company-research contract, preventing a Live → Power Stack → Live macro feedback loop.

## Live Desk status

Live Desk is the canonical macro/market-state owner and Power Stack is an active downstream consumer. Power Stack retains ownership of company fundamentals, portfolio construction, ranking discipline and entry decisions.

## Hosting

GitHub Pages publishes from `main`.
