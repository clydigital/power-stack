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

requireMatch("PowerSweep config", config, /Consume immutable promoted Live Market Motion/);
requireMatch("PowerSweep config", config, /SHADOW_ONLY/);
requireMatch("PowerSweep config", config, /motionFreshnessHours"\s*:\s*48/);
requireMatch("PowerSweep config", config, /cannot change company fundamentals, Base Conviction, ranking, sizing or an action gate|Shadow-only discovery/);

requireMatch("Motion surface", motionSurface, /LIVE PROMOTED MOTION/);
requireMatch("Motion surface", motionSurface, /POWER STACK DISCOVERY/);
requireMatch("Motion surface", motionSurface, /isCoveredByLive/);
requireMatch("Motion surface", motionSurface, /liveKeys/);
requireMatch("Home surface", homeSurface, /LIVE PROMOTED/);
requireMatch("Home surface", homeSurface, /liveUrls/);
requireMatch("Home surface", homeSurface, /LIVE PROMOTED/);

requireMatch("Motion shadow", shadow, /power-stack-motion-shadow\/1/);
requireMatch("Motion shadow", shadow, /SHADOW_ONLY/);
requireMatch("Motion shadow", shadow, /SHADOW_HOURS = 48/);
requireMatch("Motion shadow", shadow, /SAFETY_LIMIT = 18/);
requireMatch("Motion shadow", shadow, /Shadow-only Power Stack discovery cannot enter active portfolio research priority/);

forbidMatch("Portfolio overlay", overlay, /fundamentalScore\s*[:=]\s*[^,\n]*motion/i);
forbidMatch("Portfolio overlay", overlay, /fundamentalGrade\s*[:=]\s*[^,\n]*motion/i);
forbidMatch("PowerSweep", sweep, /(?:score|fundamentalScore|conviction|sizing)\s*[+\-*\/]=\s*[^;\n]*motion/i);
forbidMatch("PowerSweep", sweep, /(?:score|fundamentalScore|conviction|sizing)\s*=\s*[^;\n]*motion/i);

console.log("Live Market Motion boundary is intact: research priority only, no score/conviction/sizing feedback.");
