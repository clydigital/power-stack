import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = path.join(ROOT, "data/portfolio-live-overlay.json");
const CONTRACT = "power-stack-portfolio-live-overlay/1";

const RATE_KEYS = new Set([
  "RATES_POLICY",
  "RATES_FRONT_END",
  "RATES_REAL_YIELDS",
  "RATES_BREAKEVENS",
  "RATES_LONG_END",
  "BILLS",
]);
const FUNDING_KEYS = new Set(["FUNDING", "CREDIT"]);

const FACTORS = {
  rates: [
    { key: "policyRelief", sign: 1 },
    { key: "financialConditions", sign: 1 },
    { key: "riskAppetite", sign: 1 },
  ],
  funding: [
    { key: "financialConditions", sign: 1 },
    { key: "creditAvailability", sign: 1 },
    { key: "tailCreditStress", sign: -1 },
  ],
  energy: [
    { key: "energyTightness", sign: 1 },
    { key: "crudeTightness", sign: 1 },
    { key: "productTightness", sign: 1 },
    { key: "gasTightness", sign: 1 },
    { key: "inputCostPressure", sign: 1 },
  ],
};

const CLUSTERS = [
  {
    id: "ytl-linked",
    label: "YTL-linked concentration",
    tickers: ["YTLPOWR", "6742UW"],
    dependency: "single-name / linked-instrument concentration",
  },
  {
    id: "energy-complex",
    label: "Energy / shipping overlap",
    tickers: ["XOM", "HIBISCS", "MISC", "DAYANG"],
    dependency: "crude, products, freight and upstream capex",
  },
  {
    id: "duration-sensitive",
    label: "Duration-sensitive growth",
    tickers: ["TSLA", "TTWO", "YTLPOWR", "6742UW"],
    dependency: "real yields, long-end rates, financial conditions and risk appetite",
  },
];

function read(relative) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
}

function parseArgs(argv) {
  return { check: argv.includes("--check") };
}

function byTicker(profiles) {
  return new Map((profiles || []).map((item) => [String(item.ticker || "").toUpperCase(), item]));
}

function mergeProfiles(base, supplement) {
  const merged = byTicker(base?.stocks);
  for (const profile of supplement?.stocks || []) {
    merged.set(String(profile.ticker || "").toUpperCase(), profile);
  }
  const ytl = merged.get("YTLPOWR");
  if (ytl && !merged.has("6742UW")) {
    merged.set("6742UW", { ...structuredClone(ytl), ticker: "6742UW", inheritedFrom: "YTLPOWR" });
  }
  return merged;
}

function signalState(signals, keys) {
  const selected = signals.filter((item) => keys.has(item.key));
  const tighter = selected.filter((item) => item.direction === "TIGHTER").length;
  const easier = selected.filter((item) => item.direction === "EASIER").length;
  const neutral = selected.filter((item) => item.direction === "NEUTRAL").length;
  const unresolved = selected.filter((item) => item.direction === "UNRESOLVED" || item.direction === "MIXED").length;
  let state = "UNRESOLVED";
  if (tighter > easier && tighter > 0) state = "TIGHTER";
  else if (easier > tighter && easier > 0) state = "EASIER";
  else if (tighter === 0 && easier === 0 && neutral > 0 && unresolved === 0) state = "NEUTRAL";
  else if (tighter > 0 && easier > 0) state = "MIXED";
  return {
    state,
    tighter,
    easier,
    neutral,
    unresolved,
    keys: selected.map((item) => item.key),
    details: selected.map((item) => ({
      key: item.key,
      label: item.label,
      direction: item.direction,
      confirmation: item.confirmation,
      detail: item.detail,
      asOf: item.asOf,
    })),
  };
}

function exposure(profile, specs) {
  if (!profile) return null;
  let weighted = 0;
  let weight = 0;
  const contributors = [];
  for (const spec of specs) {
    const factor = profile.factors?.[spec.key];
    if (!factor) continue;
    const rawWeight = Number(factor.weight || 0);
    if (!(rawWeight > 0)) continue;
    const confidence = Number.isFinite(Number(factor.confidence)) ? Number(factor.confidence) : 1;
    const market = Number.isFinite(Number(factor.market)) ? Number(factor.market) : 0;
    const aligned = market * spec.sign;
    const effectiveWeight = rawWeight * confidence;
    weighted += aligned * effectiveWeight;
    weight += effectiveWeight;
    contributors.push({
      factor: spec.key,
      alignedMarketSensitivity: Number(aligned.toFixed(2)),
      weight: Number(rawWeight.toFixed(4)),
      confidence: Number(confidence.toFixed(2)),
      rationale: factor.rationale || "",
      contribution: Number((aligned * effectiveWeight).toFixed(3)),
    });
  }
  if (!weight) return null;
  const value = weighted / weight;
  return {
    value: Number(value.toFixed(2)),
    intensity: intensity(value),
    contributors: contributors
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 4),
  };
}

function intensity(value) {
  const magnitude = Math.abs(Number(value || 0));
  if (magnitude >= 3) return "VERY_HIGH";
  if (magnitude >= 1.75) return "HIGH";
  if (magnitude >= 0.75) return "MODERATE";
  return "LOW";
}

function directionalEffect(state, sensitivity) {
  if (!sensitivity) return "UNRESOLVED";
  if (Math.abs(sensitivity.value) < 0.75) return "NEUTRAL";
  if (state === "TIGHTER") return sensitivity.value > 0 ? "HEADWIND" : "TAILWIND";
  if (state === "EASIER") return sensitivity.value > 0 ? "TAILWIND" : "HEADWIND";
  if (state === "NEUTRAL") return "NEUTRAL";
  return "UNRESOLVED";
}

function energyEffect(active, sensitivity) {
  if (!active) return "UNRESOLVED";
  if (!sensitivity || Math.abs(sensitivity.value) < 0.75) return "NEUTRAL";
  return sensitivity.value > 0 ? "TAILWIND" : "HEADWIND";
}

function combineEffects(effects) {
  const values = Object.values(effects);
  const hasHeadwind = values.includes("HEADWIND");
  const hasTailwind = values.includes("TAILWIND");
  if (hasHeadwind && hasTailwind) return "MIXED";
  if (hasHeadwind) return "HEADWIND";
  if (hasTailwind) return "TAILWIND";
  if (values.some((value) => value === "NEUTRAL")) return "NEUTRAL";
  return "UNRESOLVED";
}

function reviewPriority({ overlayState, rateExposure, action }) {
  const actionText = String(action || "").toUpperCase();
  if (overlayState === "HEADWIND" && (rateExposure?.intensity === "HIGH" || rateExposure?.intensity === "VERY_HIGH")) {
    return "HIGH_REVIEW";
  }
  if (overlayState === "HEADWIND" && /(NO ADD|DO NOT AVERAGE|NO INCREASE)/.test(actionText)) {
    return "HIGH_REVIEW";
  }
  if (overlayState === "MIXED") return "REVIEW";
  if (overlayState === "TAILWIND") return "MONITOR_SUPPORT";
  if (overlayState === "UNRESOLVED") return "RESEARCH_GAP";
  return "MONITOR";
}

function effectReason(channel, effect, exposure, signal) {
  if (effect === "UNRESOLVED") return `${channel}: unresolved because signal or profile evidence is incomplete.`;
  if (effect === "NEUTRAL") return `${channel}: no material directional overlay at the current sensitivity threshold.`;
  const intensityLabel = exposure?.intensity ? exposure.intensity.toLowerCase().replaceAll("_", " ") : "mapped";
  return `${channel}: ${effect.toLowerCase()} with ${intensityLabel} sensitivity while the Live channel is ${signal.toLowerCase()}.`;
}


function findLens(live, key) {
  return (live.lenses || []).find((item) => item.key === key) || null;
}

function findAsset(live, key) {
  return live.assetState?.assets?.find((item) => item.key === key) || null;
}

function buildPortfolioDivergences(live, rates, funding) {
  const divergences = [];
  const tech = findLens(live, "TECH_AI");
  const breadth = findLens(live, "BREADTH");
  const credit = findLens(live, "CREDIT");
  const energy = findLens(live, "OIL_WAR_INFLATION");
  const nasdaq = findAsset(live, "NASDAQ");
  const crude = findAsset(live, "CRUDE");

  if (rates.state === "TIGHTER" && tech?.observed) {
    divergences.push({
      id: "rates-vs-tech-resilience",
      importance: "HIGH",
      divergence: "PARTIAL",
      expected: "A tighter real/long-yield regime should normally pressure long-duration growth and high-multiple technology.",
      actual: tech.reaction || "Tech/AI remained selectively resilient despite tighter rates.",
      affectedHoldings: ["TSLA", "TTWO", "YTLPOWR", "6742UW"],
      candidateExplanations: [
        "Narrow AI/semiconductor leadership is offsetting broad duration pressure at index level.",
        "Company-specific catalysts and funded/backlogged AI infrastructure demand are overpowering the discount-rate headwind in selected names.",
        "Positioning or short-covering may be amplifying resilience, but the current PS/Live contract does not yet verify that directly.",
      ],
      evidenceFor: [
        tech.interpretation || "",
        breadth?.interpretation || "",
        nasdaq ? "Nasdaq daily move " + (nasdaq.dailyChange ?? "n/a") + " with bias " + (nasdaq.bias || "UNRESOLVED") + "." : "",
      ].filter(Boolean),
      evidenceAgainst: [
        findLens(live, "US_RATES")?.interpretation || "",
      ].filter(Boolean),
      leadingHypothesis: "Narrow leadership is masking the rate headwind rather than proving that duration sensitivity has disappeared.",
      confidence: "HIGH",
      invalidation: "If breadth broadens materially while credit remains benign and real yields stay high, the rate headwind is less dominant than assumed. If AI/semiconductor leadership rolls over, the divergence resolves in the bearish direction.",
    });
  }

  if (rates.state === "TIGHTER" && credit?.observed && funding.state !== "TIGHTER") {
    divergences.push({
      id: "rates-vs-credit-transmission",
      importance: "HIGH",
      divergence: "YES",
      expected: "A persistent long-end tightening shock should eventually raise financing stress and widen credit spreads.",
      actual: credit.reaction || "Credit spreads remain comparatively tight despite the rates shock.",
      affectedHoldings: ["TSLA", "TTWO", "YTLPOWR", "6742UW", "MISC"],
      candidateExplanations: [
        "The current move is still primarily a rates/term-premium shock rather than a broad solvency or funding shock.",
        "Strong nominal growth and healthy corporate balance sheets may be delaying credit transmission.",
        "Credit may simply be lagging rates and could become the next confirmation leg.",
      ],
      evidenceFor: [
        credit.interpretation || "",
        "Funding/credit composite is currently " + funding.state + ".",
      ].filter(Boolean),
      evidenceAgainst: [
        live.regime?.implication || "",
      ].filter(Boolean),
      leadingHypothesis: "The shock is rates-led, not yet systemic; keep dry powder because credit remains the key confirmation risk.",
      confidence: "HIGH",
      invalidation: "Sustained HY/IG widening with weaker breadth and higher volatility would confirm transmission and require a stricter portfolio-risk posture.",
    });
  }

  if (energy?.observed && crude) {
    divergences.push({
      id: "crude-vs-product-tightness",
      importance: "HIGH",
      divergence: "YES",
      expected: "Softer crude would normally reduce immediate energy-inflation pressure and weaken the case for broad energy outperformance.",
      actual: energy.reaction || "Refined-product tightness persisted despite softer crude.",
      affectedHoldings: ["XOM", "HIBISCS", "MISC", "DAYANG"],
      candidateExplanations: [
        "Physical product scarcity and regional inventory/refinery constraints are stronger than the headline crude move suggests.",
        "Shipping/logistics constraints may be keeping product markets tight even as crude futures soften.",
        "Geopolitical premium and physical-product stress are moving on different timelines.",
      ],
      evidenceFor: [
        energy.interpretation || "",
        "Crude daily move " + (crude.dailyChange ?? "n/a") + " with bias " + (crude.bias || "UNRESOLVED") + ".",
      ].filter(Boolean),
      evidenceAgainst: [
        crude.contradictingSignal || "",
      ].filter(Boolean),
      leadingHypothesis: "Product-market tightness is currently more informative for the portfolio's energy sleeve than the crude headline alone.",
      confidence: "HIGH",
      invalidation: "Falling crack spreads, rebuilding product inventories and improving refinery utilization would weaken the physical-tightness explanation.",
    });
  }

  return divergences;
}

function buildOverlay(existingGeneratedAt = null) {
  const live = read("data/live-desk-canonical.json");
  if (live.contractVersion !== "power-stack-live-desk-canonical/2") {
    throw new Error("Portfolio overlay requires power-stack-live-desk-canonical/2.");
  }
  const holdingsData = read("data/holdings-fundamentals.json");
  const portfolio = read("data/portfolio-management.json");
  const baseProfiles = read("data/macro-sensitivities.json");
  const supplement = read("data/macro-sensitivity-supplement.json");
  const profiles = mergeProfiles(baseProfiles, supplement);
  const actions = new Map((portfolio.actions || []).map((item) => [String(item.ticker).toUpperCase(), item]));
  const signals = live.monetarySignals?.signals || [];
  const rates = signalState(signals, RATE_KEYS);
  const funding = signalState(signals, FUNDING_KEYS);
  const energyLens = (live.lenses || []).find((item) => item.key === "OIL_WAR_INFLATION") || null;
  const energyActive = Boolean(energyLens?.observed);

  const holdings = (holdingsData.holdings || []).map((holding) => {
    const ticker = String(holding.ticker).toUpperCase();
    const profile = profiles.get(ticker) || null;
    const manual = actions.get(ticker) || null;
    const rateExposure = exposure(profile, FACTORS.rates);
    const fundingExposure = exposure(profile, FACTORS.funding);
    const energyExposure = exposure(profile, FACTORS.energy);
    const effects = {
      rates: directionalEffect(rates.state, rateExposure),
      funding: directionalEffect(funding.state, fundingExposure),
      energy: energyEffect(energyActive, energyExposure),
    };
    const overlayState = combineEffects(effects);
    return {
      ticker,
      name: holding.name,
      fundamentalScore: holding.score,
      fundamentalGrade: holding.grade,
      profileStatus: profile ? (profile.inheritedFrom ? "INHERITED" : "MAPPED") : "MISSING",
      inheritedFrom: profile?.inheritedFrom || null,
      profileConfidence: profile?.profileConfidence ?? null,
      overlayState,
      reviewPriority: reviewPriority({
        overlayState,
        rateExposure,
        action: manual?.action,
      }),
      effects,
      sensitivities: {
        rates: rateExposure,
        funding: fundingExposure,
        energy: energyExposure,
      },
      currentAction: manual?.action || null,
      sizingRead: manual?.sizingRead || null,
      addGate: manual?.addGate || null,
      trimOrRecycleGate: manual?.trimOrRecycleGate || null,
      rationale: [
        effectReason("Rates/duration", effects.rates, rateExposure, rates.state),
        effectReason("Funding/credit", effects.funding, fundingExposure, funding.state),
        energyActive
          ? `Physical energy: ${effects.energy.toLowerCase()} while Live marks the product/energy lens observed.`
          : "Physical energy: unresolved because the Live energy lens is not observed.",
      ],
    };
  });

  const holdingTickers = new Set(holdings.map((item) => item.ticker));
  const hiddenConcentration = CLUSTERS.map((cluster) => {
    const members = cluster.tickers.filter((ticker) => holdingTickers.has(ticker));
    return {
      ...cluster,
      members,
      memberCount: members.length,
      status: members.length >= 3 ? "HIGH_OVERLAP" : members.length === 2 ? "CONCENTRATION_WATCH" : "LOW",
      nextCheck:
        portfolio.riskDashboard?.find((item) =>
          members.length && members.some((ticker) => String(item.signal || "").includes(ticker))
        )?.nextCheck || null,
    };
  });

  const highReview = holdings.filter((item) => item.reviewPriority === "HIGH_REVIEW").map((item) => item.ticker);
  const researchGaps = holdings.filter((item) => item.profileStatus === "MISSING").map((item) => `Missing macro-sensitivity profile: ${item.ticker}`);

  return {
    contractVersion: CONTRACT,
    generatedAt: existingGeneratedAt || new Date().toISOString(),
    liveAsOf: live.asOf || null,
    liveSyncedAt: live.syncedAt || null,
    sourceHealth: live.sourceHealth || null,
    regime: live.regime || null,
    currentSignals: {
      rates,
      funding,
      physicalEnergy: {
        status: energyActive ? "ACTIVE" : "UNRESOLVED",
        observed: energyActive,
        detail: energyLens?.interpretation || energyLens?.reaction || "No current Live physical-energy lens.",
        evidenceRefs: energyLens?.evidenceRefs || [],
      },
    },
    holdings,
    hiddenConcentration,
    portfolioDivergences: buildPortfolioDivergences(live, rates, funding),
    reviewQueue: {
      highReview,
      mixed: holdings.filter((item) => item.overlayState === "MIXED").map((item) => item.ticker),
      supported: holdings.filter((item) => item.overlayState === "TAILWIND").map((item) => item.ticker),
      researchGaps,
    },
    divergences: (live.contradictions || []).slice(0, 6),
    liveResearchGaps: live.researchGaps || [],
    guardrails: [
      "This overlay does not change company fundamental scores.",
      "HEADWIND / TAILWIND describes current macro exposure, not a buy or sell recommendation.",
      "Power Stack action gates remain company- and portfolio-owned.",
      "Live contradictions remain open investigations until independently resolved.",
      "Portfolio divergence hypotheses are deterministic prompts for investigation, not causal proof.",
      "Missing profiles remain RESEARCH_GAP rather than zero sensitivity.",
    ],
    sourceFiles: [
      "data/live-desk-canonical.json",
      "data/holdings-fundamentals.json",
      "data/macro-sensitivities.json",
      "data/macro-sensitivity-supplement.json",
      "data/portfolio-management.json",
    ],
  };
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

function sameJson(left, right) {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

const args = parseArgs(process.argv.slice(2));
const existing = fs.existsSync(OUTPUT) ? JSON.parse(fs.readFileSync(OUTPUT, "utf8")) : null;
const overlay = buildOverlay(args.check ? existing?.generatedAt || null : null);

if (args.check) {
  if (!existing || !sameJson(existing, overlay)) {
    console.error("data/portfolio-live-overlay.json is stale. Regenerate it with:");
    console.error("node scripts/generate-portfolio-live-overlay.mjs");
    process.exitCode = 1;
  } else {
    console.log("Portfolio Live overlay matches canonical inputs.");
  }
} else {
  fs.writeFileSync(OUTPUT, `${JSON.stringify(overlay, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, OUTPUT)}.`);
}
