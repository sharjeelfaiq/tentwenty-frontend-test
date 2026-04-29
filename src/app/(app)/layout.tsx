import { requirePageSession } from "@lib/auth/guards";
import { Navbar } from "@components/shared";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageSession();

  return (
    <div className="min-h-screen bg-[var(--app-page)]">
      <Navbar sectionLabel="Timesheets" userName={user.name} />
      {children}
    </div>
  );
}
