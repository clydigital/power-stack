# Power Stack

A searchable, versioned investment-research vault for nuclear, AI infrastructure, grid/electrical equipment, uranium/fuel, oil & gas, robotics, water/cooling, agriculture, healthcare, metals and adjacent ideas across the US, Hong Kong/China and Malaysia.

## Data model

- `data/ideas.json` is the canonical long-term research database.
- `data/macro-context.json` is the active Power Stack Pulse snapshot.
- `data/ism-macro-snapshot.json` stores the deeper official-ISM analytical snapshot used as one input to macro interpretation.
- `data/holdings-fundamentals.json` is the canonical current-holdings fundamentals ledger.
- `data/watchlist.json` is the live price/action queue.
- Category and intraday research files add specialised research without replacing the long-term database.
- `data/live-context.json` is retained only as historical/dormant integration data and is not read by the Power Stack frontend.

## Macro Pulse v4

The active Pulse now uses the **Daily Investment Brief Macroeconomic Dashboard** as its primary dashboard layer:

`https://dailyinvestmentbrief.com/macroeconomic-dashboard/`

Missing or inaccessible readings are supplemented with **MacroMicro**:

`https://en.macromicro.me/`

Official releases, company filings and authoritative market data remain the verification layer. The Daily Investment Brief dashboard currently renders some live readings client-side; when an automated research pass receives placeholders such as `Analyzing...` or `--`, Power Stack does **not** infer a value. It falls back to MacroMicro and authoritative sources instead.

The source dashboards are treated as data/visualisation layers, not investment signals. Creator videos, social posts, block-trade claims and technical commentary are also hypothesis generators only. They receive zero direct score weight until independently verified.

Active data files:

- `data/macro-context.json` — current directional macro channels, evidence, confidence and freshness.
- `data/macro-sensitivities.json` — slow-moving stock fingerprints with fundamental and market sensitivity, weights and confidence.
- `data/macro-methodology.json` — verified source semantics and interpretation guardrails.
- `data/creator-view-overlay-2026-09-01.json` — current audit of user-supplied creator views and their verification status.
- `data/intraday-research-2026-09-01.json` — current intraday research state and implementation record.

The engine separates, among other things:

- nominal yields, real yields, breakeven inflation and term-premium pressure;
- broad credit availability from CCC/weak-end credit stress;
- crude tightness from refined-product tightness/crack spreads and US gas/global LNG conditions;
- end-food demand from farmer input elasticity;
- AI demand from financing quality, dilution and cash conversion;
- social/creator flow observations from verified macro/fundamental evidence.

### Stock scoring

For factor `i`:

`contribution_i = (channelScore_i / 2) × ((0.65 × fundamentalSensitivity_i + 0.35 × marketSensitivity_i) / 5) × factorWeight_i × factorConfidence_i × profileConfidence × channelConfidence × freshnessWeight_i`

The stock's Macro adjustment is the sum of fresh contributions and is capped at **±1.00**. Base Conviction is never overwritten. If a stock has no researched fingerprint, or the macro packet is stale, its macro adjustment is zero.

Theme bars are summaries of the **average stock-level macro adjustment inside the theme**, not a theme score copied into every stock.

## Live Desk status

The former Live Desk → Power Stack pulse is **deactivated**. The historical `data/live-context.json` file and disabled workflow stub are retained so the integration can be restored later without rebuilding it, but Live Desk data currently has zero influence on rankings, cards, detail views or macro-adjusted conviction.

## Hosting

GitHub Pages publishes from `main`.
