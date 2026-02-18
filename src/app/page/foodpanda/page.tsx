import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const metadata = {
  title: "Foodpanda",
  description: "Phishing simulation landing page",
};

export default function FoodpandaFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("Foodpanda Template.html");

  return (
    <div className="min-h-screen w-full" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </div>
  );
}
