import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar email={session?.email} />
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "#F8FAFC", color: "#0F172A" }}>
        <DashboardHeader email={session?.email} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
