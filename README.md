# Power Stack

A searchable, versioned investment-research vault for nuclear, AI infrastructure, grid/electrical equipment, uranium/fuel, oil & gas, robotics, water/cooling, agriculture, healthcare, metals and adjacent ideas across the US, Hong Kong/China and Malaysia.

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

## Optional chat lenses

[Rates and capital sensitivity](docs/rates-and-capital-sensitivity.md) is an on-demand Power Stack chat reference. It is disabled by design: it does not run during refreshes, alter any data or scores, create a task, or block publication. Invoke it only in chat for a specific asset or causal question.

## Hosting

GitHub Pages publishes from `main`.
