import { NextResponse } from "next/server";

import type { ApiErrorPayload, FieldErrors } from "@/types";

export function jsonError<TField extends string>(
  status: number,
  error: string,
  fieldErrors?: FieldErrors<TField>,
) {
  const payload: ApiErrorPayload<TField> = { error };

  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    payload.fieldErrors = fieldErrors;
  }

  return NextResponse.json(payload, { status });
}

export async function parseJsonBody(request: Request) {
  try {
    return { data: (await request.json()) as unknown };
  } catch {
    return { response: jsonError(400, "Request body must be valid JSON.") };
  }
}
