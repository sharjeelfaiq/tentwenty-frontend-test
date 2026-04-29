import { NextResponse } from "next/server";

import { requireApiSession } from "@lib/auth/guards";
import { jsonError, parseJsonBody } from "@lib/http";
import { createEntry } from "@lib/mock-store";
import { validateTimesheetEntryInput } from "@lib/validation";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const session = await requireApiSession();

  if ("response" in session) {
    return session.response;
  }

  const { id } = await context.params;
  const parsedBody = await parseJsonBody(request);

  if ("response" in parsedBody) {
    return parsedBody.response;
  }

  const body = parsedBody.data as Record<string, unknown>;
  const validation = validateTimesheetEntryInput(body);

  if (!validation.isValid) {
    return jsonError(400, "Please correct the highlighted fields.", validation.fieldErrors);
  }

  const timesheet = createEntry(id, validation.data);

  if (!timesheet) {
    return jsonError(404, "Timesheet not found.");
  }

  return NextResponse.json({
    user: session.user,
    timesheet,
  });
}
