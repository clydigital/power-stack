# Rates and capital sensitivity — optional chat lens v1

Status: **reference-only and manually invoked.** This is a reasoning aid for a Power Stack chat; it is not a scoring feature, scheduled check, required research step, or source of current market facts.

## How to use it

Use this lens only when the user explicitly asks for it, for example:

> Apply the optional rates-and-capital-sensitivity lens to `[asset or company]` using the dated evidence in this chat. Keep Power Stack's existing scores and priorities unchanged unless separate, established review rules justify a change.

The result may conclude that rates are immaterial, the available evidence is insufficient, or another catalyst is more important. Do not invoke it from routine Power Stack refreshes, watchlist maintenance, scans, automations, or portfolio reviews unless the user specifically requests it.

## Non-negotiable boundaries

- Do not modify `data/ideas.json`, holdings-fundamentals, conviction scores, rankings, position sizing, entry levels, macro fingerprints, or the Live Desk rating export solely because this lens was invoked.
- Do not add a recurring task, background check, publication gate, or automatic score adjustment.
- Do not treat this document as evidence. Use dated, attributable market data and primary company disclosures where material.
- Unknown data is unknown, not zero, unchanged, or adverse evidence.
- Do not turn every company discussion into a rates discussion. A product, regulatory, supply, execution, or geopolitical catalyst can remain the dominant driver.

## Core distinctions

- Separate policy rates, nominal government yields, real yields, corporate borrowing costs, and credit spreads.
- Low debt limits direct interest-expense exposure; it does not remove customer-financing, valuation, FX, or indirect-demand exposure.
- Fixed-rate debt generally reprices at refinancing; floating-rate debt reprices at contractual reset dates. Consider hedges, maturities, currencies, and spreads.
- Easing during disinflation differs from easing during recession or credit stress. Lower policy rates can coexist with weaker demand and wider spreads.
- Market-implied paths are dated pricing observations, not central-bank promises.
- Gold, FX, crypto, commodities, and equities have multiple drivers. Do not infer a mechanical direction or a stock-price target from rates alone.

## Evidence standard when invoked

Start with the evidence already in the chat or established Power Stack research. If additional research is available, retain the observation date, jurisdiction, currency, source, and period for:

- policy rate, relevant yields, real-yield or inflation context, credit conditions, and market-implied path;
- debt, usable cash, fixed/floating mix after hedges, reset dates, maturities, coupons versus refinancing yields, interest expense, and coverage;
- operating cash flow, capex, free cash flow, margins, customer financing, demand sensitivity, and FX mismatch.

Prefer company filings, debt notes, official guidance, and other primary disclosures. Do not combine mismatched reporting periods into a ratio without explaining it. Restricted cash is not freely available to repay debt; no disclosed debt is not the same as no debt.

Banks, insurers, REITs, utilities, and other financial or regulated businesses require sector-specific analysis; do not impose an industrial-company template.

## Reasoning sequence

1. State the user’s causal question and the relevant financing jurisdiction or currency.
2. Establish what the dated evidence says about rates, yields, spreads, and expectations. If evidence is missing, use conditional language rather than recalled figures.
3. Trace financing, customer demand, capex/cash flow, and valuation channels separately. Identify offsets and the likely dominant channel.
4. Discuss only relevant scenarios: baseline, higher-for-longer/tighter conditions, and easing. Separate benign easing from distress easing.
5. Give the mechanism, horizon, countercase, uncertainty, and one next fact that would resolve the uncertainty. Preserve the existing Power Stack research priorities and scores.

For illustration only, annual interest impact can be approximated as exposed floating principal times the borrowing-rate change, adjusted for time exposed. Refinancing impact is principal refinanced times the new all-in rate less the old coupon, adjusted for timing. Do not calculate either without sufficient inputs, and do not double-count the same principal or ignore hedges, spreads, or interest-income offsets.

## Asset-specific reminders

- **Bonds:** duration, yield, and credit spread.
- **Gold:** real yields, FX, flows, and safe-haven demand.
- **Crypto:** liquidity, leverage, flows, and asset-specific catalysts.
- **Property/REITs:** refinancing, rents, cap rates, and property cash flows.
- **Commodities:** supply, demand, inventories, and FX; rate sensitivity may be indirect.
- **Banks/insurers:** asset-liability repricing, deposit costs, credit losses, and capital or liability matching.

Limited direct sensitivity is a valid conclusion. The purpose is a more disciplined causal explanation when requested—not a new scorecard.

## Reference anchors

- [CME FedWatch methodology](https://www.cmegroup.com/articles/2023/understanding-the-cme-group-fedwatch-tool-methodology.html)
- [Investor.gov — corporate bonds](https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products)
- [Federal Reserve research on equity transmission](https://www.federalreserve.gov/econres/feds/files/2026023pap.pdf)
