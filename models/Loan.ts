import mongoose, { Schema, model, models } from "mongoose";

type LoanStatus = "active" | "closed" | "overdue";

interface LoanDocument {
  userId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  clientName?: string;
  phone?: string;
  pledgedProperties: string[];
  principal: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  status: LoanStatus;
}

const LoanSchema = new Schema<LoanDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    clientName: { type: String, default: "" },
    phone: { type: String, default: "" },
    pledgedProperties: [{ type: String }],
    principal: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "closed", "overdue"],
      default: "active",
    },
  },
  { timestamps: true },
);

const existingLoanModel = models.Loan as mongoose.Model<LoanDocument> | undefined;

if (existingLoanModel) {
  if (!existingLoanModel.schema.path("clientId")) {
    existingLoanModel.schema.add({
      clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        required: true,
      },
    });
  }

  if (!existingLoanModel.schema.path("userId")) {
    existingLoanModel.schema.add({
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    });
  }

  if (!existingLoanModel.schema.path("pledgedProperties")) {
    existingLoanModel.schema.add({
      pledgedProperties: [{ type: String }],
    });
  }
}

LoanSchema.index({ userId: 1, clientId: 1, createdAt: -1 });
LoanSchema.index({ userId: 1, status: 1, endDate: 1 });

export const Loan = existingLoanModel || model<LoanDocument>("Loan", LoanSchema);
