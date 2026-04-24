import apiClient from "./client";
import type { PatternSummary, TradingSignal } from "../types";

export const patternsApi = {
  getSummary: async (symbol: string, days = 90): Promise<PatternSummary> => {
    const { data } = await apiClient.get(`/api/v1/patterns/${symbol}/summary`, {
      params: { days },
    });
    return data;
  },

  getAll: async (symbol: string, days = 120) => {
    const { data } = await apiClient.get(`/api/v1/patterns/${symbol}/all`, {
      params: { days },
    });
    return data;
  },

  getSupportResistance: async (symbol: string, days = 180) => {
    const { data } = await apiClient.get(
      `/api/v1/patterns/${symbol}/support-resistance`,
      {
        params: { days },
      }
    );
    return data;
  },

  getTrend: async (symbol: string, days = 90) => {
    const { data } = await apiClient.get(`/api/v1/patterns/${symbol}/trend`, {
      params: { days },
    });
    return data;
  },

  getTrendChannel: async (symbol: string, days = 90) => {
    const { data } = await apiClient.get(
      `/api/v1/patterns/${symbol}/trend/channel`,
      {
        params: { days },
      }
    );
    return data;
  },

  getTrendReversal: async (symbol: string, days = 60) => {
    const { data } = await apiClient.get(
      `/api/v1/patterns/${symbol}/trend/reversal`,
      {
        params: { days },
      }
    );
    return data;
  },

  getChartPatterns: async (symbol: string, days = 120) => {
    const { data } = await apiClient.get(
      `/api/v1/patterns/${symbol}/chart-patterns`,
      {
        params: { days },
      }
    );
    return data;
  },

  getBreakouts: async (symbol: string, days = 60) => {
    const { data } = await apiClient.get(
      `/api/v1/patterns/${symbol}/breakouts`,
      {
        params: { days },
      }
    );
    return data;
  },

  getSignals: async (symbol: string, days = 90): Promise<TradingSignal> => {
    const { data } = await apiClient.get(`/api/v1/patterns/${symbol}/signals`, {
      params: { days },
    });
    return data;
  },
};
