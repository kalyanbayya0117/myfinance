import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { noStoreJson } from "@/lib/errors";

export async function POST() {
  const response = noStoreJson({ message: "Logged out" });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
