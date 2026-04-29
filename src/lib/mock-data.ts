import type {
  ProjectName,
  TaskType,
  Timesheet,
  TimesheetEntry,
  TimesheetStatus,
  User,
} from "@/types";

export const currentUser: User = {
  id: "user-1",
  name: "John Doe",
  email: "john@example.com",
};

export const mockCredentials = {
  email: currentUser.email,
  password: "password123",
} as const;

function entry(
  id: string,
  day: string,
  taskName: string,
  hours: number,
  description = "Homepage task",
  project: ProjectName = "Project Name",
  type: TaskType = "Feature work",
): TimesheetEntry {
  return {
    id,
    day,
    taskName,
    hours,
    project,
    type,
    description,
  };
}

const generatedWeekStatuses: TimesheetStatus[] = [
  "COMPLETED",
  "COMPLETED",
  "INCOMPLETE",
  "INCOMPLETE",
  "MISSING",
  "COMPLETED",
  "INCOMPLETE",
  "MISSING",
  "COMPLETED",
];

const listDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatTimesheetDateLabel(start: Date, end: Date) {
  const startMonth = listDateFormatter.formatToParts(start).find((part) => part.type === "month")?.value ?? "";
  const endMonth = listDateFormatter.formatToParts(end).find((part) => part.type === "month")?.value ?? "";
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const year = end.getUTCFullYear();

  if (startMonth === endMonth) {
    return `${startDay}-${endDay} ${endMonth}, ${year}`;
  }

  return `${startDay} ${startMonth}-${endDay} ${endMonth}, ${year}`;
}

function generateWorkWeekTimesheets(startDate: string, endDate: string): Timesheet[] {
  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  const limit = new Date(`${endDate}T00:00:00.000Z`);
  const weeks: Timesheet[] = [];

  while (cursor <= limit) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 4);

    const weekNumber = weeks.length + 1;

    weeks.push({
      id: weekNumber === 4 ? "detail-jan-21" : String(weekNumber),
      weekNumber,
      dateLabel: formatTimesheetDateLabel(weekStart, weekEnd),
      rangeStart: toDateOnly(weekStart),
      rangeEnd: toDateOnly(weekEnd),
      totalHours: generatedWeekStatuses[weekNumber - 1] === "MISSING" ? 0 : 40,
      status: generatedWeekStatuses[weekNumber - 1] ?? "MISSING",
      entries: [],
    });

    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  return weeks;
}

const januaryFebruaryTimesheets = generateWorkWeekTimesheets("2024-01-01", "2024-02-29");

export const timesheets: Timesheet[] = [
  ...januaryFebruaryTimesheets,
  {
    id: "10",
    weekNumber: 10,
    dateLabel: "4-8 March, 2024",
    rangeStart: "2024-03-04",
    rangeEnd: "2024-03-08",
    totalHours: 24,
    status: "INCOMPLETE",
    entries: [],
  },
  {
    id: "11",
    weekNumber: 11,
    dateLabel: "11-15 March, 2024",
    rangeStart: "2024-03-11",
    rangeEnd: "2024-03-15",
    totalHours: 0,
    status: "MISSING",
    entries: [],
  },
  {
    id: "12",
    weekNumber: 12,
    dateLabel: "18-22 March, 2024",
    rangeStart: "2024-03-18",
    rangeEnd: "2024-03-22",
    totalHours: 40,
    status: "COMPLETED",
    entries: [],
  },
  {
    id: "13",
    weekNumber: 13,
    dateLabel: "25-29 March, 2024",
    rangeStart: "2024-03-25",
    rangeEnd: "2024-03-29",
    totalHours: 32,
    status: "INCOMPLETE",
    entries: [],
  },
  {
    id: "14",
    weekNumber: 14,
    dateLabel: "1-5 April, 2024",
    rangeStart: "2024-04-01",
    rangeEnd: "2024-04-05",
    totalHours: 0,
    status: "MISSING",
    entries: [],
  },
  {
    id: "15",
    weekNumber: 15,
    dateLabel: "8-12 April, 2024",
    rangeStart: "2024-04-08",
    rangeEnd: "2024-04-12",
    totalHours: 40,
    status: "COMPLETED",
    entries: [],
  },
];

export const detailTimesheet: Timesheet = {
  id: "detail-jan-21",
  weekNumber: 4,
  dateLabel: "22-26 January, 2024",
  rangeStart: "2024-01-22",
  rangeEnd: "2024-01-26",
  totalHours: 40,
  status: "COMPLETED",
  entries: [
    entry("jan21-1", "Jan 22", "Homepage Development", 4),
    entry("jan21-2", "Jan 22", "Homepage Development", 4),
    entry("jan22-1", "Jan 22", "Homepage Development", 4),
    entry("jan22-2", "Jan 23", "Homepage Development", 4),
    entry("jan22-3", "Jan 23", "Homepage Development", 4),
    entry("jan23-1", "Jan 23", "Homepage Development", 4),
    entry("jan23-2", "Jan 24", "Homepage Development", 4),
    entry("jan23-3", "Jan 24", "Homepage Development", 4),
    entry("jan24-1", "Jan 24", "Homepage Development", 4),
    entry("jan24-2", "Jan 25", "Homepage Development", 4),
  ],
};

export const projectOptions: ProjectName[] = [
  "Project Name",
  "Client Redesign",
  "Internal Ops",
];

export const taskTypeOptions: TaskType[] = [
  "Bug fixes",
  "Feature work",
  "Documentation",
  "Meetings",
];
