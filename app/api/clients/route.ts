import { connectDB } from "@/lib/mongodb";
import { Client } from "@/models/Client";
import { ApiError, handleApiError, noStoreJson } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { sanitizeEmail, sanitizePhone, sanitizeText } from "@/lib/sanitize";
import { getClientsForUser } from "@/lib/server-data";
import { z } from "zod";

const createClientSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(24),
  email: z.string().email().or(z.literal("")),
  address: z.string().max(200),
});

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = sanitizeText(searchParams.get("search") ?? "");

    const clients = await getClientsForUser(auth.userId, search);
    return noStoreJson(clients);
  } catch (error) {
    return handleApiError(error, "clients:get");
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    const ip = getRequestIp(req);
    const limiter = enforceRateLimit(`clients:create:${auth.userId}:${ip}`, {
      limit: 40,
      windowMs: 60 * 1000,
    });

    if (!limiter.allowed) {
      throw new ApiError(`Too many requests. Try again in ${limiter.retryAfterSec}s`, 429);
    }

    await connectDB();
    const body = await req.json();

    const parsed = createClientSchema.safeParse({
      name: sanitizeText(body?.name),
      phone: sanitizePhone(body?.phone),
      email: body?.email ? sanitizeEmail(body.email) : "",
      address: sanitizeText(body?.address),
    });

    if (!parsed.success) {
      throw new ApiError("Invalid client details", 400);
    }

    const client = await Client.create({
      userId: auth.userId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      address: parsed.data.address,
    });

    return noStoreJson(client, { status: 201 });
  } catch (error) {
    return handleApiError(error, "clients:create");
  }
}
