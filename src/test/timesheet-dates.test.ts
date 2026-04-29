import { describe, expect, it } from "vitest";

import { getTimesheetDays } from "@lib/timesheet-dates";

describe("getTimesheetDays", () => {
  it("generates five display days from the timesheet range start", () => {
    expect(getTimesheetDays({ rangeStart: "2024-01-22" })).toEqual([
      "Jan 22",
      "Jan 23",
      "Jan 24",
      "Jan 25",
      "Jan 26",
    ]);
  });

  it("generates a separate date range for each timesheet instance", () => {
    expect(getTimesheetDays({ rangeStart: "2024-02-05" })).toEqual([
      "Feb 5",
      "Feb 6",
      "Feb 7",
      "Feb 8",
      "Feb 9",
    ]);
  });

  it("handles weeks that cross month boundaries", () => {
    expect(getTimesheetDays({ rangeStart: "2024-01-29" })).toEqual([
      "Jan 29",
      "Jan 30",
      "Jan 31",
      "Feb 1",
      "Feb 2",
    ]);
  });
});
