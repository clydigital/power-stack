import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function source(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

function requireMatch(label, text, pattern) {
  if (!pattern.test(text)) {
    throw new Error(`${label}: required boundary marker is missing: ${pattern}`);
  }
}

function forbidMatch(label, text, pattern) {
  if (pattern.test(text)) {
    throw new Error(`${label}: forbidden Live-Motion scoring path detected: ${pattern}`);
  }
}

const sync = source("scripts/sync-live-desk.mjs");
const overlay = source("scripts/generate-portfolio-live-overlay.mjs");
const sweep = source("scripts/generate-power-sweep.mjs");
const config = source("data/research-sweep-config.json");
const motionSurface = source("motion.html");
const homeSurface = source("index.html");
const shadow = source("scripts/generate-motion-shadow.mjs");

requireMatch("Live sync", sync, /market-motion-edition\/v1/);
requireMatch("Live sync", sync, /normaliseMarketMotion/);
requireMatch("Live sync", sync, /marketMotion/);
requireMatch("Live sync", sync, /MARKET_MOTION_SAFETY_LIMIT = 18/);
requireMatch("Live sync", sync, /attentionTier/);

requireMatch("Portfolio overlay", overlay, /function motionForTicker/);
requireMatch("Portfolio overlay", overlay, /motionContext/);
requireMatch("Portfolio overlay", overlay, /motionLinked/);
requireMatch("Portfolio overlay", overlay, /does not alter overlay state or fundamental score/);

requireMatch("PowerSweep", sweep, /holding\.motionContext\?\.length/);
requireMatch("PowerSweep", sweep, /function liveMotionForTicker/);
requireMatch("PowerSweep", sweep, /liveMotion\.length \? 20 : 0/);
requireMatch("PowerSweep", sweep, /item\.motionContext\?\.length/);

requireMatch("PowerSweep config", config, /only active short-horizon Motion source|Consume immutable promoted Live Market Motion/);
requireMatch("PowerSweep config", config, /AUDIT_ONLY/);
requireMatch("PowerSweep config", config, /motionFreshnessHours"\s*:\s*48/);
requireMatch("PowerSweep config", config, /"freshnessHours"\s*:\s*48/);
requireMatch("PowerSweep config", config, /"uiMode"\s*:\s*"LIVE_ONLY"/);
requireMatch("PowerSweep config", config, /"fallbackPolicy"\s*:\s*"NONE"/);
requireMatch("PowerSweep config", config, /cannot change company fundamentals, Base Conviction, ranking, sizing or an action gate|No Market Motion item changes Base Conviction/);

requireMatch("Motion surface", motionSurface, /LIVE PROMOTED MOTION/);
requireMatch("Motion surface", motionSurface, /There is no local Motion fallback/);
requireMatch("Motion surface", motionSurface, /data\/live-desk-canonical\.json/);
forbidMatch("Motion surface", motionSurface, /data\/market-motion\.json|data\/motion-shadow\.json/);
forbidMatch("Motion surface", motionSurface, /POWER STACK SHADOW|SECONDARY SHADOW|function renderCard|isCoveredByLive|liveKeys/);
requireMatch("Home surface", homeSurface, /LIVE PROMOTED/);
forbidMatch("Home surface", homeSurface, /localItems|data\/market-motion\.json|data\/motion-shadow\.json/);

requireMatch("Motion shadow", shadow, /power-stack-motion-shadow\/1/);
requireMatch("Motion shadow", shadow, /SHADOW_ONLY/);
requireMatch("Motion shadow", shadow, /SHADOW_HOURS = 48/);
requireMatch("Motion shadow", shadow, /SAFETY_LIMIT = 18/);
requireMatch("Motion shadow", shadow, /Shadow-only Power Stack discovery cannot enter active portfolio research priority/);

forbidMatch("Portfolio overlay", overlay, /data\/market-motion\.json|data\/motion-shadow\.json/);
forbidMatch("PowerSweep", sweep, /data\/market-motion\.json|data\/motion-shadow\.json/);

forbidMatch("Portfolio overlay", overlay, /fundamentalScore\s*[:=]\s*[^,\n]*motion/i);
forbidMatch("Portfolio overlay", overlay, /fundamentalGrade\s*[:=]\s*[^,\n]*motion/i);
forbidMatch("PowerSweep", sweep, /(?:score|fundamentalScore|conviction|sizing)\s*[+\-*\/]=\s*[^;\n]*motion/i);
forbidMatch("PowerSweep", sweep, /(?:score|fundamentalScore|conviction|sizing)\s*=\s*[^;\n]*motion/i);

console.log("Live Market Motion boundary is intact: Live-only UI, no local fallback, audit-only legacy comparison, no score/conviction/sizing feedback.");
