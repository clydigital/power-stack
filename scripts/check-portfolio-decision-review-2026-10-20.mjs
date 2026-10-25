import fs from "node:fs";
import assert from "node:assert/strict";

const read = f => JSON.parse(fs.readFileSync(f, "utf8"));
const prev = read("data/portfolio-decision-review-2026-10-18.json");
const updated = read("data/portfolio-decision-review-2026-10-20.json");
const tape = read("data/holding-tape.json");
const live = read("data/live-desk-canonical.json");
const desk = read("data/personal-decision-desk.json");
const ledger = read("data/holdings-fundamentals.json");
const watch = read("data/watchlist.json");

assert.equal(updated.contractVersion, prev.contractVersion);
assert.equal(updated.status, "RESEARCH_ONLY_NOT_EXECUTION_READY");
assert.equal(updated.marketPriceDate, "2026-10-19");
// Historical decision reviews pin the Dossier observed at research time.
// The latest Live snapshot is mutable; its ID must not replace the archived reference.
assert.match(updated.sourceDossierId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
assert.ok(Number.isFinite(Date.parse(updated.sourceDossierAsOf)), "Archived source timestamp required");
assert.ok(Date.parse(updated.sourceDossierAsOf) <= Date.parse(updated.researchAsOf + "T23:59:59Z"), "Archived Dossier cannot postdate its review");
assert.ok(Number.isFinite(Date.parse(live.asOf)), "Current canonical Live timestamp required");
assert.deepEqual(new Set(updated.holdings.map(x => x.ticker)), new Set(prev.holdings.map(x => x.ticker)));
assert.deepEqual(new Set(updated.tradeCandidates.map(x => x.ticker)), new Set(prev.tradeCandidates.map(x => x.ticker)));
assert.equal(updated.holdings.length, 8);
assert.equal(ledger.holdings.length, 8);
assert.equal(watch.candidates.length, 46);
assert.equal(updated.tradeCandidates.length, 7);

for (const item of updated.holdings) {
  const original = prev.holdings.find(x => x.ticker === item.ticker);
  const priceRow = tape.holdings.find(x => x.ticker === item.ticker);
  assert.ok(original && priceRow, item.ticker + ": holdings map incomplete");
  assert.equal(item.quantity, original.quantity, item.ticker + ": quantity was mutated");
  assert.equal(item.averageCost, original.averageCost, item.ticker + ": cost basis was mutated");
  assert.equal(item.quantityVerified, false, item.ticker + ": broker is not verified");
  assert.equal(item.close, priceRow.close, item.ticker + ": close does not match canonical tape");
  assert.equal(item.priceDate, priceRow.sessionDate, item.ticker + ": close session not source-dated");
  assert.equal(item.executionReady, false, item.ticker + ": unauthorised readiness");
  assert.ok(item.primaryEvidence.length > 0 && item.primaryEvidence.every(x => x.startsWith("https://")), item.ticker);
  if (item.ticker !== "6742UW") {
    assert.equal(Number((item.close * item.quantity).toFixed(2)), item.estimatedPositionValue, item.ticker);
  }
}

const warrant = updated.holdings.find(x => x.ticker === "6742UW");
assert.equal(warrant.close, null);
assert.equal(warrant.estimatedPositionValue, null);
assert.equal(updated.warrantResearch.identityVerified, false);
assert.match(updated.warrantResearch.issuerReference.mappingStatus, /NOT_VERIFIED/);
assert.equal(updated.warrantResearch.action, "BLOCKED");

assert.equal(desk.asOf, "2026-10-20");
assert.deepEqual(desk.focus.map(x => x.ticker), ["CF", "BWXT", "ETN", "GRAB", "MU", "VRT", "XYL", "GEHC"]);
assert.equal(desk.focus.filter(x => x.unscored).length, 3);
assert.equal(desk.changePolicy.scoreRevisions, 0);
assert.equal(desk.changePolicy.holdingQuantityChanges, 0);
assert.equal(desk.changePolicy.tradeOrders, 0);
assert.equal(desk.researchInputs.find(x => x.source === "Live macro snapshot").status, "DEGRADED");
assert.ok(desk.previousHeadline && desk.priorEventWindows.length > 0, "history was overwritten");

for (const item of updated.tradeCandidates) {
  assert.equal(item.priceDate, "2026-10-19", item.ticker);
  assert.equal(item.executionReady, false);
  assert.ok(item.primaryEvidenceUrl.startsWith("https://"));
  if (desk.focus.some(x => x.ticker === item.ticker)) {
    assert.equal(desk.focus.find(x => x.ticker === item.ticker).lastCompletedCloseUSD, item.lastClosed);
  }
}
const p=updated.portfolioConcentration.malaysiaEquitySliceApprox;
assert.equal(p.valueMYR, 8925);
assert.equal(p.ytlValueMYR, 5260);
assert.equal(p.ytlPct, 58.94);
assert.ok(p.caveat.includes("2 October") && p.caveat.includes("excludes warrant"));
console.log("Portfolio decision reconciliation QC OK: 8 holdings, 7 candidates, unchanged scores/positions, warrant blocked, current dated prices.");
