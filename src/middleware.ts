import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Public route prefixes that don't require authentication.
 */
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/onboarding", "/onboarding-test", "/proposal", "/api", "/auth", "/terms", "/privacy"];

function isPublicRoute(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_ROUTES.some(
    (route) => route !== "/" && (pathname === route || pathname.startsWith(route + "/"))
  );
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options: _options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — this is critical for keeping auth tokens alive
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError && process.env.NODE_ENV === "development") {
    console.error("[middleware] getUser error:", authError.message);
  }

  const { pathname } = request.nextUrl;

  // If user is NOT authenticated and trying to access a protected route → redirect to login
  if (!user && !isPublicRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    const redirectResponse = NextResponse.redirect(url);
    // Copy refreshed auth cookies to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  // If user IS authenticated and visiting login → redirect to dashboard
  // Note: /signup redirects to /onboarding client-side, so we only gate /login
  // to avoid trapping users who need to redo onboarding
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    const redirectResponse = NextResponse.redirect(url);
    // Copy refreshed auth cookies to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
