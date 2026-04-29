import { detailTimesheet, timesheets } from "@lib/mock-data";
import { deriveTimesheet } from "@lib/timesheet-status";
import type { DateRangeFilter, Timesheet, TimesheetEntry, TimesheetStatus } from "@/types";

interface TimesheetStore {
  timesheets: Timesheet[];
}

function cloneStore(): TimesheetStore {
  return {
    timesheets: structuredClone(
      timesheets.map((sheet) => deriveTimesheet(sheet.id === detailTimesheet.id ? detailTimesheet : sheet)),
    ),
  };
}

const globalStore = globalThis as typeof globalThis & { __ticktockStore__?: TimesheetStore };

function getStore() {
  globalStore.__ticktockStore__ ??= cloneStore();
  return globalStore.__ticktockStore__;
}

export function listTimesheets() {
  return structuredClone(getStore().timesheets.map(deriveTimesheet));
}

function overlaps(selected: DateRangeFilter, timesheet: Timesheet) {
  if (selected === "all" || selected === "january") {
    return true;
  }

  if (selected === "jan-1-19") {
    return timesheet.weekNumber <= 3;
  }

  if (selected === "jan-20-feb-2") {
    return timesheet.rangeEnd >= "2024-01-20" && timesheet.rangeStart <= "2024-02-02";
  }

  return true;
}

export function filterTimesheets(filters: {
  range: DateRangeFilter;
  status: "all" | TimesheetStatus;
}) {
  return listTimesheets()
    .filter((sheet) => overlaps(filters.range, sheet))
    .filter((sheet) => filters.status === "all" || sheet.status === filters.status);
}

export function getTimesheetById(id: string) {
  const sheet = getStore().timesheets.find((item) => item.id === id);
  return sheet ? structuredClone(deriveTimesheet(sheet)) : null;
}

export function createEntry(timesheetId: string, entry: Omit<TimesheetEntry, "id" | "taskName">) {
  const store = getStore();
  const index = store.timesheets.findIndex((sheet) => sheet.id === timesheetId);

  if (index < 0) {
    return null;
  }

  const nextEntry: TimesheetEntry = {
    ...entry,
    id: `entry-${Date.now()}`,
    taskName: entry.description,
  };

  const updated = deriveTimesheet({
    ...store.timesheets[index],
    entries: [...store.timesheets[index].entries, nextEntry],
  });

  store.timesheets[index] = updated;
  return structuredClone(updated);
}

export function updateEntry(timesheetId: string, entryId: string, entry: Omit<TimesheetEntry, "id" | "taskName">) {
  const store = getStore();
  const index = store.timesheets.findIndex((sheet) => sheet.id === timesheetId);

  if (index < 0) {
    return null;
  }

  const existing = store.timesheets[index];
  const entryIndex = existing.entries.findIndex((item) => item.id === entryId);

  if (entryIndex < 0) {
    return null;
  }

  const nextEntries = existing.entries.map((item, currentIndex) =>
    currentIndex === entryIndex
      ? {
          ...item,
          ...entry,
          taskName: entry.description,
        }
      : item,
  );

  const updated = deriveTimesheet({
    ...existing,
    entries: nextEntries,
  });

  store.timesheets[index] = updated;
  return structuredClone(updated);
}

export function deleteEntry(timesheetId: string, entryId: string) {
  const store = getStore();
  const index = store.timesheets.findIndex((sheet) => sheet.id === timesheetId);

  if (index < 0) {
    return null;
  }

  const existing = store.timesheets[index];
  const nextEntries = existing.entries.filter((item) => item.id !== entryId);

  if (nextEntries.length === existing.entries.length) {
    return null;
  }

  const updated = deriveTimesheet({
    ...existing,
    entries: nextEntries,
  });

  store.timesheets[index] = updated;
  return structuredClone(updated);
}

export function resetMockStore() {
  globalStore.__ticktockStore__ = cloneStore();
}
