/**
 * freeProvider — maps `/api/v1/free/*` responses into canonical types.
 *
 * Upstream shapes (as verified in prod):
 *   GET /api/v1/free/health                    → freshness
 *   GET /api/v1/free/market/live               → { count, data: [...] }
 *   GET /api/v1/free/symbols/{sym}/prices      → { symbol, total, data: [...] }
 *   GET /api/v1/free/depth/{sym}               → { symbol, supply, demand, partial, source }
 *   GET /api/v1/free/floorsheet/latest?symbol  → { date, symbol, total, data: [...] }
 *   GET /api/v1/free/indices/sectors           → [{ indexCode, indexName, sectorMaster, ... }]
 */

import apiClient from "../../api/client";
import type { DataProvider } from "./types";
import type {
  CanonicalBar,
  CanonicalDepth,
  CanonicalDepthLevel,
  CanonicalFloorsheet,
  CanonicalFreshness,
  CanonicalSector,
  CanonicalStock,
  CanonicalTrade,
} from "../../types/canonical";

// ── Upstream types (exactly what BE returns) ───────────────────────────────
interface FreeHealth {
  yonepse?: {
    last_commit_utc?: string | null;
    commit_age_minutes?: number | null;
    data_last_updated?: string | null;
    data_age_minutes?: number | null;
    sample_symbol_count?: number | null;
  };
  samirwagle?: {
    last_commit_utc?: string | null;
    commit_age_minutes?: number | null;
    latest_floorsheet_date?: string | null;
    latest_floorsheet_age_hours?: number | null;
  };
  yonepse_fresh?: boolean;
  depth_available?: "full" | "partial" | "none";
  full_depth_available?: boolean;
}

interface FreeLiveStock {
  symbol: string;
  name?: string | null;
  ltp?: number | null;
  previous_close?: number | null;
  change?: number | null;
  percent_change?: number | null;
  high?: number | null;
  low?: number | null;
  volume?: number | null;
  turnover?: number | null;
  trades?: number | null;
  last_updated?: string | null;
  market_cap?: number | null;
}

interface FreeLiveResp {
  count: number;
  data: FreeLiveStock[];
}

interface FreePriceRow {
  date: string;
  open: number;
  high: number;
  low: number;
  ltp: number;
  percent_change?: number | null;
  qty: number;
  turnover?: number | null;
}

interface FreePricesResp {
  symbol: string;
  total: number;
  data: FreePriceRow[];
}

interface FreeDepthLvl {
  price: number;
  qty: number;
}

interface FreeDepthResp {
  symbol: string;
  supply: FreeDepthLvl[] | null;
  demand: FreeDepthLvl[] | null;
  partial: boolean;
  source: string;
}

interface FreeFsRow {
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

interface FreeFloorsheetResp {
  date: string | null;
  symbol: string;
  total: number;
  data: FreeFsRow[];
}

interface FreeSectorIndex {
  id: number;
  indexCode: string;
  indexName: string;
  description?: string;
  sectorMaster?: {
    id: number;
    sectorDescription: string;
    activeStatus?: string;
  };
  activeStatus?: string;
  // optional live fields
  currentValue?: number | null;
  percentageChange?: number | null;
}

// ── Mappers ────────────────────────────────────────────────────────────────
function mapStock(s: FreeLiveStock): CanonicalStock {
  return {
    symbol: s.symbol,
    name: s.name ?? null,
    sector: null, // free live snapshot has no sector info
    ltp: s.ltp ?? null,
    open: null,
    high: s.high ?? null,
    low: s.low ?? null,
    previousClose: s.previous_close ?? null,
    change: s.change ?? null,
    changePercent: s.percent_change ?? null,
    volume: s.volume ?? null,
    turnover: s.turnover ?? null,
    trades: s.trades ?? null,
    marketCap: s.market_cap ?? null,
    updatedAt: s.last_updated ?? null,
  };
}

function mapBar(symbol: string, r: FreePriceRow): CanonicalBar {
  return {
    symbol,
    date: r.date,
    open: r.open,
    high: r.high,
    low: r.low,
    close: r.ltp,
    volume: r.qty,
    turnover: r.turnover ?? null,
  };
}

function mapDepthLevels(rows: FreeDepthLvl[] | null): CanonicalDepthLevel[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({
    price: r.price,
    quantity: r.qty,
    orders: null,
  }));
}

function mapTrade(r: FreeFsRow): CanonicalTrade {
  return {
    tradeId: r.contract_no,
    symbol: r.symbol,
    buyer: r.buyer != null ? String(r.buyer) : null,
    seller: r.seller != null ? String(r.seller) : null,
    quantity: r.quantity,
    price: r.rate,
    time: null,
    value: r.amount,
  };
}

function mapSector(s: FreeSectorIndex): CanonicalSector {
  return {
    code: s.indexCode,
    name: s.indexName,
    indexValue: s.currentValue ?? null,
    changePercent: s.percentageChange ?? null,
  };
}

// ── Provider ───────────────────────────────────────────────────────────────
export const freeProvider: DataProvider = {
  name: "free",

  async getFreshness(): Promise<CanonicalFreshness> {
    try {
      const { data } = await apiClient.get<FreeHealth>("/api/v1/free/health");
      const depth: CanonicalFreshness["depthAvailability"] =
        data?.depth_available === "full"
          ? "full"
          : data?.depth_available === "partial"
          ? "partial"
          : "none";
      return {
        liveAgeMinutes: data?.yonepse?.commit_age_minutes ?? null,
        floorsheetAgeHours:
          data?.samirwagle?.latest_floorsheet_age_hours ?? null,
        liveFresh: !!data?.yonepse_fresh,
        depthAvailability: depth,
        source: "free",
        fetchedAt: new Date().toISOString(),
      };
    } catch {
      return {
        liveAgeMinutes: null,
        floorsheetAgeHours: null,
        liveFresh: false,
        depthAvailability: "none",
        source: "free",
        fetchedAt: new Date().toISOString(),
      };
    }
  },

  async getMarketSnapshot(): Promise<CanonicalStock[]> {
    const { data } = await apiClient.get<FreeLiveResp>(
      "/api/v1/free/market/live"
    );
    return (data?.data ?? []).map(mapStock);
  },

  async getOhlcv(symbol: string, limit = 365): Promise<CanonicalBar[]> {
    try {
      const { data } = await apiClient.get<FreePricesResp>(
        `/api/v1/free/symbols/${encodeURIComponent(symbol)}/prices`,
        { params: { limit } }
      );
      // BE returns newest-first; canonical convention is oldest-first for indicator calc.
      const rows = [...(data?.data ?? [])].reverse();
      return rows.map((r) => mapBar(symbol.toUpperCase(), r));
    } catch {
      return [];
    }
  },

  async getDepth(symbol: string): Promise<CanonicalDepth> {
    const { data } = await apiClient.get<FreeDepthResp>(
      `/api/v1/free/depth/${encodeURIComponent(symbol)}`
    );
    return {
      symbol: data?.symbol ?? symbol.toUpperCase(),
      bids: mapDepthLevels(data?.demand ?? null),
      asks: mapDepthLevels(data?.supply ?? null),
      partial: !!data?.partial,
      source: data?.source ?? "free",
      updatedAt: null,
    };
  },

  async getFloorsheet(
    symbol: string,
    _date?: string
  ): Promise<CanonicalFloorsheet> {
    const { data } = await apiClient.get<FreeFloorsheetResp>(
      `/api/v1/free/floorsheet/latest`,
      { params: { symbol, limit: 500 } }
    );
    const trades = (data?.data ?? []).map(mapTrade);
    const totalVolume = trades.reduce((s, t) => s + t.quantity, 0);
    const totalTurnover = trades.reduce((s, t) => s + t.value, 0);
    return {
      symbol: data?.symbol ?? symbol.toUpperCase(),
      date: data?.date ?? null,
      trades,
      totalTrades: trades.length,
      totalVolume,
      totalTurnover,
      source: "free:samirwagle",
    };
  },

  async getSectors(): Promise<CanonicalSector[]> {
    try {
      const { data } = await apiClient.get<FreeSectorIndex[]>(
        "/api/v1/free/indices/sectors"
      );
      return (Array.isArray(data) ? data : []).map(mapSector);
    } catch {
      return [];
    }
  },
};
