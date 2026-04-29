import { NextResponse } from "next/server";

import { createSession, isValidDemoCredential } from "@lib/auth/session";
import { jsonError, parseJsonBody } from "@lib/http";
import { validateLoginInput } from "@lib/validation";

export async function POST(request: Request) {
  const parsedBody = await parseJsonBody(request);

  if ("response" in parsedBody) {
    return parsedBody.response;
  }

  const body = parsedBody.data as {
    email?: string;
    password?: string;
    remember?: boolean;
  };
  const validation = validateLoginInput(body);

  if (!validation.isValid) {
    return jsonError(400, "Please correct the highlighted fields.", validation.fieldErrors);
  }

  if (!isValidDemoCredential(validation.data.email, validation.data.password)) {
    return jsonError(401, "Invalid email or password.");
  }

  const user = await createSession(Boolean(body.remember));
  return NextResponse.json({ user });
}
