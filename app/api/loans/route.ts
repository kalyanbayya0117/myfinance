import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Loan } from "@/models/Loan";
import { Client } from "@/models/Client";
import { ApiError, handleApiError, noStoreJson } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { sanitizePhone, sanitizeText } from "@/lib/sanitize";
import { getLoansForUser } from "@/lib/server-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const loanSchema = z.object({
  loanId: z.string().min(1).max(60),
  clientName: z.string().min(2).max(80),
  phone: z.string().min(6).max(24),
  pledgedProperties: z.array(z.string().min(1)).optional().default([]),
  principal: z.coerce.number().positive(),
  interestRate: z.coerce.number().positive(),
  startDate: z.string().min(4),
  clientId: z.string().optional(),
  forceNewClient: z.boolean().optional().default(false),
});

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const search = sanitizeText(searchParams.get("search") ?? "");
    const status = sanitizeText(searchParams.get("status") ?? "all");
    const clientId = sanitizeText(searchParams.get("clientId") ?? "");

    const filteredLoans = await getLoansForUser({
      userId: auth.userId,
      searchInput: search,
      statusInput: status,
      clientIdInput: clientId,
    });

    return noStoreJson(filteredLoans);
  } catch (error) {
    return handleApiError(error, "loans:get");
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    const ip = getRequestIp(req);

    const limiter = enforceRateLimit(`loans:create:${auth.userId}:${ip}`, {
      limit: 40,
      windowMs: 60 * 1000,
    });

    if (!limiter.allowed) {
      throw new ApiError(`Too many requests. Try again in ${limiter.retryAfterSec}s`, 429);
    }

    await connectDB();

    const body = await req.json();
    const parsed = loanSchema.safeParse({
      loanId: sanitizeText(body?.loanId),
      clientName: sanitizeText(body?.clientName),
      phone: sanitizePhone(body?.phone),
      pledgedProperties: Array.isArray(body?.pledgedProperties)
        ? body.pledgedProperties
            .map((value: unknown) => sanitizeText(value))
            .filter(Boolean)
        : [],
      principal: body?.principal,
      interestRate: body?.interestRate,
      startDate: sanitizeText(body?.startDate),
      clientId: sanitizeText(body?.clientId),
      forceNewClient: Boolean(body?.forceNewClient),
    });

    if (!parsed.success) {
      throw new ApiError("Invalid loan details", 400);
    }

    const existingLoanId = await Loan.exists({
      userId: auth.userId,
      loanId: parsed.data.loanId,
    });

    if (existingLoanId) {
      throw new ApiError("Loan ID already exists", 409);
    }

    let clientDoc = null;

    if (parsed.data.clientId) {
      if (!mongoose.Types.ObjectId.isValid(parsed.data.clientId)) {
        throw new ApiError("Invalid client selected", 400);
      }

      clientDoc = await Client.findOne({ _id: parsed.data.clientId, userId: auth.userId });
      if (!clientDoc) {
        throw new ApiError("Selected client not found", 404);
      }
    }

    if (!clientDoc) {
      clientDoc = await Client.create({
        userId: auth.userId,
        name: parsed.data.clientName,
        phone: parsed.data.phone,
        email: "",
        address: "",
      });
    }

    const loan = await Loan.create({
      userId: auth.userId,
      clientId: clientDoc._id,
      loanId: parsed.data.loanId,
      clientName: clientDoc.name,
      phone: clientDoc.phone,
      pledgedProperties: parsed.data.pledgedProperties,
      principal: parsed.data.principal,
      interestRate: parsed.data.interestRate,
      startDate: parsed.data.startDate,
      status: "active",
    });

    return noStoreJson(loan, { status: 201 });
  } catch (error) {
    return handleApiError(error, "loans:create");
  }
}
