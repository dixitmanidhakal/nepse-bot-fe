import apiClient from "./client";
import type { IndicatorSummary } from "../types";

export const indicatorsApi = {
  getSummary: async (symbol: string): Promise<IndicatorSummary> => {
    const { data } = await apiClient.get(
      `/api/v1/indicators/${symbol}/summary`
    );
    return data;
  },

  getAll: async (symbol: string, days = 200) => {
    const { data } = await apiClient.get(`/api/v1/indicators/${symbol}`, {
      params: { days },
    });
    return data;
  },

  getMovingAverages: async (symbol: string, days = 200) => {
    const { data } = await apiClient.get(
      `/api/v1/indicators/${symbol}/moving-averages`,
      {
        params: { days },
      }
    );
    return data;
  },

  getMomentum: async (symbol: string, days = 200) => {
    const { data } = await apiClient.get(
      `/api/v1/indicators/${symbol}/momentum`,
      {
        params: { days },
      }
    );
    return data;
  },

  getVolatility: async (symbol: string, days = 200) => {
    const { data } = await apiClient.get(
      `/api/v1/indicators/${symbol}/volatility`,
      {
        params: { days },
      }
    );
    return data;
  },

  getVolume: async (symbol: string, days = 200) => {
    const { data } = await apiClient.get(
      `/api/v1/indicators/${symbol}/volume`,
      {
        params: { days },
      }
    );
    return data;
  },
};
