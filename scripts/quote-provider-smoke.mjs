import { CHART_HOSTS, fetchYahooChart } from "./quote-chart-source.mjs";

const specs = [
  { ticker: "XOM", providerSymbol: "XOM", market: "US", currency: "USD", timeZone: "America/New_York" },
  { ticker: "YTLPOWR", providerSymbol: "6742.KL", market: "MY", currency: "MYR", timeZone: "Asia/Kuala_Lumpur" },
];
let succeeded = 0;
for (const spec of specs) {
  for (const host of CHART_HOSTS) {
    try {
      const row = await fetchYahooChart(spec, host, { timeoutMs: 6000 });
      console.log(spec.ticker + " " + new URL(host).hostname + " OK " + row.sessionDate);
      succeeded++;
      break;
    } catch (error) {
      console.log(spec.ticker + " " + new URL(host).hostname + " unavailable: " + String(error.message).slice(0, 90));
    }
  }
}
console.log("Provider smoke result: " + succeeded + " / " + specs.length + " markets");
