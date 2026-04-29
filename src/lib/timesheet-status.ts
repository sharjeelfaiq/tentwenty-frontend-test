import type { Timesheet, TimesheetStatus } from "@/types";

const REQUIRED_WEEKLY_HOURS = 40;

export function deriveTimesheetStatus(sheet: Pick<Timesheet, "entries">): TimesheetStatus {
  if (sheet.entries.length === 0) {
    return "MISSING";
  }

  const totalHours = sheet.entries.reduce((sum, entry) => sum + entry.hours, 0);

  return totalHours >= REQUIRED_WEEKLY_HOURS ? "COMPLETED" : "INCOMPLETE";
}

export function deriveTimesheet(sheet: Timesheet): Timesheet {
  const totalHours = sheet.entries.reduce((sum, entry) => sum + entry.hours, 0);

  return {
    ...sheet,
    totalHours,
    status: deriveTimesheetStatus(sheet),
  };
}
