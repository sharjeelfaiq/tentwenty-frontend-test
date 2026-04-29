import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { timesheets } from "@lib/mock-data";
import { useTimesheets } from "@features/timesheets/hooks/use-timesheets";
import type { DateRangeFilter, Timesheet, TimesheetStatus } from "@/types";

const getTimesheets = vi.fn();

vi.mock("@features/timesheets/services/timesheet-service", () => ({
  getTimesheets: (...args: Parameters<typeof getTimesheets>) => getTimesheets(...args),
}));

function filterTimesheets(range: DateRangeFilter, status: "all" | TimesheetStatus) {
  return timesheets
    .filter((sheet) => {
      if (range === "all" || range === "january") {
        return true;
      }

      if (range === "jan-1-19") {
        return sheet.weekNumber <= 3;
      }

      if (range === "jan-20-feb-2") {
        return sheet.rangeEnd >= "2024-01-20" && sheet.rangeStart <= "2024-02-02";
      }

      return true;
    })
    .filter((sheet) => status === "all" || sheet.status === status);
}

function createResponse(filteredTimesheets: Timesheet[]) {
  return {
    user: { id: "user-1", name: "John Doe", email: "john@example.com" },
    timesheets: filteredTimesheets,
  };
}

describe("useTimesheets", () => {
  beforeEach(() => {
    getTimesheets.mockReset();
    getTimesheets.mockImplementation(
      async ({ range, status }: { range: DateRangeFilter; status: "all" | TimesheetStatus }) =>
        createResponse(filterTimesheets(range, status)),
    );
  });

  it("defaults to 5 rows per page and derives 3 pages from 15 items", async () => {
    const { result } = renderHook(() => useTimesheets());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.pageSize).toBe(5);
    expect(result.current.totalItems).toBe(15);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.paginatedTimesheets).toHaveLength(5);
    expect(result.current.paginatedTimesheets[0].dateLabel).toBe("1-5 January, 2024");
    expect(result.current.paginatedTimesheets[4].dateLabel).toBe("29 January-2 February, 2024");
  });

  it("switches to 10 rows per page and derives 2 pages", async () => {
    const { result } = renderHook(() => useTimesheets());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setPageSize(10);
    });

    expect(result.current.pageSize).toBe(10);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(2);
    expect(result.current.paginatedTimesheets).toHaveLength(10);
    expect(result.current.paginatedTimesheets[9].dateLabel).toBe("4-8 March, 2024");
  });

  it("resets the page to 1 when the page size changes", async () => {
    const { result } = renderHook(() => useTimesheets());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setCurrentPage(3);
    });

    expect(result.current.currentPage).toBe(3);

    act(() => {
      result.current.setPageSize(10);
    });

    expect(result.current.currentPage).toBe(1);
  });

  it("resets the page to 1 when filters change", async () => {
    const { result } = renderHook(() => useTimesheets());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setCurrentPage(3);
    });

    expect(result.current.currentPage).toBe(3);

    act(() => {
      result.current.setRange("jan-1-19");
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(result.current.totalItems).toBe(3));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.paginatedTimesheets).toHaveLength(3);
  });

  it("clamps requested pages to the available page count", async () => {
    const { result } = renderHook(() => useTimesheets());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setCurrentPage(99);
    });

    expect(result.current.currentPage).toBe(3);
  });

  it("keeps totalItems tied to the full filtered dataset when status changes", async () => {
    const { result } = renderHook(() => useTimesheets());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.totalItems).toBe(15);

    act(() => {
      result.current.setStatus("COMPLETED");
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rawTimesheets).toHaveLength(6);
    expect(result.current.totalItems).toBe(6);
    expect(result.current.totalPages).toBe(2);
    expect(result.current.paginatedTimesheets).toHaveLength(5);
  });
});
