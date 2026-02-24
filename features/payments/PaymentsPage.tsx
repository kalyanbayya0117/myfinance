"use client";

import PageHeader from "@/components/ui/PageHeader";

export default function PaymentsPage() {
  return (
    <>
      <PageHeader title="Collections" />

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 max-w-xl">
        <input
          placeholder="Search by Phone Number"
          className="w-full border rounded-lg px-3 py-2"
        />

        <input
          placeholder="Amount Received"
          type="number"
          className="w-full border rounded-lg px-3 py-2"
        />

        <button className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg font-semibold">
          Record Payment
        </button>
      </div>
    </>
  );
}