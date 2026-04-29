import { NextResponse } from "next/server";

import { requireApiSession } from "@lib/auth/guards";
import { filterTimesheets } from "@lib/mock-store";
import type { DateRangeFilter, TimesheetStatus } from "@/types";

export async function GET(request: Request) {
  const session = await requireApiSession();

  if ("response" in session) {
    return session.response;
  }

  const { searchParams } = new URL(request.url);
  const range = (searchParams.get("range") as DateRangeFilter | null) ?? "all";
  const status =
    (searchParams.get("status") as TimesheetStatus | "all" | null) ?? "all";

  return NextResponse.json({
    user: session.user,
    timesheets: filterTimesheets({ range, status }),
  });
}
