import apiClient from "./client";
import type { ScreenerResult, ScreeningCriteria } from "../types";

export const stocksApi = {
  screen: async (criteria: ScreeningCriteria): Promise<ScreenerResult> => {
    const { data } = await apiClient.post("/api/v1/stocks/screen", criteria);
    return data;
  },

  getHighVolume: async (
    min_volume_ratio = 2.0,
    limit = 20
  ): Promise<ScreenerResult> => {
    const { data } = await apiClient.get("/api/v1/stocks/screen/high-volume", {
      params: { min_volume_ratio, limit },
    });
    return data;
  },

  getMomentum: async (limit = 20): Promise<ScreenerResult> => {
    const { data } = await apiClient.get("/api/v1/stocks/screen/momentum", {
      params: { limit },
    });
    return data;
  },

  getValue: async (limit = 20): Promise<ScreenerResult> => {
    const { data } = await apiClient.get("/api/v1/stocks/screen/value", {
      params: { limit },
    });
    return data;
  },

  getDefensive: async (limit = 20): Promise<ScreenerResult> => {
    const { data } = await apiClient.get("/api/v1/stocks/screen/defensive", {
      params: { limit },
    });
    return data;
  },

  getGrowth: async (limit = 20): Promise<ScreenerResult> => {
    const { data } = await apiClient.get("/api/v1/stocks/screen/growth", {
      params: { limit },
    });
    return data;
  },

  getOversold: async (limit = 20): Promise<ScreenerResult> => {
    const { data } = await apiClient.get("/api/v1/stocks/screen/oversold", {
      params: { limit },
    });
    return data;
  },

  getBeta: async (symbol: string, days = 90) => {
    const { data } = await apiClient.get(`/api/v1/stocks/${symbol}/beta`, {
      params: { days },
    });
    return data;
  },

  getHighBeta: async (min_beta = 1.2, limit = 20) => {
    const { data } = await apiClient.get("/api/v1/stocks/beta/high", {
      params: { min_beta, limit },
    });
    return data;
  },

  getLowBeta: async (max_beta = 0.8, limit = 20) => {
    const { data } = await apiClient.get("/api/v1/stocks/beta/low", {
      params: { max_beta, limit },
    });
    return data;
  },
};
