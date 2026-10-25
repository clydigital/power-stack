# Market iconography: Power Stack ↔ Alchemy Hybrid

Adopted: 26 October 2026. Design-only integration, not an investment signal or market-data dependency.

## Source

This project's `assets/market-iconography/sprite.svg` is a verbatim local copy of the first-party, 40-symbol market icon set maintained in:

`clydigital/alchemy-live-market-desk/public/market-iconography/sprite.svg`

It mirrors the `MarketIcon.tsx` usage contract in that repository: 24px viewBox, stroke-based glyphs, text accompaniment for comprehension, decorative SVG `aria-hidden`, and no downloaded icon fonts or external icon-service dependency.

The copied asset stays within Power Stack's own static deployment. It **does not** query, read or mutate the Live Desk's current Dossier, Regime, Story, Motion or evidence stores.

## Icon information hierarchy

| Concept | Glyph examples | Where used |
|---|---|---|
| Source / research quality | evidence, source, research | Research Library detail, Themes evidence, Holdings proof |
| Rate / financing transmission | rates, bond, curve, credit, transmission | Capital Scarcity, rate screens, contextual research |
| Supply / industry | oil, energy, chip, factory, gold, ai, global | Individual equities, Themes, catalysts |
| Decision conditions | risk, shield, catalyst, watch, check | Holdings risk rules, Watchlist statuses, basket failure tests |
| Comparing hypotheses | compare, divergence, chart, layers | Basket scenarios, Holdings divergences, themes |

Colours describe reading purpose only: cyan = contextual transmission, sage = source/defensive concept, amber = action checkpoint, muted red = risk/contradiction. **An icon must never assert a trade occurred or imply evidence has been verified.**

`ps-market-icons.js` is a read-only progressive enhancement. It identifies visible labels and adds glyphs to navigation, cards and dynamic elements after asynchronous rendering. Idempotency uses `data-ps-market-icon`, and a bounded MutationObserver listens for card rerenders. Market levels, actual returns, scores, orders and portfolio allocations are untouched.

## QA

`node --check ps-market-icons.js`

`node scripts/check-market-iconography.mjs`

Existing repository page-level HTML/JS, source-boundary, investor-mandate and decision-desk CI remain mandatory.

Only decorative SVG assets and code are copied; no font files, owner-private Live data, credential content or market screenshots are bundled.
