import { redirect } from "next/navigation";

import { getSessionUser } from "@lib/auth/session";
import { jsonError } from "@lib/http";

export async function requirePageSession() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireApiSession() {
  const user = await getSessionUser();
  return user ? { user } : { response: jsonError(401, "Authentication required.") };
}
