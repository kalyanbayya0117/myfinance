import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Loan } from "@/models/Loan";
import { Client } from "@/models/Client";
import { Payment } from "@/models/Payment";
import { ApiError, handleApiError, noStoreJson } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { sanitizePhone, sanitizeText } from "@/lib/sanitize";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const loanSchema = z.object({
  clientName: z.string().min(2).max(80),
  phone: z.string().min(6).max(24),
  pledgedProperties: z.array(z.string().min(1)).optional().default([]),
  principal: z.coerce.number().positive(),
  interestRate: z.coerce.number().positive(),
  startDate: z.string().min(4),
  endDate: z.string().min(4),
  clientId: z.string().optional(),
  forceNewClient: z.boolean().optional().default(false),
});

function hasDueDatePassed(endDate: string) {
  const dueDate = new Date(endDate);
  if (Number.isNaN(dueDate.getTime())) return false;

  dueDate.setHours(23, 59, 59, 999);
  return Date.now() > dueDate.getTime();
}

type ClientRef =
  | string
  | {
      _id?: { toString: () => string };
      name?: string;
      phone?: string;
    };

function normalizeLoan<
  T extends {
    clientId?: ClientRef;
    clientName?: string;
    phone?: string;
    principal?: number;
    status?: "active" | "closed" | "overdue";
    endDate?: string;
  },
>(loan: T) {
  const client = loan.clientId && typeof loan.clientId === "object" ? loan.clientId : null;

  return {
    ...loan,
    clientId: client?._id?.toString() ?? loan.clientId?.toString?.() ?? "",
    clientName: client?.name ?? loan.clientName ?? "",
    phone: client?.phone ?? loan.phone ?? "",
  };
}

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = sanitizeText(searchParams.get("search") ?? "");
    const status = sanitizeText(searchParams.get("status") ?? "all");
    const clientId = sanitizeText(searchParams.get("clientId") ?? "");

    const query: Record<string, unknown> = { userId: auth.userId };

    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      query.clientId = clientId;
    }

    const loans = await Loan.find(query)
      .populate({ path: "clientId", select: "name phone", strictPopulate: false })
      .sort({ createdAt: -1 })
      .lean();

    const loanIds = loans.map((loan) => loan._id).filter(Boolean);

    const paymentTotals = loanIds.length
      ? await Payment.aggregate([
          {
            $match: {
              loanId: { $in: loanIds },
            },
          },
          {
            $group: {
              _id: "$loanId",
              totalPaid: { $sum: "$amount" },
            },
          },
        ])
      : [];

    const paidByLoanId = new Map<string, number>(
      paymentTotals.map((row) => [String(row._id), Number(row.totalPaid) || 0]),
    );

    const normalizedLoans = loans.map((loan) => {
      const normalized = normalizeLoan(loan);
      const totalPaid = paidByLoanId.get(String(loan._id)) ?? 0;
      const remainingAmount = Math.max((normalized.principal ?? 0) - totalPaid, 0);
      const effectiveStatus =
        remainingAmount === 0 || normalized.status === "closed"
          ? "closed"
          : hasDueDatePassed(normalized.endDate ?? "")
            ? "overdue"
            : "active";

      return {
        ...normalized,
        status: effectiveStatus,
        totalPaid,
        remainingAmount,
      };
    });

    const searchFilteredLoans = search
      ? normalizedLoans.filter((loan) => {
          const keyword = search.toLowerCase();
          return (
            loan.clientName.toLowerCase().includes(keyword) ||
            loan.phone.toLowerCase().includes(keyword)
          );
        })
      : normalizedLoans;

    const filteredLoans =
      status && status !== "all"
        ? searchFilteredLoans.filter((loan) => loan.status === status)
        : searchFilteredLoans;

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
      endDate: sanitizeText(body?.endDate),
      clientId: sanitizeText(body?.clientId),
      forceNewClient: Boolean(body?.forceNewClient),
    });

    if (!parsed.success) {
      throw new ApiError("Invalid loan details", 400);
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
      clientName: clientDoc.name,
      phone: clientDoc.phone,
      pledgedProperties: parsed.data.pledgedProperties,
      principal: parsed.data.principal,
      interestRate: parsed.data.interestRate,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      status: "active",
    });

    return noStoreJson(loan, { status: 201 });
  } catch (error) {
    return handleApiError(error, "loans:create");
  }
}
