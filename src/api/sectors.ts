import apiClient from "./client";
import type { SectorAnalysis } from "../types";

export const sectorsApi = {
  getAll: async (): Promise<SectorAnalysis> => {
    const { data } = await apiClient.get("/api/v1/sectors/");
    return data;
  },

  getTopPerformers: async (limit = 5, metric = "momentum_30d") => {
    const { data } = await apiClient.get("/api/v1/sectors/top-performers", {
      params: { limit, metric },
    });
    return data;
  },

  getBullish: async (min_momentum = 5.0) => {
    const { data } = await apiClient.get("/api/v1/sectors/analysis/bullish", {
      params: { min_momentum },
    });
    return data;
  },

  getRotation: async () => {
    const { data } = await apiClient.get("/api/v1/sectors/analysis/rotation");
    return data;
  },

  getComplete: async () => {
    const { data } = await apiClient.get("/api/v1/sectors/analysis/complete");
    return data;
  },

  getSectorDetails: async (sectorId: number) => {
    const { data } = await apiClient.get(`/api/v1/sectors/${sectorId}`);
    return data;
  },

  getSectorStocks: async (sectorId: number, sort_by = "change_percent") => {
    const { data } = await apiClient.get(`/api/v1/sectors/${sectorId}/stocks`, {
      params: { sort_by },
    });
    return data;
  },
};
