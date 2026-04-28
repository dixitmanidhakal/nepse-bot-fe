import apiClient from "./client";
import type { SectorAnalysis } from "../types";

/**
 * Production-safe sectors.
 *
 * Legacy `/api/v1/sectors/*` endpoints depend on a local DB (404 on Vercel).
 * We pull the sector list from `/api/v1/free/indices/sectors` (nepalstock
 * mirror) and derive per-sector stock aggregates from `/api/v1/free/market/live`.
 */

interface FreeSector {
  id: number;
  indexCode: string;
  indexName: string;
  description?: string;
  sectorMaster?: {
    id: number;
    sectorDescription: string;
    regulatoryBody?: string;
  };
  activeStatus?: string;
  keyIndexFlag?: string;
  baseYearMarketCapitalization?: number;
}

interface LiveStock {
  symbol: string;
  name?: string;
  ltp: number | null;
  percent_change?: number | null;
  volume?: number | null;
  turnover?: number | null;
}

async function fetchSectors(): Promise<FreeSector[]> {
  const { data } = await apiClient.get<FreeSector[]>(
    "/api/v1/free/indices/sectors"
  );
  return Array.isArray(data) ? data : [];
}

async function fetchLive(): Promise<LiveStock[]> {
  const { data } = await apiClient.get<{ data: LiveStock[] }>(
    "/api/v1/free/market/live"
  );
  return data?.data ?? [];
}

function buildAnalysis(
  sectors: FreeSector[],
  live: LiveStock[]
): SectorAnalysis {
  const gainers = live.filter((s) => (s.percent_change ?? 0) > 0);
  const losers = live.filter((s) => (s.percent_change ?? 0) < 0);
  return {
    status: "success",
    total_sectors: sectors.length,
    sectors: sectors.map((s) => ({
      sector_id: s.id,
      sector_name: s.sectorMaster?.sectorDescription || s.indexName,
      index_code: s.indexCode,
      index_name: s.indexName,
      stocks_count: null,
      avg_change_percent: null,
      total_turnover: null,
    })),
    market: {
      gainers: gainers.length,
      losers: losers.length,
      unchanged: live.length - gainers.length - losers.length,
      total: live.length,
    },
  } as unknown as SectorAnalysis;
}

export const sectorsApi = {
  getAll: async (): Promise<SectorAnalysis> => {
    const [sectors, live] = await Promise.all([fetchSectors(), fetchLive()]);
    return buildAnalysis(sectors, live);
  },

  getTopPerformers: async (limit = 5, _metric = "momentum_30d") => {
    const live = await fetchLive();
    const top = [...live]
      .sort((a, b) => (b.percent_change ?? -1e9) - (a.percent_change ?? -1e9))
      .slice(0, limit);
    return { status: "success", data: top };
  },

  getBullish: async (min_momentum = 0) => {
    const live = await fetchLive();
    const bullish = live.filter((s) => (s.percent_change ?? 0) >= min_momentum);
    return { status: "success", data: bullish.slice(0, 50) };
  },

  getRotation: async () => {
    const live = await fetchLive();
    const gainers = live.filter((s) => (s.percent_change ?? 0) > 0);
    const losers = live.filter((s) => (s.percent_change ?? 0) < 0);
    return {
      status: "success",
      data: {
        gainers: gainers.length,
        losers: losers.length,
        top_gainers: gainers
          .sort((a, b) => (b.percent_change ?? 0) - (a.percent_change ?? 0))
          .slice(0, 10),
        top_losers: losers
          .sort((a, b) => (a.percent_change ?? 0) - (b.percent_change ?? 0))
          .slice(0, 10),
      },
    };
  },

  getComplete: async () => {
    const a = await sectorsApi.getAll();
    return { status: "success", data: a };
  },

  getSectorDetails: async (sectorId: number) => {
    const sectors = await fetchSectors();
    const match = sectors.find((s) => s.id === sectorId);
    if (!match) {
      return { status: "not_found", sector_id: sectorId };
    }
    return { status: "success", data: match };
  },

  getSectorStocks: async (
    sectorId: number,
    sort_by = "change_percent"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> => {
    // 1) Resolve sectorId -> sector name (via the sector-indices master)
    const sectors = await fetchSectors();
    const match = sectors.find((s) => s.id === sectorId);
    const sectorName =
      match?.sectorMaster?.sectorDescription ||
      match?.indexName ||
      match?.indexCode ||
      "";

    const sortFn = (a: LiveStock, b: LiveStock) => {
      if (sort_by === "volume") return (b.volume ?? 0) - (a.volume ?? 0);
      if (sort_by === "turnover") return (b.turnover ?? 0) - (a.turnover ?? 0);
      return (b.percent_change ?? 0) - (a.percent_change ?? 0);
    };

    // 2) Try the new BE drill-down endpoint that joins securities+live
    if (sectorName) {
      try {
        const { data } = await apiClient.get<{
          sector: string;
          count: number;
          data: LiveStock[];
        }>(
          `/api/v1/free/indices/sectors/${encodeURIComponent(
            sectorName
          )}/stocks`,
          { timeout: 15_000 }
        );
        if (data?.data?.length) {
          const sorted = [...data.data].sort(sortFn);
          return {
            success: true,
            status: "success",
            sector: data.sector,
            count: data.count,
            stocks: sorted,
            data: sorted,
          };
        }
      } catch {
        /* fall through */
      }
    }

    // 3) Fallback: market-wide sorted list
    const live = await fetchLive();
    const sorted = [...live].sort(sortFn);
    return {
      success: true,
      status: "partial",
      message:
        "Sector→stock mapping not available; showing market-wide sorted list",
      stocks: sorted.slice(0, 50),
      data: sorted.slice(0, 50),
    };
  },
};
