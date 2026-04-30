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

    expect(createTimesheetEntry).not.toHaveBeenCalled();
    expect(result.current.timesheet?.entries.at(-1)?.description).toBe("Write tests");
    expect(result.current.timesheet?.entries.at(-1)?.taskName).toBe("Write tests");
    expect(readTimesheetsStore()?.timesheets[0]).toEqual(result.current.timesheet);
    expect(routerRefresh).not.toHaveBeenCalled();
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

    expect(updateTimesheetEntry).not.toHaveBeenCalled();
    expect(result.current.timesheet?.entries[0].description).toBe("Updated task");
    expect(result.current.timesheet?.entries[0].taskName).toBe("Updated task");
    expect(readTimesheetsStore()?.timesheets[0]).toEqual(result.current.timesheet);
    expect(routerRefresh).not.toHaveBeenCalled();
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
    expect(deleteTimesheetEntry).not.toHaveBeenCalled();
    expect(result.current.timesheet?.entries).toEqual([]);
    expect(readTimesheetsStore()?.timesheets[0].entries).toEqual([]);
    expect(result.current.openMenuEntryId).toBe("");
    expect(routerRefresh).not.toHaveBeenCalled();
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

  it("does not write mutations that exceed 40 hours to localStorage", async () => {
    const fullTimesheet = {
      ...baseTimesheet,
      status: "COMPLETED" as const,
      totalHours: 40,
      entries: [
        {
          ...baseTimesheet.entries[0],
          hours: 40,
        },
      ],
    };

    writeTimesheetsStore({
      user: { id: "user-1", name: "John Doe", email: "john@example.com" },
      timesheets: [fullTimesheet],
    });

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
    expect(result.current.fieldErrors.hours).toBe("Timesheet total cannot exceed 40 hours.");
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
