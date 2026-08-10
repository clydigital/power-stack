# Power Stack

A searchable, versioned investment-research vault for nuclear, AI infrastructure, grid/electrical equipment, uranium/fuel, oil & gas, metals and adjacent ideas across the US, Hong Kong/China and Malaysia.

## Data model

- `data/ideas.json` is the canonical long-term research database.
- `data/live-context.json` is a read-only snapshot from the Alchemy Live Market Desk.
- The browser also attempts a live fetch from `https://alchemy-live-market-desk.vercel.app/api/power-stack-context` and falls back to the snapshot if unavailable.

## One-way Live Desk link

The Live Desk exposes a sanitized **GET-only** endpoint. Power Stack never writes to the Live Desk. The feed contains aggregate market/theme context, contradictions and research triggers only; it does not expose credentials, transcript text, private research-run metadata or mutation routes.

A scheduled GitHub Action refreshes the snapshot after the Live Desk research slots. This keeps Power Stack usable when the Live Desk is temporarily unavailable and creates an auditable Git history of context changes.

## Scoring

`conviction` is the durable research score. The Live Desk overlay is deliberately capped so short-term conditions can sway context without rewriting the thesis:

`context conviction = base conviction + theme score × (theme dependency / 5) × 0.5`

The maximum adjustment is ±1.0 point. Version 2 of the feed also exposes public-safe component signals. Power Stack shows each signal’s individual contribution, source/timestamp and any contradiction/research trigger. Stale packets or stale theme inputs apply **zero** adjustment.

## Hosting

GitHub Pages publishes from `main`.


## Context transparency

For each idea, Power Stack now keeps **Base Conviction** separate from **Context-Adjusted Conviction**. Each contributing Live Desk signal is scaled by the idea’s `themeDependency`, listed in the detail view, and summed to the capped context delta. Contradictions and research triggers are displayed as watch items but do not directly change conviction.
