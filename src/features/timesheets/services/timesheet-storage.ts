import { deriveTimesheet } from "@lib/timesheet-status";
import { assertTimesheetHoursLimit, type TimesheetEntryInput } from "@lib/validation";
import type { DateRangeFilter, Timesheet, TimesheetEntry, TimesheetStatus, User } from "@/types";

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

function sortTimesheets(timesheets: Timesheet[]) {
  return [...timesheets].sort((first, second) => {
    if (first.rangeStart === second.rangeStart) {
      return first.weekNumber - second.weekNumber;
    }

    return first.rangeStart.localeCompare(second.rangeStart);
  });
}

export function mergeTimesheetsFromServer(
  serverTimesheets: Timesheet[],
  cachedTimesheets: Timesheet[],
) {
  const mergedById = new Map<string, Timesheet>();

  for (const timesheet of serverTimesheets) {
    mergedById.set(timesheet.id, timesheet);
  }

  for (const timesheet of cachedTimesheets) {
    mergedById.set(timesheet.id, timesheet);
  }

  return sortTimesheets(Array.from(mergedById.values()));
}

export function upsertCachedTimesheet(timesheet: Timesheet, user?: User | null, options: { overwrite?: boolean } = {}) {
  const current = readTimesheetsStore();
  const cachedTimesheets = current?.timesheets ?? [];
  const nextTimesheets = options.overwrite
    ? sortTimesheets([...cachedTimesheets.filter((item) => item.id !== timesheet.id), timesheet])
    : mergeTimesheetsFromServer([timesheet], cachedTimesheets);

  writeTimesheetsStore({
    user: user ?? current?.user ?? null,
    timesheets: nextTimesheets,
  });
}

export function getCachedTimesheet(id: string) {
  return readTimesheetsStore()?.timesheets.find((timesheet) => timesheet.id === id) ?? null;
}

function createEntryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `entry-${crypto.randomUUID()}`;
  }

  return `entry-${Date.now()}`;
}

export function createCachedEntry(timesheet: Timesheet, entry: TimesheetEntryInput, user?: User | null) {
  assertTimesheetHoursLimit(timesheet.entries, entry.hours);

  const nextEntry: TimesheetEntry = {
    ...entry,
    id: createEntryId(),
    taskName: entry.description,
  };
  const updated = deriveTimesheet({
    ...timesheet,
    entries: [...timesheet.entries, nextEntry],
  });

  upsertCachedTimesheet(updated, user, { overwrite: true });
  return updated;
}

export function updateCachedEntry(
  timesheet: Timesheet,
  entryId: TimesheetEntry["id"],
  entry: TimesheetEntryInput,
  user?: User | null,
) {
  const entryIndex = timesheet.entries.findIndex((item) => item.id === entryId);

  if (entryIndex < 0) {
    return null;
  }

  assertTimesheetHoursLimit(timesheet.entries, entry.hours, { excludeEntryId: entryId });

  const updated = deriveTimesheet({
    ...timesheet,
    entries: timesheet.entries.map((item, currentIndex) =>
      currentIndex === entryIndex
        ? {
            ...item,
            ...entry,
            taskName: entry.description,
          }
        : item,
    ),
  });

  upsertCachedTimesheet(updated, user, { overwrite: true });
  return updated;
}

export function deleteCachedEntry(timesheet: Timesheet, entryId: TimesheetEntry["id"], user?: User | null) {
  const nextEntries = timesheet.entries.filter((entry) => entry.id !== entryId);

  if (nextEntries.length === timesheet.entries.length) {
    return null;
  }

  const updated = deriveTimesheet({
    ...timesheet,
    entries: nextEntries,
  });

  upsertCachedTimesheet(updated, user, { overwrite: true });
  return updated;
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
