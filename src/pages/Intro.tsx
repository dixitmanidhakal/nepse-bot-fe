import { Link } from "react-router-dom";
import {
  TrendingUp,
  BarChart2,
  Search,
  BookOpen,
  FileText,
  Database,
  Activity,
  CalendarDays,
  Gauge,
  Sparkles,
  ShieldCheck,
  LineChart,
  ArrowRight,
  Cpu,
  Radar,
  Timer,
} from "lucide-react";

/**
 * Introduction / Landing page.
 *
 * Explains what the NEPSE Trading Bot is, what it can do, and how the
 * individual modules fit together. Serves as the default entry point so
 * first-time visitors understand the product before diving into data.
 */
export function Intro() {
  return (
    <div className="space-y-12 pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-8 md:p-12">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary mb-3">
          <Sparkles className="w-4 h-4" />
          NEPSE Quantitative Trading Platform
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight max-w-4xl">
          A professional signal & recommendation engine for the
          <span className="text-primary"> Nepal Stock Exchange</span>
        </h1>
        <p className="mt-4 max-w-3xl text-muted-foreground text-base md:text-lg">
          Scan the entire NEPSE universe, quantify trend strength, momentum,
          volume, volatility and drawdown — and get ranked, explainable
          recommendations backed by historical OHLCV data.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/recommendations"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Get Stock Recommendations
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-secondary text-foreground font-semibold hover:bg-accent transition-colors"
          >
            Open Dashboard
          </Link>
          <Link
            to="/screener"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-border text-foreground font-semibold hover:bg-accent transition-colors"
          >
            Launch Screener
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
          <Stat label="Endpoints" value="94+" />
          <Stat label="Technical Indicators" value="20+" />
          <Stat label="Chart Patterns" value="19" />
          <Stat label="OHLCV Rows" value="450k+" />
        </div>
      </section>

      {/* Capabilities */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          What this platform can do
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Capability
            icon={<Radar className="w-5 h-5 text-primary" />}
            title="Scan 400+ NEPSE stocks"
            body="Automatically rank every listed scrip on a composite score — trend, momentum, volume, volatility, and pullback depth."
          />
          <Capability
            icon={<TrendingUp className="w-5 h-5 text-green-400" />}
            title="20+ technical indicators"
            body="RSI, MACD, Bollinger Bands, moving averages, ATR, volume oscillators — calculated per stock on demand."
          />
          <Capability
            icon={<LineChart className="w-5 h-5 text-blue-400" />}
            title="19 chart patterns"
            body="Detect double tops / bottoms, head-and-shoulders, triangles, flags, support / resistance levels and trend channels."
          />
          <Capability
            icon={<BarChart2 className="w-5 h-5 text-purple-400" />}
            title="Sector rotation analytics"
            body="Spot bullish sectors, compare relative strength, identify rotation trades before they show up in headlines."
          />
          <Capability
            icon={<BookOpen className="w-5 h-5 text-yellow-400" />}
            title="Market depth & walls"
            body="Order-book pressure, bid/ask imbalance, liquidity scoring and support/resistance from live depth data."
          />
          <Capability
            icon={<FileText className="w-5 h-5 text-orange-400" />}
            title="Floorsheet intelligence"
            body="Broker tracking, institutional accumulation, cross-trade detection, and manipulation red-flag analytics."
          />
          <Capability
            icon={<Gauge className="w-5 h-5 text-cyan-400" />}
            title="Quant Lab"
            body="Regime classification, position sizing, transaction-cost modelling, and Kelly-fraction risk sizing."
          />
          <Capability
            icon={<CalendarDays className="w-5 h-5 text-pink-400" />}
            title="Trading calendar"
            body="Is the market open today? Festival windows, holiday list, next trading day — all exposed as REST endpoints."
          />
          <Capability
            icon={<Database className="w-5 h-5 text-emerald-400" />}
            title="Offline historical data"
            body="Ships with a half-million-row SQLite snapshot (2015 → today) so the bot works even when the NEPSE API is geo-blocked."
          />
        </div>
      </section>

      {/* Script Recommendation Engine Deep-Dive */}
      <section className="rounded-2xl border border-border bg-card p-8">
        <div className="flex items-center gap-2 mb-2 text-primary text-xs uppercase tracking-widest">
          <Cpu className="w-4 h-4" /> Recommendation Engine
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          How the Script Recommender scores every stock
        </h2>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          Each symbol is scored on five weighted sub-factors. The final score
          is a deterministic composite — same data in, same ranking out — so
          you can audit every call.
        </p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <FactorCard weight={0.30} name="Trend" desc="20/50/200-MA alignment and slope." />
          <FactorCard weight={0.25} name="Momentum" desc="14-period RSI sweet-spot and MACD histogram." />
          <FactorCard weight={0.15} name="Volume" desc="Volume vs. 20-day average (breakout confirmation)." />
          <FactorCard weight={0.15} name="Volatility" desc="Annualised σ — penalises chaotic movers." />
          <FactorCard weight={0.15} name="Drawdown" desc="Distance from 252-day high — prefers pullbacks." />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/recommendations"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity text-sm"
          >
            Run Recommender <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="http://localhost:8000/docs#/Recommendations"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-border text-foreground font-semibold hover:bg-accent transition-colors text-sm"
          >
            View API Docs
          </a>
        </div>
      </section>

      {/* Architecture */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Architecture at a glance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ArchCard
            title="Backend"
            body="FastAPI · SQLAlchemy · PostgreSQL · pandas · APScheduler. 94+ REST endpoints grouped into 9 modules."
            icon={<ShieldCheck className="w-5 h-5 text-primary" />}
          />
          <ArchCard
            title="Data layer"
            body="Live: nepalstock.com.np scraper (geo-restricted). Offline: SQLite snapshot with 450k+ OHLCV rows — same data as nepse-quant-terminal."
            icon={<Database className="w-5 h-5 text-blue-400" />}
          />
          <ArchCard
            title="Frontend"
            body="React 18 · Vite · TypeScript · TailwindCSS · TanStack Query. Fully typed API client with automatic refetching."
            icon={<Activity className="w-5 h-5 text-green-400" />}
          />
        </div>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Where to go next
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickLink to="/recommendations" icon={<Sparkles className="w-5 h-5 text-primary" />} title="Stock Recommendations" desc="Top-ranked buys across NEPSE with explainable factor scores." />
          <QuickLink to="/dashboard" icon={<Activity className="w-5 h-5 text-green-400" />} title="Dashboard" desc="System health, live signals, and database statistics." />
          <QuickLink to="/stock-analysis" icon={<TrendingUp className="w-5 h-5 text-blue-400" />} title="Stock Analysis" desc="Per-symbol indicators, patterns and trading signals." />
          <QuickLink to="/sectors" icon={<BarChart2 className="w-5 h-5 text-purple-400" />} title="Sector Analysis" desc="Sector strength, rotation, and bullish-leader detection." />
          <QuickLink to="/screener" icon={<Search className="w-5 h-5 text-yellow-400" />} title="Stock Screener" desc="Filter by momentum, value, beta, defensive and growth profiles." />
          <QuickLink to="/market-depth" icon={<BookOpen className="w-5 h-5 text-orange-400" />} title="Market Depth" desc="Order-book pressure, walls, and liquidity scoring." />
          <QuickLink to="/floorsheet" icon={<FileText className="w-5 h-5 text-red-400" />} title="Floorsheet" desc="Broker tracking and institutional activity." />
          <QuickLink to="/calendar" icon={<CalendarDays className="w-5 h-5 text-pink-400" />} title="Calendar" desc="Trading days, holidays, festival windows." />
          <QuickLink to="/quant" icon={<Gauge className="w-5 h-5 text-cyan-400" />} title="Quant Lab" desc="Regime detection, position sizing, Kelly fraction." />
        </div>
      </section>

      {/* Risk disclaimer */}
      <section className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 text-yellow-400 font-semibold mb-1">
          <Timer className="w-4 h-4" /> Disclaimer
        </div>
        <p>
          This platform is for research and educational purposes. Signals and
          recommendations are based on historical data and statistical models —
          they are <span className="text-foreground font-medium">not investment advice</span>.
          Always do your own due-diligence, and consult a SEBON-registered advisor
          before trading.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 backdrop-blur px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function Capability({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-colors">
      <div className="mb-3">{icon}</div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function FactorCard({
  weight,
  name,
  desc,
}: {
  weight: number;
  name: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold text-foreground">{name}</p>
        <p className="text-sm text-primary font-bold">{Math.round(weight * 100)}%</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function ArchCard({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-2">{icon}</div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function QuickLink({
  to,
  icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:bg-accent transition-colors"
    >
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}
