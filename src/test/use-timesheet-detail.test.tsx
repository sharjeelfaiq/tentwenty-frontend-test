import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTimesheetDetail } from "@features/timesheets/hooks/use-timesheet-detail";

const getTimesheetDetail = vi.fn();
const createTimesheetEntry = vi.fn();
const updateTimesheetEntry = vi.fn();
const deleteTimesheetEntry = vi.fn();

vi.mock("@features/timesheets/services/timesheet-service", () => ({
  getTimesheetDetail: (...args: unknown[]) => getTimesheetDetail(...args),
  createTimesheetEntry: (...args: unknown[]) => createTimesheetEntry(...args),
  updateTimesheetEntry: (...args: unknown[]) => updateTimesheetEntry(...args),
  deleteTimesheetEntry: (...args: unknown[]) => deleteTimesheetEntry(...args),
}));

const baseTimesheet = {
  id: "detail-jan-21",
  weekNumber: 3,
  dateLabel: "21 - 26 January, 2024",
  rangeStart: "2024-01-21",
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
    getTimesheetDetail.mockReset();
    createTimesheetEntry.mockReset();
    updateTimesheetEntry.mockReset();
    deleteTimesheetEntry.mockReset();
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
    expect(result.current.openMenuEntryId).toBe("");
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
  });
});
