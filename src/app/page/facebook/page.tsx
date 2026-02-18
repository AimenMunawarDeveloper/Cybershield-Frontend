import { getFakeLandingContent } from "@/lib/fakeLandingPage";

export const metadata = {
  title: "Facebook",
  description: "Phishing simulation landing page",
};

export default function FacebookFakePage() {
  const { headAssets, bodyContent } = getFakeLandingContent("Facebook Template.html");

  return (
    <div className="min-h-screen w-full" suppressHydrationWarning>
      <div dangerouslySetInnerHTML={{ __html: headAssets }} />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
      <style
        dangerouslySetInnerHTML={{
          __html: `/* Same styling for email and password inputs */
#facebook ._8icy ._6lux ._55r1._6luy,
#facebook ._8icy ._6lux input.inputtext._6luy,
#facebook ._8icy ._6lux input._9npi,
#facebook ._8icy #passContainer input {
  height: auto !important;
  min-height: 48px !important;
  padding: 14px 16px !important;
  line-height: 1.34 !important;
  box-sizing: border-box !important;
  float: none !important;
  width: 330px !important;
  display: block !important;
}
/* Password row container: match email row layout, consistent spacing */
#facebook ._8icy ._6lux {
  margin-bottom: 12px !important;
  display: block !important;
}
#facebook ._8icy #passContainer {
  display: block !important;
  width: 330px !important;
  padding: 0 !important;
}`,
        }}
      />
    </div>
  );
}
