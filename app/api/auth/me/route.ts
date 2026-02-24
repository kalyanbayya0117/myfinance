import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { handleApiError, noStoreJson } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";

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
