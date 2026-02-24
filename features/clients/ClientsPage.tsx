"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import { HiEye, HiPencil, HiTrash } from "react-icons/hi";
import { Client } from "./client.types";
import AddClientDrawer from "./AddClientDrawer";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchClients = async (query = search) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());

      const res = await fetch(`/api/clients?${params.toString()}`);
      if (!res.ok) {
        toast.error("Failed to load clients");
        return;
      }

      const data = await res.json();
      setClients(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients(search);
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  const startCreate = () => {
    setEditingClient(null);
    setDrawerOpen(true);
  };

  const startEdit = (client: Client) => {
    setEditingClient(client);
    setDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${clientToDelete._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Failed to delete client");
        return;
      }

      toast.success("Client deleted");
      setClientToDelete(null);
      await fetchClients();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader title="Clients" actionLabel="+ Add Client" onAction={startCreate} />

      <ConfirmDialog
        open={Boolean(clientToDelete)}
        title="Delete this client?"
        description={clientToDelete ? `Client: ${clientToDelete.name}` : "This action cannot be undone."}
        confirmLabel="Delete Client"
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) setClientToDelete(null);
        }}
        loading={deleting}
      />

      <div className="bg-white rounded-sm shadow-sm p-4 mb-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, phone, or email"
          className="input"
        />
      </div>

      <AddClientDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingClient(null);
        }}
        onSaved={fetchClients}
        editingClient={editingClient}
      />

      {loading ? (
        <div className="bg-white p-6 rounded-xl text-gray-500">Loading clients...</div>
      ) : clients.length === 0 ? (
        <EmptyState text="Client list will appear here." />
      ) : (
        <div className="bg-white rounded-sm shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--primary)] text-white uppercase text-xs">
              <tr>
                <th className="p-4 text-left w-[60px]">#</th>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Phone</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Address</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, index) => (
                <tr key={client._id} className="border-t hover:bg-gray-50 transition">
                  <td className="p-4 font-semibold text-gray-500">{index + 1}</td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => router.push(`/clients/${client._id}`)}
                      className="font-semibold text-left hover:text-[var(--primary)] cursor-pointer"
                    >
                      {client.name}
                    </button>
                  </td>
                  <td className="p-4">{client.phone}</td>
                  <td className="p-4 text-gray-600">{client.email || "-"}</td>
                  <td className="p-4 text-gray-600">{client.address || "-"}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/clients/${client._id}`)}
                        className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                        title="View Client"
                      >
                        <HiEye className="text-lg" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(client)}
                        className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                        title="Edit Client"
                      >
                        <HiPencil className="text-lg" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientToDelete(client)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                        title="Delete Client"
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
      )}
    </>
  );
}