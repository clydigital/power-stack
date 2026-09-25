import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = path.join(ROOT, "data/power-sweep-latest.json");
const CONTRACT = "power-sweep/1";

function read(relative) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
}

function parseArgs(argv) {
  return { check: argv.includes("--check") };
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function sameJson(a, b) {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

function ageHours(value, now = new Date()) {
  if (!value) return Infinity;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? Math.max(0, (now.getTime() - parsed) / 3600000) : Infinity;
}

function importanceScore(holding) {
  let score = 0;
  if (holding.actualReaction?.status === "DIVERGES") score += 100;
  if (holding.actualReaction?.status === "UNRESOLVED") score += 85;
  if (holding.profileStatus === "MISSING") score += 80;
  if (holding.reviewPriority === "HIGH_REVIEW") score += 45;
  if (holding.overlayState === "HEADWIND") score += 25;
  if (holding.overlayState === "MIXED") score += 10;
  const move = Math.abs(Number(holding.actualReaction?.changePct || 0));
  if (move >= 3) score += 25;
  else if (move >= 2) score += 18;
  else if (move >= 1) score += 8;
  if (/NO ADD|DO NOT AVERAGE|NO INCREASE/.test(String(holding.currentAction || "").toUpperCase())) score += 10;
  return score;
}

function holdingReason(holding) {
  const reasons = [];
  if (holding.actualReaction?.status === "DIVERGES") reasons.push("completed-session tape moved against the directional macro overlay");
  if (holding.actualReaction?.status === "UNRESOLVED") reasons.push("completed-session tape/instrument data is unresolved");
  if (holding.profileStatus === "MISSING") reasons.push("macro-sensitivity profile is missing");
  if (holding.reviewPriority === "HIGH_REVIEW") reasons.push("portfolio overlay marks the holding HIGH_REVIEW");
  const move = Math.abs(Number(holding.actualReaction?.changePct || 0));
  if (holding.overlayState === "MIXED" && move >= 2) reasons.push("mixed macro exposure coincided with a material one-session move");
  if (!reasons.length) reasons.push("monitoring only; no decision-relevant divergence");
  return reasons;
}

function holdingEvidence(holding) {
  const out = [];
  if (holding.actualReaction?.status === "DIVERGES") {
    out.push("company-specific news/catalysts for the completed session");
    out.push("technical/flow context sufficient to test whether the divergence is company-specific or temporary");
  }
  if (holding.actualReaction?.status === "UNRESOLVED") out.push("verified instrument symbol/terms and completed-session market data");
  if (holding.overlayState === "HEADWIND") out.push("funding, valuation, cash-flow or operating evidence that could offset or reinforce the macro headwind");
  if (holding.overlayState === "MIXED") out.push("which channel dominated the tape: company fundamentals, crude/products, freight, rates or positioning");
  return [...new Set(out)];
}

function decisionImpact(holding) {
  if (holding.ticker === "6742UW") return "Could unlock accurate YTL-linked concentration and portfolio-weight measurement.";
  if (holding.actualReaction?.status === "DIVERGES") return "Could change the current add/hold gate or create a new company-specific catalyst/invalidation.";
  if (holding.overlayState === "MIXED" && Math.abs(Number(holding.actualReaction?.changePct || 0)) >= 2) {
    return "Could identify which macro/company channel is driving the position and whether the current action gate remains appropriate.";
  }
  return "Monitor unless new company evidence changes the existing Power Stack action gate.";
}

function researchQuestionForHolding(item) {
  if (item.ticker === "YTLPOWR") {
    return "Why did YTLPOWR rise despite a directional rates headwind, and does the answer improve or weaken the current HOLD / NO ADD gate?";
  }
  if (item.ticker === "6742UW") {
    return "What are the verified strike, expiry, conversion ratio, liquidity and current market value of 6742UW, and how much YTL-linked risk does it add?";
  }
  if (item.overlayState === "MIXED") {
    return "What drove " + item.ticker + "'s material move, and which documented macro/company channel currently dominates its risk?";
  }
  return "Has new company-specific evidence changed " + item.ticker + "'s current action gate or thesis risk?";
}

function watchlistDiversification(candidate) {
  const text = ((candidate.theme || "") + " " + (candidate.thesis || "")).toLowerCase();
  if (/(fertil|agric|seed|crop|farm)/.test(text)) return { label: "DIVERSIFIES", reason: "adds agriculture/input exposure outside the current power/energy/duration clusters" };
  if (/(copper|critical mineral|rare earth)/.test(text)) return { label: "PARTIAL_DIVERSIFIER", reason: "adds materials exposure, though still linked to grid/industrial capex" };
  if (/(lng|oil|gas|refin|tanker|shipping)/.test(text)) return { label: "OVERLAP", reason: "adds to the existing energy/shipping cluster" };
  if (/(ai|data cent|software|cyber|semiconductor|memory|grid|power|electrical)/.test(text)) return { label: "OVERLAP", reason: "adds to the existing duration/power/AI dependency set" };
  return { label: "NEUTRAL", reason: "no dominant overlap classification from current documented theme text" };
}

function candidatePriority(candidate) {
  const div = watchlistDiversification(candidate);
  let score = 100 - Number(candidate.rank || 99);
  if (candidate.bucket === "buy") score += 30;
  if (candidate.bucket === "selective") score += 10;
  if (div.label === "DIVERSIFIES") score += 20;
  if (div.label === "PARTIAL_DIVERSIFIER") score += 8;
  if (div.label === "OVERLAP") score -= 12;
  if (/PRIORITY/.test(String(candidate.action || "").toUpperCase())) score += 12;
  return score;
}

function themeIntersections(theme, holdings, watchlist) {
  const keys = new Set((theme.keyAssetsTickers || []).map((x) => String(x).toUpperCase()));
  const held = holdings.filter((x) => keys.has(x.ticker)).map((x) => x.ticker);
  const watched = watchlist.filter((x) => keys.has(String(x.ticker).toUpperCase())).map((x) => x.ticker);
  return { held, watched };
}

function build(existingGeneratedAt = null) {
  const config = read("data/research-sweep-config.json");
  const live = read("data/live-desk-canonical.json");
  const overlay = read("data/portfolio-live-overlay.json");
  const tape = read("data/holding-tape.json");
  const watchlist = read("data/watchlist.json");
  const ideas = read("data/ideas.json");
  const themes = read("data/developing-themes.json");
  const portfolio = read("data/portfolio-management.json");

  const caps = config.powerSweep?.hardCaps || {};
  const maxTotal = Number(caps.totalExternalInvestigations || 12);
  const now = new Date();

  const inputHealth = {
    liveDesk: {
      contractVersion: live.contractVersion,
      expectedContract: "power-stack-live-desk-canonical/2",
      asOf: live.asOf || null,
      syncedAt: live.syncedAt || null,
      ageHours: Number(ageHours(live.syncedAt || live.asOf, now).toFixed(1)),
      status: live.contractVersion === "power-stack-live-desk-canonical/2" ? "OK" : "BLOCKING",
    },
    portfolioOverlay: {
      contractVersion: overlay.contractVersion,
      expectedContract: "power-stack-portfolio-live-overlay/1",
      generatedAt: overlay.generatedAt || null,
      ageHours: Number(ageHours(overlay.generatedAt, now).toFixed(1)),
      status: overlay.contractVersion === "power-stack-portfolio-live-overlay/1" ? "OK" : "BLOCKING",
    },
    holdingTape: {
      contractVersion: tape.contractVersion,
      expectedContract: "power-stack-holding-tape/1",
      generatedAt: tape.generatedAt || null,
      unresolved: tape.unresolved || [],
      status: tape.contractVersion === "power-stack-holding-tape/1" ? "OK" : "BLOCKING",
    },
  };

  const blocking = Object.values(inputHealth).some((item) => item.status === "BLOCKING");
  const holdingRows = overlay.holdings || [];
  const holdingCandidates = holdingRows
    .map((holding) => ({
      ticker: holding.ticker,
      name: holding.name,
      priorityScore: importanceScore(holding),
      overlayState: holding.overlayState,
      reviewPriority: holding.reviewPriority,
      actualReaction: holding.actualReaction,
      currentAction: holding.currentAction,
      reasons: holdingReason(holding),
      researchQuestion: researchQuestionForHolding(holding),
      requiredEvidence: holdingEvidence(holding),
      possibleDecisionImpact: decisionImpact(holding),
    }))
    .filter((item) =>
      item.actualReaction?.status === "DIVERGES"
      || item.actualReaction?.status === "UNRESOLVED"
      || (item.reviewPriority === "HIGH_REVIEW" && item.actualReaction?.status !== "CONFIRMS")
      || (item.overlayState === "MIXED" && Math.abs(Number(item.actualReaction?.changePct || 0)) >= 2)
    )
    .sort((a,b) => b.priorityScore - a.priorityScore);

  const holdingQueue = holdingCandidates.slice(0, Number(caps.holdingDeepDives || 3));
  let remaining = Math.max(0, maxTotal - holdingQueue.length);

  const watchCandidates = (watchlist.candidates || [])
    .filter((item) => ["buy","selective","wait"].includes(item.bucket))
    .map((item) => {
      const diversification = watchlistDiversification(item);
      return {
        ticker: item.ticker,
        name: item.name,
        rank: item.rank,
        score: item.score,
        bucket: item.bucket,
        action: item.action,
        entry: item.entry,
        confirmation: item.confirmation,
        invalidation: item.invalidation,
        theme: item.theme,
        priorityScore: candidatePriority(item),
        diversification,
        researchQuestion: diversification.label === "OVERLAP"
          ? "Is " + item.ticker + " sufficiently better than the portfolio's existing overlapping exposures to justify new capital?"
          : "Does " + item.ticker + " still offer enough quality + price asymmetry to justify priority research under the current Live regime?",
      };
    })
    .sort((a,b)=>b.priorityScore-a.priorityScore);

  const watchlistQueue = watchCandidates.slice(0, Math.min(Number(caps.watchlistDeepDives || 4), remaining));
  remaining -= watchlistQueue.length;

  const themeCandidates = (themes.themes || [])
    .filter((theme) => !/^Global Duration/i.test(theme.name || ""))
    .map((theme) => {
      const intersections = themeIntersections(theme, holdingRows, watchlist.candidates || []);
      const relevance = intersections.held.length * 30 + intersections.watched.length * 8 + Number(theme.significanceScore || 0);
      return {
        priorityRank: theme.priorityRank,
        name: theme.name,
        lifecycleState: theme.lifecycleState,
        directionOfTravel: theme.directionOfTravel,
        nextTest: theme.nextTest,
        watchlistHoldingAction: theme.watchlistHoldingAction,
        intersections,
        relevanceScore: relevance,
        researchQuestion: intersections.held.length
          ? "What company/industry evidence would materially change the current Power Stack action for " + intersections.held.join(", ") + "?"
          : "Is this theme producing a differentiated, actionable candidate rather than duplicating existing portfolio exposure?",
      };
    })
    .filter((item)=>item.intersections.held.length || item.intersections.watched.length)
    .sort((a,b)=>b.relevanceScore-a.relevanceScore);

  const themeQueue = themeCandidates.slice(0, Math.min(Number(caps.themeDeepDives || 3), remaining));
  remaining -= themeQueue.length;

  const ideaRows = Array.isArray(ideas) ? ideas : (ideas.ideas || []);
  const chinaCandidates = ideaRows
    .filter((item)=>/China|Hong Kong/i.test(String(item.region || item.market || "")))
    .sort((a,b)=>Number(b.conviction || 0)-Number(a.conviction || 0))
    .map((item)=>({
      ticker:item.ticker,
      name:item.name,
      conviction:item.conviction ?? null,
      status:item.status || null,
      thesis:item.thesis || "",
      researchQuestion:"Does current China/HK credit transmission, policy and demand evidence strengthen or weaken " + item.ticker + "'s company thesis?",
    }));

  const chinaAdjunct = chinaCandidates.slice(0, Math.min(Number(caps.chinaAdjunctNames || 3), remaining));

  const liveRadar = (live.stockRadar || []).slice(0, Number(caps.liveRadarNames || 3)).map((item)=>({
    ticker:item.symbol,
    companyName:item.companyName,
    whyRelevant:item.whyRelevant,
    researchQuestion:item.researchQuestion,
    status:"DISCOVERY_ONLY",
    rule:"May enter PowerSweep only if independent company evidence or portfolio relevance justifies consuming research budget.",
  }));

  const selectedTickers = new Set([
    ...holdingQueue.map((x)=>x.ticker),
    ...watchlistQueue.map((x)=>x.ticker),
    ...chinaAdjunct.map((x)=>x.ticker),
  ]);

  const monitorOnly = holdingRows
    .filter((item)=>!selectedTickers.has(item.ticker))
    .map((item)=>({
      ticker:item.ticker,
      overlayState:item.overlayState,
      reaction:item.actualReaction?.status || "UNRESOLVED",
      action:item.currentAction,
      reason:item.actualReaction?.status === "CONFIRMS"
        ? "Tape currently confirms the macro overlay; no extra research budget unless company evidence changes."
        : item.overlayState === "MIXED"
          ? "Mixed exposure is monitored without forcing a directional conclusion."
          : "No current decision-relevant divergence promoted into the capped queue.",
    }));

  const researchGaps = [
    ...(overlay.reviewQueue?.researchGaps || []),
    ...(overlay.liveResearchGaps || []),
    ...(tape.unresolved || []).map((ticker)=>"Holding tape unresolved: " + ticker),
  ].filter(Boolean).slice(0, Number(caps.researchGaps || 6));

  const queueCounts = {
    holdings: holdingQueue.length,
    watchlist: watchlistQueue.length,
    themes: themeQueue.length,
    chinaAdjunct: chinaAdjunct.length,
    selectedExternalInvestigations: holdingQueue.length + watchlistQueue.length + themeQueue.length + chinaAdjunct.length,
    hardCap: maxTotal,
  };

  return {
    contractVersion: CONTRACT,
    generatedAt: existingGeneratedAt || new Date().toISOString(),
    asOf: live.asOf || portfolio.asOf || watchlist.asOf || null,
    blocked: blocking,
    purpose: "Bounded Live-first PowerSweep plan for portfolio research and capital-allocation decisions.",
    inputHealth,
    regime: {
      family: live.regime?.family || null,
      headline: live.regime?.headline || null,
      implication: live.regime?.implication || null,
      monetarySummary: live.monetarySignals?.summary || null,
    },
    queueCounts,
    portfolioTriage: {
      tapeDivergences: overlay.reviewQueue?.tapeDivergences || [],
      tapeConfirmations: overlay.reviewQueue?.tapeConfirmations || [],
      highReview: overlay.reviewQueue?.highReview || [],
      mixed: overlay.reviewQueue?.mixed || [],
      hiddenConcentration: overlay.hiddenConcentration || [],
      portfolioDivergences: (overlay.portfolioDivergences || []).slice(0, Number(caps.portfolioDivergences || 4)),
    },
    holdingResearchQueue: blocking ? [] : holdingQueue,
    watchlistResearchQueue: blocking ? [] : watchlistQueue,
    themeResearchQueue: blocking ? [] : themeQueue,
    chinaAdjunctQueue: blocking ? [] : chinaAdjunct,
    liveRadar,
    monitorOnly,
    newCapitalPriority: portfolio.newCapitalPriority || [],
    researchGaps,
    explicitNoChange: [
      "Do not change any company fundamental score from Live macro state or holding-tape reaction alone.",
      "Do not mechanically rerank the watchlist from Live Stock Radar.",
      "Do not convert MIXED exposure into a directional trade signal.",
      "Do not rebuild a competing Power Stack macro regime when Live canonical inputs are healthy.",
    ],
    writeBackPolicy: {
      allowed: [
        "holding/watchlist action text and gates when new Power Stack-owned evidence supports a change",
        "portfolio-management concentration and capital-allocation flags",
        "developing-theme priority when mechanism/timing/beneficiaries materially change",
        "company fundamental score only on new company-level earnings/cash-flow/balance-sheet/business-quality/growth/valuation evidence",
      ],
      forbidden: [
        "Live-derived macro score exported back to Live",
        "macro overlay arithmetic added to company fundamental score",
        "creator/social claim used as score evidence without independent verification",
        "forced conclusion when the evidence remains unresolved",
      ],
    },
    sourceFiles: [
      "data/research-sweep-config.json",
      "data/live-desk-canonical.json",
      "data/portfolio-live-overlay.json",
      "data/holding-tape.json",
      "data/holdings-fundamentals.json",
      "data/watchlist.json",
      "data/ideas.json",
      "data/developing-themes.json",
      "data/portfolio-management.json",
    ],
  };
}

const args = parseArgs(process.argv.slice(2));
const existing = fs.existsSync(OUTPUT) ? JSON.parse(fs.readFileSync(OUTPUT, "utf8")) : null;
const output = build(args.check ? existing?.generatedAt || null : null);

if (args.check) {
  if (!existing || !sameJson(existing, output)) {
    console.error("data/power-sweep-latest.json is stale. Regenerate it with:");
    console.error("node scripts/generate-power-sweep.mjs");
    process.exitCode = 1;
  } else {
    console.log("PowerSweep plan matches canonical inputs.");
  }
} else {
  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + "\n");
  console.log("Wrote data/power-sweep-latest.json with " + output.queueCounts.selectedExternalInvestigations + " selected investigations.");
}
