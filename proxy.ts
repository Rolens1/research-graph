import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@insforge/sdk/ssr/middleware";

const insforgeUrl =
  process.env.NEXT_PUBLIC_INSFORGE_URL || "https://pprn26i7.us-east.insforge.app";
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || "";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  // 1. Maintain SSR session token freshness
  let accessToken: string | null = null;
  try {
    const sessionResult = await updateSession({
      baseUrl: insforgeUrl,
      anonKey: insforgeAnonKey || undefined,
      requestCookies: request.cookies,
      responseCookies: response.cookies,
    });
    accessToken = sessionResult.accessToken;
  } catch (err) {
    console.error("Middleware session update error:", err);
  }

  const isAuthenticated = Boolean(accessToken);

  // 2. AC-5: Redirect authenticated users away from /login to /workspace
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/workspace", request.url));
  }

  // 3. AC-4: Guard protected surfaces
  const isProtectedApi = pathname.startsWith("/api/research");
  const isProtectedPage = pathname.startsWith("/workspace");

  if (!isAuthenticated) {
    if (isProtectedApi) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Authentication required to access investigation research resources.",
        },
        { status: 401 }
      );
    }

    if (isProtectedPage) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/workspace/:path*",
    "/api/research/:path*",
    "/login",
  ],
};

export { proxy as middleware };

