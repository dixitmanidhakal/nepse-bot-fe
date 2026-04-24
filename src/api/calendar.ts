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

export const calendarApi = {
  getStatus: async (): Promise<CalendarStatus> => {
    const { data } = await apiClient.get("/api/v1/calendar/status");
    return data;
  },

  isTradingDay: async (d: string) => {
    const { data } = await apiClient.get("/api/v1/calendar/is-trading-day", {
      params: { d },
    });
    return data as {
      date: string;
      is_trading_day: boolean;
      is_weekend: boolean;
      is_known_holiday: boolean;
    };
  },

  nextTradingDay: async (d: string) => {
    const { data } = await apiClient.get("/api/v1/calendar/next-trading-day", {
      params: { d },
    });
    return data as { from: string; next_trading_day: string };
  },

  tradingDaysBetween: async (start: string, end: string) => {
    const { data } = await apiClient.get(
      "/api/v1/calendar/trading-days-between",
      { params: { start, end } }
    );
    return data as { start: string; end: string; trading_days: number };
  },

  getHolidays: async (year: number): Promise<HolidaysResponse> => {
    const { data } = await apiClient.get("/api/v1/calendar/holidays", {
      params: { year },
    });
    return data;
  },

  getFestivalWindows: async (d: string): Promise<FestivalWindows> => {
    const { data } = await apiClient.get(
      "/api/v1/calendar/festival-windows",
      { params: { d } }
    );
    return data;
  },
};
