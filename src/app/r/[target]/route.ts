import { NextRequest, NextResponse } from "next/server";

// Use local www for testing when NEXT_PUBLIC_LANDING_BASE_URL is set (e.g. http://localhost:3001)
const LANDING_BASE = process.env.NEXT_PUBLIC_LANDING_BASE_URL || "https://cybershieldlearningportal.vercel.app";

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
  const url = `${LANDING_BASE}/${encodeURIComponent(slug)}`;
  return NextResponse.redirect(url, 302);
}
