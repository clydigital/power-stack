import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const LIVE_PATH = path.join(ROOT, "data", "live-desk-canonical.json");
const LOCAL_PATH = path.join(ROOT, "data", "market-motion.json");
const OUTPUT = path.join(ROOT, "data", "motion-shadow.json");

const CONTRACT = "power-stack-motion-shadow/1";
const SHADOW_HOURS = 48;
const SAFETY_LIMIT = 18;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function normaliseHeadline(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function localSourceUrl(item) {
  return item?.source?.url || item?.sourceUrl || null;
}

function localOccurredAt(item) {
  if (item?.occurredAt && Number.isFinite(Date.parse(item.occurredAt))) {
    return new Date(item.occurredAt).toISOString();
  }
  if (item?.eventDate && /^\d{4}-\d{2}-\d{2}$/.test(item.eventDate)) {
    return new Date(`${item.eventDate}T12:00:00+08:00`).toISOString();
  }
  return null;
}

function isFresh(value, asOfMs) {
  if (!value) return false;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && ms >= asOfMs - SHADOW_HOURS * 60 * 60 * 1_000 && ms <= asOfMs + 60 * 60 * 1_000;
}

function localItem(item, lane) {
  return {
    id: item.id || null,
    lane,
    headline: item.headline || "",
    category: item.category || "OTHER",
    tickers: Array.isArray(item.tickers) ? [...new Set(item.tickers.map((ticker) => String(ticker).toUpperCase()))] : [],
    sourceUrl: localSourceUrl(item),
    sourceName: item?.source?.publisher || item?.sourceName || null,
    occurredAt: localOccurredAt(item),
    linkedTheme: item.linkedTheme || null,
    whyInteresting: item.whyInteresting || null,
    bigPictureBridge: item.bigPictureBridge || null,
  };
}

function liveItem(item) {
  return {
    id: item.id || null,
    headline: item.headline || "",
    category: item.category || "OTHER",
    tickers: Array.isArray(item.tickers) ? [...new Set(item.tickers.map((ticker) => String(ticker).toUpperCase()))] : [],
    sourceUrl: item.sourceUrl || null,
    sourceName: item.sourceName || null,
    occurredAt: item.occurredAt || null,
    storyId: item.storyId || null,
    storyTitle: item.storyTitle || null,
    regimeSlug: item.regimeSlug || null,
    attentionTier: item.attentionTier || "SECONDARY",
    attentionScore: Number(item.attentionScore || 0),
  };
}

function keySet(item) {
  const keys = [];
  if (item.sourceUrl) keys.push(`url:${item.sourceUrl}`);
  const headline = normaliseHeadline(item.headline);
  if (headline) keys.push(`headline:${headline}`);
  return keys;
}

function overlapReason(local, live) {
  if (local.sourceUrl && live.sourceUrl && local.sourceUrl === live.sourceUrl) return "EXACT_SOURCE_URL";
  if (normaliseHeadline(local.headline) && normaliseHeadline(local.headline) === normaliseHeadline(live.headline)) return "NORMALISED_HEADLINE";
  return null;
}

function buildShadow(live, local) {
  const liveItems = (live?.marketMotion?.items || []).slice(0, SAFETY_LIMIT).map(liveItem);
  const asOf =
    live?.marketMotion?.capturedAt
    || live?.syncedAt
    || local?.asOf
    || new Date().toISOString();
  const asOfMs = Number.isFinite(Date.parse(asOf)) ? Date.parse(asOf) : Date.now();

  const localItems = [
    ...(local?.primary || []).map((item) => localItem(item, "PRIMARY")),
    ...(local?.secondary || []).map((item) => localItem(item, "SECONDARY")),
  ]
    .filter((item) => isFresh(item.occurredAt, asOfMs))
    .slice(0, SAFETY_LIMIT);

  const liveKeys = new Map();
  for (const item of liveItems) {
    for (const key of keySet(item)) liveKeys.set(key, item);
  }

  const overlap = [];
  const localOnly = [];
  for (const item of localItems) {
    const matched =
      (item.sourceUrl && liveKeys.get(`url:${item.sourceUrl}`))
      || liveKeys.get(`headline:${normaliseHeadline(item.headline)}`)
      || null;
    if (matched) {
      overlap.push({
        localId: item.id,
        liveId: matched.id,
        headline: item.headline,
        matchReason: overlapReason(item, matched),
        tickers: [...new Set([...(item.tickers || []), ...(matched.tickers || [])])],
      });
    } else {
      localOnly.push(item);
    }
  }

  const localKeys = new Set(localItems.flatMap(keySet));
  const liveOnly = liveItems.filter((item) => !keySet(item).some((key) => localKeys.has(key)));

  const overlapRate = localItems.length ? overlap.length / localItems.length : null;
  return {
    contractVersion: CONTRACT,
    mode: "SHADOW_ONLY",
    generatedAt: new Date(asOfMs).toISOString(),
    freshnessWindowHours: SHADOW_HOURS,
    safetyLimit: SAFETY_LIMIT,
    activeSource: "LIVE_IMMUTABLE_EDITION",
    shadowSource: "POWER_STACK_DISCOVERY",
    liveEditionId: live?.marketMotion?.editionId || null,
    liveCapturedAt: live?.marketMotion?.capturedAt || null,
    summary: {
      liveItemCount: liveItems.length,
      localFreshCandidateCount: localItems.length,
      overlapCount: overlap.length,
      liveOnlyCount: liveOnly.length,
      localOnlyCount: localOnly.length,
      overlapRate: overlapRate === null ? null : Number(overlapRate.toFixed(3)),
    },
    overlap,
    liveOnly,
    localOnly,
    promotionGate: "Shadow-only Power Stack discovery cannot enter active portfolio research priority. A future migration decision must explicitly enable residual discovery after shadow coverage is reviewed.",
    guardrails: [
      "Live immutable Market Motion is the only active short-horizon Motion source for Power Stack during shadow mode.",
      "Power Stack discovery is retained only to measure upstream coverage and identify genuinely portfolio-specific residuals.",
      "Shadow-only items cannot change fundamentals, conviction, ranking, sizing, action gates or research-priority order.",
      "Exact source URL and normalised headline are the only automatic duplicate keys; ticker overlap alone is not treated as duplicate evidence.",
      "No Live-derived conclusion is exported back to Live as independent evidence.",
    ],
  };
}

function stable(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function main() {
  const check = process.argv.includes("--check");
  const live = readJson(LIVE_PATH);
  const local = readJson(LOCAL_PATH);
  const expected = buildShadow(live, local);
  const serialised = stable(expected);

  if (check) {
    const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, "utf8") : "";
    if (current !== serialised) {
      console.error("data/motion-shadow.json is out of date.");
      process.exitCode = 1;
      return;
    }
    console.log("Motion shadow snapshot is current.");
    return;
  }

  fs.writeFileSync(OUTPUT, serialised);
  console.log("Updated data/motion-shadow.json in SHADOW_ONLY mode.");
}

main();
