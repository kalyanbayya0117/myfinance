import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Loan } from "@/models/Loan";
import { Payment } from "@/models/Payment";
import { ApiError, handleApiError, noStoreJson } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";
import { getLoanFinancials } from "@/lib/loan-calculations";

export const dynamic = "force-dynamic";

function getDateRange(period: string, from?: string, to?: string, exact?: string) {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (period === "custom") {
    if (exact) {
      const d = new Date(exact);
      if (Number.isNaN(d.getTime())) return null;
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      return { start, end };
    }

    const startDate = from ? new Date(from) : null;
    const endDate = to ? new Date(to) : null;

    if (!startDate || Number.isNaN(startDate.getTime())) return null;

    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = endDate && !Number.isNaN(endDate.getTime())
      ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999)
      : todayEnd;

    return { start, end };
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  let daysBack = 0;

  switch (period) {
    case "lifetime":
      return { start: new Date(2000, 0, 1), end: todayEnd };
    case "1w":
      daysBack = 7;
      break;
    case "1m":
      daysBack = 30;
      break;
    case "3m":
      daysBack = 90;
      break;
    case "1y":
      daysBack = 365;
      break;
    default:
      return null;
  }

  const start = new Date(todayEnd.getTime() - daysBack * msPerDay);
  start.setHours(0, 0, 0, 0);

  return { start, end: todayEnd };
}

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const period = sanitizeText(searchParams.get("period") ?? "1m");
    const from = sanitizeText(searchParams.get("from") ?? "");
    const to = sanitizeText(searchParams.get("to") ?? "");
    const exact = sanitizeText(searchParams.get("exact") ?? "");

    const range = getDateRange(period, from, to, exact);
    if (!range) {
      throw new ApiError("Invalid time period", 400);
    }

    const userId = new mongoose.Types.ObjectId(auth.userId);

    // Convert to YYYY-MM-DD strings for loan startDate comparison (stored as string)
    const startStr = range.start.toISOString().slice(0, 10);
    const endStr = range.end.toISOString().slice(0, 10);

    // Loans whose startDate falls within the time range
    const loans = await Loan.find(
      {
        userId: auth.userId,
        startDate: { $gte: startStr, $lte: endStr },
      },
      {
        _id: 1,
        principal: 1,
        interestRate: 1,
        startDate: 1,
        endDate: 1,
        status: 1,
      },
    ).lean();

    const loanIds = loans.map((l) => l._id).filter(Boolean);

    // Payments made within the time range (across ALL loans, not just ones created in range)
    const paymentAgg = await Payment.aggregate([
      {
        $match: {
          userId,
          date: { $gte: range.start, $lte: range.end },
        },
      },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: "$amount" },
        },
      },
    ]);

    // Payments for loans created in this range
    const loanPaymentAgg = loanIds.length
      ? await Payment.aggregate([
          {
            $match: {
              userId,
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
      loanPaymentAgg.map((row) => [String(row._id), Number(row.totalPaid) || 0]),
    );

    const totalLent = loans.reduce((s, l) => s + (Number(l.principal) || 0), 0);
    const totalActiveLent = loans
      .filter((l) => l.status === "active")
      .reduce((s, l) => s + (Number(l.principal) || 0), 0);

    const totalCollected = paymentAgg[0]?.totalCollected ?? 0;

    let totalInterestGenerated = 0;
    for (const loan of loans) {
      const totalPaid = paidByLoanId.get(String(loan._id)) ?? 0;
      const financials = getLoanFinancials({
        principal: Number(loan.principal) || 0,
        interestRate: Number(loan.interestRate) || 0,
        startDate: String(loan.startDate ?? ""),
        endDate: String(loan.endDate ?? ""),
        totalPaid,
        storedStatus: loan.status,
      });
      totalInterestGenerated += financials.accruedInterest ?? 0;
    }

    const activeLoans = loans.filter((l) => l.status === "active").length;
    const closedLoans = loans.filter((l) => l.status === "closed").length;
    const totalLoans = loans.length;

    return noStoreJson({
      period,
      from: range.start.toISOString(),
      to: range.end.toISOString(),
      metrics: {
        totalLent,
        totalActiveLent,
        totalCollected,
        totalInterestGenerated,
        activeLoans,
        closedLoans,
        totalLoans,
      },
    });
  } catch (error) {
    return handleApiError(error, "analytics:get");
  }
}
