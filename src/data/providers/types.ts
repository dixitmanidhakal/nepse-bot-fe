import type {
  CanonicalStock,
  CanonicalBar,
  CanonicalDepth,
  CanonicalFloorsheet,
  CanonicalSector,
  CanonicalFreshness,
} from "../../types/canonical";

/**
 * Provider contract — every upstream (free GitHub scrapers, prod Postgres,
 * future paid feed, mocks) implements this interface and maps its native
 * shape into canonical types.
 */
export interface DataProvider {
  readonly name: string;
  getFreshness(): Promise<CanonicalFreshness>;
  getMarketSnapshot(): Promise<CanonicalStock[]>;
  getOhlcv(symbol: string, limit?: number): Promise<CanonicalBar[]>;
  getDepth(symbol: string): Promise<CanonicalDepth>;
  getFloorsheet(symbol: string, date?: string): Promise<CanonicalFloorsheet>;
  getSectors(): Promise<CanonicalSector[]>;
}
