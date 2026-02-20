import { NextRequest, NextResponse } from "next/server";

const LANDING_BASE = "https://www-website.vercel.app";

/**
 * Redirect /r/[target] to the fake landing page.
 * Email/messages show benign-looking URLs; clicks hit this route and redirect to the actual landing page.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ target: string }> }
) {
  const { target: slug } = await params;
  if (!slug || typeof slug !== "string") {
    return NextResponse.redirect(new URL("/", LANDING_BASE), 302);
  }
  const url = `${LANDING_BASE}/login/${encodeURIComponent(slug)}`;
  return NextResponse.redirect(url, 302);
}
