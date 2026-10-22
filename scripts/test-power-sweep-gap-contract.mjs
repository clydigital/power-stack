import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
 assessLiveDeskInput, classifyPowerStackGap, reconcilePowerStackGaps,
} from "./power-sweep-gap-contract.mjs";

const at = new Date("2026-10-23T03:00:00Z");
const live = {
 contractVersion:"power-stack-live-desk-canonical/2",
 sourceStatus:"degraded_latest",
 asOf:"2026-10-22T15:05:32Z", syncedAt:"2026-10-22T17:15:12Z",
 dossierId:"a138327b-93d7-4be4-b12a-7c8942940abe",
 regime:{family:"RATES_LED_TIGHTENING"},
 sourceHealth:{dossier:"DEGRADED",marketMonitor:"PARTIAL",fredRates:"OK",nyFedPrimaryDealers:"STALE",treasurySupply:"UNRESOLVED"},
 researchGaps:[
  "DATA: Missing canonical intraday Fed-funds-futures and 5m–30m UST 2Y/10Y bars plus canonical MOVE/Treasury-volatility series",
  "Latest primary-dealer report date 2026-10-07 is more than fourteen calendar days old.",
  "Treasury supply/auction state is not yet resolved from verified Live rate evidence.",
 ],
};
test("a successfully synced degraded Dossier cannot masquerade as OK",()=>{
 const result=assessLiveDeskInput(live,at);
 assert.equal(result.status,"PARTIAL");
 assert.equal(result.sourceStatus,"degraded_latest");
 assert.equal(result.sourceHealth.nyFedPrimaryDealers,"STALE");
 assert.equal(result.sourceHealth.treasurySupply,"UNRESOLVED");
 assert.ok(result.reasons.includes("UPSTREAM_EVIDENCE_PARTIAL"));
 assert.equal(assessLiveDeskInput({...live, sourceStatus:"healthy",sourceHealth:{dossier:"OK",marketMonitor:"OK",fredRates:"OK",nyFedPrimaryDealers:"OK",treasurySupply:"OK"}},at).status,"OK");
 assert.equal(assessLiveDeskInput({...live,sourceStatus:"unavailable"},at).status,"BLOCKING");
 assert.equal(assessLiveDeskInput({...live,asOf:"2026-10-19T00:00:00Z"},at).status,"BLOCKING");
 assert.equal(assessLiveDeskInput({...live,dossierId:null},at).status,"BLOCKING");
 assert.equal(assessLiveDeskInput({...live,contractVersion:"unknown"},at).status,"BLOCKING");
});
test("four PS gaps are routed without fabricating repairs, prices or market evidence",()=>{
 const out=reconcilePowerStackGaps({live,researchGaps:[...live.researchGaps,"Holding tape unresolved: 6742UW"],tape:{unresolved:["6742UW"]}});
 assert.deepEqual(out.gaps.map(x=>x.id),["INTRADAY_RATES","PRIMARY_DEALERS","TREASURY_SUPPLY","WARRANT_6742UW"]);
 assert.equal(out.gaps[2].state,"EVIDENCE_PRESENT_INTERPRETATION_UNRESOLVED");
 assert.equal(out.gaps[3].state,"INSTRUMENT_NOT_VERIFIED");
 assert.equal(out.resolvedByReconciliation,0);
 assert.equal(out.externallyVerified,false);
 assert.ok(out.gaps.every(x=>!x.isClosed));
 assert.equal(classifyPowerStackGap("arbitrary manual note").state,"UNCLASSIFIED_REQUIRES_SOURCE_CHECK");
});
test("current stored Power Stack snapshot is degraded regardless of successful sync",()=>{
 const fixture=JSON.parse(fs.readFileSync("data/live-desk-canonical.json","utf8"));
 assert.equal(fixture.contractVersion,"power-stack-live-desk-canonical/2");
 assert.equal(fixture.sourceStatus,"degraded_latest");
 const check=assessLiveDeskInput(fixture,new Date("2026-10-23T03:00:00Z"));
 assert.equal(check.status,"PARTIAL");
 assert.equal(reconcilePowerStackGaps({live:fixture,tape:{unresolved:["6742UW"]}}).gaps.length,4);
});
