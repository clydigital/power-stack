import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "data", "live-desk-canonical.json");
const SOURCE =
  process.env.LIVE_DESK_MARKET_INTELLIGENCE_URL ||
  "https://alchemy-live-market-desk.vercel.app/api/market-intelligence-snapshot";

function pickLens(snapshot, key) {
  const lens = (snapshot?.marketState?.lenses || []).find((item) => item?.key === key);
  if (!lens) return null;
  return {
    key: lens.key,
    label: lens.label || lens.key,
    observed: Boolean(lens.observed),
    reaction: lens.reaction || null,
    interpretation: lens.interpretation || "",
    unresolvedSignals: Array.isArray(lens.unresolvedSignals) ? lens.unresolvedSignals : [],
    evidenceRefs: Array.isArray(lens.evidenceRefs) ? lens.evidenceRefs : [],
  };
}

function normaliseRadar(items) {
  return (items || []).slice(0, 3).map((item) => ({
    symbol: item.symbol,
    companyName: item.company_name || item.companyName || item.symbol,
    whyRelevant: item.why_relevant || item.whyRelevant || "",
    researchQuestion: item.research_question || item.researchQuestion || "",
    confirmingSignal: item.confirming_signal || item.confirmingSignal || "",
    invalidatingSignal: item.invalidating_signal || item.invalidatingSignal || "",
    linkedStoryId: item.linked_main_thread_or_story_id || item.linkedStoryId || null,
    evidenceRefs: item.evidence_references || item.evidenceRefs || [],
  }));
}

function normaliseAssets(state) {
  return (state?.assets || []).map((item) => ({
    key: item.key,
    label: item.label,
    symbol: item.symbol || null,
    last: item.last ?? null,
    dailyChange: item.dailyChange ?? null,
    dailyChangeUnit: item.dailyChangeUnit || "percent",
    bias: item.bias || "UNRESOLVED",
    conviction: item.conviction || "UNRESOLVED",
    primaryDriver: item.primaryDriver || "",
    confirmingSignal: item.confirmingSignal || null,
    contradictingSignal: item.contradictingSignal || null,
    invalidation: item.invalidation || null,
    asOf: item.asOf || null,
  }));
}

function normaliseVerification(verification) {
  if (!verification) return null;
  return {
    contractVersion: verification.contractVersion || null,
    reportLabel: verification.reportLabel || "Creator verification",
    verifiedCount: verification.verified?.length || 0,
    partialCount: verification.partial?.length || 0,
    creatorOnlyCount: verification.creatorOnly?.length || 0,
    verified: (verification.verified || []).map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      affectedAssets: item.affectedAssets || [],
      confidence: item.confidence ?? null,
    })),
    open: [...(verification.partial || []), ...(verification.creatorOnly || [])].map((item) => ({
      id: item.id,
      status: item.status,
      title: item.title,
      detail: item.detail,
      affectedAssets: item.affectedAssets || [],
    })),
  };
}

async function main() {
  const response = await fetch(SOURCE, {
    headers: { accept: "application/json", "user-agent": "power-stack-live-bridge/2" },
  });
  if (!response.ok) throw new Error(`Live Desk HTTP ${response.status}`);

  const live = await response.json();
  if (live?.contractVersion !== "market-intelligence-snapshot/v1") {
    throw new Error("Live Desk did not return market-intelligence-snapshot/v1");
  }

  const assetState = live.marketState?.dailyAssetState || null;
  const snapshot = {
    contractVersion: "power-stack-live-desk-canonical/2",
    sourceUrl: SOURCE,
    liveContractVersion: live.contractVersion,
    sourceStatus: live.dossier?.status || "unknown",
    dossierId: live.dossier?.dossierId || null,
    asOf: live.dossier?.asOf || null,
    regime: {
      family: live.regime?.regimeFamily || "UNRESOLVED",
      headline: live.regime?.headline || "",
      answer: live.regime?.answer || "",
      implication: live.regime?.regimeImplication || "",
      whatWouldChangeMind: live.regime?.whatWouldChangeMind || "",
    },
    rateRegime: live.regime?.rateRegime || null,
    monetarySignals: live.monetarySignals || null,
    sourceHealth: live.sourceHealth || null,
    contradictions: Array.isArray(live.contradictions) ? live.contradictions : [],
    researchGaps: Array.isArray(live.researchGaps) ? live.researchGaps : [],
    marketRows: Array.isArray(live.marketState?.selectedRows) ? live.marketState.selectedRows : [],
    lenses: [
      "US_RATES",
      "BONDS",
      "USD",
      "CREDIT",
      "BREADTH",
      "TECH_AI",
      "OIL_WAR_INFLATION",
      "GOLD",
    ].map((key) => pickLens(live, key)).filter(Boolean),
    assetState: {
      contractVersion: assetState?.contractVersion || null,
      asOf: assetState?.asOf || null,
      assets: normaliseAssets(assetState),
    },
    stories: Array.isArray(live.stories) ? live.stories : [],
    investigations: Array.isArray(live.investigations) ? live.investigations : [],
    stockRadar: normaliseRadar(live.stockRadar),
    verification: normaliseVerification(live.creatorVerification),
    upstreamGuardrails: Array.isArray(live.guardrails) ? live.guardrails : [],
    guardrails: [
      "Live Desk supplies canonical monetary/market reasoning, contradictions and source health.",
      "Power Stack consumes Live context read-only and maps it to portfolio exposures.",
      "Power Stack retains ownership of company fundamentals, valuation, portfolio construction, ranking and entry discipline.",
      "No Live-derived macro score or confirmation may be exported back to Live.",
      "Creator-only claims never alter Power Stack scores without independent verification.",
      "A Live Stock Radar name is a research-priority signal, not an automatic Power Stack buy or rerank.",
    ],
  };

  let existing = null;
  try {
    existing = JSON.parse(fs.readFileSync(OUTPUT, "utf8"));
  } catch {}

  const existingStable = existing ? { ...existing } : null;
  if (existingStable) delete existingStable.syncedAt;
  if (existingStable && JSON.stringify(existingStable) === JSON.stringify(snapshot)) {
    console.log("Live Desk canonical snapshot unchanged.");
    return;
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(
    OUTPUT,
    JSON.stringify({ ...snapshot, syncedAt: new Date().toISOString() }, null, 2) + "\n",
  );
  console.log(`Updated ${path.relative(ROOT, OUTPUT)} from ${SOURCE}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
