import mongoose, { Schema, model, models } from "mongoose";

type LoanStatus = "active" | "closed";

interface LoanDocument {
  userId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  loanId: string;
  clientName?: string;
  phone?: string;
  pledgedProperties: string[];
  principal: number;
  interestRate: number;
  startDate: string;
  endDate?: string;
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
    loanId: { type: String, required: true, trim: true },
    clientName: { type: String, default: "" },
    phone: { type: String, default: "" },
    pledgedProperties: [{ type: String }],
    principal: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "closed"],
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

  if (!existingLoanModel.schema.path("loanId")) {
    existingLoanModel.schema.add({
      loanId: { type: String, required: true, trim: true },
    });
  }

  if (!existingLoanModel.schema.path("endDate")) {
    existingLoanModel.schema.add({
      endDate: { type: String, default: "" },
    });
  }

  if (!existingLoanModel.schema.path("pledgedProperties")) {
    existingLoanModel.schema.add({
      pledgedProperties: [{ type: String }],
    });
  }
}

LoanSchema.index({ userId: 1, clientId: 1, createdAt: -1 });
LoanSchema.index({ userId: 1, status: 1, createdAt: -1 });
LoanSchema.index({ userId: 1, createdAt: -1 });
LoanSchema.index({ userId: 1, loanId: 1 }, { unique: true });

export const Loan = existingLoanModel || model<LoanDocument>("Loan", LoanSchema);
