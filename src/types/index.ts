// ─── Health & Status ────────────────────────────────────────────────────────

export interface HealthStatus {
  status: "healthy" | "unhealthy";
  version: string;
  environment: string;
  checks: {
    database: "healthy" | "unhealthy";
    api: "healthy" | "unhealthy";
  };
}

export interface DataStatus {
  success: boolean;
  data?: {
    sectors_count: number;
    stocks_count: number;
    ohlcv_records: number;
    latest_ohlcv_date: string | null;
    market_depth_records: number;
    floorsheet_records: number;
  };
}

// ─── Sectors ────────────────────────────────────────────────────────────────

export interface Sector {
  id: number;
  name: string;
  symbol?: string;
  current_value?: number;
  change_percent?: number;
  momentum_30d?: number;
  momentum_7d?: number;
  stock_count?: number;
  bullish_stocks?: number;
  bearish_stocks?: number;
  trend?: string;
}

export interface SectorAnalysis {
  success: boolean;
  sectors?: Sector[];
  total_sectors?: number;
  bullish_count?: number;
  bearish_count?: number;
}

// ─── Stocks ─────────────────────────────────────────────────────────────────

export interface Stock {
  symbol: string;
  name?: string;
  sector_id?: number;
  sector_name?: string;
  sector?: string;
  last_price?: number;
  ltp?: number;
  change_percent?: number;
  volume?: number;
  avg_volume?: number;
  volume_ratio?: number;
  beta?: number;
  rsi?: number;
  rsi_14?: number;
  macd?: number;
  macd_signal?: number;
  sma_20?: number;
  sma_50?: number;
  pe_ratio?: number;
  roe?: number;
  dividend_yield?: number;
  score?: number;
  market_cap?: number;
  passes_volume_filter?: boolean;
  passes_beta_filter?: boolean;
  in_bullish_sector?: boolean;
}

export interface ScreenerResult {
  success: boolean;
  stocks?: Stock[];
  total?: number;
  total_results?: number;
  filters_applied?: string[];
  criteria?: Record<string, unknown>;
}

// ─── Indicators ─────────────────────────────────────────────────────────────

export interface IndicatorSummary {
  success: boolean;
  symbol?: string;
  data_points?: number;
  summary?: {
    current_price?: number;
    sma_20?: number;
    sma_50?: number;
    ema_20?: number;
    rsi_14?: number;
    macd?: number;
    macd_signal?: number;
    macd_histogram?: number;
    atr_14?: number;
    bb_upper?: number;
    bb_middle?: number;
    bb_lower?: number;
    volume_ratio?: number;
    obv?: number;
  };
}

export interface OHLCVPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── Patterns ───────────────────────────────────────────────────────────────

export interface PatternSummary {
  success: boolean;
  symbol?: string;
  summary?: {
    nearest_support?: number;
    nearest_resistance?: number;
    primary_trend?: string;
    trend_strength?: number;
    active_patterns?: string[];
    signal?: string;
    signal_strength?: number;
  };
}

export interface TradingSignal {
  success: boolean;
  symbol?: string;
  signal?: string;
  signal_strength?: number;
  signals?: Array<{
    type: string;
    signal: string;
    strength: number;
    description: string;
  }>;
}

// ─── Market Depth ───────────────────────────────────────────────────────────

export interface OrderBookEntry {
  price: number;
  quantity: number;
  broker?: string;
}

export interface MarketDepth {
  symbol: string;
  buy_orders?: OrderBookEntry[];
  sell_orders?: OrderBookEntry[];
  total_buy_quantity?: number;
  total_sell_quantity?: number;
  imbalance?: number;
  spread?: number;
  best_bid?: number;
  best_ask?: number;
}

export interface DepthAnalysis {
  success: boolean;
  data?: {
    symbol: string;
    imbalance?: {
      success: boolean;
      imbalance_ratio?: number;
      signal?: string;
      total_buy?: number;
      total_sell?: number;
    };
    walls?: {
      success: boolean;
      bid_walls?: Array<{ price: number; quantity: number }>;
      ask_walls?: Array<{ price: number; quantity: number }>;
    };
    liquidity?: {
      success: boolean;
      liquidity_score?: number;
      spread_percent?: number;
      depth_score?: number;
    };
    pressure?: {
      success: boolean;
      pressure_score?: number;
      direction?: string;
    };
  };
}

// ─── Floorsheet ─────────────────────────────────────────────────────────────

export interface Trade {
  id?: number;
  trade_date?: string;
  buyer_broker?: string;
  seller_broker?: string;
  quantity?: number;
  rate?: number;
  amount?: number;
  is_institutional?: boolean;
  is_cross_trade?: boolean;
}

export interface BrokerActivity {
  broker_id: string;
  buy_quantity?: number;
  sell_quantity?: number;
  net_quantity?: number;
  total_amount?: number;
  trade_count?: number;
  sentiment?: string;
}

export interface FloorsheetAnalysis {
  success: boolean;
  symbol?: string;
  trades?: Trade[];
  total_trades?: number;
  top_brokers?: BrokerActivity[];
  accumulation_phase?: string;
  institutional_trades?: Trade[];
  cross_trades?: Trade[];
}

// ─── Data Fetching ───────────────────────────────────────────────────────────

export interface FetchResult {
  success?: boolean;
  status?: string;
  message?: string;
  records_saved?: number;
  error?: string;
}

// ─── Screener Criteria ───────────────────────────────────────────────────────

export interface ScreeningCriteria {
  min_volume_ratio?: number;
  max_beta?: number;
  min_beta?: number;
  bullish_sector_only?: boolean;
  min_rsi?: number;
  max_rsi?: number;
  price_above_sma20?: boolean;
  price_above_sma50?: boolean;
  macd_bullish?: boolean;
  min_pe_ratio?: number;
  max_pe_ratio?: number;
  min_roe?: number;
  min_dividend_yield?: number;
  min_price?: number;
  max_price?: number;
  limit?: number;
}
