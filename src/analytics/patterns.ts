/**
 * Candlestick pattern detection over CanonicalBar[].
 * Pure, no I/O. Returns CanonicalPatternEvent[] sorted newest-first.
 */
import type { CanonicalBar, CanonicalPatternEvent } from "../types/canonical";

function isHammer(b: CanonicalBar): boolean {
  const body = Math.abs(b.close - b.open);
  const lower = Math.min(b.open, b.close) - b.low;
  const upper = b.high - Math.max(b.open, b.close);
  return body > 0 && lower >= 2 * body && upper <= body;
}
function isShootingStar(b: CanonicalBar): boolean {
  const body = Math.abs(b.close - b.open);
  const upper = b.high - Math.max(b.open, b.close);
  const lower = Math.min(b.open, b.close) - b.low;
  return body > 0 && upper >= 2 * body && lower <= body;
}
function isBullishEngulfing(prev: CanonicalBar, cur: CanonicalBar): boolean {
  return (
    prev.close < prev.open &&
    cur.close > cur.open &&
    cur.open <= prev.close &&
    cur.close >= prev.open
  );
}
function isBearishEngulfing(prev: CanonicalBar, cur: CanonicalBar): boolean {
  return (
    prev.close > prev.open &&
    cur.close < cur.open &&
    cur.open >= prev.close &&
    cur.close <= prev.open
  );
}
function isDoji(b: CanonicalBar): boolean {
  const range = b.high - b.low;
  if (range <= 0) return false;
  return Math.abs(b.close - b.open) <= range * 0.1;
}

export function detectPatterns(bars: CanonicalBar[]): CanonicalPatternEvent[] {
  const out: CanonicalPatternEvent[] = [];
  for (let i = 1; i < bars.length; i++) {
    const b = bars[i];
    const p = bars[i - 1];
    if (isHammer(b))
      out.push({
        symbol: b.symbol,
        pattern: "Hammer",
        direction: "bullish",
        date: b.date,
        confidence: 0.6,
      });
    if (isShootingStar(b))
      out.push({
        symbol: b.symbol,
        pattern: "Shooting Star",
        direction: "bearish",
        date: b.date,
        confidence: 0.6,
      });
    if (isBullishEngulfing(p, b))
      out.push({
        symbol: b.symbol,
        pattern: "Bullish Engulfing",
        direction: "bullish",
        date: b.date,
        confidence: 0.75,
      });
    if (isBearishEngulfing(p, b))
      out.push({
        symbol: b.symbol,
        pattern: "Bearish Engulfing",
        direction: "bearish",
        date: b.date,
        confidence: 0.75,
      });
    if (isDoji(b))
      out.push({
        symbol: b.symbol,
        pattern: "Doji",
        direction: "neutral",
        date: b.date,
        confidence: 0.4,
      });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}
