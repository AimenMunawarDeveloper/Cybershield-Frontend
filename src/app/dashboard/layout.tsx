import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Bell } from "lucide-react";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <div className="flex justify-between items-center my-4 px-4 gap-4 h-16">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <Image
              src="/images/CyberShield_logo_Final-removebg.png"
              alt="CyberShield Logo"
              width={200}
              height={80}
              className="h-20 w-full object-contain"
            />
          </div>
          <div className="flex items-center gap-4">
            <SignedOut>
              <Link
                href="/sign-in"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="bg-navy-blue text-white rounded-md font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer flex items-center hover:bg-[#0f1a2a] transition-colors"
              >
                Sign Up
              </Link>
            </SignedOut>
            <SignedIn>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="h-5 w-5 text-gray-600" />
              </button>
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                    userButtonPopoverCard: "shadow-lg border border-gray-200",
                    userButtonPopoverActionButton: "hover:bg-gray-50",
                    userButtonPopoverActionButtonText: "text-gray-700",
                    userButtonPopoverFooter: "hidden",
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
        <div className="bg-[var(--light-blue)] min-h-screen">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
