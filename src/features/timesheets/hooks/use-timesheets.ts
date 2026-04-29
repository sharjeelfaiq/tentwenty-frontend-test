"use client";

import { useEffect, useRef, useState } from "react";

import { ApiError } from "@lib/api";
import { getTimesheets, type TimesheetsResponse } from "@features/timesheets/services/timesheet-service";
import type {
  DateRangeFilter,
  Timesheet,
  TimesheetStatus,
  User,
} from "@/types";

export function useTimesheets(initialResponse?: TimesheetsResponse) {
  const [range, setRange] = useState<DateRangeFilter>("all");
  const [status, setStatus] = useState<"all" | TimesheetStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [rawTimesheets, setRawTimesheets] = useState<Timesheet[]>(initialResponse?.timesheets ?? []);
  const [user, setUser] = useState<User | null>(initialResponse?.user ?? null);
  const [isLoading, setIsLoading] = useState(!initialResponse);
  const [error, setError] = useState<string | null>(null);
  const shouldUseInitialResponse = useRef(Boolean(initialResponse));

  const totalItems = rawTimesheets.length;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);

  const currentPageForView =
    totalPages === 0 ? 1 : Math.min(currentPage, totalPages);
  const currentPageStart = (currentPageForView - 1) * pageSize;
  const paginatedTimesheets = rawTimesheets.slice(
    currentPageStart,
    currentPageStart + pageSize,
  );

  function handleRangeChange(nextRange: DateRangeFilter) {
    setRange(nextRange);
    setCurrentPage(1);
  }

  function handleStatusChange(nextStatus: "all" | TimesheetStatus) {
    setStatus(nextStatus);
    setCurrentPage(1);
  }

  function handlePageChange(nextPage: number) {
    const maxPage = Math.max(totalPages, 1);
    setCurrentPage(Math.min(Math.max(nextPage, 1), maxPage));
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  }

  useEffect(() => {
    if (currentPage !== currentPageForView) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(currentPageForView);
    }
  }, [currentPage, currentPageForView]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (shouldUseInitialResponse.current && range === "all" && status === "all") {
        shouldUseInitialResponse.current = false;
        return;
      }

      shouldUseInitialResponse.current = false;
      setIsLoading(true);
      setError(null);

      try {
        const response = await getTimesheets({ range, status });

        if (!active) {
          return;
        }

        setRawTimesheets(response.timesheets);
        setUser(response.user);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setRawTimesheets([]);
        setUser(null);
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "Unable to load timesheets.",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [range, status]);

  return {
    range,
    status,
    rawTimesheets,
    paginatedTimesheets,
    user,
    isLoading,
    error,
    currentPage: currentPageForView,
    pageSize,
    totalItems,
    totalPages,
    setRange: handleRangeChange,
    setStatus: handleStatusChange,
    setCurrentPage: handlePageChange,
    setPageSize: handlePageSizeChange,
  };
}
