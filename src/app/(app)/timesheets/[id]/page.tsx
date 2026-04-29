import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TimesheetDetailPage } from "@features/timesheets";
import { requirePageSession } from "@lib/auth/guards";
import { getTimesheetById } from "@lib/mock-store";

interface TimesheetDetailRoutePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TimesheetDetailRoutePageProps): Promise<Metadata> {
  const { id } = await params;
  const timesheet = getTimesheetById(id);

  return {
    title: timesheet ? `Week ${timesheet.weekNumber} Timesheet` : "Timesheet",
    description: timesheet ? `Timesheet for ${timesheet.dateLabel}.` : "Timesheet detail view.",
  };
}

export default async function TimesheetDetailRoutePage({ params }: TimesheetDetailRoutePageProps) {
  const { id } = await params;
  const user = await requirePageSession();
  const timesheet = getTimesheetById(id);

  if (!timesheet) {
    notFound();
  }

  return <TimesheetDetailPage id={id} initialResponse={{ user, timesheet }} />;
}
