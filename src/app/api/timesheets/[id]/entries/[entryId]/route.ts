import { NextResponse } from "next/server";

import { requireApiSession } from "@lib/auth/guards";
import { jsonError, parseJsonBody } from "@lib/http";
import { deleteEntry, updateEntry } from "@lib/mock-store";
import { validateTimesheetEntryInput } from "@lib/validation";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string; entryId: string }>;
  },
) {
  const session = await requireApiSession();

  if ("response" in session) {
    return session.response;
  }

  const { id, entryId } = await context.params;
  const parsedBody = await parseJsonBody(request);

  if ("response" in parsedBody) {
    return parsedBody.response;
  }

  const body = parsedBody.data as Record<string, unknown>;
  const validation = validateTimesheetEntryInput(body);

  if (!validation.isValid) {
    return jsonError(400, "Please correct the highlighted fields.", validation.fieldErrors);
  }

  const timesheet = updateEntry(id, entryId, validation.data);

  if (!timesheet) {
    return jsonError(404, "Entry not found.");
  }

  return NextResponse.json({
    user: session.user,
    timesheet,
  });
}

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{ id: string; entryId: string }>;
  },
) {
  const session = await requireApiSession();

  if ("response" in session) {
    return session.response;
  }

  const { id, entryId } = await context.params;
  const timesheet = deleteEntry(id, entryId);

  if (!timesheet) {
    return jsonError(404, "Entry not found.");
  }

  return NextResponse.json({
    user: session.user,
    timesheet,
  });
}
