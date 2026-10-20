import fs from "node:fs";
import assert from "node:assert/strict";
const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const tape = read("data/holding-tape.json");
const overlay = read("data/portfolio-live-overlay.json");
const sweep = read("data/power-sweep-latest.json");
const stale = tape.holdings.filter((row) => row.ticker !== "6742UW" && row.sessionDate < "2026-10-01");
assert.ok(stale.length >= 1, "fixture should contain at least one old holding quote");
for (const row of overlay.holdings) {
  if (stale.some((old) => old.ticker === row.ticker)) {
    assert.equal(row.actualReaction.freshness.status, "STALE", row.ticker + " must remain stale");
    assert.notEqual(row.actualReaction.status, "CONFIRMS", row.ticker + " must not confirm on old price");
    assert.notEqual(row.actualReaction.status, "DIVERGES", row.ticker + " must not diverge on old price");
  }
}
assert.notEqual(sweep.inputHealth.holdingTape.status, "OK",
  "valid file contract must not imply current quote observations");
assert.equal(sweep.portfolioTriage.tapeDivergences.length, 0,
  "September prices may not create current divergence records");
assert.equal(sweep.portfolioTriage.tapeConfirmations.length, 0,
  "September prices may not create current confirmation records");
for (const item of sweep.liveRadar) {
  assert.ok(!(item.ticker === "CRWD" && /coreweave/i.test(item.companyName)),
    "CRWD/CoreWeave must not enter active radar");
  assert.ok(!(item.ticker === "XENE" && /x[- ]?energy/i.test(item.companyName)),
    "XENE/X Energy must not enter active radar");
}
assert.ok((sweep.radarQuarantine || []).length >= 2,
  "the two known snapshot issuer conflicts should be reported");
console.log("P0 integration checks passed: stale tape and bad identities are quarantined.");
