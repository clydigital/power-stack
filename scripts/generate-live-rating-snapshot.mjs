import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_PATH = path.join(ROOT, "data/live-rating-export-config.json");
const OUTPUT_PATH = path.join(ROOT, "data/live-rating-snapshot.json");
const CONTRACT = "power-stack-rating-snapshot/v1";
const MAX_PACKET_HOURS = 168;

const INDUSTRIES = {
  "AI / Data Centres": [
    ["financialConditions", "low", 1.4],
    ["industrialCapex", "low", 1.3],
    ["riskAppetite", "low", 1.0],
    ["inputCostPressure", "high", 0.7],
    ["creditAvailability", "low", 0.8],
  ],
  Semiconductors: [
    ["financialConditions", "low", 1.2],
    ["industrialCapex", "low", 1.1],
    ["growthDemand", "low", 1.0],
    ["riskAppetite", "low", 1.0],
    ["inputCostPressure", "high", 0.5],
  ],
};

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, decimals) {
  const scale = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function ageHours(value, asOf) {
  const observed = Date.parse(value || "");
  return Number.isFinite(observed) ? (Date.parse(asOf) - observed) / 36e5 : Infinity;
}

function packetFresh(macro, asOf) {
  const max = Number(macro.packetStaleAfterHours || MAX_PACKET_HOURS);
  return ageHours(macro.generatedAt, asOf) <= max;
}

function channelFresh(channel, macro, asOf) {
  if (!channel || !packetFresh(macro, asOf) || channel.fresh === false) return false;
  const max = Number(channel.staleAfterHours || macro.packetStaleAfterHours || MAX_PACKET_HOURS);
  return ageHours(channel.observedAt || macro.generatedAt, asOf) < max;
}

function channelFreshnessWeight(channel, macro, asOf) {
  if (!channelFresh(channel, macro, asOf)) return 0;
  const max = Number(channel.staleAfterHours || macro.packetStaleAfterHours || MAX_PACKET_HOURS);
  return clamp(1 - 0.35 * (ageHours(channel.observedAt || macro.generatedAt, asOf) / max), 0.65, 1);
}

function macroAdjustment(profile, macro, asOf) {
  if (!profile || !packetFresh(macro, asOf)) return 0;
  const channels = new Map((macro.channels || []).map((channel) => [channel.key, channel]));
  const fw = Number(profile.fundamentalWeight ?? 0.65);
  const mw = Number(profile.marketWeight ?? 0.35);
  const pc = clamp(Number(profile.profileConfidence ?? 0.5), 0, 1);
  let total = 0;

  for (const [key, factor] of Object.entries(profile.factors || {})) {
    const channel = channels.get(key);
    if (!channel || !channelFresh(channel, macro, asOf) || Number(factor.weight || 0) <= 0) continue;
    const fundamental = clamp(Number(factor.fundamental || 0), -5, 5);
    const market = clamp(Number(factor.market || 0), -5, 5);
    const effective = (fw * fundamental + mw * market) / 5;
    const factorConfidence = clamp(Number(factor.confidence ?? 0.5), 0, 1);
    const channelConfidence = clamp(Number(channel.confidence ?? 0.5), 0, 1);
    total += (Number(channel.score || 0) / 2)
      * effective
      * Number(factor.weight || 0)
      * factorConfidence
      * pc
      * channelConfidence
      * channelFreshnessWeight(channel, macro, asOf);
  }
  return clamp(total, -1, 1);
}

function riskClass(score) {
  if (score < 35) return "Low";
  if (score < 50) return "Moderate";
  if (score < 65) return "Elevated";
  if (score < 80) return "High";
  return "Severe";
}

function industryRisk(bucket, macro, asOf) {
  const factors = INDUSTRIES[bucket];
  if (!factors) return null;
  const channels = new Map((macro.channels || []).map((channel) => [channel.key, channel]));
  let weighted = 0;
  let totalWeight = 0;
  const drivers = [];

  for (const [key, mode, weight] of factors) {
    const channel = channels.get(key);
    if (!channel || !channelFresh(channel, macro, asOf)) continue;
    const signal = (mode === "high" ? Number(channel.score || 0) : -Number(channel.score || 0))
      * Number(channel.confidence ?? 1);
    const impact = signal * weight;
    weighted += impact;
    totalWeight += weight;
    drivers.push({ label: channel.label || key, impact });
  }

  const average = totalWeight ? weighted / totalWeight : 0;
  const score = clamp(50 + average * 22, 0, 100);
  const pressures = drivers
    .filter((driver) => driver.impact > 0.1)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 2)
    .map((driver) => driver.label);
  const offsets = drivers
    .filter((driver) => driver.impact < -0.1)
    .sort((a, b) => a.impact - b.impact)
    .slice(0, 2)
    .map((driver) => driver.label);

  return {
    industry: bucket,
    score: Math.round(score),
    label: riskClass(score),
    asOf,
    pressures,
    offsets,
  };
}

function gitHead() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "unknown-local-source";
  }
}

function parseArgs(argv) {
  const check = argv.includes("--check");
  const asOfArg = argv.find((arg) => arg.startsWith("--as-of="));
  return { check, asOf: asOfArg ? asOfArg.slice("--as-of=".length) : null };
}

function buildSnapshot({ asOf, sourceCommit }) {
  const config = readJson(path.relative(ROOT, CONFIG_PATH));
  const ideasPacket = readJson(config.baseIdeasFile);
  const macro = readJson(config.macroContextFile);
  const profilesPacket = readJson(config.macroProfilesFile);
  const ideas = new Map((ideasPacket.newIdeas || []).map((idea) => [String(idea.ticker).toUpperCase(), idea]));
  const profiles = new Map((profilesPacket.stocks || []).map((profile) => [String(profile.ticker).toUpperCase(), profile]));

  const ratings = config.tickers.map((entry) => {
    const ticker = String(entry.ticker).toUpperCase();
    const idea = ideas.get(ticker);
    const profile = profiles.get(ticker);
    if (!idea) throw new Error(`Missing base research idea for ${ticker} in ${config.baseIdeasFile}`);
    if (!profile) throw new Error(`Missing macro sensitivity profile for ${ticker} in ${config.macroProfilesFile}`);
    const adjustment = macroAdjustment(profile, macro, asOf);
    const risk = entry.industryRiskBucket ? industryRisk(entry.industryRiskBucket, macro, asOf) : null;
    return {
      ticker,
      name: idea.name,
      themeGroup: idea.themeGroup,
      researchScore: Number(idea.conviction),
      macroAdjustment: round(adjustment, 2),
      adjustedScore: round(clamp(Number(idea.conviction) + adjustment, 0, 10), 1),
      industryMacroRisk: risk,
      ...(entry.industryRiskNote ? { industryRiskNote: entry.industryRiskNote } : {}),
    };
  });

  return {
    contractVersion: CONTRACT,
    snapshotAt: asOf,
    sourceCommit,
    macroContextGeneratedAt: macro.generatedAt,
    macroProfileUpdatedAt: profilesPacket.updatedAt,
    methodology: {
      name: "Power Stack Macro Pulse v4 stock scoring",
      version: 2,
      fundamentalWeight: 0.65,
      marketWeight: 0.35,
      macroAdjustmentCap: 1.0,
      freshness: "Fresh channels decay by 0.35 * (ageHours / staleAfterHours), floored at 0.65 while the channel remains fresh; stale channels contribute zero.",
      formula: "contribution_i = (channelScore_i / 2) * ((0.65 * fundamentalSensitivity_i + 0.35 * marketSensitivity_i) / 5) * factorWeight_i * factorConfidence_i * profileConfidence * channelConfidence * freshnessWeight_i",
      industryRisk: "50 = neutral macro risk; weighted live channel pressure is mapped to 0-100. Higher is more hostile. This is separate from stock research score and Story confidence.",
    },
    ratings,
    sourceFiles: [
      config.baseIdeasFile,
      config.macroContextFile,
      config.macroProfilesFile,
      config.macroMethodologyFile,
      "app.js",
      "industry-risk.js",
    ],
  };
}

const args = parseArgs(process.argv.slice(2));
const existing = fs.existsSync(OUTPUT_PATH) ? JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8")) : null;
const asOf = args.asOf || (args.check && existing?.snapshotAt) || new Date().toISOString();
if (!Number.isFinite(Date.parse(asOf))) throw new Error(`Invalid --as-of timestamp: ${asOf}`);
const sourceCommit = args.check && existing?.sourceCommit ? existing.sourceCommit : gitHead();
const snapshot = buildSnapshot({ asOf, sourceCommit });
const rendered = `${JSON.stringify(snapshot, null, 2)}\n`;

if (args.check) {
  if (!existing || JSON.stringify(existing) !== JSON.stringify(snapshot)) {
    console.error("data/live-rating-snapshot.json is stale. Regenerate it with:");
    console.error(`node scripts/generate-live-rating-snapshot.mjs --as-of=${asOf}`);
    process.exitCode = 1;
  } else {
    console.log("Live rating snapshot matches the committed Power Stack inputs.");
  }
} else {
  fs.writeFileSync(OUTPUT_PATH, rendered);
  console.log(`Wrote ${path.relative(ROOT, OUTPUT_PATH)} at ${asOf}.`);
}
