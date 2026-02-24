import { z } from "zod";
import { compare, hash } from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { ApiError, handleApiError, noStoreJson } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";

const schema = z.object({
  currentPassword: z.string().min(8).max(72),
  newPassword: z.string().min(8).max(72),
});

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();

    const parsed = schema.safeParse({
      currentPassword: String(body?.currentPassword ?? ""),
      newPassword: String(body?.newPassword ?? ""),
    });

    if (!parsed.success) {
      throw new ApiError("Invalid input", 400);
    }

    if (parsed.data.currentPassword === parsed.data.newPassword) {
      throw new ApiError("New password must be different", 400);
    }

    await connectDB();

    const user = await User.findById(auth.userId);
    if (!user || !user.isActive) {
      throw new ApiError("Unauthorized", 401);
    }

    const matches = await compare(parsed.data.currentPassword, String(user.passwordHash));
    if (!matches) {
      throw new ApiError("Current password is incorrect", 401);
    }

    user.passwordHash = await hash(parsed.data.newPassword, 12);
    await user.save();

    return noStoreJson({ message: "Password changed successfully" });
  } catch (error) {
    return handleApiError(error, "change-password");
  }
}
