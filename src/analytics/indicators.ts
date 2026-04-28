/**
 * Pure technical-indicator calculations over CanonicalBar[].
 * No network calls. No page-specific types. Safe to unit test.
 */

import type {
  CanonicalBar,
  CanonicalIndicatorSummary,
} from "../types/canonical";

// ── Primitives ─────────────────────────────────────────────────────────────
export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0 || values.length === 0) return out;
  const k = 2 / (period + 1);
  // seed with SMA of first `period` values
  let seed = 0;
  for (let i = 0; i < Math.min(period, values.length); i++) seed += values[i];
  if (values.length >= period) {
    out[period - 1] = seed / period;
    for (let i = period; i < values.length; i++) {
      const prev = out[i - 1] as number;
      out[i] = values[i] * k + prev * (1 - k);
    }
  }
  return out;
}

export function rsi(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length <= period) return out;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const ch = values[i] - values[i - 1];
    if (ch >= 0) gains += ch;
    else losses -= ch;
  }
  let avgG = gains / period;
  let avgL = losses / period;
  out[period] = 100 - 100 / (1 + (avgL === 0 ? Infinity : avgG / avgL));
  for (let i = period + 1; i < values.length; i++) {
    const ch = values[i] - values[i - 1];
    const g = ch > 0 ? ch : 0;
    const l = ch < 0 ? -ch : 0;
    avgG = (avgG * (period - 1) + g) / period;
    avgL = (avgL * (period - 1) + l) / period;
    out[i] = 100 - 100 / (1 + (avgL === 0 ? Infinity : avgG / avgL));
  }
  return out;
}

export function macd(
  values: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9
): {
  macd: (number | null)[];
  signal: (number | null)[];
  hist: (number | null)[];
} {
  const emaF = ema(values, fast);
  const emaS = ema(values, slow);
  const macdLine = values.map((_, i) => {
    const a = emaF[i];
    const b = emaS[i];
    if (a == null || b == null) return null;
    return a - b;
  });
  const macdClean = macdLine.map((v) => v ?? 0);
  const sigRaw = ema(macdClean, signalPeriod);
  const signal = macdLine.map((v, i) => (v == null ? null : sigRaw[i]));
  const hist = macdLine.map((v, i) => {
    const s = signal[i];
    if (v == null || s == null) return null;
    return v - s;
  });
  return { macd: macdLine, signal, hist };
}

export function bollingerBands(
  values: number[],
  period = 20,
  k = 2
): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const mid = sma(values, period);
  const upper: (number | null)[] = new Array(values.length).fill(null);
  const lower: (number | null)[] = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    const m = mid[i];
    if (m == null) continue;
    let sq = 0;
    for (let j = i - period + 1; j <= i; j++) sq += (values[j] - m) ** 2;
    const sd = Math.sqrt(sq / period);
    upper[i] = m + k * sd;
    lower[i] = m - k * sd;
  }
  return { upper, middle: mid, lower };
}

export function atr(bars: CanonicalBar[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(bars.length).fill(null);
  if (bars.length <= period) return out;
  const trs: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (i === 0) {
      trs.push(bars[i].high - bars[i].low);
    } else {
      const pc = bars[i - 1].close;
      const tr = Math.max(
        bars[i].high - bars[i].low,
        Math.abs(bars[i].high - pc),
        Math.abs(bars[i].low - pc)
      );
      trs.push(tr);
    }
  }
  let prev = 0;
  for (let i = 0; i < period; i++) prev += trs[i];
  prev /= period;
  out[period - 1] = prev;
  for (let i = period; i < bars.length; i++) {
    prev = (prev * (period - 1) + trs[i]) / period;
    out[i] = prev;
  }
  return out;
}

export function volumeRatio(bars: CanonicalBar[], period = 20): number | null {
  if (bars.length < period + 1) return null;
  const last = bars[bars.length - 1].volume;
  let s = 0;
  for (let i = bars.length - 1 - period; i < bars.length - 1; i++)
    s += bars[i].volume;
  const avg = s / period;
  if (avg <= 0) return null;
  return last / avg;
}

// ── Canonical summary ──────────────────────────────────────────────────────
export function computeIndicatorSummary(
  bars: CanonicalBar[]
): CanonicalIndicatorSummary {
  if (!bars.length) {
    return {
      symbol: "",
      asOf: null,
      price: null,
      sma20: null,
      sma50: null,
      sma200: null,
      ema12: null,
      ema26: null,
      macd: null,
      macdSignal: null,
      macdHist: null,
      rsi14: null,
      bbUpper: null,
      bbMiddle: null,
      bbLower: null,
      atr14: null,
      volumeRatio: null,
      signal: "HOLD",
      reasons: ["no data"],
    };
  }
  const closes = bars.map((b) => b.close);
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const m = macd(closes);
  const r = rsi(closes, 14);
  const bb = bollingerBands(closes, 20, 2);
  const atr14 = atr(bars, 14);
  const vr = volumeRatio(bars, 20);
  const i = bars.length - 1;
  const price = closes[i];

  const reasons: string[] = [];
  let buyVotes = 0;
  let sellVotes = 0;
  const rsiV = r[i];
  if (rsiV != null) {
    if (rsiV < 30) {
      buyVotes++;
      reasons.push(`RSI ${rsiV.toFixed(0)} oversold`);
    } else if (rsiV > 70) {
      sellVotes++;
      reasons.push(`RSI ${rsiV.toFixed(0)} overbought`);
    }
  }
  const macdV = m.macd[i];
  const macdS = m.signal[i];
  if (macdV != null && macdS != null) {
    if (macdV > macdS) {
      buyVotes++;
      reasons.push("MACD bullish");
    } else {
      sellVotes++;
      reasons.push("MACD bearish");
    }
  }
  const s20 = sma20[i];
  const s50 = sma50[i];
  if (s20 != null && s50 != null) {
    if (s20 > s50) {
      buyVotes++;
      reasons.push("SMA20 > SMA50");
    } else {
      sellVotes++;
      reasons.push("SMA20 < SMA50");
    }
  }
  const signal: "BUY" | "SELL" | "HOLD" =
    buyVotes - sellVotes >= 2
      ? "BUY"
      : sellVotes - buyVotes >= 2
      ? "SELL"
      : "HOLD";

  return {
    symbol: bars[0].symbol,
    asOf: bars[i].date,
    price,
    sma20: s20,
    sma50: s50,
    sma200: sma200[i],
    ema12: ema12[i],
    ema26: ema26[i],
    macd: macdV,
    macdSignal: macdS,
    macdHist: m.hist[i],
    rsi14: rsiV,
    bbUpper: bb.upper[i],
    bbMiddle: bb.middle[i],
    bbLower: bb.lower[i],
    atr14: atr14[i],
    volumeRatio: vr,
    signal,
    reasons,
  };
}
