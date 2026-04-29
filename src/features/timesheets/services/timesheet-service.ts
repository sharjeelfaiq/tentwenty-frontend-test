import { apiRequest } from "@lib/api";
import type {
  DateRangeFilter,
  ProjectName,
  TaskType,
  Timesheet,
  TimesheetEntry,
  TimesheetStatus,
  User,
} from "@/types";

export interface TimesheetsResponse {
  user: User;
  timesheets: Timesheet[];
}

export interface TimesheetDetailResponse {
  user: User;
  timesheet: Timesheet;
}

export interface CreateEntryPayload {
  day: string;
  project: ProjectName;
  type: TaskType;
  description: string;
  hours: number;
}

export interface UpdateEntryPayload extends CreateEntryPayload {
  entryId: TimesheetEntry["id"];
}

export function getTimesheets(filters: {
  range: DateRangeFilter;
  status: "all" | TimesheetStatus;
}) {
  return apiRequest<TimesheetsResponse>("/api/timesheets", {
    query: {
      range: filters.range,
      status: filters.status,
    },
    cache: "no-store",
  });
}

export function getTimesheetDetail(id: string) {
  return apiRequest<TimesheetDetailResponse>(`/api/timesheets/${id}`, {
    cache: "no-store",
  });
}

export function createTimesheetEntry(id: string, payload: CreateEntryPayload) {
  return apiRequest<TimesheetDetailResponse>(`/api/timesheets/${id}/entries`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTimesheetEntry(id: string, payload: UpdateEntryPayload) {
  return apiRequest<TimesheetDetailResponse>(
    `/api/timesheets/${id}/entries/${payload.entryId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteTimesheetEntry(
  id: string,
  entryId: TimesheetEntry["id"],
) {
  return apiRequest<TimesheetDetailResponse>(
    `/api/timesheets/${id}/entries/${entryId}`,
    {
      method: "DELETE",
    },
  );
}
