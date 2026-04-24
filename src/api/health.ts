import apiClient from "./client";
import type { HealthStatus, DataStatus } from "../types";

export const healthApi = {
  getHealth: async (): Promise<HealthStatus> => {
    const { data } = await apiClient.get("/health");
    return data;
  },

  getDataStatus: async (): Promise<DataStatus> => {
    const { data } = await apiClient.get("/api/v1/data/status");
    return data;
  },

  getConfig: async () => {
    const { data } = await apiClient.get("/config");
    return data;
  },
};
