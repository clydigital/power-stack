/**
 * Power Stack's read-only reconciliation of gaps already detected by Live.
 * This is NOT an acquisition agent, new research gate, alternative macro
 * authority, capital allocation signal or an auto-resolving evidence writer.
 *
 * Every state is derived from an existing contract field or a recorded gap;
 * "data present" never means an issuer decision or rate direction is verified.
 */
const LIVE_CONTRACT = "power-stack-live-desk-canonical/2";
const MAX_LIVE_AGE_HOURS = 48;

function dateMs(value) {
  return typeof value === "string" ? Date.parse(value) : NaN;
}

export function assessLiveDeskInput(live, now = new Date()) {
  const sourceStatus = typeof live?.sourceStatus === "string" ? live.sourceStatus : "unknown";
  const health = live?.sourceHealth && typeof live.sourceHealth === "object" ? live.sourceHealth : {};
  const asOf = live?.asOf ?? null;
  const ageHours = Number.isFinite(dateMs(asOf)) ? Math.max(0, (now.getTime() - dateMs(asOf)) / 3600000) : null;
  const reasons = [];

  if (live?.contractVersion !== LIVE_CONTRACT) reasons.push("INVALID_LIVE_CONTRACT");
  if (ageHours === null) reasons.push("MISSING_DOSSIER_AS_OF");
  else if (ageHours > MAX_LIVE_AGE_HOURS) reasons.push("STALE_DOSSIER_AS_OF");
  if (!live?.dossierId || !live?.regime?.family) reasons.push("MISSING_CANONICAL_IDENTITY");
  if (sourceStatus === "unavailable" || sourceStatus === "unknown") reasons.push("DOSSIER_UNAVAILABLE");

  const criticalDegraded = ["dossier", "marketMonitor", "fredRates", "nyFedPrimaryDealers", "treasurySupply"]
    .filter(key => health[key] && !["OK", "COMPLETE"].includes(health[key]));
  const degraded = sourceStatus.toLowerCase().includes("degraded")
    || criticalDegraded.length > 0;
  if (degraded) reasons.push("UPSTREAM_EVIDENCE_PARTIAL");

  return {
    contractVersion: live?.contractVersion ?? null,
    expectedContract: LIVE_CONTRACT,
    asOf,
    syncedAt: live?.syncedAt ?? null,
    sourceStatus,
    sourceHealth: {
      dossier: health.dossier ?? "UNKNOWN",
      marketMonitor: health.marketMonitor ?? "UNKNOWN",
      fredRates: health.fredRates ?? "UNKNOWN",
      nyFedPrimaryDealers: health.nyFedPrimaryDealers ?? "UNKNOWN",
      treasurySupply: health.treasurySupply ?? "UNKNOWN",
    },
    ageHours: ageHours === null ? null : Math.round(ageHours * 10) / 10,
    reasons,
    status: reasons.some(s => s !== "UPSTREAM_EVIDENCE_PARTIAL")
      ? "BLOCKING" : degraded ? "PARTIAL" : "OK",
  };
}

const KNOWN_ROUTE = {
  "INTRADAY_RATES": {
    owner: "LIVE_DESK",
    state: "REQUIRES_VALIDATED_INTRADAY_FEEDS",
    presentInfrastructure: ["Official FRED/Treasury daily rates", "existing Barchart MOVE adapter"],
    missingProof: "Observed timestamped Fed-funds-futures, UST 2Y/10Y bars, and licenced MOVE close/series with raw URLs",
    nextStep: "Check existing Barchart entitlement; integrate direct intraday licensed providers into Live only, with release-aligned timestamps",
  },
  "PRIMARY_DEALERS": {
    owner: "LIVE_DESK",
    state: "UPSTREAM_STALE",
    presentInfrastructure: ["Official New York Fed primary-dealer REST adapter"],
    missingProof: "Fresh official publication with an as-of date and parser-verified positions/fails",
    nextStep: "Re-query the existing NY Fed endpoint at the existing rates source-integrity cadence; keep stale if publisher remains delayed",
  },
  "TREASURY_SUPPLY": {
    owner: "LIVE_DESK",
    state: "EVIDENCE_PRESENT_INTERPRETATION_UNRESOLVED",
    presentInfrastructure: ["Treasury Fiscal Data nominal auctions", "coupon offering-size comparisons", "rate-regime Treasury-supply evidence references"],
    missingProof: "Verified absorption/cost/term-premium causal test; offering volumes alone do not imply yield direction",
    nextStep: "Read existing official auction/curve evidence in Live Research Gate and leave directional state unresolved until supported",
  },
  "WARRANT_6742UW": {
    owner: "POWER_STACK",
    state: "INSTRUMENT_NOT_VERIFIED",
    presentInfrastructure: ["YTLPOWR parent equity quote", "original portfolio holding identifier"],
    missingProof: "Exchange warrant code, issuer/underlying, strike, expiry, conversion and two confirmed daily bars",
    nextStep: "Check Bursa structured-warrant issuer/exchange primary listing; do not borrow the parent share price",
  },
};

export function classifyPowerStackGap(gap) {
  const text = String(gap || "");
  const lowered = text.toLowerCase();
  let id = "OTHER";
  if (/intraday|fed.funds.futures|5m.30m|move\/treasury.volatility/i.test(text)) id = "INTRADAY_RATES";
  else if (/primary.dealer|dealer.report/i.test(text)) id = "PRIMARY_DEALERS";
  else if (/treasury supply|treasury auction|auction state/i.test(text)) id = "TREASURY_SUPPLY";
  else if (/6742uw/i.test(text)) id = "WARRANT_6742UW";
  const known = KNOWN_ROUTE[id];
  return {
    id: known ? id : "UNCLASSIFIED:" + lowered.slice(0, 96).replace(/[^a-z0-9]+/g, "-"),
    reportedGap: text,
    ...(known || {
      owner: "RESEARCH_GAP_GATE",
      state: "UNCLASSIFIED_REQUIRES_SOURCE_CHECK",
      presentInfrastructure: [],
      missingProof: "Original source data and contract evidence for this observation",
      nextStep: "Review existing Live/PS source mapping; don't mark as resolved from text alone",
    }),
    isClosed: false,
    evidenceAuthority: "ORIGINAL_SOURCE_REQUIRED",
  };
}

export function reconcilePowerStackGaps({live, researchGaps = [], tape}) {
  // The downstream PowerSweep has a six-gap display cap. The canonical Live
  // source and all unresolved positions are inventoried independently, so
  // the reconciliation cannot silently hide a material source deficit.
  const sourceGaps = Array.isArray(live?.researchGaps) ? live.researchGaps : [];
  const unresolvedTickers = Array.isArray(tape?.unresolved) ? tape.unresolved : [];
  const raw = [...sourceGaps, ...researchGaps, ...unresolvedTickers.map(t => "Holding tape unresolved: " + t)]
    .filter(value => typeof value === "string" && value.trim());
  const rows = [];
  const seen = new Set();
  for (const gap of raw) {
    const item = classifyPowerStackGap(gap);
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    rows.push(item);
  }
  return {
    contractVersion: "power-stack-gap-reconciliation/1",
    sourceAsOf: live?.asOf ?? null,
    sourceStatus: live?.sourceStatus ?? "unknown",
    owner: "Power Stack is read-only; Live owns all macro/rates evidence",
    resolvedByReconciliation: 0,
    externallyVerified: false,
    gaps: rows,
    byStatus: Object.fromEntries([...new Set(rows.map(row => row.state))]
      .map(state => [state, rows.filter(row => row.state === state).length])),
  };
}
