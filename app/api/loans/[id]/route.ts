import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Loan } from "@/models/Loan";
import { Payment } from "@/models/Payment";
import { Client } from "@/models/Client";
import { ApiError, handleApiError, noStoreJson } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { sanitizePhone, sanitizeText } from "@/lib/sanitize";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { getLoanFinancials } from "@/lib/loan-calculations";

const updateLoanSchema = z.object({
  loanId: z.string().min(1).max(60),
  clientName: z.string().min(2).max(80),
  phone: z.string().min(6).max(24),
  pledgedProperties: z.array(z.string().min(1)).optional().default([]),
  principal: z.coerce.number().positive(),
  interestRate: z.coerce.number().positive(),
  startDate: z.string().min(4),
  endDate: z.string().optional().default(""),
  clientId: z.string().optional(),
  forceNewClient: z.boolean().optional().default(false),
  status: z.enum(["active", "closed"]).optional(),
}).superRefine((data, context) => {
  if (data.status === "closed") {
    if (!data.endDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date required for closed loan",
      });
      return;
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date cannot be before given date",
      });
    }
  }
});

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
    status?: "active" | "closed";
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
      throw new ApiError("Invalid loan id", 400);
    }

    const loanDoc = await Loan.findOne({ _id: id, userId: auth.userId })
      .populate({ path: "clientId", select: "name phone", strictPopulate: false })
      .lean();

    const loan = loanDoc ? normalizeLoan(loanDoc) : null;
    if (!loan) {
      throw new ApiError("Loan not found", 404);
    }

    const payments = await Payment.find({ loanId: id, userId: auth.userId })
      .sort({ date: -1 })
      .lean();

    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const financials = getLoanFinancials({
      principal: Number(loan.principal) || 0,
      interestRate: Number(loan.interestRate) || 0,
      startDate: String(loan.startDate ?? ""),
      endDate: String(loan.endDate ?? ""),
      totalPaid,
      storedStatus: loan.status,
    });

    return noStoreJson({
      loan: {
        ...loan,
        ...financials,
      },
      payments,
    });
  } catch (error) {
    return handleApiError(error, "loan:get-by-id");
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth(req);
    const ip = getRequestIp(req);
    const limiter = enforceRateLimit(`loans:update:${auth.userId}:${ip}`, {
      limit: 60,
      windowMs: 60 * 1000,
    });

    if (!limiter.allowed) {
      throw new ApiError(`Too many requests. Try again in ${limiter.retryAfterSec}s`, 429);
    }

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid loan id", 400);
    }

    const body = await req.json();

    const parsed = updateLoanSchema.safeParse({
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
      endDate: sanitizeText(body?.endDate),
      clientId: sanitizeText(body?.clientId),
      forceNewClient: Boolean(body?.forceNewClient),
      status: body?.status,
    });

    if (!parsed.success) {
      throw new ApiError("Invalid loan details", 400);
    }

    const existingLoanId = await Loan.exists({
      userId: auth.userId,
      loanId: parsed.data.loanId,
      _id: { $ne: id },
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

    if (!clientDoc && parsed.data.clientName && parsed.data.phone) {
      clientDoc = await Client.create({
        userId: auth.userId,
        name: parsed.data.clientName,
        phone: parsed.data.phone,
        email: "",
        address: "",
      });
    }

    if (!clientDoc) {
      throw new ApiError("Client details are required", 400);
    }

    const updatedLoanDoc = await Loan.findOneAndUpdate(
      { _id: id, userId: auth.userId },
      {
        userId: auth.userId,
        clientId: clientDoc._id,
        loanId: parsed.data.loanId,
        clientName: clientDoc.name,
        phone: clientDoc.phone,
        pledgedProperties: parsed.data.pledgedProperties,
        principal: parsed.data.principal,
        interestRate: parsed.data.interestRate,
        startDate: parsed.data.startDate,
        endDate: parsed.data.status === "closed" ? parsed.data.endDate : "",
        status: parsed.data.status ?? "active",
      },
      { new: true },
    )
      .populate({ path: "clientId", select: "name phone", strictPopulate: false })
      .lean();

    if (!updatedLoanDoc) {
      throw new ApiError("Loan not found", 404);
    }

    return noStoreJson(normalizeLoan(updatedLoanDoc));
  } catch (error) {
    return handleApiError(error, "loan:update");
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth(req);
    const ip = getRequestIp(req);
    const limiter = enforceRateLimit(`loans:delete:${auth.userId}:${ip}`, {
      limit: 40,
      windowMs: 60 * 1000,
    });

    if (!limiter.allowed) {
      throw new ApiError(`Too many requests. Try again in ${limiter.retryAfterSec}s`, 429);
    }

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid loan id", 400);
    }

    const deletedLoan = await Loan.findOneAndDelete({ _id: id, userId: auth.userId });
    if (!deletedLoan) {
      throw new ApiError("Loan not found", 404);
    }

    await Payment.deleteMany({ loanId: id, userId: auth.userId });

    return noStoreJson({ message: "Loan deleted" });
  } catch (error) {
    return handleApiError(error, "loan:delete");
  }
}
