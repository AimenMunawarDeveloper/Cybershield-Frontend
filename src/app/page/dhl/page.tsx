import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "DHL",
  description: "Phishing simulation landing page",
};

export default function DHLFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("DHL Template.html");

  return (
    <div className="min-h-screen w-full flex flex-col" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div className="flex-1 flex flex-col min-h-0" dangerouslySetInnerHTML={{ __html: bodyContent }} />
      <style dangerouslySetInnerHTML={{ __html: "#kt_login { min-height: 100%; }" }} />
    </div>
  );
}
