/**
 * Canonical data contract for the NEPSE bot frontend.
 *
 * Every page and every analytics helper must consume ONLY these shapes.
 * Data providers (free, legacy, mock, future scrapers) are responsible
 * for mapping their native upstream JSON into these types.
 */

export interface CanonicalStock {
  symbol: string;
  name: string | null;
  sector: string | null;
  ltp: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  turnover: number | null;
  trades: number | null;
  marketCap: number | null;
  updatedAt: string | null;
}

export interface CanonicalBar {
  symbol: string;
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number | null;
}

export interface CanonicalDepthLevel {
  price: number;
  quantity: number;
  orders: number | null;
}

export interface CanonicalDepth {
  symbol: string;
  bids: CanonicalDepthLevel[];
  asks: CanonicalDepthLevel[];
  partial: boolean;
  source: string;
  updatedAt: string | null;
}

export interface CanonicalTrade {
  tradeId: string | null;
  symbol: string;
  buyer: string | null;
  seller: string | null;
  quantity: number;
  price: number;
  time: string | null;
  value: number;
}

export interface CanonicalFloorsheet {
  symbol: string;
  date: string | null;
  trades: CanonicalTrade[];
  totalTrades: number;
  totalVolume: number;
  totalTurnover: number;
  source: string;
}

export interface CanonicalSector {
  code: string;
  name: string;
  indexValue: number | null;
  changePercent: number | null;
}

export interface CanonicalFreshness {
  liveAgeMinutes: number | null;
  floorsheetAgeHours: number | null;
  liveFresh: boolean;
  depthAvailability: "full" | "partial" | "none";
  source: string;
  fetchedAt: string;
}

export interface CanonicalIndicatorSummary {
  symbol: string;
  asOf: string | null;
  price: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema12: number | null;
  ema26: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHist: number | null;
  rsi14: number | null;
  bbUpper: number | null;
  bbMiddle: number | null;
  bbLower: number | null;
  atr14: number | null;
  volumeRatio: number | null;
  signal: "BUY" | "SELL" | "HOLD";
  reasons: string[];
}

export interface CanonicalRecommendation {
  symbol: string;
  name: string | null;
  sector: string | null;
  ltp: number | null;
  changePercent: number | null;
  score: number;
  signal: "BUY" | "SELL" | "HOLD";
  reasons: string[];
}

export interface CanonicalPatternEvent {
  symbol: string;
  pattern: string;
  direction: "bullish" | "bearish" | "neutral";
  date: string;
  confidence: number;
}
