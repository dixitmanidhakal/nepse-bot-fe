import apiClient from "./client";

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

export const recommendationsApi = {
  top: async (params: {
    limit?: number;
    min_score?: number;
    min_rows?: number;
    action?: "BUY" | "WATCH" | "AVOID";
    max_symbols?: number;
  } = {}): Promise<TopResponse> => {
    const { data } = await apiClient.get("/api/v1/recommendations/top", {
      params,
      timeout: 120_000,
    });
    return data;
  },

  universe: async (): Promise<{ status: string; data: UniverseSummary }> => {
    const { data } = await apiClient.get("/api/v1/recommendations/universe");
    return data;
  },

  symbol: async (symbol: string, min_rows = 60): Promise<{ status: string; data: Recommendation }> => {
    const { data } = await apiClient.get(`/api/v1/recommendations/${symbol}`, {
      params: { min_rows },
    });
    return data;
  },

  explain: async (symbol: string, min_rows = 60): Promise<{ status: string; data: ExplainResponse }> => {
    const { data } = await apiClient.get(`/api/v1/recommendations/explain/${symbol}`, {
      params: { min_rows },
    });
    return data;
  },

  scoreMany: async (payload: {
    symbols: string[];
    min_rows?: number;
    min_score?: number;
    weights?: Partial<FactorScores>;
  }): Promise<TopResponse> => {
    const { data } = await apiClient.post("/api/v1/recommendations/score", payload, {
      timeout: 120_000,
    });
    return data;
  },
};
