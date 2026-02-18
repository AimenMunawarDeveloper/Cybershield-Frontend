import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const metadata = {
  title: "Telenor",
  description: "Phishing simulation landing page",
};

export default function TelenorFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("Telenor Template.html");

  return (
    <div className="min-h-screen w-full" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </div>
  );
}
