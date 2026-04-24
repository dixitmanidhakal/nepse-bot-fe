import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Filter, RefreshCw, Zap } from "lucide-react";
import { stocksApi } from "@/api/stocks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { formatNumber, formatPercent, getChangeColor } from "@/lib/utils";
import type { ScreeningCriteria } from "@/types";

type PresetKey =
  | "momentum"
  | "value"
  | "growth"
  | "defensive"
  | "oversold"
  | "high-volume";

const PRESETS: {
  key: PresetKey;
  label: string;
  desc: string;
  color: string;
}[] = [
  {
    key: "momentum",
    label: "Momentum",
    desc: "Price above SMA20/50, RSI 50-70, MACD bullish",
    color: "text-green-400",
  },
  {
    key: "value",
    label: "Value",
    desc: "Low P/E, high ROE, dividend yield > 2%",
    color: "text-blue-400",
  },
  {
    key: "growth",
    label: "Growth",
    desc: "High ROE > 20%, bullish sector, strong momentum",
    color: "text-purple-400",
  },
  {
    key: "defensive",
    label: "Defensive",
    desc: "Low beta < 0.8, stable dividends",
    color: "text-yellow-400",
  },
  {
    key: "oversold",
    label: "Oversold",
    desc: "RSI < 30, bullish sector, high volume",
    color: "text-orange-400",
  },
  {
    key: "high-volume",
    label: "High Volume",
    desc: "Volume > 2x average (liquidity hunt)",
    color: "text-cyan-400",
  },
];

export function StockScreener() {
  const [activePreset, setActivePreset] = useState<PresetKey | "custom">(
    "momentum"
  );
  const [criteria, setCriteria] = useState<ScreeningCriteria>({
    min_volume_ratio: undefined,
    min_beta: undefined,
    max_beta: undefined,
    min_rsi: undefined,
    max_rsi: undefined,
    price_above_sma20: false,
    price_above_sma50: false,
    macd_bullish: false,
    bullish_sector_only: false,
    limit: 20,
  });

  const presetQueries = {
    momentum: useQuery({
      queryKey: ["screener-momentum"],
      queryFn: () => stocksApi.getMomentum(20),
      enabled: activePreset === "momentum",
    }),
    value: useQuery({
      queryKey: ["screener-value"],
      queryFn: () => stocksApi.getValue(20),
      enabled: activePreset === "value",
    }),
    growth: useQuery({
      queryKey: ["screener-growth"],
      queryFn: () => stocksApi.getGrowth(20),
      enabled: activePreset === "growth",
    }),
    defensive: useQuery({
      queryKey: ["screener-defensive"],
      queryFn: () => stocksApi.getDefensive(20),
      enabled: activePreset === "defensive",
    }),
    oversold: useQuery({
      queryKey: ["screener-oversold"],
      queryFn: () => stocksApi.getOversold(20),
      enabled: activePreset === "oversold",
    }),
    "high-volume": useQuery({
      queryKey: ["screener-high-volume"],
      queryFn: () => stocksApi.getHighVolume(2.0, 20),
      enabled: activePreset === "high-volume",
    }),
  };

  const customMutation = useMutation({
    mutationFn: (c: ScreeningCriteria) => stocksApi.screen(c),
  });

  const currentQuery =
    activePreset !== "custom" ? presetQueries[activePreset] : null;
  const stocks =
    activePreset === "custom"
      ? customMutation.data?.stocks || []
      : currentQuery?.data?.stocks || [];

  const isLoading =
    activePreset === "custom"
      ? customMutation.isPending
      : currentQuery?.isLoading;
  const error =
    activePreset === "custom" ? customMutation.error : currentQuery?.error;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock Screener</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Filter stocks by technical & fundamental criteria
          </p>
        </div>
      </div>

      {/* Preset Buttons */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Quick Presets
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {PRESETS.map(({ key, label, desc, color }) => (
            <button
              key={key}
              onClick={() => setActivePreset(key)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                activePreset === key
                  ? "border-primary/50 bg-primary/10"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  activePreset === key ? "text-primary" : color
                }`}
              >
                {label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                {desc}
              </p>
            </button>
          ))}
          <button
            onClick={() => setActivePreset("custom")}
            className={`p-3 rounded-lg border text-left transition-colors ${
              activePreset === "custom"
                ? "border-primary/50 bg-primary/10"
                : "border-border bg-card hover:bg-accent"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                activePreset === "custom"
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Filter className="w-3 h-3 inline mr-1" />
              Custom
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
              Build your own filter
            </p>
          </button>
        </div>
      </div>

      {/* Custom Criteria Form */}
      {activePreset === "custom" && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Screening Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Min Volume Ratio",
                  key: "min_volume_ratio",
                  placeholder: "e.g. 1.5",
                },
                { label: "Min Beta", key: "min_beta", placeholder: "e.g. 0.8" },
                { label: "Max Beta", key: "max_beta", placeholder: "e.g. 1.5" },
                { label: "Min RSI", key: "min_rsi", placeholder: "e.g. 30" },
                { label: "Max RSI", key: "max_rsi", placeholder: "e.g. 70" },
                {
                  label: "Min Price",
                  key: "min_price",
                  placeholder: "e.g. 100",
                },
                {
                  label: "Max Price",
                  key: "max_price",
                  placeholder: "e.g. 5000",
                },
                { label: "Limit", key: "limit", placeholder: "e.g. 20" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground block mb-1">
                    {label}
                  </label>
                  <input
                    type="number"
                    placeholder={placeholder}
                    value={(criteria as any)[key] || ""}
                    onChange={(e) =>
                      setCriteria((prev) => ({
                        ...prev,
                        [key]: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              {[
                { label: "Price above SMA20", key: "price_above_sma20" },
                { label: "Price above SMA50", key: "price_above_sma50" },
                { label: "MACD Bullish", key: "macd_bullish" },
                { label: "Bullish Sector Only", key: "bullish_sector_only" },
              ].map(({ label, key }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(criteria as any)[key] || false}
                    onChange={(e) =>
                      setCriteria((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm text-foreground">{label}</span>
                </label>
              ))}
            </div>
            <button
              onClick={() => customMutation.mutate(criteria)}
              disabled={customMutation.isPending}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {customMutation.isPending ? "Screening..." : "Run Screen"}
            </button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {isLoading && <PageLoader text="Screening stocks..." />}
      {error && (
        <ErrorMessage message="Screening failed. Make sure data is populated." />
      )}

      {stocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Results ({stocks.length} stocks)</span>
              {activePreset !== "custom" && (
                <button
                  onClick={() => currentQuery?.refetch()}
                  className="p-1.5 rounded hover:bg-accent transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      #
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Symbol
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Name
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Price
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Change %
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Volume Ratio
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Beta
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      RSI
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock: any, i: number) => (
                    <tr
                      key={stock.symbol}
                      className="border-b border-border hover:bg-accent/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary">
                        {stock.symbol}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {stock.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">
                        Rs {formatNumber(stock.last_price)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${getChangeColor(
                          stock.change_percent
                        )}`}
                      >
                        {formatPercent(stock.change_percent)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right ${
                          (stock.volume_ratio || 0) > 1.5
                            ? "text-green-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatNumber(stock.volume_ratio, 2)}x
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {formatNumber(stock.beta, 2)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right ${
                          (stock.rsi || 0) > 70
                            ? "text-red-400"
                            : (stock.rsi || 0) < 30
                            ? "text-green-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatNumber(stock.rsi, 1)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {stock.score !== undefined ? (
                          <span className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary font-medium">
                            {formatNumber(stock.score, 1)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading &&
        !error &&
        stocks.length === 0 &&
        activePreset !== "custom" && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No stocks found matching the criteria. Try fetching data first in
            Data Manager.
          </div>
        )}
    </div>
  );
}
