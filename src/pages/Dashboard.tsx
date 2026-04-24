import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Database,
  Server,
  Wifi,
  RefreshCw,
  TrendingUp,
  BarChart2,
  FileText,
} from "lucide-react";
import { healthApi } from "@/api/health";
import { stocksApi } from "@/api/stocks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard, StatusBadge } from "@/components/shared/StatCard";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Link } from "react-router-dom";

export function Dashboard() {
  const {
    data: health,
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ["health"],
    queryFn: healthApi.getHealth,
    refetchInterval: 30_000,
  });

  const {
    data: status,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["data-status"],
    queryFn: healthApi.getDataStatus,
    refetchInterval: 60_000,
  });

  const { data: config } = useQuery({
    queryKey: ["config"],
    queryFn: healthApi.getConfig,
  });

  const { data: momentum } = useQuery({
    queryKey: ["signals-momentum"],
    queryFn: () => stocksApi.getMomentum(8),
    refetchInterval: 5 * 60_000,
  });

  const { data: highVolume } = useQuery({
    queryKey: ["signals-high-volume"],
    queryFn: () => stocksApi.getHighVolume(1.5, 8),
    refetchInterval: 5 * 60_000,
  });

  const { data: oversold } = useQuery({
    queryKey: ["signals-oversold"],
    queryFn: () => stocksApi.getOversold(8),
    refetchInterval: 5 * 60_000,
  });

  const handleRefresh = () => {
    refetchHealth();
    refetchStatus();
  };

  if (healthLoading && statusLoading)
    return <PageLoader text="Connecting to backend..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            NEPSE Trading Bot — System Overview
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-secondary hover:bg-accent text-foreground transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Health Status */}
      {healthError ? (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <Wifi className="w-4 h-4" />
          Cannot connect to backend at localhost:8000. Make sure the server is
          running.
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">API Server</span>
                </div>
                <StatusBadge
                  status={health?.status || "unhealthy"}
                  label={health?.status || "unknown"}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Database</span>
                </div>
                <StatusBadge
                  status={health?.checks?.database || "unhealthy"}
                  label={health?.checks?.database || "unknown"}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">NEPSE API</span>
                </div>
                <StatusBadge
                  status={health?.checks?.api || "unhealthy"}
                  label={health?.checks?.api || "unknown"}
                />
              </div>
            </div>
            {health && (
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span>Version: {health.version}</span>
                <span>Environment: {health.environment}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Statistics */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Database Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            title="Sectors"
            value={status?.data?.sectors_count ?? "—"}
            icon={<BarChart2 className="w-4 h-4" />}
          />
          <StatCard
            title="Stocks"
            value={status?.data?.stocks_count ?? "—"}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <StatCard
            title="OHLCV Records"
            value={status?.data?.ohlcv_records?.toLocaleString() ?? "—"}
            icon={<Activity className="w-4 h-4" />}
          />
          <StatCard
            title="Depth Records"
            value={status?.data?.market_depth_records?.toLocaleString() ?? "—"}
            icon={<Database className="w-4 h-4" />}
          />
          <StatCard
            title="Floorsheet Records"
            value={status?.data?.floorsheet_records?.toLocaleString() ?? "—"}
            icon={<FileText className="w-4 h-4" />}
          />
          <StatCard
            title="Latest OHLCV"
            value={
              status?.data?.latest_ohlcv_date
                ? new Date(status.data.latest_ohlcv_date).toLocaleDateString()
                : "—"
            }
            subtitle="Last data date"
          />
        </div>
      </div>

      {/* Live Signals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Live Signals
          </h2>
          <Link
            to="/screener"
            className="text-xs text-primary hover:underline"
          >
            Open full screener →
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SignalList
            title="Momentum (RSI 50-70, MACD bullish)"
            accent="text-green-400"
            stocks={momentum?.stocks ?? []}
            total={momentum?.total_results}
          />
          <SignalList
            title="High Volume Breakouts"
            accent="text-yellow-400"
            stocks={highVolume?.stocks ?? []}
            total={highVolume?.total_results}
          />
          <SignalList
            title="Oversold (RSI ≤ 30)"
            accent="text-red-400"
            stocks={oversold?.stocks ?? []}
            total={oversold?.total_results}
          />
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              title: "Stock Analysis",
              desc: "View indicators, patterns & signals for any stock",
              href: "/stock-analysis",
              icon: TrendingUp,
              color: "text-green-400",
            },
            {
              title: "Sector Analysis",
              desc: "Analyze sector performance and rotation",
              href: "/sectors",
              icon: BarChart2,
              color: "text-blue-400",
            },
            {
              title: "Stock Screener",
              desc: "Filter stocks by momentum, value, beta & more",
              href: "/screener",
              icon: Activity,
              color: "text-purple-400",
            },
            {
              title: "Market Depth",
              desc: "View order book, walls and price pressure",
              href: "/market-depth",
              icon: Database,
              color: "text-yellow-400",
            },
            {
              title: "Floorsheet",
              desc: "Track broker activity and institutional trades",
              href: "/floorsheet",
              icon: FileText,
              color: "text-orange-400",
            },
            {
              title: "Data Manager",
              desc: "Fetch and manage market data from NEPSE",
              href: "/data-manager",
              icon: Server,
              color: "text-cyan-400",
            },
          ].map(({ title, desc, href, icon: Icon, color }) => (
            <a
              key={href}
              href={href}
              className="block p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Config Info */}
      {config && (
        <Card>
          <CardHeader>
            <CardTitle>Application Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">App Name</p>
                <p className="font-medium text-foreground">{config.app_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Version</p>
                <p className="font-medium text-foreground">
                  {config.app_version}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Environment</p>
                <p className="font-medium text-foreground capitalize">
                  {config.environment}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Scheduler</p>
                <p className="font-medium text-foreground">
                  {config.scheduler_enabled ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface SignalStock {
  symbol: string;
  ltp?: number | null;
  change_percent?: number | null;
  rsi_14?: number | null;
  volume_ratio?: number | null;
  sector?: string | null;
  score?: number | null;
}

function SignalList({
  title,
  accent,
  stocks,
  total,
}: {
  title: string;
  accent: string;
  stocks: SignalStock[];
  total?: number;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={`text-sm ${accent}`}>{title}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {total ?? stocks.length} match{(total ?? stocks.length) === 1 ? "" : "es"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {stocks.length === 0 ? (
          <p className="px-4 py-6 text-xs text-muted-foreground text-center">
            No matches right now.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {stocks.map((s) => {
              const chg = s.change_percent ?? 0;
              const chgColor =
                chg > 0
                  ? "text-green-400"
                  : chg < 0
                  ? "text-red-400"
                  : "text-muted-foreground";
              return (
                <li
                  key={s.symbol}
                  className="flex items-center justify-between px-4 py-2 hover:bg-accent/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {s.symbol}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.sector || "—"}
                      {s.rsi_14 != null && (
                        <> · RSI {s.rsi_14.toFixed(0)}</>
                      )}
                      {s.volume_ratio != null && (
                        <> · V×{s.volume_ratio.toFixed(1)}</>
                      )}
                    </p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-sm font-medium text-foreground">
                      {s.ltp != null
                        ? s.ltp.toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })
                        : "—"}
                    </p>
                    <p className={`text-xs ${chgColor}`}>
                      {chg > 0 ? "+" : ""}
                      {chg.toFixed(2)}%
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
