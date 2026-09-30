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

requireMatch("Live sync", sync, /market-motion-edition\/v1/);
requireMatch("Live sync", sync, /normaliseMarketMotion/);
requireMatch("Live sync", sync, /marketMotion/);

requireMatch("Portfolio overlay", overlay, /function motionForTicker/);
requireMatch("Portfolio overlay", overlay, /motionContext/);
requireMatch("Portfolio overlay", overlay, /motionLinked/);
requireMatch("Portfolio overlay", overlay, /does not alter overlay state or fundamental score/);

requireMatch("PowerSweep", sweep, /holding\.motionContext\?\.length/);
requireMatch("PowerSweep", sweep, /function liveMotionForTicker/);
requireMatch("PowerSweep", sweep, /liveMotion\.length \? 20 : 0/);
requireMatch("PowerSweep", sweep, /item\.motionContext\?\.length/);

requireMatch("PowerSweep config", config, /Consume immutable promoted Live Market Motion/);
requireMatch("PowerSweep config", config, /cannot change company fundamentals, Base Conviction, ranking, sizing or an action gate/);

requireMatch("Motion surface", motionSurface, /LIVE PROMOTED MOTION/);
requireMatch("Motion surface", motionSurface, /POWER STACK DISCOVERY/);
requireMatch("Motion surface", motionSurface, /isCoveredByLive/);
requireMatch("Motion surface", motionSurface, /liveKeys/);
requireMatch("Home surface", homeSurface, /LIVE PROMOTED/);
requireMatch("Home surface", homeSurface, /liveUrls/);
requireMatch("Home surface", homeSurface, /liveHeadlines/);

forbidMatch("Portfolio overlay", overlay, /fundamentalScore\s*[:=]\s*[^,\n]*motion/i);
forbidMatch("Portfolio overlay", overlay, /fundamentalGrade\s*[:=]\s*[^,\n]*motion/i);
forbidMatch("PowerSweep", sweep, /(?:score|fundamentalScore|conviction|sizing)\s*[+\-*\/]=\s*[^;\n]*motion/i);
forbidMatch("PowerSweep", sweep, /(?:score|fundamentalScore|conviction|sizing)\s*=\s*[^;\n]*motion/i);

console.log("Live Market Motion boundary is intact: research priority only, no score/conviction/sizing feedback.");
