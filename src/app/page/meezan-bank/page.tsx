import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const metadata = {
  title: "Meezan Bank",
  description: "Phishing simulation landing page",
};

export default function MeezanBankFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("Meezan Bank Template.html");

  return (
    <div className="min-h-screen w-full" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </div>
  );
}
