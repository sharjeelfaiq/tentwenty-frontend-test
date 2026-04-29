"use client";

import Link from "next/link";

import {
  Badge,
  DropdownChevronIcon,
  Pagination,
  SelectDropdown,
} from "@components/shared";
import { useTimesheets } from "@features/timesheets/hooks/use-timesheets";
import type { TimesheetsResponse } from "@features/timesheets/services/timesheet-service";
import type { DateRangeFilter, TimesheetStatus } from "@/types";

const rangeOptions: Array<{ label: string; value: DateRangeFilter }> = [
  { label: "Date Range", value: "all" },
  { label: "January 2024", value: "january" },
  { label: "1-19 January, 2024", value: "jan-1-19" },
  { label: "20 January-2 February, 2024", value: "jan-20-feb-2" },
];

const statusOptions: Array<{ label: string; value: "all" | TimesheetStatus }> =
  [
    { label: "Status", value: "all" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Incomplete", value: "INCOMPLETE" },
    { label: "Missing", value: "MISSING" },
  ];

const pageSizeOptions = [
  { label: "5 per page", value: "5" },
  { label: "10 per page", value: "10" },
] as const;

function actionLabel(status: TimesheetStatus) {
  switch (status) {
    case "COMPLETED":
      return "View";
    case "INCOMPLETE":
      return "Update";
    case "MISSING":
      return "Create";
  }
}

interface TimesheetsPageProps {
  initialResponse?: TimesheetsResponse;
}

export function TimesheetsPage({ initialResponse }: TimesheetsPageProps) {
  const {
    range,
    status,
    paginatedTimesheets,
    isLoading,
    error,
    currentPage,
    pageSize,
    totalPages,
    setRange,
    setStatus,
    setCurrentPage,
    setPageSize,
  } = useTimesheets(initialResponse);

  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 py-8 md:px-8">
      <section className="app-card rounded-[14px] px-[26px] py-[24px]">
        <h1 className="text-[30px] font-bold tracking-[-0.045em] text-slate-800">
          Your Timesheets
        </h1>

        <div className="mt-6 flex flex-wrap gap-3">
          <SelectDropdown
            value={range}
            options={rangeOptions}
            onChange={setRange}
            className="w-[164px]"
          />
          <SelectDropdown
            value={status}
            options={statusOptions}
            onChange={setStatus}
            className="w-[150px]"
          />
        </div>

        <div className="mt-7 overflow-hidden rounded-[12px] border border-[var(--app-border)]">
          <table className="w-full border-collapse bg-white">
            <thead className="bg-slate-50 text-left text-[13px] font-semibold text-slate-500">
              <tr>
                <th className="w-[10%] px-4 py-[16px]">WEEK #</th>
                <th className="w-[40%] px-4 py-[16px]">DATE</th>
                <th className="w-[40%] px-4 py-[16px]">STATUS</th>
                <th className="w-[10%] px-8 py-[16px] text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-10 text-sm text-slate-500" colSpan={4}>
                    Loading timesheets...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-4 py-10 text-sm text-red-500" colSpan={4}>
                    {error}
                  </td>
                </tr>
              ) : paginatedTimesheets.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-sm text-slate-500" colSpan={4}>
                    No timesheets match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedTimesheets.map((timesheet) => (
                  <tr
                    key={timesheet.id}
                    className="border-t border-[var(--app-border)] text-[15px] text-slate-500"
                  >
                    <td className="w-[10%] bg-slate-50 px-4 py-[18px] text-[16px] text-slate-700">
                      {timesheet.weekNumber}
                    </td>
                    <td className="w-[40%] text-[16px] px-4 py-[18px] text-[16px]">
                      {timesheet.dateLabel}
                    </td>
                    <td className="w-[40%] px-4 py-[18px]">
                      <Badge
                        status={timesheet.status}
                        className="text-[14px]"
                      />
                    </td>
                    <td className="w-[10%] px-8 py-[18px] text-center">
                      <Link href={`/timesheets/${timesheet.id}`}>
                        <span className="align-middle text-[16px] text-blue-600">
                          {actionLabel(timesheet.status)}
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-[26px] flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-[160px]">
            <select
              value={String(pageSize)}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="h-[40px] w-full appearance-none rounded-[14px] border border-[var(--app-border)] bg-slate-100 px-4 pr-10 text-[15px] text-slate-600"
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
              <DropdownChevronIcon className="h-[18px] w-[18px]" />
            </span>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </section>

      <footer className="app-card mt-4 rounded-[14px] px-6 py-[34px] text-center text-[14px] text-slate-400">
        © 2024 tentwenty. All rights reserved.
      </footer>
    </div>
  );
}
