/**
 * Data layer — central entry point.
 *
 * Pages and analytics helpers should NEVER import from `../api/*` directly.
 * They import the canonical helpers exposed here, which delegate to whatever
 * provider is active (selected via VITE_DATA_PROVIDER env, default "free").
 *
 * To add a new scraper/source:
 *   1. Create `providers/myProvider.ts` implementing `DataProvider`.
 *   2. Register it in `PROVIDERS` below.
 *   3. Set `VITE_DATA_PROVIDER=my` on Vercel and redeploy.
 * No page code changes.
 */

import type { DataProvider } from "./providers/types";
import { freeProvider } from "./providers/freeProvider";
import type {
  CanonicalBar,
  CanonicalDepth,
  CanonicalFloorsheet,
  CanonicalFreshness,
  CanonicalSector,
  CanonicalStock,
} from "../types/canonical";

const PROVIDERS: Record<string, DataProvider> = {
  free: freeProvider,
};

function selectProvider(): DataProvider {
  const envName =
    (
      import.meta.env?.VITE_DATA_PROVIDER as string | undefined
    )?.toLowerCase() ?? "free";
  const p = PROVIDERS[envName];
  if (p) return p;
  // eslint-disable-next-line no-console
  console.warn(
    `[data] Unknown VITE_DATA_PROVIDER="${envName}", falling back to "free"`
  );
  return freeProvider;
}

export const provider: DataProvider = selectProvider();

// ── Public canonical API ───────────────────────────────────────────────────
export async function getFreshness(): Promise<CanonicalFreshness> {
  return provider.getFreshness();
}

export async function getMarketSnapshot(): Promise<CanonicalStock[]> {
  return provider.getMarketSnapshot();
}

export async function getOhlcv(
  symbol: string,
  limit = 365
): Promise<CanonicalBar[]> {
  return provider.getOhlcv(symbol, limit);
}

export async function getDepth(symbol: string): Promise<CanonicalDepth> {
  return provider.getDepth(symbol);
}

export async function getFloorsheet(
  symbol: string,
  date?: string
): Promise<CanonicalFloorsheet> {
  return provider.getFloorsheet(symbol, date);
}

export async function getSectors(): Promise<CanonicalSector[]> {
  return provider.getSectors();
}

// Re-export canonical types for convenience
export type {
  CanonicalStock,
  CanonicalBar,
  CanonicalDepth,
  CanonicalDepthLevel,
  CanonicalFloorsheet,
  CanonicalTrade,
  CanonicalSector,
  CanonicalFreshness,
  CanonicalIndicatorSummary,
  CanonicalRecommendation,
  CanonicalPatternEvent,
} from "../types/canonical";
