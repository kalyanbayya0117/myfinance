import { randomBytes, createHash } from "crypto";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { ApiError, handleApiError, noStoreJson } from "@/lib/errors";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { sanitizeEmail } from "@/lib/sanitize";
import { logger } from "@/lib/logger";
import { sendPasswordResetEmail } from "@/lib/mailer";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const ip = getRequestIp(req);
    const body = await req.json();

    const parsed = schema.safeParse({
      email: sanitizeEmail(body?.email),
    });

    if (!parsed.success) {
      throw new ApiError("Invalid email", 400);
    }

    const limiter = enforceRateLimit(
      `forgot-password:${ip}:${parsed.data.email}`,
      {
        limit: 5,
        windowMs: 15 * 60 * 1000,
      },
    );

    if (!limiter.allowed) {
      throw new ApiError(
        `Too many requests. Try again in ${limiter.retryAfterSec}s`,
        429,
      );
    }

    await connectDB();

    const user = await User.findOne({
      email: parsed.data.email,
      isActive: true,
    });

    if (user) {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      user.resetPasswordTokenHash = tokenHash;
      user.resetPasswordExpiresAt = expiresAt;
      await user.save();

      const origin = process.env.NEXT_PUBLIC_APP_URL;
      const resetUrl = `${origin}/reset-password?token=${rawToken}`;

      await sendPasswordResetEmail({
        to: parsed.data.email,
        name: String(user.name || "User"),
        resetUrl,
        expiresInMinutes: 15,
      });

      logger.info("Password reset requested", {
        userId: String(user._id),
        email: parsed.data.email,
        expiresAt: expiresAt.toISOString(),
      });
    }

    return noStoreJson({
      message:
        "If an account exists with this email, a reset link has been sent.",
    });
  } catch (error) {
    return handleApiError(error, "forgot-password");
  }
}
