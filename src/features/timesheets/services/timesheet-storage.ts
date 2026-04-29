import type { DateRangeFilter, Timesheet, TimesheetStatus, User } from "@/types";

export const timesheetStorageKey = "timesheets-store:v1";

interface TimesheetStoragePayload {
  version: 1;
  updatedAt: number;
  user: User | null;
  timesheets: Timesheet[];
}

export type TimesheetStorageSnapshot = TimesheetStoragePayload;

function getLocalStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

function isTimesheet(value: unknown): value is Timesheet {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "entries" in value &&
    Array.isArray(value.entries)
  );
}

function normalizePayload(value: unknown): TimesheetStorageSnapshot | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("version" in value) ||
    value.version !== 1 ||
    !("timesheets" in value) ||
    !Array.isArray(value.timesheets)
  ) {
    return null;
  }

  return {
    version: 1,
    updatedAt: "updatedAt" in value && typeof value.updatedAt === "number" ? value.updatedAt : 0,
    user: "user" in value && typeof value.user === "object" ? (value.user as User | null) : null,
    timesheets: value.timesheets.filter(isTimesheet),
  };
}

export function readTimesheetsStore(): TimesheetStorageSnapshot | null {
  const storage = getLocalStorage();

  if (!storage) {
    return null;
  }

  try {
    const rawValue = storage.getItem(timesheetStorageKey);

    if (!rawValue) {
      return null;
    }

    const payload = normalizePayload(JSON.parse(rawValue));

    if (!payload) {
      storage.removeItem(timesheetStorageKey);
    }

    return payload;
  } catch {
    storage.removeItem(timesheetStorageKey);
    return null;
  }
}

export function writeTimesheetsStore(snapshot: {
  user: User | null;
  timesheets: Timesheet[];
  updatedAt?: number;
}) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  const payload: TimesheetStorageSnapshot = {
    version: 1,
    updatedAt: snapshot.updatedAt ?? Date.now(),
    user: snapshot.user,
    timesheets: snapshot.timesheets,
  };

  storage.setItem(timesheetStorageKey, JSON.stringify(payload));
}

export function clearTimesheetsStore() {
  getLocalStorage()?.removeItem(timesheetStorageKey);
}

export function mergeTimesheetsFromServer(
  serverTimesheets: Timesheet[],
  cachedTimesheets: Timesheet[],
) {
  const mergedById = new Map<string, Timesheet>();

  for (const timesheet of cachedTimesheets) {
    mergedById.set(timesheet.id, timesheet);
  }

  for (const timesheet of serverTimesheets) {
    mergedById.set(timesheet.id, timesheet);
  }

  return Array.from(mergedById.values()).sort((first, second) => {
    if (first.rangeStart === second.rangeStart) {
      return first.weekNumber - second.weekNumber;
    }

    return first.rangeStart.localeCompare(second.rangeStart);
  });
}

export function upsertCachedTimesheet(timesheet: Timesheet, user?: User | null) {
  const current = readTimesheetsStore();
  const nextTimesheets = mergeTimesheetsFromServer([timesheet], current?.timesheets ?? []);

  writeTimesheetsStore({
    user: user ?? current?.user ?? null,
    timesheets: nextTimesheets,
  });
}

export function getCachedTimesheet(id: string) {
  return readTimesheetsStore()?.timesheets.find((timesheet) => timesheet.id === id) ?? null;
}

export function filterCachedTimesheets(
  timesheets: Timesheet[],
  filters: {
    range: DateRangeFilter;
    status: "all" | TimesheetStatus;
  },
) {
  return timesheets
    .filter((sheet) => {
      if (filters.range === "all" || filters.range === "january") {
        return true;
      }

      if (filters.range === "jan-1-19") {
        return sheet.weekNumber <= 3;
      }

      if (filters.range === "jan-20-feb-2") {
        return sheet.rangeEnd >= "2024-01-20" && sheet.rangeStart <= "2024-02-02";
      }

      return true;
    })
    .filter((sheet) => filters.status === "all" || sheet.status === filters.status);
}
