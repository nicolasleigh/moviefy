import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export interface UserDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  role: "user" | "admin";
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true,
  },
  email: {
    type: String,
    trim: true,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  role: {
    type: String,
    required: true,
    default: "user",
    enum: ["user", "admin"],
  },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (password: string) {
  const result = await bcrypt.compare(password, this.password);
  return result;
};

export default mongoose.model<UserDoc>("User", userSchema);
