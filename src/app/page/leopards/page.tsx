import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const metadata = {
  title: "Leopards",
  description: "Phishing simulation landing page",
};

export default function LeopardsFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("Leopards Template.html");

  return (
    <div className="min-h-screen w-full" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </div>
  );
}
