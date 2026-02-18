import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const metadata = {
  title: "SSGC",
  description: "Phishing simulation landing page",
};

export default function SSGCFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("SSGC Template.html");

  return (
    <div className="min-h-screen w-full" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </div>
  );
}
