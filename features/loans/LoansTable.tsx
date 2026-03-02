"use client";

import { useEffect, useRef, useState } from "react";
import { Loan } from "./loan.types";
import { useRouter } from "next/navigation";
import { HiEye, HiTrash, HiPencil } from "react-icons/hi";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface Props {
  initialData?: Loan[];
  initialLoaded?: boolean;
  refreshKey?: number;
  search?: string;
  status?: string;
  onEdit: (loan: Loan) => void;
  onDeleted: () => void;
}

export default function LoansTable({
  initialData = [],
  initialLoaded = false,
  refreshKey = 0,
  search = "",
  status = "all",
  onEdit,
  onDeleted,
}: Props) {
  const [data, setData] = useState<Loan[]>(initialData);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const isFirstFetchEffect = useRef(true);
  const router = useRouter();

  useEffect(() => {
    if (isFirstFetchEffect.current) {
      isFirstFetchEffect.current = false;
      if (initialLoaded && refreshKey === 0 && !search.trim() && status === "all") {
        return;
      }
    }

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
  }, [initialLoaded, refreshKey, search, status]);

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
            ? (
                <div className="space-y-1">
                  <p>
                    <span className="font-semibold text-gray-700">Loan ID:</span>{" "}
                    {loanToDelete.loanId || "-"}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Client:</span>{" "}
                    {loanToDelete.clientName || "-"}
                  </p>
                </div>
              )
            : "Please confirm loan deletion."
        }
        confirmLabel="Delete Loan"
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) setLoanToDelete(null);
        }}
        loading={deleting}
      />

      <div className="bg-white rounded-sm shadow-sm overflow-hidden">
        <div className="md:hidden divide-y divide-black/10">
          {data.map((loan, index) => (
            <div key={loan._id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">#{index + 1}</p>
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
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusStyle(
                    loan.status,
                  )}`}
                >
                  {loan.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Loan ID: </span>
                  {loan.loanId ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/loans/${loan._id}`)}
                      className="font-semibold hover:text-[var(--primary)] cursor-pointer"
                    >
                      {loan.loanId}
                    </button>
                  ) : (
                    <span className="font-semibold">-</span>
                  )}
                </p>
                <p>
                  <span className="text-gray-500">Principal: </span>
                  <span className="font-semibold">₹{loan.principal.toLocaleString()}</span>
                </p>
                <p>
                  <span className="text-gray-500">Daily Interest: </span>
                  {loan.interestRate}%
                </p>
                <p>
                  <span className="text-gray-500">Total Due: </span>
                  <span className="font-semibold">₹{(loan.totalAmount ?? loan.principal).toLocaleString()}</span>
                </p>
                <p>
                  <span className="text-gray-500">Balance: </span>
                  <span className="font-semibold">₹{(loan.remainingAmount ?? loan.principal).toLocaleString()}</span>
                </p>
                <p className="text-gray-700">
                  <span className="text-gray-500">Pledged: </span>
                  {loan.pledgedProperties?.length ? loan.pledgedProperties.join(", ") : "-"}
                </p>
                <p className="text-gray-600">
                  <span className="text-gray-500">Given Date: </span>
                  {loan.startDate}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/loans/${loan._id}`)}
                  className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                  title="View Loan"
                >
                  <HiEye className="text-lg" />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(loan)}
                  className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                  title="Edit Loan"
                >
                  <HiPencil className="text-lg" />
                </button>
                <button
                  type="button"
                  onClick={() => setLoanToDelete(loan)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                  title="Delete Loan"
                >
                  <HiTrash className="text-lg" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--primary)] text-white uppercase text-xs">
              <tr>
                <th className="p-4 text-left w-[60px]">#</th>
                <th className="p-4 text-left">Loan ID</th>
                <th className="p-4 text-left">Client</th>
                <th className="p-4 text-left">Principal</th>
                <th className="p-4 text-left">Total Due</th>
                <th className="p-4 text-left">Daily Interest</th>
                <th className="p-4 text-left">Pledged</th>
                <th className="p-4 text-left">Given Date</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {data.map((loan, index) => (
                <tr
                  key={loan._id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="p-4 font-semibold text-gray-500">{index + 1}</td>

                  <td className="p-4 text-xs font-semibold text-gray-700">
                    {loan.loanId ? (
                      <button
                        type="button"
                        onClick={() => router.push(`/loans/${loan._id}`)}
                        className="hover:text-[var(--primary)] cursor-pointer"
                      >
                        {loan.loanId}
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>

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

                  <td className="p-4">
                    <p className="font-semibold">
                      ₹{loan.principal.toLocaleString()}
                    </p>
                  </td>

                  <td className="p-4 font-semibold">
                    ₹{(loan.totalAmount ?? loan.principal).toLocaleString()}
                    <p className="mt-1 text-xs text-gray-500">
                      Balance: ₹{(loan.remainingAmount ?? loan.principal).toLocaleString()}
                    </p>
                  </td>

                  <td className="p-4">{loan.interestRate}%</td>

                  <td className="p-4 text-xs text-gray-700">
                    {loan.pledgedProperties?.length
                      ? loan.pledgedProperties.join(", ")
                      : "-"}
                  </td>

                  <td className="p-4 text-xs text-gray-600">
                    {loan.startDate}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                        loan.status,
                      )}`}
                    >
                      {loan.status}
                    </span>
                  </td>

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

                      <button
                        type="button"
                        onClick={() => onEdit(loan)}
                        className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                        title="Edit Loan"
                      >
                        <HiPencil className="text-lg" />
                      </button>

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
      </div>
    </>
  );
}
