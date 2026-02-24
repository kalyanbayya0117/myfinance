"use client";

import { useEffect, useState } from "react";
import { Loan } from "./loan.types";
import { useRouter } from "next/navigation";
import { HiEye, HiTrash, HiPencil } from "react-icons/hi";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface Props {
  refreshKey?: number;
  search?: string;
  status?: string;
  onEdit: (loan: Loan) => void;
  onDeleted: () => void;
}

export default function LoansTable({
  refreshKey = 0,
  search = "",
  status = "all",
  onEdit,
  onDeleted,
}: Props) {
  const [data, setData] = useState<Loan[]>([]);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status && status !== "all") params.set("status", status);

    const fetchLoans = async () => {
      try {
        const res = await fetch(`/api/loans?${params.toString()}`, {
          cache: "no-store",
        });

        const raw = await res.text();
        if (!raw.trim()) {
          if (mounted) setData([]);
          return;
        }

        const result = JSON.parse(raw);
        if (mounted) {
          setData(Array.isArray(result) ? result : []);
        }
      } catch {
        if (mounted) {
          setData([]);
          toast.error("Failed to load loans");
        }
      }
    };

    fetchLoans();

    return () => {
      mounted = false;
    };
  }, [refreshKey, search, status]);

  if (!data.length) {
    return (
      <div className="bg-white p-6 rounded-xl text-gray-500">
        No loans added yet.
      </div>
    );
  }

  const getStatusStyle = (status: Loan["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "closed":
        return "bg-gray-200 text-gray-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100";
    }
  };

  const handleDelete = async () => {
    if (!loanToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/loans/${loanToDelete._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Failed to delete loan");
        return;
      }

      toast.success("Loan deleted");
      setLoanToDelete(null);
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <ConfirmDialog
        open={Boolean(loanToDelete)}
        title="Delete this loan?"
        description={
          loanToDelete
            ? `Client: ${loanToDelete.clientName}`
            : "This action cannot be undone."
        }
        confirmLabel="Delete Loan"
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) setLoanToDelete(null);
        }}
        loading={deleting}
      />

      <div className="bg-white rounded-sm shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          {/* Table Head */}
          <thead className="bg-[var(--primary)] text-white uppercase text-xs">
            <tr>
              <th className="p-4 text-left w-[60px]">#</th>
              <th className="p-4 text-left">Client</th>
              <th className="p-4 text-left">Principal</th>
              <th className="p-4 text-left">Interest</th>
              <th className="p-4 text-left">Pledged</th>
              <th className="p-4 text-left">Duration</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {data.map((loan, index) => (
              <tr
                key={loan._id}
                className="border-t hover:bg-gray-50 transition"
              >
                {/* Row Number */}
                <td className="p-4 font-semibold text-gray-500">{index + 1}</td>

                {/* Client Info */}
                <td className="p-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (loan.clientId) router.push(`/clients/${loan.clientId}`);
                    }}
                    className="font-semibold text-left hover:text-[var(--primary)] cursor-pointer"
                  >
                    {loan.clientName}
                  </button>
                  <p className="text-gray-500 text-xs">{loan.phone}</p>
                </td>

                {/* Amount */}
                <td className="p-4">
                  {(loan.totalPaid ?? 0) > 0 ? (
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-gray-400 line-through">
                        ₹{loan.principal.toLocaleString()}
                      </p>
                      <p className="mt-1 text-sm font-bold text-gray-900">
                        ₹
                        {(
                          loan.remainingAmount ?? loan.principal
                        ).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="font-semibold">
                      ₹{loan.principal.toLocaleString()}
                    </p>
                  )}
                </td>

                {/* Interest */}
                <td className="p-4">{loan.interestRate}%</td>

                <td className="p-4 text-xs text-gray-700">
                  {loan.pledgedProperties?.length
                    ? loan.pledgedProperties.join(", ")
                    : "-"}
                </td>

                {/* Dates */}
                <td className="p-4 text-xs text-gray-600">
                  {loan.startDate} → {loan.endDate}
                </td>

                {/* Status */}
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                      loan.status,
                    )}`}
                  >
                    {loan.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/loans/${loan._id}`)}
                      className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                      title="View Loan"
                    >
                      <HiEye className="text-lg" />
                    </button>

                    {/* View Ledger */}
                    <button
                      type="button"
                      onClick={() => onEdit(loan)}
                      className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                      title="Edit Loan"
                    >
                      <HiPencil className="text-lg" />
                    </button>

                    {/* Add Payment Shortcut */}
                    {/* <button
                    type="button"
                    onClick={() => router.push(`/loans/${loan._id}`)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                    title="Add Payment"
                  >
                    <HiCurrencyRupee className="text-lg" />
                  </button> */}

                    <button
                      type="button"
                      onClick={() => setLoanToDelete(loan)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                      title="Delete Loan"
                    >
                      <HiTrash className="text-lg" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
