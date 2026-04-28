import apiClient from "./client";
import type { ScreenerResult, ScreeningCriteria } from "../types";

/**
 * Production-safe stock screeners.
 *
 * The legacy `/api/v1/stocks/*` endpoints depend on a local Postgres DB which
 * doesn't exist on Vercel. We replace them with computations over the live
 * market snapshot returned by `/api/v1/free/market/live` so Dashboard always
 * has something meaningful to render.
 */

interface LiveStock {
  symbol: string;
  name?: string;
  ltp: number | null;
  previous_close?: number | null;
  change?: number | null;
  percent_change?: number | null;
  high?: number | null;
  low?: number | null;
  volume?: number | null;
  turnover?: number | null;
  trades?: number | null;
  last_updated?: string;
  market_cap?: number | null;
}

interface LiveMarketResp {
  count: number;
  data: LiveStock[];
}

async function getLive(): Promise<LiveStock[]> {
  const { data } = await apiClient.get<LiveMarketResp>(
    "/api/v1/free/market/live"
  );
  return data?.data ?? [];
}

function toScreenerRow(s: LiveStock) {
  return {
    symbol: s.symbol,
    ltp: s.ltp ?? null,
    change_percent: s.percent_change ?? null,
    rsi_14: null,
    volume_ratio: null,
    sector: null,
    score: null,
    volume: s.volume ?? null,
    turnover: s.turnover ?? null,
  };
}

function asScreenerResult(rows: LiveStock[], limit: number): ScreenerResult {
  const sliced = rows.slice(0, limit).map(toScreenerRow);
  return {
    stocks: sliced,
    total_results: sliced.length,
    criteria: {},
  } as unknown as ScreenerResult;
}

export const stocksApi = {
  screen: async (_criteria: ScreeningCriteria): Promise<ScreenerResult> => {
    const rows = await getLive();
    return asScreenerResult(rows, 50);
  },

  // High-volume = sort by volume desc
  getHighVolume: async (
    _min_volume_ratio = 2.0,
    limit = 20
  ): Promise<ScreenerResult> => {
    const rows = await getLive();
    const sorted = [...rows].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
    return asScreenerResult(sorted, limit);
  },

  // Momentum proxy = top % gainers
  getMomentum: async (limit = 20): Promise<ScreenerResult> => {
    const rows = await getLive();
    const sorted = [...rows].sort(
      (a, b) => (b.percent_change ?? -1e9) - (a.percent_change ?? -1e9)
    );
    return asScreenerResult(sorted, limit);
  },

  getValue: async (limit = 20): Promise<ScreenerResult> => {
    const rows = await getLive();
    // Value proxy: highest turnover among positive movers
    const sorted = [...rows]
      .filter((s) => (s.turnover ?? 0) > 0)
      .sort((a, b) => (b.turnover ?? 0) - (a.turnover ?? 0));
    return asScreenerResult(sorted, limit);
  },

  getDefensive: async (limit = 20): Promise<ScreenerResult> => {
    const rows = await getLive();
    // Defensive proxy: smallest absolute % change
    const sorted = [...rows].sort(
      (a, b) =>
        Math.abs(a.percent_change ?? 0) - Math.abs(b.percent_change ?? 0)
    );
    return asScreenerResult(sorted, limit);
  },

  getGrowth: async (limit = 20): Promise<ScreenerResult> => {
    // Same as momentum for free tier
    return stocksApi.getMomentum(limit);
  },

  // Oversold proxy = biggest % losers today
  getOversold: async (limit = 20): Promise<ScreenerResult> => {
    const rows = await getLive();
    const sorted = [...rows].sort(
      (a, b) => (a.percent_change ?? 1e9) - (b.percent_change ?? 1e9)
    );
    return asScreenerResult(sorted, limit);
  },

  getBeta: async (_symbol: string, _days = 90) => {
    return {
      status: "unavailable",
      message: "Beta requires historical DB (not on free tier)",
    };
  },

  getHighBeta: async (_min_beta = 1.2, limit = 20) => {
    const rows = await getLive();
    return asScreenerResult(rows, limit);
  },

  getLowBeta: async (_max_beta = 0.8, limit = 20) => {
    const rows = await getLive();
    return asScreenerResult(rows, limit);
  },
};
