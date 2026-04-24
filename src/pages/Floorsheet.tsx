import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  RefreshCw,
  Users,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { floorsheetApi } from "@/api/floorsheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { formatNumber, formatVolume } from "@/lib/utils";

const POPULAR_SYMBOLS = [
  "NABIL",
  "SCB",
  "HBL",
  "NICA",
  "EBL",
  "GBIME",
  "UPPER",
  "AKJCL",
];

export function Floorsheet() {
  const [symbol, setSymbol] = useState("NABIL");
  const [inputSymbol, setInputSymbol] = useState("NABIL");
  const [days, setDays] = useState(7);
  const [activeTab, setActiveTab] = useState<
    "trades" | "brokers" | "institutional" | "cross"
  >("trades");

  const {
    data: trades,
    isLoading: tradesLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["floorsheet-trades", symbol, days],
    queryFn: () => floorsheetApi.getTrades(symbol, days, 50),
    enabled: !!symbol,
  });

  const { data: brokers, isLoading: brokersLoading } = useQuery({
    queryKey: ["floorsheet-brokers", symbol, days],
    queryFn: () => floorsheetApi.getBrokers(symbol, days, 10),
    enabled: !!symbol,
  });

  const { data: institutional } = useQuery({
    queryKey: ["floorsheet-institutional", symbol, days],
    queryFn: () => floorsheetApi.getInstitutional(symbol, days),
    enabled: !!symbol,
  });

  const { data: crossTrades } = useQuery({
    queryKey: ["floorsheet-cross", symbol, days],
    queryFn: () => floorsheetApi.getCrossTrades(symbol, days),
    enabled: !!symbol,
  });

  const { data: accumulation } = useQuery({
    queryKey: ["floorsheet-accumulation", symbol, days],
    queryFn: () => floorsheetApi.getAccumulation(symbol, days),
    enabled: !!symbol,
  });

  const handleSearch = () => {
    if (inputSymbol.trim()) setSymbol(inputSymbol.trim().toUpperCase());
  };

  const tabs = [
    {
      key: "trades" as const,
      label: "Recent Trades",
      count: trades?.total_trades,
    },
    {
      key: "brokers" as const,
      label: "Top Brokers",
      count: brokers?.brokers?.length,
    },
    {
      key: "institutional" as const,
      label: "Institutional",
      count: institutional?.trades?.length,
    },
    {
      key: "cross" as const,
      label: "Cross Trades",
      count: crossTrades?.cross_trades?.length,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Floorsheet Analysis
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Trade details, broker activity & manipulation detection
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-secondary hover:bg-accent text-foreground transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={inputSymbol}
                onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter stock symbol"
                className="w-full pl-9 pr-3 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-3 py-2 text-sm bg-secondary border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              Analyze
            </button>
          </div>
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
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accumulation Phase */}
      {accumulation?.success && accumulation.phase && (
        <div
          className={`p-4 rounded-lg border flex items-center gap-3 ${
            accumulation.phase.includes("Accumulation")
              ? "bg-green-500/10 border-green-500/20"
              : accumulation.phase.includes("Distribution")
              ? "bg-red-500/10 border-red-500/20"
              : "bg-yellow-500/10 border-yellow-500/20"
          }`}
        >
          <Building2
            className={`w-5 h-5 ${
              accumulation.phase.includes("Accumulation")
                ? "text-green-400"
                : accumulation.phase.includes("Distribution")
                ? "text-red-400"
                : "text-yellow-400"
            }`}
          />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {accumulation.phase}
            </p>
            <p className="text-xs text-muted-foreground">
              {symbol} — {days} day analysis
            </p>
          </div>
        </div>
      )}

      {/* Cross Trade Warning */}
      {crossTrades?.cross_trades && crossTrades.cross_trades.length > 0 && (
        <div className="p-4 rounded-lg border bg-red-500/10 border-red-500/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">
              ⚠️ Cross Trades Detected
            </p>
            <p className="text-xs text-muted-foreground">
              {crossTrades.cross_trades.length} cross trades found — same broker
              on both sides. Potential manipulation.
            </p>
          </div>
        </div>
      )}

      {tradesLoading && (
        <PageLoader text={`Loading floorsheet for ${symbol}...`} />
      )}
      {error && (
        <ErrorMessage
          message={`No floorsheet data for ${symbol}. Fetch floorsheet data first.`}
          onRetry={() => refetch()}
        />
      )}

      {!tradesLoading && !error && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeTab === key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {count !== undefined && count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Recent Trades */}
          {activeTab === "trades" && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Trades — {symbol}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {trades?.trades && trades.trades.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Date
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Buyer
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Seller
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Qty
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Rate
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Flags
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.trades.map((trade: any, i: number) => (
                          <tr
                            key={i}
                            className={`border-b border-border hover:bg-accent/50 transition-colors ${
                              trade.is_cross_trade ? "bg-red-500/5" : ""
                            }`}
                          >
                            <td className="px-4 py-2.5 text-muted-foreground text-xs">
                              {trade.trade_date
                                ? new Date(
                                    trade.trade_date
                                  ).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="px-4 py-2.5 text-green-400 font-medium">
                              {trade.buyer_broker || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-red-400 font-medium">
                              {trade.seller_broker || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right text-foreground">
                              {trade.quantity?.toLocaleString() || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right text-foreground">
                              Rs {formatNumber(trade.rate)}
                            </td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground">
                              {formatVolume(trade.amount)}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex gap-1">
                                {trade.is_institutional && (
                                  <span className="px-1.5 py-0.5 text-xs rounded bg-blue-500/10 text-blue-400">
                                    Inst
                                  </span>
                                )}
                                {trade.is_cross_trade && (
                                  <span className="px-1.5 py-0.5 text-xs rounded bg-red-500/10 text-red-400">
                                    Cross
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No trade data available
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Top Brokers */}
          {activeTab === "brokers" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Top Brokers — {symbol}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {brokers?.brokers && brokers.brokers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Broker
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Buy Qty
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Sell Qty
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Net
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Trades
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Sentiment
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {brokers.brokers.map((broker: any, i: number) => (
                          <tr
                            key={i}
                            className="border-b border-border hover:bg-accent/50 transition-colors"
                          >
                            <td className="px-4 py-2.5 font-semibold text-foreground">
                              {broker.broker_id || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right text-green-400">
                              {broker.buy_quantity?.toLocaleString() || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right text-red-400">
                              {broker.sell_quantity?.toLocaleString() || "—"}
                            </td>
                            <td
                              className={`px-4 py-2.5 text-right font-medium ${
                                (broker.net_quantity || 0) > 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {(broker.net_quantity || 0) > 0 ? "+" : ""}
                              {broker.net_quantity?.toLocaleString() || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground">
                              {broker.trade_count || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span
                                className={`text-xs font-medium capitalize ${
                                  broker.sentiment === "bullish"
                                    ? "text-green-400"
                                    : broker.sentiment === "bearish"
                                    ? "text-red-400"
                                    : "text-yellow-400"
                                }`}
                              >
                                {broker.sentiment || "—"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No broker data available
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Institutional Trades */}
          {activeTab === "institutional" && (
            <Card>
              <CardHeader>
                <CardTitle>Institutional Trades — {symbol}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {institutional?.trades && institutional.trades.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Date
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Buyer
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Seller
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Qty
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {institutional.trades.map((trade: any, i: number) => (
                          <tr
                            key={i}
                            className="border-b border-border hover:bg-accent/50 transition-colors"
                          >
                            <td className="px-4 py-2.5 text-muted-foreground text-xs">
                              {trade.trade_date
                                ? new Date(
                                    trade.trade_date
                                  ).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="px-4 py-2.5 text-green-400 font-medium">
                              {trade.buyer_broker || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-red-400 font-medium">
                              {trade.seller_broker || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-blue-400">
                              {trade.quantity?.toLocaleString() || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right text-foreground">
                              Rs {formatNumber(trade.rate)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No institutional trades found
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cross Trades */}
          {activeTab === "cross" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Cross Trades — {symbol}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {crossTrades?.cross_trades &&
                crossTrades.cross_trades.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Date
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Broker
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Qty
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {crossTrades.cross_trades.map(
                          (trade: any, i: number) => (
                            <tr
                              key={i}
                              className="border-b border-border bg-red-500/5 hover:bg-red-500/10 transition-colors"
                            >
                              <td className="px-4 py-2.5 text-muted-foreground text-xs">
                                {trade.trade_date
                                  ? new Date(
                                      trade.trade_date
                                    ).toLocaleDateString()
                                  : "—"}
                              </td>
                              <td className="px-4 py-2.5 text-red-400 font-medium">
                                {trade.buyer_broker || "—"}
                              </td>
                              <td className="px-4 py-2.5 text-right text-foreground">
                                {trade.quantity?.toLocaleString() || "—"}
                              </td>
                              <td className="px-4 py-2.5 text-right text-foreground">
                                Rs {formatNumber(trade.rate)}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-green-400 text-sm">
                    ✅ No cross trades detected — Clean floorsheet
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
