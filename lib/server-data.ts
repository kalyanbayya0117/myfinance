import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { sanitizeText } from "@/lib/sanitize";
import { getLoanFinancials } from "@/lib/loan-calculations";
import { Client } from "@/models/Client";
import { Loan } from "@/models/Loan";
import { Payment } from "@/models/Payment";

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    _id?: { toString: () => string };
    clientId?: ClientRef;
    clientName?: string;
    phone?: string;
    principal?: number;
    status?: "active" | "closed";
    interestRate?: number;
    startDate?: string;
    endDate?: string;
  },
>(loan: T) {
  const client = loan.clientId && typeof loan.clientId === "object" ? loan.clientId : null;

  return {
    ...loan,
    _id: loan._id?.toString() ?? "",
    clientId: client?._id?.toString() ?? loan.clientId?.toString?.() ?? "",
    clientName: client?.name ?? loan.clientName ?? "",
    phone: client?.phone ?? loan.phone ?? "",
  };
}

export async function getClientsForUser(userId: string, searchInput = "") {
  await connectDB();

  const search = sanitizeText(searchInput);
  const safeSearch = search ? escapeRegex(search) : "";
  const query = search
    ? {
        userId,
        $or: [
          { name: { $regex: safeSearch, $options: "i" } },
          { phone: { $regex: safeSearch, $options: "i" } },
          { email: { $regex: safeSearch, $options: "i" } },
        ],
      }
    : { userId };

  const clients = await Client.find(query, {
    _id: 1,
    name: 1,
    phone: 1,
    email: 1,
    address: 1,
  })
    .sort({ createdAt: -1 })
    .lean();

  return clients.map((client) => ({
    _id: String(client._id),
    name: String(client.name ?? ""),
    phone: String(client.phone ?? ""),
    email: String(client.email ?? ""),
    address: String(client.address ?? ""),
  }));
}

export async function getLoansForUser({
  userId,
  searchInput = "",
  statusInput = "all",
  clientIdInput = "",
}: {
  userId: string;
  searchInput?: string;
  statusInput?: string;
  clientIdInput?: string;
}) {
  await connectDB();

  const search = sanitizeText(searchInput);
  const safeSearch = search ? escapeRegex(search) : "";
  const status = sanitizeText(statusInput || "all");
  const clientId = sanitizeText(clientIdInput);

  const query: Record<string, unknown> = { userId };
  if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
    query.clientId = clientId;
  }

  if (safeSearch) {
    query.$or = [
      { clientName: { $regex: safeSearch, $options: "i" } },
      { phone: { $regex: safeSearch, $options: "i" } },
      { loanId: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const loans = await Loan.find(query, {
    _id: 1,
    clientId: 1,
    loanId: 1,
    clientName: 1,
    phone: 1,
    pledgedProperties: 1,
    principal: 1,
    interestRate: 1,
    startDate: 1,
    endDate: 1,
    status: 1,
    createdAt: 1,
  })
    .sort({ createdAt: -1 })
    .lean();

  const loanIds = loans.map((loan) => loan._id).filter(Boolean);
  const paymentTotals = loanIds.length
    ? await Payment.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
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
    const financials = getLoanFinancials({
      principal: normalized.principal ?? 0,
      interestRate: normalized.interestRate ?? 0,
      startDate: normalized.startDate ?? "",
      endDate: normalized.endDate ?? "",
      totalPaid,
      storedStatus: normalized.status,
    });

    return {
      ...normalized,
      ...financials,
    };
  });

  return status && status !== "all"
    ? normalizedLoans.filter((loan) => loan.status === status)
    : normalizedLoans;
}
