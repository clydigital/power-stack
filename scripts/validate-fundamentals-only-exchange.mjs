import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const retiredPaths = [
  "data/live-rating-snapshot.json",
  "data/live-rating-export-config.json",
  "scripts/generate-live-rating-snapshot.mjs",
  "industry-risk.js",
];

for (const relative of retiredPaths) {
  if (fs.existsSync(path.join(ROOT, relative))) {
    throw new Error(`Legacy macro-rating path must remain retired: ${relative}`);
  }
}

function source(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

function requireMatch(label, text, pattern) {
  if (!pattern.test(text)) {
    throw new Error(`${label}: required fundamentals-only boundary marker missing: ${pattern}`);
  }
}

function forbidMatch(label, text, pattern) {
  if (pattern.test(text)) {
    throw new Error(`${label}: legacy macro-rating path detected: ${pattern}`);
  }
}

const app = source("app.js");
const readme = source("README.md");
const methodology = source("data/macro-methodology.json");
const fundamentals = source("scripts/generate-live-fundamentals-snapshot.mjs");
const overlay = source("scripts/generate-portfolio-live-overlay.mjs");
const sweep = source("scripts/generate-power-sweep.mjs");

requireMatch("App", app, /data\/live-desk-canonical\.json/);
requireMatch("App", app, /data\/macro-sensitivities\.json/);
requireMatch("Fundamentals export", fundamentals, /power-stack-fundamentals\/v1/);
requireMatch("README", readme, /only supported Power Stack → Live company-research contract/);
requireMatch("Portfolio overlay", overlay, /power-stack-portfolio-live-overlay\/1/);
requireMatch("PowerSweep", sweep, /data\/live-desk-canonical\.json/);

forbidMatch("App", app, /fetch\(['"]data\/macro-context\.json/);
forbidMatch("App", app, /macroContext|contextSignalContributions|macroAdjustment|currentRating/);
forbidMatch("Methodology", methodology, /legacyStockScoring|macroAdjustmentCap|Current rating = Base Conviction/);

for (const [label, text] of [
  ["README", readme],
  ["App", app],
  ["Fundamentals export", fundamentals],
  ["Portfolio overlay", overlay],
  ["PowerSweep", sweep],
]) {
  forbidMatch(label, text, /power-stack-rating-snapshot\/v1|live-rating-snapshot\.json|live-rating-export-config\.json|generate-live-rating-snapshot\.mjs/);
}

console.log("Fundamentals-only Live exchange boundary is intact: no legacy macro-adjusted rating export or active macro-context scoring path.");
