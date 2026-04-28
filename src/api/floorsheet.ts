import apiClient from "./client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Production-safe floorsheet (Vercel free tier).
 *
 * Legacy `/api/v1/floorsheet/{symbol}/*` endpoints require a local Postgres
 * DB and return 404 in production. We fetch the latest floorsheet for a symbol
 * from `/api/v1/free/floorsheet/latest` (samirwagle GitHub mirror) and
 * synthesize the shapes the existing pages expect.
 */

interface FsRow {
  date: string;
  sn: number;
  contract_no: string;
  symbol: string;
  buyer: number;
  seller: number;
  quantity: number;
  rate: number;
  amount: number;
}

interface FsLatestResp {
  date: string;
  symbol: string | null;
  total: number;
  data: FsRow[];
}

async function fetchLatest(symbol: string): Promise<FsLatestResp> {
  const { data } = await apiClient.get<FsLatestResp>(
    "/api/v1/free/floorsheet/latest",
    { params: { symbol } }
  );
  return data;
}

export const floorsheetApi = {
  getTrades: async (symbol: string, _days = 1, limit = 100): Promise<any> => {
    const r = await fetchLatest(symbol);
    const trades = r.data.slice(0, limit);
    return {
      success: true,
      status: "success",
      symbol,
      date: r.date,
      total_trades: r.total,
      total: r.total,
      trades,
    };
  },

  getAnalysis: async (symbol: string, _days = 7): Promise<any> => {
    const r = await fetchLatest(symbol);
    const rows = r.data;
    const totalQty = rows.reduce((s, t) => s + t.quantity, 0);
    const totalAmt = rows.reduce((s, t) => s + t.amount, 0);
    const avgRate = totalQty > 0 ? totalAmt / totalQty : 0;
    return {
      success: true,
      status: "success",
      symbol,
      date: r.date,
      data: {
        trades_count: rows.length,
        total_quantity: totalQty,
        total_amount: totalAmt,
        avg_rate: avgRate,
      },
    };
  },

  getInstitutional: async (
    symbol: string,
    _days = 7,
    quantity_threshold = 1000
  ): Promise<any> => {
    const r = await fetchLatest(symbol);
    const inst = r.data.filter((t) => t.quantity >= quantity_threshold);
    const totalQty = inst.reduce((s, t) => s + t.quantity, 0);
    const totalAmt = inst.reduce((s, t) => s + t.amount, 0);
    return {
      success: true,
      status: "success",
      symbol,
      date: r.date,
      threshold: quantity_threshold,
      trades: inst.slice(0, 100),
      total_quantity: totalQty,
      total_amount: totalAmt,
      institutional_trades: inst.length,
    };
  },

  getCrossTrades: async (symbol: string, _days = 7): Promise<any> => {
    const r = await fetchLatest(symbol);
    const cross = r.data.filter((t) => t.buyer === t.seller);
    return {
      success: true,
      status: "success",
      symbol,
      date: r.date,
      cross_trades: cross,
    };
  },

  getBrokers: async (symbol: string, _days = 7, limit = 10): Promise<any> => {
    const r = await fetchLatest(symbol);
    type Agg = {
      buy_qty: number;
      sell_qty: number;
      buy_amt: number;
      sell_amt: number;
      trades: number;
    };
    const map = new Map<number, Agg>();
    for (const t of r.data) {
      const b = map.get(t.buyer) ?? {
        buy_qty: 0,
        sell_qty: 0,
        buy_amt: 0,
        sell_amt: 0,
        trades: 0,
      };
      b.buy_qty += t.quantity;
      b.buy_amt += t.amount;
      b.trades += 1;
      map.set(t.buyer, b);
      const s = map.get(t.seller) ?? {
        buy_qty: 0,
        sell_qty: 0,
        buy_amt: 0,
        sell_amt: 0,
        trades: 0,
      };
      s.sell_qty += t.quantity;
      s.sell_amt += t.amount;
      s.trades += 1;
      map.set(t.seller, s);
    }
    const brokers = Array.from(map.entries())
      .map(([id, agg]) => ({
        broker_id: id,
        ...agg,
        net_quantity: agg.buy_qty - agg.sell_qty,
      }))
      .sort((a, b) => b.trades - a.trades)
      .slice(0, limit);
    return { success: true, status: "success", symbol, date: r.date, brokers };
  },

  getBrokerActivity: async (
    symbol: string,
    brokerId: string,
    _days = 30
  ): Promise<any> => {
    const r = await fetchLatest(symbol);
    const id = Number(brokerId);
    const related = r.data.filter((t) => t.buyer === id || t.seller === id);
    return {
      success: true,
      status: "success",
      symbol,
      broker_id: id,
      date: r.date,
      trades: related.slice(0, 100),
      total_trades: related.length,
    };
  },

  getAccumulation: async (symbol: string, _days = 30): Promise<any> => {
    const r = await fetchLatest(symbol);
    const map = new Map<
      number,
      { net_qty: number; buy_qty: number; sell_qty: number }
    >();
    for (const t of r.data) {
      const b = map.get(t.buyer) ?? { net_qty: 0, buy_qty: 0, sell_qty: 0 };
      b.buy_qty += t.quantity;
      b.net_qty += t.quantity;
      map.set(t.buyer, b);
      const s = map.get(t.seller) ?? { net_qty: 0, buy_qty: 0, sell_qty: 0 };
      s.sell_qty += t.quantity;
      s.net_qty -= t.quantity;
      map.set(t.seller, s);
    }
    const accumulators = Array.from(map.entries())
      .map(([id, agg]) => ({ broker_id: id, ...agg }))
      .sort((a, b) => b.net_qty - a.net_qty);
    const netTotal = accumulators.reduce((s, a) => s + a.net_qty, 0);
    const phase =
      netTotal > 0 ? "Accumulation" : netTotal < 0 ? "Distribution" : "Neutral";
    return {
      success: true,
      status: "success",
      symbol,
      date: r.date,
      phase,
      net_flow: netTotal,
      accumulators: accumulators.slice(0, 20),
    };
  },

  getBrokerSentiment: async (symbol: string, days = 7): Promise<any> => {
    const acc = await floorsheetApi.getAccumulation(symbol, days);
    return {
      success: true,
      status: "success",
      symbol,
      net_broker_flow: acc.net_flow,
      phase: acc.phase,
      top: acc.accumulators.slice(0, 10),
    };
  },

  getBrokerPairs: async (symbol: string, _days = 7): Promise<any> => {
    const r = await fetchLatest(symbol);
    const pairMap = new Map<
      string,
      { buyer: number; seller: number; trades: number; qty: number }
    >();
    for (const t of r.data) {
      const k = `${t.buyer}-${t.seller}`;
      const p = pairMap.get(k) ?? {
        buyer: t.buyer,
        seller: t.seller,
        trades: 0,
        qty: 0,
      };
      p.trades += 1;
      p.qty += t.quantity;
      pairMap.set(k, p);
    }
    return {
      success: true,
      status: "success",
      symbol,
      pairs: Array.from(pairMap.values())
        .sort((a, b) => b.trades - a.trades)
        .slice(0, 20),
    };
  },

  getBrokerRanking: async (
    _params: { limit?: number; days?: number } = {}
  ): Promise<any> => ({
    success: false,
    status: "unavailable",
    message:
      "Broker ranking requires market-wide aggregation (not on free tier)",
    data: [],
  }),

  getInstitutionalBrokers: async (
    _params: { days?: number } = {}
  ): Promise<any> => ({
    success: false,
    status: "unavailable",
    message: "Requires market-wide floorsheet (not on free tier)",
    data: [],
  }),

  trackBroker: async (
    _brokerId: string,
    _params: { days?: number } = {}
  ): Promise<any> => ({
    success: false,
    status: "unavailable",
    message:
      "Broker tracking requires historical floorsheet DB (not on free tier)",
    data: [],
  }),
};
