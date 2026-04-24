import { cn, getChangeColor, formatPercent } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  subtitle,
  icon,
  className,
}: StatCardProps) {
  const changeColor = getChangeColor(change);

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground mt-1 truncate">
              {value}
            </p>
            {change !== undefined && (
              <div className={cn("flex items-center gap-1 mt-1", changeColor)}>
                {change > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : change < 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                <span className="text-xs font-medium">
                  {formatPercent(change)}
                </span>
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="ml-3 p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatusBadgeProps {
  status: "healthy" | "unhealthy" | "warning" | string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = {
    healthy: {
      dot: "bg-green-500",
      text: "text-green-500",
      bg: "bg-green-500/10",
    },
    unhealthy: { dot: "bg-red-500", text: "text-red-500", bg: "bg-red-500/10" },
    warning: {
      dot: "bg-yellow-500",
      text: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
  };
  const c = config[status as keyof typeof config] || config.warning;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        c.bg,
        c.text
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      {label || status}
    </span>
  );
}

interface SignalBadgeProps {
  signal: string;
}

export function SignalBadge({ signal }: SignalBadgeProps) {
  const s = signal.toLowerCase();
  let className =
    "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
  if (s.includes("strong_buy") || s.includes("strong buy"))
    className = "bg-green-500/20 text-green-300 border border-green-500/30";
  else if (s.includes("buy"))
    className = "bg-green-500/10 text-green-400 border border-green-500/20";
  else if (s.includes("strong_sell") || s.includes("strong sell"))
    className = "bg-red-500/20 text-red-300 border border-red-500/30";
  else if (s.includes("sell"))
    className = "bg-red-500/10 text-red-400 border border-red-500/20";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide",
        className
      )}
    >
      {signal.replace(/_/g, " ")}
    </span>
  );
}
