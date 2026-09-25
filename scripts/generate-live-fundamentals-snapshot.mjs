import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_PATH = path.join(ROOT, "data/live-fundamentals-export-config.json");
const OUTPUT_PATH = path.join(ROOT, "data/live-fundamentals-snapshot.json");
const CONTRACT = "power-stack-fundamentals/v1";

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
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

function nullableNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildSnapshot({ asOf, sourceCommit }) {
  const config = readJson(path.relative(ROOT, CONFIG_PATH));
  if (config.contractVersion !== "power-stack-fundamentals-export-config/v1") {
    throw new Error("Unsupported fundamentals export config.");
  }
  const ideasPacket = readJson(config.sourceIdeasFile);
  const ideas = new Map((ideasPacket.newIdeas || []).map((idea) => [String(idea.ticker).toUpperCase(), idea]));

  const companies = config.tickers.map((rawTicker) => {
    const ticker = String(rawTicker).toUpperCase();
    const idea = ideas.get(ticker);
    if (!idea) throw new Error(`Missing base research idea for ${ticker} in ${config.sourceIdeasFile}`);
    return {
      ticker,
      name: idea.name,
      market: idea.market || null,
      region: idea.region || null,
      themeGroup: idea.themeGroup || null,
      theme: idea.theme || null,
      baseConviction: Number(idea.conviction),
      status: idea.status || null,
      thesis: idea.thesis || null,
      catalysts: idea.catalysts || null,
      risks: idea.risks || null,
      qualityProfile: {
        aiRisk: nullableNumber(idea.aiRisk),
        themeDependency: nullableNumber(idea.themeDependency),
        cyclicality: nullableNumber(idea.cyclicality),
        speculation: nullableNumber(idea.speculation),
      },
      lastUpdated: idea.lastUpdated || null,
    };
  });

  return {
    contractVersion: CONTRACT,
    snapshotAt: asOf,
    sourceCommit,
    companies,
    sourceFiles: [config.sourceIdeasFile],
    guardrails: [
      "This packet contains Power Stack-owned company research only.",
      "It excludes Live Desk-derived macro signals, macro adjustments, adjusted scores and industry macro risk.",
      "Live may use this packet as independent company-level context, but must not treat it as confirmation of Live's own monetary or regime state.",
    ],
  };
}

const args = parseArgs(process.argv.slice(2));
const existing = fs.existsSync(OUTPUT_PATH) ? JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8")) : null;
const asOf = args.asOf || (args.check && existing?.snapshotAt) || new Date().toISOString();
if (!Number.isFinite(Date.parse(asOf))) throw new Error(`Invalid --as-of timestamp: ${asOf}`);
const sourceCommit = args.check && existing?.sourceCommit ? existing.sourceCommit : gitHead();
const snapshot = buildSnapshot({ asOf, sourceCommit });

if (args.check) {
  if (!existing || JSON.stringify(existing) !== JSON.stringify(snapshot)) {
    console.error("data/live-fundamentals-snapshot.json is stale. Regenerate it with:");
    console.error(`node scripts/generate-live-fundamentals-snapshot.mjs --as-of=${asOf}`);
    process.exitCode = 1;
  } else {
    console.log("Live fundamentals snapshot matches the committed Power Stack inputs.");
  }
} else {
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, OUTPUT_PATH)} at ${asOf}.`);
}
