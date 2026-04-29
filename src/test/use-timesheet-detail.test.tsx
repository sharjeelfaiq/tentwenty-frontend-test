import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTimesheetDetail } from "@features/timesheets/hooks/use-timesheet-detail";
import {
  readTimesheetsStore,
  writeTimesheetsStore,
} from "@features/timesheets/services/timesheet-storage";

const getTimesheetDetail = vi.fn();
const createTimesheetEntry = vi.fn();
const updateTimesheetEntry = vi.fn();
const deleteTimesheetEntry = vi.fn();
const routerRefresh = vi.fn();

vi.mock("@features/timesheets/services/timesheet-service", () => ({
  getTimesheetDetail: (...args: unknown[]) => getTimesheetDetail(...args),
  createTimesheetEntry: (...args: unknown[]) => createTimesheetEntry(...args),
  updateTimesheetEntry: (...args: unknown[]) => updateTimesheetEntry(...args),
  deleteTimesheetEntry: (...args: unknown[]) => deleteTimesheetEntry(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: routerRefresh,
  }),
}));

const baseTimesheet = {
  id: "detail-jan-21",
  weekNumber: 4,
  dateLabel: "22-26 January, 2024",
  rangeStart: "2024-01-22",
  rangeEnd: "2024-01-26",
  status: "INCOMPLETE" as const,
  totalHours: 20,
  entries: [
    {
      id: "jan22-1",
      day: "Jan 22",
      taskName: "Homepage Development",
      hours: 4,
      project: "Project Name" as const,
      type: "Bug fixes" as const,
      description: "Homepage Development",
    },
  ],
};

describe("useTimesheetDetail", () => {
  beforeEach(() => {
    window.localStorage.clear();
    getTimesheetDetail.mockReset();
    createTimesheetEntry.mockReset();
    updateTimesheetEntry.mockReset();
    deleteTimesheetEntry.mockReset();
    routerRefresh.mockReset();
    vi.stubGlobal("confirm", vi.fn(() => true));
    getTimesheetDetail.mockResolvedValue({
      user: { id: "user-1", name: "John Doe", email: "john@example.com" },
      timesheet: baseTimesheet,
    });
  });

  it("rejects invalid entry values before submit", async () => {
    const { result } = renderHook(() => useTimesheetDetail("detail-jan-21"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.openForAdd("Jan 24");
    });

    act(() => {
      result.current.setFormField("description", "");
      result.current.setFormField("hours", 0);
    });

    await act(async () => {
      await result.current.saveEntry();
    });

    expect(result.current.fieldErrors.description).toBe("Task description is required.");
    expect(result.current.fieldErrors.hours).toBe("Hours must be greater than 0.");
    expect(createTimesheetEntry).not.toHaveBeenCalled();
  });

  it("creates a new entry in create mode", async () => {
    createTimesheetEntry.mockResolvedValue({
      user: { id: "user-1", name: "John Doe", email: "john@example.com" },
      timesheet: baseTimesheet,
    });

    const { result } = renderHook(() => useTimesheetDetail("detail-jan-21"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.openForAdd("Jan 24");
    });

    act(() => {
      result.current.setFormField("description", "Write tests");
      result.current.setFormField("hours", 3);
    });

    await act(async () => {
      await result.current.saveEntry();
    });

    expect(createTimesheetEntry).toHaveBeenCalledWith("detail-jan-21", {
      day: "Jan 24",
      project: "Project Name",
      type: "Bug fixes",
      description: "Write tests",
      hours: 3,
    });
    expect(readTimesheetsStore()?.timesheets[0]).toEqual(baseTimesheet);
    expect(routerRefresh).toHaveBeenCalledOnce();
  });

  it("updates an existing entry in edit mode", async () => {
    updateTimesheetEntry.mockResolvedValue({
      user: { id: "user-1", name: "John Doe", email: "john@example.com" },
      timesheet: baseTimesheet,
    });

    const { result } = renderHook(() => useTimesheetDetail("detail-jan-21"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.openForEdit(baseTimesheet.entries[0]);
    });

    act(() => {
      result.current.setFormField("description", "Updated task");
    });

    await act(async () => {
      await result.current.saveEntry();
    });

    expect(updateTimesheetEntry).toHaveBeenCalledWith("detail-jan-21", {
      entryId: "jan22-1",
      day: "Jan 22",
      project: "Project Name",
      type: "Bug fixes",
      description: "Updated task",
      hours: 4,
    });
    expect(readTimesheetsStore()?.timesheets[0]).toEqual(baseTimesheet);
    expect(routerRefresh).toHaveBeenCalledOnce();
  });

  it("deletes an entry after confirmation", async () => {
    deleteTimesheetEntry.mockResolvedValue({
      user: { id: "user-1", name: "John Doe", email: "john@example.com" },
      timesheet: {
        ...baseTimesheet,
        entries: [],
      },
    });

    const { result } = renderHook(() => useTimesheetDetail("detail-jan-21"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setOpenMenuEntryId("jan22-1");
    });

    await act(async () => {
      await result.current.deleteEntryById("jan22-1");
    });

    expect(window.confirm).toHaveBeenCalledWith("Delete this task?");
    expect(deleteTimesheetEntry).toHaveBeenCalledWith("detail-jan-21", "jan22-1");
    expect(result.current.timesheet?.entries).toEqual([]);
    expect(readTimesheetsStore()?.timesheets[0].entries).toEqual([]);
    expect(result.current.openMenuEntryId).toBe("");
    expect(routerRefresh).toHaveBeenCalledOnce();
  });

  it("hydrates matching detail state from localStorage after mount", async () => {
    const cachedTimesheet = {
      ...baseTimesheet,
      totalHours: 32,
      status: "INCOMPLETE" as const,
    };
    getTimesheetDetail.mockImplementation(() => new Promise(() => undefined));
    writeTimesheetsStore({
      user: { id: "user-1", name: "John Doe", email: "john@example.com" },
      timesheets: [cachedTimesheet],
    });

    const { result } = renderHook(() => useTimesheetDetail("detail-jan-21"));

    await waitFor(() => expect(result.current.timesheet).toEqual(cachedTimesheet));
  });

  it("does not write failed mutations to localStorage", async () => {
    createTimesheetEntry.mockRejectedValue(new Error("Request failed"));

    const { result } = renderHook(() => useTimesheetDetail("detail-jan-21"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const cachedBeforeMutation = readTimesheetsStore();

    act(() => {
      result.current.openForAdd("Jan 24");
    });

    act(() => {
      result.current.setFormField("description", "Write tests");
      result.current.setFormField("hours", 3);
    });

    await act(async () => {
      await result.current.saveEntry();
    });

    expect(readTimesheetsStore()).toEqual(cachedBeforeMutation);
    expect(routerRefresh).not.toHaveBeenCalled();
  });

  it("does not delete when confirmation is cancelled", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));

    const { result } = renderHook(() => useTimesheetDetail("detail-jan-21"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setOpenMenuEntryId("jan22-1");
    });

    await act(async () => {
      await result.current.deleteEntryById("jan22-1");
    });

    expect(window.confirm).toHaveBeenCalledWith("Delete this task?");
    expect(deleteTimesheetEntry).not.toHaveBeenCalled();
    expect(result.current.openMenuEntryId).toBe("");
    expect(routerRefresh).not.toHaveBeenCalled();
  });
});
