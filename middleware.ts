import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "myfinance_auth";

const publicRoutes = new Set([
  "/login",
  "/forgot-password",
]);

const publicApiRoutes = new Set([
  "/api/auth/login",
  "/api/auth/bootstrap-owner",
]);

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function isTokenValid(token: string) {
  const secret = getSecret();
  if (!secret) return false;

  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value ?? "";
  const validToken = token ? await isTokenValid(token) : false;

  if (pathname.startsWith("/api")) {
    if (publicApiRoutes.has(pathname)) {
      return NextResponse.next();
    }

    if (!validToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.next();
  }

  if (publicRoutes.has(pathname)) {
    if (validToken && (pathname === "/login" || pathname === "/forgot-password")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  }

  if (!validToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
