/**
 * Recommendations API.
 *
 * Data-source cascade (freshest first):
 *   1. `/api/v1/free/recommendations/top`  — scored from today's live snapshot
 *   2. `/api/v1/recommendations/top`       — legacy, scored from bundled SQLite
 *                                            (can be days/weeks old on free tier)
 *   3. Client-side score from the live snapshot via `src/analytics`
 *
 * Page-facing signatures are preserved.
 */

import apiClient from "./client";
import { getMarketSnapshot } from "../data";
import { topRecommendations as canonicalTop } from "../analytics/recommendations";
import type { CanonicalRecommendation } from "../types/canonical";

// ── Wire types (unchanged) ────────────────────────────────────────────────
export interface FactorScores {
  trend: number;
  momentum: number;
  volume: number;
  volatility: number;
  drawdown: number;
}

export interface Recommendation {
  symbol: string;
  action: "BUY" | "WATCH" | "AVOID";
  score: number;
  last_close: number;
  change_1d_pct: number | null;
  change_5d_pct: number | null;
  change_20d_pct: number | null;
  rsi_14: number | null;
  macd_hist: number | null;
  volume_ratio: number | null;
  volatility_annualised: number | null;
  drawdown_from_high_pct: number | null;
  factor_scores: FactorScores;
  rationale: string[];
  as_of_date: string | null;
}

export interface TopResponse {
  status: string;
  count: number;
  universe_size: number;
  data: Recommendation[];
}

export interface UniverseSummary {
  total_symbols: number;
  total_rows: number;
  earliest_date: string | null;
  latest_date: string | null;
  db_path: string;
}

export interface ExplainResponse extends Recommendation {
  weights: FactorScores;
  history_rows: number;
}

// ── Fallback mapping ──────────────────────────────────────────────────────
function canonicalToLegacy(
  r: CanonicalRecommendation,
  _idx: number
): Recommendation {
  const action: Recommendation["action"] =
    r.signal === "BUY" ? "BUY" : r.signal === "SELL" ? "AVOID" : "WATCH";
  return {
    symbol: r.symbol,
    action,
    score: r.score,
    last_close: r.ltp ?? 0,
    change_1d_pct: r.changePercent ?? null,
    change_5d_pct: null,
    change_20d_pct: null,
    rsi_14: null,
    macd_hist: null,
    volume_ratio: null,
    volatility_annualised: null,
    drawdown_from_high_pct: null,
    factor_scores: {
      trend: 0,
      momentum: r.changePercent ?? 0,
      volume: 0,
      volatility: 0,
      drawdown: 0,
    },
    rationale: r.reasons,
    as_of_date: new Date().toISOString().slice(0, 10),
  };
}

async function fallbackTop(
  limit: number,
  action?: "BUY" | "WATCH" | "AVOID"
): Promise<TopResponse> {
  const snapshot = await getMarketSnapshot();
  let recs = canonicalTop(snapshot, snapshot.length).map(canonicalToLegacy);
  if (action) recs = recs.filter((r) => r.action === action);
  return {
    status: "fallback",
    count: Math.min(limit, recs.length),
    universe_size: snapshot.length,
    data: recs.slice(0, limit),
  };
}

export const recommendationsApi = {
  top: async (
    params: {
      limit?: number;
      min_score?: number;
      min_rows?: number;
      action?: "BUY" | "WATCH" | "AVOID";
      max_symbols?: number;
    } = {}
  ): Promise<TopResponse> => {
    // 1) Try the fresh live-snapshot scorer first
    try {
      const { data } = await apiClient.get("/api/v1/free/recommendations/top", {
        params: {
          limit: params.limit,
          action: params.action,
          min_score: params.min_score,
        },
        timeout: 30_000,
      });
      if (data && Array.isArray(data.data) && data.data.length > 0) {
        return data;
      }
    } catch {
      /* fall through */
    }

    // 2) Legacy historical scorer (may be stale on free tier)
    try {
      const { data } = await apiClient.get("/api/v1/recommendations/top", {
        params,
        timeout: 120_000,
      });
      return data;
    } catch {
      // 3) Client-side fallback
      return fallbackTop(params.limit ?? 20, params.action);
    }
  },

  universe: async (): Promise<{ status: string; data: UniverseSummary }> => {
    // Prefer the live-fresh universe summary so the UI never shows the
    // stale "latest_date = 2026-04-15" from the bundled SQLite.
    try {
      const { data } = await apiClient.get(
        "/api/v1/free/recommendations/universe",
        { timeout: 15_000 }
      );
      if (data?.data?.latest_date) return data;
    } catch {
      /* fall through */
    }
    try {
      const { data } = await apiClient.get("/api/v1/recommendations/universe");
      return data;
    } catch {
      const snapshot = await getMarketSnapshot();
      return {
        status: "fallback",
        data: {
          total_symbols: snapshot.length,
          total_rows: snapshot.length,
          earliest_date: null,
          latest_date: new Date().toISOString().slice(0, 10),
          db_path: "free-provider:snapshot",
        },
      };
    }
  },

  symbol: async (
    symbol: string,
    min_rows = 60
  ): Promise<{ status: string; data: Recommendation }> => {
    try {
      const { data } = await apiClient.get(
        `/api/v1/recommendations/${symbol}`,
        { params: { min_rows } }
      );
      return data;
    } catch {
      const snapshot = await getMarketSnapshot();
      const one = snapshot.find((s) => s.symbol === symbol);
      if (!one)
        return {
          status: "not_found",
          data: {
            symbol,
            action: "WATCH",
            score: 0,
            last_close: 0,
            change_1d_pct: null,
            change_5d_pct: null,
            change_20d_pct: null,
            rsi_14: null,
            macd_hist: null,
            volume_ratio: null,
            volatility_annualised: null,
            drawdown_from_high_pct: null,
            factor_scores: {
              trend: 0,
              momentum: 0,
              volume: 0,
              volatility: 0,
              drawdown: 0,
            },
            rationale: ["symbol not in snapshot"],
            as_of_date: null,
          },
        };
      const [rec] = canonicalTop([one], 1);
      return { status: "fallback", data: canonicalToLegacy(rec, 0) };
    }
  },

  explain: async (
    symbol: string,
    min_rows = 60
  ): Promise<{ status: string; data: ExplainResponse }> => {
    try {
      const { data } = await apiClient.get(
        `/api/v1/recommendations/explain/${symbol}`,
        { params: { min_rows } }
      );
      return data;
    } catch {
      const r = await recommendationsApi.symbol(symbol, min_rows);
      return {
        status: r.status,
        data: {
          ...r.data,
          weights: {
            trend: 0.25,
            momentum: 0.25,
            volume: 0.2,
            volatility: 0.15,
            drawdown: 0.15,
          },
          history_rows: 0,
        },
      };
    }
  },

  scoreMany: async (payload: {
    symbols: string[];
    min_rows?: number;
    min_score?: number;
    weights?: Partial<FactorScores>;
  }): Promise<TopResponse> => {
    try {
      const { data } = await apiClient.post(
        "/api/v1/recommendations/score",
        payload,
        { timeout: 120_000 }
      );
      return data;
    } catch {
      const snapshot = await getMarketSnapshot();
      const wanted = new Set(payload.symbols.map((s) => s.toUpperCase()));
      const subset = snapshot.filter((s) => wanted.has(s.symbol.toUpperCase()));
      const recs = canonicalTop(subset, subset.length).map(canonicalToLegacy);
      return {
        status: "fallback",
        count: recs.length,
        universe_size: subset.length,
        data: recs,
      };
    }
  },
};
