import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export interface EmailVerificationTokenDoc {
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  token: string;
  createdAt: Date;
  compareToken(token: string): Promise<boolean>;
}

const emailVerificationTokenSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    expires: 3600, // 1 hour
    default: Date.now,
  },
});

emailVerificationTokenSchema.pre("save", async function (next) {
  if (this.isModified("token")) {
    this.token = await bcrypt.hash(this.token, 10);
  }
  next();
});

emailVerificationTokenSchema.methods.compareToken = async function (token: string) {
  const result = await bcrypt.compare(token, this.token);
  return result;
};

export default mongoose.model<EmailVerificationTokenDoc>(
  "EmailVerificationToken",
  emailVerificationTokenSchema
);
