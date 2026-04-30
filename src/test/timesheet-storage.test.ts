import { beforeEach, describe, expect, it } from "vitest";

import {
  clearTimesheetsStore,
  createCachedEntry,
  deleteCachedEntry,
  mergeTimesheetsFromServer,
  readTimesheetsStore,
  timesheetStorageKey,
  updateCachedEntry,
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

  it("keeps cached timesheets over matching server timesheets", () => {
    const cachedTimesheet = {
      ...baseTimesheet,
      totalHours: 12,
    };
    const serverTimesheet = {
      ...baseTimesheet,
      totalHours: 40,
      status: "COMPLETED" as const,
    };

    expect(mergeTimesheetsFromServer([serverTimesheet], [cachedTimesheet])).toEqual([cachedTimesheet]);
  });

  it("upserts a cached timesheet without duplicating ids", () => {
    writeTimesheetsStore({
      user: null,
      timesheets: [baseTimesheet],
    });

    upsertCachedTimesheet(
      {
        ...baseTimesheet,
        totalHours: 40,
        status: "COMPLETED",
      },
      null,
      { overwrite: true },
    );

    const cachedStore = readTimesheetsStore();

    expect(cachedStore?.timesheets).toHaveLength(1);
    expect(cachedStore?.timesheets[0].totalHours).toBe(40);
  });

  it("creates cached entries and derives incomplete status", () => {
    const updated = createCachedEntry(baseTimesheet, {
      day: "Jan 22",
      project: "Project Name",
      type: "Bug fixes",
      description: "Write tests",
      hours: 4,
    });

    expect(updated.entries.at(-1)?.description).toBe("Write tests");
    expect(updated.entries.at(-1)?.taskName).toBe("Write tests");
    expect(updated.totalHours).toBe(4);
    expect(updated.status).toBe("INCOMPLETE");
    expect(readTimesheetsStore()?.timesheets[0]).toEqual(updated);
  });

  it("updates cached entries and derives completed status", () => {
    const sheetWithEntry = {
      ...baseTimesheet,
      entries: [
        {
          id: "entry-1",
          day: "Jan 22",
          taskName: "Old task",
          hours: 36,
          project: "Project Name" as const,
          type: "Bug fixes" as const,
          description: "Old task",
        },
      ],
    };

    const updated = updateCachedEntry(sheetWithEntry, "entry-1", {
      day: "Jan 22",
      project: "Project Name",
      type: "Feature work",
      description: "Updated task",
      hours: 40,
    });

    expect(updated?.entries[0].description).toBe("Updated task");
    expect(updated?.entries[0].taskName).toBe("Updated task");
    expect(updated?.totalHours).toBe(40);
    expect(updated?.status).toBe("COMPLETED");
  });

  it("deletes cached entries and derives missing status", () => {
    const sheetWithEntry = {
      ...baseTimesheet,
      entries: [
        {
          id: "entry-1",
          day: "Jan 22",
          taskName: "Old task",
          hours: 4,
          project: "Project Name" as const,
          type: "Bug fixes" as const,
          description: "Old task",
        },
      ],
    };

    const updated = deleteCachedEntry(sheetWithEntry, "entry-1");

    expect(updated?.entries).toEqual([]);
    expect(updated?.totalHours).toBe(0);
    expect(updated?.status).toBe("MISSING");
  });

  it("rejects cached entries that exceed 40 total hours", () => {
    expect(() =>
      createCachedEntry(
        {
          ...baseTimesheet,
          entries: [
            {
              id: "entry-1",
              day: "Jan 22",
              taskName: "Existing task",
              hours: 40,
              project: "Project Name",
              type: "Bug fixes",
              description: "Existing task",
            },
          ],
        },
        {
          day: "Jan 23",
          project: "Project Name",
          type: "Bug fixes",
          description: "Too much",
          hours: 1,
        },
      ),
    ).toThrow("Timesheet total cannot exceed 40 hours.");
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
