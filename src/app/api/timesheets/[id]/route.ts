import { NextResponse } from "next/server";

import { requireApiSession } from "@lib/auth/guards";
import { jsonError } from "@lib/http";
import { getTimesheetById } from "@lib/mock-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const session = await requireApiSession();

  if ("response" in session) {
    return session.response;
  }

  const { id } = await context.params;
  const resolvedTimesheet = getTimesheetById(id);

  if (!resolvedTimesheet) {
    return jsonError(404, "Timesheet not found.");
  }

  return NextResponse.json(
    {
      user: session.user,
      timesheet: resolvedTimesheet,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
