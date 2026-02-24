import { z } from "zod";
import { hash } from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { ApiError, handleApiError, noStoreJson } from "@/lib/errors";
import { requireAuth, requireOwner } from "@/lib/auth";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitize";
import { clearCachePrefix, getCache, setCache } from "@/lib/cache";

const createUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    requireOwner(auth.role);

    await connectDB();

    const cacheKey = `users:list:${auth.userId}`;
    const cachedUsers = getCache<unknown[]>(cacheKey);
    if (cachedUsers) {
      return noStoreJson(cachedUsers);
    }

    const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).lean();
    const formatted = users.map((user) => ({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    }));

    setCache(cacheKey, formatted, 30 * 1000);

    return noStoreJson(formatted);
  } catch (error) {
    return handleApiError(error, "users:get");
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    requireOwner(auth.role);

    const body = await req.json();
    const parsed = createUserSchema.safeParse({
      name: sanitizeText(body?.name),
      email: sanitizeEmail(body?.email),
      password: String(body?.password ?? ""),
    });

    if (!parsed.success) {
      throw new ApiError("Invalid input", 400);
    }

    await connectDB();

    const existing = await User.findOne({ email: parsed.data.email }).lean();
    if (existing) {
      throw new ApiError("Email already in use", 409);
    }

    const passwordHash = await hash(parsed.data.password, 12);

    const user = await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: "user",
      isActive: true,
    });

    clearCachePrefix("users:list:");

    return noStoreJson(
      {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "users:create");
  }
}
