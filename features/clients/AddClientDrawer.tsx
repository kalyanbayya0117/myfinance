"use client";

import { useEffect, useState } from "react";
import { HiX } from "react-icons/hi";
import { toast } from "sonner";
import { Client } from "./client.types";

type ClientForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingClient?: Client | null;
}

const emptyForm: ClientForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

export default function AddClientDrawer({
  open,
  onClose,
  onSaved,
  editingClient,
}: Props) {
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (editingClient) {
      setForm({
        name: editingClient.name,
        phone: editingClient.phone,
        email: editingClient.email ?? "",
        address: editingClient.address ?? "",
      });
      return;
    }

    setForm(emptyForm);
  }, [open, editingClient]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }

    setSubmitting(true);
    try {
      const isEditing = Boolean(editingClient?._id);
      const url = isEditing ? `/api/clients/${editingClient?._id}` : "/api/clients";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
        }),
      });

      if (!res.ok) {
        toast.error(isEditing ? "Failed to update client" : "Failed to add client");
        return;
      }

      toast.success(isEditing ? "Client updated" : "Client added");
      onSaved();
      onClose();
      setForm(emptyForm);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-40 ${open ? "visible" : "invisible"}`}>
      <div onClick={onClose} className="absolute inset-0 bg-black/30" />

      <div className="absolute right-0 top-0 h-full w-[420px] bg-white shadow-xl p-6 overflow-y-auto">
        <div className="flex justify-between mb-6">
          <h3 className="font-bold text-lg">
            {editingClient ? "Edit Client" : "Add Client"}
          </h3>
          <HiX onClick={onClose} className="cursor-pointer" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Client Name"
            className="input"
          />

          <input
            value={form.phone}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phone: event.target.value }))
            }
            placeholder="Phone"
            className="input"
          />

          <input
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            placeholder="Email (optional)"
            className="input"
          />

          <input
            value={form.address}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, address: event.target.value }))
            }
            placeholder="Address (optional)"
            className="input"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[var(--primary)] text-white py-2 rounded-lg cursor-pointer disabled:opacity-60"
          >
            {editingClient ? "Update Client" : "Save Client"}
          </button>
        </form>
      </div>
    </div>
  );
}
