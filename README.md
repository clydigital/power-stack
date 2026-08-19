# Power Stack

A searchable, versioned investment-research vault for nuclear, AI infrastructure, grid/electrical equipment, uranium/fuel, oil & gas, robotics, water/cooling, agriculture, healthcare, metals and adjacent ideas across the US, Hong Kong/China and Malaysia.

## Data model

- `data/ideas.json` is the canonical long-term research database.
- `data/macro-context.json` is the active Power Stack Pulse snapshot.
- `data/ism-macro-snapshot.json` stores the deeper official-ISM analytical snapshot used as one input to macro interpretation.
- Category research files add specialised research without replacing `ideas.json`.
- `data/live-context.json` is retained only as historical/dormant integration data and is not read by the Power Stack frontend.

## Macro Pulse v2

The active Pulse reads a reviewed snapshot of `https://macro-indicators-a3d.pages.dev/#econ_calendar` and applies it through **stock-specific macro fingerprints**.

The source dashboard is treated as a data/visualization layer, not as an investment signal. Its deployed HTML was inspected directly. Generic chart MoM/YoY uses `(current - comparison) / abs(comparison) * 100`, and generic positive/negative colors reflect numeric direction only. Power Stack therefore preserves raw arithmetic first and interprets it separately.

Active data files:

- `data/macro-context.json` — current directional macro channels, evidence, confidence and freshness.
- `data/macro-sensitivities.json` — slow-moving stock fingerprints with fundamental and market sensitivity, weights and confidence.
- `data/macro-methodology.json` — verified source semantics and interpretation guardrails.

The engine separates, among other things:

- raw CPI/PCE index changes from inflation momentum and policy implications;
- basis-point yield changes from generic percentage changes in yield levels;
- broad credit availability from CCC/weak-end credit stress;
- crude tightness from refined-product tightness/crack spreads and US gas tightness;
- already-transformed rate series from level series, avoiding recursive percent-change artifacts.

### Stock scoring

For factor `i`:

`contribution_i = (channelScore_i / 2) × ((0.65 × fundamentalSensitivity_i + 0.35 × marketSensitivity_i) / 5) × factorWeight_i × factorConfidence_i × profileConfidence × channelConfidence × freshnessWeight_i`

The stock's Macro adjustment is the sum of fresh contributions and is capped at **±1.00**. Base Conviction is never overwritten. If a stock has no researched fingerprint, or the macro packet is stale, its macro adjustment is zero.

Theme bars are now summaries of the **average stock-level macro adjustment inside the theme**, not a theme score copied into every stock.

## Live Desk status

The former Live Desk → Power Stack pulse is **deactivated**. The historical `data/live-context.json` file and disabled workflow stub are retained so the integration can be restored later without rebuilding it, but Live Desk data currently has zero influence on rankings, cards, detail views or macro-adjusted conviction.

## Hosting

GitHub Pages publishes from `main`.
