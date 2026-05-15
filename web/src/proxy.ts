import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/profile", "/organiser"];
const authRoutes = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // _sid is a non-httpOnly indicator set by the backend alongside the
  // real httpOnly _rt cookie. It carries no sensitive value ("1") and is
  // scoped to "/" so the proxy can read it. _rt itself is scoped to
  // /api/v1/auth and never visible here — by design.
  const session = req.cookies.get("_sid");

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
