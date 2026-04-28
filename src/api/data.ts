/**
 * Data management API.
 *
 * On the free Vercel deployment there is no writable database and no POST
 * ingestion endpoints — scrapers run on GitHub Actions and publish JSON
 * artifacts consumed by the backend at read time. This module therefore
 * returns graceful "not supported" responses that keep the DataManager page
 * functional without throwing.
 *
 * When running against a full backend (DATA_PROVIDER=backend), you can swap
 * the provider selection inside `src/data` and reintroduce POST endpoints.
 */

import type { FetchResult } from "../types";

function unsupported(op: string): FetchResult {
  return {
    success: false,
    status: "unsupported",
    message:
      `"${op}" is not available on the current deployment. ` +
      "Data ingestion is handled by upstream free-tier sources (yonepse / samirwagle); the backend serves read-only data.",
    records_saved: 0,
  };
}

export const dataApi = {
  fetchMarket: async (): Promise<FetchResult> => unsupported("fetchMarket"),
  fetchStocks: async (): Promise<FetchResult> => unsupported("fetchStocks"),
  fetchOHLCV: async (_symbol: string, _days = 30): Promise<FetchResult> =>
    unsupported("fetchOHLCV"),
  fetchMarketDepth: async (_symbol: string): Promise<FetchResult> =>
    unsupported("fetchMarketDepth"),
  fetchFloorsheet: async (_symbol?: string): Promise<FetchResult> =>
    unsupported("fetchFloorsheet"),
  fetchAll: async (_options?: {
    include_ohlcv?: boolean;
    include_depth?: boolean;
    include_floorsheet?: boolean;
    ohlcv_days?: number;
  }): Promise<FetchResult> => unsupported("fetchAll"),
};
