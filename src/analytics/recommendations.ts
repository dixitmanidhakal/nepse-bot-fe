/**
 * Recommendation engine over CanonicalStock[] (and optionally historical bars).
 * Produces CanonicalRecommendation[] sorted by score desc.
 */
import type {
  CanonicalRecommendation,
  CanonicalStock,
} from "../types/canonical";

function scoreSnapshot(s: CanonicalStock): {
  score: number;
  reasons: string[];
  signal: "BUY" | "SELL" | "HOLD";
} {
  const reasons: string[] = [];
  let score = 0;

  const chg = s.changePercent ?? 0;
  const vol = s.volume ?? 0;
  const turn = s.turnover ?? 0;

  if (chg > 0) {
    score += chg * 1.5;
    reasons.push(`+${chg.toFixed(2)}%`);
  } else if (chg < 0) {
    score += chg;
    reasons.push(`${chg.toFixed(2)}%`);
  }

  if (vol > 0) {
    const v = Math.log10(vol + 1);
    score += v;
    if (v > 4) reasons.push(`high volume ${vol.toLocaleString()}`);
  }
  if (turn > 0) {
    const t = Math.log10(turn + 1) * 0.5;
    score += t;
  }

  const signal: "BUY" | "SELL" | "HOLD" =
    score > 4 ? "BUY" : score < -3 ? "SELL" : "HOLD";
  return { score: Number(score.toFixed(2)), reasons, signal };
}

export function topRecommendations(
  stocks: CanonicalStock[],
  limit = 20
): CanonicalRecommendation[] {
  const scored = stocks.map<CanonicalRecommendation>((s) => {
    const { score, reasons, signal } = scoreSnapshot(s);
    return {
      symbol: s.symbol,
      name: s.name,
      sector: s.sector,
      ltp: s.ltp,
      changePercent: s.changePercent,
      score,
      signal,
      reasons,
    };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

export function topBuys(
  stocks: CanonicalStock[],
  limit = 20
): CanonicalRecommendation[] {
  return topRecommendations(stocks, stocks.length)
    .filter((r) => r.signal === "BUY")
    .slice(0, limit);
}

export function topSells(
  stocks: CanonicalStock[],
  limit = 20
): CanonicalRecommendation[] {
  return topRecommendations(stocks, stocks.length)
    .filter((r) => r.signal === "SELL")
    .slice(0, limit);
}
