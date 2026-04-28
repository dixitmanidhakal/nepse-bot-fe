import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Activity,
  GitBranch,
  Map,
  Shuffle,
  PieChart,
  ShieldAlert,
  ListOrdered,
  Layers,
  Loader2,
} from "lucide-react";
import { AxiosError } from "axios";
import { advancedQuantApi } from "@/api/quant";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
function parseNumbers(raw: string): number[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => Number(t))
    .filter((n) => Number.isFinite(n));
}

function formatApiError(err: unknown): string {
  if (err instanceof AxiosError) {
    const d = err.response?.data as any;
    if (d) {
      if (typeof d.detail === "string") return d.detail;
      if (d.detail?.message) {
        return `${d.detail.message}${d.detail.hint ? " — " + d.detail.hint : ""}`;
      }
      if (typeof d.message === "string") return d.message;
    }
    return err.message;
  }
  return (err as Error)?.message ?? "Unknown error";
}

function syntheticCloses(n = 300, drift = 0.0005, vol = 0.015): number[] {
  // deterministic-ish seed so demo payload is stable across reloads
  let seed = 42;
  const rng = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const noise: number[] = [];
  for (let i = 0; i < n; i++) {
    // Box-Muller
    const u1 = rng() || 1e-9;
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    noise.push(drift + vol * z);
  }
  const closes: number[] = [];
  let logp = Math.log(1000);
  for (const r of noise) {
    logp += r;
    closes.push(Math.exp(logp));
  }
  return closes.map((x) => +x.toFixed(2));
}

function syntheticReturns(n = 500, drift = 0.0005, vol = 0.015): number[] {
  let seed = 7;
  const rng = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const returns: number[] = [];
  for (let i = 0; i < n; i++) {
    const u1 = rng() || 1e-9;
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    returns.push(+(drift + vol * z).toFixed(6));
  }
  return returns;
}

// Build a 4-symbol long-enough basket in column-major form
function syntheticBasket(symbols: string[], n = 300): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (let i = 0; i < symbols.length; i++) {
    out[symbols[i]] = syntheticCloses(n, 0.0004 + i * 0.0001, 0.013 + i * 0.002);
  }
  return out;
}

function businessDates(n: number): string[] {
  const out: string[] = [];
  const d = new Date("2024-01-01T00:00:00Z");
  while (out.length < n) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      out.push(d.toISOString().slice(0, 10));
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// Reusable bits
// ────────────────────────────────────────────────────────────────────────────
function RunButton({
  pending,
  onClick,
  label = "Run",
}: {
  pending: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="px-4 py-2 rounded-md bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 disabled:opacity-50 flex items-center gap-2"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {label}
    </button>
  );
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="mt-3 p-3 rounded-md bg-secondary text-foreground text-xs font-mono overflow-x-auto max-h-80">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────────────────────
export function QuantAdvanced() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Advanced Quant Lab
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Ported from nepse-quant-terminal — HMM regimes, BOCPD changepoints,
          market-state scanner, pairs trading, HRP portfolio, conformal VaR,
          signal ranking and disposition-effect signals.
        </p>
      </div>

      <RegimeHMMCard />
      <RegimeBOCPDCard />
      <MarketStateCard />
      <PairsSpreadCard />
      <PortfolioAllocateCard />
      <ConformalVaRCard />
      <SignalsRankCard />
      <DispositionCard />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 1. HMM Regime
// ────────────────────────────────────────────────────────────────────────────
function RegimeHMMCard() {
  const [closes, setCloses] = useState(syntheticCloses(300).join(", "));
  const [nStates, setNStates] = useState(3);
  const [lookback, setLookback] = useState(252);

  const run = useMutation({
    mutationFn: async () => {
      const arr = parseNumbers(closes);
      if (arr.length < lookback)
        throw new Error(`Need ≥ ${lookback} closes; got ${arr.length}`);
      return advancedQuantApi.regimeHMM({
        closes: arr,
        n_states: nStates,
        lookback,
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-4 h-4" /> HMM Regime Detection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-4">
            <label className="text-xs text-muted-foreground">
              Close prices (chronological, comma/space separated)
            </label>
            <textarea
              rows={4}
              value={closes}
              onChange={(e) => setCloses(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">n_states</label>
            <input
              type="number"
              min={2}
              max={5}
              value={nStates}
              onChange={(e) => setNStates(parseInt(e.target.value || "3"))}
              className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">lookback</label>
            <input
              type="number"
              min={30}
              value={lookback}
              onChange={(e) => setLookback(parseInt(e.target.value || "252"))}
              className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm"
            />
          </div>
        </div>
        <RunButton pending={run.isPending} onClick={() => run.mutate()} />
        {run.error && <ErrorMessage message={formatApiError(run.error)} />}
        {run.data && <JsonBlock data={run.data} />}
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 2. BOCPD
// ────────────────────────────────────────────────────────────────────────────
function RegimeBOCPDCard() {
  const [returns, setReturns] = useState(
    syntheticReturns(400).slice(0, 50).join(", ") + ", ..."
  );
  const [hazard, setHazard] = useState(200);
  const [threshold, setThreshold] = useState(0.5);

  const run = useMutation({
    mutationFn: async () => {
      // if textarea contains ellipsis, regenerate full series
      const hasEllipsis = returns.includes("...");
      const arr = hasEllipsis ? syntheticReturns(400) : parseNumbers(returns);
      if (arr.length < 10) throw new Error("Need ≥ 10 returns");
      return advancedQuantApi.regimeBOCPD({
        returns: arr,
        hazard_lambda: hazard,
        threshold,
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="w-4 h-4" /> BOCPD Changepoint Detection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-4">
            <label className="text-xs text-muted-foreground">
              Returns (comma/space separated — keep "..." for synthetic demo)
            </label>
            <textarea
              rows={3}
              value={returns}
              onChange={(e) => setReturns(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              hazard_lambda
            </label>
            <input
              type="number"
              min={1}
              value={hazard}
              onChange={(e) => setHazard(Number(e.target.value || 200))}
              className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">threshold</label>
            <input
              type="number"
              step={0.05}
              min={0}
              max={1}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value || 0.5))}
              className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm"
            />
          </div>
        </div>
        <RunButton pending={run.isPending} onClick={() => run.mutate()} />
        {run.error && <ErrorMessage message={formatApiError(run.error)} />}
        {run.data && (
          <div className="text-xs text-muted-foreground">
            Detected changepoints:{" "}
            <span className="text-foreground font-mono">
              {run.data.changepoints.length}
            </span>{" "}
            / {run.data.cp_probs.length} timesteps
            <JsonBlock
              data={{
                first_20_probs: run.data.cp_probs.slice(0, 20),
                changepoints_head: run.data.changepoints.slice(0, 10),
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Market state
// ────────────────────────────────────────────────────────────────────────────
function MarketStateCard() {
  const SYMBOLS = ["NABIL", "GBIME", "PCBL", "SCB"];
  const prices = syntheticBasket(SYMBOLS, 300);
  const dates = businessDates(300);

  const run = useMutation({
    mutationFn: async () =>
      advancedQuantApi.marketState({ prices, dates }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="w-4 h-4" /> Composite Market State
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Uses a built-in 4-symbol synthetic basket (NABIL, GBIME, PCBL, SCB
          over 300 business days) to demonstrate the TRENDING / NEUTRAL /
          CHOPPY scanner.
        </p>
        <RunButton pending={run.isPending} onClick={() => run.mutate()} />
        {run.error && <ErrorMessage message={formatApiError(run.error)} />}
        {run.data && (
          <div className="space-y-3 mt-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Regime" value={run.data.regime} />
              <Stat label="Score" value={run.data.score.toFixed(2) + " / 4"} />
              <Stat label="Engine" value={run.data.engine || "hold"} />
              <Stat label="As of" value={run.data.as_of.slice(0, 10)} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat
                label="NMS"
                value={(run.data.nms * 100).toFixed(2) + "%"}
              />
              <Stat
                label="RB"
                value={(run.data.rb * 100).toFixed(0) + "%"}
              />
              <Stat
                label="VR"
                value={(run.data.vr * 100).toFixed(0) + "%"}
              />
              <Stat
                label="MP"
                value={(run.data.mp * 100).toFixed(0) + "%"}
              />
            </div>
            <pre className="p-3 rounded-md bg-secondary text-foreground text-xs font-mono whitespace-pre-wrap">
              {run.data.summary}
            </pre>
            {run.data.note && (
              <p className="text-xs text-muted-foreground">{run.data.note}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Pairs spread
// ────────────────────────────────────────────────────────────────────────────
function PairsSpreadCard() {
  const [pricesA, setPricesA] = useState(
    syntheticCloses(200, 0.0004, 0.012).join(", ")
  );
  const [pricesB, setPricesB] = useState(
    syntheticCloses(200, 0.0005, 0.012).join(", ")
  );
  const [lookback, setLookback] = useState(60);

  const run = useMutation({
    mutationFn: async () => {
      const a = parseNumbers(pricesA);
      const b = parseNumbers(pricesB);
      if (a.length !== b.length)
        throw new Error(`prices_a (${a.length}) ≠ prices_b (${b.length})`);
      return advancedQuantApi.pairsSpread({
        prices_a: a,
        prices_b: b,
        lookback,
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shuffle className="w-4 h-4" /> Pairs Trading — Spread & Z-Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">
              Prices A (e.g. NABIL)
            </label>
            <textarea
              rows={3}
              value={pricesA}
              onChange={(e) => setPricesA(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              Prices B (e.g. GBIME)
            </label>
            <textarea
              rows={3}
              value={pricesB}
              onChange={(e) => setPricesB(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-xs font-mono"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">lookback</label>
            <input
              type="number"
              min={20}
              value={lookback}
              onChange={(e) => setLookback(parseInt(e.target.value || "60"))}
              className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm"
            />
          </div>
        </div>
        <RunButton pending={run.isPending} onClick={() => run.mutate()} />
        {run.error && <ErrorMessage message={formatApiError(run.error)} />}
        {run.data && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
            <Stat
              label="Z-Score"
              value={run.data.z_score.toFixed(3)}
            />
            <Stat
              label="Hedge Ratio (β)"
              value={run.data.hedge_ratio.toFixed(4)}
            />
            <Stat
              label="Spread Mean"
              value={run.data.spread_mean.toFixed(2)}
            />
            <Stat
              label="Last Spread"
              value={
                run.data.spread_last !== null
                  ? run.data.spread_last.toFixed(2)
                  : "—"
              }
            />
            <Stat
              label="Half-life (days)"
              value={
                run.data.halflife !== null
                  ? run.data.halflife.toFixed(1)
                  : "—"
              }
            />
            <Stat
              label="N observations"
              value={String(run.data.n_observations)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 5. Portfolio allocation
// ────────────────────────────────────────────────────────────────────────────
function PortfolioAllocateCard() {
  const SYMBOLS = ["NABIL", "GBIME", "PCBL", "SCB"];
  const [method, setMethod] =
    useState<"hrp" | "cvar" | "shrinkage_hrp" | "equal">("hrp");
  const [capital, setCapital] = useState(1_000_000);

  const run = useMutation({
    mutationFn: async () =>
      advancedQuantApi.portfolioAllocate({
        method,
        prices: syntheticBasket(SYMBOLS, 252),
        dates: businessDates(252),
        symbols: SYMBOLS,
        capital,
      }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="w-4 h-4" /> Portfolio Allocation (HRP / CVaR)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as typeof method)}
              className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm"
            >
              <option value="hrp">HRP (Hierarchical Risk Parity)</option>
              <option value="shrinkage_hrp">Shrinkage HRP</option>
              <option value="cvar">CVaR minimisation</option>
              <option value="equal">Equal weight</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              Capital (NPR)
            </label>
            <input
              type="number"
              min={1000}
              value={capital}
              onChange={(e) =>
                setCapital(Number(e.target.value || 1_000_000))
              }
              className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm"
            />
          </div>
        </div>
        <RunButton pending={run.isPending} onClick={() => run.mutate()} />
        {run.error && <ErrorMessage message={formatApiError(run.error)} />}
        {run.data && (
          <div className="mt-3 overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Symbol</th>
                  <th className="px-3 py-2 text-right">Allocation (NPR)</th>
                  <th className="px-3 py-2 text-right">Weight</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(run.data.allocation).map(([sym, v]) => (
                  <tr key={sym} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{sym}</td>
                    <td className="px-3 py-2 text-right">
                      {v.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {((v / run.data.capital) * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 6. Conformal VaR
// ────────────────────────────────────────────────────────────────────────────
function ConformalVaRCard() {
  const [alpha, setAlpha] = useState(0.05);
  const [window, setWindow] = useState(252);

  const run = useMutation({
    mutationFn: async () =>
      advancedQuantApi.conformalVaR({
        returns: syntheticReturns(500),
        alpha,
        window,
      }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> Conformal VaR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">
              alpha (tail prob)
            </label>
            <input
              type="number"
              step={0.01}
              min={0.01}
              max={0.49}
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value || 0.05))}
              className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">window</label>
            <input
              type="number"
              min={50}
              value={window}
              onChange={(e) => setWindow(parseInt(e.target.value || "252"))}
              className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Uses a 500-obs synthetic returns series (drift 0.05%, vol 1.5%).
        </p>
        <RunButton pending={run.isPending} onClick={() => run.mutate()} />
        {run.error && <ErrorMessage message={formatApiError(run.error)} />}
        {run.data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <Stat label="VaR" value={(run.data.var * 100).toFixed(2) + "%"} />
            <Stat
              label="Confidence"
              value={(run.data.confidence * 100).toFixed(0) + "%"}
            />
            <Stat label="Window" value={String(run.data.window)} />
            <Stat label="N obs" value={String(run.data.n_observations)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-secondary">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="text-lg font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 7. Signals rank
// ────────────────────────────────────────────────────────────────────────────
function SignalsRankCard() {
  const [text, setText] = useState(
    `NABIL,momentum,0.9,0.85,uptrend confirmed,1
ADBL,mean_reversion,0.6,0.7,below BB lower,1
NHPC,momentum,0.4,0.6,weak trend,1
GBIME,accumulation,0.8,0.75,vol spike + price consolidation,1
RHPC,momentum,0.7,0.8,ridi alias test,1
SCB,disposition,0.5,0.5,cgo breakout,1`
  );
  const [topN, setTopN] = useState(20);

  const run = useMutation({
    mutationFn: async () => {
      const rows = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const candidates = rows.map((row) => {
        const p = row.split(",").map((x) => x.trim());
        const [symbol, signal_type, strength, confidence, reasoning, direction] =
          p;
        return {
          symbol,
          signal_type,
          strength: Number(strength),
          confidence: Number(confidence),
          reasoning: reasoning ?? "",
          direction: direction ? Number(direction) : 1,
        };
      });
      return advancedQuantApi.signalsRank({ candidates, top_n: topN });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4" /> Signal Ranking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="text-xs text-muted-foreground">
          Candidates (one per line: symbol, signal_type, strength, confidence,
          reasoning, direction)
        </label>
        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-xs font-mono"
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">top_n</label>
            <input
              type="number"
              min={1}
              max={200}
              value={topN}
              onChange={(e) => setTopN(parseInt(e.target.value || "20"))}
              className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm"
            />
          </div>
        </div>
        <RunButton pending={run.isPending} onClick={() => run.mutate()} />
        {run.error && <ErrorMessage message={formatApiError(run.error)} />}
        {run.data && (
          <div className="mt-3 overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Rank</th>
                  <th className="px-3 py-2 text-left">Symbol</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-right">Score</th>
                  <th className="px-3 py-2 text-right">Strength</th>
                  <th className="px-3 py-2 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {run.data.map((s, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{s.symbol}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {s.signal_type}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {Number(s.score).toFixed(3)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {Number(s.strength).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {Number(s.confidence).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 8. Disposition (CGO)
// ────────────────────────────────────────────────────────────────────────────
function DispositionCard() {
  const SYMBOLS = ["NABIL", "GBIME", "PCBL", "SCB"];
  const [cgoThreshold, setCgoThreshold] = useState(0.05);
  const [volumeSpike, setVolumeSpike] = useState(1.0);

  const run = useMutation({
    mutationFn: async () =>
      advancedQuantApi.disposition({
        prices: syntheticBasket(SYMBOLS, 300),
        dates: businessDates(300),
        cgo_threshold: cgoThreshold,
        volume_spike: volumeSpike,
      }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-4 h-4" /> Disposition — Capital Gains Overhang
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">
              cgo_threshold
            </label>
            <input
              type="number"
              step={0.01}
              min={0}
              max={1}
              value={cgoThreshold}
              onChange={(e) =>
                setCgoThreshold(Number(e.target.value || 0.05))
              }
              className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              volume_spike
            </label>
            <input
              type="number"
              step={0.1}
              min={1}
              value={volumeSpike}
              onChange={(e) => setVolumeSpike(Number(e.target.value || 1.0))}
              className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Uses a 4-symbol × 300-day synthetic basket. Lower the threshold to
          force matches on synthetic data (production threshold is 0.15).
        </p>
        <RunButton pending={run.isPending} onClick={() => run.mutate()} />
        {run.error && <ErrorMessage message={formatApiError(run.error)} />}
        {run.data && (
          <>
            <p className="text-xs text-muted-foreground mt-2">
              {run.data.length} signal{run.data.length === 1 ? "" : "s"}{" "}
              generated
            </p>
            <JsonBlock data={run.data} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
