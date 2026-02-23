import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Prize Bonds",
  description: "Phishing simulation landing page",
};

export default function PrizeBondsFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("Prize Bonds Template.html");

  return (
    <div className="min-h-screen w-full" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </div>
  );
}
