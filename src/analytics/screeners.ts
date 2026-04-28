/**
 * Market-wide screeners over CanonicalStock[] snapshot.
 * Pure, no I/O.
 */
import type { CanonicalStock } from "../types/canonical";

function byDesc<T>(key: (x: T) => number | null | undefined) {
  return (a: T, b: T) => (key(b) ?? -Infinity) - (key(a) ?? -Infinity);
}
function byAsc<T>(key: (x: T) => number | null | undefined) {
  return (a: T, b: T) => (key(a) ?? Infinity) - (key(b) ?? Infinity);
}

export function topGainers(stocks: CanonicalStock[], n = 20): CanonicalStock[] {
  return [...stocks]
    .filter((s) => (s.changePercent ?? 0) > 0)
    .sort(byDesc((s) => s.changePercent))
    .slice(0, n);
}

export function topLosers(stocks: CanonicalStock[], n = 20): CanonicalStock[] {
  return [...stocks]
    .filter((s) => (s.changePercent ?? 0) < 0)
    .sort(byAsc((s) => s.changePercent))
    .slice(0, n);
}

export function topByVolume(
  stocks: CanonicalStock[],
  n = 20
): CanonicalStock[] {
  return [...stocks].sort(byDesc((s) => s.volume)).slice(0, n);
}

export function topByTurnover(
  stocks: CanonicalStock[],
  n = 20
): CanonicalStock[] {
  return [...stocks].sort(byDesc((s) => s.turnover)).slice(0, n);
}

/** Simple momentum proxy from live snapshot alone: % change combined with volume. */
export function momentum(stocks: CanonicalStock[], n = 20): CanonicalStock[] {
  const scored = stocks.map((s) => ({
    s,
    score:
      (s.changePercent ?? 0) * Math.log10(Math.max(1, (s.volume ?? 0) + 1)),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map((x) => x.s);
}

/** Oversold proxy from snapshot: biggest % losers. */
export function oversold(stocks: CanonicalStock[], n = 20): CanonicalStock[] {
  return topLosers(stocks, n);
}

/** Defensive proxy: smallest absolute % move today. */
export function defensive(stocks: CanonicalStock[], n = 20): CanonicalStock[] {
  return [...stocks]
    .sort(byAsc((s) => Math.abs(s.changePercent ?? 0)))
    .slice(0, n);
}

/** Volume spike proxy: top volume among gainers. */
export function volumeSpike(
  stocks: CanonicalStock[],
  n = 20
): CanonicalStock[] {
  return [...stocks]
    .filter((s) => (s.changePercent ?? 0) > 0)
    .sort(byDesc((s) => s.volume))
    .slice(0, n);
}
