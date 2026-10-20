# 20 October 2026 | Power Stack portfolio decision reconciliation

**Decision posture: RESEARCH ONLY / NOT ORDER-READY.** This is an append-only update to [18 October's review](./2026-10-18-ai-regime-portfolio-trade-review.md), not a replacement. The machine-readable [20 October review](../data/portfolio-decision-review-2026-10-20.json) retains all eight holdings and seven conditional new-capital candidates.

**Market date:** Monday 19 October 2026 completed sessions; data retrieved/committed 20 October MYT. US market was not yet closed for 20 October. [Power Stack price tape](../data/holding-tape.json) uses unofficial source-timestamped Yahoo daily bars; new-capital candidate USD closes were independently read via Finnhub /quote. Neither is an executable bid/ask.

**Canonical Live Dossier:** `cf977394-ca7c-49da-93cc-4f3da98d873b`, as of 19 October 20:12:21 UTC; source state `degraded_latest`, Regime `MIXED_TRANSITION`. Power Stack owns company and capital decisions, not a parallel Regime calculation. Source: [Live canonical snapshot](../data/live-desk-canonical.json).

## 1. Decision ledger: what changed

| Asset | 19 Oct close | Single-session | Company thesis | Security / capital decision |
|---|---:|---:|---|---|
| DAYANG | RM1.30 | -1.52% | Impaired operating conversion | **First reduce/exit research review**; no averaging down, no automatic sale |
| YTLPOWR | RM5.26 | +2.14% | Q4 recovered QoQ, FY profit still lower YoY | **Partial-trim research review**; broker weight and funded-capex evidence required |
| 6742UW | Unverified | — | Instrument mapping absent | **Hard hold on additional exposure** until actual broker/ISIN/issuer terms linked |
| TSLA | $368.06 | +3.76% | Q3 volumes known, margins/FCF not yet reported | **21 October earnings risk review**; no pre-earnings automatic regrade |
| HIBISCS | RM2.31 | +0.87% | Q4 FY26 reported profit stronger YoY | **Hold/no add**, verify realised prices and field-level cash flow |
| MISC | RM8.35 | -4.68% | Shipping contracts versus Yinson funding complexity | **Hold/monitor**, don't extrapolate 16 Oct spike |
| TTWO | $204.92 | -0.18% | Franchise catalyst remains but booking proof needed | **Hold/no add**, inherited $210 then $216–217 gates |
| XOM | $178.28 | -0.39% | Integrated oil/refining cash | **Core hold/no chase**, measure total energy allocation |

Source dates matter: these are **19 October prices**, not proof that the investment thesis changed that day. The portfolio overlay flags TSLA, YTLPOWR and HIBISCS as macro-price divergences. A divergence is a research question rather than a causal or trading signal. The PowerSweep's three holding deep dives therefore remain capped and deterministic; DAYANG is an additional **capital-allocation priority outside the capped market-movement queue**.

### DAYANG — earnings decline is substantive

The issuer's [Q2 2026 report](https://dayang.listedcompany.com/news.html/id/2625162) gives revenue RM161.177m versus RM267.349m YoY (-39.7%) and attributable profit RM32.841m versus RM76.642m (-57.2%). Management reported weaker conversion of topside maintenance work orders; this is a company issue, not simply a weak day of crude oil trading.

At RM1.30, the inherited RM1.42 support/review line remains broken. The decisive next test is an issuer-backed change in orders, utilisation and cash conversion, followed by credible chart repair through RM1.42 and RM1.50–1.52. Broker quantity, mandate loss budget, sale liquidity and fees have not been confirmed. Status: **REDUCE_EXIT_REVIEW, not a sale instruction**.

### YTLPOWR — improving quarter, unresolved concentration

The [YTL Power Q4 FY2026 release](https://www.ytlpowerinternational.com/press-releases/ytl-powers-4th-quarter-revenue-rises-24-to-rm6-3-billion-profit-after-tax-grows-38-to-rm471-million/) records RM6.325bn revenue (+24% QoQ) and RM471.3m profit after tax (+38% QoQ). However, FY2026 profit after tax was RM1.760bn, down from RM2.672bn in FY2025. A stronger latest quarter does not prove the longer-term cash return on data-centre investments.

The price recovered to RM5.26 but remains just below the inherited RM5.27–5.40 technical repair zone, and below the old RM5.65–5.70 support. At the 2 October *recorded* quantities, YTLPOWR is RM5,260 of RM8,925 in four Malaysian ordinary equity positions (**58.94%**). This is **not** the weight of the full portfolio: no current broker account, warrant value, FX, cash or US holdings are included.

The next decision needs a verified all-currency weight and a chosen concentration limit, followed by actual contracted power load, customer funding terms, project capex and distributable cash flow. Status: **PARTIAL_TRIM_REVIEW**; do not automatically trim because a price has recovered.

### The YTL warrant: issuer series found; broker code remains unlinked

The issuer has published [ordinary 2025/2028 warrant terms](https://www.ytlpowerinternational.com/warrantsexercise/): 3 June 2025 issue, 2 June 2028 maturity, initial RM2.45 exercise price and 1:1 ordinary share conversion. **No authoritative identity bridge has been found from these terms to the recorded broker-style code `6742UW`.** Bursa has multiple YTL Power structured instruments with different terms. The discovered issuer series is therefore a candidate reference **only**, not a property of the owned warrant.

Required: broker contract note, ISIN, Bursa short name, issuer, warrant class, transaction history, current quote and actual expiry/conversion terms. No intrinsic value, time decay, delta or position size should be inferred until that mapping is made. Status: **VERIFY_BEFORE_ACTION**.

### TSLA — earnings supersede Monday's rebound

[Tesla's 2 October release](https://ir.tesla.com/press-release/tesla-third-quarter-2026-production-deliveries-and-deployments) reported 486,532 Q3 deliveries and 13.7 GWh of energy-storage deployments. Actual Q3 financial results are scheduled **after the Wednesday 21 October US close**. The $368.06 Monday close is within the prior $363–371 repair area but not proof of auto gross-margin or operating cash strength.

Next check: automotive gross margin excluding credits, energy-storage margin, capex, FCF, forward pricing and financing. A portfolio-risk decision before a binary event requires an actual loss-budget limit and position reconciliation. Status: **EARNINGS_RISK_TRIM_REVIEW**, no automatic trade.

### HIBISCS — period improvement is real; ongoing economics unproven

The [Bursa announcement for Q4 FY2026](https://www.klsescreener.com/v2/announcements/view/11656867) records RM846.462m revenue versus RM629.510m and RM190.716m profit versus RM74.606m a year earlier. Monday's RM2.31 (+0.87%) slightly crosses the lower end of the inherited RM2.30–2.35 zone but does not establish future netbacks, production or free cash flow.

Track realised oil/gas pricing, quarterly lifted/offtake volumes, field costs, debt/cash and the energy cluster with XOM, MISC and DAYANG. Status: **HOLD_NO_ADD**.

## 2. Conditional new capital: prices updated, gates unchanged

| Candidate | 19 Oct USD close | First inherited price test | Operating proof / reason not yet investable |
|---|---:|---|---|
| CF | $118.51 | Hold $118–119; reclaim $122–123 | [First half 2026](https://www.sec.gov/Archives/edgar/data/1324404/000132440426000017/cf-08052026_ex991xearnings.htm): $1.34bn net income, $1.82bn trailing FCF; includes ~$170m settlement gain. Stress fertiliser pricing, cost advantage, Blue Point, farmer affordability |
| BWXT | $135.83 | Stabilise $131–135; reclaim $140 then $143–144 | [Q2 2026](https://investors.bwxt.com/news-releases/news-release-details/bwx-technologies-reports-second-quarter-2026-results): FY adjusted EPS guide $4.70–4.80 and adjusted FCF guide $345–360m. ~28.6x FY adjusted EPS midpoint is not indisputably cheap |
| ETN | $391.50 | Base $386; reclaim $403–405 | [Q2 2026](https://www.eaton.com/sg/en-us/company/news-insights/news-releases/2026/eaton-reports-record-second-quarter-2026-results.html): organic sales +14%, $874m FCF, electrical orders growth. ~29.0x adjusted FY guidance midpoint still requires funded-order and valuation proof |
| GRAB | $2.87 | Hold $2.85–2.90; reclaim $3.03 then $3.15 | [15 Sep 6-K](https://www.sec.gov/Archives/edgar/data/1855612/000185561226000133/exhibit991-atometransactio.htm): **proposed**, not completed, 60% Atome cash purchase for $1.49bn with formula-priced remaining 40%. Credit-loss, loan funding, consolidated FCF and acquisition-return proof absent |
| TSM | $420.22 | Hold $407–411; reclaim $423–430 | [Q3 issuer results](https://investor.tsmc.com/english/quarterly-results/2026/q3) show strong cash, but valuation, AI-customer breadth and semiconductor price repair are independent gates |
| MU | $904.90 | Reclaim $931 then $950 | [Micron IR](https://investors.micron.com/) supports memory operating momentum; HBM future pricing, actual customer demand and China capacity remain unverified at the entry point |
| LNG | $286.60 | Orderly pullback and base, no chase | [Q2 issuer report](https://lngir.cheniere.com/news-events/press-releases/detail/343/cheniere-reports-second-quarter-2026-results-and-raises) supports distributable cash generation; overlaps existing energy holdings |

**Research priority (not a buy ranking):** CF, BWXT and ETN merit diversification/valuation follow-through. GRAB's asymmetry is interesting but **credit underwriting is the binding blocker**. TSM/MU offer direct AI-chip demand exposure but also portfolio regime overlap. LNG is strong cash-flow research but may duplicate energy risk.

All seven candidates retain their previous **non-executable** status. No existing watchlist conviction scores, ranking weights, position instructions or stops are changed. The [homepage's eight-company focus](../data/personal-decision-desk.json) retains GRAB, BWXT, CF, ETN, MU, VRT, XYL and GEHC; the last three remain unscored.

## 3. What would change our minds

**Bullish countercase:** Realised profitability and operating cash flow improve while funding costs stabilise. TSMC and strong electrical/supplier results continue to challenge an indiscriminate AI-bubble-collapse story. Company-level proof would justify a *new review*, not auto-promotion.

**Bearish countercase:** Persistent high real yields and deteriorating customer project financing cut equipment orders/FCF; fertiliser prices normalise while gas costs rise; GRAB's consumer credit losses or Atome second-stage funding needs overwhelm platform cash generation. These are scenarios to test, not established outcomes.

**Next proof order:** (1) broker actual position/FX/warrant identity, (2) TSLA 21 Oct earnings and margin/FCF adjudication, (3) DAYANG work-order/utilisation updates, (4) YTL data-centre funded contracts and combined weight, (5) GRAB credit and CF/BWXT/ETN valuation, (6) HIBISCS field netbacks and cash.

## 4. Data provenance and controls

- [Source-dated holdings tape](../data/holding-tape.json) and [PowerSweep](../data/power-sweep-latest.json), refreshed 20 Oct after quote sync repair.
- [Existing 18 Oct portfolio review](../data/portfolio-decision-review-2026-10-18.json), source-dated 16 Oct; historical assumptions and original technical gates kept for audit.
- [Live canonical](../data/live-desk-canonical.json) remains canonical only for macro, Stories, Motion and source health, not stock scores.
- [20 Oct structured decision review](../data/portfolio-decision-review-2026-10-20.json) contains full record IDs, source URLs, prior/current closes, inherited thresholds and blockers.
- Unverified: current broker quantity/cost, warrant identifier/market price, current portfolio FX/cash, executable spreads/fees, issuer CDS and paid outside-customer cash for the full AI financing network.

**No buy, sell, hedge, portfolio weight, score or production-market-source changes are authorised by this review.**
