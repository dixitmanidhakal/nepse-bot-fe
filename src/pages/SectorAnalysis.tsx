import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { sectorsApi } from "@/api/sectors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { formatNumber, formatPercent, getChangeColor } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export function SectorAnalysis() {
  const [selectedSector, setSelectedSector] = useState<number | null>(null);

  const {
    data: allSectors,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["sectors-all"],
    queryFn: sectorsApi.getAll,
  });

  const { data: bullish } = useQuery({
    queryKey: ["sectors-bullish"],
    queryFn: () => sectorsApi.getBullish(),
  });

  const { data: rotation } = useQuery({
    queryKey: ["sectors-rotation"],
    queryFn: sectorsApi.getRotation,
  });

  const { data: sectorStocks } = useQuery({
    queryKey: ["sector-stocks", selectedSector],
    queryFn: () => sectorsApi.getSectorStocks(selectedSector!),
    enabled: !!selectedSector,
  });

  if (isLoading) return <PageLoader text="Loading sector data..." />;
  if (error)
    return (
      <ErrorMessage
        message="Failed to load sector data. Make sure the backend is running and data is populated."
        onRetry={() => refetch()}
      />
    );

  const sectors = allSectors?.sectors || [];
  const chartData = sectors.slice(0, 10).map((s: any) => ({
    name: s.name?.substring(0, 8) || "Unknown",
    momentum: s.momentum_30d || 0,
    change: s.change_percent || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Sector Analysis
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sector performance, rotation & bullish opportunities
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Sectors
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {allSectors?.total_sectors || sectors.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Bullish Sectors
            </p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {bullish?.sectors?.length || allSectors?.bullish_count || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Bearish Sectors
            </p>
            <p className="text-2xl font-bold text-red-400 mt-1">
              {allSectors?.bearish_count || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Gaining Momentum
            </p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">
              {rotation?.gaining?.length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Momentum Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>30-Day Momentum by Sector</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="momentum" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell
                      key={index}
                      fill={entry.momentum >= 0 ? "#22c55e" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Sectors Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Sectors</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sectors.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No sector data available. Use Data Manager to fetch data.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Sector
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Value
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Change %
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      30D Momentum
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Stocks
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Trend
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {sectors.map((sector: any) => (
                    <tr
                      key={sector.id}
                      className="border-b border-border hover:bg-accent/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {sector.name}
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">
                        {formatNumber(sector.current_value)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${getChangeColor(
                          sector.change_percent
                        )}`}
                      >
                        {formatPercent(sector.change_percent)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${getChangeColor(
                          sector.momentum_30d
                        )}`}
                      >
                        {formatPercent(sector.momentum_30d)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {sector.stock_count || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`text-xs font-medium capitalize ${
                            sector.trend?.includes("up")
                              ? "text-green-400"
                              : sector.trend?.includes("down")
                              ? "text-red-400"
                              : "text-yellow-400"
                          }`}
                        >
                          {sector.trend || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            setSelectedSector(
                              selectedSector === sector.id ? null : sector.id
                            )
                          }
                          className="text-xs px-2 py-1 rounded bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {selectedSector === sector.id ? "Hide" : "Stocks"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sector Stocks */}
      {selectedSector && sectorStocks?.stocks && (
        <Card>
          <CardHeader>
            <CardTitle>Stocks in Selected Sector</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Symbol
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Price
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Change %
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Volume
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Beta
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sectorStocks.stocks.map((stock: any) => (
                    <tr
                      key={stock.symbol}
                      className="border-b border-border hover:bg-accent/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-primary">
                        {stock.symbol}
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
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {stock.volume?.toLocaleString() || "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {formatNumber(stock.beta, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sector Rotation */}
      {rotation?.success && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Gaining Momentum
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rotation.gaining?.length > 0 ? (
                <div className="space-y-2">
                  {rotation.gaining.map((s: any) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                    >
                      <span className="text-sm text-foreground">{s.name}</span>
                      <span className="text-sm font-medium text-green-400">
                        {formatPercent(s.momentum_30d)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No sectors gaining momentum
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                Losing Momentum
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rotation.losing?.length > 0 ? (
                <div className="space-y-2">
                  {rotation.losing.map((s: any) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                    >
                      <span className="text-sm text-foreground">{s.name}</span>
                      <span className="text-sm font-medium text-red-400">
                        {formatPercent(s.momentum_30d)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No sectors losing momentum
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
