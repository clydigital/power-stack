# Power Stack V2 — UX implementation brief (27 October 2026)

**Planning document only.** This change does not build, deploy or revise investment advice, company scoring, broker holdings or canonical Live Desk authority. Companion detailed brief and clickable concept were prepared for review in ChatGPT.

## Product outcome

Make Power Stack answer five investor questions without switching through disconnected reports: (1) what needs a decision now, (2) what changed since the last accepted decision, (3) how much *verified* money is available, (4) which next-best alternative competes for that money, and (5) which evidence would invalidate the thesis.

Do not turn research hypotheses into automatic BUY labels or treat an updated JSON wrapper as a fresh underlying quote.

## One navigation system

| Section | Purpose | Existing content migrated |
|---|---|---|
| **Desk** | Three ranked decisions, changed evidence, catalyst list and integrity notice | index/advisor client desk |
| **Portfolio** | Verified actual account versus hypothetical model, holdings and factor exposure | holdings; portfolio overlays |
| **Opportunities** | Shortlist, comparisons, watchlist and full idea universe | watchlist; action playbook; research-library catalogue |
| **Research** | Company thesis, conflicting evidence, themes, Live-linked market motion and historical archive | themes; market motion; archive; rate context |
| **Strategy** | Basket comparisons, after-fee/FX scenario lab, mandate and private journal | baskets; capital-scarcity; mandate |

**Navigation rule:** one shared desktop rail / mobile five-item bottom nav. The header shows context, search, freshness and utilities, not a second row of coloured CTA pills. Contextual sub-tabs are allowed only inside their section. Keep old permalinks functioning.

## Prototype design specification

### Desktop first screen

- Header: Desk, precise research age, quick search.
- Left 2/3: max 3 decision tickets, in attention order, each with verb + ticker + thesis + strongest counterargument + funding gate + next required evidence.
- Right 1/3: capital integrity card clearly distinguishing confirmed mandate from unknown cash and stale quantities; next two catalyst dates.
- Below first fold: material change ledger, portfolio concentration flags, complete archived context.
- Avoid a giant decorative hero and broad market article ahead of decisions.

### Mobile first screen

- Top shows page title and current-status notice; first decision appears immediately.
- Five-section bottom nav with labels and 44px+ touch targets; no wraparound menu of large buttons.
- Decision drawer becomes a mobile full-screen sheet. Research lists collapse into descriptive, accessible cards.
- No horizontal viewport overflow at 320/390px.

### Component states

- `MoneyValue`: VERIFIED_ACCOUNT / MODEL_TARGET / DATED_MARKET / UNKNOWN.
- `DecisionTicket`: REVIEW / CONDITIONAL / WAIT / RESEARCH_CANDIDATE / PASS / RECONCILE.
- `Evidence`: ISSUER_OFFICIAL / INDEPENDENT_MARKET / CANONICAL_LIVE / NOTION_SYNTHESIS / HYPOTHESIS.
- Dates shown independently for market close, company financials, macro edition and account reconciliation.
- Missing/unmatched instrument or quote means CHECK REQUIRED, not a green actionable card.

## Key journeys

1. **Catalyst → decision:** MacroPulse/issuer release -> source validity -> affected company -> what changed from previous accepted thesis -> proof/counterproof -> action gate -> optional risk/funding.
2. **Candidate → possible buy:** new idea -> compare against cash and existing holdings -> current same-listing valuation -> FX/fees -> downside -> buying power -> non-executable broker checklist.
3. **Held stock → potential trim:** company deterioration -> actual concentration -> competing capital return -> new facts -> conditional size recommendation -> human review.
4. **Old thesis → research history:** enter company -> what we believed -> incremental evidence -> contradictions -> current position -> original sources.

## Architecture / privacy

Start as read-only views over existing `data/client-advisor.json`, `data/rakuten-one-year-mandate.json`, `data/watchlist.json`, `data/holding-tape.json`, `data/portfolio-live-overlay.json`, `data/power-sweep-latest.json` and issuer research. Share an explicit `DecisionTicket` data contract; do not mix score with action permission. Live Desk is the canonical macro authority; Blue Desk is a projection, not a competing source.

The public GitHub Pages repo must **never** hold confidential brokerage imports, credentials, fills or current personal account balances. A proof-of-concept may use ephemeral, no-upload browser inputs. Actual saved account data require a separate authenticated private service.

## Implementation slices and quality gates

**P0 — reusable shell & trust system:** One navigation, tokens, body text >=14px, metadata >=12px, consistent focus/keyboard states; verify 1440/1280/1024/768/390/320 widths. No existing page link lost.

**P1 — Decision Desk V2:** Three priority tickets + evidence/funding state + changed-research ledger; no action labelled funded if buying power unknown; ticket drawer has countercase, source and next gate.

**P2 — Portfolio & Opportunity comparison:** distinguish Actual vs Model; compare any candidate to a holding/cash under one capital pool, including fees, FX and risk. All account-sensitive persistence remains private.

**P3 — Research discovery:** Search before lengthy market panels; honest scope labels (catalogue versus indexed full-text versus external Notion); stable historical links and evidence timeline.

**P4 — Strategy & journal:** transparent assumptions and stress scenarios, net MYR performance only after broker reconciliation; private journal for actual records.

Acceptance across phases: zero invented live/broker values; ticker detail consistent from every route; accessible keyboard/dialog flows; one-row nav; no pseudo-freshness; screenshot validation on desktop and mobile before any production merge. Leave underlying investment research and canonical Live Desk unchanged.

## Release gate

This spec is *planning*; the clickable HTML concept in the accompanying ChatGPT response uses example historic research and does not connect to broker or production data. Review the interaction model before replacing the existing public pages. Implement in small PRs, validate rendered screenshots (not only static source assertions), and provide rollback for the shared shell independently of research JSON.

## Visual redesign review (27 October 2026)

A revised standalone, offline HTML design target has been produced as **Power_Stack_V2_Visual_Navigation_Prototype.html** in the ChatGPT deliverables. This is not merged production code and uses illustrative archived research from the 23 October mandate.

Changes over the original wireframe: icons + labels for five navigation sections; tablet icon rail and mobile labelled bottom navigation; keyboard search/jump (Ctrl/Cmd+K or /); a three-ticket decision board with consistent source/countercase detail drawers; capital verification vs model allocation explicitly separated; a seven-segment 100% model donut, not a fake current-account chart; up-to-three-candidate qualitative comparison; search-first sample research and visual causal chain; sliders for a duration/FX *example*, showing assumptions and exclusions.

Review acceptance: 320/390/620/768/1024/1280/1440px without horizontal overflow; all five routes, keyboard navigation, decision drawers, sample research filtering, comparison toggles and scenario reset checked in headless Chromium with no JavaScript exceptions. Real account persistence, live quotes, full archive search and trade actions are excluded. See ChatGPT's downloadable visual prototype, preview images and review notes.

The next code PR should implement the shared shell and decision ticket before changing production investment cards. Production launch requires a separate screenshot and accessibility review, and all sensitive brokerage details must remain outside GitHub Pages.

## MacroPulse / Bluebelly / PowerSweep integration audit (27 October 2026)

**Required upstream order:** Notion MacroPulse discovery (full daily post + Log, source IDs and timestamps) → Notion Research Gap/Gate (contradictions and unresolved evidence) → Alchemy Live Desk (independently admitted evidence, published Dossier, canonical Regime/Story/Motion) → Blue Desk / Bluebelly (read-only explanation, Markets and permitted Presenter Prep) → Power Stack (issuer verification, portfolio exposure, allocation and conditional recommendations).

**What the current repository actually does:** `.github/workflows/sync-live-desk.yml` runs every six hours at minute 17, fetches `/api/market-intelligence-snapshot` through `scripts/sync-live-desk.mjs`, builds the portfolio overlay, and generates `data/power-sweep-latest.json`. `.github/workflows/sync-holding-tape.yml` also rebuilds the overlay and sweep. `scripts/generate-power-sweep.mjs` reads `data/live-desk-canonical.json`, `data/portfolio-live-overlay.json`, `data/holding-tape.json`, and local company/watchlist/theme/portfolio JSON files. **It does not directly fetch Notion MacroPulse, Research Gap pages or Bluebelly.** The result is an automatic *canonical Live-fed triage queue*, **not** proof that the latest complete MacroPulse or Gate has been reconciled into an actionable recommendation.

**Manual-sweep contract already requires all three:** `PS_MANUAL_INVESTMENT_MANIFESTO.md` Pass 1 requires latest full MacroPulse + Log, latest Research Gap, canonical Live Dossier and Blue Desk presentation. `data/research-sweep-config.json` also describes these inputs. This requirement must survive the V2 presentation redesign.

**Required V2 implementation without another scheduled job or extra macro brain:**
1. Keep the existing six-hour PowerSweep generator, 12 external-investigation cap and read-only canonical Live input.
2. In a *manual PS update*, read and reference the latest full Notion Pulse and Gate, and inspect Bluebelly's permitted presentation view; preserve Notion page IDs, original times, Live dossierId/asOf, evidence IDs and Bluebelly projection provenance.
3. Add a **source coverage / freshness row** to advisor briefing outputs: MacroPulse full-post checked at, Research Gap checked at, Live Dossier asOf and health, Bluebelly edition viewed at, company/quote times. Show **NOT_CHECKED**, **STALE**, **ACCESS_DENIED** or **CURRENT** individually, never a collective fresh check based on the generator timestamp.
4. For automatic ingestion, first verify a scoped, authenticated upstream transport of *approved* Notion/Gate source references into the existing Live research process or a controlled Power Stack handoff. Reuse an existing schedule, not a new one. **Do not claim this integration exists until end-to-end source ID readbacks pass.** The ChatGPT-side Composio/Notion connector is not a Vercel runtime secret; the Bluebelly editorial handoff documentation specifically says its production backend is not configured.
5. Never double-count Live and Bluebelly as two independent confirmations; Bluebelly is a projection. Bluebelly-derived editorial content is distinct from canonical verified evidence.
6. When the latest Pulse is newer than the cached Live Dossier, report the unadmitted catalyst separately as pending verification, not as a changed canonical Regime/Story or an automatic BUY.

**Presentation copy:** retire `recycle capital`. Write `Review whether to keep, reduce or sell DAYANG` with concrete proceeds and alternative purchase only after account/cash verification. No automatic order permission.

**Gate before claiming 'full PS sweep updated':** source coverage row filled, latest Pulse and Gate checked by original source URL + timestamp, Live snapshot and Blue Desk edition matched, new issuer claims corroborated, decisions and cash conditions dated. Otherwise title the output a *Live-fed triage refresh / partial research*.
