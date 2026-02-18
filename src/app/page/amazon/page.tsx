import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const metadata = {
  title: "Amazon",
  description: "Phishing simulation landing page",
};

export default function AmazonFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("Amazon Template.html");

  return (
    <div className="min-h-screen w-full" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </div>
  );
}
