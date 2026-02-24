import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { ApiError } from "@/lib/errors";

export type UserRole = "owner" | "user";

export type AuthPayload = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
};

export const AUTH_COOKIE_NAME = "myfinance_auth";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: AuthPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());

  return {
    userId: String(payload.userId ?? ""),
    email: String(payload.email ?? ""),
    name: String(payload.name ?? ""),
    role: (String(payload.role ?? "user") as UserRole),
  } as AuthPayload;
}

function parseCookieFromRequest(req: Request, name: string) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const parts = cookieHeader.split(";").map((part) => part.trim());

  for (const item of parts) {
    const [key, ...rest] = item.split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return "";
}

export async function getAuthFromRequest(req: Request) {
  const token = parseCookieFromRequest(req, AUTH_COOKIE_NAME);
  if (!token) return null;

  try {
    return await verifyAuthToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request) {
  const auth = await getAuthFromRequest(req);
  if (!auth?.userId) {
    throw new ApiError("Unauthorized", 401);
  }

  return auth;
}

export function requireOwner(role: UserRole) {
  if (role !== "owner") {
    throw new ApiError("Forbidden", 403);
  }
}

export async function getAuthFromServerCookie() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return await verifyAuthToken(token);
  } catch {
    return null;
  }
}
