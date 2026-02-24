import { z } from "zod";
import { hash } from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { ApiError, handleApiError, noStoreJson } from "@/lib/errors";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitize";
import { logger } from "@/lib/logger";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  bootstrapSecret: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const ip = getRequestIp(req);
    const limiter = enforceRateLimit(`bootstrap-owner:${ip}`, {
      limit: 3,
      windowMs: 10 * 60 * 1000,
    });

    if (!limiter.allowed) {
      throw new ApiError(`Too many requests. Try again in ${limiter.retryAfterSec}s`, 429);
    }

    const body = await req.json();
    const parsed = schema.safeParse({
      name: sanitizeText(body?.name),
      email: sanitizeEmail(body?.email),
      password: String(body?.password ?? ""),
      bootstrapSecret: String(body?.bootstrapSecret ?? ""),
    });

    if (!parsed.success) {
      throw new ApiError("Invalid input", 400);
    }

    if (!process.env.OWNER_BOOTSTRAP_SECRET) {
      throw new ApiError("Owner bootstrap is disabled", 403);
    }

    if (parsed.data.bootstrapSecret !== process.env.OWNER_BOOTSTRAP_SECRET) {
      throw new ApiError("Invalid bootstrap secret", 403);
    }

    await connectDB();

    const ownerExists = await User.findOne({ role: "owner" }).lean();
    if (ownerExists) {
      throw new ApiError("Owner already exists", 409);
    }

    const existingEmail = await User.findOne({ email: parsed.data.email }).lean();
    if (existingEmail) {
      throw new ApiError("Email already in use", 409);
    }

    const passwordHash = await hash(parsed.data.password, 12);

    await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: "owner",
      isActive: true,
    });

    logger.info("Owner bootstrap completed", { email: parsed.data.email });

    return noStoreJson({ message: "Owner created successfully" }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "bootstrap-owner");
  }
}
