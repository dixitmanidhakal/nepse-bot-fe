import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { depthApi } from "@/api/depth";
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

export function MarketDepth() {
  const [symbol, setSymbol] = useState("NABIL");
  const [inputSymbol, setInputSymbol] = useState("NABIL");

  const {
    data: analysis,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["depth-analysis", symbol],
    queryFn: () => depthApi.getAnalysis(symbol),
    enabled: !!symbol,
  });

  const { data: current } = useQuery({
    queryKey: ["depth-current", symbol],
    queryFn: () => depthApi.getCurrent(symbol),
    enabled: !!symbol,
    refetchInterval: 30_000,
  });

  const handleSearch = () => {
    if (inputSymbol.trim()) setSymbol(inputSymbol.trim().toUpperCase());
  };

  const depth = current?.data;
  const ana = analysis?.data;

  const totalBuy = depth?.total_buy_quantity || 0;
  const totalSell = depth?.total_sell_quantity || 0;
  const totalVolume = totalBuy + totalSell;
  const buyPercent = totalVolume > 0 ? (totalBuy / totalVolume) * 100 : 50;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Market Depth</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Order book analysis, walls & price pressure
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

      {isLoading && <PageLoader text={`Loading depth for ${symbol}...`} />}
      {error && (
        <ErrorMessage
          message={`No depth data for ${symbol}. Fetch market depth data first.`}
          onRetry={() => refetch()}
        />
      )}

      {depth && (
        <>
          {/* Buy/Sell Pressure Bar */}
          <Card>
            <CardHeader>
              <CardTitle>Order Book Pressure — {symbol}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-green-400 font-medium">
                  Buy: {formatVolume(totalBuy)} ({buyPercent.toFixed(1)}%)
                </span>
                <span className="text-red-400 font-medium">
                  Sell: {formatVolume(totalSell)} (
                  {(100 - buyPercent).toFixed(1)}%)
                </span>
              </div>
              <div className="h-4 rounded-full overflow-hidden bg-red-500/30 flex">
                <div
                  className="h-full bg-green-500 transition-all duration-500 rounded-l-full"
                  style={{ width: `${buyPercent}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Best Bid</p>
                  <p className="text-lg font-bold text-green-400 mt-1">
                    Rs {formatNumber(depth.best_bid)}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Spread</p>
                  <p className="text-lg font-bold text-foreground mt-1">
                    Rs {formatNumber(depth.spread)}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Best Ask</p>
                  <p className="text-lg font-bold text-red-400 mt-1">
                    Rs {formatNumber(depth.best_ask)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Book */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  Top 5 Buy Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-2 text-xs text-muted-foreground">
                        Price
                      </th>
                      <th className="text-right px-4 py-2 text-xs text-muted-foreground">
                        Quantity
                      </th>
                      <th className="text-right px-4 py-2 text-xs text-muted-foreground">
                        Broker
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(depth.buy_orders || [])
                      .slice(0, 5)
                      .map((order: any, i: number) => (
                        <tr
                          key={i}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-4 py-2.5 font-medium text-green-400">
                            Rs {formatNumber(order.price)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-foreground">
                            {order.quantity?.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">
                            {order.broker || "—"}
                          </td>
                        </tr>
                      ))}
                    {(!depth.buy_orders || depth.buy_orders.length === 0) && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-4 text-center text-muted-foreground text-xs"
                        >
                          No buy orders
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  Top 5 Sell Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-2 text-xs text-muted-foreground">
                        Price
                      </th>
                      <th className="text-right px-4 py-2 text-xs text-muted-foreground">
                        Quantity
                      </th>
                      <th className="text-right px-4 py-2 text-xs text-muted-foreground">
                        Broker
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(depth.sell_orders || [])
                      .slice(0, 5)
                      .map((order: any, i: number) => (
                        <tr
                          key={i}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-4 py-2.5 font-medium text-red-400">
                            Rs {formatNumber(order.price)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-foreground">
                            {order.quantity?.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">
                            {order.broker || "—"}
                          </td>
                        </tr>
                      ))}
                    {(!depth.sell_orders || depth.sell_orders.length === 0) && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-4 text-center text-muted-foreground text-xs"
                        >
                          No sell orders
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Analysis Cards */}
      {ana && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {ana.imbalance?.success && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Order Imbalance
                </p>
                <p
                  className={`text-xl font-bold mt-1 ${
                    (ana.imbalance.imbalance_ratio || 0) > 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {formatNumber(ana.imbalance.imbalance_ratio, 2)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                  {ana.imbalance.signal || "—"}
                </p>
              </CardContent>
            </Card>
          )}
          {ana.liquidity?.success && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Liquidity Score
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {formatNumber(ana.liquidity.liquidity_score, 1)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Spread: {formatNumber(ana.liquidity.spread_percent, 2)}%
                </p>
              </CardContent>
            </Card>
          )}
          {ana.pressure?.success && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Price Pressure
                </p>
                <p
                  className={`text-xl font-bold mt-1 ${
                    (ana.pressure.pressure_score || 0) > 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {formatNumber(ana.pressure.pressure_score, 2)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                  {ana.pressure.direction || "—"}
                </p>
              </CardContent>
            </Card>
          )}
          {ana.walls?.success && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Walls Detected
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {(ana.walls.bid_walls?.length || 0) +
                    (ana.walls.ask_walls?.length || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ana.walls.bid_walls?.length || 0} bid /{" "}
                  {ana.walls.ask_walls?.length || 0} ask
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
