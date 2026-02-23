import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "LinkedIn",
  description: "Phishing simulation landing page",
};

export default function LinkedInFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("Linkedin Template.html");

  return (
    <div className="min-h-screen w-full" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </div>
  );
}
