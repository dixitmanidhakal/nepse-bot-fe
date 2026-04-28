import apiClient from "./client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Production-safe market depth (Vercel free tier).
 *
 * Legacy `/api/v1/depth/*` endpoints hit a local Postgres DB (503 on Vercel).
 * We route to `/api/v1/free/depth/{sym}` which returns partial depth from the
 * yonepse GitHub mirror. Advanced analytics (20-level walls, imbalance-history,
 * support/resistance) are unavailable on the free tier and return empty
 * placeholders so the UI can still render gracefully.
 */

interface FreeDepthResp {
  symbol: string;
  supply: Array<{ price: number; qty: number }> | null;
  demand: Array<{ price: number; qty: number }> | null;
  partial: boolean;
  source: string;
}

async function getFreeDepth(symbol: string): Promise<FreeDepthResp> {
  const { data } = await apiClient.get<FreeDepthResp>(
    `/api/v1/free/depth/${symbol}`
  );
  return data;
}

function normaliseLevels(
  rows: Array<{ price: number; qty: number }> | null
): Array<{ price: number; quantity: number }> {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({ price: r.price, quantity: r.qty }));
}

function buildDepthPayload(d: FreeDepthResp) {
  const buy = normaliseLevels(d.demand);
  const sell = normaliseLevels(d.supply);
  const total_buy_quantity = buy.reduce((s, l) => s + l.quantity, 0);
  const total_sell_quantity = sell.reduce((s, l) => s + l.quantity, 0);
  const imbalance =
    total_buy_quantity + total_sell_quantity > 0
      ? (total_buy_quantity - total_sell_quantity) /
        (total_buy_quantity + total_sell_quantity)
      : 0;
  return {
    symbol: d.symbol,
    partial: d.partial,
    source: d.source,
    buy_orders: buy,
    sell_orders: sell,
    bids: buy,
    asks: sell,
    total_buy_quantity,
    total_sell_quantity,
    imbalance,
  };
}

export const depthApi = {
  getCurrent: async (symbol: string): Promise<any> => {
    const d = await getFreeDepth(symbol);
    return {
      success: true,
      status: "success",
      data: {
        ...buildDepthPayload(d),
        timestamp: new Date().toISOString(),
      },
    };
  },

  getAnalysis: async (symbol: string): Promise<any> => {
    const d = await getFreeDepth(symbol);
    const p = buildDepthPayload(d);
    return {
      success: true,
      status: "success",
      data: {
        ...p,
        summary: {
          total_bid_quantity: p.total_buy_quantity,
          total_ask_quantity: p.total_sell_quantity,
          imbalance: p.imbalance,
          levels_available: p.bids.length + p.asks.length,
        },
      },
    };
  },

  getImbalance: async (symbol: string): Promise<any> => {
    const d = await getFreeDepth(symbol);
    const p = buildDepthPayload(d);
    return {
      success: true,
      status: "success",
      data: { imbalance: p.imbalance },
    };
  },

  getWalls: async (_symbol: string, _wall_threshold = 2.0): Promise<any> => ({
    success: false,
    status: "unavailable",
    message: "Order-book walls require 20-level depth (not on free tier)",
    data: { walls: [] },
  }),

  getLiquidity: async (symbol: string): Promise<any> => {
    const d = await getFreeDepth(symbol);
    return { success: true, status: "success", data: buildDepthPayload(d) };
  },

  getSpread: async (symbol: string): Promise<any> => {
    const d = await getFreeDepth(symbol);
    const p = buildDepthPayload(d);
    const bestBid = p.bids[0]?.price ?? null;
    const bestAsk = p.asks[0]?.price ?? null;
    const spread = bestBid && bestAsk ? bestAsk - bestBid : null;
    return {
      success: true,
      status: "success",
      data: { best_bid: bestBid, best_ask: bestAsk, spread },
    };
  },

  getPressure: async (symbol: string): Promise<any> => {
    const d = await getFreeDepth(symbol);
    return { success: true, status: "success", data: buildDepthPayload(d) };
  },

  getHistory: async (_symbol: string, _hours = 24): Promise<any> => ({
    success: false,
    status: "unavailable",
    message: "Depth history not available on free tier (no persistent storage)",
    data: [],
  }),

  getSupportResistance: async (_symbol: string): Promise<any> => ({
    success: false,
    status: "unavailable",
    message: "Support/Resistance requires historical data (not on free tier)",
    data: { support: [], resistance: [] },
  }),

  seed: async (
    _params: { limit?: number; symbols?: string } = {}
  ): Promise<{ success: boolean; seeded: number; results: unknown }> => ({
    success: false,
    seeded: 0,
    results: { message: "Seeding disabled on serverless (no persistent DB)" },
  }),
};
