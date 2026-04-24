import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Database,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { dataApi } from "@/api/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineError } from "@/components/shared/ErrorMessage";

interface FetchAction {
  id: string;
  label: string;
  desc: string;
  symbol?: string;
  days?: number;
}

export function DataManager() {
  const [symbol, setSymbol] = useState("NABIL");
  const [days, setDays] = useState(30);
  const [results, setResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  const addResult = (id: string, success: boolean, message: string) => {
    setResults((prev) => ({ ...prev, [id]: { success, message } }));
  };

  const marketMutation = useMutation({
    mutationFn: dataApi.fetchMarket,
    onSuccess: (data) =>
      addResult(
        "market",
        true,
        data.message || "Market data fetched successfully"
      ),
    onError: (e: Error) => addResult("market", false, e.message),
  });

  const stocksMutation = useMutation({
    mutationFn: dataApi.fetchStocks,
    onSuccess: (data) =>
      addResult(
        "stocks",
        true,
        data.message || "Stock list fetched successfully"
      ),
    onError: (e: Error) => addResult("stocks", false, e.message),
  });

  const ohlcvMutation = useMutation({
    mutationFn: () => dataApi.fetchOHLCV(symbol, days),
    onSuccess: (data) =>
      addResult(
        "ohlcv",
        true,
        `OHLCV fetched: ${data.records_saved || 0} records saved`
      ),
    onError: (e: Error) => addResult("ohlcv", false, e.message),
  });

  const depthMutation = useMutation({
    mutationFn: () => dataApi.fetchMarketDepth(symbol),
    onSuccess: (data) =>
      addResult(
        "depth",
        true,
        data.message || "Market depth fetched successfully"
      ),
    onError: (e: Error) => addResult("depth", false, e.message),
  });

  const floorsheetMutation = useMutation({
    mutationFn: () => dataApi.fetchFloorsheet(symbol),
    onSuccess: (data) =>
      addResult(
        "floorsheet",
        true,
        data.message || "Floorsheet fetched successfully"
      ),
    onError: (e: Error) => addResult("floorsheet", false, e.message),
  });

  const allMutation = useMutation({
    mutationFn: () =>
      dataApi.fetchAll({
        include_ohlcv: true,
        include_depth: true,
        include_floorsheet: true,
        ohlcv_days: days,
      }),
    onSuccess: (data) =>
      addResult("all", true, data.message || "All data fetched successfully"),
    onError: (e: Error) => addResult("all", false, e.message),
  });

  const actions = [
    {
      id: "market",
      label: "Fetch Market Data",
      desc: "Fetch NEPSE index and all sector indices",
      mutation: marketMutation,
      color: "text-blue-400",
    },
    {
      id: "stocks",
      label: "Fetch Stock List",
      desc: "Fetch all listed stocks and link to sectors",
      mutation: stocksMutation,
      color: "text-green-400",
    },
    {
      id: "ohlcv",
      label: `Fetch OHLCV — ${symbol}`,
      desc: `Fetch ${days} days of price history for ${symbol}`,
      mutation: ohlcvMutation,
      color: "text-purple-400",
      needsSymbol: true,
    },
    {
      id: "depth",
      label: `Fetch Market Depth — ${symbol}`,
      desc: `Fetch current order book for ${symbol}`,
      mutation: depthMutation,
      color: "text-yellow-400",
      needsSymbol: true,
    },
    {
      id: "floorsheet",
      label: `Fetch Floorsheet — ${symbol}`,
      desc: `Fetch today's trade data for ${symbol}`,
      mutation: floorsheetMutation,
      color: "text-orange-400",
      needsSymbol: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Data Manager</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Fetch and manage market data from NEPSE API
        </p>
      </div>

      {/* API Status Note */}
      <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
        <p className="text-sm text-yellow-400 font-medium">
          ⚠️ NEPSE API Status
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          The NEPSE API may return 401 Unauthorized. If so, use the mock data
          script:
          <code className="ml-1 px-1.5 py-0.5 rounded bg-secondary text-foreground font-mono text-xs">
            python populate_mock_data.py
          </code>
          in the backend directory to populate test data.
        </p>
      </div>

      {/* Symbol & Days Config */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Stock Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. NABIL"
                className="px-3 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-32"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                OHLCV Days
              </label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="px-3 py-2 text-sm bg-secondary border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Individual Fetches
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {actions.map(({ id, label, desc, mutation, color }) => (
            <Card key={id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${color}`}>{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {desc}
                    </p>
                    {results[id] && (
                      <div
                        className={`flex items-center gap-1.5 mt-2 text-xs ${
                          results[id].success
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {results[id].success ? (
                          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        )}
                        <span className="truncate">{results[id].message}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => mutation.mutate(undefined as any)}
                    disabled={mutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-secondary hover:bg-accent text-foreground transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {mutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    {mutation.isPending ? "Fetching..." : "Fetch"}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Fetch All */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Fetch All Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Performs a complete data fetch: market indices, stock list, OHLCV (
            {days} days), market depth, and floorsheet. This may take several
            minutes.
          </p>
          {results["all"] && (
            <div
              className={`flex items-center gap-2 mb-4 text-sm ${
                results["all"].success ? "text-green-400" : "text-red-400"
              }`}
            >
              {results["all"].success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {results["all"].message}
            </div>
          )}
          <button
            onClick={() => allMutation.mutate()}
            disabled={allMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
          >
            {allMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Fetching All
                Data...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" /> Fetch All Data
              </>
            )}
          </button>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>
              Start the backend:{" "}
              <code className="px-1.5 py-0.5 rounded bg-secondary text-foreground font-mono text-xs">
                cd nepse-bot-be && python -m uvicorn app.main:app --reload
              </code>
            </li>
            <li>
              Populate mock data:{" "}
              <code className="px-1.5 py-0.5 rounded bg-secondary text-foreground font-mono text-xs">
                python populate_mock_data.py
              </code>
            </li>
            <li>
              Or fetch real data using the buttons above (requires NEPSE API
              access)
            </li>
            <li>
              Navigate to Stock Analysis, Sectors, or Screener to explore the
              data
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
