import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { handleApiError, noStoreJson } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitize";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
});

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    await connectDB();

    const user = await User.findById(auth.userId).lean();
    if (!user || !user.isActive) {
      return noStoreJson({ message: "Unauthorized" }, { status: 401 });
    }

    return noStoreJson({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return handleApiError(error, "me");
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();

    const parsed = updateProfileSchema.safeParse({
      name: sanitizeText(body?.name),
      email: sanitizeEmail(body?.email),
    });

    if (!parsed.success) {
      return noStoreJson({ message: "Invalid profile details" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(auth.userId);
    if (!user || !user.isActive) {
      return noStoreJson({ message: "Unauthorized" }, { status: 401 });
    }

    const duplicate = await User.findOne({
      email: parsed.data.email,
      _id: { $ne: user._id },
    }).lean();

    if (duplicate) {
      return noStoreJson({ message: "Email already in use" }, { status: 409 });
    }

    user.name = parsed.data.name;
    user.email = parsed.data.email;
    await user.save();

    return noStoreJson({
      message: "Profile updated successfully",
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return handleApiError(error, "me:update");
  }
}
