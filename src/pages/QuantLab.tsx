import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Gauge,
  LineChart,
  Scale,
  Calculator,
  Wallet,
  Loader2,
} from "lucide-react";
import { quantApi, type RegimeResult, type SizedPosition } from "@/api/quant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/StatCard";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

function parseNumbers(raw: string): number[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => Number(t))
    .filter((n) => Number.isFinite(n));
}

export function QuantLab() {
  // Regime form state
  const [closesInput, setClosesInput] = useState(
    Array.from(
      { length: 200 },
      (_, i) => (1000 * (1 + 0.002 * i)).toFixed(2)
    ).join(", ")
  );
  const [window, setWindow] = useState(60);

  const regimeMutation = useMutation({
    mutationFn: async () => {
      const closes = parseNumbers(closesInput);
      if (closes.length < window + 1) {
        throw new Error(
          `Need at least ${window + 1} close prices; got ${closes.length}.`
        );
      }
      return quantApi.classifyRegime(closes, window);
    },
  });

  // Position sizing form state
  const [capital, setCapital] = useState(1_000_000);
  const [signalsText, setSignalsText] = useState(
    `NABIL,Commercial Banks,0.9,0.8,1100
ADBL,Commercial Banks,0.8,0.7,360
NHPC,Hydropower,0.7,0.7,105
NLIC,Life Insurance,0.6,0.6,780`
  );

  const sizeMutation = useMutation({
    mutationFn: async () => {
      const rows = signalsText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const signals: {
        symbol: string;
        sector: string;
        score: number;
        confidence: number;
      }[] = [];
      const prices: Record<string, number> = {};
      for (const row of rows) {
        const parts = row.split(",").map((p) => p.trim());
        if (parts.length !== 5) continue;
        const [symbol, sector, score, confidence, price] = parts;
        signals.push({
          symbol,
          sector,
          score: Number(score),
          confidence: Number(confidence),
        });
        prices[symbol] = Number(price);
      }
      if (!signals.length) throw new Error("No valid rows parsed.");
      return quantApi.sizePositions({
        signals,
        capital,
        prices,
      });
    },
  });

  // Kelly + Transaction cost
  const [winProb, setWinProb] = useState(0.55);
  const [avgWin, setAvgWin] = useState(0.1);
  const [avgLoss, setAvgLoss] = useState(0.05);

  const kellyMutation = useMutation({
    mutationFn: async () => quantApi.kelly(winProb, avgWin, avgLoss),
  });

  const [costAmount, setCostAmount] = useState(50_000);
  const costMutation = useMutation({
    mutationFn: async () => quantApi.transactionCost(costAmount, true),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Quant Lab</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Regime classification, Kelly sizing, and portfolio construction
        </p>
      </div>

      {/* Regime section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-4 h-4" /> Regime Classifier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-3">
              <label className="text-xs text-muted-foreground">
                Benchmark closes (comma or space separated)
              </label>
              <textarea
                rows={4}
                value={closesInput}
                onChange={(e) => setClosesInput(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Window</label>
              <input
                type="number"
                min={10}
                value={window}
                onChange={(e) => setWindow(parseInt(e.target.value || "60"))}
                className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm"
              />
              <button
                onClick={() => regimeMutation.mutate()}
                disabled={regimeMutation.isPending}
                className="mt-3 w-full px-3 py-2 rounded-md bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {regimeMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Classify
              </button>
            </div>
          </div>

          {regimeMutation.error && (
            <ErrorMessage message={(regimeMutation.error as Error).message} />
          )}
          {regimeMutation.data && <RegimePanel result={regimeMutation.data} />}
        </CardContent>
      </Card>

      {/* Position sizing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-4 h-4" /> Position Sizer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-3">
              <label className="text-xs text-muted-foreground">
                Signals (one per line: symbol, sector, score, confidence, price)
              </label>
              <textarea
                rows={6}
                value={signalsText}
                onChange={(e) => setSignalsText(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Capital (NPR)</label>
              <input
                type="number"
                value={capital}
                min={1000}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm"
              />
              <button
                onClick={() => sizeMutation.mutate()}
                disabled={sizeMutation.isPending}
                className="mt-3 w-full px-3 py-2 rounded-md bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sizeMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Size Portfolio
              </button>
            </div>
          </div>

          {sizeMutation.error && (
            <ErrorMessage message={(sizeMutation.error as Error).message} />
          )}
          {sizeMutation.data && (
            <PositionsTable
              positions={sizeMutation.data.positions}
              estimatedRoundTripCost={sizeMutation.data.estimated_round_trip_cost}
              capital={capital}
            />
          )}
        </CardContent>
      </Card>

      {/* Kelly + Transaction cost */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Kelly Fraction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <NumberField
                label="Win prob"
                value={winProb}
                onChange={setWinProb}
                step={0.01}
              />
              <NumberField
                label="Avg win"
                value={avgWin}
                onChange={setAvgWin}
                step={0.01}
              />
              <NumberField
                label="Avg loss"
                value={avgLoss}
                onChange={setAvgLoss}
                step={0.01}
              />
            </div>
            <button
              onClick={() => kellyMutation.mutate()}
              disabled={kellyMutation.isPending}
              className="w-full px-3 py-2 rounded-md bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 disabled:opacity-50"
            >
              {kellyMutation.isPending ? "Computing..." : "Compute"}
            </button>
            {kellyMutation.data && (
              <p className="text-sm">
                Half-Kelly fraction:{" "}
                <span className="font-semibold text-foreground">
                  {(kellyMutation.data.kelly_fraction * 100).toFixed(2)}%
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-4 h-4" /> NEPSE Transaction Cost
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <NumberField
              label="Amount (NPR)"
              value={costAmount}
              onChange={setCostAmount}
              step={1000}
            />
            <button
              onClick={() => costMutation.mutate()}
              disabled={costMutation.isPending}
              className="w-full px-3 py-2 rounded-md bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 disabled:opacity-50"
            >
              {costMutation.isPending ? "Computing..." : "Compute"}
            </button>
            {costMutation.data && (
              <p className="text-sm">
                One-leg cost:{" "}
                <span className="font-semibold text-foreground">
                  Rs {costMutation.data.cost.toFixed(2)}
                </span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm"
      />
    </div>
  );
}

function RegimePanel({ result }: { result: RegimeResult }) {
  const color =
    result.regime === "bull"
      ? "text-green-400"
      : result.regime === "bear"
      ? "text-red-400"
      : "text-yellow-400";
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Regime
          </p>
          <p className={`text-2xl font-bold mt-1 uppercase ${color}`}>
            {result.regime}
          </p>
        </CardContent>
      </Card>
      <StatCard
        title="Rolling Return"
        value={`${(result.rolling_return * 100).toFixed(2)}%`}
        change={result.rolling_return}
        icon={<LineChart className="w-5 h-5" />}
      />
      <StatCard
        title="Realised Vol (ann.)"
        value={`${(result.volatility * 100).toFixed(2)}%`}
        subtitle={`window: ${result.window}d`}
      />
      <StatCard
        title="Exposure"
        value={`${(result.exposure_multiplier * 100).toFixed(0)}%`}
        subtitle="of deployable capital"
      />
    </div>
  );
}

function PositionsTable({
  positions,
  estimatedRoundTripCost,
  capital,
}: {
  positions: SizedPosition[];
  estimatedRoundTripCost: number;
  capital: number;
}) {
  const totalValue = positions.reduce((s, p) => s + p.value, 0);
  const cash = capital - totalValue;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          title="Deployed"
          value={`Rs ${totalValue.toLocaleString("en-US", {
            maximumFractionDigits: 0,
          })}`}
          subtitle={`${((totalValue / capital) * 100).toFixed(1)}% of capital`}
        />
        <StatCard
          title="Cash Reserve"
          value={`Rs ${cash.toLocaleString("en-US", {
            maximumFractionDigits: 0,
          })}`}
          subtitle={`${((cash / capital) * 100).toFixed(1)}%`}
        />
        <StatCard
          title="Round-Trip Cost"
          value={`Rs ${estimatedRoundTripCost.toLocaleString("en-US", {
            maximumFractionDigits: 0,
          })}`}
          subtitle="buy + sell fees"
        />
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">Symbol</th>
              <th className="px-3 py-2">Sector</th>
              <th className="px-3 py-2 text-right">Shares</th>
              <th className="px-3 py-2 text-right">Value (NPR)</th>
              <th className="px-3 py-2 text-right">Weight</th>
              <th className="px-3 py-2 text-right">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <tr key={p.symbol} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{p.symbol}</td>
                <td className="px-3 py-2 text-muted-foreground">{p.sector}</td>
                <td className="px-3 py-2 text-right">{p.shares}</td>
                <td className="px-3 py-2 text-right">
                  {p.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </td>
                <td className="px-3 py-2 text-right">
                  {(p.weight * 100).toFixed(2)}%
                </td>
                <td className="px-3 py-2 text-right">
                  {(p.confidence * 100).toFixed(0)}%
                </td>
              </tr>
            ))}
            {positions.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  No positions sized.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
