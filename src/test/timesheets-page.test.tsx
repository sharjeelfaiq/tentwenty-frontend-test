import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { timesheets } from "@lib/mock-data";
import { TimesheetsPage } from "@features/timesheets";
import type { DateRangeFilter, Timesheet, TimesheetStatus } from "@/types";

const useTimesheets = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock("@features/timesheets/hooks/use-timesheets", () => ({
  useTimesheets: () => useTimesheets(),
}));

function createInteractiveUseTimesheetsMock(items: Timesheet[] = timesheets) {
  return function useTimesheetsMock() {
    const [range, setRange] = useState<DateRangeFilter>("all");
    const [status, setStatus] = useState<"all" | TimesheetStatus>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const totalItems = items.length;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
    const currentPageForView = totalPages === 0 ? 1 : Math.min(currentPage, totalPages);
    const paginatedTimesheets = items.slice((currentPageForView - 1) * pageSize, currentPageForView * pageSize);

    return {
      range,
      status,
      rawTimesheets: items,
      paginatedTimesheets,
      user: null,
      isLoading: false,
      error: null,
      currentPage: currentPageForView,
      pageSize,
      totalItems,
      totalPages,
      setRange: (value: DateRangeFilter) => {
        setRange(value);
        setCurrentPage(1);
      },
      setStatus: (value: "all" | TimesheetStatus) => {
        setStatus(value);
        setCurrentPage(1);
      },
      setCurrentPage: (page: number) => setCurrentPage(Math.min(Math.max(page, 1), Math.max(totalPages, 1))),
      setPageSize: (nextPageSize: number) => {
        setPageSize(nextPageSize);
        setCurrentPage(1);
      },
    };
  };
}

describe("TimesheetsPage", () => {
  beforeEach(() => {
    useTimesheets.mockReset();
  });

  it("renders a loading state", () => {
    useTimesheets.mockReturnValue({
      range: "all",
      status: "all",
      rawTimesheets: [],
      paginatedTimesheets: [],
      isLoading: true,
      error: null,
      currentPage: 1,
      pageSize: 5,
      totalItems: 0,
      totalPages: 0,
      setRange: vi.fn(),
      setStatus: vi.fn(),
      setCurrentPage: vi.fn(),
      setPageSize: vi.fn(),
    });

    render(<TimesheetsPage />);
    expect(screen.getByText("Loading timesheets...")).toBeInTheDocument();
  });

  it("renders an empty state", () => {
    useTimesheets.mockReturnValue({
      range: "all",
      status: "all",
      rawTimesheets: [],
      paginatedTimesheets: [],
      isLoading: false,
      error: null,
      currentPage: 1,
      pageSize: 5,
      totalItems: 0,
      totalPages: 0,
      setRange: vi.fn(),
      setStatus: vi.fn(),
      setCurrentPage: vi.fn(),
      setPageSize: vi.fn(),
    });

    render(<TimesheetsPage />);
    expect(screen.getByText("No timesheets match the current filters.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  it("renders an error state", () => {
    useTimesheets.mockReturnValue({
      range: "all",
      status: "all",
      rawTimesheets: [],
      paginatedTimesheets: [],
      isLoading: false,
      error: "Authentication required.",
      currentPage: 1,
      pageSize: 5,
      totalItems: 0,
      totalPages: 0,
      setRange: vi.fn(),
      setStatus: vi.fn(),
      setCurrentPage: vi.fn(),
      setPageSize: vi.fn(),
    });

    render(<TimesheetsPage />);
    expect(screen.getByText("Authentication required.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  it("renders fetched timesheet rows", () => {
    useTimesheets.mockReturnValue({
      range: "all",
      status: "all",
      isLoading: false,
      error: null,
      currentPage: 1,
      pageSize: 5,
      totalItems: 1,
      totalPages: 1,
      setRange: vi.fn(),
      setStatus: vi.fn(),
      setCurrentPage: vi.fn(),
      setPageSize: vi.fn(),
      rawTimesheets: [
        {
          id: "detail-jan-21",
          weekNumber: 4,
          dateLabel: "22-26 January, 2024",
          rangeStart: "2024-01-22",
          rangeEnd: "2024-01-26",
          status: "INCOMPLETE",
          totalHours: 20,
          entries: [],
        },
      ],
      paginatedTimesheets: [
        {
          id: "detail-jan-21",
          weekNumber: 4,
          dateLabel: "22-26 January, 2024",
          rangeStart: "2024-01-22",
          rangeEnd: "2024-01-26",
          status: "INCOMPLETE",
          totalHours: 20,
          entries: [],
        },
      ],
    });

    render(<TimesheetsPage />);
    expect(screen.getByText("22-26 January, 2024")).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
  });

  it("allows selecting 10 rows per page", async () => {
    const user = userEvent.setup();
    useTimesheets.mockImplementation(createInteractiveUseTimesheetsMock());

    render(<TimesheetsPage />);

    expect(screen.queryByText("5-9 February, 2024")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Rows per page" }), "10");

    await waitFor(() => expect(screen.getByText("5-9 February, 2024")).toBeInTheDocument());
  });

  it("allows selecting 5 rows per page after switching to 10", async () => {
    const user = userEvent.setup();
    useTimesheets.mockImplementation(createInteractiveUseTimesheetsMock());

    render(<TimesheetsPage />);

    const rowsPerPage = screen.getByRole("combobox", { name: "Rows per page" });

    await user.selectOptions(rowsPerPage, "10");
    await waitFor(() => expect(screen.getByText("5-9 February, 2024")).toBeInTheDocument());

    await user.selectOptions(rowsPerPage, "5");
    await waitFor(() => expect(screen.queryByText("5-9 February, 2024")).not.toBeInTheDocument());
  });

  it("renders only the first 5 rows on the initial dashboard view", () => {
    useTimesheets.mockImplementation(createInteractiveUseTimesheetsMock());

    render(<TimesheetsPage />);

    expect(screen.getByText("1-5 January, 2024")).toBeInTheDocument();
    expect(screen.getByText("29 January-2 February, 2024")).toBeInTheDocument();
    expect(screen.queryByText("5-9 February, 2024")).not.toBeInTheDocument();
  });

  it("supports navigating to the next page with the current dataset", async () => {
    const user = userEvent.setup();
    useTimesheets.mockImplementation(createInteractiveUseTimesheetsMock());

    render(<TimesheetsPage />);

    expect(screen.getByText("1-5 January, 2024")).toBeInTheDocument();
    expect(screen.queryByText("5-9 February, 2024")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => expect(screen.getByText("5-9 February, 2024")).toBeInTheDocument());
    expect(screen.getByText("4-8 March, 2024")).toBeInTheDocument();
    expect(screen.queryByText("1-5 January, 2024")).not.toBeInTheDocument();
  });

  it("renders all expected pagination controls for 15 items", () => {
    useTimesheets.mockImplementation(createInteractiveUseTimesheetsMock());

    render(<TimesheetsPage />);

    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  });

  it("supports navigating back with the previous button", async () => {
    const user = userEvent.setup();
    useTimesheets.mockImplementation(createInteractiveUseTimesheetsMock());

    render(<TimesheetsPage />);

    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(screen.getByText("5-9 February, 2024")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Previous" }));

    await waitFor(() => expect(screen.getByText("1-5 January, 2024")).toBeInTheDocument());
    expect(screen.queryByText("5-9 February, 2024")).not.toBeInTheDocument();
  });

  it("supports navigating directly with page number buttons", async () => {
    const user = userEvent.setup();
    useTimesheets.mockImplementation(createInteractiveUseTimesheetsMock());

    render(<TimesheetsPage />);

    await user.click(screen.getByRole("button", { name: "3" }));

    await waitFor(() => expect(screen.getByText("25-29 March, 2024")).toBeInTheDocument());
    expect(screen.getByText("8-12 April, 2024")).toBeInTheDocument();
    expect(screen.queryByText("1-5 January, 2024")).not.toBeInTheDocument();
  });

  it("shows only two page buttons after switching to 10 rows per page", async () => {
    const user = userEvent.setup();
    useTimesheets.mockImplementation(createInteractiveUseTimesheetsMock());

    render(<TimesheetsPage />);

    await user.click(screen.getByRole("button", { name: "3" }));
    await waitFor(() => expect(screen.getByText("25-29 March, 2024")).toBeInTheDocument());

    await user.selectOptions(screen.getByRole("combobox", { name: "Rows per page" }), "10");

    await waitFor(() => expect(screen.getByText("4-8 March, 2024")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "3" })).not.toBeInTheDocument();
  });
});
