# Power Stack

A searchable, versioned investment-research vault for nuclear, AI infrastructure, grid/electrical equipment, uranium/fuel, oil & gas, robotics, water/cooling, agriculture, healthcare, metals and adjacent ideas across the US, Hong Kong/China and Malaysia.

## Data model

- `data/ideas.json` is the canonical long-term research database.
- `data/macro-context.json` is the active Power Stack Pulse snapshot.
- `data/ism-macro-snapshot.json` stores the deeper official-ISM analytical snapshot used as one input to macro interpretation.
- `data/holdings-fundamentals.json` is the canonical current-holdings fundamentals ledger.
- `data/watchlist.json` is the live price/action queue.\n- `data/rate-resilience-overlay-2026-09-25.json` is the current 10Y hurdle-rate overlay. It owns the fresh-US research/action ranking and regime-specific entry gates while leaving company fundamental scores company-evidence owned.
- `data/research-sweep-config.json` is the PowerSweep process contract. Live Desk is loaded first as canonical macro/market state; PowerSweep then spends a bounded research budget only on portfolio divergences, company-specific evidence, actionable watchlist names, portfolio-relevant themes and a capped China/HK adjunct.
- `data/power-sweep-latest.json` is the deterministic current PowerSweep queue. It records input health, capped holding/watchlist/theme/China investigations, monitor-only holdings, hidden concentration, research gaps and explicit no-change rules.
- `data/research-sweep-latest.json` is the compatibility/index pointer to the current PowerSweep plan and its canonical inputs.
- Dated `data/cranium-rates-sweep-YYYY-MM-DD.json` files are research overlays that preserve Cranium-driven hypotheses, regional rate regimes and stock-level rate sensitivities without overwriting Base Conviction or company fundamentals.
- Category and intraday research files add specialised research without replacing the long-term database.
- `data/live-desk-canonical.json` is the active read-only Live Desk cross-check: canonical regime, lenses, six-asset state when available, Stock Radar and creator-verification status.
- `data/live-context.json` is retained only as historical integration data and is not used for current scoring.

### Cranium ingestion guardrail

The Market Research Cranium is a **research seed, synthesis layer and source-URL registry**, not direct canonical evidence. Daily research should preserve its `[FACT]`, `[SELL-SIDE VIEW]`, `[CRANIUM SYNTHESIS]`, `[WATCH]` and `[INVALIDATION]` distinctions. Material factual claims must be independently verified before they can alter `macro-context.json`, a fundamental score or a Live rating export. Sell-side disagreements should remain attributed disagreements rather than being averaged into a false consensus.

The rate sweep is explicitly jurisdictional. US sensitivity separates Fed expectations from 2Y/10Y/30Y yields, real yields, breakevens, long-end/term-premium pressure, volatility, credit and Treasury operations. China/Hong Kong sensitivity separately tracks LPRs, China government yields, PBOC/liquidity conditions, CNY/CNH, credit demand, bank margins, recapitalisation/fiscal support and whether liquidity actually transmits into private-sector capex and consumption. Low China yields are not automatically treated as bullish easing when they coexist with weak credit demand.

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

PowerSweep must never send a Live-derived macro overlay back to Live as independent confirmation.
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

The monetary overlay is **separate from Base Conviction**. It may change research priority, portfolio-risk flags, required evidence and action queues, but it does not mechanically add or subtract from the fundamentals score. Company scores change only on company-level evidence.\n\nThe Sep 25 rate-resilience layer makes the U.S. 10Y an explicit admission gate for fresh capital. The current research question is: **can the company beat a ~5.2% risk-free hurdle without multiple expansion?** The overlay is surfaced on Watchlist and Capital Scarcity and is stored separately so a macro rerank cannot silently rewrite the fundamental ledger.

`data/macro-context.json` and the older sensitivity files remain historical/internal analytical inputs during migration. They are not a second canonical macro state and are not exported back to Live as confirmation.

## Live Desk exchange contracts

### Live → Power Stack

`data/live-desk-canonical.json` is the read-only downstream snapshot. It is refreshed from Live and may include the Dossier regime, deterministic monetary/rates state, contradictions, source health, research gaps, asset state and research-priority signals.

Power Stack interprets that state against holdings, candidates and portfolio concentration. It does not rewrite Live's market conclusion.

### Power Stack → Live

`data/live-fundamentals-snapshot.json` uses contract `power-stack-fundamentals/v1`.

It contains **independent Power Stack company research only**: Base Conviction, thesis, catalysts, risks, status and slow-moving quality characteristics. It deliberately excludes:

- Live-derived monetary or regime signals;
- macro adjustments;
- adjusted scores;
- industry macro-risk scores.

Regenerate and validate it after changing the referenced company-research source:

```bash
node scripts/generate-live-fundamentals-snapshot.mjs
node scripts/generate-live-fundamentals-snapshot.mjs --check
```

The older `data/live-rating-snapshot.json` / `power-stack-rating-snapshot/v1` path is legacy migration material only. Live must not use it once the fundamentals contract is deployed because its macro adjustment would create a Live → PS → Live feedback loop.

## Live Desk status

Live Desk is the canonical macro/market-state owner and Power Stack is an active downstream consumer. Power Stack retains ownership of company fundamentals, portfolio construction, ranking discipline and entry decisions.

## Hosting

GitHub Pages publishes from `main`.
