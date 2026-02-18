import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const metadata = {
  title: "PayPal",
  description: "Phishing simulation landing page",
};

export default function PayPalFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("Paypal Template.html");

  return (
    <div className="min-h-screen w-full bg-white" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div id="paypal-body-content" dangerouslySetInnerHTML={{ __html: bodyContent }} />
      <style
        dangerouslySetInnerHTML={{
          __html: `body { background: #fff !important; }
#paypal-body-content { background: #fff !important; }
#paypal-body-content > * { background: #fff !important; }`,
        }}
      />
    </div>
  );
}
