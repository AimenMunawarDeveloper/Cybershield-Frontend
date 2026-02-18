import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const metadata = {
  title: "UBL",
  description: "Phishing simulation landing page",
};

export default function UBLFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("UBL Template.html");

  return (
    <div className="min-h-screen w-full" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </div>
  );
}
