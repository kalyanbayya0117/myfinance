import mongoose, { Schema, model, models } from "mongoose";

interface PaymentDocument {
  userId: mongoose.Types.ObjectId;
  loanId: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
}

const PaymentSchema = new Schema<PaymentDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
    },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

PaymentSchema.index({ userId: 1, loanId: 1, date: -1 });

const existingPaymentModel = models.Payment as mongoose.Model<PaymentDocument> | undefined;

if (existingPaymentModel) {
  if (!existingPaymentModel.schema.path("userId")) {
    existingPaymentModel.schema.add({
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
    });
  }
}

export const Payment = existingPaymentModel || model<PaymentDocument>("Payment", PaymentSchema);
