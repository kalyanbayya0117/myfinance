import StatCard from "@/components/ui/StatCard";

export default function Page() {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Lent" value="₹12,40,000" />
        <StatCard label="Active Loans" value="48" />
        <StatCard label="Closed Loans" value="6" />
        <StatCard label="Collected This Month" value="₹2,10,000" />
      </div>
    </section>
  );
}