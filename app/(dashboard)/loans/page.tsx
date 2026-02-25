import { LoansPage } from "@/features/loans";
import { getAuthFromServerCookie } from "@/lib/auth";
import { getLoansForUser } from "@/lib/server-data";
import { redirect } from "next/navigation";

export default async function Page() {
  const auth = await getAuthFromServerCookie();
  if (!auth?.userId) {
    redirect("/login");
  }

  const initialLoans = await getLoansForUser({ userId: auth.userId });

  return <LoansPage initialLoans={initialLoans} initialLoaded />;
}