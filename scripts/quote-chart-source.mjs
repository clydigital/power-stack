// JSON daily-bar adapter. Uses source timestamps, not a guessed close date.
// Yahoo chart is an unofficial, rate-limited source; errors must never create a fresh quote.
export const CHART_HOSTS = Object.freeze([
  "https://query2.finance.yahoo.com",
  "https://query1.finance.yahoo.com",
]);

const dateTimeParts = (date, timeZone) => Object.fromEntries(
  new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", hourCycle: "h23", weekday: "short",
  }).formatToParts(date).map((part) => [part.type, part.value]),
);

const localDate = (parts) => parts.year + "-" + parts.month + "-" + parts.day;
const round = (value, digits = 4) => Number(Number(value).toFixed(digits));

export function parseYahooDailyBars(payload, spec, now = new Date()) {
  const result = payload?.chart?.result?.[0];
  if (!result || payload?.chart?.error) throw new Error("No usable Yahoo chart result");
  if (String(result.meta?.symbol || "").toUpperCase() !== spec.providerSymbol.toUpperCase()) {
    throw new Error("Yahoo chart returned a different symbol");
  }
  if (String(result.meta?.currency || "").toUpperCase() !== spec.currency.toUpperCase()) {
    throw new Error("Yahoo chart currency mismatch");
  }
  if (!Array.isArray(result.timestamp) || !Array.isArray(result.indicators?.quote?.[0]?.close)) {
    throw new Error("Yahoo chart missing daily timestamp/close arrays");
  }

  const nowParts = dateTimeParts(now, spec.timeZone);
  const today = localDate(nowParts);
  const weekday = nowParts.weekday;
  const sameDayEligible = weekday !== "Sat" && weekday !== "Sun"
    && Number(nowParts.hour) >= (spec.market === "US" ? 17 : 18);

  const closes = result.indicators.quote[0].close;
  const bars = new Map();
  for (let i = 0; i < result.timestamp.length; i++) {
    const timestamp = Number(result.timestamp[i]);
    const close = closes[i];
    if (!Number.isFinite(timestamp) || !Number.isFinite(close) || close <= 0) continue;
    const sourceDate = localDate(dateTimeParts(new Date(timestamp * 1000), spec.timeZone));
    if (sourceDate > today || (sourceDate === today && !sameDayEligible)) continue;
    bars.set(sourceDate, { sessionDate: sourceDate, close });
  }
  const sessions = [...bars.values()].sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));
  if (sessions.length < 2) throw new Error("Yahoo chart has fewer than two completed daily sessions");
  const latest = sessions.at(-1), previous = sessions.at(-2);
  const change = latest.close - previous.close;
  return {
    ticker: spec.ticker,
    providerSymbol: spec.providerSymbol,
    market: spec.market,
    sessionDate: latest.sessionDate,
    currency: spec.currency,
    close: round(latest.close),
    previousClose: round(previous.close),
    change: round(change),
    changePct: round(100 * change / previous.close, 3),
    closeNotice: "Source-dated regular-session daily close: " + latest.sessionDate,
    sourceName: "Yahoo Finance chart daily bars (unofficial/delayed)",
    status: "CLOSED",
    refreshStatus: "OK",
  };
}

export async function fetchYahooChart(spec, host, { fetcher = fetch, now = new Date(), timeoutMs = 12000 } = {}) {
  if (!CHART_HOSTS.includes(host)) throw new Error("Unrecognised chart provider host");
  const url = host + "/v8/finance/chart/" + encodeURIComponent(spec.providerSymbol)
    + "?interval=1d&range=1mo&includePrePost=false";
  const response = await fetcher(url, {
    headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (compatible; power-stack-quote-sync/2.0)" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error("Yahoo chart HTTP " + response.status);
  const payload = await response.json();
  const parsed = parseYahooDailyBars(payload, spec, now);
  return { ...parsed, sourceUrl: url, fetchedAt: now.toISOString() };
}

export function parseFinnhubUSQuote(payload, spec, now = new Date()) {
  if (spec.market !== "US") throw new Error("Finnhub quote fallback is US-only");
  const price = Number(payload?.c), previous = Number(payload?.pc), seconds = Number(payload?.t);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(previous) || previous <= 0
    || !Number.isFinite(seconds) || seconds <= 0) throw new Error("Finnhub quote lacks usable prices or event timestamp");
  const eventTime = new Date(seconds * 1000);
  const event = dateTimeParts(eventTime, spec.timeZone);
  const sessionDate = localDate(event);
  const current = dateTimeParts(now, spec.timeZone);
  if (sessionDate > localDate(current)) throw new Error("Finnhub quote is future dated");
  // Prevent a regular-hours intraday tick from being stamped as the closing quote.
  if (Number(event.hour) < 16 || event.weekday === "Sat" || event.weekday === "Sun") {
    throw new Error("Finnhub last-trade timestamp is not after the regular-session close");
  }
  if (sessionDate === localDate(current) && Number(current.hour) < 17) {
    throw new Error("US current-session quote is not yet safely completed");
  }
  const change = price - previous;
  return {
    ticker: spec.ticker, providerSymbol: spec.providerSymbol, market: spec.market,
    sessionDate, currency: "USD", close: round(price), previousClose: round(previous),
    change: round(change), changePct: round(100 * change / previous, 3),
    closeNotice: "Finnhub provider-stamped completed regular session: " + sessionDate,
    sourceName: "Finnhub quote (provider-timestamped)",
    status: "CLOSED", refreshStatus: "OK",
  };
}

export async function fetchFinnhubUSQuote(spec, token, { fetcher = fetch, now = new Date(), timeoutMs = 8000 } = {}) {
  if (!token || spec.market !== "US") throw new Error("Finnhub token unavailable or unsupported market");
  const url = "https://finnhub.io/api/v1/quote?symbol=" + encodeURIComponent(spec.providerSymbol)
    + "&token=" + encodeURIComponent(token);
  const response = await fetcher(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error("Finnhub quote HTTP " + response.status);
  const parsed = parseFinnhubUSQuote(await response.json(), spec, now);
  // Never persist credentials in snapshots, sourceUrls or diagnostics.
  return { ...parsed, sourceUrl: "https://finnhub.io/api/v1/quote?symbol=" + encodeURIComponent(spec.providerSymbol),
    fetchedAt: now.toISOString() };
}
