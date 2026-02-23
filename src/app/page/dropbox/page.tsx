import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dropbox",
  description: "Phishing simulation landing page",
};

export default function DropboxFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("Dropbox Template.html");

  return (
    <div className="min-h-screen w-full" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </div>
  );
}
