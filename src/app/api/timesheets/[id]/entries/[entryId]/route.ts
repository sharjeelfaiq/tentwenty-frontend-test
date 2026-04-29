import { NextResponse } from "next/server";

import { requireApiSession } from "@lib/auth/guards";
import { jsonError, jsonTimesheetHourLimitError, parseJsonBody } from "@lib/http";
import { deleteEntry, updateEntry } from "@lib/mock-store";
import { TimesheetHourLimitError, validateTimesheetEntryInput } from "@lib/validation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  let timesheet;

  try {
    timesheet = updateEntry(id, entryId, validation.data);
  } catch (error) {
    if (error instanceof TimesheetHourLimitError) {
      return jsonTimesheetHourLimitError(error);
    }

    throw error;
  }

  if (!timesheet) {
    return jsonError(404, "Entry not found.");
  }

  return NextResponse.json(
    {
      user: session.user,
      timesheet,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
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

  return NextResponse.json(
    {
      user: session.user,
      timesheet,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
