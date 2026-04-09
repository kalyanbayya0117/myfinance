import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import ProtectedStatCard from "@/components/ui/ProtectedStatCard";
import { getAuthFromServerCookie } from "@/lib/auth";
import { getLoansForUser } from "@/lib/server-data";
import { redirect } from "next/navigation";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value || 0));
}

export default async function Page() {
  const auth = await getAuthFromServerCookie();
  if (!auth?.userId) {
    redirect("/login");
  }

  const loans = await getLoansForUser({ userId: auth.userId });

  const totalActiveLent = loans
    .filter((loan) => loan.status === "active")
    .reduce((sum, loan) => sum + (Number(loan.principal) || 0), 0);
  const activeLoans = loans.filter((loan) => loan.status === "active").length;
  const closedLoans = loans.filter((loan) => loan.status === "closed").length;
  const totalCollected = loans.reduce((sum, loan) => sum + (Number(loan.totalPaid) || 0), 0);
  const totalInterestCollected = loans.reduce((sum, loan) => {
    const principal = Number(loan.principal) || 0;
    const totalPaid = Number(loan.totalPaid) || 0;
    return sum + Math.max(totalPaid - principal, 0);
  }, 0);
  const recentLoans = loans.slice(0, 5);

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <ProtectedStatCard label="Total Active Lent" value={formatCurrency(totalActiveLent)} />
        <StatCard label="Total Collected" value={formatCurrency(totalCollected)} />
        <StatCard
          label="Total Interest Collected"
          value={formatCurrency(totalInterestCollected)}
        />
        <StatCard label="Active Loans" value={activeLoans} />
        <StatCard label="Closed Loans" value={closedLoans} />
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-black/10 flex items-center justify-between">
          <h3 className="font-bold text-lg">Recent Loans</h3>
          <Link href="/loans" className="text-sm font-semibold text-[var(--primary)] hover:underline">
            View all
          </Link>
        </div>

        {recentLoans.length === 0 ? (
          <div className="p-5 text-sm text-gray-500">No loans yet. Add your first loan to see dashboard activity.</div>
        ) : (
          <div className="divide-y divide-black/10">
            {recentLoans.map((loan) => (
              <div key={loan._id} className="p-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-black">{loan.clientName || "Unknown Client"}</p>
                  <p className="text-sm text-gray-500">{loan.phone || "-"}</p>
                </div>

                <div className="text-sm md:text-right">
                  <p className="font-semibold">{formatCurrency(Number(loan.principal) || 0)}</p>
                  <p className="text-gray-500">
                    {loan.status === "closed" ? "Closed" : "Active"} • Remaining {formatCurrency(Number(loan.remainingAmount) || 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}