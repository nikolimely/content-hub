import { Sidebar } from "@/components/sidebar";
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
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: "#F8FAFC", color: "#0F172A" }}>
        {children}
      </main>
    </div>
  );
}
