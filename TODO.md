# NEPSE Bot Frontend - Implementation Plan

## Tech Stack

- React 18 + Vite + TypeScript
- Tailwind CSS + shadcn/ui (UI components)
- React Router v6 (navigation)
- TanStack Query v5 (data fetching + caching)
- Axios (HTTP client)
- Recharts (charts)
- Lucide React (icons)

## Pages

- [ ] Dashboard - Health check, data status, quick stats
- [ ] Data Manager - Trigger data fetches
- [ ] Stock Analysis - Indicators, patterns, signals per stock
- [ ] Sector Analysis - Sector performance, rotation, bullish sectors
- [ ] Stock Screener - Filter stocks by criteria
- [ ] Market Depth - Order book, walls, imbalance
- [ ] Floorsheet - Trades, broker activity, institutional tracking

## Steps

### Phase 1: Project Setup

- [x] Create TODO.md
- [ ] Scaffold Vite + React + TypeScript project
- [ ] Install dependencies (Tailwind, React Router, TanStack Query, Axios, Recharts, Lucide)
- [ ] Configure Tailwind CSS
- [ ] Setup project structure

### Phase 2: Core Infrastructure

- [ ] Create Axios API client (src/api/client.ts)
- [ ] Create API modules (data, indicators, sectors, stocks, patterns, depth, floorsheet)
- [ ] Create TypeScript types (src/types/index.ts)
- [ ] Create Layout (Sidebar + Header)

### Phase 3: Pages

- [ ] Dashboard page
- [ ] Data Manager page
- [ ] Stock Analysis page
- [ ] Sector Analysis page
- [ ] Stock Screener page
- [ ] Market Depth page
- [ ] Floorsheet page

### Phase 4: Polish

- [ ] Loading states
- [ ] Error handling
- [ ] Responsive design
- [ ] Test all endpoints
