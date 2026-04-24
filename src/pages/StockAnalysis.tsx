import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from "lucide-react";
import { indicatorsApi } from "@/api/indicators";
import { patternsApi } from "@/api/patterns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { SignalBadge } from "@/components/shared/StatCard";
import { formatNumber, formatPercent, getChangeColor } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const POPULAR_SYMBOLS = [
  "NABIL",
  "SCB",
  "HBL",
  "NICA",
  "EBL",
  "GBIME",
  "NLIC",
  "UPPER",
  "AKJCL",
  "NMBMF",
];

export function StockAnalysis() {
  const [symbol, setSymbol] = useState("NABIL");
  const [inputSymbol, setInputSymbol] = useState("NABIL");
  const [days, setDays] = useState(90);

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch,
  } = useQuery({
    queryKey: ["indicator-summary", symbol],
    queryFn: () => indicatorsApi.getSummary(symbol),
    enabled: !!symbol,
  });

  const { data: patterns, isLoading: patternsLoading } = useQuery({
    queryKey: ["pattern-summary", symbol, days],
    queryFn: () => patternsApi.getSummary(symbol, days),
    enabled: !!symbol,
  });

  const { data: signals } = useQuery({
    queryKey: ["signals", symbol, days],
    queryFn: () => patternsApi.getSignals(symbol, days),
    enabled: !!symbol,
  });

  const { data: maData } = useQuery({
    queryKey: ["moving-averages", symbol, days],
    queryFn: () => indicatorsApi.getMovingAverages(symbol, days),
    enabled: !!symbol,
  });

  const handleSearch = () => {
    if (inputSymbol.trim()) {
      setSymbol(inputSymbol.trim().toUpperCase());
    }
  };

  const s = summary?.summary;
  const p = patterns?.summary;

  // Build chart data from moving averages if available
  const chartData = maData?.indicators?.sma
    ? Object.entries(maData.indicators.sma as Record<string, number[]>)
        .find(([key]) => key === "sma_20")?.[1]
        ?.map((val: number, i: number) => ({ index: i, sma20: val })) || []
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock Analysis</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Technical indicators, patterns & trading signals
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={inputSymbol}
                  onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Enter stock symbol (e.g. NABIL)"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="px-3 py-2 text-sm bg-secondary border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={200}>200 days</option>
              </select>
              <button
                onClick={handleSearch}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
              >
                Analyze
              </button>
            </div>
          </div>
          {/* Quick symbols */}
          <div className="flex flex-wrap gap-2 mt-3">
            {POPULAR_SYMBOLS.map((sym) => (
              <button
                key={sym}
                onClick={() => {
                  setInputSymbol(sym);
                  setSymbol(sym);
                }}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  symbol === sym
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {summaryLoading && <PageLoader text={`Loading ${symbol} data...`} />}
      {summaryError && (
        <ErrorMessage
          message={`No data found for ${symbol}. Try fetching data first in Data Manager.`}
          onRetry={() => refetch()}
        />
      )}

      {s && (
        <>
          {/* Signal Banner */}
          {signals?.signal && (
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Trading Signal for {symbol}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <SignalBadge signal={signals.signal} />
                  {signals.signal_strength !== undefined && (
                    <span className="text-sm text-muted-foreground">
                      Strength: {(signals.signal_strength * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => refetch()}
                className="p-2 rounded-md hover:bg-accent transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Price & Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Current Price
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  Rs {formatNumber(s.current_price)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  RSI (14)
                </p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    (s.rsi_14 || 0) > 70
                      ? "text-red-500"
                      : (s.rsi_14 || 0) < 30
                      ? "text-green-500"
                      : "text-foreground"
                  }`}
                >
                  {formatNumber(s.rsi_14, 1)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(s.rsi_14 || 0) > 70
                    ? "Overbought"
                    : (s.rsi_14 || 0) < 30
                    ? "Oversold"
                    : "Neutral"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  ATR (14)
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatNumber(s.atr_14)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Volatility measure
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Volume Ratio
                </p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    (s.volume_ratio || 0) > 1.5
                      ? "text-green-500"
                      : "text-foreground"
                  }`}
                >
                  {formatNumber(s.volume_ratio, 2)}x
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  vs 20-day avg
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Moving Averages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Moving Averages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: "SMA 20", value: s.sma_20 },
                    { label: "SMA 50", value: s.sma_50 },
                    { label: "EMA 20", value: s.ema_20 },
                  ].map(({ label, value }) => {
                    const diff =
                      s.current_price && value
                        ? ((s.current_price - value) / value) * 100
                        : null;
                    return (
                      <div
                        key={label}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <span className="text-sm text-muted-foreground">
                          {label}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-foreground">
                            Rs {formatNumber(value)}
                          </span>
                          {diff !== null && (
                            <span className={`text-xs ${getChangeColor(diff)}`}>
                              {diff > 0 ? (
                                <TrendingUp className="w-3 h-3 inline mr-0.5" />
                              ) : diff < 0 ? (
                                <TrendingDown className="w-3 h-3 inline mr-0.5" />
                              ) : (
                                <Minus className="w-3 h-3 inline mr-0.5" />
                              )}
                              {formatPercent(diff)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>MACD</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: "MACD Line", value: s.macd },
                    { label: "Signal Line", value: s.macd_signal },
                    { label: "Histogram", value: s.macd_histogram },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <span className="text-sm text-muted-foreground">
                        {label}
                      </span>
                      <span
                        className={`text-sm font-medium ${getChangeColor(
                          value
                        )}`}
                      >
                        {formatNumber(value, 4)}
                      </span>
                    </div>
                  ))}
                  <div className="mt-2 p-2 rounded bg-secondary text-xs text-muted-foreground">
                    {(s.macd || 0) > (s.macd_signal || 0)
                      ? "✅ MACD above signal — Bullish momentum"
                      : "⚠️ MACD below signal — Bearish momentum"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bollinger Bands */}
          <Card>
            <CardHeader>
              <CardTitle>Bollinger Bands</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    label: "Upper Band",
                    value: s.bb_upper,
                    color: "text-red-400",
                  },
                  {
                    label: "Middle Band (SMA20)",
                    value: s.bb_middle,
                    color: "text-yellow-400",
                  },
                  {
                    label: "Lower Band",
                    value: s.bb_lower,
                    color: "text-green-400",
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="text-center p-3 rounded-lg bg-secondary"
                  >
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={`text-lg font-bold mt-1 ${color}`}>
                      Rs {formatNumber(value)}
                    </p>
                  </div>
                ))}
              </div>
              {s.current_price && s.bb_upper && s.bb_lower && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Lower: {formatNumber(s.bb_lower)}</span>
                    <span>Price: {formatNumber(s.current_price)}</span>
                    <span>Upper: {formatNumber(s.bb_upper)}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            ((s.current_price - s.bb_lower) /
                              (s.bb_upper - s.bb_lower)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pattern Summary */}
          {p && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Support & Resistance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <span className="text-sm text-green-400">
                        Nearest Support
                      </span>
                      <span className="text-sm font-bold text-green-400">
                        Rs {formatNumber(p.nearest_support)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <span className="text-sm text-red-400">
                        Nearest Resistance
                      </span>
                      <span className="text-sm font-bold text-red-400">
                        Rs {formatNumber(p.nearest_resistance)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trend Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">
                        Primary Trend
                      </span>
                      <span
                        className={`text-sm font-semibold capitalize ${
                          p.primary_trend?.includes("up")
                            ? "text-green-400"
                            : p.primary_trend?.includes("down")
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {p.primary_trend || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">
                        Trend Strength
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {p.trend_strength !== undefined
                          ? `${(p.trend_strength * 100).toFixed(0)}%`
                          : "—"}
                      </span>
                    </div>
                    {p.active_patterns && p.active_patterns.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-2">
                          Active Patterns
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.active_patterns.map((pattern: string) => (
                            <span
                              key={pattern}
                              className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary border border-primary/20"
                            >
                              {pattern}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Individual Signals */}
          {signals?.signals && signals.signals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Signal Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {signals.signals.map((sig, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground capitalize">
                          {sig.type?.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sig.description}
                        </p>
                      </div>
                      <SignalBadge signal={sig.signal} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
