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
      <SidebarInset>
        <TopBar variant="dashboard" showSidebarTrigger={true} />
        <div className="bg-[var(--light-blue)] min-h-screen">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
