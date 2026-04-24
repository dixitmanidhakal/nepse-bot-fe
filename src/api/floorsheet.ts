import apiClient from "./client";

export const floorsheetApi = {
  getTrades: async (symbol: string, days = 1, limit = 100) => {
    const { data } = await apiClient.get(
      `/api/v1/floorsheet/${symbol}/trades`,
      {
        params: { days, limit },
      }
    );
    return data;
  },

  getAnalysis: async (symbol: string, days = 7) => {
    const { data } = await apiClient.get(
      `/api/v1/floorsheet/${symbol}/analysis`,
      {
        params: { days },
      }
    );
    return data;
  },

  getInstitutional: async (
    symbol: string,
    days = 7,
    quantity_threshold = 1000
  ) => {
    const { data } = await apiClient.get(
      `/api/v1/floorsheet/${symbol}/institutional`,
      {
        params: { days, quantity_threshold },
      }
    );
    return data;
  },

  getCrossTrades: async (symbol: string, days = 7) => {
    const { data } = await apiClient.get(
      `/api/v1/floorsheet/${symbol}/cross-trades`,
      {
        params: { days },
      }
    );
    return data;
  },

  getBrokers: async (symbol: string, days = 7, limit = 10) => {
    const { data } = await apiClient.get(
      `/api/v1/floorsheet/${symbol}/brokers`,
      {
        params: { days, limit },
      }
    );
    return data;
  },

  getBrokerActivity: async (symbol: string, brokerId: string, days = 30) => {
    const { data } = await apiClient.get(
      `/api/v1/floorsheet/${symbol}/broker/${brokerId}`,
      {
        params: { days },
      }
    );
    return data;
  },

  getAccumulation: async (symbol: string, days = 30) => {
    const { data } = await apiClient.get(
      `/api/v1/floorsheet/${symbol}/accumulation`,
      {
        params: { days },
      }
    );
    return data;
  },

  getBrokerSentiment: async (symbol: string, days = 7) => {
    const { data } = await apiClient.get(
      `/api/v1/floorsheet/${symbol}/broker-sentiment`,
      {
        params: { days },
      }
    );
    return data;
  },

  getBrokerRankings: async (days = 30, limit = 20) => {
    const { data } = await apiClient.get("/api/v1/floorsheet/brokers/ranking", {
      params: { days, limit },
    });
    return data;
  },

  getInstitutionalBrokers: async (days = 30) => {
    const { data } = await apiClient.get(
      "/api/v1/floorsheet/brokers/institutional",
      {
        params: { days },
      }
    );
    return data;
  },

  trackBroker: async (brokerId: string, symbol?: string, days = 30) => {
    const { data } = await apiClient.get(
      `/api/v1/floorsheet/brokers/${brokerId}/track`,
      {
        params: { symbol, days },
      }
    );
    return data;
  },
};
