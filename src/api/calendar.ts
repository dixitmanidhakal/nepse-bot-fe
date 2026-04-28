/**
 * Calendar API.
 *
 * The backend exposes a working `/api/v1/calendar/status` endpoint. We keep
 * that as the primary source. Derived helpers (is-trading-day, holidays,
 * festival-windows) are computed locally so the page works even when the
 * specific backend routes are unavailable on the free deployment.
 */

import apiClient from "./client";

export interface CalendarStatus {
  nepal_datetime: string;
  date: string;
  weekday: string;
  is_weekend: boolean;
  is_known_holiday: boolean;
  is_trading_day: boolean;
  session_phase: string;
  schedule: {
    trading_week: string;
    weekend: string;
    preopen: string;
    special_preopen: string;
    regular: string;
  };
}

export interface HolidaysResponse {
  year: number;
  count: number;
  holidays: string[];
}

export interface FestivalWindows {
  date: string;
  is_dashain_period: boolean;
  is_tihar_period: boolean;
  days_until_dashain: number | null;
}

// ── local helpers ─────────────────────────────────────────────────────────
const WEEKDAY = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function parseDate(d: string): Date {
  // Expect YYYY-MM-DD
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, day ?? 1));
}

function isWeekendNepal(d: Date): boolean {
  // NEPSE trades Sun–Thu; Fri & Sat are weekend
  const dow = d.getUTCDay(); // 0=Sun
  return dow === 5 || dow === 6;
}

// Very small curated list of known major public holidays (approx; backend has
// the authoritative list). This is intentionally conservative so the page
// always has something to render.
const STATIC_HOLIDAYS: Record<number, string[]> = {
  2024: [
    "2024-01-15",
    "2024-03-08",
    "2024-04-13",
    "2024-05-01",
    "2024-08-19",
    "2024-10-12",
    "2024-11-01",
    "2024-12-25",
  ],
  2025: [
    "2025-01-14",
    "2025-03-08",
    "2025-04-13",
    "2025-05-01",
    "2025-08-19",
    "2025-10-02",
    "2025-10-22",
    "2025-12-25",
  ],
  2026: [
    "2026-01-14",
    "2026-03-08",
    "2026-04-14",
    "2026-05-01",
    "2026-08-19",
    "2026-10-20",
    "2026-11-10",
    "2026-12-25",
  ],
};

function isKnownHolidayLocal(d: string): boolean {
  const year = Number(d.slice(0, 4));
  return (STATIC_HOLIDAYS[year] ?? []).includes(d);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function formatIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── public API ────────────────────────────────────────────────────────────
export const calendarApi = {
  getStatus: async (): Promise<CalendarStatus> => {
    try {
      const { data } = await apiClient.get("/api/v1/calendar/status");
      return data;
    } catch {
      const now = new Date();
      const date = formatIso(now);
      const weekend = isWeekendNepal(now);
      const holiday = isKnownHolidayLocal(date);
      return {
        nepal_datetime: now.toISOString(),
        date,
        weekday: WEEKDAY[now.getUTCDay()],
        is_weekend: weekend,
        is_known_holiday: holiday,
        is_trading_day: !weekend && !holiday,
        session_phase: weekend || holiday ? "closed" : "regular",
        schedule: {
          trading_week: "Sun-Thu",
          weekend: "Fri-Sat",
          preopen: "10:30-10:59",
          special_preopen: "10:30-10:59",
          regular: "11:00-15:00",
        },
      };
    }
  },

  isTradingDay: async (d: string) => {
    try {
      const { data } = await apiClient.get("/api/v1/calendar/is-trading-day", {
        params: { d },
      });
      return data as {
        date: string;
        is_trading_day: boolean;
        is_weekend: boolean;
        is_known_holiday: boolean;
      };
    } catch {
      const dt = parseDate(d);
      const weekend = isWeekendNepal(dt);
      const holiday = isKnownHolidayLocal(d);
      return {
        date: d,
        is_trading_day: !weekend && !holiday,
        is_weekend: weekend,
        is_known_holiday: holiday,
      };
    }
  },

  nextTradingDay: async (d: string) => {
    try {
      const { data } = await apiClient.get(
        "/api/v1/calendar/next-trading-day",
        { params: { d } }
      );
      return data as { from: string; next_trading_day: string };
    } catch {
      let cur = addDays(parseDate(d), 1);
      for (let i = 0; i < 30; i++) {
        const iso = formatIso(cur);
        if (!isWeekendNepal(cur) && !isKnownHolidayLocal(iso))
          return { from: d, next_trading_day: iso };
        cur = addDays(cur, 1);
      }
      return { from: d, next_trading_day: d };
    }
  },

  tradingDaysBetween: async (start: string, end: string) => {
    try {
      const { data } = await apiClient.get(
        "/api/v1/calendar/trading-days-between",
        { params: { start, end } }
      );
      return data as { start: string; end: string; trading_days: number };
    } catch {
      let count = 0;
      let cur = parseDate(start);
      const stop = parseDate(end);
      while (cur <= stop) {
        const iso = formatIso(cur);
        if (!isWeekendNepal(cur) && !isKnownHolidayLocal(iso)) count++;
        cur = addDays(cur, 1);
      }
      return { start, end, trading_days: count };
    }
  },

  getHolidays: async (year: number): Promise<HolidaysResponse> => {
    try {
      const { data } = await apiClient.get("/api/v1/calendar/holidays", {
        params: { year },
      });
      return data;
    } catch {
      const holidays = STATIC_HOLIDAYS[year] ?? [];
      return { year, count: holidays.length, holidays };
    }
  },

  getFestivalWindows: async (d: string): Promise<FestivalWindows> => {
    try {
      const { data } = await apiClient.get(
        "/api/v1/calendar/festival-windows",
        { params: { d } }
      );
      return data;
    } catch {
      return {
        date: d,
        is_dashain_period: false,
        is_tihar_period: false,
        days_until_dashain: null,
      };
    }
  },
};
