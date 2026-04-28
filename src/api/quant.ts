import apiClient from "./client";

export interface RegimeResult {
  regime: "bull" | "neutral" | "bear";
  rolling_return: number;
  volatility: number;
  window: number;
  exposure_multiplier: number;
}

export interface SignalIn {
  symbol: string;
  strength?: number;
  score?: number;
  confidence?: number;
  signal_type?: string;
  sector?: string;
}

export interface SizedPosition {
  symbol: string;
  shares: number;
  weight: number;
  value: number;
  sector: string;
  signal_type: string;
  confidence: number;
}

export interface SizePositionsResponse {
  status: string;
  data: {
    positions: SizedPosition[];
    estimated_round_trip_cost: number;
  };
}

export const quantApi = {
  classifyRegime: async (
    closes: number[],
    window = 60,
    bullThreshold = 0.05,
    bearThreshold = -0.05
  ): Promise<RegimeResult> => {
    const { data } = await apiClient.post("/api/v1/quant/regime", {
      closes,
      window,
      bull_threshold: bullThreshold,
      bear_threshold: bearThreshold,
    });
    return data.data as RegimeResult;
  },

  classifyRegimeFromReturns: async (
    returns: number[],
    window = 60
  ): Promise<RegimeResult> => {
    const { data } = await apiClient.post("/api/v1/quant/regime/returns", {
      returns,
      window,
    });
    return data.data as RegimeResult;
  },

  sizePositions: async (payload: {
    signals: SignalIn[];
    capital: number;
    prices: Record<string, number>;
    max_positions?: number;
    max_single_pct?: number;
    max_sector_pct?: number;
    cash_reserve_pct?: number;
  }): Promise<SizePositionsResponse["data"]> => {
    const { data } = await apiClient.post<SizePositionsResponse>(
      "/api/v1/quant/size-positions",
      payload
    );
    return data.data;
  },

  transactionCost: async (amount: number, is_buy = true) => {
    const { data } = await apiClient.post("/api/v1/quant/transaction-cost", {
      amount,
      is_buy,
    });
    return data.data as { amount: number; cost: number; is_buy: boolean };
  },

  kelly: async (
    win_prob: number,
    avg_win: number,
    avg_loss: number,
    max_kelly = 0.25
  ) => {
    const { data } = await apiClient.post("/api/v1/quant/kelly", {
      win_prob,
      avg_win,
      avg_loss,
      max_kelly,
    });
    return data.data as { kelly_fraction: number };
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Advanced quant endpoints (ported from nepse-quant-terminal)
// ────────────────────────────────────────────────────────────────────────────
const ADV = "/api/v1/quant/advanced";

export const advancedQuantApi = {
  regimeHMM: async (payload: {
    closes: number[];
    n_states?: number;
    lookback?: number;
    n_init?: number;
  }) => {
    const { data } = await apiClient.post(`${ADV}/regime-hmm`, payload);
    return data.data as {
      regime: string;
      probabilities: Record<string, number>;
      [k: string]: any;
    };
  },

  regimeBOCPD: async (payload: {
    returns: number[];
    hazard_lambda?: number;
    threshold?: number;
  }) => {
    const { data } = await apiClient.post(`${ADV}/regime-bocpd`, payload);
    return data.data as {
      cp_probs: number[];
      changepoints: number[]; // indices where changepoint fires
      n_observations: number;
      n_changepoints: number;
    };
  },

  marketState: async (payload: {
    prices: Record<string, number[]>;
    dates?: string[];
    as_of?: string;
  }) => {
    const { data } = await apiClient.post(`${ADV}/market-state`, payload);
    return data.data as {
      summary: string;
      regime: string;
      score: number;
      engine: string;
      nms: number;
      rb: number;
      vr: number;
      mp: number;
      note: string;
      as_of: string;
    };
  },

  pairsSpread: async (payload: {
    prices_a: number[];
    prices_b: number[];
    lookback?: number;
  }) => {
    const { data } = await apiClient.post(`${ADV}/pairs-spread`, payload);
    return data.data as {
      z_score: number;
      hedge_ratio: number;
      spread_mean: number;
      spread_last: number | null;
      halflife: number | null;
      n_observations: number;
    };
  },

  portfolioAllocate: async (payload: {
    method: "hrp" | "cvar" | "shrinkage_hrp" | "equal";
    prices: Record<string, number[]>;
    symbols: string[];
    capital: number;
    dates?: string[];
    as_of?: string;
  }) => {
    const { data } = await apiClient.post(
      `${ADV}/portfolio-allocate`,
      payload
    );
    return data.data as {
      method: string;
      capital: number;
      allocation: Record<string, number>;
    };
  },

  conformalVaR: async (payload: {
    returns: number[];
    alpha?: number;
    window?: number;
  }) => {
    const { data } = await apiClient.post(`${ADV}/conformal-var`, payload);
    return data.data as {
      var: number;
      alpha: number;
      confidence: number;
      window: number;
      n_observations: number;
    };
  },

  signalsRank: async (payload: {
    candidates: Array<{
      symbol: string;
      signal_type: string;
      strength: number;
      confidence: number;
      reasoning: string;
      direction?: number;
    }>;
    top_n?: number;
  }) => {
    const { data } = await apiClient.post(`${ADV}/signals-rank`, payload);
    return data.data as Array<Record<string, any>>;
  },

  disposition: async (payload: {
    prices: Record<string, number[]>;
    volume?: Record<string, number[]>;
    dates?: string[];
    as_of?: string;
    cgo_threshold?: number;
    volume_spike?: number;
  }) => {
    const { data } = await apiClient.post(`${ADV}/disposition`, payload);
    return data.data as Array<Record<string, any>>;
  },
};
