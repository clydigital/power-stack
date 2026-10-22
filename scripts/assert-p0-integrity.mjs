import fs from "node:fs";
import assert from "node:assert/strict";
import { assessHoldingTape, assessHoldingTapeRow, screenStockRadarEntry } from "./market-data-integrity.mjs";

const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const tape = read("data/holding-tape.json");
const overlay = read("data/portfolio-live-overlay.json");
const sweep = read("data/power-sweep-latest.json");
const live = read("data/live-desk-canonical.json");
const summary = assessHoldingTape(tape);

assert.equal(sweep.inputHealth.holdingTape.status, summary.status,
  "valid JSON contract alone must never imply fresh quotes");
assert.equal(sweep.inputHealth.holdingTape.currentCount, summary.currentCount);
assert.deepEqual(sweep.inputHealth.holdingTape.stale, summary.stale);

for (const row of tape.holdings) {
  const holding = overlay.holdings.find((item) => item.ticker === row.ticker);
  assert.ok(holding, "all held symbols must remain represented in the overlay");
  const expected = assessHoldingTapeRow(row);
  assert.equal(holding.actualReaction.freshness.status, expected.status, row.ticker);
  if (!expected.eligibleForComparison) {
    assert.notEqual(holding.actualReaction.status, "CONFIRMS", row.ticker);
    assert.notEqual(holding.actualReaction.status, "DIVERGES", row.ticker);
  }
}
assert.equal(sweep.inputHealth.liveDesk.sourceStatus, live.sourceStatus,
  "transport OK cannot hide Dossier degraded state");
assert.deepEqual(sweep.gapReconciliation.gaps.map(x => x.id).sort(),
  [...new Set(sweep.gapReconciliation.gaps.map(x => x.id))].sort(),
  "deduplicated gap inventory must keep stable identifiers");
assert.equal(sweep.gapReconciliation.externallyVerified, false,
  "PS reconciliation may not self-certify market evidence");
assert.deepEqual(sweep.portfolioTriage.tapeDivergences, overlay.reviewQueue.tapeDivergences);
assert.deepEqual(sweep.portfolioTriage.tapeConfirmations, overlay.reviewQueue.tapeConfirmations);

const quarantine = sweep.radarQuarantine || [];
for (const entry of live.stockRadar || []) {
  const check = screenStockRadarEntry(entry);
  const active = sweep.liveRadar.find((item) => item.ticker === entry.symbol);
  if (!check.valid) {
    assert.equal(active, undefined, "invalid ticker/issuer mapping entered active Stock Radar");
    assert.ok(quarantine.some((item) => item.symbol === entry.symbol),
      "invalid ticker/issuer mapping must be visible in quarantine");
  }
}
for (const item of sweep.liveRadar) {
  assert.equal(screenStockRadarEntry({ symbol: item.ticker, companyName: item.companyName }).valid, true);
}
console.log("P0 snapshot checks passed: source-age and issuer-identity guards agree with current inputs.");
