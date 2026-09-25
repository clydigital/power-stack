# Power Stack

A searchable, versioned investment-research vault for nuclear, AI infrastructure, grid/electrical equipment, uranium/fuel, oil & gas, robotics, water/cooling, agriculture, healthcare, metals and adjacent ideas across the US, Hong Kong/China and Malaysia.

## Data model

- `data/ideas.json` is the canonical long-term research database.
- `data/macro-context.json` is the active Power Stack Pulse snapshot.
- `data/ism-macro-snapshot.json` stores the deeper official-ISM analytical snapshot used as one input to macro interpretation.
- `data/holdings-fundamentals.json` is the canonical current-holdings fundamentals ledger.
- `data/watchlist.json` is the live price/action queue.
- `data/research-sweep-config.json` is the recurring research-process contract. It requires the current Market Research Cranium to be read first as a research seed/source registry, followed by independent verification, a global macro sweep, separate US and China/Hong Kong rate sweeps, every current holding, the full canonical watchlist and a China-focused tracked-idea adjunct.
- Dated `data/cranium-rates-sweep-YYYY-MM-DD.json` files are research overlays that preserve Cranium-driven hypotheses, regional rate regimes and stock-level rate sensitivities without overwriting Base Conviction or company fundamentals.
- Category and intraday research files add specialised research without replacing the long-term database.
- `data/live-desk-canonical.json` is the active read-only Live Desk cross-check: canonical regime, lenses, six-asset state when available, Stock Radar and creator-verification status.
- `data/live-context.json` is retained only as historical integration data and is not used for current scoring.

### Cranium ingestion guardrail

The Market Research Cranium is a **research seed, synthesis layer and source-URL registry**, not direct canonical evidence. Daily research should preserve its `[FACT]`, `[SELL-SIDE VIEW]`, `[CRANIUM SYNTHESIS]`, `[WATCH]` and `[INVALIDATION]` distinctions. Material factual claims must be independently verified before they can alter `macro-context.json`, a fundamental score or a Live rating export. Sell-side disagreements should remain attributed disagreements rather than being averaged into a false consensus.

The rate sweep is explicitly jurisdictional. US sensitivity separates Fed expectations from 2Y/10Y/30Y yields, real yields, breakevens, long-end/term-premium pressure, volatility, credit and Treasury operations. China/Hong Kong sensitivity separately tracks LPRs, China government yields, PBOC/liquidity conditions, CNY/CNH, credit demand, bank margins, recapitalisation/fiscal support and whether liquidity actually transmits into private-sector capex and consumption. Low China yields are not automatically treated as bullish easing when they coexist with weak credit demand.

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

The monetary overlay is **separate from Base Conviction**. It may change research priority, portfolio-risk flags, required evidence and action queues, but it does not mechanically add or subtract from the fundamentals score. Company scores change only on company-level evidence.

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
