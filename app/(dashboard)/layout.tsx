import DashboardShell from "@/components/layout/DashboardShell";
import { redirect } from "next/navigation";
import { getAuthFromServerCookie } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthFromServerCookie();

  if (!auth?.userId) {
    redirect("/login");
  }

  return <DashboardShell>{children}</DashboardShell>;
}