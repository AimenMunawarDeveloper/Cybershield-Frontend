import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "PTCL",
  description: "Phishing simulation landing page",
};

export default function PTCLFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("PTCL Template.html");

  return (
    <div className="min-h-screen w-full" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
      <style
        dangerouslySetInnerHTML={{
          __html: `#whatsapp-chat-widget { display: none !important; }
.moveDown100 { padding-top: 220px !important; }`,
        }}
      />
    </div>
  );
}
