import { z } from "zod";
import { compare } from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { ApiError, handleApiError, noStoreJson } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";

const schema = z.object({
  password: z.string().min(1).max(72),
});

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    const ip = getRequestIp(req);

    const limiter = enforceRateLimit(`verify-password:${auth.userId}:${ip}`, {
      limit: 10,
      windowMs: 5 * 60 * 1000,
    });

    if (!limiter.allowed) {
      throw new ApiError(`Too many attempts. Try again in ${limiter.retryAfterSec}s`, 429);
    }

    const body = await req.json();
    const parsed = schema.safeParse({
      password: String(body?.password ?? ""),
    });

    if (!parsed.success) {
      throw new ApiError("Password is required", 400);
    }

    await connectDB();

    const user = await User.findById(auth.userId).lean();
    if (!user || !user.isActive) {
      throw new ApiError("Unauthorized", 401);
    }

    const valid = await compare(parsed.data.password, String(user.passwordHash || ""));
    if (!valid) {
      throw new ApiError("Incorrect password", 401);
    }

    return noStoreJson({ verified: true });
  } catch (error) {
    return handleApiError(error, "verify-password");
  }
}
