import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = path.join(ROOT, "data", "motion-migration-shadow.json");
const CONTRACT = "power-stack-motion-parity-shadow/1";

function read(relative) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
}

function normalHeadline(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function sourceUrl(item) {
  return item?.source?.url || item?.sourceUrl || null;
}

function eventTimestamp(item) {
  const raw = item?.eventDate || item?.occurredAt || null;
  if (!raw) return Number.NaN;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return Date.parse(raw + "T23:59:59Z");
  return Date.parse(raw);
}

function keys(item) {
  const out = [];
  const url = sourceUrl(item);
  const headline = normalHeadline(item?.headline);
  if (url) out.push("url:" + url);
  if (headline) out.push("headline:" + headline);
  return out;
}

function covered(item, liveKeys) {
  return keys(item).some((key) => liveKeys.has(key));
}

function build(existingGeneratedAt = null) {
  const live = read("data/live-desk-canonical.json");
  const local = read("data/market-motion.json");
  const liveItems = live.marketMotion?.items || [];
  const localPrimary = local.primary || [];
  const localSecondary = local.secondary || [];
  const localItems = [...localPrimary, ...localSecondary];
  const freshnessHours = Number(local.freshnessWindowHours || 48);
  const anchor = Date.parse(local.asOf || live.marketMotion?.capturedAt || "");
  const anchorMs = Number.isFinite(anchor) ? anchor : Date.now();
  const freshCutoff = anchorMs - freshnessHours * 60 * 60 * 1_000;
  const fresh = (item) => {
    const timestamp = eventTimestamp(item);
    return Number.isFinite(timestamp) && timestamp >= freshCutoff && timestamp <= anchorMs + 24 * 60 * 60 * 1_000;
  };

  const liveKeys = new Set(liveItems.flatMap(keys));
  const freshPrimary = localPrimary.filter(fresh);
  const freshLocal = localItems.filter(fresh);
  const coveredPrimary = freshPrimary.filter((item) => covered(item, liveKeys));
  const coveredLocal = freshLocal.filter((item) => covered(item, liveKeys));
  const uncoveredLocal = freshLocal.filter((item) => !covered(item, liveKeys));
  const staleLocal = localItems.filter((item) => !fresh(item));
  const primaryCoveragePct = freshPrimary.length
    ? Math.round(coveredPrimary.length / freshPrimary.length * 100)
    : null;
  const parityState =
    liveItems.length === 0 ? "NO_LIVE_MOTION"
      : freshPrimary.length === 0 ? "NO_LEGACY_PRIMARY"
        : primaryCoveragePct === 100 ? "FULL"
          : "PARTIAL";
  const migrationDecision =
    parityState === "FULL" ? "CAN_RETIRE_LEGACY_PRIMARY_OWNERSHIP"
      : parityState === "NO_LIVE_MOTION" ? "WAIT_FOR_LIVE_MOTION"
        : "KEEP_SHADOW_AND_COMPARE";

  return {
    contractVersion: CONTRACT,
    generatedAt: existingGeneratedAt || new Date().toISOString(),
    asOf: local.asOf || live.marketMotion?.capturedAt || null,
    freshnessWindowHours: freshnessHours,
    mode: "SHADOW",
    canonicalOwner: "Alchemy Live Desk",
    parityState,
    migrationDecision,
    live: {
      editionId: live.marketMotion?.editionId || null,
      capturedAt: live.marketMotion?.capturedAt || null,
      itemCount: liveItems.length,
    },
    legacyPowerStack: {
      freshPrimaryCount: freshPrimary.length,
      freshLocalCount: freshLocal.length,
      coveredPrimaryCount: coveredPrimary.length,
      primaryCoveragePct,
      coveredLocalCount: coveredLocal.length,
      uncoveredPortfolioDiscoveryCount: uncoveredLocal.length,
      staleLocalCount: staleLocal.length,
    },
    uncoveredPortfolioDiscovery: uncoveredLocal.map((item) => ({
      id: item.id || null,
      headline: item.headline || "",
      tickers: item.tickers || [],
      sourceUrl: sourceUrl(item),
      linkedTheme: item.linkedTheme || null,
    })),
    guardrails: [
      "Live promoted Motion is canonical and is consumed first.",
      "Power Stack primary/secondary buckets are legacy storage only during migration.",
      "Uncovered local Motion is portfolio-specific discovery, not independent canonical evidence.",
      "Exact URL or normalised-headline overlap is suppressed before local discovery is shown or routed.",
      "No Motion item changes company fundamentals, Base Conviction, ranking, sizing or an action gate by itself.",
    ],
  };
}

const check = process.argv.includes("--check");
const existing = fs.existsSync(OUTPUT) ? JSON.parse(fs.readFileSync(OUTPUT, "utf8")) : null;
const output = build(check ? existing?.generatedAt || null : null);

if (check) {
  if (!existing || JSON.stringify(existing) !== JSON.stringify(output)) {
    console.error("data/motion-migration-shadow.json is stale. Regenerate it with:");
    console.error("node scripts/generate-motion-migration-shadow.mjs");
    process.exitCode = 1;
  } else {
    console.log("Motion migration shadow report matches current Live/local inputs.");
  }
} else {
  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + "\n");
  console.log("Wrote data/motion-migration-shadow.json: " + output.parityState + ".");
}
