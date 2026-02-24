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

  const clientInput = watch("clientName") ?? "";

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && loan) {
      const pledgedText = Array.isArray(loan.pledgedProperties)
        ? loan.pledgedProperties.join(", ")
        : "";

      reset({
        clientName: loan.clientName ?? "",
        phone: loan.phone ?? "",
        pledgedPropertiesInput: pledgedText,
        principal: loan.principal,
        interestRate: loan.interestRate,
        startDate: loan.startDate,
        endDate: loan.endDate,
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
      clientName: "",
      phone: "",
      pledgedPropertiesInput: "",
      principal: "" as unknown as number,
      interestRate: "" as unknown as number,
      startDate: "",
      endDate: "",
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
    const isEdit = mode === "edit" && loan?._id;

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
    setSuggestions([]);
    onSaved();
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-40 ${open ? "visible" : "invisible"}`}>
      <div onClick={onClose} className="absolute inset-0 bg-black/30" />

      <div
        className={`absolute right-0 top-0 h-full w-[420px] bg-white shadow-xl p-6 overflow-y-auto`}
      >
        <div className="flex justify-between mb-6">
          <h3 className="font-bold text-lg">{mode === "edit" ? "Edit Loan" : "Add Loan"}</h3>
          <HiX onClick={onClose} className="cursor-pointer" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <input
              {...register("clientName")}
              placeholder="Client Name or Phone"
              className="input"
              autoComplete="off"
            />

            {clientInput.trim().length > 0 && (suggestions.length > 0 || loadingSuggestions) && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-lg border border-black/10 bg-white shadow-sm max-h-44 overflow-y-auto">
                {loadingSuggestions ? (
                  <p className="px-3 py-2 text-sm text-gray-500">Searching clients...</p>
                ) : (
                  <>
                    {suggestions.map((client) => (
                      <button
                        key={client._id}
                        type="button"
                        onClick={() => selectClient(client)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50"
                      >
                        <p className="text-sm font-semibold">{client.name}</p>
                        <p className="text-xs text-gray-500">{client.phone}</p>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={chooseNewClient}
                      className="w-full border-t border-black/10 px-3 py-2 text-left text-sm font-semibold text-[var(--primary)] hover:bg-gray-50"
                    >
                      Use as new client
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <p className="text-red-500 text-sm">{errors.clientName?.message}</p>

          <input {...register("phone")} placeholder="Phone" className="input" />
          <p className="text-red-500 text-sm">{errors.phone?.message}</p>

          <input
            {...register("pledgedPropertiesInput")}
            placeholder="Pledged Property (optional, comma separated)"
            className="input"
          />
          <p className="text-red-500 text-sm">{errors.pledgedPropertiesInput?.message}</p>

          <input
            {...register("principal")}
            type="number"
            placeholder="Amount"
            className="input"
          />
          <input
            {...register("interestRate")}
            type="number"
            placeholder="Interest %"
            className="input"
          />

          <input {...register("startDate")} type="date" className="input" />
          <input {...register("endDate")} type="date" className="input" />

          <button
            className="w-full bg-[var(--primary)] text-white py-2 rounded-lg cursor-pointer"
            type="submit"
          >
            {mode === "edit" ? "Update Loan" : "Save Loan"}
          </button>
        </form>
      </div>
    </div>
  );
}
