import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "data", "live-desk-canonical.json");
const SOURCE =
  process.env.LIVE_DESK_DOSSIER_V2_URL ||
  "https://alchemy-live-market-desk.vercel.app/api/dossier-v2";

function pickLens(presentation, key) {
  const lens = (presentation?.regimeStrip || []).find((item) => item?.key === key);
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

function stableJson(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}

async function main() {
  const response = await fetch(SOURCE, {
    headers: { accept: "application/json", "user-agent": "power-stack-live-bridge/1" },
  });
  if (!response.ok) throw new Error(`Live Desk HTTP ${response.status}`);

  const selection = await response.json();
  const presentation = selection?.presentation;
  if (!presentation || presentation.contractVersion !== "dossier-presentation/1") {
    throw new Error("Live Desk did not return dossier-presentation/1");
  }

  const verification = selection?.stockedUpEvidenceBrief || null;
  const snapshot = {
    contractVersion: "power-stack-live-desk-canonical/1",
    sourceUrl: SOURCE,
    sourceStatus: selection.status || "unknown",
    dossierId: selection.selectedDossierId || null,
    asOf: presentation.asOf || selection.selectedAsOf || null,
    regime: {
      family: presentation.header?.regimeFamily || "UNRESOLVED",
      headline: presentation.header?.headline || "",
      answer: presentation.header?.answer || "",
      implication: presentation.header?.regimeImplication || "",
      whatWouldChangeMind: presentation.header?.whatWouldChangeMind || "",
    },
    rateRegime: presentation.rateRegime || null,
    lenses: [
      "US_RATES",
      "BONDS",
      "BREADTH",
      "TECH_AI",
      "OIL_WAR_INFLATION",
      "GOLD",
    ].map((key) => pickLens(presentation, key)).filter(Boolean),
    assetState: {
      contractVersion: selection.dailyAssetState?.contractVersion || null,
      asOf: selection.dailyAssetState?.asOf || null,
      assets: normaliseAssets(selection.dailyAssetState),
    },
    stockRadar: normaliseRadar(presentation.stockRadar),
    verification: verification
      ? {
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
        }
      : null,
    guardrails: [
      "Live Desk supplies canonical market reasoning and verified research context.",
      "Power Stack retains ownership of portfolio construction, company fundamental scores, ranking and entry discipline.",
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
