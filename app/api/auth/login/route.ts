import { z } from "zod";
import { compare } from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { ApiError, handleApiError, noStoreJson } from "@/lib/errors";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { sanitizeEmail } from "@/lib/sanitize";
import { AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth";
import { logger } from "@/lib/logger";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export async function POST(req: Request) {
  try {
    const ip = getRequestIp(req);
    const body = await req.json();

    const parsed = schema.safeParse({
      email: sanitizeEmail(body?.email),
      password: String(body?.password ?? ""),
    });

    if (!parsed.success) {
      throw new ApiError("Invalid credentials", 400);
    }

    const limiter = enforceRateLimit(`login:${ip}:${parsed.data.email}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!limiter.allowed) {
      throw new ApiError(`Too many login attempts. Try again in ${limiter.retryAfterSec}s`, 429);
    }

    await connectDB();

    const user = await User.findOne({ email: parsed.data.email }).lean();
    if (!user || !user.isActive) {
      throw new ApiError("Invalid credentials", 401);
    }

    const validPassword = await compare(parsed.data.password, String(user.passwordHash || ""));
    if (!validPassword) {
      throw new ApiError("Invalid credentials", 401);
    }

    const token = await signAuthToken({
      userId: String(user._id),
      email: String(user.email),
      name: String(user.name),
      role: user.role === "owner" ? "owner" : "user",
    });

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    const response = noStoreJson({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    logger.info("User logged in", { userId: String(user._id), email: String(user.email) });

    return response;
  } catch (error) {
    return handleApiError(error, "login");
  }
}
