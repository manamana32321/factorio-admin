import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { requireSession } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-auto bg-zinc-950">
        <div className="flex items-center border-b border-zinc-800 px-4 py-2">
          <SidebarTrigger className="text-zinc-400" />
        </div>
        <div className="p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
