import { useQuery } from "@tanstack/react-query";
import { Info, AlertTriangle } from "lucide-react";
import apiClient from "@/api/client";

interface FreeHealth {
  yonepse?: {
    data_last_updated?: string;
    data_age_minutes?: number;
    sample_symbol_count?: number;
  };
  samirwagle?: {
    latest_floorsheet_date?: string;
    latest_floorsheet_age_hours?: number;
  };
  yonepse_fresh?: boolean;
  depth_available?: string;
}

type Source = "live" | "floorsheet" | "depth" | "recommendations";

interface Props {
  /** Which data source this banner describes. */
  source: Source;
  /** Optional extra note line shown below the freshness line. */
  note?: string;
  className?: string;
}

function fmtAge(mins: number | undefined): string {
  if (mins == null || !Number.isFinite(mins)) return "unknown";
  const m = Math.abs(mins);
  if (m < 60) return `${Math.round(m)} min`;
  const h = m / 60;
  if (h < 24) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} d`;
}

export function FreshnessBanner({ source, note, className = "" }: Props) {
  const { data } = useQuery<FreeHealth>({
    queryKey: ["free-health"],
    queryFn: async () => (await apiClient.get("/api/v1/free/health")).data,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const y = data?.yonepse;
  const s = data?.samirwagle;

  let label = "";
  let detail = "";
  let tone: "info" | "warn" = "info";

  switch (source) {
    case "live":
    case "recommendations": {
      const updated = y?.data_last_updated || "unknown";
      const age = fmtAge(y?.data_age_minutes);
      label = `Live market snapshot • updated ${updated}`;
      detail = `Age ${age} • ${y?.sample_symbol_count ?? "?"} symbols`;
      tone = data?.yonepse_fresh ? "info" : "warn";
      break;
    }
    case "floorsheet": {
      const date = s?.latest_floorsheet_date || "unknown";
      const age = s?.latest_floorsheet_age_hours;
      label = `Floorsheet for ${date}`;
      detail =
        age != null
          ? `Upstream scraper lags market by ~${age.toFixed(
              1
            )} h on the free tier`
          : "Upstream scraper lag varies";
      tone = age != null && age > 48 ? "warn" : "info";
      break;
    }
    case "depth": {
      label = "Market depth • aggregate (partial) only";
      detail =
        "Full 20-level order book is geo-restricted to Nepal. This is best-effort aggregate bid/ask from free scrapers.";
      tone = "warn";
      break;
    }
  }

  const palette =
    tone === "warn"
      ? "bg-amber-50 border-amber-200 text-amber-900"
      : "bg-sky-50 border-sky-200 text-sky-900";

  const Icon = tone === "warn" ? AlertTriangle : Info;

  return (
    <div
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${palette} ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-none" />
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        <div className="opacity-80">{detail}</div>
        {note ? <div className="mt-1 opacity-80">{note}</div> : null}
      </div>
    </div>
  );
}

export default FreshnessBanner;
