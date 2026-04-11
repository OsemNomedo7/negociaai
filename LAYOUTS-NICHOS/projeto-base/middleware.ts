import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.nextUrl.hostname;

  // ── Custom domain routing ───────────────────────────────────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const appHostname = appUrl ? new URL(appUrl).hostname : "";

  const isCustomDomain =
    appHostname &&
    hostname !== appHostname &&
    !hostname.includes("localhost") &&
    !hostname.endsWith(".vercel.app");

  if (isCustomDomain && !pathname.startsWith("/api/") && !pathname.startsWith("/_next/")) {
    try {
      const res = await fetch(`${appUrl}/api/resolve-domain?domain=${hostname}`);
      if (res.ok) {
        const { slug } = await res.json() as { slug: string | null };
        if (slug) {
          const url = req.nextUrl.clone();
          url.pathname = `/c/${slug}`;
          return NextResponse.rewrite(url);
        }
      }
    } catch {
      // fallthrough → 404
    }
    return new NextResponse("Not Found", { status: 404 });
  }

  // ── Admin route protection ──────────────────────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    const payload = await verifyToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL("/admin/login", req.url));
      response.cookies.set("admin_token", "", { maxAge: 0 });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
