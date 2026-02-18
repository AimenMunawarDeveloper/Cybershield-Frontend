"use client";

import { usePathname } from "next/navigation";
import TopBar from "./TopBar";
import Chatbot from "./Chatbot";

/** All /page/* routes are fake landing pages - hide TopBar and Chatbot */
function isFakeLandingPage(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.startsWith("/page/");
}

export default function LayoutChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideChrome = isFakeLandingPage(pathname);

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <TopBar />
      {children}
      <Chatbot />
    </>
  );
}
