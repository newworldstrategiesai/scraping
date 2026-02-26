import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/middleware";
import { isAdminEmail } from "@/lib/auth";

const protectedPaths = ["/dashboard", "/settings", "/actions", "/jobs", "/lists"];

function isProtected(pathname: string) {
  return protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!isProtected(request.nextUrl.pathname)) {
    return response;
  }

  const supabase = createClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  if (!isAdminEmail(user.email)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/actions/:path*",
    "/jobs/:path*",
    "/lists/:path*",
  ],
};
