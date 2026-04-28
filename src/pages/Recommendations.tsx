import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  Eye,
  ChevronDown,
  ChevronRight,
  Filter,
} from "lucide-react";
import { recommendationsApi, type Recommendation } from "@/api/recommendations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { FreshnessBanner } from "@/components/shared/FreshnessBanner";

type ActionFilter = "ALL" | "BUY" | "WATCH" | "AVOID";

export function Recommendations() {
  const [limit, setLimit] = useState<number>(30);
  const [minScore, setMinScore] = useState<number>(0);
  const [minRows, setMinRows] = useState<number>(120);
  const [action, setAction] = useState<ActionFilter>("ALL");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data: universe } = useQuery({
    queryKey: ["rec-universe"],
    queryFn: recommendationsApi.universe,
    staleTime: 5 * 60_000,
  });

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["rec-top", limit, minScore, minRows, action],
    queryFn: () =>
      recommendationsApi.top({
        limit,
        min_score: minScore,
        min_rows: minRows,
        action: action === "ALL" ? undefined : action,
      }),
    staleTime: 60_000,
  });

  const toggleExpand = (sym: string) =>
    setExpanded((m) => ({ ...m, [sym]: !m[sym] }));

  if (isLoading)
    return <PageLoader text="Scoring stocks across the universe..." />;
  if (error) return <ErrorMessage message={(error as Error).message} />;

  const recs: Recommendation[] = data?.data ?? [];

  const buyCount = recs.filter((r) => r.action === "BUY").length;
  const watchCount = recs.filter((r) => r.action === "WATCH").length;
  const avoidCount = recs.filter((r) => r.action === "AVOID").length;

  return (
    <div className="space-y-6">
      <FreshnessBanner
        source="recommendations"
        note="Scores are recomputed from today's live snapshot when available; otherwise we fall back to the bundled historical dataset."
      />
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Stock Recommendations
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ranked by composite score: trend · momentum · volume · volatility ·
            drawdown
            {universe?.data && (
              <>
                {" · "}
                <span className="text-foreground">
                  {universe.data.total_symbols.toLocaleString()} symbols
                </span>
                {universe.data.latest_date && (
                  <> · as of {universe.data.latest_date}</>
                )}
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-secondary hover:bg-accent text-sm font-medium text-foreground disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryStat
          label="BUY"
          value={buyCount}
          color="text-green-400"
          Icon={TrendingUp}
        />
        <SummaryStat
          label="WATCH"
          value={watchCount}
          color="text-yellow-400"
          Icon={Eye}
        />
        <SummaryStat
          label="AVOID"
          value={avoidCount}
          color="text-red-400"
          Icon={ShieldAlert}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FilterField
              label="Action"
              control={
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as ActionFilter)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                >
                  <option value="ALL">All</option>
                  <option value="BUY">BUY only</option>
                  <option value="WATCH">WATCH only</option>
                  <option value="AVOID">AVOID only</option>
                </select>
              }
            />
            <FilterField
              label={`Limit (${limit})`}
              control={
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              }
            />
            <FilterField
              label={`Min score (${minScore})`}
              control={
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={minScore}
                  onChange={(e) => setMinScore(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              }
            />
            <FilterField
              label={`Min history rows (${minRows})`}
              control={
                <input
                  type="range"
                  min={60}
                  max={500}
                  step={20}
                  value={minRows}
                  onChange={(e) => setMinRows(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
              Showing {recs.length} / {data?.universe_size ?? "—"} ranked
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recs.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No matches. Try relaxing the filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground bg-secondary/40">
                  <tr>
                    <th className="px-3 py-2 text-left w-8"></th>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Symbol</th>
                    <th className="px-3 py-2 text-right">Score</th>
                    <th className="px-3 py-2 text-left">Action</th>
                    <th className="px-3 py-2 text-right">Last</th>
                    <th className="px-3 py-2 text-right">5d %</th>
                    <th className="px-3 py-2 text-right">20d %</th>
                    <th className="px-3 py-2 text-right">RSI</th>
                    <th className="px-3 py-2 text-right">Vol×</th>
                    <th className="px-3 py-2 text-right">σ (ann)</th>
                    <th className="px-3 py-2 text-right">DD vs 252d</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recs.map((r, idx) => (
                    <RecRow
                      key={r.symbol}
                      rec={r}
                      rank={idx + 1}
                      expanded={!!expanded[r.symbol]}
                      onToggle={() => toggleExpand(r.symbol)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  color,
  Icon,
}: {
  label: string;
  value: number;
  color: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
      <div className={`${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function FilterField({
  label,
  control,
}: {
  label: string;
  control: React.ReactNode;
}) {
  return (
    <label className="block text-xs">
      <span className="text-muted-foreground block mb-1">{label}</span>
      {control}
    </label>
  );
}

function actionBadge(action: Recommendation["action"]) {
  const cls =
    action === "BUY"
      ? "bg-green-500/15 text-green-400 border-green-500/30"
      : action === "WATCH"
      ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
      : "bg-red-500/15 text-red-400 border-red-500/30";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${cls}`}
    >
      {action}
    </span>
  );
}

function fmtPct(v: number | null | undefined, dp = 2) {
  if (v == null || Number.isNaN(v)) return "—";
  const cls =
    v > 0 ? "text-green-400" : v < 0 ? "text-red-400" : "text-muted-foreground";
  return (
    <span className={cls}>
      {v > 0 ? "+" : ""}
      {v.toFixed(dp)}%
    </span>
  );
}

function fmtNum(v: number | null | undefined, dp = 2) {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toFixed(dp);
}

function RecRow({
  rec,
  rank,
  expanded,
  onToggle,
}: {
  rec: Recommendation;
  rank: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="hover:bg-accent/40 transition-colors">
        <td className="px-3 py-2">
          <button
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </td>
        <td className="px-3 py-2 text-muted-foreground">{rank}</td>
        <td className="px-3 py-2 font-semibold text-foreground">
          {rec.symbol}
        </td>
        <td className="px-3 py-2 text-right font-bold text-primary">
          {rec.score.toFixed(1)}
        </td>
        <td className="px-3 py-2">{actionBadge(rec.action)}</td>
        <td className="px-3 py-2 text-right text-foreground">
          {rec.last_close.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </td>
        <td className="px-3 py-2 text-right">{fmtPct(rec.change_5d_pct)}</td>
        <td className="px-3 py-2 text-right">{fmtPct(rec.change_20d_pct)}</td>
        <td className="px-3 py-2 text-right text-foreground">
          {fmtNum(rec.rsi_14, 1)}
        </td>
        <td className="px-3 py-2 text-right text-foreground">
          {rec.volume_ratio != null ? `${rec.volume_ratio.toFixed(1)}×` : "—"}
        </td>
        <td className="px-3 py-2 text-right text-foreground">
          {rec.volatility_annualised != null
            ? `${(rec.volatility_annualised * 100).toFixed(1)}%`
            : "—"}
        </td>
        <td className="px-3 py-2 text-right">
          {fmtPct(rec.drawdown_from_high_pct, 1)}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-background/40">
          <td colSpan={12} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-2">
                  Rationale
                </p>
                <ul className="text-sm text-foreground space-y-1 list-disc list-inside">
                  {rec.rationale.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-2">
                  Factor scores (0–1)
                </p>
                <div className="space-y-1.5">
                  {Object.entries(rec.factor_scores).map(([k, v]) => (
                    <div key={k} className="text-xs">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-foreground capitalize">{k}</span>
                        <span className="text-muted-foreground">
                          {v.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded">
                        <div
                          className="h-full rounded bg-primary"
                          style={{
                            width: `${Math.max(0, Math.min(100, v * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
