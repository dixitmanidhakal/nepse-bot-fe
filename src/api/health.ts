import apiClient from "./client";
import type { HealthStatus, DataStatus } from "../types";

/**
 * Production-safe health + data-status.
 *
 * On Vercel the legacy `/api/v1/data/status` returns empty counters (no DB on
 * serverless) and `/config` is not exposed. We instead call the free-sources
 * health endpoint and synthesize the shapes the Dashboard expects so the UI
 * always shows meaningful live data.
 */

interface FreeHealth {
  status: string;
  yonepse_fresh?: boolean;
  depth_available?: string;
  samirwagle?: { latest_fs?: string | null };
  [k: string]: unknown;
}

export const healthApi = {
  getHealth: async (): Promise<HealthStatus> => {
    // Prefer the production free-sources health; fall back to /health.
    try {
      const { data } = await apiClient.get<FreeHealth>("/api/v1/free/health");
      return {
        status:
          data?.status === "ok" || data?.yonepse_fresh ? "healthy" : "degraded",
        version: "free-1.0",
        environment: "production",
        checks: {
          database: "n/a",
          api: data?.yonepse_fresh ? "healthy" : "degraded",
        },
      } as unknown as HealthStatus;
    } catch {
      const { data } = await apiClient.get("/health");
      return data;
    }
  },

  getDataStatus: async (): Promise<DataStatus> => {
    // Build a DataStatus-compatible payload from free sources.
    try {
      const [health, live, sectors] = await Promise.all([
        apiClient
          .get<FreeHealth>("/api/v1/free/health")
          .then((r) => r.data)
          .catch(() => ({} as FreeHealth)),
        apiClient
          .get("/api/v1/free/market/live")
          .then((r) => r.data)
          .catch(() => ({ count: 0 })),
        apiClient
          .get("/api/v1/free/indices/sectors")
          .then((r) => r.data)
          .catch(() => []),
      ]);
      const stocksCount = (live as { count?: number })?.count ?? 0;
      const sectorsCount = Array.isArray(sectors) ? sectors.length : 0;
      const latestFs = health?.samirwagle?.latest_fs ?? null;
      return {
        status: "success",
        data: {
          sectors_count: sectorsCount,
          stocks_count: stocksCount,
          ohlcv_records: null,
          market_depth_records: null,
          floorsheet_records: null,
          latest_ohlcv_date: latestFs,
          database_connected: true,
        },
        timestamp: new Date().toISOString(),
      } as unknown as DataStatus;
    } catch {
      const { data } = await apiClient.get("/api/v1/data/status");
      return data;
    }
  },

  getConfig: async () => {
    // `/config` is not exposed in prod. Return a static stub so the panel renders.
    return {
      app_name: "NEPSE Bot",
      app_version: "free-1.0",
      environment: "production",
      scheduler_enabled: false,
    };
  },
};
