import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Payment } from "@/models/Payment";
import { Loan } from "@/models/Loan";
import { ApiError, handleApiError, noStoreJson } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { getLoanFinancials } from "@/lib/loan-calculations";

const paymentSchema = z.object({
  loanId: z.string().min(1),
  amount: z.coerce.number().positive(),
});

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    const ip = getRequestIp(req);

    const limiter = enforceRateLimit(`payments:create:${auth.userId}:${ip}`, {
      limit: 80,
      windowMs: 60 * 1000,
    });

    if (!limiter.allowed) {
      throw new ApiError(`Too many requests. Try again in ${limiter.retryAfterSec}s`, 429);
    }

    await connectDB();

    const body = await req.json();
    const parsed = paymentSchema.safeParse({
      loanId: String(body?.loanId ?? "").trim(),
      amount: body?.amount,
    });

    if (!parsed.success) {
      throw new ApiError("Invalid payment details", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(parsed.data.loanId)) {
      throw new ApiError("Invalid loan id", 400);
    }

    const loan = await Loan.findOne({ _id: parsed.data.loanId, userId: auth.userId }).lean();
    if (!loan) {
      throw new ApiError("Loan not found", 404);
    }

    const totals = await Payment.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(auth.userId),
          loanId: new mongoose.Types.ObjectId(parsed.data.loanId),
        },
      },
      {
        $group: {
          _id: "$loanId",
          totalPaid: { $sum: "$amount" },
        },
      },
    ]);

    const paidBefore = Number(totals[0]?.totalPaid ?? 0);
    const beforeFinancials = getLoanFinancials({
      principal: Number(loan.principal) || 0,
      interestRate: Number(loan.interestRate) || 0,
      startDate: String(loan.startDate ?? ""),
      endDate: String(loan.endDate ?? ""),
      totalPaid: paidBefore,
      storedStatus: loan.status,
    });

    if (beforeFinancials.status === "closed") {
      throw new ApiError("This loan is already closed", 400);
    }

    const payment = await Payment.create({
      userId: auth.userId,
      loanId: parsed.data.loanId,
      amount: parsed.data.amount,
    });

    const totalPaid = paidBefore + parsed.data.amount;
    const afterFinancials = getLoanFinancials({
      principal: Number(loan.principal) || 0,
      interestRate: Number(loan.interestRate) || 0,
      startDate: String(loan.startDate ?? ""),
      endDate: String(loan.endDate ?? ""),
      totalPaid,
      storedStatus: loan.status,
    });

    const loanClosed = afterFinancials.status === "closed" && loan.status !== "closed";
    if (loanClosed) {
      await Loan.findOneAndUpdate(
        { _id: parsed.data.loanId, userId: auth.userId },
        { status: "closed" },
      );
    }

    return noStoreJson({
      payment,
      loanClosed,
      clientName: loan.clientName ?? "",
      remainingAmount: afterFinancials.remainingAmount,
    });
  } catch (error) {
    return handleApiError(error, "payments:create");
  }
}
