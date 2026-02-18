import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const metadata = {
  title: "Microsoft",
  description: "Phishing simulation landing page",
};

export default function MicrosoftFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("Microsoft Template.html");

  return (
    <div className="min-h-screen w-full" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </div>
  );
}
