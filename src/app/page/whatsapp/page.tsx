import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const metadata = {
  title: "WhatsApp",
  description: "Phishing simulation landing page",
};

export default function WhatsAppFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("Whatsapp Template.html");

  return (
    <div className="min-h-screen w-full" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </div>
  );
}
