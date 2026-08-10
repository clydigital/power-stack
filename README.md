# Power Stack

A searchable cross-market investment research vault for nuclear, AI infrastructure, grid/electrical equipment, uranium/fuel, oil & gas, metals and adjacent themes across US, Hong Kong/China and Malaysia.

## Architecture

- `index.html` — static shell
- `styles.css` — design system
- `app.js` — search, filters, sorting and detail modal
- `data/ideas.json` — **source of truth** for all research entries
- `data/changelog.json` — research update history

The intended workflow is ChatGPT → GitHub `data/ideas.json` → GitHub Pages.

Do not store secrets or API keys in this repository. It is public.
