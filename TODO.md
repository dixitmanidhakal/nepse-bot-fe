# Universal Data Layer — TODO

## Phase 1 — Abstraction + Free provider

- [ ] `src/types/canonical.ts` — CanonicalStock/Bar/Depth/Trade/Floorsheet/Sector/Freshness
- [ ] `src/data/providers/types.ts` — DataProvider interface
- [ ] `src/data/providers/freeProvider.ts` — maps /api/v1/free/\* → canonical
- [ ] `src/data/index.ts` — provider selector (env: VITE_DATA_PROVIDER)
- [ ] `src/analytics/indicators.ts` — RSI, MACD, SMA/EMA, BB on CanonicalBar[]
- [ ] `src/analytics/patterns.ts` — basic patterns on CanonicalBar[]
- [ ] `src/analytics/screeners.ts` — momentum, oversold, volume on CanonicalStock[]
- [ ] `src/analytics/recommendations.ts` — scoring + top-n
- [ ] build passes

## Phase 2 — Rewire pages

- [ ] Dashboard.tsx → data.getMarketSnapshot + analytics.screeners
- [ ] StockAnalysis.tsx → data.getOhlcv + analytics.indicators + analytics.patterns
- [ ] Recommendations.tsx → data.getMarketSnapshot + analytics.recommendations
- [ ] MarketDepth.tsx → data.getDepth (canonical)
- [ ] Floorsheet.tsx → data.getFloorsheet (canonical)
- [ ] SectorAnalysis.tsx → data.getSectors + data.getMarketSnapshot
- [ ] StockScreener.tsx → analytics.screeners
- [ ] QuantAdvanced.tsx / QuantLab.tsx → analytics.\* fallbacks
- [ ] Calendar.tsx → graceful "upstream unavailable" fallback
- [ ] DataManager.tsx → data.getFreshness visualization

## Phase 3 — Deploy & verify

- [ ] `npm run build` passes
- [ ] commit + push origin/main
- [ ] Vercel redeploy (auto via git push)
- [ ] Verify every page loads live data in incognito

## Phase 4 (future) — Additional providers

- [ ] `providers/legacyProvider.ts` (for eventual Postgres-backed prod)
- [ ] `providers/mockProvider.ts` (for tests)
