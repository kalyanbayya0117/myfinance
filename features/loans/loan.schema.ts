import { z } from "zod";

export const loanSchema = z.object({
  loanId: z.string().min(1, "Loan ID required").max(60, "Loan ID is too long"),
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
  status: z.enum(["active", "closed"]).default("active"),
  startDate: z.string(),
  endDate: z.string().optional().default(""),
}).superRefine((data, context) => {
  if (data.status === "closed") {
    if (!data.endDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date required for closed loan",
      });
      return;
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date cannot be before given date",
      });
    }
  }
});

export type LoanFormInput = z.input<typeof loanSchema>;
export type LoanFormData = z.output<typeof loanSchema>;