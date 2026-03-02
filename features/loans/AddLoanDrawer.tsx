"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loanSchema, LoanFormData, LoanFormInput } from "./loan.schema";
import { toast } from "sonner";
import { HiX } from "react-icons/hi";
import { Client } from "../clients/client.types";
import { Loan } from "./loan.types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  mode?: "create" | "edit";
  loan?: Loan | null;
}

export default function AddLoanDrawer({
  open,
  onClose,
  onSaved,
  mode = "create",
  loan = null,
}: Props) {
  const [suggestions, setSuggestions] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [forceNewClient, setForceNewClient] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isClientInputFocused, setIsClientInputFocused] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoanFormInput, unknown, LoanFormData>({
    resolver: zodResolver(loanSchema),
  });

  const clientNameField = register("clientName");
  const clientInput = watch("clientName") ?? "";
  const showSuggestionPanel =
    open &&
    isClientInputFocused &&
    clientInput.trim().length > 0 &&
    (!selectedClient || clientInput.trim() !== selectedClient.name);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && loan) {
      const pledgedText = Array.isArray(loan.pledgedProperties)
        ? loan.pledgedProperties.join(", ")
        : "";

      reset({
        loanId: loan.loanId ?? "",
        clientName: loan.clientName ?? "",
        phone: loan.phone ?? "",
        pledgedPropertiesInput: pledgedText,
        principal: loan.principal,
        interestRate: loan.interestRate,
        startDate: loan.startDate,
      });

      setSelectedClient({
        _id: loan.clientId,
        name: loan.clientName,
        phone: loan.phone,
      });
      setForceNewClient(false);
      return;
    }

    reset({
      loanId: "",
      clientName: "",
      phone: "",
      pledgedPropertiesInput: "",
      principal: "" as unknown as number,
      interestRate: "" as unknown as number,
      startDate: "",
    });
    setSelectedClient(null);
    setForceNewClient(false);
    setSuggestions([]);
  }, [open, mode, loan, reset]);

  useEffect(() => {
    if (!open) return;

    const query = clientInput.trim();
    if (!query) {
      setSuggestions([]);
      return;
    }

    if (selectedClient && query === selectedClient.name) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/clients?search=${encodeURIComponent(query)}`);
        if (!res.ok) return;

        const data = await res.json();
        setSuggestions(data);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [clientInput, selectedClient, open]);

  useEffect(() => {
    if (!open) return;
    if (!selectedClient) return;

    if (clientInput.trim() !== selectedClient.name) {
      setSelectedClient(null);
    }
  }, [clientInput, selectedClient, open]);

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setForceNewClient(false);
    setValue("clientName", client.name, { shouldValidate: true });
    setValue("phone", client.phone, { shouldValidate: true });
    setSuggestions([]);
  };

  const chooseNewClient = () => {
    setSelectedClient(null);
    setForceNewClient(true);
    setSuggestions([]);
  };

  const onSubmit = async (data: LoanFormData) => {
    setSubmitting(true);
    const isEdit = mode === "edit" && loan?._id;

    try {
      const res = await fetch(isEdit ? `/api/loans/${loan._id}` : "/api/loans", {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          pledgedProperties: data.pledgedPropertiesInput,
          clientId: selectedClient?._id,
          forceNewClient,
        }),
      });

      if (!res.ok) {
        let message = isEdit ? "Failed to update loan" : "Failed to add loan";

        try {
          const raw = await res.text();
          if (raw.trim()) {
            const parsed = JSON.parse(raw) as { message?: string };
            if (parsed?.message) {
              message = parsed.message;
            }
          }
        } catch {
        }

        toast.error(message);
        return;
      }

      toast.success(isEdit ? "Loan Updated" : "Loan Added");
      reset();
      setSelectedClient(null);
      setForceNewClient(false);
      setSuggestions([]);
      onSaved();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-40 ${open ? "visible" : "invisible"}`}>
      <div onClick={() => !submitting && onClose()} className="absolute inset-0 bg-black/30" />

      <div
        className="absolute right-0 top-0 h-full w-full sm:w-[440px] bg-white shadow-xl flex flex-col"
      >
        <div className="flex items-start justify-between border-b border-black/10 p-5">
          <div>
            <h3 className="font-bold text-lg">{mode === "edit" ? "Edit Loan" : "Add Loan"}</h3>
            <p className="text-xs text-gray-500 mt-1">Fill loan details and assign or create a client.</p>
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

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Loan ID
            </label>
            <input {...register("loanId")} placeholder="Enter Loan ID" className="input" />
            {errors.loanId?.message ? (
              <p className="text-red-500 text-sm">{errors.loanId.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Client Name
            </label>
            <div className="relative">
              <input
                {...clientNameField}
                placeholder="Client Name or Phone"
                className="input"
                autoComplete="off"
                onFocus={() => setIsClientInputFocused(true)}
                onBlur={(event) => {
                  clientNameField.onBlur(event);
                  setTimeout(() => setIsClientInputFocused(false), 120);
                }}
              />

              {showSuggestionPanel ? (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-lg border border-black/10 bg-white shadow-sm max-h-52 overflow-y-auto">
                  {loadingSuggestions ? (
                    <p className="px-3 py-2 text-sm text-gray-500">Searching clients...</p>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((client) => (
                      <button
                        key={client._id}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectClient(client)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50"
                      >
                        <p className="text-sm font-semibold">{client.name}</p>
                        <p className="text-xs text-gray-500">{client.phone}</p>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-sm text-gray-500">No matching client found.</p>
                  )}

                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={chooseNewClient}
                    className="w-full border-t border-black/10 px-3 py-2 text-left text-sm font-semibold text-[var(--primary)] hover:bg-gray-50"
                  >
                    Use as new client
                  </button>
                </div>
              ) : null}
            </div>
            {errors.clientName?.message ? (
              <p className="text-red-500 text-sm">{errors.clientName.message}</p>
            ) : null}
          </div>

          {selectedClient ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              Existing client selected: <span className="font-semibold">{selectedClient.name}</span>
            </div>
          ) : forceNewClient ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              A new client will be created from this form.
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Phone
            </label>
            <input {...register("phone")} placeholder="Phone" className="input" />
            {errors.phone?.message ? (
              <p className="text-red-500 text-sm">{errors.phone.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Pledged Properties
            </label>
            <input
              {...register("pledgedPropertiesInput")}
              placeholder="Optional, comma separated"
              className="input"
            />
            {errors.pledgedPropertiesInput?.message ? (
              <p className="text-red-500 text-sm">{errors.pledgedPropertiesInput.message as string}</p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Principal Amount
              </label>
              <input
                {...register("principal")}
                type="number"
                placeholder="Amount"
                className="input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Daily Interest %
              </label>
              <input
                {...register("interestRate")}
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                placeholder="Interest %"
                className="input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Given Date
            </label>
            <input {...register("startDate")} type="date" className="input" />
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
                className="w-1/2 bg-[var(--primary)] text-white py-2 rounded-lg cursor-pointer disabled:opacity-60"
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? mode === "edit"
                    ? "Updating..."
                    : "Saving..."
                  : mode === "edit"
                    ? "Update Loan"
                    : "Save Loan"}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
