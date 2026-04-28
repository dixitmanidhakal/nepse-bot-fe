/**
 * Indicators API — now computed client-side from canonical OHLCV.
 *
 * Previously called `/api/v1/indicators/*` which returns 404 on the free
 * Vercel deployment (no Postgres). We now fetch bars via the universal data
 * layer (`src/data`) and compute indicators with `src/analytics/indicators`.
 *
 * Page-facing signatures are preserved, so StockAnalysis and similar pages
 * do not need any changes.
 */

import type { IndicatorSummary } from "../types";
import { getOhlcv } from "../data";
import {
  computeIndicatorSummary,
  sma,
  ema,
  rsi,
  macd,
  bollingerBands,
  atr,
  volumeRatio,
} from "../analytics/indicators";

function lastOf<T>(arr: (T | null)[]): T | null {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] != null) return arr[i] as T;
  }
  return null;
}

async function loadBars(symbol: string, days: number) {
  // Request slightly more bars so long-period indicators (SMA200) can warm up.
  const limit = Math.max(days, 250);
  const bars = await getOhlcv(symbol, limit);
  return bars;
}

export const indicatorsApi = {
  getSummary: async (symbol: string): Promise<IndicatorSummary> => {
    const bars = await loadBars(symbol, 250);
    if (!bars.length) {
      return { success: false, symbol };
    }
    const s = computeIndicatorSummary(bars);
    return {
      success: true,
      symbol,
      data_points: bars.length,
      summary: {
        current_price: s.price ?? undefined,
        sma_20: s.sma20 ?? undefined,
        sma_50: s.sma50 ?? undefined,
        ema_20: s.ema12 ?? undefined, // closest available
        rsi_14: s.rsi14 ?? undefined,
        macd: s.macd ?? undefined,
        macd_signal: s.macdSignal ?? undefined,
        macd_histogram: s.macdHist ?? undefined,
        atr_14: s.atr14 ?? undefined,
        bb_upper: s.bbUpper ?? undefined,
        bb_middle: s.bbMiddle ?? undefined,
        bb_lower: s.bbLower ?? undefined,
        volume_ratio: s.volumeRatio ?? undefined,
      },
    };
  },

  getAll: async (symbol: string, days = 200) => {
    const bars = await loadBars(symbol, days);
    const closes = bars.map((b) => b.close);
    const s = computeIndicatorSummary(bars);
    return {
      success: true,
      symbol,
      days,
      data_points: bars.length,
      summary: s,
      series: {
        dates: bars.map((b) => b.date),
        close: closes,
        sma_20: sma(closes, 20),
        sma_50: sma(closes, 50),
        sma_200: sma(closes, 200),
        ema_12: ema(closes, 12),
        ema_26: ema(closes, 26),
        rsi_14: rsi(closes, 14),
      },
    };
  },

  getMovingAverages: async (symbol: string, days = 200) => {
    const bars = await loadBars(symbol, days);
    const closes = bars.map((b) => b.close);
    const s20 = sma(closes, 20);
    const s50 = sma(closes, 50);
    const s200 = sma(closes, 200);
    const e12 = ema(closes, 12);
    const e26 = ema(closes, 26);
    // Shape mirrors legacy backend: { indicators: { sma: { sma_20: { current, values } } } }
    const pack = (vals: (number | null)[]) => ({
      current: lastOf(vals),
      values: vals,
    });
    return {
      success: true,
      symbol,
      days,
      dates: bars.map((b) => b.date),
      indicators: {
        sma: {
          sma_20: pack(s20),
          sma_50: pack(s50),
          sma_200: pack(s200),
        },
        ema: {
          ema_12: pack(e12),
          ema_26: pack(e26),
        },
      },
      // Flat fallback for any newer consumer
      data: {
        dates: bars.map((b) => b.date),
        sma_20: s20,
        sma_50: s50,
        sma_200: s200,
        ema_12: e12,
        ema_26: e26,
        latest: {
          sma_20: lastOf(s20),
          sma_50: lastOf(s50),
          sma_200: lastOf(s200),
          ema_12: lastOf(e12),
          ema_26: lastOf(e26),
        },
      },
    };
  },

  getMomentum: async (symbol: string, days = 200) => {
    const bars = await loadBars(symbol, days);
    const closes = bars.map((b) => b.close);
    const r = rsi(closes, 14);
    const m = macd(closes);
    return {
      success: true,
      symbol,
      days,
      data: {
        dates: bars.map((b) => b.date),
        rsi_14: r,
        macd: m.macd,
        macd_signal: m.signal,
        macd_hist: m.hist,
        latest: {
          rsi_14: lastOf(r),
          macd: lastOf(m.macd),
          macd_signal: lastOf(m.signal),
          macd_hist: lastOf(m.hist),
        },
      },
    };
  },

  getVolatility: async (symbol: string, days = 200) => {
    const bars = await loadBars(symbol, days);
    const closes = bars.map((b) => b.close);
    const bb = bollingerBands(closes, 20, 2);
    const a = atr(bars, 14);
    return {
      success: true,
      symbol,
      days,
      data: {
        dates: bars.map((b) => b.date),
        bb_upper: bb.upper,
        bb_middle: bb.middle,
        bb_lower: bb.lower,
        atr_14: a,
        latest: {
          bb_upper: lastOf(bb.upper),
          bb_middle: lastOf(bb.middle),
          bb_lower: lastOf(bb.lower),
          atr_14: lastOf(a),
        },
      },
    };
  },

  getVolume: async (symbol: string, days = 200) => {
    const bars = await loadBars(symbol, days);
    const vr = volumeRatio(bars, 20);
    const avg20 =
      bars.length >= 21
        ? bars
            .slice(bars.length - 21, bars.length - 1)
            .reduce((s, b) => s + b.volume, 0) / 20
        : null;
    return {
      success: true,
      symbol,
      days,
      data: {
        dates: bars.map((b) => b.date),
        volume: bars.map((b) => b.volume),
        avg_volume_20: avg20,
        volume_ratio: vr,
      },
    };
  },
};
