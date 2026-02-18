import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const metadata = {
  title: "Jazz",
  description: "Phishing simulation landing page",
};

export default function JazzFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("Jazz Template.html");

  return (
    <div className="min-h-screen w-full" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </div>
  );
}
