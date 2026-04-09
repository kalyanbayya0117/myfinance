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

    const pad = (n: number) => String(n).padStart(2, "0");
    const toDateStr = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const periodStart = toDateStr(range.start);
    const periodEnd = toDateStr(range.end);

    // ── 1. Loans ISSUED in the period (for Total Lent, counts) ──
    const issuedLoans = await Loan.find(
      {
        userId: auth.userId,
        startDate: { $gte: periodStart, $lte: periodEnd },
      },
      {
        _id: 1,
        loanId: 1,
        clientName: 1,
        principal: 1,
        interestRate: 1,
        startDate: 1,
        endDate: 1,
        status: 1,
      },
    ).lean();

    const issuedLoanIds = issuedLoans.map((l) => l._id).filter(Boolean);

    const issuedPaymentAgg = issuedLoanIds.length
      ? await Payment.aggregate([
          { $match: { userId, loanId: { $in: issuedLoanIds } } },
          { $group: { _id: "$loanId", totalPaid: { $sum: "$amount" } } },
        ])
      : [];

    const issuedPaidMap = new Map<string, number>(
      issuedPaymentAgg.map((r) => [String(r._id), Number(r.totalPaid) || 0]),
    );

    const issuedDetails: {
      _id: string;
      loanId: string;
      clientName: string;
      principal: number;
      interestGenerated: number;
      totalPaid: number;
      status: string;
      startDate: string;
    }[] = [];

    for (const loan of issuedLoans) {
      const totalPaid = issuedPaidMap.get(String(loan._id)) ?? 0;
      const financials = getLoanFinancials({
        principal: Number(loan.principal) || 0,
        interestRate: Number(loan.interestRate) || 0,
        startDate: String(loan.startDate ?? ""),
        endDate: String(loan.endDate ?? ""),
        totalPaid,
        storedStatus: loan.status,
      });

      issuedDetails.push({
        _id: String(loan._id),
        loanId: String((loan as unknown as Record<string, unknown>).loanId ?? ""),
        clientName: String((loan as unknown as Record<string, unknown>).clientName ?? ""),
        principal: Number(loan.principal) || 0,
        interestGenerated: financials.accruedInterest ?? 0,
        totalPaid,
        status: financials.status,
        startDate: String(loan.startDate ?? ""),
      });
    }

    const totalLent = issuedLoans.reduce((s, l) => s + (Number(l.principal) || 0), 0);
    const totalActiveLent = issuedDetails
      .filter((l) => l.status === "active")
      .reduce((s, l) => s + l.principal, 0);
    const activeLoans = issuedDetails.filter((l) => l.status === "active").length;
    const closedLoans = issuedDetails.filter((l) => l.status === "closed").length;
    const totalLoans = issuedDetails.length;

    // ── 2. Total Collected = ALL payments made during the period ──
    const collectedAgg = await Payment.aggregate([
      {
        $match: {
          userId,
          date: { $gte: range.start, $lte: range.end },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalCollected = collectedAgg[0]?.total ?? 0;

    // ── 3. Total Interest Generated = interest accrued by ALL loans DURING the period ──
    // Fetch all loans that were active at any point during the period
    // i.e. startDate <= periodEnd (loan existed) and not closed before periodStart
    const allLoans = await Loan.find(
      {
        userId: auth.userId,
        startDate: { $lte: periodEnd },
      },
      {
        _id: 1,
        loanId: 1,
        clientName: 1,
        principal: 1,
        interestRate: 1,
        startDate: 1,
        endDate: 1,
        status: 1,
      },
    ).lean();

    let totalInterestGenerated = 0;
    const interestDetails: {
      _id: string;
      loanId: string;
      clientName: string;
      principal: number;
      interestGenerated: number;
      totalPaid: number;
      status: string;
      startDate: string;
    }[] = [];

    for (const loan of allLoans) {
      const loanStart = String(loan.startDate ?? "");
      const loanEnd = String(loan.endDate ?? "");

      // Skip loans that closed before the period started
      if (loanEnd && loan.status === "closed" && loanEnd < periodStart) continue;

      // Interest up to period end
      const capEnd = loanEnd && loanEnd < periodEnd ? loanEnd : periodEnd;
      const interestToEnd = getLoanFinancials({
        principal: Number(loan.principal) || 0,
        interestRate: Number(loan.interestRate) || 0,
        startDate: loanStart,
        endDate: capEnd,
        totalPaid: 0,
        storedStatus: loan.status,
      }).accruedInterest ?? 0;

      // Interest up to period start (to subtract)
      const capStart = loanEnd && loanEnd < periodStart ? loanEnd : periodStart;
      const interestToStart = loanStart < periodStart
        ? (getLoanFinancials({
            principal: Number(loan.principal) || 0,
            interestRate: Number(loan.interestRate) || 0,
            startDate: loanStart,
            endDate: capStart,
            totalPaid: 0,
            storedStatus: loan.status,
          }).accruedInterest ?? 0)
        : 0;

      const periodInterest = Math.max(interestToEnd - interestToStart, 0);
      if (periodInterest <= 0) continue;

      totalInterestGenerated += periodInterest;

      interestDetails.push({
        _id: String(loan._id),
        loanId: String((loan as unknown as Record<string, unknown>).loanId ?? ""),
        clientName: String((loan as unknown as Record<string, unknown>).clientName ?? ""),
        principal: Number(loan.principal) || 0,
        interestGenerated: periodInterest,
        totalPaid: 0,
        status: String(loan.status ?? "active"),
        startDate: loanStart,
      });
    }

    // Sort interest details by amount descending
    interestDetails.sort((a, b) => b.interestGenerated - a.interestGenerated);

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
      loanDetails: issuedDetails,
      interestDetails,
    });
  } catch (error) {
    return handleApiError(error, "analytics:get");
  }
}
