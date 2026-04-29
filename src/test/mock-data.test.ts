import { describe, expect, it } from "vitest";

import { timesheets } from "@lib/mock-data";

describe("timesheet seed data", () => {
  it("generates complete Monday-Friday work weeks for January and February 2024", () => {
    expect(timesheets.slice(0, 9).map((timesheet) => timesheet.dateLabel)).toEqual([
      "1-5 January, 2024",
      "8-12 January, 2024",
      "15-19 January, 2024",
      "22-26 January, 2024",
      "29 January-2 February, 2024",
      "5-9 February, 2024",
      "12-16 February, 2024",
      "19-23 February, 2024",
      "26 February-1 March, 2024",
    ]);
  });

  it("keeps generated January and February ranges unique and non-overlapping", () => {
    const generatedRanges = timesheets.slice(0, 9).map((timesheet) => [
      timesheet.rangeStart,
      timesheet.rangeEnd,
    ]);

    expect(new Set(generatedRanges.map((range) => range.join(":"))).size).toBe(generatedRanges.length);

    generatedRanges.forEach((range, index) => {
      const nextRange = generatedRanges[index + 1];

      if (nextRange) {
        expect(range[1] < nextRange[0]).toBe(true);
      }
    });
  });
});
