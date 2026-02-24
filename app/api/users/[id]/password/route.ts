import mongoose from "mongoose";
import { z } from "zod";
import { hash } from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { ApiError, handleApiError, noStoreJson } from "@/lib/errors";
import { requireAuth, requireOwner } from "@/lib/auth";

const schema = z.object({
  newPassword: z.string().min(8).max(72),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth(req);
    requireOwner(auth.role);

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid user id", 400);
    }

    const body = await req.json();
    const parsed = schema.safeParse({
      newPassword: String(body?.newPassword ?? ""),
    });

    if (!parsed.success) {
      throw new ApiError("Invalid input", 400);
    }

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    user.passwordHash = await hash(parsed.data.newPassword, 12);
    await user.save();

    return noStoreJson({ message: "Password updated successfully" });
  } catch (error) {
    return handleApiError(error, "users:update-password");
  }
}
