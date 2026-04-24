import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Clock,
  PartyPopper,
  CalendarCheck,
  CalendarX,
  Sparkles,
} from "lucide-react";
import { calendarApi } from "@/api/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard, StatusBadge } from "@/components/shared/StatCard";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

export function CalendarPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [checkDate, setCheckDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const {
    data: status,
    isLoading: statusLoading,
    error: statusError,
  } = useQuery({
    queryKey: ["calendar-status"],
    queryFn: calendarApi.getStatus,
    refetchInterval: 60_000,
  });

  const { data: holidays } = useQuery({
    queryKey: ["calendar-holidays", year],
    queryFn: () => calendarApi.getHolidays(year),
  });

  const { data: festival } = useQuery({
    queryKey: ["calendar-festival", checkDate],
    queryFn: () => calendarApi.getFestivalWindows(checkDate),
    enabled: !!checkDate,
  });

  const { data: dayCheck } = useQuery({
    queryKey: ["calendar-is-trading-day", checkDate],
    queryFn: () => calendarApi.isTradingDay(checkDate),
    enabled: !!checkDate,
  });

  if (statusLoading) return <PageLoader text="Loading calendar..." />;
  if (statusError)
    return <ErrorMessage message="Failed to load calendar status" />;

  const tradingStatus = status?.is_trading_day ? "healthy" : "warning";
  const tradingLabel = status?.is_trading_day
    ? "Trading Day"
    : status?.is_weekend
    ? "Weekend"
    : status?.is_known_holiday
    ? "Holiday"
    : "Closed";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">NEPSE Calendar</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Trading schedule, holidays, and festival windows
        </p>
      </div>

      {/* Today snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Today"
          value={status?.date ?? "—"}
          subtitle={status?.weekday}
          icon={<CalendarDays className="w-5 h-5" />}
        />
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Market
            </p>
            <div className="mt-2">
              <StatusBadge status={tradingStatus} label={tradingLabel} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Phase: {status?.session_phase ?? "—"}
            </p>
          </CardContent>
        </Card>
        <StatCard
          title="Session"
          value={status?.schedule.regular ?? "—"}
          subtitle={`Pre-open: ${status?.schedule.preopen ?? "—"}`}
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          title="Week"
          value={status?.schedule.trading_week ?? "—"}
          subtitle={`Weekend: ${status?.schedule.weekend ?? "—"}`}
          icon={<CalendarCheck className="w-5 h-5" />}
        />
      </div>

      {/* Date checker + Festival windows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Check a date</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              type="date"
              value={checkDate}
              onChange={(e) => setCheckDate(e.target.value)}
              className="px-3 py-2 rounded-md bg-secondary text-foreground text-sm w-full"
            />
            {dayCheck && (
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Trading day:</span>{" "}
                  <span
                    className={
                      dayCheck.is_trading_day
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {dayCheck.is_trading_day ? "Yes" : "No"}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Weekend:</span>{" "}
                  {dayCheck.is_weekend ? "Yes" : "No"}
                </p>
                <p>
                  <span className="text-muted-foreground">Known holiday:</span>{" "}
                  {dayCheck.is_known_holiday ? "Yes" : "No"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Festival windows</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <PartyPopper className="w-4 h-4 text-orange-400" />
              <span>Dashain period:</span>
              <span
                className={
                  festival?.is_dashain_period
                    ? "text-orange-400 font-medium"
                    : "text-muted-foreground"
                }
              >
                {festival?.is_dashain_period ? "Inside window" : "No"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>Tihar period:</span>
              <span
                className={
                  festival?.is_tihar_period
                    ? "text-yellow-400 font-medium"
                    : "text-muted-foreground"
                }
              >
                {festival?.is_tihar_period ? "Inside window" : "No"}
              </span>
            </div>
            {festival?.days_until_dashain !== null &&
              festival?.days_until_dashain !== undefined && (
                <p className="text-muted-foreground">
                  Days until next Dashain:{" "}
                  <span className="text-foreground font-medium">
                    {festival.days_until_dashain}
                  </span>
                </p>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Holidays */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Holidays</CardTitle>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-3 py-1.5 rounded-md bg-secondary text-foreground text-sm"
            >
              {[2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {holidays?.holidays.length ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {holidays.holidays.map((h) => (
                <div
                  key={h}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary text-sm"
                >
                  <CalendarX className="w-3.5 h-3.5 text-red-400" />
                  {h}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No holidays on record for {year}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
