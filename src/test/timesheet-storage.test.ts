import { beforeEach, describe, expect, it } from "vitest";

import {
  clearTimesheetsStore,
  mergeTimesheetsFromServer,
  readTimesheetsStore,
  timesheetStorageKey,
  upsertCachedTimesheet,
  writeTimesheetsStore,
} from "@features/timesheets/services/timesheet-storage";
import type { Timesheet } from "@/types";

const baseTimesheet: Timesheet = {
  id: "detail-jan-21",
  weekNumber: 4,
  dateLabel: "22-26 January, 2024",
  rangeStart: "2024-01-22",
  rangeEnd: "2024-01-26",
  status: "INCOMPLETE",
  totalHours: 20,
  entries: [],
};

describe("timesheet localStorage persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when no cache exists", () => {
    expect(readTimesheetsStore()).toBeNull();
  });

  it("reads and writes the versioned cache shape", () => {
    writeTimesheetsStore({
      user: { id: "user-1", name: "John Doe", email: "john@example.com" },
      timesheets: [baseTimesheet],
      updatedAt: 123,
    });

    expect(readTimesheetsStore()).toEqual({
      version: 1,
      updatedAt: 123,
      user: { id: "user-1", name: "John Doe", email: "john@example.com" },
      timesheets: [baseTimesheet],
    });
  });

  it("clears malformed cache data", () => {
    window.localStorage.setItem(timesheetStorageKey, "{");

    expect(readTimesheetsStore()).toBeNull();
    expect(window.localStorage.getItem(timesheetStorageKey)).toBeNull();
  });

  it("merges server timesheets over cached timesheets", () => {
    const cachedTimesheet = {
      ...baseTimesheet,
      totalHours: 12,
    };
    const serverTimesheet = {
      ...baseTimesheet,
      totalHours: 40,
      status: "COMPLETED" as const,
    };

    expect(mergeTimesheetsFromServer([serverTimesheet], [cachedTimesheet])).toEqual([serverTimesheet]);
  });

  it("upserts a cached timesheet without duplicating ids", () => {
    writeTimesheetsStore({
      user: null,
      timesheets: [baseTimesheet],
    });

    upsertCachedTimesheet({
      ...baseTimesheet,
      totalHours: 40,
      status: "COMPLETED",
    });

    const cachedStore = readTimesheetsStore();

    expect(cachedStore?.timesheets).toHaveLength(1);
    expect(cachedStore?.timesheets[0].totalHours).toBe(40);
  });

  it("removes the cache", () => {
    writeTimesheetsStore({
      user: null,
      timesheets: [baseTimesheet],
    });

    clearTimesheetsStore();

    expect(readTimesheetsStore()).toBeNull();
  });
});
