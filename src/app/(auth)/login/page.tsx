import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSessionUser } from "@lib/auth/session";
import { LoginScreen } from "@features/auth";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to ticktock timesheet management.",
};

export default async function LoginPage() {
  const user = await getSessionUser();

  if (user) {
    redirect("/timesheets");
  }

  return <LoginScreen />;
}
