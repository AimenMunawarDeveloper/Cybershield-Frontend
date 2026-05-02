import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import TopBar from "@/components/TopBar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="m-0 min-h-0 min-w-0 flex-1 bg-[var(--navy-blue)]">
        <TopBar variant="dashboard" showSidebarTrigger={true} />
        <div className="relative min-h-screen w-full min-w-0 overflow-x-hidden rounded-none bg-[var(--navy-blue)] px-3 py-4 transition-colors sm:px-4 md:px-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
