import test from "node:test";
import assert from "node:assert/strict";
import {
  assessHoldingTapeRow, assessHoldingTape, screenStockRadarEntry,
} from "./market-data-integrity.mjs";

const now = new Date("2026-10-20T16:00:00Z");
const usClose = {
  ticker: "XOM", market: "US", status: "CLOSED", sessionDate: "2026-10-19",
  close: 178.28, previousClose: 178.98, changePct: -0.3911, refreshStatus: "OK",
};

test("completed and freshly observed session can be compared", () => {
  const result = assessHoldingTapeRow(usClose, now);
  assert.equal(result.status, "CURRENT");
  assert.equal(result.eligibleForComparison, true);
});

test("retained September closes are stale even when file is generated in October", () => {
  const result = assessHoldingTapeRow({ ...usClose, sessionDate: "2026-09-24" }, now);
  assert.equal(result.status, "STALE");
  assert.equal(result.eligibleForComparison, false);
});

test("weekend does not consume market weekday allowance", () => {
  const monday = new Date("2026-10-19T19:00:00Z");
  assert.equal(assessHoldingTapeRow({ ...usClose, sessionDate: "2026-10-16" }, monday).status, "CURRENT");
});

test("failed refresh cannot masquerade as fresh tape after retaining prior close", () => {
  const result = assessHoldingTapeRow({
    ...usClose, refreshStatus: "FETCH_FAILED", refreshNote: "Refresh failed: fetch failed",
  }, now);
  assert.equal(result.status, "STALE");
  assert.equal(result.eligibleForComparison, false);
});

test("pre-existing failed-refresh rows without refreshStatus are rejected", () => {
  const { refreshStatus, ...legacy } = usClose;
  assert.equal(assessHoldingTapeRow({
    ...legacy, refreshNote: "Refresh failed: fetch failed",
  }, now).status, "STALE");
});

test("missing instrument terms and future/invalid sessions are unresolved", () => {
  assert.equal(assessHoldingTapeRow({ ticker: "6742UW", status: "UNRESOLVED" }, now).status, "UNRESOLVED");
  assert.equal(assessHoldingTapeRow({ ...usClose, sessionDate: "2026-10-21" }, now).status, "UNRESOLVED");
  assert.equal(assessHoldingTapeRow({ ...usClose, sessionDate: "2026-02-30" }, now).status, "UNRESOLVED");
});

test("a structurally valid tape is not OK if its completed prices are stale", () => {
  const tape = assessHoldingTape({
    holdings: [
      { ...usClose, sessionDate: "2026-09-24" },
      { ticker: "6742UW", status: "UNRESOLVED" },
    ],
  }, now);
  assert.equal(tape.status, "STALE");
  assert.equal(tape.currentCount, 0);
  assert.deepEqual(tape.stale, ["XOM"]);
  assert.deepEqual(tape.unresolved, ["6742UW"]);
});

test("CRWD cannot be labelled CoreWeave; CRWV is the CoreWeave ticker", () => {
  assert.equal(screenStockRadarEntry({ symbol: "CRWD", companyName: "CoreWeave (proxy watching)" }).valid, false);
  assert.equal(screenStockRadarEntry({ symbol: "CRWD", companyName: "CrowdStrike Holdings" }).valid, true);
  assert.equal(screenStockRadarEntry({ symbol: "CRWV", companyName: "CoreWeave" }).valid, true);
  assert.equal(screenStockRadarEntry({ symbol: "CRWV", companyName: "CrowdStrike Holdings" }).valid, false);
});

test("XENE cannot be used to represent X Energy", () => {
  assert.equal(screenStockRadarEntry({ symbol: "XENE", companyName: "X Energy" }).valid, false);
  assert.equal(screenStockRadarEntry({ symbol: "XENE", companyName: "Xenon Pharmaceuticals" }).valid, true);
});

test("unknown ticker/name pairs remain unverified, not claimed issuer-verified", () => {
  assert.equal(screenStockRadarEntry({ symbol: "LEU", companyName: "Centrus Energy" }).identityStatus, "NOT_IN_REGISTRY");
  assert.equal(screenStockRadarEntry({ symbol: "???", companyName: "Bad" }).valid, false);
});
