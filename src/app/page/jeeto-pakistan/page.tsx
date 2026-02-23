import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Jeeto Pakistan",
  description: "Phishing simulation landing page",
};

export default function JeetoPakistanFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("Jeeto Pakistan Template.html");

  return (
    <div className="min-h-screen w-full" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </div>
  );
}
