export type TimesheetStatus = "COMPLETED" | "INCOMPLETE" | "MISSING";

export type TaskType = "Bug fixes" | "Feature work" | "Documentation" | "Meetings";

export type ProjectName = "Project Name" | "Client Redesign" | "Internal Ops";

export type DateRangeFilter = "all" | "january" | "jan-1-19" | "jan-20-feb-2";

export interface User {
  id: string;
  name: string;
  email: string;
}

export type FieldErrors<TField extends string = string> = Partial<Record<TField, string>>;

export interface ApiErrorPayload<TField extends string = string> {
  error: string;
  fieldErrors?: FieldErrors<TField>;
}

export interface TimesheetEntry {
  id: string;
  day: string;
  taskName: string;
  hours: number;
  project: ProjectName;
  type: TaskType;
  description: string;
}

export interface Timesheet {
  id: string;
  weekNumber: number;
  dateLabel: string;
  rangeStart: string;
  rangeEnd: string;
  status: TimesheetStatus;
  totalHours: number;
  entries: TimesheetEntry[];
}

export type LoginField = "email" | "password";
export type TimesheetEntryField = "day" | "project" | "type" | "description" | "hours";
export type EntryModalMode = "create" | "edit";
