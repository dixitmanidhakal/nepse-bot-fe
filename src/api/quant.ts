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
