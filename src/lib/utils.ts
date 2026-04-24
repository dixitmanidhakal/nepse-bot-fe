import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(
  value: number | undefined | null,
  decimals = 2
): string {
  if (value === undefined || value === null) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(
  value: number | undefined | null,
  decimals = 2
): string {
  if (value === undefined || value === null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatVolume(value: number | undefined | null): string {
  if (value === undefined || value === null) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return "—";
  return `Rs ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getChangeColor(value: number | undefined | null): string {
  if (value === undefined || value === null) return "text-muted-foreground";
  if (value > 0) return "text-green-500";
  if (value < 0) return "text-red-500";
  return "text-muted-foreground";
}

export function getSignalColor(signal: string | undefined): string {
  if (!signal) return "text-muted-foreground";
  const s = signal.toLowerCase();
  if (s.includes("strong_buy") || s.includes("strong buy"))
    return "text-green-400";
  if (s.includes("buy")) return "text-green-500";
  if (s.includes("strong_sell") || s.includes("strong sell"))
    return "text-red-400";
  if (s.includes("sell")) return "text-red-500";
  return "text-yellow-500";
}

export function getSignalBadgeClass(signal: string | undefined): string {
  if (!signal) return "bg-muted text-muted-foreground";
  const s = signal.toLowerCase();
  if (s.includes("strong_buy") || s.includes("strong buy"))
    return "bg-green-500/20 text-green-400 border border-green-500/30";
  if (s.includes("buy"))
    return "bg-green-500/10 text-green-500 border border-green-500/20";
  if (s.includes("strong_sell") || s.includes("strong sell"))
    return "bg-red-500/20 text-red-400 border border-red-500/30";
  if (s.includes("sell"))
    return "bg-red-500/10 text-red-500 border border-red-500/20";
  return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20";
}
