import type { Timesheet } from "@/types";

const DAYS_PER_TIMESHEET = 5;

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

export function getTimesheetDays(timesheet: Pick<Timesheet, "rangeStart">) {
  const rangeStart = parseDateOnly(timesheet.rangeStart);

  if (!rangeStart) {
    return [];
  }

  return Array.from({ length: DAYS_PER_TIMESHEET }, (_, index) => {
    const date = new Date(rangeStart);
    date.setUTCDate(rangeStart.getUTCDate() + index);

    return dayFormatter.format(date);
  });
}
