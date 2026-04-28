/**
 * Patterns API — now computed client-side from canonical OHLCV.
 *
 * Provides support/resistance, trend classification, chart patterns,
 * breakouts, and composite trading signals using pure analytics helpers.
 *
 * Returned shapes match the original backend contract so StockAnalysis and
 * related pages require no changes.
 */

import type { PatternSummary, TradingSignal } from "../types";
import { getOhlcv } from "../data";
import { detectPatterns } from "../analytics/patterns";
import { computeIndicatorSummary, sma } from "../analytics/indicators";
import type { CanonicalBar } from "../types/canonical";

function last<T>(arr: T[]): T | undefined {
  return arr.length ? arr[arr.length - 1] : undefined;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

// ── Support / Resistance ───────────────────────────────────────────────────
function computeSupportResistance(bars: CanonicalBar[]) {
  if (bars.length < 10) {
    return {
      supports: [] as number[],
      resistances: [] as number[],
      nearest_support: null as number | null,
      nearest_resistance: null as number | null,
    };
  }
  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const pivots: { type: "H" | "L"; price: number }[] = [];
  const k = 3;
  for (let i = k; i < bars.length - k; i++) {
    const hWindow = highs.slice(i - k, i + k + 1);
    const lWindow = lows.slice(i - k, i + k + 1);
    if (highs[i] === Math.max(...hWindow))
      pivots.push({ type: "H", price: highs[i] });
    if (lows[i] === Math.min(...lWindow))
      pivots.push({ type: "L", price: lows[i] });
  }
  const price = last(bars)!.close;
  const supports = pivots
    .filter((p) => p.type === "L" && p.price < price)
    .map((p) => p.price)
    .sort((a, b) => b - a)
    .slice(0, 5);
  const resistances = pivots
    .filter((p) => p.type === "H" && p.price > price)
    .map((p) => p.price)
    .sort((a, b) => a - b)
    .slice(0, 5);
  return {
    supports,
    resistances,
    nearest_support: supports[0] ?? null,
    nearest_resistance: resistances[0] ?? null,
  };
}

// ── Trend classification ──────────────────────────────────────────────────
function classifyTrend(bars: CanonicalBar[]) {
  if (bars.length < 50)
    return {
      primary_trend: "unknown",
      trend_strength: 0,
      slope: null as number | null,
    };
  const closes = bars.map((b) => b.close);
  const s20 = last(sma(closes, 20)) ?? null;
  const s50 = last(sma(closes, 50)) ?? null;
  const s200 = bars.length >= 200 ? last(sma(closes, 200)) ?? null : null;
  const price = closes[closes.length - 1];
  let score = 0;
  if (s20 != null && s50 != null) score += s20 > s50 ? 1 : -1;
  if (s50 != null && s200 != null) score += s50 > s200 ? 1 : -1;
  if (s20 != null) score += price > s20 ? 1 : -1;
  const n = Math.min(20, closes.length - 1);
  const slope = (closes[closes.length - 1] - closes[closes.length - 1 - n]) / n;
  const primary =
    score >= 2 ? "uptrend" : score <= -2 ? "downtrend" : "sideways";
  return {
    primary_trend: primary,
    trend_strength: Math.abs(score) / 3,
    slope,
  };
}

// ── Breakouts ─────────────────────────────────────────────────────────────
function detectBreakouts(bars: CanonicalBar[]) {
  const n = bars.length;
  if (n < 25) return [] as Array<Record<string, unknown>>;
  const recent = bars.slice(-20);
  const hi = Math.max(...recent.slice(0, 19).map((b) => b.high));
  const lo = Math.min(...recent.slice(0, 19).map((b) => b.low));
  const cur = recent[recent.length - 1];
  const out: Array<Record<string, unknown>> = [];
  if (cur.close > hi) {
    out.push({
      type: "bullish_breakout",
      date: cur.date,
      level: hi,
      close: cur.close,
      magnitude_pct: ((cur.close - hi) / hi) * 100,
    });
  }
  if (cur.close < lo) {
    out.push({
      type: "bearish_breakdown",
      date: cur.date,
      level: lo,
      close: cur.close,
      magnitude_pct: ((cur.close - lo) / lo) * 100,
    });
  }
  return out;
}

async function loadBars(symbol: string, days: number) {
  return getOhlcv(symbol, Math.max(days, 120));
}

export const patternsApi = {
  getSummary: async (symbol: string, days = 90): Promise<PatternSummary> => {
    const bars = await loadBars(symbol, days);
    if (!bars.length) return { success: false, symbol };
    const sr = computeSupportResistance(bars);
    const trend = classifyTrend(bars);
    const patterns = detectPatterns(bars).slice(0, 5);
    const ind = computeIndicatorSummary(bars);
    const signalStrength = clamp(
      (trend.trend_strength ?? 0) * 0.5 +
        (ind.signal === "BUY" ? 0.5 : ind.signal === "SELL" ? -0.5 : 0),
      -1,
      1
    );
    return {
      success: true,
      symbol,
      summary: {
        nearest_support: sr.nearest_support ?? undefined,
        nearest_resistance: sr.nearest_resistance ?? undefined,
        primary_trend: trend.primary_trend,
        trend_strength: trend.trend_strength,
        active_patterns: patterns.map((p) => p.pattern),
        signal: ind.signal,
        signal_strength: signalStrength,
      },
    };
  },

  getAll: async (symbol: string, days = 120) => {
    const bars = await loadBars(symbol, days);
    const sr = computeSupportResistance(bars);
    const trend = classifyTrend(bars);
    const patterns = detectPatterns(bars);
    const breakouts = detectBreakouts(bars);
    return {
      success: true,
      symbol,
      days,
      data: {
        support_resistance: sr,
        trend,
        patterns,
        breakouts,
      },
    };
  },

  getSupportResistance: async (symbol: string, days = 180) => {
    const bars = await loadBars(symbol, days);
    const sr = computeSupportResistance(bars);
    return { success: true, symbol, days, data: sr };
  },

  getTrend: async (symbol: string, days = 90) => {
    const bars = await loadBars(symbol, days);
    const trend = classifyTrend(bars);
    return { success: true, symbol, days, data: trend };
  },

  getTrendChannel: async (symbol: string, days = 90) => {
    const bars = await loadBars(symbol, days);
    if (bars.length < 20) {
      return { success: false, symbol, days };
    }
    const recent = bars.slice(-Math.min(days, bars.length));
    const upper = Math.max(...recent.map((b) => b.high));
    const lower = Math.min(...recent.map((b) => b.low));
    const mid = (upper + lower) / 2;
    return {
      success: true,
      symbol,
      days,
      data: { upper, lower, middle: mid, width: upper - lower },
    };
  },

  getTrendReversal: async (symbol: string, days = 60) => {
    const bars = await loadBars(symbol, days);
    const patterns = detectPatterns(bars).filter((p) =>
      [
        "Bullish Engulfing",
        "Bearish Engulfing",
        "Hammer",
        "Shooting Star",
      ].includes(p.pattern)
    );
    return { success: true, symbol, days, data: { reversals: patterns } };
  },

  getChartPatterns: async (symbol: string, days = 120) => {
    const bars = await loadBars(symbol, days);
    const patterns = detectPatterns(bars);
    return { success: true, symbol, days, data: { patterns } };
  },

  getBreakouts: async (symbol: string, days = 60) => {
    const bars = await loadBars(symbol, days);
    const breakouts = detectBreakouts(bars);
    return { success: true, symbol, days, data: { breakouts } };
  },

  getSignals: async (symbol: string, days = 90): Promise<TradingSignal> => {
    const bars = await loadBars(symbol, days);
    if (!bars.length) return { success: false, symbol };
    const ind = computeIndicatorSummary(bars);
    const trend = classifyTrend(bars);
    const breakouts = detectBreakouts(bars);
    const signals: TradingSignal["signals"] = [];
    signals.push({
      type: "indicators",
      signal: ind.signal,
      strength: ind.signal === "HOLD" ? 0.2 : 0.7,
      description: ind.reasons.join("; "),
    });
    signals.push({
      type: "trend",
      signal:
        trend.primary_trend === "uptrend"
          ? "BUY"
          : trend.primary_trend === "downtrend"
          ? "SELL"
          : "HOLD",
      strength: trend.trend_strength ?? 0,
      description: `Primary trend: ${trend.primary_trend}`,
    });
    if (breakouts.length) {
      const b = breakouts[0] as Record<string, unknown>;
      signals.push({
        type: "breakout",
        signal: b.type === "bullish_breakout" ? "BUY" : "SELL",
        strength: 0.8,
        description: `${b.type} at ${b.level}`,
      });
    }
    // overall
    const votes = signals.reduce(
      (acc, s) =>
        acc +
        (s.signal === "BUY" ? 1 : s.signal === "SELL" ? -1 : 0) * s.strength,
      0
    );
    const overall: "BUY" | "SELL" | "HOLD" =
      votes > 0.5 ? "BUY" : votes < -0.5 ? "SELL" : "HOLD";
    return {
      success: true,
      symbol,
      signal: overall,
      signal_strength: clamp(votes / signals.length, -1, 1),
      signals,
    };
  },
};
