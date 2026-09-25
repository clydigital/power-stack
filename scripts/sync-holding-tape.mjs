import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = path.join(ROOT, "data/holding-tape.json");
const CONTRACT = "power-stack-holding-tape/1";

const SPECS = [
  { ticker: "XOM", providerSymbol: "XOM", market: "US", currency: "USD", timeZone: "America/New_York", url: "https://finance.yahoo.com/quote/XOM/" },
  { ticker: "MISC", providerSymbol: "3816.KL", market: "MY", currency: "MYR", timeZone: "Asia/Kuala_Lumpur", url: "https://sg.finance.yahoo.com/quote/3816.KL/" },
  { ticker: "HIBISCS", providerSymbol: "5199.KL", market: "MY", currency: "MYR", timeZone: "Asia/Kuala_Lumpur", url: "https://sg.finance.yahoo.com/quote/5199.KL/" },
  { ticker: "YTLPOWR", providerSymbol: "6742.KL", market: "MY", currency: "MYR", timeZone: "Asia/Kuala_Lumpur", url: "https://sg.finance.yahoo.com/quote/6742.KL/" },
  { ticker: "TTWO", providerSymbol: "TTWO", market: "US", currency: "USD", timeZone: "America/New_York", url: "https://finance.yahoo.com/quote/TTWO/" },
  { ticker: "TSLA", providerSymbol: "TSLA", market: "US", currency: "USD", timeZone: "America/New_York", url: "https://finance.yahoo.com/quote/TSLA/" },
  { ticker: "DAYANG", providerSymbol: "5141.KL", market: "MY", currency: "MYR", timeZone: "Asia/Kuala_Lumpur", url: "https://sg.finance.yahoo.com/quote/5141.KL/" },
];

const Warrant = {
  ticker: "6742UW",
  providerSymbol: null,
  market: "MY",
  sessionDate: null,
  currency: "MYR",
  close: null,
  previousClose: null,
  change: null,
  changePct: null,
  closeNotice: null,
  sourceName: null,
  sourceUrl: null,
  status: "UNRESOLVED",
  reason: "Standalone warrant symbol/terms not yet verified. Track parent YTLPOWR separately.",
};

function existingTape() {
  if (!fs.existsSync(OUTPUT)) return null;
  return JSON.parse(fs.readFileSync(OUTPUT, "utf8"));
}

function previousByTicker(existing) {
  return new Map((existing?.holdings || []).map((item) => [item.ticker, item]));
}

function num(raw) {
  if (raw == null) return null;
  const parsed = Number(String(raw).replace(/[,+()%]/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function extract(html, testid) {
  const pattern = new RegExp('data-testid="' + testid + '"[^>]*>([^<]+)<', "i");
  return html.match(pattern)?.[1]?.trim() || null;
}

function extractPreviousClose(html) {
  return html.match(/data-field="regularMarketPreviousClose"[^>]*>([^<]+)</i)?.[1]?.trim() || null;
}

function extractCloseNotice(html) {
  const notices = [...html.matchAll(/class="marketTimeNotice[^"]*"[^>]*>([\s\S]*?)<\/span>/gi)]
    .map((match) => match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
  return notices.find((notice) => /^At close:/i.test(notice)) || null;
}

function localParts(now, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(now);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function isoLocalDate(now, timeZone) {
  const p = localParts(now, timeZone);
  return p.year + "-" + p.month + "-" + p.day;
}

function minusDaysIso(iso, days) {
  const [y,m,d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y,m-1,d));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0,10);
}

function previousBusinessDay(iso) {
  let candidate = minusDaysIso(iso, 1);
  while ([0,6].includes(new Date(candidate + "T12:00:00Z").getUTCDay())) candidate = minusDaysIso(candidate, 1);
  return candidate;
}

function inferSessionDate(now, spec, notice) {
  if (spec.market === "US") {
    const parsed = notice.match(/At close:\s+([A-Za-z]+)\s+(\d{1,2})\s+at/i);
    if (parsed) {
      const month = new Date(parsed[1] + " 1, 2000 UTC").getUTCMonth() + 1;
      const year = Number(localParts(now, spec.timeZone).year);
      return year + "-" + String(month).padStart(2,"0") + "-" + String(Number(parsed[2])).padStart(2,"0");
    }
  }
  const local = localParts(now, spec.timeZone);
  const today = isoLocalDate(now, spec.timeZone);
  const hour = Number(local.hour);
  if (spec.market === "MY") {
    if (hour >= 17) return today;
    if (hour < 9) return previousBusinessDay(today);
  }
  if (spec.market === "US") {
    if (hour >= 16) return today;
    if (hour < 9) return previousBusinessDay(today);
  }
  return null;
}

async function fetchClosedRow(spec, previous) {
  const response = await fetch(spec.url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
    },
  });
  if (!response.ok) throw new Error(spec.ticker + " Yahoo HTTP " + response.status);
  const html = await response.text();
  const notice = extractCloseNotice(html);
  if (!notice) return { ...previous, ticker: spec.ticker, status: previous?.status || "UNRESOLVED", refreshNote: "Regular session not closed; retained previous completed-session row." };

  const close = num(extract(html, "qsp-price"));
  const change = num(extract(html, "qsp-price-change"));
  let changePct = num(extract(html, "qsp-price-change-percent"));
  const previousClose = num(extractPreviousClose(html));
  if (changePct != null && Math.abs(changePct) < 1 && /%/.test(extract(html, "qsp-price-change-percent") || "")) changePct *= 100;
  if ([close, change, changePct, previousClose].some((value) => value == null)) {
    return { ...previous, ticker: spec.ticker, status: previous?.status || "UNRESOLVED", refreshNote: "Completed session found but required quote fields were incomplete; retained previous row." };
  }

  const sessionDate = inferSessionDate(new Date(), spec, notice);
  if (!sessionDate) {
    return { ...previous, ticker: spec.ticker, status: previous?.status || "UNRESOLVED", refreshNote: "Close detected during ambiguous local session window; retained previous row." };
  }

  return {
    ticker: spec.ticker,
    providerSymbol: spec.providerSymbol,
    market: spec.market,
    sessionDate,
    currency: spec.currency,
    close,
    previousClose,
    change,
    changePct,
    closeNotice: notice,
    sourceName: "Yahoo Finance delayed quote",
    sourceUrl: spec.url,
    status: "CLOSED",
  };
}

function validate(tape) {
  if (tape?.contractVersion !== CONTRACT) throw new Error("Unexpected holding-tape contract.");
  const tickers = new Set((tape.holdings || []).map((item) => item.ticker));
  for (const ticker of ["XOM","MISC","HIBISCS","YTLPOWR","6742UW","TTWO","TSLA","DAYANG"]) {
    if (!tickers.has(ticker)) throw new Error("Missing holding-tape ticker: " + ticker);
  }
  for (const row of tape.holdings || []) {
    if (row.status === "CLOSED" && (!row.sessionDate || !Number.isFinite(Number(row.close)) || !Number.isFinite(Number(row.changePct)))) {
      throw new Error("Invalid closed holding-tape row: " + row.ticker);
    }
  }
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  const existing = existingTape();
  if (checkOnly) {
    validate(existing);
    console.log("Holding tape contract is structurally valid.");
    return;
  }
  const prior = previousByTicker(existing);
  const rows = [];
  for (const spec of SPECS) {
    try {
      rows.push(await fetchClosedRow(spec, prior.get(spec.ticker)));
    } catch (error) {
      const old = prior.get(spec.ticker);
      rows.push(old ? { ...old, refreshNote: "Refresh failed: " + error.message } : {
        ticker: spec.ticker,
        providerSymbol: spec.providerSymbol,
        market: spec.market,
        sessionDate: null,
        currency: spec.currency,
        close: null,
        previousClose: null,
        change: null,
        changePct: null,
        closeNotice: null,
        sourceName: "Yahoo Finance delayed quote",
        sourceUrl: spec.url,
        status: "UNRESOLVED",
        reason: error.message,
      });
    }
  }
  rows.splice(4, 0, Warrant);
  const tape = {
    contractVersion: CONTRACT,
    generatedAt: new Date().toISOString(),
    policy: {
      cadence: "refresh every 6 hours; only completed regular sessions are eligible",
      sourcePolicy: "Yahoo Finance rendered quote pages are used as a secondary delayed quote source. Each row carries its source URL and close notice. Missing or non-closed sessions remain unresolved.",
      alignmentPolicy: "HEADWIND expects negative tape, TAILWIND expects positive tape. MIXED/NEUTRAL/UNRESOLVED overlays are not forced into directional confirmation.",
    },
    holdings: rows,
    unresolved: rows.filter((row) => row.status !== "CLOSED").map((row) => row.ticker),
  };
  validate(tape);
  fs.writeFileSync(OUTPUT, JSON.stringify(tape, null, 2) + "\n");
  console.log("Wrote data/holding-tape.json with " + rows.filter((row) => row.status === "CLOSED").length + " completed-session rows.");
}

await main();
