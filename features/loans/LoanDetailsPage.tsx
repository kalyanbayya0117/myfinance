"use client";

import { useCallback, useEffect, useState } from "react";
import { Loan } from "./loan.types";
import { toast } from "sonner";
import AddLoanDrawer from "./AddLoanDrawer";
import {
  HiCalendar,
  HiCash,
  HiCheckCircle,
  HiClock,
  HiPencil,
  HiScale,
} from "react-icons/hi";

type Payment = {
  _id: string;
  loanId: string;
  amount: number;
  date: string;
};

export default function LoanDetailsPage({ id }: { id: string }) {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [amount, setAmount] = useState("");
  const [closedPopupClient, setClosedPopupClient] = useState<string | null>(null);
  const [loanDrawerOpen, setLoanDrawerOpen] = useState(false);

  const fetchLoanDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/loans/${id}`);

      if (!res.ok) {
        setLoan(null);
        setPayments([]);
        return;
      }

      const data = await res.json();
      setLoan(data.loan);
      setPayments(data.payments ?? []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLoanDetails();
  }, [fetchLoanDetails]);

  useEffect(() => {
    if (!closedPopupClient) return;

    const timer = setTimeout(() => {
      setClosedPopupClient(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [closedPopupClient]);

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!loan) return <p className="text-red-500">Loan not found</p>;

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const totalDue = loan.totalAmount ?? loan.principal;
  const interestAmount = loan.accruedInterest ?? Math.max(totalDue - loan.principal, 0);
  const balance = Math.max(totalDue - totalPaid, 0);
  const isLoanClosed = loan.status === "closed" || balance === 0;
  const loanStatusLabel = isLoanClosed ? "Closed" : "Active";
  const loanStatusStyle = isLoanClosed
    ? "bg-green-50 text-green-700 border-green-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";

  const handlePayment = async () => {
    if (isLoanClosed) {
      toast.error("This loan is already closed");
      return;
    }

    if (!amount) return;

    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) return;

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        loanId: id,
        amount: paymentAmount,
      }),
    });

    if (!res.ok) {
      toast.error("Failed to record payment");
      return;
    }

    const result = await res.json();

    await fetchLoanDetails();
    setAmount("");

    if (result?.loanClosed) {
      setClosedPopupClient(result?.clientName || loan.clientName);
      toast.success("Loan closed successfully");
      return;
    }

    toast.success("Payment Recorded");
  };

  return (
    <div className="space-y-6">
      {closedPopupClient ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 text-center shadow-xl">
            <div className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 flex gap-2">
              <span className="h-3 w-3 rounded-full bg-yellow-400 animate-bounce" />
              <span className="h-3 w-3 rounded-full bg-green-500 animate-ping" />
              <span className="h-3 w-3 rounded-full bg-blue-500 animate-bounce" />
              <span className="h-3 w-3 rounded-full bg-pink-500 animate-ping" />
            </div>

            <p className="text-4xl">🎉</p>
            <h3 className="mt-2 text-xl font-bold text-gray-900">Loan Closed!</h3>
            <p className="mt-2 text-sm text-gray-600">
              {closedPopupClient} completed this loan.
            </p>

            <button
              type="button"
              onClick={() => setClosedPopupClient(null)}
              className="mt-5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      {/* Loan Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{loan.clientName}</h2>
            <p className="mt-1 text-xs text-gray-500">Loan ID: {loan.loanId || "-"}</p>
          </div>

          <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${loanStatusStyle}`}>
            {isLoanClosed ? (
              <HiCheckCircle className="text-sm" />
            ) : (
              <HiClock className="text-sm" />
            )}
            {loanStatusLabel}
          </span>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-black/10 bg-gray-50 p-4">
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <HiScale className="text-sm" /> Principal
            </p>
            <p className="mt-2 text-xl font-extrabold text-black">₹{loan.principal.toLocaleString()}</p>
          </div>

          <div className="rounded-xl border border-black/10 bg-gray-50 p-4">
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <HiCash className="text-sm" /> Interest Amount
            </p>
            <p className="mt-2 text-xl font-extrabold text-black">₹{interestAmount.toLocaleString()}</p>
          </div>

          <div className="rounded-xl border border-black/10 bg-gray-50 p-4">
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <HiCash className="text-sm" /> Total Paid
            </p>
            <p className="mt-2 text-xl font-extrabold text-black">₹{totalPaid.toLocaleString()}</p>
          </div>

          <div className="rounded-xl border border-black/10 bg-gray-50 p-4">
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <HiCash className="text-sm" /> Total Due
            </p>
            <p className="mt-2 text-xl font-extrabold text-black">₹{totalDue.toLocaleString()}</p>
            <p className="mt-1 text-xs font-medium text-gray-500">Balance: ₹{balance.toLocaleString()}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Loan Details</p>
            <p className="text-xs text-gray-500">Reference and calculation breakdown</p>
          </div>

          <button
            type="button"
            onClick={() => setLoanDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-3 py-2 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/10 cursor-pointer"
          >
            <HiPencil className="text-sm" />
            Edit Loan
          </button>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-black/10 bg-gray-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Daily Interest Rate</p>
            <p className="mt-1 text-base font-bold text-black">{loan.interestRate}%</p>
          </div>

          <div className="rounded-lg border border-black/10 bg-gray-50 p-3">
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <HiCalendar className="text-sm" /> Start Date
            </p>
            <p className="mt-1 text-base font-bold text-black">{loan.startDate}</p>
          </div>

          <div className="rounded-lg border border-black/10 bg-gray-50 p-3">
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <HiCalendar className="text-sm" /> Accrued Days
            </p>
            <p className="mt-1 text-base font-bold text-black">{loan.daysElapsed ?? 0}</p>
          </div>

          <div className="rounded-lg border border-black/10 bg-gray-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Accrued Interest</p>
            <p className="mt-1 text-base font-bold text-black">₹{(loan.accruedInterest ?? 0).toLocaleString()}</p>
          </div>

          <div className="rounded-lg border border-black/10 bg-gray-50 p-3 sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Pledged Properties</p>
            <p className="mt-1 text-sm font-semibold text-black">
              {loan.pledgedProperties?.length
                ? loan.pledgedProperties.join(", ")
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Add Payment */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="mb-3">
          <h3 className="font-semibold">Add Payment</h3>
          <p className="text-xs text-gray-500">Record amount received for this loan.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            type="number"
            disabled={isLoanClosed}
            className="input disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          />

          <button
            onClick={handlePayment}
            disabled={isLoanClosed}
            className="bg-[var(--primary)] text-white px-4 rounded-lg whitespace-nowrap cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoanClosed ? "Loan Closed" : "Add Payment"}
          </button>
        </div>
      </div>

      {isLoanClosed ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 inline-flex items-center gap-2">
          <HiCheckCircle className="text-base" />
          This loan is closed. Payments are disabled.
        </div>
      ) : null}

      {/* Timeline */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Payment Timeline</h3>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
            {payments.length} entries
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-black/15 bg-gray-50 p-4 text-sm text-gray-500">
            No payments recorded yet.
          </div>
        ) : (
          <div className="relative pl-7">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-black/10" />

            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment._id} className="relative">
                  <span className="absolute -left-[25px] top-2 h-3 w-3 rounded-full bg-[var(--primary)] ring-4 ring-[var(--primary)]/20" />

                  <div className="rounded-lg border border-black/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-800">
                        {new Date(payment.date).toLocaleDateString(undefined, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>

                      <p className="rounded-md bg-[var(--primary)]/10 px-2.5 py-1 text-sm font-bold text-[var(--primary)]">
                        ₹{payment.amount.toLocaleString()}
                      </p>
                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(payment.date).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AddLoanDrawer
        open={loanDrawerOpen}
        onClose={() => setLoanDrawerOpen(false)}
        onSaved={fetchLoanDetails}
        mode="edit"
        loan={loan}
      />
    </div>
  );
}
