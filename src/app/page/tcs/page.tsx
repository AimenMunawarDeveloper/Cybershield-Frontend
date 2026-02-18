import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const metadata = {
  title: "TCS",
  description: "Phishing simulation landing page",
};

export default function TCSFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("TCS Template.html");

  return (
    <div className="min-h-screen w-full" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </div>
  );
}
