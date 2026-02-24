import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Client } from "@/models/Client";
import { Loan } from "@/models/Loan";
import { Payment } from "@/models/Payment";
import { ApiError, handleApiError, noStoreJson } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { sanitizeEmail, sanitizePhone, sanitizeText } from "@/lib/sanitize";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";

const updateClientSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(24),
  email: z.string().email().or(z.literal("")),
  address: z.string().max(200),
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth(req);
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid client id", 400);
    }

    const client = await Client.findOne({ _id: id, userId: auth.userId }).lean();
    if (!client) {
      throw new ApiError("Client not found", 404);
    }

    const loansRaw = await Loan.find({ clientId: id, userId: auth.userId })
      .populate({ path: "clientId", select: "name phone", strictPopulate: false })
      .sort({ createdAt: -1 })
      .lean();

    const loanIds = loansRaw.map((loan) => loan._id).filter(Boolean);

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

    const loans = loansRaw.map((loan) => {
      const normalized = normalizeLoan(loan);
      const totalPaid = paidByLoanId.get(String(loan._id)) ?? 0;
      const remainingAmount = Math.max((normalized.principal ?? 0) - totalPaid, 0);
      const status =
        remainingAmount === 0 || normalized.status === "closed"
          ? "closed"
          : hasDueDatePassed(normalized.endDate ?? "")
            ? "overdue"
            : "active";

      return {
        ...normalized,
        status,
        totalPaid,
        remainingAmount,
      };
    });

    return noStoreJson({ client, loans });
  } catch (error) {
    return handleApiError(error, "client:get-by-id");
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth(req);
    const ip = getRequestIp(req);
    const limiter = enforceRateLimit(`clients:update:${auth.userId}:${ip}`, {
      limit: 60,
      windowMs: 60 * 1000,
    });

    if (!limiter.allowed) {
      throw new ApiError(`Too many requests. Try again in ${limiter.retryAfterSec}s`, 429);
    }

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid client id", 400);
    }

    const body = await req.json();
    const parsed = updateClientSchema.safeParse({
      name: sanitizeText(body?.name),
      phone: sanitizePhone(body?.phone),
      email: body?.email ? sanitizeEmail(body?.email) : "",
      address: sanitizeText(body?.address),
    });

    if (!parsed.success) {
      throw new ApiError("Invalid client details", 400);
    }

    const client = await Client.findOneAndUpdate(
      { _id: id, userId: auth.userId },
      {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email,
        address: parsed.data.address,
      },
      { new: true },
    ).lean();

    if (!client) {
      throw new ApiError("Client not found", 404);
    }

    return noStoreJson(client);
  } catch (error) {
    return handleApiError(error, "client:update");
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth(req);
    const ip = getRequestIp(req);
    const limiter = enforceRateLimit(`clients:delete:${auth.userId}:${ip}`, {
      limit: 30,
      windowMs: 60 * 1000,
    });

    if (!limiter.allowed) {
      throw new ApiError(`Too many requests. Try again in ${limiter.retryAfterSec}s`, 429);
    }

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid client id", 400);
    }

    const client = await Client.findOneAndDelete({ _id: id, userId: auth.userId });

    if (!client) {
      throw new ApiError("Client not found", 404);
    }

    const loans = await Loan.find({ clientId: id, userId: auth.userId }, { _id: 1 }).lean();
    const loanIds = loans.map((loan) => loan._id);

    await Loan.deleteMany({ clientId: id, userId: auth.userId });

    if (loanIds.length > 0) {
      await Payment.deleteMany({
        userId: auth.userId,
        loanId: { $in: loanIds },
      });
    }

    return noStoreJson({ message: "Client deleted" });
  } catch (error) {
    return handleApiError(error, "client:delete");
  }
}
