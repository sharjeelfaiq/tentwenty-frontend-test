"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const requestIdRef = useRef(0);
  const hasLoadedFromEffectRef = useRef(false);

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
    setIsLoading(true);
    setCurrentPage(1);
  }

  function handleStatusChange(nextStatus: "all" | TimesheetStatus) {
    setStatus(nextStatus);
    setIsLoading(true);
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

  const loadTimesheets = useCallback(
    async (options: { showLoading?: boolean } = {}) => {
      const { showLoading = true } = options;

      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);
      const requestId = ++requestIdRef.current;

      try {
        const response = await getTimesheets({ range, status });

        if (requestId !== requestIdRef.current) {
          return;
        }

        setRawTimesheets(response.timesheets);
        setUser(response.user);
      } catch (loadError) {
        if (requestId !== requestIdRef.current) {
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
        if (showLoading && requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [range, status],
  );

  useEffect(() => {
    const showLoading = hasLoadedFromEffectRef.current || !initialResponse;
    hasLoadedFromEffectRef.current = true;

    queueMicrotask(() => {
      void loadTimesheets({ showLoading });
    });
  }, [initialResponse, loadTimesheets]);

  useEffect(() => {
    function revalidateVisiblePage() {
      if (document.visibilityState === "visible") {
        void loadTimesheets({ showLoading: false });
      }
    }

    window.addEventListener("focus", revalidateVisiblePage);
    window.addEventListener("pageshow", revalidateVisiblePage);

    return () => {
      window.removeEventListener("focus", revalidateVisiblePage);
      window.removeEventListener("pageshow", revalidateVisiblePage);
    };
  }, [loadTimesheets]);

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
