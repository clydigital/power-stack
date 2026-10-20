import test from "node:test";
import assert from "node:assert/strict";
import {
  parseYahooDailyBars, fetchYahooChart, parseFinnhubUSQuote, fetchFinnhubUSQuote,
  CHART_HOSTS,
} from "./quote-chart-source.mjs";
const US = { ticker: "XOM", providerSymbol: "XOM", market: "US", currency: "USD", timeZone: "America/New_York" };
const MY = { ticker: "YTLPOWR", providerSymbol: "6742.KL", market: "MY", currency: "MYR", timeZone: "Asia/Kuala_Lumpur" };
const ts = x => Date.parse(x) / 1000;
const body = (symbol, currency, dates, prices) => ({
  chart: { result: [{ meta: { symbol, currency }, timestamp: dates.map(ts), indicators: { quote: [{ close: prices }] } }], error: null },
});
const usBars = body("XOM", "USD", ["2026-10-16T13:30:00Z","2026-10-19T13:30:00Z","2026-10-20T13:30:00Z"],[175,178,200]);

test("US chart bars use source dates, not fabricated latest date during regular session", () => {
  const row=parseYahooDailyBars(usBars,US,new Date("2026-10-20T16:00:00Z"));
  assert.equal(row.sessionDate,"2026-10-19");
  assert.equal(row.close,178);
  assert.equal(row.previousClose,175);
  assert.equal(row.refreshStatus,"OK");
});
test("same-day US bar becomes eligible only after regular session closes",()=>{
  const row=parseYahooDailyBars(usBars,US,new Date("2026-10-20T22:00:00Z"));
  assert.equal(row.sessionDate,"2026-10-20");
  assert.equal(row.close,200);
});
test("MY chart bars are keyed by Kuala Lumpur session, and intraday bar is excluded",()=>{
  const feed=body("6742.KL","MYR",["2026-10-16T01:00:00Z","2026-10-19T01:00:00Z","2026-10-20T01:00:00Z"],[4.8,5.0,5.2]);
  const row=parseYahooDailyBars(feed,MY,new Date("2026-10-20T08:00:00Z"));
  assert.equal(row.sessionDate,"2026-10-19");
  assert.equal(row.close,5);
  assert.equal(row.currency,"MYR");
});
test("source identity and currency mismatches fail closed",()=>{
  assert.throws(()=>parseYahooDailyBars(body("TSLA","USD",["2026-10-16T13:30:00Z","2026-10-19T13:30:00Z"],[10,12]),US),/different symbol/);
  assert.throws(()=>parseYahooDailyBars(body("XOM","MYR",["2026-10-16T13:30:00Z","2026-10-19T13:30:00Z"],[10,12]),US),/currency mismatch/);
});
test("invalid bars or fewer than two completed sessions cannot become fresh",()=>{
  assert.throws(()=>parseYahooDailyBars(body("XOM","USD",["2026-10-19T13:30:00Z"],[null]),US),/fewer than two/);
});
test("Yahoo adapter enforces allowlisted hostname, records source and snapshot date",async()=>{
  const responses=[];
  const fetcher=async(url,opts)=>{responses.push({url,opts});return {ok:true,json:async()=>usBars};};
  const now=new Date("2026-10-20T16:00:00Z");
  const row=await fetchYahooChart(US,CHART_HOSTS[0],{fetcher,now});
  assert.equal(row.close,178);
  assert.equal(row.fetchedAt,now.toISOString());
  assert.match(row.sourceUrl,/query2/);
  assert.match(responses[0].opts.headers.accept,/json/);
  await assert.rejects(fetchYahooChart(US,"https://evil.test",{fetcher,now}),/Unrecognised/);
});
test("Finnhub requires a timestamped US close rather than an intraday quote",()=>{
  const now=new Date("2026-10-20T20:30:00Z");
  const closeTime=ts("2026-10-19T20:00:00Z");
  const row=parseFinnhubUSQuote({c:178,pc:175,t:closeTime},US,now);
  assert.equal(row.sessionDate,"2026-10-19");
  assert.equal(row.close,178);
  assert.throws(()=>parseFinnhubUSQuote({c:180,pc:178,t:ts("2026-10-20T18:00:00Z")},US,now),/not after the regular-session close/);
  assert.throws(()=>parseFinnhubUSQuote({c:180,pc:178,t:closeTime},MY,now),/US-only/);
});
test("Finnhub fallback does not put API tokens in the persisted source URL",async()=>{
  const now=new Date("2026-10-20T20:30:00Z");
  const row=await fetchFinnhubUSQuote(US,"secret-sentinel",{now,fetcher:async(url)=>({
    ok:true,json:async()=>({c:178,pc:175,t:ts("2026-10-19T20:00:00Z")}),
  })});
  assert.ok(!JSON.stringify(row).includes("secret-sentinel"));
  assert.match(row.sourceUrl,/finnhub.io\/api\/v1\/quote/);
});
