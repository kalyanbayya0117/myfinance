import mongoose, { Schema, model, models } from "mongoose";

interface ClientDocument {
  userId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  address: string;
}

const ClientSchema = new Schema<ClientDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

ClientSchema.index({ userId: 1, createdAt: -1 });
ClientSchema.index({ userId: 1, phone: 1 });
ClientSchema.index({ userId: 1, name: 1 });

const existingClientModel = models.Client as mongoose.Model<ClientDocument> | undefined;

if (existingClientModel) {
  if (!existingClientModel.schema.path("userId")) {
    existingClientModel.schema.add({
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
    });
  }
}

export const Client = existingClientModel || model<ClientDocument>("Client", ClientSchema);
