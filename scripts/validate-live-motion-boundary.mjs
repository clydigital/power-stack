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
const localMotion = source("data/market-motion.json");
const parityShadow = source("scripts/generate-motion-migration-shadow.mjs");
const motionSurface = source("motion.html");
const homeSurface = source("index.html");

requireMatch("Live sync", sync, /market-motion-edition\/v1/);
requireMatch("Live sync", sync, /normaliseMarketMotion/);
requireMatch("Live sync", sync, /marketMotion/);
requireMatch("Live sync", sync, /LIVE_MOTION_SAFETY_LIMIT\s*=\s*18/);

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
requireMatch("PowerSweep config", config, /"motionLiveSafetyItems"\s*:\s*18/);
requireMatch("PowerSweep config", config, /"motionFreshnessHours"\s*:\s*48/);
requireMatch("Local Motion", localMotion, /"freshnessWindowHours"\s*:\s*48/);
requireMatch("Local Motion", localMotion, /"ownershipMode"\s*:\s*"LIVE_FIRST_SHADOW_LOCAL"/);
requireMatch("Parity shadow", parityShadow, /power-stack-motion-parity-shadow\/1/);
requireMatch("Parity shadow", parityShadow, /legacyPowerStack/);
requireMatch("Parity shadow", parityShadow, /migrationDecision/);

requireMatch("Motion surface", motionSurface, /LIVE PROMOTED MOTION/);
requireMatch("Motion surface", motionSurface, /POWER STACK SHADOW DISCOVERY/);
requireMatch("Motion surface", motionSurface, /isCoveredByLive/);
requireMatch("Motion surface", motionSurface, /liveKeys/);
requireMatch("Motion surface", motionSurface, /localDiscovery/);
requireMatch("Home surface", homeSurface, /LIVE PROMOTED/);
requireMatch("Home surface", homeSurface, /liveUrls/);
requireMatch("Home surface", homeSurface, /liveHeadlines/);
requireMatch("Home surface", homeSurface, /homePreviewMax/);
requireMatch("Home surface", homeSurface, /mm\.secondary/);

forbidMatch("Portfolio overlay", overlay, /fundamentalScore\s*[:=]\s*[^,\n]*motion/i);
forbidMatch("Portfolio overlay", overlay, /fundamentalGrade\s*[:=]\s*[^,\n]*motion/i);
forbidMatch("PowerSweep", sweep, /(?:score|fundamentalScore|conviction|sizing)\s*[+\-*\/]=\s*[^;\n]*motion/i);
forbidMatch("PowerSweep", sweep, /(?:score|fundamentalScore|conviction|sizing)\s*=\s*[^;\n]*motion/i);
forbidMatch("Live sync", sync, /motion\.items\.slice\(0,\s*6\)/);
forbidMatch("Portfolio overlay", overlay, /motionForTicker[\s\S]{0,300}slice\(0,\s*3\)/);
forbidMatch("PowerSweep", sweep, /liveMotionForTicker[\s\S]{0,300}slice\(0,\s*3\)/);
forbidMatch("PowerSweep config", config, /"motionPromotedItems"/);
forbidMatch("PowerSweep config", config, /"motionPrimaryMax"/);
forbidMatch("PowerSweep config", config, /"motionFreshnessHours"\s*:\s*72/);
forbidMatch("Local Motion", localMotion, /"freshnessWindowHours"\s*:\s*72/);
forbidMatch("Motion surface", motionSurface, /freshnessWindowHours\s*\|\|\s*72/);
forbidMatch("Motion surface", motionSurface, /secondaryMotion/);
forbidMatch("Home surface", homeSurface, /marketMotion\?\.items\|\|\[\]\)\.slice\(0,\s*3\)/);

console.log("Live Market Motion ownership is intact: Live-first 48h/18 safety contract, PS shadow discovery only, no score/conviction/sizing feedback.");
