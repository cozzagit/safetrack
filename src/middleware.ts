import { NextRequest, NextResponse } from "next/server";

// Public routes that don't require authentication
const PUBLIC_PATHS = new Set(["/", "/login", "/register", "/reset-password", "/terms", "/privacy"]);
// API routes handle their own auth and return proper 401 JSON — don't redirect them to /login
const PUBLIC_PREFIXES = ["/api/", "/_next", "/favicon.ico", "/robots.txt", "/sitemap.xml"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths and static assets
  if (
    PUBLIC_PATHS.has(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.next();
  }

  // Check for better-auth session cookie
  // better-auth sets a cookie named "better-auth.session_token" by default
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ??
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  // If no session token, redirect to login
  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists — let the request through
  // The actual session validation happens in server components / API routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
