"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loan } from "../loans/loan.types";
import { Client } from "./client.types";
import AddLoanDrawer from "../loans/AddLoanDrawer";
import AddClientDrawer from "./AddClientDrawer";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import { HiEye, HiPencil, HiTrash } from "react-icons/hi";
import {
  HiCheckCircle,
  HiClipboardList,
  HiMail,
  HiPhone,
  HiUser,
  HiLocationMarker,
} from "react-icons/hi";

type ClientDetailsResponse = {
  client: Client;
  loans: Loan[];
};

export default function ClientDetailsPage({ id }: { id: string }) {
  const [data, setData] = useState<ClientDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientDrawerOpen, setClientDrawerOpen] = useState(false);
  const [loanDrawerOpen, setLoanDrawerOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [deletingLoan, setDeletingLoan] = useState(false);
  const router = useRouter();

  const getStatusStyle = (status: Loan["status"]) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "closed":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) {
        setData(null);
        return;
      }

      const result = await res.json();
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  const loans = data?.loans ?? [];
  const activeLoans = useMemo(
    () => loans.filter((loan) => loan.status !== "closed"),
    [loans],
  );
  const completedLoans = useMemo(
    () => loans.filter((loan) => loan.status === "closed"),
    [loans],
  );

  const handleDeleteLoan = async () => {
    if (!loanToDelete) return;

    setDeletingLoan(true);
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
      await fetchClientDetails();
    } finally {
      setDeletingLoan(false);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Loading client details...</p>;
  }

  if (!data?.client) {
    return <p className="text-red-500">Client not found.</p>;
  }

  return (
    <section className="space-y-6">
      <ConfirmDialog
        open={Boolean(loanToDelete)}
        title="Delete this loan?"
        description={
          loanToDelete
            ? `Loan amount: ₹${loanToDelete.principal.toLocaleString()}`
            : "This action cannot be undone."
        }
        confirmLabel="Delete Loan"
        onConfirm={handleDeleteLoan}
        onCancel={() => {
          if (!deletingLoan) setLoanToDelete(null);
        }}
        loading={deletingLoan}
      />

      <div className="bg-white rounded-sm p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold break-words inline-flex items-center gap-2">
              {data.client.name}
            </h2>

            <div className="mt-3 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
              <p className="rounded-lg bg-gray-50 px-3 py-2 border border-black/5 inline-flex items-center gap-2">
                <HiPhone className="text-[var(--primary)]" />
                <span>
                  <span className="text-gray-500">Phone:</span>{" "}
                  {data.client.phone}
                </span>
              </p>
              <p className="rounded-lg bg-gray-50 px-3 py-2 border border-black/5 break-all inline-flex items-center gap-2">
                <HiMail className="text-[var(--primary)]" />
                <span>
                  <span className="text-gray-500">Email:</span>{" "}
                  {data.client.email || "-"}
                </span>
              </p>
              <p className="rounded-lg bg-gray-50 px-3 py-2 border border-black/5 sm:col-span-2 break-words inline-flex items-center gap-2">
                <HiLocationMarker className="text-[var(--primary)]" />
                <span>
                  <span className="text-gray-500">Address:</span>{" "}
                  {data.client.address || "-"}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setClientDrawerOpen(true)}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold hover:bg-gray-50 cursor-pointer"
          >
            Edit Client
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-sm p-5 shadow-sm">
          <p className="text-sm text-gray-500 inline-flex items-center gap-1">
            <HiClipboardList /> Total Loans
          </p>
          <p className="text-2xl font-bold mt-1">{loans.length}</p>
        </div>

        <div className="bg-white rounded-sm p-5 shadow-sm">
          <p className="text-sm text-gray-500 inline-flex items-center gap-1">
            <HiClipboardList /> Active Loans
          </p>
          <p className="text-2xl font-bold mt-1">{activeLoans.length}</p>
        </div>

        <div className="bg-white rounded-sm p-5 shadow-sm">
          <p className="text-sm text-gray-500 inline-flex items-center gap-1">
            <HiCheckCircle /> Completed Loans
          </p>
          <p className="text-2xl font-bold mt-1">{completedLoans.length}</p>
        </div>

      </div>

      <div className="bg-white rounded-sm shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-black/10 flex items-center justify-between gap-3">
          <h3 className="font-semibold">Loan History</h3>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
            {loans.length} loans
          </span>
        </div>

        {loans.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No loans found for this client.
          </div>
        ) : (
          <div>
            <div className="md:hidden divide-y divide-black/10">
              {loans.map((loan) => (
                <div key={loan._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">₹{loan.principal.toLocaleString()}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                        loan.status,
                      )}`}
                    >
                      {loan.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-500">Interest: </span>
                      {loan.interestRate}%
                    </p>
                    <p className="text-gray-600">
                      <span className="text-gray-500">Pledged: </span>
                      {loan.pledgedProperties?.length ? loan.pledgedProperties.join(", ") : "-"}
                    </p>
                    <p className="text-gray-600">
                      <span className="text-gray-500">Given Date: </span>
                      {loan.startDate}
                    </p>
                    <p>
                      <span className="text-gray-500">Total Due: </span>
                      ₹{(loan.totalAmount ?? loan.principal).toLocaleString()}
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
                      onClick={() => {
                        setEditingLoan(loan);
                        setLoanDrawerOpen(true);
                      }}
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
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-[var(--primary)] text-white uppercase text-xs">
                  <tr>
                    <th className="p-4 text-left">Principal</th>
                    <th className="p-4 text-left">Total Due</th>
                    <th className="p-4 text-left">Interest</th>
                    <th className="p-4 text-left">Pledged</th>
                    <th className="p-4 text-left">Given Date</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => (
                    <tr
                      key={loan._id}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="p-4 font-semibold">
                        ₹{loan.principal.toLocaleString()}
                      </td>
                      <td className="p-4 font-semibold">
                        ₹{(loan.totalAmount ?? loan.principal).toLocaleString()}
                      </td>
                      <td className="p-4">{loan.interestRate}%</td>
                      <td className="p-4 text-xs text-gray-600 max-w-[260px]">
                        {loan.pledgedProperties?.length
                          ? loan.pledgedProperties.join(", ")
                          : "-"}
                      </td>
                      <td className="p-4 text-xs text-gray-600 whitespace-nowrap">
                        {loan.startDate}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
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
                            onClick={() => {
                              setEditingLoan(loan);
                              setLoanDrawerOpen(true);
                            }}
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
        )}
      </div>

      <AddLoanDrawer
        open={loanDrawerOpen}
        onClose={() => {
          setLoanDrawerOpen(false);
          setEditingLoan(null);
        }}
        onSaved={fetchClientDetails}
        mode={editingLoan ? "edit" : "create"}
        loan={editingLoan}
      />

      <AddClientDrawer
        open={clientDrawerOpen}
        onClose={() => setClientDrawerOpen(false)}
        onSaved={fetchClientDetails}
        editingClient={data.client}
      />
    </section>
  );
}
