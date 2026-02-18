import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const metadata = {
  title: "K-Electric",
  description: "Phishing simulation landing page",
};

export default function KEFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("KE Template.html");

  return (
    <div className="min-h-screen w-full" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </div>
  );
}
