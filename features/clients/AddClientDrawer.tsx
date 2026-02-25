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
  const [errors, setErrors] = useState<Partial<Record<keyof ClientForm, string>>>({});

  useEffect(() => {
    if (!open) return;

    if (editingClient) {
      setForm({
        name: editingClient.name,
        phone: editingClient.phone,
        email: editingClient.email ?? "",
        address: editingClient.address ?? "",
      });
      setErrors({});
      return;
    }

    setForm(emptyForm);
    setErrors({});
  }, [open, editingClient]);

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof ClientForm, string>> = {};

    if (!form.name.trim()) {
      nextErrors.name = "Client name is required";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Phone number is required";
    }

    if (form.email.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(form.email.trim())) {
        nextErrors.email = "Enter a valid email address";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error("Please correct the highlighted fields");
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
      <div onClick={() => !submitting && onClose()} className="absolute inset-0 bg-black/30" />

      <div className="absolute right-0 top-0 h-full w-full sm:w-[440px] bg-white shadow-xl flex flex-col">
        <div className="flex items-start justify-between border-b border-black/10 p-5">
          <div>
            <h3 className="font-bold text-lg">
              {editingClient ? "Edit Client" : "Add Client"}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Add client details to create and manage loan records.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-60 cursor-pointer"
            aria-label="Close"
          >
            <HiX className="text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Client Name
            </label>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Client Name"
              className="input"
            />
            {errors.name ? <p className="text-red-500 text-sm">{errors.name}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Phone
            </label>
            <input
              value={form.phone}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, phone: event.target.value }))
              }
              placeholder="Phone"
              className="input"
            />
            {errors.phone ? <p className="text-red-500 text-sm">{errors.phone}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Email (Optional)
            </label>
            <input
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="Email"
              className="input"
            />
            {errors.email ? <p className="text-red-500 text-sm">{errors.email}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Address (Optional)
            </label>
            <textarea
              value={form.address}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, address: event.target.value }))
              }
              placeholder="Address"
              rows={3}
              className="input resize-none"
            />
          </div>

          <div className="sticky bottom-0 bg-white pt-2">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="w-1/2 border border-black/10 text-gray-700 py-2 rounded-lg cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-1/2 bg-[var(--primary)] text-white py-2 rounded-lg cursor-pointer disabled:opacity-60"
              >
                {submitting
                  ? editingClient
                    ? "Updating..."
                    : "Saving..."
                  : editingClient
                    ? "Update Client"
                    : "Save Client"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
