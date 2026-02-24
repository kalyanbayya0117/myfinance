import { z } from "zod";

export const loanSchema = z.object({
  clientName: z.string().min(2, "Client name required"),
  phone: z.string().min(10, "Valid phone required"),
  pledgedPropertiesInput: z
    .string()
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  principal: z.coerce.number().positive(),
  interestRate: z.coerce.number().positive(),
  startDate: z.string(),
  endDate: z.string(),
});

export type LoanFormInput = z.input<typeof loanSchema>;
export type LoanFormData = z.output<typeof loanSchema>;