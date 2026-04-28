/**
 * Quant API.
 *
 * The legacy `/api/v1/quant/*` and `/api/v1/quant/advanced/*` routes are not
 * available (or are broken) on the free Vercel deployment. This module
 * implements the most common primitives client-side using pure math so the
 * QuantLab / QuantAdvanced pages continue to function, and returns
 * "unsupported" placeholders for advanced statistical methods (HMM, BOCPD,
 * HRP, CVaR, conformal VaR, etc.) which require heavy libraries.
 */

// ── Public result types (compat with existing pages) ──────────────────────
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

// ── Local math helpers ────────────────────────────────────────────────────
function mean(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((s, v) => s + v, 0) / xs.length;
}

function stddev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const v = xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
}

function pctReturns(prices: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const p0 = prices[i - 1];
    if (p0 > 0) out.push((prices[i] - p0) / p0);
  }
  return out;
}

// ── classify regime ───────────────────────────────────────────────────────
function buildRegime(
  returns: number[],
  window: number,
  bullThreshold = 0.05,
  bearThreshold = -0.05
): RegimeResult {
  const recent = returns.slice(-window);
  const rollingReturn = recent.reduce((s, v) => s + v, 0); // cumulative over window
  const vol = stddev(recent) * Math.sqrt(252);
  let regime: RegimeResult["regime"] = "neutral";
  if (rollingReturn >= bullThreshold) regime = "bull";
  else if (rollingReturn <= bearThreshold) regime = "bear";
  const exposure = regime === "bull" ? 1.0 : regime === "bear" ? 0.3 : 0.6;
  return {
    regime,
    rolling_return: Number(rollingReturn.toFixed(4)),
    volatility: Number(vol.toFixed(4)),
    window,
    exposure_multiplier: exposure,
  };
}

// ── public API ────────────────────────────────────────────────────────────
export const quantApi = {
  classifyRegime: async (
    closes: number[],
    window = 60,
    bullThreshold = 0.05,
    bearThreshold = -0.05
  ): Promise<RegimeResult> => {
    const returns = pctReturns(closes);
    return buildRegime(returns, window, bullThreshold, bearThreshold);
  },

  classifyRegimeFromReturns: async (
    returns: number[],
    window = 60
  ): Promise<RegimeResult> => {
    return buildRegime(returns, window);
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
    const {
      signals,
      capital,
      prices,
      max_positions = 10,
      max_single_pct = 0.15,
      cash_reserve_pct = 0.1,
    } = payload;

    const investable = capital * (1 - cash_reserve_pct);
    // Rank signals by strength*confidence desc
    const ranked = [...signals]
      .map((s) => ({
        ...s,
        rank: (s.strength ?? s.score ?? 1) * (s.confidence ?? 1),
      }))
      .sort((a, b) => b.rank - a.rank)
      .slice(0, max_positions);

    const totalRank = ranked.reduce((s, r) => s + Math.max(r.rank, 0), 0);
    const positions: SizedPosition[] = [];
    let totalSpent = 0;

    for (const s of ranked) {
      const price = prices[s.symbol];
      if (!price || price <= 0) continue;
      const rawWeight = totalRank > 0 ? Math.max(s.rank, 0) / totalRank : 0;
      const weight = Math.min(rawWeight, max_single_pct);
      const value = investable * weight;
      const shares = Math.floor(value / price);
      if (shares <= 0) continue;
      const actualValue = shares * price;
      totalSpent += actualValue;
      positions.push({
        symbol: s.symbol,
        shares,
        weight: Number((actualValue / capital).toFixed(4)),
        value: Number(actualValue.toFixed(2)),
        sector: s.sector ?? "",
        signal_type: s.signal_type ?? "",
        confidence: s.confidence ?? 0,
      });
    }

    // Rough NEPSE brokerage + DP + SEBON estimate (~0.65% buy+sell round-trip)
    const estRT = Number((totalSpent * 0.0065 * 2).toFixed(2));

    return { positions, estimated_round_trip_cost: estRT };
  },

  transactionCost: async (amount: number, is_buy = true) => {
    // Simplified NEPSE cost model
    let commission = 0;
    if (amount <= 50000) commission = amount * 0.004;
    else if (amount <= 500000) commission = amount * 0.0037;
    else if (amount <= 2000000) commission = amount * 0.0034;
    else if (amount <= 10000000) commission = amount * 0.003;
    else commission = amount * 0.0027;
    const sebon = amount * 0.00015;
    const dp = 25; // Rs
    const cgt = is_buy ? 0 : Math.max(0, amount * 0.075); // approx
    const cost = commission + sebon + dp + (is_buy ? 0 : cgt);
    return {
      amount,
      cost: Number(cost.toFixed(2)),
      is_buy,
    };
  },

  kelly: async (
    win_prob: number,
    avg_win: number,
    avg_loss: number,
    max_kelly = 0.25
  ) => {
    if (avg_loss <= 0 || avg_win <= 0) return { kelly_fraction: 0 };
    const b = avg_win / avg_loss;
    const p = win_prob;
    const q = 1 - p;
    const f = (b * p - q) / b;
    const clamped = Math.max(0, Math.min(f, max_kelly));
    return { kelly_fraction: Number(clamped.toFixed(4)) };
  },
};

// ── Advanced endpoints (graceful unsupported responses) ───────────────────
function unsupported<T extends Record<string, unknown>>(
  name: string,
  extra: T = {} as T
) {
  // Non-throwing placeholder so pages render a "not available" state.
  return {
    unsupported: true,
    reason: `${name} requires server-side quant engine (not available on free tier)`,
    ...extra,
  };
}

export const advancedQuantApi = {
  regimeHMM: async (_payload: {
    closes: number[];
    n_states?: number;
    lookback?: number;
    n_init?: number;
  }) => {
    return unsupported("regimeHMM", {
      regime: "unknown",
      probabilities: {},
    });
  },

  regimeBOCPD: async (_payload: {
    returns: number[];
    hazard_lambda?: number;
    threshold?: number;
  }) => {
    return unsupported("regimeBOCPD", {
      cp_probs: [],
      changepoints: [],
      n_observations: 0,
      n_changepoints: 0,
    });
  },

  marketState: async (_payload: {
    prices: Record<string, number[]>;
    dates?: string[];
    as_of?: string;
  }) => {
    return unsupported("marketState", {
      summary: "unsupported",
      regime: "unknown",
      score: 0,
      engine: "n/a",
      nms: 0,
      rb: 0,
      vr: 0,
      mp: 0,
      note: "Requires server-side computation",
      as_of: new Date().toISOString().slice(0, 10),
    });
  },

  pairsSpread: async (payload: {
    prices_a: number[];
    prices_b: number[];
    lookback?: number;
  }): Promise<{
    z_score: number;
    hedge_ratio: number;
    spread_mean: number;
    spread_last: number | null;
    halflife: number | null;
    n_observations: number;
  }> => {
    // Simple z-score of spread A - hedge*B with hedge=mean(A)/mean(B)
    const { prices_a, prices_b } = payload;
    const n = Math.min(prices_a.length, prices_b.length);
    if (n < 20)
      return {
        z_score: 0,
        hedge_ratio: 1,
        spread_mean: 0,
        spread_last: null,
        halflife: null,
        n_observations: n,
      };
    const a = prices_a.slice(-n);
    const b = prices_b.slice(-n);
    const hedge = mean(a) / mean(b);
    const spread = a.map((v, i) => v - hedge * b[i]);
    const m = mean(spread);
    const sd = stddev(spread) || 1;
    const last = spread[spread.length - 1];
    return {
      z_score: Number(((last - m) / sd).toFixed(3)),
      hedge_ratio: Number(hedge.toFixed(4)),
      spread_mean: Number(m.toFixed(4)),
      spread_last: last,
      halflife: null,
      n_observations: n,
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
    // Equal-weight fallback for all methods.
    const { symbols, capital } = payload;
    if (!symbols.length)
      return {
        method: payload.method,
        capital,
        allocation: {} as Record<string, number>,
      };
    const w = 1 / symbols.length;
    const allocation: Record<string, number> = {};
    for (const s of symbols) allocation[s] = Number((capital * w).toFixed(2));
    return {
      method:
        payload.method === "equal"
          ? "equal"
          : `${payload.method}→equal(fallback)`,
      capital,
      allocation,
    };
  },

  conformalVaR: async (payload: {
    returns: number[];
    alpha?: number;
    window?: number;
  }) => {
    const { returns, alpha = 0.05, window = 100 } = payload;
    const sample = returns.slice(-window);
    if (sample.length < 10)
      return unsupported("conformalVaR (insufficient data)", {
        var: 0,
        alpha,
        confidence: 1 - alpha,
        window,
        n_observations: sample.length,
      });
    const sorted = [...sample].sort((a, b) => a - b);
    const idx = Math.max(0, Math.floor(alpha * sorted.length) - 1);
    return {
      var: Number(sorted[idx].toFixed(4)),
      alpha,
      confidence: 1 - alpha,
      window,
      n_observations: sample.length,
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
  }): Promise<Array<Record<string, any>>> => {
    const { candidates, top_n = 10 } = payload;
    return [...candidates]
      .map((c) => {
        const rank = Number(
          ((c.strength ?? 0) * (c.confidence ?? 0)).toFixed(4)
        );
        return {
          ...c,
          score: rank,
          rank_score: rank,
        };
      })
      .sort((a: any, b: any) => b.rank_score - a.rank_score)
      .slice(0, top_n);
  },

  disposition: async (_payload: {
    prices: Record<string, number[]>;
    volume?: Record<string, number[]>;
    dates?: string[];
    as_of?: string;
    cgo_threshold?: number;
    volume_spike?: number;
  }) => {
    return [];
  },
};
