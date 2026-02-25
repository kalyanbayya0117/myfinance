import { ClientsPage } from "@/features/clients";
import { getAuthFromServerCookie } from "@/lib/auth";
import { getClientsForUser } from "@/lib/server-data";
import { redirect } from "next/navigation";

export default async function Page() {
  const auth = await getAuthFromServerCookie();
  if (!auth?.userId) {
    redirect("/login");
  }

  const initialClients = await getClientsForUser(auth.userId);

  return <ClientsPage initialClients={initialClients} initialLoaded />;
}