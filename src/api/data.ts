import apiClient from "./client";
import type { FetchResult } from "../types";

export const dataApi = {
  fetchMarket: async (): Promise<FetchResult> => {
    const { data } = await apiClient.post("/api/v1/data/fetch-market");
    return data;
  },

  fetchStocks: async (): Promise<FetchResult> => {
    const { data } = await apiClient.post("/api/v1/data/fetch-stocks");
    return data;
  },

  fetchOHLCV: async (symbol: string, days = 30): Promise<FetchResult> => {
    const { data } = await apiClient.post(
      `/api/v1/data/fetch-ohlcv/${symbol}`,
      null,
      {
        params: { days },
      }
    );
    return data;
  },

  fetchMarketDepth: async (symbol: string): Promise<FetchResult> => {
    const { data } = await apiClient.post(
      `/api/v1/data/fetch-market-depth/${symbol}`
    );
    return data;
  },

  fetchFloorsheet: async (symbol?: string): Promise<FetchResult> => {
    const { data } = await apiClient.post(
      "/api/v1/data/fetch-floorsheet",
      null,
      {
        params: symbol ? { symbol } : {},
      }
    );
    return data;
  },

  fetchAll: async (options?: {
    include_ohlcv?: boolean;
    include_depth?: boolean;
    include_floorsheet?: boolean;
    ohlcv_days?: number;
  }): Promise<FetchResult> => {
    const { data } = await apiClient.post("/api/v1/data/fetch-all", null, {
      params: options,
    });
    return data;
  },
};
