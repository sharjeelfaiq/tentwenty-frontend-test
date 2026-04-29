import type { Metadata } from "next";

import { TimesheetsPage } from "@features/timesheets";
import { requirePageSession } from "@lib/auth/guards";
import { filterTimesheets } from "@lib/mock-store";

export const metadata: Metadata = {
  title: "Timesheets",
  description: "Review and manage weekly timesheets.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TimesheetsRoutePage() {
  const user = await requirePageSession();

  return (
    <TimesheetsPage
      initialResponse={{
        user,
        timesheets: filterTimesheets({ range: "all", status: "all" }),
      }}
    />
  );
}
