import { projectOptions, taskTypeOptions } from "@lib/mock-data";
import type { FieldErrors, LoginField, ProjectName, TaskType, TimesheetEntry, TimesheetEntryField } from "@/types";

export interface LoginInput {
  email: string;
  password: string;
}

export interface TimesheetEntryInput {
  day: string;
  project: ProjectName;
  type: TaskType;
  description: string;
  hours: number;
}

interface ValidationResult<TField extends string, TValue> {
  data: TValue;
  fieldErrors: FieldErrors<TField>;
  isValid: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_HOURS = 24;
const MAX_TIMESHEET_HOURS = 40;
export const TIMESHEET_HOUR_LIMIT_EXCEEDED = "HOUR_LIMIT_EXCEEDED";

export const validationLimits = {
  minPasswordLength: MIN_PASSWORD_LENGTH,
  maxHours: MAX_HOURS,
  maxTimesheetHours: MAX_TIMESHEET_HOURS,
};

export interface TimesheetHoursLimitResult {
  isValid: boolean;
  max: number;
  currentTotal: number;
  projectedTotal: number;
}

export class TimesheetHourLimitError extends Error {
  readonly code = TIMESHEET_HOUR_LIMIT_EXCEEDED;

  constructor(readonly result: TimesheetHoursLimitResult) {
    super(`Timesheet total cannot exceed ${result.max} hours.`);
    this.name = "TimesheetHourLimitError";
  }
}

export function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateLoginInput(input: Partial<LoginInput>): ValidationResult<LoginField, LoginInput> {
  const data: LoginInput = {
    email: normalizeString(input.email),
    password: typeof input.password === "string" ? input.password : "",
  };

  const fieldErrors: FieldErrors<LoginField> = {};

  if (!data.email) {
    fieldErrors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(data.email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (!data.password) {
    fieldErrors.password = "Password is required.";
  } else if (data.password.length < MIN_PASSWORD_LENGTH) {
    fieldErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return {
    data,
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  };
}

export function validateTimesheetEntryInput(
  input: Partial<TimesheetEntryInput>,
): ValidationResult<TimesheetEntryField, TimesheetEntryInput> {
  const parsedHours =
    typeof input.hours === "number" ? input.hours : Number(typeof input.hours === "string" ? input.hours : NaN);

  const data: TimesheetEntryInput = {
    day: normalizeString(input.day),
    project: input.project as ProjectName,
    type: input.type as TaskType,
    description: normalizeString(input.description),
    hours: parsedHours,
  };

  const fieldErrors: FieldErrors<TimesheetEntryField> = {};

  if (!data.day) {
    fieldErrors.day = "Day is required.";
  }

  if (!projectOptions.includes(data.project)) {
    fieldErrors.project = "Select a valid project.";
  }

  if (!taskTypeOptions.includes(data.type)) {
    fieldErrors.type = "Select a valid work type.";
  }

  if (!data.description) {
    fieldErrors.description = "Task description is required.";
  }

  if (!Number.isFinite(data.hours)) {
    fieldErrors.hours = "Hours are required.";
  } else if (data.hours <= 0) {
    fieldErrors.hours = "Hours must be greater than 0.";
  } else if (data.hours > MAX_HOURS) {
    fieldErrors.hours = `Hours cannot exceed ${MAX_HOURS}.`;
  }

  return {
    data,
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  };
}

export function validateTimesheetHoursLimit(
  entries: Pick<TimesheetEntry, "id" | "hours">[],
  incomingHours: number,
  options: { excludeEntryId?: string } = {},
): TimesheetHoursLimitResult {
  const currentTotal = entries
    .filter((entry) => entry.id !== options.excludeEntryId)
    .reduce((sum, entry) => sum + entry.hours, 0);
  const projectedTotal = currentTotal + incomingHours;

  return {
    isValid: projectedTotal <= MAX_TIMESHEET_HOURS,
    max: MAX_TIMESHEET_HOURS,
    currentTotal,
    projectedTotal,
  };
}

export function assertTimesheetHoursLimit(
  entries: Pick<TimesheetEntry, "id" | "hours">[],
  incomingHours: number,
  options: { excludeEntryId?: string } = {},
) {
  const result = validateTimesheetHoursLimit(entries, incomingHours, options);

  if (!result.isValid) {
    throw new TimesheetHourLimitError(result);
  }
}
