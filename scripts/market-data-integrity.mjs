// Source-age and issuer-identity gates for Power Stack research-only projections.
// "CLOSED" means a historical regular session is complete; it does not mean current.
const DAYS_ALLOWED = 2;
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISSUER_CHECKS = {
  CRWD: { expected: /crowdstrike/i, conflict: /coreweave/i },
  CRWV: { expected: /coreweave/i, conflict: /crowdstrike/i },
  XENE: { expected: /xenon pharmaceuticals/i, conflict: /\bx[- ]?energy\b/i },
};

function dateInMarket(now, market) {
  const timeZone = market === "US" ? "America/New_York"
    : market === "MY" ? "Asia/Kuala_Lumpur" : "UTC";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const date = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return date.year + "-" + date.month + "-" + date.day;
}

function dayNumber(date) {
  if (!DATE_RE.test(String(date || ""))) return null;
  const n = Date.parse(date + "T00:00:00Z");
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === date ? n : null;
}

function businessDaysSince(sessionDate, today) {
  const first = dayNumber(sessionDate), last = dayNumber(today);
  if (first === null || last === null || first > last) return null;
  // Hard bound rejects nonsensical ancient dates; does not pretend to know holidays.
  if (last - first > 400 * DAY_MS) return 401;
  let elapsed = 0;
  for (let day = first + DAY_MS; day <= last; day += DAY_MS) {
    const weekday = new Date(day).getUTCDay();
    if (weekday !== 0 && weekday !== 6) elapsed++;
  }
  return elapsed;
}

export function assessHoldingTapeRow(row, now = new Date()) {
  if (!row || row.status !== "CLOSED" || !Number.isFinite(row.close)
    || !Number.isFinite(row.changePct) || !Number.isFinite(row.previousClose)) {
    return { status: "UNRESOLVED", eligibleForComparison: false, reason: "Missing verified closed-session instrument or price data." };
  }
  const age = businessDaysSince(row.sessionDate, dateInMarket(now, row.market));
  if (age === null) {
    return { status: "UNRESOLVED", eligibleForComparison: false, sessionDate: row.sessionDate || null,
      reason: "Invalid or future-dated session date." };
  }
  const failure = row.refreshStatus === "FETCH_FAILED"
    || row.refreshStatus === "NO_CLOSED_SESSION"
    || row.refreshStatus === "INCOMPLETE"
    || /refresh failed|retained previous|ambiguous local session/i.test(row.refreshNote || "");
  if (failure || age > DAYS_ALLOWED) {
    return { status: "STALE", eligibleForComparison: false, sessionDate: row.sessionDate,
      businessDaysOld: age, reason: failure ? "Latest quote refresh failed or retained a prior row." : "Completed session exceeds the freshness window." };
  }
  return { status: "CURRENT", eligibleForComparison: true, sessionDate: row.sessionDate,
    businessDaysOld: age, reason: "Completed-session price is within the market-local freshness window." };
}

export function assessHoldingTape(tape, now = new Date()) {
  const rows = (tape?.holdings || []).map((row) => ({
    ticker: row.ticker, ...assessHoldingTapeRow(row, now),
  }));
  const current = rows.filter((row) => row.status === "CURRENT").length;
  const stale = rows.filter((row) => row.status === "STALE").map((row) => row.ticker);
  const unresolved = rows.filter((row) => row.status === "UNRESOLVED").map((row) => row.ticker);
  return { status: current === rows.length && rows.length > 0 ? "OK" : current > 0 ? "PARTIAL" : "STALE",
    currentCount: current, totalCount: rows.length, stale, unresolved, rows,
    policy: "2 market-local weekdays; weekends excluded. Source failures block comparison. Exchange holidays not inferred." };
}

export function screenStockRadarEntry(item) {
  const symbol = String(item?.symbol || "").trim().toUpperCase();
  const companyName = String(item?.company_name || item?.companyName || "").trim();
  if (!/^[A-Z0-9.\-]{1,16}$/.test(symbol) || !companyName) {
    return { valid: false, symbol, companyName, reason: "Missing or malformed security identifier or issuer label." };
  }
  const check = ISSUER_CHECKS[symbol];
  if (check && (check.conflict.test(companyName) || (!check.expected.test(companyName) && companyName.toUpperCase() !== symbol))) {
    return { valid: false, symbol, companyName, reason: "Ticker and issuer label conflict with the known listed issuer." };
  }
  return { valid: true, symbol, companyName, identityStatus: check ? "KNOWN_MATCH" : "NOT_IN_REGISTRY" };
}
