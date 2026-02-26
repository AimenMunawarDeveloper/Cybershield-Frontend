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
      <SidebarInset className="m-0">
        <TopBar variant="dashboard" showSidebarTrigger={true} />
        <div className="bg-[var(--navy-blue)] min-h-screen relative overflow-hidden rounded-none">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
