# Power Stack

A searchable, versioned investment-research vault for nuclear, AI infrastructure, grid/electrical equipment, uranium/fuel, oil & gas, robotics, water/cooling, agriculture, healthcare, metals and adjacent ideas across the US, Hong Kong/China and Malaysia.

## Data model

- `data/ideas.json` is the canonical long-term research database.
- `data/macro-context.json` is the active Power Stack Pulse snapshot.
- `data/ism-macro-snapshot.json` stores the deeper official-ISM analytical snapshot used as one input to macro interpretation.
- Category research files add specialised research without replacing `ideas.json`.
- `data/live-context.json` is retained only as historical/dormant integration data and is not read by the Power Stack frontend.

## Macro Pulse

The active Pulse is based on a reviewed scan of `https://macro-indicators-a3d.pages.dev/#econ_calendar`, with particular attention to ISM, inflation, labour, rates, credit, consumer, housing, energy and positioning.

The browser does **not** scrape the dashboard and does **not** invent a macro score from raw releases. ChatGPT/research updates interpret the data first and write a structured snapshot to `data/macro-context.json`. This keeps the site deterministic and makes the reasoning auditable in Git history.

The snapshot has two layers:

1. **Macro regime blocks** — Growth, Inflation, Labour, Rates, Credit, Consumer, Housing, Energy and Positioning.
2. **Theme transmission** — the interpreted effect on AI/Data Centres, Power/Grid, Nuclear, Uranium/Fuel, Oil & Gas, Metals, Robotics/Automation, Water/Cooling, Agriculture/Food Systems and Healthcare/Metabolic.

## Scoring

`conviction` remains the durable research score. Macro context is a separate overlay:

`macro-adjusted conviction = base conviction + sum(theme macro contributions × macroSensitivity)`

- The total macro adjustment is capped at **±1.00**.
- If an idea does not yet have a researched `macroSensitivity`, the frontend uses **1.00×**.
- A stale macro packet applies **zero** adjustment.
- Macro context never rewrites Base Conviction.

## Live Desk status

The former Live Desk → Power Stack pulse is **deactivated**. The historical `data/live-context.json` file and disabled workflow stub are retained so the integration can be restored later without rebuilding it, but Live Desk data currently has zero influence on rankings, cards, detail views or macro-adjusted conviction.

## Hosting

GitHub Pages publishes from `main`.
