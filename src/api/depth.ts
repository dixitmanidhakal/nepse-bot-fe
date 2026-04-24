import apiClient from "./client";
import type { DepthAnalysis } from "../types";

export const depthApi = {
  getCurrent: async (symbol: string) => {
    const { data } = await apiClient.get(`/api/v1/depth/${symbol}/current`);
    return data;
  },

  getAnalysis: async (symbol: string): Promise<DepthAnalysis> => {
    const { data } = await apiClient.get(`/api/v1/depth/${symbol}/analysis`);
    return data;
  },

  getImbalance: async (symbol: string) => {
    const { data } = await apiClient.get(`/api/v1/depth/${symbol}/imbalance`);
    return data;
  },

  getWalls: async (symbol: string, wall_threshold = 2.0) => {
    const { data } = await apiClient.get(`/api/v1/depth/${symbol}/walls`, {
      params: { wall_threshold },
    });
    return data;
  },

  getLiquidity: async (symbol: string) => {
    const { data } = await apiClient.get(`/api/v1/depth/${symbol}/liquidity`);
    return data;
  },

  getSpread: async (symbol: string) => {
    const { data } = await apiClient.get(`/api/v1/depth/${symbol}/spread`);
    return data;
  },

  getPressure: async (symbol: string) => {
    const { data } = await apiClient.get(`/api/v1/depth/${symbol}/pressure`);
    return data;
  },

  getHistory: async (symbol: string, hours = 24) => {
    const { data } = await apiClient.get(`/api/v1/depth/${symbol}/history`, {
      params: { hours },
    });
    return data;
  },

  getSupportResistance: async (symbol: string) => {
    const { data } = await apiClient.get(
      `/api/v1/depth/${symbol}/support-resistance`
    );
    return data;
  },

  seed: async (
    params: { limit?: number; symbols?: string } = {}
  ): Promise<{ success: boolean; seeded: number; results: unknown }> => {
    const { data } = await apiClient.post(`/api/v1/depth/seed`, null, {
      params,
    });
    return data;
  },
};
