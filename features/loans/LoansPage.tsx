"use client";

import { useState } from "react";
import LoansTable from "./LoansTable";
import AddLoanDrawer from "./AddLoanDrawer";
import PageHeader from "@/components/ui/PageHeader";
import { Loan } from "./loan.types";

interface LoansPageProps {
  initialLoans?: Loan[];
  initialLoaded?: boolean;
}

export default function LoansPage({
  initialLoans = [],
  initialLoaded = false,
}: LoansPageProps) {
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

  const handleSaved = () => {
    setRefreshKey((value) => value + 1);
  };

  return (
    <>
      <PageHeader
        title="Loans"
        actionLabel="+ Add Loan"
        onAction={() => {
          setEditingLoan(null);
          setOpen(true);
        }}
      />

      <div className="bg-white rounded-sm shadow-sm p-4 mb-4 grid gap-3 sm:grid-cols-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by client name or phone"
          className="input"
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="input"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <LoansTable
        initialData={initialLoans}
        initialLoaded={initialLoaded}
        refreshKey={refreshKey}
        search={search}
        status={status}
        onEdit={(loan) => {
          setEditingLoan(loan);
          setOpen(true);
        }}
        onDeleted={handleSaved}
      />

      <AddLoanDrawer
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingLoan(null);
        }}
        onSaved={handleSaved}
        mode={editingLoan ? "edit" : "create"}
        loan={editingLoan}
      />
    </>
  );
}
